
# 🔥 Kisan Setu - Firebase Authentication Setup & Connection Guide

This guide provides step-by-step instructions for setting up **Firebase Authentication** in your **Kisan Setu** application. It enables:
- 📱 **Phone OTP SMS Authentication** (Ideal for Farmers logging in with mobile numbers)
- 🌐 **Google Sign-In** (One-click login for Officers & Farmers)
- ✉️ **Email & Password Authentication**

---

## 📑 Quick Setup Checklist

- [ ] Create a free Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable **Phone**, **Google**, and **Email/Password** under **Authentication -> Sign-in method**
- [ ] Add a **Web App** in Firebase Project Settings to generate your API keys
- [ ] Copy the configuration values into your [`.env`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env) file
- [ ] Wrap your React App with `<FirebaseAuthProvider>` or use `useFirebaseAuth()`

---

## 🚀 Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Click **"Add project"** (or **"Create a project"**).
3. Enter a project name (e.g. `Kisan-Setu-Auth`).
4. (Optional) Disable or Enable Google Analytics.
5. Click **"Create project"** and wait ~30 seconds.

---

## 🔐 Step 2: Enable Authentication Methods

1. In the Firebase Console left menu, click **Build** -> **Authentication**.
2. Click **"Get started"**.
3. Under the **Sign-in method** tab, enable the following:

   - **Phone**: Click **Phone**, toggle **Enable**, and click **Save**.
     > 💡 *Tip for Local Testing*: You can add test phone numbers (e.g., `+91 9876543210` with verification code `123456`) under **Phone -> Phone numbers for testing** so SMS isn't used during development!

   - **Google**: Click **Google**, toggle **Enable**, set support email, and click **Save**.

   - **Email/Password**: Click **Email/Password**, toggle **Enable**, and click **Save**.

---

## 🔑 Step 3: Get Your Web App API Credentials

1. In the Firebase Console, go to **Project Settings** (gear icon on the top-left navigation bar).
2. Scroll down to the **"Your apps"** section and click the **Web icon (`</>`)**.
3. Register your app with a nickname (e.g. `Kisan-Setu-Web`).
4. Copy the `firebaseConfig` object values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kisan-setu-auth.firebaseapp.com",
  projectId: "kisan-setu-auth",
  storageBucket: "kisan-setu-auth.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789",
  measurementId: "G-XXXXXXXXXX"
};
```

---

## 📝 Step 4: Update Your `.env` File

Open the [`.env`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env) file located in the root of your project and paste your actual Firebase values:

```env
# --- Firebase Authentication Connection Details ---
VITE_FIREBASE_API_KEY=AIzaSyYourActualApiKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Server-side Firebase Environment Variables
FIREBASE_API_KEY=AIzaSyYourActualApiKeyHere
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

---

## 📁 Firebase Authentication Files Created

The following ready-to-use modules have been created in your repository:

1. [`.env`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env): Pre-configured environment file template for your credentials.
2. [`.env.example`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/.env.example): Environment variable reference documentation.
3. [`src/lib/firebase.ts`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/src/lib/firebase.ts): Firebase App initialization & config validator.
4. [`src/lib/firebaseAuth.ts`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/src/lib/firebaseAuth.ts): Core authentication helpers (Phone OTP, Google OAuth, Email/Pass).
5. [`src/context/FirebaseAuthContext.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/kisan/Kisan/src/context/FirebaseAuthContext.tsx): React Auth Context & custom `useFirebaseAuth()` hook.

---

## 💡 Code Usage Examples in React

### 1. Wrapping your application in `main.tsx` or `App.tsx`:

```tsx
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';

function App() {
  return (
    <FirebaseAuthProvider>
      <YourAppComponents />
    </FirebaseAuthProvider>
  );
}
```

---

### 2. Using Phone OTP Login in a React Component:

```tsx
import React, { useState } from 'react';
import { useFirebaseAuth } from './context/FirebaseAuthContext';

export const PhoneLoginComponent = () => {
  const { sendOtp, verifyOtp, currentUser, logout } = useFirebaseAuth();
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const handleSendOtp = async () => {
    try {
      await sendOtp(phone);
      setStep('OTP');
      alert('OTP SMS Sent!');
    } catch (err: any) {
      alert(`Error sending OTP: ${err.message}`);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const user = await verifyOtp(otpCode);
      alert(`Logged in successfully! Phone: ${user.phoneNumber}`);
    } catch (err: any) {
      alert(`Invalid OTP: ${err.message}`);
    }
  };

  if (currentUser) {
    return (
      <div>
        <p>Logged in as: {currentUser.phoneNumber || currentUser.email}</p>
        <button onClick={logout}>Log Out</button>
      </div>
    );
  }

  return (
    <div>
      {step === 'PHONE' ? (
        <div>
          <input 
            type="tel" 
            placeholder="Enter mobile number" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <button onClick={handleSendOtp}>Send OTP SMS</button>
        </div>
      ) : (
        <div>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={otpCode} 
            onChange={(e) => setOtpCode(e.target.value)} 
          />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}
    </div>
  );
};
```

---

### 3. Using Google One-Click Sign-In:

```tsx
import { useFirebaseAuth } from './context/FirebaseAuthContext';

export const GoogleLoginButton = () => {
  const { loginWithGoogle } = useFirebaseAuth();

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log('Google login user:', user.displayName, user.email);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err.message);
    }
  };

  return <button onClick={handleGoogleLogin}>Sign in with Google</button>;
};
```

---

## 🔍 Verification & Testing

- Run TypeScript check to ensure clean compilation:
  ```bash
  npx tsc --noEmit
  ```
- Start the Vite Dev Server:
  ```bash
  npm run dev
  ```
