import React, { useEffect, useState } from 'react';
import { AlertCircle, X, BellRing, Info, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { playQueueChime } from '../utils/sound';

export const AlertBanner: React.FC = () => {
  const { announcements } = useApp();
  const { lang } = useLanguage();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [announcedIds, setAnnouncedIds] = useState<string[]>([]);

  const activeAlert = announcements.find(a => a.active && !dismissedIds.includes(a.id));

  useEffect(() => {
    if (activeAlert && !announcedIds.includes(activeAlert.id)) {
      setAnnouncedIds(prev => [...prev, activeAlert.id]);
      playQueueChime();
    }
  }, [activeAlert, announcedIds]);

  if (!activeAlert) return null;

  const title = lang === 'te' && activeAlert.title_te ? activeAlert.title_te : lang === 'hi' && activeAlert.title_hi ? activeAlert.title_hi : activeAlert.title;
  const message = lang === 'te' && activeAlert.message_te ? activeAlert.message_te : lang === 'hi' && activeAlert.message_hi ? activeAlert.message_hi : activeAlert.message;

  const severityColors = {
    info: 'bg-blue-500/10 border-blue-200 text-blue-900 border-l-4 border-l-blue-600',
    warning: 'bg-amber-500/10 border-amber-200 text-amber-900 border-l-4 border-l-amber-500',
    success: 'bg-emerald-500/10 border-emerald-200 text-emerald-900 border-l-4 border-l-emerald-600',
    alert: 'bg-rose-500/10 border-rose-200 text-rose-900 border-l-4 border-l-rose-600 animate-pulse'
  };

  const severityIcons = {
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    success: <BellRing className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    alert: <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
  };

  return (
    <div className={`border-b px-4 py-3 text-xs sm:text-sm font-extrabold transition-all duration-300 animate-fadeIn backdrop-blur-md ${severityColors[activeAlert.severity]}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {severityIcons[activeAlert.severity]}
          <div>
            <span className="font-black uppercase tracking-wider mr-2 font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/60 border border-current/20">{title}</span>
            <span className="font-semibold text-slate-800">{message}</span>
          </div>
        </div>
        <button
          onClick={() => setDismissedIds(prev => [...prev, activeAlert.id])}
          className="p-1.5 rounded-full hover:bg-black/10 text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
