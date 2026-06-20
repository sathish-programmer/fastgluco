import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
  // Primary: Use local service account JSON
  const localServiceAccountPath = path.resolve(__dirname, '../../config/firebase-service-account.json');
  // Fallback: Use path from environment variable (for production deployments)
  const envServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const serviceAccountPath = fs.existsSync(localServiceAccountPath)
    ? localServiceAccountPath
    : envServiceAccountPath && fs.existsSync(envServiceAccountPath)
    ? envServiceAccountPath
    : null;

  if (serviceAccountPath) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized with service account.');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  } else {
    // Last resort: Application Default Credentials (Cloud Run, GCP etc.)
    admin.initializeApp();
    console.log('✅ Firebase Admin SDK initialized with application default credentials.');
  }
}

export default admin;
