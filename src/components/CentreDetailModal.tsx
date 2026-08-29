import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, Info, Clock, User, Phone, MapPin, BadgePercent, ShieldAlert, Award } from 'lucide-react';
import { ProcurementCentre } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CentreDetailModalProps {
  centre: ProcurementCentre;
  onClose: () => void;
  onBook: () => void;
}

export const CentreDetailModal: React.FC<CentreDetailModalProps> = ({ centre, onClose, onBook }) => {
  const { lang, t } = useLanguage();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const name = lang === 'te' && centre.name_te ? centre.name_te : lang === 'hi' && centre.name_hi ? centre.name_hi : centre.name;
  const type = lang === 'te' && centre.type_te ? centre.type_te : lang === 'hi' && centre.type_hi ? centre.type_hi : centre.type;
  const statusReason = lang === 'te' && centre.statusReason_te ? centre.statusReason_te : lang === 'hi' && centre.statusReason_hi ? centre.statusReason_hi : centre.statusReason;

  const statusColors = {
    open: 'bg-green-50 border-green-200 text-green-800',
    closed: 'bg-red-50 border-red-200 text-red-800',
    break: 'bg-amber-50 border-amber-200 text-amber-800',
    quota_full: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const statusLabels = {
    open: t('markOpen'),
    closed: t('markClosed'),
    break: t('markBreak'),
    quota_full: t('markQuotaFull')
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-0 sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FFFDF8] sm:rounded-3xl shadow-lifted w-full max-w-2xl relative animate-fadeIn overflow-hidden min-h-screen sm:min-h-0 sm:my-8 border border-slate-200 flex flex-col paper-bg-texture"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-agri-800 to-agri-900 px-6 py-5 text-white flex justify-between items-start sticky top-0 z-10">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                {type}
              </span>
              <h2 className="text-lg sm:text-xl font-bold mt-1.5 leading-snug">{name}</h2>
              <p className="text-xs text-agri-100 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {centre.address}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {/* Status Alert Banner */}
            <div className={`border rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm font-semibold ${statusColors[centre.status]}`}>
              {centre.status === 'open' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <span className="font-extrabold uppercase">{statusLabels[centre.status]}</span> — {statusReason}
              </div>
            </div>

            {/* Operating Times & Contact Nodal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-agri-600" />
                  Timings & Schedule
                </h3>
                <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                  <p><strong>Open Hours:</strong> {centre.timings.open} - {centre.timings.close}</p>
                  <p><strong>Lunch Break:</strong> {centre.timings.lunchBreak}</p>
                  <p><strong>Working Days:</strong> {centre.timings.workingDays}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-4 h-4 text-agri-600" />
                  {t('contactOfficer')}
                </h3>
                <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                  <p><strong>Name:</strong> {centre.contact.officerName}</p>
                  <p className="flex items-center gap-1"><strong>Phone:</strong> {centre.contact.phone}</p>
                  <p><strong>Helpdesk:</strong> {centre.contact.helpdesk}</p>
                </div>
              </div>
            </div>

            {/* Accepted Crops & Quotas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Crop Procurement Quotas & MSP Rates
              </h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {centre.acceptedCrops.map((c) => {
                  const cropName = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
                  const percent = Math.min(100, Math.round((c.procuredTodayQuintals / c.dailyQuotaQuintals) * 100));
                  return (
                    <div key={c.cropId} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFFDF8]/40">
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">{cropName}</span>
                        <span className="text-xs font-bold text-agri-600 mt-1 flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          MSP: ₹{c.msp}/Qtl
                          {c.bonus > 0 && <span className="text-amber-600 font-extrabold">(+₹{c.bonus} Bonus)</span>}
                        </span>
                      </div>
                      <div className="sm:text-right space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
                          Procured Today: {c.procuredTodayQuintals} / {c.dailyQuotaQuintals} Qtls ({percent}%)
                        </span>
                        <div className="w-full sm:w-44 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-100">
                          <div className={`h-full ${percent >= 100 ? 'bg-red-500' : 'bg-agri-500'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Facilities Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {t('facilitiesLabel')}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.coveredYard ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('coveredYard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.electronicWeighbridge ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('weighbridge')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.moistureTestingLab ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('moistureLab')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.drinkingWater ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('drinkingWater')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.canteen ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('canteenLabel')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${centre.facilities.restingShed ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{t('restingShed')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onBook}
              disabled={centre.status === 'closed' || centre.status === 'quota_full'}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                centre.status === 'closed' || centre.status === 'quota_full'
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-agri-600 hover:bg-agri-500 text-white shadow-md shadow-agri-600/10'
              }`}
            >
              {t('bookTokenBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
