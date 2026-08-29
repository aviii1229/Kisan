import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, MailOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead, farmer } = useApp();
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!farmer) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-agri-600 transition-all rounded-xl hover:bg-slate-100/80 cursor-pointer btn-active-press group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1 animate-bounce-soft shadow-xs">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-paper rounded-2xl shadow-lifted border border-slate-200 z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 bg-gradient-to-r from-agri-700 to-agri-800 text-white flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-300" />
              {t('notificationsTitle')}
            </h3>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MailOpen className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">{t('noNotifications')}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const title = lang === 'te' && n.title_te ? n.title_te : lang === 'hi' && n.title_hi ? n.title_hi : n.title;
                const message = lang === 'te' && n.message_te ? n.message_te : lang === 'hi' && n.message_hi ? n.message_hi : n.message;
                
                return (
                  <div
                    key={n.id}
                    className={`p-4 transition cursor-pointer text-xs space-y-1 ${
                      !n.read ? 'bg-[#FFFDF8] border-l-4 border-agri-500' : 'bg-paper'
                    }`}
                    onClick={() => !n.read && markNotificationRead(n.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{title}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium">{message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
