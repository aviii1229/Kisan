import React, { useState } from 'react';
import { Calculator, TrendingUp, Sparkles, Coins, Info, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const PriceBoard: React.FC = () => {
  const { mspCatalog, centres } = useApp();
  const { lang, t } = useLanguage();

  // Calculator State
  const [selectedCropId, setSelectedCropId] = useState<string>(
    mspCatalog.length > 0 ? mspCatalog[0].id : 'paddy-grade-a'
  );
  const [weight, setWeight] = useState<string>('50');

  const selectedCrop = mspCatalog.find(c => c.id === selectedCropId) || mspCatalog[0];

  // Try to find if there is a government bonus for this crop at the main centre
  const centreBonusObj = centres.length > 0
    ? centres[0].acceptedCrops.find(ac => ac.cropId === selectedCropId)
    : null;
  const bonus = centreBonusObj ? centreBonusObj.bonus : 0;

  const mspAmount = selectedCrop ? selectedCrop.msp : 0;
  const weightVal = parseFloat(weight) || 0;

  const baselineMspPayout = Math.round(weightVal * mspAmount);
  const bonusPayout = Math.round(weightVal * bonus);
  const totalPayout = baselineMspPayout + bonusPayout;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Heading Hero Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lifted border border-amber-700/40 flex flex-col md:flex-row items-center justify-between gap-4 paper-bg-texture">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-glow-amber">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl text-white leading-tight">
              Minimum Support Price (MSP) Catalog
            </h2>
            <p className="text-xs text-amber-100/90 mt-1 font-semibold">
              Guaranteed government procurement floor prices vs current open market benchmarks
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left col: Prices grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mspCatalog.map((c) => {
              const name = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
              
              return (
                <div key={c.id} className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-5 shadow-card hover:shadow-card-hover hover:border-agri-400/50 transition-all duration-300 space-y-3.5 hover:-translate-y-1 paper-bg-texture glow-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">{c.category} • {c.season}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {c.priceTrend}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3.5 font-bold">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Government MSP</span>
                      <span className="text-base font-extrabold text-agri-600 mt-1 block">
                        ₹{c.msp} <span className="text-[10px] text-slate-400 font-medium">/ {c.unit}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Market Avg</span>
                      <span className="text-base font-extrabold text-slate-700 mt-1 block">
                        ₹{c.marketAvg} <span className="text-[10px] text-slate-400 font-medium">/ {c.unit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[10px] text-slate-500 font-bold flex items-center justify-between">
                    <span>Moisture Standard:</span>
                    <span className="text-slate-700 font-extrabold">&lt; {c.maxMoisture}% limit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col: Calculator Estimator */}
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 paper-bg-texture">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Calculator className="w-5 h-5 text-agri-600" />
              {t('calculatorTitle')}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {t('payoutEstimator')}
            </p>

            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="text-slate-500 block">{t('selectCrop')}</label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white font-bold focus:outline-none focus:border-agri-500 transition-all cursor-pointer"
                >
                  {mspCatalog.map(c => {
                    const name = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
                    return <option key={c.id} value={c.id}>{name}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-slate-500 block">{t('weightQuintals')}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 border-2 border-slate-200 bg-white font-bold focus:outline-none focus:border-agri-500 transition-all"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            {/* Calculated payout card details */}
            <div className="bg-[#FFFDF8] border border-dashed border-agri-450 rounded-2xl p-4 space-y-3.5 text-xs font-semibold text-slate-650 shadow-xs">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 uppercase text-[9px] tracking-wide">
                {t('calculatedPayout')}
              </h4>
              
              <div className="flex items-center justify-between text-slate-600">
                <span>{t('mspRate')}:</span>
                <span className="font-bold text-slate-800">
                  ₹{mspAmount} × {weightVal} Qtls = ₹{baselineMspPayout.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>{t('bonusRate')}:</span>
                <span className="font-bold text-amber-600">
                  ₹{bonus} × {weightVal} Qtls = +₹{bonusPayout.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-slate-800 font-extrabold">{t('totalEstimatedPayout')}:</span>
                <span className="text-sm font-extrabold text-agri-600">
                  ₹{totalPayout.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-1.5 text-[10px] text-slate-400 font-bold leading-normal">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{t('disclaimer')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default PriceBoard;
