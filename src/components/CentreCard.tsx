import React from 'react';
import { MapPin, Clock, Coins, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProcurementCentre } from '../types';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface CentreCardProps {
  centre: ProcurementCentre;
  onOpenDetails: (centre: ProcurementCentre) => void;
  onOpenBooking: (centre: ProcurementCentre) => void;
}

export const CentreCard: React.FC<CentreCardProps> = ({ centre, onOpenDetails, onOpenBooking }) => {
  const { lang, t } = useLanguage();
  const { farmer } = useApp();

  const name = lang === 'te' && centre.name_te ? centre.name_te : lang === 'hi' && centre.name_hi ? centre.name_hi : centre.name;
  const type = lang === 'te' && centre.type_te ? centre.type_te : lang === 'hi' && centre.type_hi ? centre.type_hi : centre.type;
  const statusReason = lang === 'te' && centre.statusReason_te ? centre.statusReason_te : lang === 'hi' && centre.statusReason_hi ? centre.statusReason_hi : centre.statusReason;

  const statusBadges = {
    open: 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-700 shadow-xs shadow-emerald-600/30',
    closed: 'bg-gradient-to-r from-clay-600 to-slate-800 text-white border-clay-700 shadow-xs',
    break: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-xs shadow-amber-500/30',
    quota_full: 'bg-gradient-to-r from-blue-600 to-slate-700 text-white border-blue-700 shadow-xs'
  };

  const statusLabels = {
    open: t('markOpen'),
    closed: t('markClosed'),
    break: t('markBreak'),
    quota_full: t('markQuotaFull')
  };

  const capacityPercent = Math.min(100, Math.round((centre.facilities.occupiedCapacityQuintals / centre.facilities.storageCapacityQuintals) * 100));

  return (
    <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:border-agri-400/50 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 group paper-bg-texture">
      {/* Card Header */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 text-slate-600 border-slate-200/80 font-mono">
            <span>🏛️</span>
            <span>{type}</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusBadges[centre.status]}`}>
            {centre.status === 'open' && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            )}
            {statusLabels[centre.status]}
          </span>
        </div>

        <h3 
          className="font-display font-black text-lg sm:text-xl text-slate-900 leading-snug cursor-pointer group-hover:text-agri-600 transition-colors" 
          onClick={() => onOpenDetails(centre)}
        >
          {name}
        </h3>

        {/* Address and Distance */}
        <div className="flex items-start text-xs text-slate-500 gap-1.5 pt-0.5">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-600 leading-relaxed">{centre.address}</p>
            {centre.distanceKm !== undefined && (
              <p className="text-emerald-700 font-extrabold mt-1 text-[11px] flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                {centre.distanceKm} km away from your location
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Capacity & Operating Info Grid */}
      <div className="grid grid-cols-2 gap-3 bg-slate-100/60 border border-slate-200/70 rounded-2xl p-3.5 text-xs font-bold text-slate-700">
        <div>
          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
            {t('operatingHours')}
          </span>
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mt-1 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-agri-600" />
            {centre.timings.open} - {centre.timings.close}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
            {t('storageLevel')}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-extrabold text-slate-800 text-[11px]">{capacityPercent}% Full</span>
            <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200/40 max-w-16">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${capacityPercent >= 90 ? 'bg-gradient-to-r from-clay-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-agri-600'}`} 
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Crops and MSP Tags */}
      <div className="space-y-2 text-xs">
        <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
          {t('acceptedCrops')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {centre.acceptedCrops.map((c) => {
            const cropName = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
            return (
              <span
                key={c.cropId}
                className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white text-slate-800 font-extrabold border border-slate-200 text-[10px] shadow-xs"
              >
                🌾 {cropName} <span className="ml-1 text-emerald-700 font-mono">(₹{c.msp})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Queue Progress Summary */}
      {centre.status === 'open' && (
        <div className="border-t border-slate-200/60 pt-3.5 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex items-center justify-center">
              <span className="w-full h-full rounded-full bg-emerald-500 absolute animate-ping opacity-75"></span>
            </div>
            <div>
              <span className="text-slate-400 font-extrabold uppercase text-[9px] block tracking-wide">
                {t('currentlyServing')}
              </span>
              <span className="font-mono font-black text-slate-900 text-xs">
                {centre.queue.currentlyServingToken || 'None'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] block tracking-wide">
              {t('avgWaitTime')}
            </span>
            <span className="font-extrabold text-slate-900 text-xs">
              ⚡ {centre.queue.estimatedWaitTimeMinutes} mins
            </span>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200/60 pt-4">
        <button
          onClick={() => onOpenDetails(centre)}
          className="py-2.5 px-3 border border-slate-300 hover:bg-slate-100/80 text-slate-800 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1 transition-all btn-active-press cursor-pointer shadow-xs"
        >
          View Details
        </button>

        <button
          onClick={() => onOpenBooking(centre)}
          disabled={centre.status === 'closed' || centre.status === 'quota_full'}
          className={`py-2.5 px-3 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1 transition-all btn-active-press cursor-pointer border ${
            centre.status === 'closed' || centre.status === 'quota_full'
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-agri-700 via-agri-600 to-teal-700 hover:from-agri-600 hover:to-teal-600 text-white border-agri-800 shadow-md shadow-agri-700/20 scale-[1.01]'
          }`}
        >
          {t('bookTokenBtn')}
        </button>
      </div>
    </div>
  );
};
export default CentreCard;
