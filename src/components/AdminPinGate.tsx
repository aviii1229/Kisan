import React, { useState } from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const AdminPinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const { isAdminAuthed, adminPinError, verifyAdminPin, setUserRole, setActiveTab } = useApp();
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (isAdminAuthed) return <>{children}</>;

  const handleSubmit = async () => {
    setLoading(true);
    const ok = await verifyAdminPin(pin);
    setLoading(false);
    if (!ok) setPin('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="paper-card rounded-3xl p-8 text-center space-y-5 shadow-lifted">
        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('officerPin')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('enterPin')}</p>
        </div>

        {adminPinError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3">
            {adminPinError}
          </div>
        )}

        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-center text-lg font-mono font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-agri-500"
            autoFocus
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? '...' : t('unlockPortal')}
        </button>

        <button
          onClick={() => {
            setUserRole('farmer');
            setActiveTab('centres');
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
        >
          {t('farmerMode')}
        </button>

        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
          Demo PIN is <span className="font-mono font-bold">1234</span> unless the server was started with a custom{' '}
          <span className="font-mono">ADMIN_PIN</span> environment variable.
        </p>
      </div>
    </div>
  );
};
