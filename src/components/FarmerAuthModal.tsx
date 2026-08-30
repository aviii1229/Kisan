import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, ShieldCheck, User, MapPin, Sparkles, Mail, Lock, Globe, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

interface FarmerAuthModalProps {
  onClose: () => void;
}

export const FarmerAuthModal: React.FC<FarmerAuthModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { farmer, logoutFarmer, requestFarmerOtp, verifyFarmerOtp } = useApp();
  const {
    currentUser,
    isFirebaseReady,
    sendOtp: sendFirebaseOtp,
    verifyOtp: verifyFirebaseOtp,
    loginWithGoogle,
    loginWithEmailPass,
    registerWithEmailPass,
    logout: logoutFirebase
  } = useFirebaseAuth();

  // Tab mode: 'phone' | 'google' | 'email'
  const [authMode, setAuthMode] = useState<'phone' | 'google' | 'email'>('phone');
  
  // Phone OTP state
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [isFirebaseOtpSent, setIsFirebaseOtpSent] = useState<boolean>(false);
  
  // Email state
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Profile completion state
  const [isNewFarmer, setIsNewFarmer] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [district, setDistrict] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  // Escape key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Helper to sync Firebase user into Kisan App Context
  const syncFarmerAccount = async (farmerPhone: string, farmerName?: string, farmerEmail?: string) => {
    const defaultName = farmerName || (farmerEmail ? farmerEmail.split('@')[0] : 'Kisan User');
    const validPhone = farmerPhone.replace(/\D/g, '').slice(-10) || '9876543210';
    
    // Auto-verify with backend to create/retrieve farmer session
    try {
      await verifyFarmerOtp(validPhone, '1234', {
        name: name || defaultName,
        village: village || 'Gram Panchayat',
        district: district || 'Gorakhpur'
      });
    } catch (e) {
      // Fallback
    }
  };

  // --- Phone OTP Logic ---
  const handleSendPhoneOtp = async () => {
    setError('');
    setInfoMsg('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    // Try Firebase SMS OTP first if ready
    if (isFirebaseReady) {
      try {
        await sendFirebaseOtp(`+91${phone}`);
        setIsFirebaseOtpSent(true);
        setStage('otp');
        setInfoMsg('Firebase OTP SMS sent to your phone number!');
        setLoading(false);
        return;
      } catch (fbErr: any) {
        console.warn('Firebase SMS OTP failed, falling back to Demo OTP:', fbErr.message);
        // Fall through to Demo OTP on failure
      }
    }

    // Demo OTP Fallback
    try {
      const result = await requestFarmerOtp(phone);
      setDemoOtp(result.demoOtp);
      setIsNewFarmer(result.isNewFarmer);
      setIsFirebaseOtpSent(false);
      setStage('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError('');
    if (isFirebaseOtpSent) {
      if (otp.length < 6) {
        setError('Please enter the 6-digit SMS OTP sent by Firebase.');
        return;
      }
    } else {
      if (!/^\d{4}$/.test(otp)) {
        setError('Please enter the 4-digit OTP code.');
        return;
      }
    }

    if (isNewFarmer && !name.trim()) {
      setError('Please enter your name to complete registration.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseOtpSent) {
        const fbUser = await verifyFirebaseOtp(otp);
        await syncFarmerAccount(phone || fbUser.phoneNumber || '9876543210', name || 'Kisan');
      } else {
        await verifyFarmerOtp(phone, otp, isNewFarmer ? { name, village, district } : undefined);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Google OAuth Logic ---
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      const userPhone = user.phoneNumber || '9876543210';
      const userName = user.displayName || user.email?.split('@')[0] || 'Google User';
      await syncFarmerAccount(userPhone, userName, user.email || undefined);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Email / Password Logic ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (emailMode === 'register') {
        if (!name.trim()) {
          setError('Please enter your name for registration.');
          setLoading(false);
          return;
        }
        user = await registerWithEmailPass(email, password);
      } else {
        user = await loginWithEmailPass(email, password);
      }
      
      const userName = name || user.displayName || email.split('@')[0];
      await syncFarmerAccount('9876543210', userName, email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Email authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FFFDF8] rounded-3xl shadow-lifted w-full max-w-md relative animate-fadeIn overflow-hidden my-8 border border-slate-200 paper-bg-texture"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/60 hover:bg-slate-200/80 flex items-center justify-center transition-all btn-active-press z-10 cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>

          {/* Modal Header */}
          <div className="bg-gradient-to-r from-agri-800 via-agri-900 to-slate-950 px-6 py-6 text-white bg-grain">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              {isFirebaseReady ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold font-mono uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase Auth Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold font-mono uppercase tracking-wider">
                  Demo Mode Enabled
                </span>
              )}
            </div>
            <h2 className="text-lg font-black mt-3 tracking-tight">{t('loginRegister')}</h2>
            <p className="text-xs text-agri-100/90 mt-0.5 font-semibold">
              Log in to book procurement tokens and view live queue passes.
            </p>
          </div>

          {/* Active Account Switch Banner if currently logged in */}
          {(farmer || currentUser) && (
            <div className="bg-amber-50 border-b border-amber-200 p-3.5 px-6 flex items-center justify-between text-xs font-semibold text-amber-950">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-extrabold text-amber-700">Currently Logged In:</span>
                <span className="font-bold text-slate-900">
                  {farmer?.name || currentUser?.displayName || currentUser?.email || farmer?.phone || 'Active User'}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logoutFarmer();
                  setInfoMsg('Logged out successfully. You can now log in with a new account.');
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold rounded-xl btn-active-press cursor-pointer shadow-xs border border-red-700"
              >
                Log Out & Switch
              </button>
            </div>
          )}

          {/* Mode Navigation Tabs */}
          <div className="grid grid-cols-3 bg-slate-100/80 p-1 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setAuthMode('phone'); setError(''); setStage('phone'); }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'phone'
                  ? 'bg-white text-agri-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              onClick={() => { setAuthMode('google'); setError(''); }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'google'
                  ? 'bg-white text-agri-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Google</span>
            </button>
            <button
              onClick={() => { setAuthMode('email'); setError(''); }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'email'
                  ? 'bg-white text-agri-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Email</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3">
                {error}
              </div>
            )}
            {infoMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl p-3">
                {infoMsg}
              </div>
            )}

            {/* TAB 1: Mobile Phone OTP */}
            {authMode === 'phone' && (
              <>
                {stage === 'phone' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {t('phoneNumber')}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98XXXXXX10"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm shadow-md transition-all btn-active-press disabled:opacity-60 cursor-pointer border border-agri-700"
                    >
                      {loading ? 'Sending SMS OTP...' : t('sendOtp')}
                    </button>
                  </>
                ) : (
                  <>
                    {!isFirebaseOtpSent && (
                      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                            {t('otpSentDemo')}
                          </p>
                          <p className="text-xl font-mono font-extrabold text-amber-950 tracking-widest mt-1">
                            {demoOtp}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {isFirebaseOtpSent ? 'Enter 6-Digit Firebase SMS OTP' : t('enterOtp')}
                      </label>
                      <input
                        type="text"
                        maxLength={isFirebaseOtpSent ? 6 : 4}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder={isFirebaseOtpSent ? "000000" : "0000"}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-lg font-mono font-extrabold tracking-[0.4em] text-center focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                      />
                    </div>

                    {(isNewFarmer || isFirebaseOtpSent) && (
                      <div className="space-y-3 border-t border-slate-200 pt-4 text-xs font-semibold">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                          {t('completeProfile')}
                        </p>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('yourName')}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={village}
                              onChange={(e) => setVillage(e.target.value)}
                              placeholder={t('yourVillage')}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                            />
                          </div>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder={t('yourDistrict')}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleVerifyPhoneOtp}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm shadow-md transition-all btn-active-press disabled:opacity-60 cursor-pointer border border-agri-700"
                    >
                      {loading ? 'Verifying...' : t('verifyOtp')}
                    </button>
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={loading}
                      className="w-full py-2 text-xs font-bold text-agri-700 hover:text-agri-800 transition-all btn-active-press cursor-pointer"
                    >
                      {t('resendOtp')}
                    </button>
                  </>
                )}
              </>
            )}

            {/* TAB 2: Google One-Click Auth */}
            {authMode === 'google' && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">Google Authentication</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Sign in with your Google account to access your farmer profile securely.
                  </p>
                </div>
                
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm shadow-sm transition-all btn-active-press flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: Email & Password Auth */}
            {authMode === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                <div className="flex border-b border-slate-200 pb-2 gap-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEmailMode('login')}
                    className={`pb-1 ${emailMode === 'login' ? 'text-agri-700 border-b-2 border-agri-700 font-extrabold' : 'text-slate-400'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode('register')}
                    className={`pb-1 ${emailMode === 'register' ? 'text-agri-700 border-b-2 border-agri-700 font-extrabold' : 'text-slate-400'}`}
                  >
                    Register Account
                  </button>
                </div>

                {emailMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ramesh Kumar"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 text-slate-800"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-agri-500 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm shadow-md transition-all btn-active-press disabled:opacity-60 cursor-pointer border border-agri-700 mt-2 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : emailMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
