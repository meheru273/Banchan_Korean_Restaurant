const authService = require('../services/authService');
const firebaseAuthService = require('../services/firebaseAuthService');

// Helper to set refresh token as httpOnly cookie
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

exports.register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

/**
 * Firebase authentication endpoint.
 * Handles ALL Firebase providers: Google, Phone OTP, Email.
 * Client sends the Firebase ID token; we verify it and return our own JWT.
 */
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const { user, accessToken, refreshToken, isNewUser } =
      await firebaseAuthService.verifyAndLogin(idToken);
    setRefreshCookie(res, refreshToken);
    res.status(isNewUser ? 201 : 200).json({
      success: true,
      data: { user, accessToken, isNewUser },
    });
  } catch (err) {
    next(err);
  }
};

exports.requestOtp = async (req, res, next) => {
  try {
    const result = await authService.requestOtp(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.verifyOtp(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshAccessToken(token);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userId);
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await authService.addAddress(req.user.userId, req.body);
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await authService.deleteAddress(req.user.userId, req.params.addressId);
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
};

// Admin-only: list all users (for admin dashboard)
exports.listUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      require('../models/User').find(filter).skip(skip).limit(parseInt(limit)).sort('-createdAt'),
      require('../models/User').countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};
