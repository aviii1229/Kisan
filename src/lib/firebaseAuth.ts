import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { ConfirmationResult, User } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

/**
 * Setup Invisible or Visible reCAPTCHA Verifier for Phone OTP Login
 */
export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be initialized in the browser environment.');
  }

  if (!auth) {
    throw new Error('Firebase Authentication is not configured or initialized.');
  }

  // Clear existing reCAPTCHA instance if present
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified for Phone OTP');
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired. Please try again.');
    }
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Send Phone OTP SMS using Firebase Authentication
 * @param phoneNumber Phone number in E.164 format (e.g. +919876543210)
 * @param recaptchaVerifier RecaptchaVerifier instance
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
  recaptchaVerifier?: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials are not configured in .env file.');
  }

  // Ensure phone number starts with country code (+91 for India by default)
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  const verifier = recaptchaVerifier || (window as any).recaptchaVerifier || setupRecaptcha();
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
  return confirmationResult;
};

/**
 * Verify SMS OTP Code sent to user's phone
 */
export const verifyPhoneOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<User> => {
  const result = await confirmationResult.confirm(otpCode);
  return result.user;
};

/**
 * Sign in using Google OAuth Popup
 */
export const signInWithGoogle = async (): Promise<User> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials are not configured in .env file.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

/**
 * Register user using Email and Password
 */
export const registerWithEmail = async (email: string, password: string): Promise<User> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials are not configured in .env file.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Sign in user using Email and Password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials are not configured in .env file.');
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Sign Out current Firebase user
 */
export const logoutFirebaseUser = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
};

/**
 * Observe authentication state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    console.warn('Firebase onAuthChange error:', e);
    callback(null);
    return () => {};
  }
};

