const Cart = require('../src/models/Cart');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(clear);
afterAll(teardown);

describe('Cart model', () => {
  it('recomputes subtotal and itemCount on save', async () => {
    const cart = await Cart.create({
      userId: 'u1',
      restaurantId: 'r1',
      items: [
        { menuItemId: 'a', name: 'A', price: 10, quantity: 2 },
        { menuItemId: 'b', name: 'B', price: 3.5, quantity: 1 },
      ],
    });
    expect(cart.subtotal).toBe(23.5);
    expect(cart.itemCount).toBe(3);
  });

  it('updates totals when items change', async () => {
    const cart = await Cart.create({
      userId: 'u2', restaurantId: 'r1',
      items: [{ menuItemId: 'a', name: 'A', price: 5, quantity: 1 }],
    });
    cart.items.push({ menuItemId: 'b', name: 'B', price: 2, quantity: 4 });
    await cart.save();
    expect(cart.subtotal).toBe(13);
    expect(cart.itemCount).toBe(5);
  });
});
