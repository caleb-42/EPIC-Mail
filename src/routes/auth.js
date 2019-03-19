import joi from 'joi';
import express from 'express';
import bcrypt from 'bcrypt';
import helper from '../utilities';
import dbHandler from '../database/dbHandler';

const router = express.Router();

const validate = (user) => {
  const schema = {
    /* id: joi.number().equal(0), */
    email: joi.string().email().required(),
    password: joi.string().min(5).max(255).required(),
  };
  return joi.validate(user, schema);
};

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    return res.send({
      status: 400,
      error: error.details[0].message,
    });
  }
  const user = dbHandler.find('users', req.body, 'email');
  if (!user) {
    return res.status(400).send({
      status: 400,
      error: 'Invalid email or password',
    });
  }
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  const token = validPassword ? helper.generateJWT(user) : false;
  if (!token) {
    return res.status(400).send({
      status: 400,
      error: 'Invalid email or password',
    });
  }
  return res.status(200).send({
    status: 200,
    data: [
      {
        token,
        firstName: user.firstName,
      },
    ],
  });
});

export default router;
