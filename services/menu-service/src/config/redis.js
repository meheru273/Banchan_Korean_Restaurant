const Redis = require('ioredis');

let client = null;

const getRedisClient = () => {
  if (client) return client;

  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn('[Redis] No REDIS_URL set — caching disabled');
    return null;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying
      return Math.min(times * 200, 2000);
    },
    tls: url.startsWith('rediss://') ? {} : undefined,
  });

  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('error', (err) => console.error('[Redis] Error:', err.message));

  return client;
};

/**
 * Cache-aside pattern:
 * 1. Check Redis for key
 * 2. If hit, return cached data
 * 3. If miss, call the callback (usually a DB query), cache the result, return it
 * 4. If Redis is down, just call the callback (graceful degradation)
 */
const cacheGetOrSet = async (key, callback, ttlSeconds = 300) => {
  const redis = getRedisClient();

  if (!redis) return callback(); // Redis disabled — just hit DB

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('[Redis] Read error, falling back to DB:', err.message);
    return callback();
  }

  // Cache miss — fetch from DB
  const data = await callback();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error('[Redis] Write error:', err.message);
    // Non-fatal: data was fetched from DB, just couldn't cache it
  }

  return data;
};

/**
 * Invalidate cache keys matching a pattern.
 * Called after any write operation (create, update, delete).
 */
const cacheInvalidate = async (...keys) => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // For exact keys
    const exactKeys = keys.filter((k) => !k.includes('*'));
    if (exactKeys.length) await redis.del(...exactKeys);

    // For pattern keys (e.g., "menu:items:*")
    const patternKeys = keys.filter((k) => k.includes('*'));
    for (const pattern of patternKeys) {
      const matchedKeys = await redis.keys(pattern);
      if (matchedKeys.length) await redis.del(...matchedKeys);
    }
  } catch (err) {
    console.error('[Redis] Invalidation error:', err.message);
  }
};

module.exports = { getRedisClient, cacheGetOrSet, cacheInvalidate };
