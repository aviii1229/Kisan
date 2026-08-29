import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type StatusType = 'open' | 'closed' | 'break' | 'quota_full';

interface BadgeProps {
  status: StatusType;
  customLabel?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, customLabel, className = '' }) => {
  const { t } = useLanguage();

  const statusBadges: Record<StatusType, string> = {
    open: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-700 shadow-xs shadow-emerald-600/30',
    closed: 'bg-gradient-to-r from-clay-600 to-slate-800 text-white border-clay-700 shadow-xs',
    break: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-xs shadow-amber-500/30',
    quota_full: 'bg-gradient-to-r from-blue-600 to-slate-700 text-white border-blue-700 shadow-xs'
  };

  const statusLabels: Record<StatusType, string> = {
    open: t('markOpen'),
    closed: t('markClosed'),
    break: t('markBreak'),
    quota_full: t('markQuotaFull')
  };

  const label = customLabel || statusLabels[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide transition-all ${statusBadges[status]} ${className}`}
    >
      {status === 'open' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
      )}
      {label}
    </span>
  );
};
export default Badge;
