import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import dotenv from 'dotenv';

// Load .env in Node.js environment if process exists
if (typeof process !== 'undefined') {
  try {
    dotenv.config();
  } catch (e) {
    // Ignore in browser
  }
}

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || procEnv.FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || procEnv.FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || '',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || procEnv.FIREBASE_MEASUREMENT_ID || procEnv.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Check if Firebase credentials are provided in .env
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('your_firebase_api_key') &&
    !firebaseConfig.projectId.includes('your-project-id')
  );
};

// Initialize Firebase App instance safely
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Authentication Instance
export const auth: Auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
