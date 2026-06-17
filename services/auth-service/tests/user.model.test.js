const User = require('../src/models/User');
const { setup, clear, teardown } = require('./helpers');

beforeAll(setup);
afterEach(clear);
afterAll(teardown);

describe('User model', () => {
  it('hashes the password before saving', async () => {
    const user = await User.create({ name: 'Alice', email: 'a@test.com', password: 'plaintext1' });
    const fresh = await User.findById(user._id).select('+password');
    expect(fresh.password).not.toBe('plaintext1');
    expect(fresh.password).toMatch(/^\$2[aby]\$/);                 // bcrypt prefix
  });

  it('does not return password in JSON', () => {
    const u = new User({ name: 'A', email: 'b@test.com', password: 'plaintext1' });
    expect(u.toJSON().password).toBeUndefined();
  });

  it('rejects duplicate emails', async () => {
    await User.create({ name: 'Ann', email: 'dup@test.com', password: 'plaintext1' });
    await expect(
      User.create({ name: 'Bob', email: 'dup@test.com', password: 'plaintext1' })
    ).rejects.toThrow();
  });
});
