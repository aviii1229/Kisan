import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <FirebaseAuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </FirebaseAuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
