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

  // Safety net: Escape always closes the modal
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
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/60 hover:bg-slate-200/80 flex items-center justify-center transition-all btn-active-press z-10 cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>

          <div className="bg-gradient-to-r from-agri-800 to-agri-900 px-6 py-6 text-white bg-grain">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {t('phoneNumber')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98XXXXXX10"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm shadow-md transition-all btn-active-press disabled:opacity-60 cursor-pointer border border-agri-700"
                >
                  {loading ? 'Sending...' : t('sendOtp')}
                </button>
              </>
            ) : (
              <>
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {t('enterOtp')}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-lg font-mono font-extrabold tracking-[0.4em] text-center focus:outline-none focus:border-agri-500 transition-all text-slate-800"
                  />
                </div>

                {isNewFarmer && (
                  <div className="space-y-3.5 border-t border-slate-200 pt-4 text-xs font-semibold">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {t('completeProfile')}
                    </p>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
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
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
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
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white font-bold text-sm shadow-md transition-all btn-active-press disabled:opacity-60 cursor-pointer border border-agri-700"
                >
                  {loading ? 'Verifying...' : t('verifyOtp')}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-2 text-xs font-bold text-agri-700 hover:text-agri-800 transition-all btn-active-press cursor-pointer"
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
