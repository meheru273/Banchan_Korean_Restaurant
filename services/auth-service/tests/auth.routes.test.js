const request = require('supertest');
const app = require('../src/app');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(clear);
afterAll(teardown);

describe('Auth routes', () => {
  it('registers a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice', email: 'alice@test.com', password: 'password1',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({ name: 'A', email: 'd@test.com', password: 'password1' });
    const res = await request(app).post('/api/auth/register').send({ name: 'B', email: 'd@test.com', password: 'password2' });
    expect(res.status).toBe(409);
  });

  it('logs in and rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'B', email: 'b@test.com', password: 'password1' });
    const ok = await request(app).post('/api/auth/login').send({ email: 'b@test.com', password: 'password1' });
    expect(ok.status).toBe(200);
    const bad = await request(app).post('/api/auth/login').send({ email: 'b@test.com', password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  it('protects /profile and accepts a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'C', email: 'c@test.com', password: 'password1' });
    const token = reg.body.data.accessToken;

    const unauth = await request(app).get('/api/auth/profile');
    expect(unauth.status).toBe(401);

    const authed = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(authed.status).toBe(200);
    expect(authed.body.data.email).toBe('c@test.com');
  });
});
