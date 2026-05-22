const { firebaseAdmin } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('@feastfleet/shared');

class FirebaseAuthService {
  /**
   * Generate our own JWT access token for the user.
   */
  generateAccessToken(user) {
    return jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Determine the auth provider from the Firebase decoded token.
   */
  _getProvider(decodedToken) {
    const providerId = decodedToken.firebase?.sign_in_provider;
    switch (providerId) {
      case 'google.com':
        return 'google';
      case 'phone':
        return 'phone';
      case 'password':
        return 'email';
      default:
        return 'firebase';
    }
  }

  /**
   * Verify a Firebase ID token and find or create the user in MongoDB.
   * Works for ALL Firebase auth providers: Google, Phone, Email.
   *
   * Flow:
   * 1. Client signs in via Firebase (Google popup, Phone OTP, Email link)
   * 2. Client gets a Firebase ID token
   * 3. Client sends the token here
   * 4. We verify it, extract user info, find/create in MongoDB
   * 5. We issue our own JWT tokens
   */
  async verifyAndLogin(idToken) {
    if (!firebaseAdmin) {
      throw ApiError.serviceUnavailable(
        'Firebase authentication is not configured. Please set up the service account key.'
      );
    }

    // 1. Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    } catch (err) {
      if (err.code === 'auth/id-token-expired') {
        throw ApiError.unauthorized('Firebase token has expired. Please sign in again.');
      }
      if (err.code === 'auth/argument-error') {
        throw ApiError.badRequest('Invalid Firebase token format');
      }
      throw ApiError.unauthorized('Invalid Firebase token: ' + err.message);
    }

    // 2. Extract user info from the decoded token
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || null;
    const name = decodedToken.name || decodedToken.displayName || null;
    const phone = decodedToken.phone_number || null;
    const avatar = decodedToken.picture || null;
    const provider = this._getProvider(decodedToken);

    // 3. Find existing user by firebaseUid OR email
    let user = await User.findOne({
      $or: [
        { firebaseUid },
        ...(email ? [{ email }] : []),
      ],
    });

    if (user) {
      // User exists — update Firebase UID if not set, and update profile info
      let needsSave = false;

      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        needsSave = true;
      }

      if (!user.name && name) {
        user.name = name;
        needsSave = true;
      }

      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }

      if (!user.phone && phone) {
        user.phone = phone;
        needsSave = true;
      }

      if (user.authProvider === 'local') {
        user.authProvider = provider;
        needsSave = true;
      }

      if (!user.isActive) {
        throw ApiError.forbidden('Account has been deactivated');
      }

      // Generate our tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      user.refreshToken = refreshToken;
      if (needsSave) await user.save();
      else await User.findByIdAndUpdate(user._id, { refreshToken });

      return { user, accessToken, refreshToken, isNewUser: false };
    }

    // 4. Create new user
    user = await User.create({
      email,
      name,
      phone,
      avatar,
      firebaseUid,
      authProvider: provider,
      // No password needed for Firebase auth users
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken, isNewUser: true };
  }
}

module.exports = new FirebaseAuthService();
