import React, { useState } from 'react';
import { CheckCircle2, Ticket, Scale, DollarSign, Clock, HelpCircle, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export const LiveQueueTracker: React.FC = () => {
  const { activeToken, allTokens, centres, setViewPassToken } = useApp();
  const { lang, t } = useLanguage();

  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    activeToken ? activeToken.centreId : centres[0]?.id || ''
  );

  const centre = centres.find(c => c.id === selectedCentreId) || centres[0];
  const centreTokens = allTokens.filter(t => t.centreId === selectedCentreId && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

  const stages = [
    { key: 'BOOKED', label: t('stage_BOOKED') },
    { key: 'CHECKED_IN', label: t('stage_CHECKED_IN') },
    { key: 'TESTING', label: t('stage_TESTING') },
    { key: 'WEIGHING', label: t('stage_WEIGHING') },
    { key: 'PAID', label: t('stage_PAID') }
  ];

  const getStageIndex = (status: string) => {
    if (status === 'COMPLETED') return 5;
    if (status === 'PAID') return 4;
    if (status === 'WEIGHING') return 3;
    if (status === 'TESTING') return 2;
    if (status === 'CHECKED_IN') return 1;
    return 0; // BOOKED
  };

  const currentStageIndex = activeToken ? getStageIndex(activeToken.status) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Tracker Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle cols: Active Token Queue Progress Stepper */}
        <div className="lg:col-span-2 space-y-6">
          {activeToken ? (
            <div className="bg-[#FFFDF8] border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all duration-300 space-y-6 paper-bg-texture glow-hover">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">
                    Active Delivery Token
                  </span>
                  <h2 className="font-mono text-2xl font-black text-slate-900 tracking-wider">
                    {activeToken.tokenNumber}
                  </h2>
                </div>
                <button
                  onClick={() => setViewPassToken(activeToken)}
                  className="px-4 py-2 border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all btn-active-press cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Ticket className="w-4 h-4 text-slate-500" />
                  {t('viewPassBtn')}
                </button>
              </div>

              {/* Status Stepper */}
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 text-xs">
                {/* Horizontal line for desktop */}
                <div className="absolute left-[18px] top-4 bottom-4 md:left-0 md:right-0 md:top-[18px] md:bottom-auto h-[70%] md:h-1 bg-slate-200 z-0 rounded-full" />
                <div
                  className="absolute left-[18px] top-4 md:left-0 md:top-[18px] md:bottom-auto h-1 bg-agri-600 z-0 transition-all duration-500 hidden md:block rounded-full"
                  style={{ width: `${(currentStageIndex / 4) * 100}%` }}
                />

                {stages.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isActive = idx === currentStageIndex;
                  
                  return (
                    <div key={stage.key} className="flex md:flex-col items-center gap-4 md:gap-2.5 z-10 w-full md:text-center">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold font-mono transition-all duration-300 shadow-xs ${
                        isCompleted
                          ? 'bg-agri-600 border-agri-700 text-white'
                          : isActive
                          ? 'bg-amber-500 border-amber-600 text-white scale-110 shadow-md ring-4 ring-amber-50 animate-pulse'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[11px] transition-all duration-300 ${
                        isActive
                          ? 'text-slate-900 font-extrabold'
                          : isCompleted
                          ? 'text-slate-700 font-bold'
                          : 'text-slate-400 font-bold'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Moisture & DBT Stats logs inside current token */}
              {(activeToken.moistureMeasured != null || activeToken.netPayableAmount != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs font-bold text-slate-700">
                  {activeToken.moistureMeasured != null && (
                    <div className="bg-[#FFFDF8] border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-slate-500">Quality / Moisture Level:</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {activeToken.moistureMeasured}% ({activeToken.gradeAssigned || 'Standard'})
                      </span>
                    </div>
                  )}
                  {activeToken.netPayableAmount != null && (
                    <div className="bg-[#FFFDF8] border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-slate-500">Net Payable Amount (DBT):</span>
                      <span className="text-sm font-extrabold text-agri-600">
                        ₹{activeToken.netPayableAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#FFFDF8] border border-slate-200 rounded-3xl p-10 shadow-sm text-center space-y-4 paper-bg-texture">
              <Ticket className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <h3 className="font-display font-bold text-slate-800 text-base">No Active Tokens Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-semibold">
                  When you book a digital E-Pass delivery token, its live queue and validation status updates will display here.
                </p>
              </div>
            </div>
          )}

          {/* Mandi detail / timings summary */}
          {centre && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-xs space-y-4 font-bold text-slate-700">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Landmark className="w-4 h-4 text-agri-600" />
                Mandi Operational Schedule
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-600">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Mandi Name</span>
                  <span className="text-slate-800 block mt-1">{centre.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Hours</span>
                  <span className="text-slate-800 block mt-1">{centre.timings.open} - {centre.timings.close}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Lunch Break</span>
                  <span className="text-slate-800 block mt-1">{centre.timings.lunchBreak}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Daily Wait Time</span>
                  <span className="text-slate-800 block mt-1">{centre.queue.estimatedWaitTimeMinutes} mins avg</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right col: Mandi Queue Panel */}
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 paper-bg-texture">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm">
                Queue Yard Tracker
              </h3>
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="w-full mt-2 px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white font-bold text-xs focus:outline-none focus:border-agri-500 cursor-pointer"
              >
                {centres.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Serving details */}
            <div className="bg-[#FFFDF8] border border-dashed border-agri-400 rounded-2xl p-4 flex items-center justify-between text-xs font-semibold text-slate-600 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-agri-600 animate-spin" style={{ animationDuration: '12s' }} />
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">
                    Now Calling
                  </span>
                  <span className="font-mono font-extrabold text-sm text-slate-800">
                    {centre?.queue.currentlyServingToken || 'None'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">
                  In Queue
                </span>
                <span className="font-bold text-slate-800">
                  {centreTokens.length} vehicles
                </span>
              </div>
            </div>

            {/* Queue list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {centreTokens.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  Queue is clear. No vehicles waiting.
                </div>
              ) : (
                centreTokens.map((t, idx) => (
                  <div 
                    key={t.tokenNumber} 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">#{idx + 1}</span>
                      <div>
                        <span className="font-mono font-bold text-slate-850 block">{t.tokenNumber}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{t.vehicleNumber}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[9px] font-extrabold font-mono">
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default LiveQueueTracker;
