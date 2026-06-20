import * as admin from 'firebase-admin';
import fs from 'fs';

const isMock = process.env.FIREBASE_MOCK === 'true';

if (!isMock) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  } else {
    console.warn('Firebase Admin Service Account file not found or not specified in env. Verification will fail unless running in mock mode.');
  }
} else {
  console.log('Firebase Admin SDK initialized in DEV MOCK mode.');
}

export default admin;
export { isMock };
