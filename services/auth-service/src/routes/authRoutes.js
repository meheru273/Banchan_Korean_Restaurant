const router = require('express').Router();
const controller = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateFirebaseToken,
  validateOtpRequest,
  validateOtpVerify,
  validateUpdateProfile,
  validateAddAddress,
} = require('../validators/authValidator');
const { authenticate, authorize } = require('@feastfleet/shared');

// Public routes — email/phone + password
router.post('/register', validateRegister, controller.register);
router.post('/login', validateLogin, controller.login);
router.post('/refresh', controller.refresh);

// Firebase authentication — Google, Phone OTP, Email
router.post('/firebase', validateFirebaseToken, controller.firebaseLogin);

// OTP login routes (public) — legacy in-app OTP
router.post('/otp/request', validateOtpRequest, controller.requestOtp);
router.post('/otp/verify', validateOtpVerify, controller.verifyOtp);

// Protected routes (any authenticated user)
router.use(authenticate); // All routes below require auth
router.post('/logout', controller.logout);
router.get('/profile', controller.getProfile);
router.patch('/profile', validateUpdateProfile, controller.updateProfile);
router.post('/addresses', validateAddAddress, controller.addAddress);
router.delete('/addresses/:addressId', controller.deleteAddress);

// Admin-only routes
router.get('/users', authorize('admin'), controller.listUsers);

module.exports = router;
