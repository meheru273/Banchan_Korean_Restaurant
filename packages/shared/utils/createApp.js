const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

/**
 * Creates a pre-configured Express app with standard middleware.
 * Usage:
 *   const { createApp } = require('@feastfleet/shared');
 *   const app = createApp('menu-service');
 *   app.use('/api/menu', menuRoutes);
 *   // errorHandler is already registered as the last middleware
 */
/**
 * Shared CORS origin check, used by every service AND by the gateway, so a
 * single CORS_ORIGIN value behaves identically everywhere.
 *
 * CORS_ORIGIN accepts a comma-separated list, so the client and admin apps
 * (and a local dev origin) can be allowed at the same time.
 */
const corsOrigin = (origin, callback) => {
  const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))   // tolerate trailing slashes
    .filter(Boolean);

  // Any Vercel URL for this project: the bare domain, the production alias
  // (…-client-meheru), and preview builds (…-client-<hash>-meheru).
  const vercelUrl = /^https:\/\/banchan-korean-restaurant-client(-[a-z0-9-]+)?\.vercel\.app$/;

  // Allow requests with no origin (curl, Postman, server-to-server)
  if (!origin) return callback(null, true);
  if (allowed.includes(origin)) return callback(null, true);
  if (vercelUrl.test(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};

const createApp = (serviceName) => {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // Body parsing with size limits.
  // Skip JSON parsing for webhook routes (e.g. Stripe) — those need the raw
  // request body to verify signatures, and parse it themselves via express.raw().
  const jsonParser = express.json({ limit: '10kb' });
  app.use((req, res, next) => {
    if (req.originalUrl.includes('/webhook')) return next();
    return jsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Request logging
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  // Health check (available on every service)
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: serviceName,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // The error handler must be registered AFTER all routes. Since routes are
  // added by the caller, each service's app.js registers `errorHandler` itself
  // as the last middleware (re-exported from this package). This works both
  // when the server is started via app.listen() and under supertest (which
  // never calls app.listen()), so route error responses behave the same in tests.
  app._serviceName = serviceName;

  return app;
};

module.exports = { createApp, corsOrigin };
