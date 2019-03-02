const {
  describe, it, beforeEach, afterEach,
} = require('mocha');
const { expect } = require('chai');
const request = require('supertest');

let server;

describe('/', () => {
  beforeEach(() => {
    server = require('../index'); // eslint-disable-line global-require
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /', () => {
    it('should return status code of 200', async () => {
      const res = await request(server).get('/');
      expect(res.status).to.be.equal(200);
    });
    it('should return a string', async () => {
      const res = await request(server).get('/');
      expect(res.text).to.be.a('string');
    });
    it('should return Welcome to EPIC-mail', async () => {
      const res = await request(server).get('/');
      expect(res.text).to.equal('Welcome to EPIC-mail');
    });
  });
});