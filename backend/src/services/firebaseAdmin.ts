import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.resolve(__dirname, '../../config/firebase-service-account.json');

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized with service account.');
  } else {
    // Fallback for production: use GOOGLE_APPLICATION_CREDENTIALS env var
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized with application default credentials.');
  }
}

export default admin;
