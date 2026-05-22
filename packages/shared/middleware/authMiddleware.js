const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');

/**
 * Validates the Bearer token from the Authorization header.
 * On success, attaches `req.user = { userId, email, role }` to the request.
 *
 * NOTE: In the API Gateway, this runs on every protected route.
 * The gateway then forwards `x-user-id` and `x-user-role` headers to downstream services.
 * Individual services can ALSO use this middleware for direct-access scenarios (testing, internal calls).
 */
const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  // Also accept forwarded headers from the gateway
  if (!authHeader && req.headers['x-user-id']) {
    req.user = {
      userId: req.headers['x-user-id'],
      email: req.headers['x-user-email'] || '',
      role: req.headers['x-user-role'] || 'customer',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authentication token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(err); // Will be caught by errorHandler's JWT handling
  }
};

/**
 * Restricts access to specific roles.
 * Usage: `router.get('/admin-only', authenticate, authorize('admin'), handler)`
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
