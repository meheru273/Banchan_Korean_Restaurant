const Joi = require('joi');

// Middleware factory: validates req.body against a Joi schema
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Remove fields not in schema
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, error: 'Validation failed', details: messages });
  }
  req.body = value; // Use sanitized values
  next();
};

const registerSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+44|0)[\d\s]{9,13}$/),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('customer', 'driver').default('customer'),
  // NOTE: 'admin' role is NOT allowed via registration. Admins are created manually.
})
  .or('email', 'phone') // At least one of email or phone required
  .messages({
    'object.missing': 'Either email or phone number is required',
    'string.pattern.base': 'Phone must be a valid UK number (e.g. +447911123456)',
  });

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+44|0)[\d\s]{9,13}$/),
  password: Joi.string().required(),
})
  .or('email', 'phone')
  .messages({
    'object.missing': 'Either email or phone number is required',
    'string.pattern.base': 'Phone must be a valid UK number',
  });

const firebaseTokenSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'any.required': 'Firebase ID token is required',
    'string.empty': 'Firebase ID token cannot be empty',
  }),
});

const otpRequestSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+44|0)[\d\s]{9,13}$/),
})
  .or('email', 'phone')
  .messages({ 'object.missing': 'Either email or phone number is required' });

const otpVerifySchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+44|0)[\d\s]{9,13}$/),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({ 'string.pattern.base': 'OTP must be 6 digits' }),
})
  .or('email', 'phone')
  .messages({ 'object.missing': 'Either email or phone number is required' });

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  phone: Joi.string().pattern(/^(\+44|0)[\d\s]{9,13}$/).allow(null, ''),
  email: Joi.string().email(),
}).min(1); // At least one field required

const addAddressSchema = Joi.object({
  label: Joi.string().max(20).default('Home'),
  line1: Joi.string().required(),
  line2: Joi.string().allow(''),
  city: Joi.string().default('London'),
  postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i).required()
    .messages({ 'string.pattern.base': 'Must be a valid UK postcode' }),
  isDefault: Joi.boolean().default(false),
});

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateFirebaseToken: validate(firebaseTokenSchema),
  validateOtpRequest: validate(otpRequestSchema),
  validateOtpVerify: validate(otpVerifySchema),
  validateUpdateProfile: validate(updateProfileSchema),
  validateAddAddress: validate(addAddressSchema),
};
