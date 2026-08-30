import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, ConfirmationResult } from 'firebase/auth';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logoutFirebaseUser,
  onAuthChange,
  setupRecaptcha
} from '../lib/firebaseAuth';
import { isFirebaseConfigured } from '../lib/firebase';

interface FirebaseAuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseReady: boolean;
  confirmationResult: ConfirmationResult | null;
  sendOtp: (phone: string) => Promise<ConfirmationResult>;
  verifyOtp: (code: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  loginWithEmailPass: (e: string, p: string) => Promise<User>;
  registerWithEmailPass: (e: string, p: string) => Promise<User>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const isFirebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseReady]);

  const sendOtp = async (phone: string): Promise<ConfirmationResult> => {
    const recaptcha = setupRecaptcha('recaptcha-container');
    const result = await sendPhoneOtp(phone, recaptcha);
    setConfirmationResult(result);
    return result;
  };

  const verifyOtp = async (code: string): Promise<User> => {
    if (!confirmationResult) {
      throw new Error('No pending OTP verification. Please request an OTP first.');
    }
    const user = await verifyPhoneOtp(confirmationResult, code);
    setCurrentUser(user);
    return user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    const user = await signInWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const loginWithEmailPass = async (email: string, pass: string): Promise<User> => {
    const user = await signInWithEmail(email, pass);
    setCurrentUser(user);
    return user;
  };

  const registerWithEmailPass = async (email: string, pass: string): Promise<User> => {
    const user = await registerWithEmail(email, pass);
    setCurrentUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    await logoutFirebaseUser();
    setCurrentUser(null);
    setConfirmationResult(null);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseReady,
        confirmationResult,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        loginWithEmailPass,
        registerWithEmailPass,
        logout
      }}
    >
      {children}
      {/* Invisible reCAPTCHA container for Phone Authentication */}
      <div id="recaptcha-container"></div>
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};
