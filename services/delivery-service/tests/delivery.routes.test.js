// Mock the BullMQ queue (no Redis in tests) BEFORE app/services load.
jest.mock('@feastfleet/shared', () => {
  const actual = jest.requireActual('@feastfleet/shared');
  return { ...actual, createQueue: () => ({ add: jest.fn().mockResolvedValue({}) }) };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Delivery = require('../src/models/Delivery');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(clear);
afterAll(teardown);

const tokenFor = (userId, role) =>
  jwt.sign({ userId, email: `${userId}@test.com`, role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const makeDelivery = (overrides = {}) =>
  Delivery.create({
    orderId: 'order1',
    orderNumber: 'FF-20240101-001',
    restaurantId: 'rest1',
    customerId: 'cust1',
    customerName: 'Customer One',
    customerEmail: 'cust1@test.com',
    deliveryAddress: { line1: '1 Road', postcode: 'SW1A 2AA' },
    ...overrides,
  });

describe('Delivery routes', () => {
  it('lets an admin assign a driver and moves status to assigned', async () => {
    const delivery = await makeDelivery();
    const res = await request(app)
      .post(`/api/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${tokenFor('admin1', 'admin')}`)
      .send({ driverId: 'drv1', driverName: 'Dave', driverPhone: '+447911123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.driverName).toBe('Dave');
    expect(res.body.data.assignedAt).toBeTruthy();
  });

  it('forbids a customer from assigning a driver (403)', async () => {
    const delivery = await makeDelivery();
    const res = await request(app)
      .post(`/api/deliveries/${delivery._id}/assign`)
      .set('Authorization', `Bearer ${tokenFor('cust1', 'customer')}`)
      .send({ driverId: 'drv1', driverName: 'Dave' });
    expect(res.status).toBe(403);
  });

  it('lets the owning customer track their delivery but blocks others (403)', async () => {
    await makeDelivery();

    const owner = await request(app)
      .get('/api/deliveries/order/order1')
      .set('Authorization', `Bearer ${tokenFor('cust1', 'customer')}`);
    expect(owner.status).toBe(200);
    expect(owner.body.data.orderNumber).toBe('FF-20240101-001');

    const other = await request(app)
      .get('/api/deliveries/order/order1')
      .set('Authorization', `Bearer ${tokenFor('cust2', 'customer')}`);
    expect(other.status).toBe(403);
  });
});
