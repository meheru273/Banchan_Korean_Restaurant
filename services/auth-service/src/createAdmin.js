/**
 * Creates or promotes an admin account for Firebase-based auth.
 *
 * Usage:
 *   node services/auth-service/src/createAdmin.js
 *
 * Requires MONGO_URI and FIREBASE_SERVICE_ACCOUNT (or local firebase-service-account.json)
 * in services/auth-service/.env
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const path = require('path');

const ADMIN_EMAIL = 'meherujannat@gmail.com';
const ADMIN_PASSWORD = 'admin@123';
const ADMIN_NAME = 'Banchan Admin';

// Init Firebase Admin
const initFirebase = () => {
  if (admin.apps.length) return admin;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  } else {
    const keyPath = path.resolve(__dirname, '../firebase-service-account.json');
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  }
  return admin;
};

(async () => {
  initFirebase();
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');

  // 1. Create or get Firebase user
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log('Firebase user already exists:', firebaseUser.uid);
    // Reset password in case it changed
    await admin.auth().updateUser(firebaseUser.uid, { password: ADMIN_PASSWORD, emailVerified: true });
    console.log('Firebase password updated');
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      firebaseUser = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      console.log('Firebase user created:', firebaseUser.uid);
    } else {
      throw err;
    }
  }

  // 2. Upsert MongoDB user with admin role
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.role = 'admin';
    existing.firebaseUid = firebaseUser.uid;
    existing.name = ADMIN_NAME;
    existing.isActive = true;
    await existing.save();
    console.log('MongoDB user updated to admin:', ADMIN_EMAIL);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      firebaseUid: firebaseUser.uid,
      role: 'admin',
      isActive: true,
    });
    console.log('MongoDB admin user created:', ADMIN_EMAIL);
  }

  console.log('\n✓ Admin ready:');
  console.log('  Email:', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Firebase UID:', firebaseUser.uid);
  process.exit(0);
})().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
