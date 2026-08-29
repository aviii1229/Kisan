import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, ShieldCheck, User, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface FarmerAuthModalProps {
  onClose: () => void;
}

export const FarmerAuthModal: React.FC<FarmerAuthModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { requestFarmerOtp, verifyFarmerOtp } = useApp();

  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [isNewFarmer, setIsNewFarmer] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Safety net: Escape always closes the modal, no matter what else
  // is going on with layout/scroll.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSendOtp = async () => {
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const result = await requestFarmerOtp(phone);
      setDemoOtp(result.demoOtp);
      setIsNewFarmer(result.isNewFarmer);
      setStage('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (!/^\d{4}$/.test(otp)) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    if (isNewFarmer && !name.trim()) {
      setError('Please enter your name to complete registration.');
      return;
    }
    setLoading(true);
    try {
      await verifyFarmerOtp(phone, otp, isNewFarmer ? { name, village, district } : undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Rendered via a portal straight into document.body so it always
  // covers the true viewport — mounting it inside the sticky, blurred
  // header would otherwise confine "fixed inset-0" to the header's own
  // small box instead of the full screen.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-paper rounded-3xl shadow-lifted w-full max-w-md relative animate-fadeIn overflow-hidden my-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition z-10 cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>

        <div className="bg-gradient-to-r from-agri-800 to-agri-900 px-6 py-6 text-white">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-lg font-bold">{t('loginRegister')}</h2>
          <p className="text-xs text-agri-100 mt-1">
            {stage === 'phone' ? t('enterPhone') : t('enterOtp')}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3">
              {error}
            </div>
          )}

          {stage === 'phone' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {t('phoneNumber')}
                </label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98XXXXXX10"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Sending...' : t('sendOtp')}
              </button>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                    {t('otpSentDemo')}
                  </p>
                  <p className="text-lg font-mono font-extrabold text-amber-900 tracking-widest mt-1">
                    {demoOtp}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {t('enterOtp')}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-agri-500"
                />
              </div>

              {isNewFarmer && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t('completeProfile')}
                  </p>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('yourName')}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder={t('yourVillage')}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={t('yourDistrict')}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Verifying...' : t('verifyOtp')}
              </button>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-2 text-xs font-semibold text-agri-700 hover:text-agri-900 transition cursor-pointer"
              >
                {t('resendOtp')}
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
