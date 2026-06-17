const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Pre-flight: test env vars must be set BEFORE @feastfleet/shared loads.
// Deliberately leave REDIS_URL unset so the cache layer degrades to DB-only.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32';

exports.setup = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
};

exports.teardown = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
