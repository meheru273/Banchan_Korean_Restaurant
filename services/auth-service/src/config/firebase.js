const admin = require('firebase-admin');
const path = require('path');

/**
 * Initialize Firebase Admin SDK.
 *
 * Uses a service account JSON file for authentication.
 * Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 * Save as: services/auth-service/firebase-service-account.json
 *
 * Alternatively, if GOOGLE_APPLICATION_CREDENTIALS env var is set,
 * firebase-admin will use Application Default Credentials automatically.
 */
const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin; // Already initialized
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.resolve(__dirname, '../../firebase-service-account.json');

  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase] Admin SDK initialized successfully');
  } catch (err) {
    // Fallback: try initializing with project ID only (for environments with ADC)
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('[Firebase] Admin SDK initialized with project ID');
    } else {
      console.warn(
        '[Firebase] WARNING: Could not initialize Firebase Admin SDK.',
        'Firebase auth endpoints will not work.',
        'Download service account key from Firebase Console.',
        err.message
      );
      return null;
    }
  }

  return admin;
};

const firebaseAdmin = initializeFirebase();

module.exports = { firebaseAdmin };
