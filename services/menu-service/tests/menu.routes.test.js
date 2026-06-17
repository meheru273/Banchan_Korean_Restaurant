const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Category = require('../src/models/Category');
const MenuItem = require('../src/models/MenuItem');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(clear);
afterAll(teardown);

const tokenFor = (role) =>
  jwt.sign({ userId: 'u1', email: `${role}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '15m' });

describe('Menu routes', () => {
  it('serves the public item list (empty DB → empty array)', async () => {
    const res = await request(app).get('/api/menu/items');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns available items created in the DB', async () => {
    const cat = await Category.create({ name: 'Burgers', slug: 'burgers' });
    await MenuItem.create({ name: 'Cheeseburger', description: 'Tasty', price: 9.5, category: cat._id });

    const res = await request(app).get('/api/menu/items');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Cheeseburger');
  });

  it('rejects an unauthenticated admin create with 401', async () => {
    const res = await request(app).post('/api/menu/items').send({ name: 'X', description: 'Y', price: 1 });
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin admin create with 403', async () => {
    const res = await request(app)
      .post('/api/menu/items')
      .set('Authorization', `Bearer ${tokenFor('customer')}`)
      .send({ name: 'X', description: 'Y', price: 1 });
    expect(res.status).toBe(403);
  });

  it('allows an admin to create an item', async () => {
    const cat = await Category.create({ name: 'Sides', slug: 'sides' });
    const res = await request(app)
      .post('/api/menu/items')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ name: 'Fries', description: 'Crispy', price: 3.5, category: cat._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Fries');
  });
});
