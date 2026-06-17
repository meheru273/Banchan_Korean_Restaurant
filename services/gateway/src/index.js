require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(morgan('combined'));

// Optional JWT — attach user to req.user if a valid token is present, otherwise just continue.
// Runs BEFORE the rate limiters so they can key by user ID. Each downstream
// service decides whether to reject unauthenticated requests.
app.use((req, _res, next) => {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch { /* invalid token — ignore */ }
  }
  next();
});

// ── Rate limiting ──────────────────────────────────────────────
// Per-user limits backed by Redis when a TCP Redis URL is configured, so the
// counter survives restarts and is shared across multiple gateway instances.
// Falls back to in-memory IP limiting when REDIS_URL is absent or is not a
// redis://rediss:// TCP endpoint (e.g. Upstash's https:// REST URL in dev).
const REDIS_URL = process.env.REDIS_URL;
const useRedisStore = /^rediss?:\/\//.test(REDIS_URL || '');

let buildStore = () => undefined; // undefined → express-rate-limit's default memory store
if (useRedisStore) {
  const Redis = require('ioredis');
  const { RedisStore } = require('rate-limit-redis');
  const redisClient = new Redis(REDIS_URL, {
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });
  redisClient.on('error', (err) => console.error('[Gateway] Redis error:', err.message));
  buildStore = () => new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rate-limit:',
  });
} else {
  console.warn('[Gateway] No TCP Redis URL — using in-memory rate limiting (per-IP, single instance).');
}

const makeLimiter = ({ windowMs, max, message }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore(),
  keyGenerator: (req) => (req.user?.userId ? `user:${req.user.userId}` : `ip:${req.ip}`),
  skip: (req) => req.path === '/health',
  message: message || { success: false, error: 'Too many requests' },
});

// General limit: 100 requests / 15 min per user (or IP if anonymous)
app.use(makeLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

// Stricter limit for auth endpoints (brute-force protection)
const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth attempts' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Gateway health
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', service: 'gateway', uptime: process.uptime() } })
);

// Build a proxy that forwards x-user-* headers when authenticated
const proxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  timeout: 30000,
  onError: (err, _req, res) => {
    console.error(`[Gateway] proxy error → ${target}:`, err.message);
    res.status(502).json({ success: false, error: 'Service temporarily unavailable' });
  },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.userId);
      proxyReq.setHeader('x-user-email', req.user.email || '');
      proxyReq.setHeader('x-user-role', req.user.role || 'customer');
    }
  },
});

app.use('/api/auth',       proxy(process.env.AUTH_SERVICE_URL));
app.use('/api/menu',       proxy(process.env.MENU_SERVICE_URL));
app.use('/api/orders',     proxy(process.env.ORDER_SERVICE_URL));
app.use('/api/deliveries', proxy(process.env.DELIVERY_SERVICE_URL));

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Gateway] running on port ${PORT}`);
  console.log(`  /api/auth       → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`  /api/menu       → ${process.env.MENU_SERVICE_URL}`);
  console.log(`  /api/orders     → ${process.env.ORDER_SERVICE_URL}`);
  console.log(`  /api/deliveries → ${process.env.DELIVERY_SERVICE_URL}`);
});
