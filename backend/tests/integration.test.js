const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const appModulePath = require.resolve('../server');

let server;
let mongod;
let agent;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test_secret_1234';
  process.env.PAYMENT_GATEWAY_SECRET = 'paysecret';

  // Import the app and connect DB directly for tests
  const serverModule = require('..//server');
  const { app } = serverModule; // exported app
  const connectDB = require('../config/db');

  await connectDB(process.env.MONGO_URI);

  // use supertest directly against the express app
  agent = request(app);
});

afterAll(async () => {
  if (server) server.close();
  if (mongod) await mongod.stop();
  await mongoose.disconnect();
});

describe('Auth & Roles', () => {
  test('cannot register as ADMIN via payload', async () => {
    const res = await agent.post('/api/auth/register').send({ name: 'A', email: 'a@example.com', password: 'pass123', role: 'ADMIN' });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });
});

describe('Donation flows', () => {
  let token;
  let transactionId;

  test('create user and donation', async () => {
    await agent.post('/api/auth/register').send({ name: 'Donor', email: 'donor@example.com', password: 'pass123' });
    const login = await agent.post('/api/auth/login').send({ email: 'donor@example.com', password: 'pass123' });
    token = login.body.token;

    const init = await agent.post('/api/user/donate').set('Authorization', `Bearer ${token}`).send({ amount: 50 });
    expect(init.statusCode).toBe(201);
    transactionId = init.body.donation.transactionId;
    expect(init.body.donation.status).toBe('PENDING');
  });

  test('user cannot mark SUCCESS', async () => {
    const res = await agent.post('/api/user/donate/status').set('Authorization', `Bearer ${token}`).send({ transactionId, status: 'SUCCESS' });
    expect(res.statusCode).toBe(403);
  });

  test('gateway can mark SUCCESS with secret', async () => {
    const res = await agent.post('/api/payment/callback').set('x-gateway-secret', 'paysecret').send({ transactionId, status: 'SUCCESS' });
    expect(res.statusCode).toBe(200);
    expect(res.body.donation.status).toBe('SUCCESS');
  });
});

describe('Admin updates', () => {
  let adminToken;
  let transactionId;

  test('create admin and donation, admin can update', async () => {
    await agent.post('/api/auth/register').send({ name: 'AdminUser', email: 'admin@example.com', password: 'adminpass' });
    // promote to admin directly in DB
    const User = require('../models/User');
    const admin = await User.findOneAndUpdate({ email: 'admin@example.com' }, { role: 'ADMIN' }, { new: true });

    const login = await agent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'adminpass' });
    adminToken = login.body.token;

    // create donor + donation
    await agent.post('/api/auth/register').send({ name: 'Don2', email: 'd2@example.com', password: 'p2' });
    const login2 = await agent.post('/api/auth/login').send({ email: 'd2@example.com', password: 'p2' });
    const token2 = login2.body.token;
    const init = await agent.post('/api/user/donate').set('Authorization', `Bearer ${token2}`).send({ amount: 25 });
    transactionId = init.body.donation.transactionId;

    const adminUpdate = await agent.patch(`/api/admin/donations/${transactionId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'FAILED', failureReason: 'test fail' });
    expect(adminUpdate.statusCode).toBe(200);
    expect(adminUpdate.body.donation.status).toBe('FAILED');
    expect(adminUpdate.body.donation.failureReason).toBe('test fail');
  });
});