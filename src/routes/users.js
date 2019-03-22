import joi from 'joi';
import express from 'express';
import dbHandler from '../database/dbHandler';
import auth from '../middleware/auth';

const router = express.Router();

const validate = (user) => {
  const schema = {
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    email: joi.string().email().trim().required(),
    phoneNumber: joi.number().required(),
    password: joi.string().trim().required(),
    confirmPassword: joi.any().valid(joi.ref('password')).required().options({ language: { any: { allowOnly: 'must match with password' } } }),
  };
  return joi.validate(user, schema);
};

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send({
      status: 400,
      error: error.details[0].message,
    });
  }
  const userPresent = await dbHandler.find('users', req.body, 'email');
  if (userPresent) {
    return res.status(400).send({
      status: 400,
      error: 'User already registered',
    });
  }
  const token = await dbHandler.createUser(req.body);
  return res.status(201).send({
    status: 201,
    data: [{ token }],
  });
});

router.get('/contacts', auth, async (req, res) => {
  const users = await dbHandler.getUsers(req.user.id);
  return res.status(200).send({
    status: 200,
    data: users,
  });
});

module.exports = router;
