const request = require('supertest');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

jest.mock('../src/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
}));

const User = require('../src/models/User');
const app = require('../src/app');

const ID = '507f1f77bcf86cd799439011';
const PASSWORD = 'Correct-horse-1';
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

// fake Mongoose document with just what the auth code uses
const makeUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(ID),
  role: 'freelancer',
  passwordHash,
  failedLoginAttempts: 0,
  lockUntil: null,
  tokenVersion: 0,
  save: jest.fn().mockResolvedValue(),
  ...overrides,
});

const login = (password) => request(app).post('/api/auth/login').send({ email: 'free@test.com', password });

beforeEach(() => jest.clearAllMocks());

describe('login', () => {
  test('unknown email and wrong password return the same message', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const unknown = await login('whatever');
    User.findOne.mockResolvedValueOnce(makeUser());
    const wrong = await login('wrong-password');
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  test('correct password returns a token and no password data', async () => {
    User.findOne.mockResolvedValueOnce(makeUser());
    const res = await login(PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toContain(passwordHash);
  });
});

describe('account lockout (extra security feature 1)', () => {
  test('5th wrong password locks the account', async () => {
    const user = makeUser({ failedLoginAttempts: 4 });
    User.findOne.mockResolvedValueOnce(user);
    const res = await login('wrong-password');
    expect(res.status).toBe(401);
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.save).toHaveBeenCalled();
  });

  test('a wrong password below the threshold only increments the counter', async () => {
    const user = makeUser({ failedLoginAttempts: 1 });
    User.findOne.mockResolvedValueOnce(user);
    await login('wrong-password');
    expect(user.failedLoginAttempts).toBe(2);
    expect(user.lockUntil).toBeNull();
  });

  test('a locked account is refused even with the correct password', async () => {
    User.findOne.mockResolvedValueOnce(makeUser({ lockUntil: new Date(Date.now() + 60000) }));
    const res = await login(PASSWORD);
    expect(res.status).toBe(429);
    expect(res.body.token).toBeUndefined();
  });

  test('an expired lock lets the user in and resets the counters', async () => {
    const user = makeUser({ lockUntil: new Date(Date.now() - 1000), failedLoginAttempts: 2 });
    User.findOne.mockResolvedValueOnce(user);
    const res = await login(PASSWORD);
    expect(res.status).toBe(200);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
  });
});

describe('server-side logout / token revocation (extra security feature 2)', () => {
  const getToken = async () => {
    User.findOne.mockResolvedValueOnce(makeUser({ tokenVersion: 3 }));
    return (await login(PASSWORD)).body.token;
  };
  const mockCurrentVersion = (tokenVersion) => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ role: 'freelancer', tokenVersion }) });
  };

  test('logout with a current token bumps the token version', async () => {
    const token = await getToken();
    mockCurrentVersion(3);
    User.updateOne.mockResolvedValueOnce({});
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(User.updateOne).toHaveBeenCalledWith({ _id: ID }, { $inc: { tokenVersion: 1 } });
  });

  test('token is rejected after logout bumped the version', async () => {
    const token = await getToken();
    mockCurrentVersion(4);
    const res = await request(app).get('/api/transactions/income').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('token for a deleted user is rejected', async () => {
    const token = await getToken();
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
