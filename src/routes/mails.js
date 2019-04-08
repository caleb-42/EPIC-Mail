import express from 'express';
import joi from 'joi';
import auth from '../middleware/auth';
import dbHandler from '../database/dbHandler';

const router = express.Router();

const validate = (msg) => {
  const schema = {
    email: joi.string().email().trim().required(),
    subject: joi.string().trim().max(35).required(),
    message: joi.string().trim().required(),
    parentMessageId: joi.number().optional(),
  };
  return joi.validate(msg, schema);
};

const updateValidate = (msg) => {
  const schema = {
    /* email: joi.string().email().trim().allow(null, ''), */
    email: joi.string().email().trim().required(),
    subject: joi.string().trim().max(35).required(),
    message: joi.string().trim().required(),
  };
  return joi.validate(msg, schema);
};

const draftValidate = (msg) => {
  const schema = {
    /* email: joi.string().email().trim().allow(null, ''), */
    email: joi.string().email().trim().required(),
    subject: joi.string().trim().max(35).optional(),
    message: joi.string().trim().required(),
    parentMessageId: joi.number().optional(),
  };
  return joi.validate(msg, schema);
};

router.get('/', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getInboxMessages(id);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});
router.get('/all', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getMessages(id);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.get('/unread', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getInboxMessages(id, 'unread');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.get('/read', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getInboxMessages(id, 'read');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.get('/sent', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getOutboxMessages(id, 'sent');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.get('/draft', auth, async (req, res) => {
  const { id } = req.user;
  const msg = await dbHandler.getOutboxMessages(id, 'draft');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.get('/:id', auth, async (req, res) => {
  const msgId = req.params.id;
  if (isNaN(msgId)) {
    return res.status(400).send({
      status: 400,
      error: 'param IDs must be numbers',
    });
  }
  const findMsg = await dbHandler.find('messages', { id: msgId }, 'id');
  if (findMsg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  if (!findMsg) {
    return res.status(404).send({
      status: 404,
      error: 'message ID does not exist',
    });
  }
  if (findMsg.receiverid !== req.user.id && findMsg.senderid !== req.user.id) {
    return res.status(401).send({
      status: 401,
      error: 'you are not authorized to get this message',
    });
  }
  const msg = await dbHandler.getMessageById(findMsg, req.user.id);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

router.post('/', auth, async (req, res) => {
  const { id } = req.user;
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send({
      status: 400,
      error: error.details[0].message,
    });
  }
  const user = await dbHandler.find('users', req.body, 'email');
  if (user === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  if (!user) {
    return res.status(404).send({
      status: 404,
      error: 'receiver not found',
    });
  }
  if (id === Number(user.id)) {
    return res.status(400).send({
      status: 400,
      error: 'user cannot send message to self',
    });
  }
  req.body.receiverId = user.id;
  req.body.senderId = id;
  const msg = await dbHandler.sendMessage(req.body);
  /* console.log(msg); */
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(201).send({
    status: 201,
    data: msg,
  });
});

router.post('/save', auth, async (req, res) => {
  const { id } = req.user;
  const { error } = draftValidate(req.body);
  if (error) {
    return res.status(400).send({
      status: 400,
      error: error.details[0].message,
    });
  }
  if (req.body.email) {
    const user = await dbHandler.find('users', req.body, 'email');
    if (user === 500) {
      return res.status(500).send({
        status: 500,
        error: 'Internal server error',
      });
    }
    if (!user) {
      return res.status(404).send({
        status: 404,
        error: 'receiver not found',
      });
    }
    if (id === Number(user.id)) {
      return res.status(400).send({
        status: 400,
        error: 'user cannot send message to self',
      });
    }
    req.body.receiverId = user.id;
  }
  req.body.senderId = id;
  const msg = await dbHandler.saveMessage(req.body);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(201).send({
    status: 201,
    data: msg,
  });
});

router.post('/:id', auth, async (req, res) => {
  const { id } = req.params;
  /* console.log(id); */
  if (isNaN(id)) {
    return res.status(400).send({
      status: 400,
      error: 'param IDs must be numbers',
    });
  }
  const draftMsg = await dbHandler.find('messages', { id }, 'id');
  if (draftMsg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  if (draftMsg.senderid !== req.user.id) {
    return res.status(401).send({
      status: 401,
      error: 'you are not authorized to send this message',
    });
  }
  if (!draftMsg.receiverid) {
    return res.status(400).send({
      status: 400,
      error: 'message must have receiver',
    });
  }
  const msg = await dbHandler.sendDraftMessage(draftMsg);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(201).send({
    status: 201,
    data: msg,
  });
});

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).send({
      status: 400,
      error: 'param IDs must be numbers',
    });
  }
  const { error } = updateValidate(req.body);
  if (error) {
    return res.status(400).send({
      status: 400,
      error: error.details[0].message,
    });
  }
  const msg = await dbHandler.find('messages', { id }, 'id');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  if (!msg) {
    return res.status(404).send({
      status: 404,
      error: 'message ID does not exist',
    });
  }
  if (msg.senderid !== req.user.id && msg.receiverid !== req.user.id) {
    return res.status(401).send({
      status: 401,
      error: 'you are not authorized to update this message',
    });
  }
  const updateMsg = await dbHandler.updateMessageById(req.body, msg);
  if (updateMsg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: updateMsg,
  });
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).send({
      status: 400,
      error: 'param IDs must be numbers',
    });
  }
  let msg = await dbHandler.find('messages', { id }, 'id');
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  if (!msg) {
    return res.status(404).send({
      status: 404,
      error: 'message ID does not exist',
    });
  }
  if (msg.receiverid !== req.user.id && msg.senderid !== req.user.id) {
    return res.status(401).send({
      status: 401,
      error: 'you are not authorized to get this message',
    });
  }
  msg = await dbHandler.deleteMessage(msg, req.user);
  if (msg === 500) {
    return res.status(500).send({
      status: 500,
      error: 'Internal server error',
    });
  }
  return res.status(200).send({
    status: 200,
    data: msg,
  });
});

export default router;
