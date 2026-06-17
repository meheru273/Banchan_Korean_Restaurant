// Mock the BullMQ queue (no Redis in tests) and Stripe (no network) BEFORE app loads.
jest.mock('@feastfleet/shared', () => {
  const actual = jest.requireActual('@feastfleet/shared');
  return { ...actual, createQueue: () => ({ add: jest.fn().mockResolvedValue({}) }) };
});
jest.mock('../src/services/stripeClient', () => ({
  paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const nock = require('nock');
const app = require('../src/app');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(async () => { await clear(); nock.cleanAll(); });
afterAll(teardown);

const token = () =>
  jwt.sign({ userId: 'cust1', email: 'cust@test.com', role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '15m' });

const auth = (req) => req.set('Authorization', `Bearer ${token()}`);

describe('Order routes', () => {
  it('adds an item to the cart', async () => {
    const res = await auth(request(app).post('/api/orders/cart/items')).send({
      menuItemId: 'item1', name: 'Burger', price: 12.95, quantity: 2, restaurantId: 'rest1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.itemCount).toBe(2);
  });

  it('places an order using the live menu price and clears the cart', async () => {
    // Cart with a price that should be OVERRIDDEN by the menu service's live price
    await auth(request(app).post('/api/orders/cart/items')).send({
      menuItemId: 'item1', name: 'Burger', price: 99.99, quantity: 1, restaurantId: 'rest1',
    });

    // Menu service returns the authoritative price
    nock('http://localhost:3002')
      .get('/api/menu/items/item1')
      .reply(200, { success: true, data: { _id: 'item1', name: 'Burger', price: 12.95, isAvailable: true } });

    const res = await auth(request(app).post('/api/orders')).send({
      userName: 'Cust',
      restaurantId: 'rest1',
      deliveryAddress: { line1: '10 Downing Street', postcode: 'SW1A 2AA' },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].price).toBe(12.95);          // live price won
    expect(res.body.data.subtotal).toBe(12.95);
    expect(res.body.data.orderNumber).toMatch(/^FF-\d{8}-\d{3}$/);

    // Cart is now empty
    const cartRes = await auth(request(app).get('/api/orders/cart'));
    expect(cartRes.body.data.items).toHaveLength(0);
  });

  it('rejects placing an order with an empty cart', async () => {
    const res = await auth(request(app).post('/api/orders')).send({
      userName: 'Cust',
      restaurantId: 'rest1',
      deliveryAddress: { line1: '10 Downing Street', postcode: 'SW1A 2AA' },
    });
    expect(res.status).toBe(400);
  });
});
