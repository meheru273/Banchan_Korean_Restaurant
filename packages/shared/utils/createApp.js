const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('../middleware/errorHandler');

/**
 * Creates a pre-configured Express app with standard middleware.
 * Usage:
 *   const { createApp } = require('@feastfleet/shared');
 *   const app = createApp('menu-service');
 *   app.use('/api/menu', menuRoutes);
 *   // errorHandler is already registered as the last middleware
 */
const createApp = (serviceName) => {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite default
    credentials: true,
  }));

  // Body parsing with size limits
  app.use(express.json({ limit: '10kb' }));
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

  // Error handler must be registered AFTER all routes.
  // We use a trick: defer it to a method the service calls after adding routes.
  app._serviceName = serviceName;
  const originalListen = app.listen.bind(app);
  app.listen = (...args) => {
    app.use(errorHandler);
    return originalListen(...args);
  };

  return app;
};

module.exports = { createApp };
