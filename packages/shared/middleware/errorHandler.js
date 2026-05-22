const { ApiError } = require('../utils/ApiError');

const errorHandler = (err, req, res, _next) => {
  // Log the error (use the logger from the service, or console as fallback)
  if (req.log) {
    req.log.error({ err, url: req.originalUrl, method: req.method });
  } else {
    console.error(`[${req.method}] ${req.originalUrl}:`, err);
  }

  // Known operational error (we threw it intentionally)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }

  // Unknown error — don't leak internals in production
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error';

  res.status(500).json({ success: false, error: message });
};

module.exports = { errorHandler };
