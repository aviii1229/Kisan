import React from 'react';
import { Landmark, TrendingUp, Scale, Settings, Users, Clock, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const AnalyticsModal: React.FC = () => {
  const { analytics } = useApp();
  const { lang, t } = useLanguage();

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-slate-400 font-semibold">
        <Loader className="w-8 h-8 mx-auto animate-spin mb-3 text-agri-600" />
        Loading analytics metrics...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-paper rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            {t('analyticsDashboard')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time procurement indicators and direct benefits disbursal statistics
          </p>
        </div>
      </div>

      {/* Statewide Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-agri-50 border border-agri-100 flex items-center justify-center text-agri-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              {t('totalProcured')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5 block">
              {analytics.totalProcuredQuintals.toLocaleString()} Qtls
            </span>
          </div>
        </div>

        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              Procurement Target
            </span>
            <span className="text-base sm:text-lg font-extrabold text-agri-600 mt-0.5 block">
              {analytics.procurementPercentage}% Met
            </span>
          </div>
        </div>

        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              Active Queue Size
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5 block">
              {analytics.totalActiveTokens} Vehicles
            </span>
          </div>
        </div>

        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
              {t('activeCentres')}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5 block">
              {analytics.openCentresCount} / {analytics.totalCentres}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Stats (Simulated Mock Logs) */}
        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Landmark className="w-5 h-5 text-agri-600" />
            {t('districtProcurement')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-semibold text-slate-600">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-left uppercase text-[10px] tracking-wide">
                  <th className="pb-2">District</th>
                  <th className="pb-2 text-right">Volume (Qtls)</th>
                  <th className="pb-2 text-right">Tokens Issued</th>
                  <th className="pb-2 text-right">Avg Wait Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 font-bold text-slate-800">Gorakhpur</td>
                  <td className="py-3 text-right">6,500</td>
                  <td className="py-3 text-right">145</td>
                  <td className="py-3 text-right text-agri-600 font-bold">25 mins</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-800">Basti</td>
                  <td className="py-3 text-right">5,400</td>
                  <td className="py-3 text-right">120</td>
                  <td className="py-3 text-right text-agri-600 font-bold">35 mins</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-slate-800">Sant Kabir Nagar</td>
                  <td className="py-3 text-right">3,500</td>
                  <td className="py-3 text-right">80</td>
                  <td className="py-3 text-right text-agri-600 font-bold">20 mins</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Crop Distribution Stats */}
        <div className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <TrendingUp className="w-5 h-5 text-agri-600" />
            {t('cropDistribution')}
          </h3>

          <div className="space-y-4 text-xs font-semibold text-slate-600">
            {analytics.cropStats && analytics.cropStats.length > 0 ? (
              analytics.cropStats.map(c => {
                const totalProcuredSum = analytics.cropStats.reduce((acc, curr) => acc + curr.totalProcured, 0);
                const percent = Math.min(100, Math.round((c.totalProcured / (totalProcuredSum || 1)) * 100));
                const cropLabel = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
                
                return (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{cropLabel}</span>
                      <span>{c.totalProcured.toLocaleString()} Qtls ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-agri-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No commodity procurement logs available.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default AnalyticsModal;
