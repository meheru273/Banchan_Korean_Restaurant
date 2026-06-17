const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
      // NOT required — Firebase auth users don't have a password
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'driver'],
      default: 'customer',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'phone', 'email', 'firebase'],
      default: 'local',
    },
    firebaseUid: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null, // Google profile photo URL
    },
    addresses: [
      {
        label: { type: String, default: 'Home' },      // "Home", "Work", etc.
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, default: 'London' },
        postcode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
    },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ role: 1, isActive: 1 });

// Unique only when the field is an actual string. Partial indexes (unlike
// sparse) correctly skip documents whose value is null, so the many users
// that legitimately have no email / phone / firebaseUid don't collide.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });
userSchema.index({ firebaseUid: 1 }, { unique: true, partialFilterExpression: { firebaseUid: { $type: 'string' } } });

// Ensure at least email, phone, or firebaseUid is provided
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone && !this.firebaseUid) {
    this.invalidate('email', 'Either email, phone number, or Firebase UID is required');
  }
  next();
});

// Ensure password is required for local auth
userSchema.pre('validate', function (next) {
  if (this.authProvider === 'local' && this.isNew && !this.password) {
    this.invalidate('password', 'Password is required for email/phone registration');
  }
  next();
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await this.constructor.findById(this._id).select('+password');
  if (!user.password) return false; // Firebase users have no password
  return bcrypt.compare(candidatePassword, user.password);
};

module.exports = mongoose.model('User', userSchema);
