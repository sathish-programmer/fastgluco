import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyCBYA55ONHU9A7ZMdzc1600O0ESyj2CfLw",
  authDomain: "mito-reboot-e9465.firebaseapp.com",
  projectId: "mito-reboot-e9465",
  storageBucket: "mito-reboot-e9465.firebasestorage.app",
  messagingSenderId: "1063510630357",
  appId: "1:1063510630357:web:5f6a8442601be95d61675c",
  measurementId: "G-710MCVYVRP"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const isNativePlatform = Capacitor.isNativePlatform();

export default app;
