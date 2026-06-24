const admin = require('firebase-admin');
const path = require('path');

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin;

  // Option 1: service account JSON passed as an env var (production/Render)
  // Set FIREBASE_SERVICE_ACCOUNT to the full JSON string from Firebase Console →
  // Project Settings → Service Accounts → Generate New Private Key
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('[Firebase] Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT env var');
      return admin;
    } catch (err) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
    }
  }

  // Option 2: local JSON file (development)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.resolve(__dirname, '../../firebase-service-account.json');

  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('[Firebase] Admin SDK initialized from file');
    return admin;
  } catch (_fileErr) {}

  // Option 3: project ID only (fallback)
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    console.log('[Firebase] Admin SDK initialized with project ID only');
    return admin;
  }

  console.error('[Firebase] ERROR: No credentials found. Set FIREBASE_SERVICE_ACCOUNT env var on Render.');
  return null;
};

const firebaseAdmin = initializeFirebase();
module.exports = { firebaseAdmin };
