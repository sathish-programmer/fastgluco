import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isNativePlatform = Capacitor.isNativePlatform();
const isFirstInit = getApps().length === 0;

const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

const auth = isFirstInit
  ? initializeAuth(app, {
      persistence: isNativePlatform ? indexedDBLocalPersistence : browserLocalPersistence,
    })
  : getAuth(app);

// On native iOS/Android with test phone numbers, disable reCAPTCHA verification.
// Remove this line before going to production with real phone numbers.
if (isNativePlatform) {
  auth.settings.appVerificationDisabledForTesting = true;
}

export const isMock = false;
export { app, auth };
