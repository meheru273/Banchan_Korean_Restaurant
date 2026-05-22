const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ApiError } = require('@feastfleet/shared');

class AuthService {
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
   * Build a query to find a user by email or phone.
   */
  _buildIdentifierQuery(data) {
    if (data.email) return { email: data.email };
    if (data.phone) return { phone: data.phone };
    throw ApiError.badRequest('Either email or phone number is required');
  }

  async register(data) {
    const query = this._buildIdentifierQuery(data);
    const existing = await User.findOne(query);
    if (existing) {
      throw ApiError.conflict('An account with this email or phone already exists');
    }

    const user = await User.create(data);
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async login(data) {
    const query = this._buildIdentifierQuery(data);
    const user = await User.findOne(query).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  /**
   * OTP Login — Step 1: Generate and "send" OTP.
   * Currently stubbed: logs OTP to console. Wire to SMS/email provider later.
   */
  async requestOtp(data) {
    const query = this._buildIdentifierQuery(data);
    let user = await User.findOne(query);

    if (!user) {
      throw ApiError.notFound('No account found with this email or phone');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = { code: otpCode, expiresAt };
    await user.save();

    // TODO: Send OTP via SMS or email. For now, log it.
    console.log(`[OTP] Code for ${data.email || data.phone}: ${otpCode}`);

    return { message: 'OTP sent successfully' };
  }

  /**
   * OTP Login — Step 2: Verify OTP and return tokens.
   */
  async verifyOtp(data) {
    const query = this._buildIdentifierQuery(data);
    const user = await User.findOne(query).select('+otp.code +otp.expiresAt');

    if (!user) {
      throw ApiError.notFound('No account found with this email or phone');
    }

    if (!user.otp || !user.otp.code) {
      throw ApiError.badRequest('No OTP was requested for this account');
    }

    if (new Date() > user.otp.expiresAt) {
      // Clear expired OTP
      user.otp = { code: null, expiresAt: null };
      await user.save();
      throw ApiError.unauthorized('OTP has expired. Please request a new one.');
    }

    if (user.otp.code !== data.otp) {
      throw ApiError.unauthorized('Invalid OTP');
    }

    // Clear OTP after successful verification
    user.otp = { code: null, expiresAt: null };

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateProfile(userId, data) {
    const user = await User.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // If this address is default, unset other defaults
    if (addressData.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    user.addresses.push(addressData);
    await user.save();
    return user;
  }

  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );
    await user.save();
    return user;
  }
}

module.exports = new AuthService();
