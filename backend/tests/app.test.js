const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('app security baseline', () => {
  test('health check works and sends security headers + request id', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('unknown route returns a generic 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Not found' });
  });

  test('protected route without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('tampered token is rejected', async () => {
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'admin', tv: 0 }, 'wrong-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('register validation rejects bad email, short password and admin role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x', email: 'not-an-email', password: 'short', role: 'admin' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'role']));
  });

  test('payload over 10kb is rejected with 413 and no stack trace', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'x'.repeat(11 * 1024) });
    expect(res.status).toBe(413);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });
});
