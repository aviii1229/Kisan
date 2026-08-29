import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  Send,
  Plus,
  Scale,
  Droplets,
  Truck,
  DollarSign,
  Sparkles,
  Users,
  BellRing,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { CentreStatus, DigitalToken } from '../types';
import { playQueueChime } from '../utils/sound';

export const AdminDashboard: React.FC = () => {
  const {
    centres,
    allTokens,
    updateCentreStatus,
    updateCentreCrop,
    updateTokenStatus,
    callNextToken,
    broadcastAnnouncement,
    resetDemoData
  } = useApp();

  const { lang, t } = useLanguage();

  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    centres.length > 0 ? centres[0].id : 'PPC-TS-01'
  );
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);

  // Status edit state
  const [customReason, setCustomReason] = useState<string>('');
  const [customReasonTe, setCustomReasonTe] = useState<string>('');

  // Quality modal state
  const [selectedTokenForEdit, setSelectedTokenForEdit] = useState<DigitalToken | null>(null);
  const [moistureVal, setMoistureVal] = useState<string>('15.4');
  const [gradeVal, setGradeVal] = useState<string>('Grade-A Fine');
  const [weightVal, setWeightVal] = useState<string>('45.5');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState<string>('Heavy Rush Advisory - 2 Extra Counters Opened');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Additional weighbridge has been made active. Farmers waiting in Token range 40-70 can proceed to Shed-3.'
  );
  const [broadcastSeverity, setBroadcastSeverity] = useState<'info' | 'warning' | 'success' | 'alert'>('info');

  const centre = centres.find((c) => c.id === selectedCentreId) || centres[0];

  const centreTokens = allTokens.filter((t) => t.centreId === selectedCentreId);

  const handleStatusChange = async (status: CentreStatus) => {
    let defaultReason = '';
    let defaultReasonTe = '';

    if (status === 'open') {
      defaultReason = 'Procurement active. Electronic weighbridges functional.';
      defaultReasonTe = 'సేకరణ సాగుతోంది. వేబ్రిడ్జిలు పని చేస్తున్నాయి.';
    } else if (status === 'break') {
      defaultReason = 'Lunch break in progress. Operations resume at 02:00 PM.';
      defaultReasonTe = 'భోజన విరామం. మధ్యాహ్నం 2:00 గంటలకు పునఃప్రారంభం.';
    } else if (status === 'quota_full') {
      defaultReason = 'Daily intake quota filled. Re-opens tomorrow morning 8 AM.';
      defaultReasonTe = 'ఈ రోజు సేకరణ కోటా పూర్తయింది. రేపు ఉదయం 8 గంటలకు తిరిగి తెరువబడును.';
    } else {
      defaultReason = 'Centre closed for the day.';
      defaultReasonTe = 'సేకరణ కేంద్రం ఈ రోజుకు ముగిసినది.';
    }

    await updateCentreStatus(
      selectedCentreId,
      status,
      customReason || defaultReason,
      customReasonTe || defaultReasonTe
    );
    setCustomReason('');
    setCustomReasonTe('');
  };

  const handleCallNext = async () => {
    await callNextToken(selectedCentreId);
  };

  const handleProcessTokenQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTokenForEdit) return;

    const moisture = parseFloat(moistureVal) || 16.0;
    await updateTokenStatus(selectedTokenForEdit.tokenNumber, {
      status: 'TESTING',
      moistureMeasured: moisture,
      gradeAssigned: gradeVal
    });

    setSelectedTokenForEdit(null);
  };

  const handleProcessWeighment = async (token: DigitalToken) => {
    const wt = parseFloat(weightVal) || token.quantityQuintals;
    const rate = 2820; // MSP 2320 + 500
    const netAmount = Math.round(wt * rate);

    await updateTokenStatus(token.tokenNumber, {
      status: 'PAID',
      totalWeightQuintals: wt,
      netPayableAmount: netAmount
    });
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    await broadcastAnnouncement({
      centreId: centre ? centre.id : 'ALL',
      centreName: centre ? centre.name : 'All Centres',
      title: broadcastTitle,
      title_te: broadcastTitle,
      message: broadcastMessage,
      message_te: broadcastMessage,
      severity: broadcastSeverity
    });

    alert('Announcement successfully broadcasted to farmers!');
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  if (!centre) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                Officer Terminal
              </span>
              <span className="text-xs text-slate-400">Authenticated: {centre.contact.officerName}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold mt-0.5">
              {centre.name}
            </h2>
            <p className="text-xs text-slate-400">
              {centre.mandal}, {centre.district} • {centre.state}
            </p>
          </div>
        </div>

        {/* Center Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>

          <button
            onClick={() => resetDemoData()}
            className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition flex items-center space-x-1 cursor-pointer"
            title={t('resetSeed')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Control Strip: 1-Click Status Toggles & Call Next */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Centre Working Status Box */}
        <div className="lg:col-span-2 bg-paper rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-agri-600" />
              <span>{t('changeStatus')}</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                centre.status === 'open'
                  ? 'bg-emerald-100 text-emerald-900'
                  : centre.status === 'break'
                  ? 'bg-amber-100 text-amber-900'
                  : centre.status === 'quota_full'
                  ? 'bg-orange-100 text-orange-900'
                  : 'bg-rose-100 text-rose-900'
              }`}
            >
              Current: {centre.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleStatusChange('open')}
              className={`p-3 rounded-2xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                centre.status === 'open'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 hover:border-emerald-300 text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{t('markOpen')}</span>
            </button>

            <button
              onClick={() => handleStatusChange('break')}
              className={`p-3 rounded-2xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                centre.status === 'break'
                  ? 'border-amber-600 bg-amber-50 text-amber-900'
                  : 'border-slate-200 hover:border-amber-300 text-slate-700'
              }`}
            >
              <PauseCircle className="w-5 h-5 text-amber-600" />
              <span>{t('markBreak')}</span>
            </button>

            <button
              onClick={() => handleStatusChange('quota_full')}
              className={`p-3 rounded-2xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                centre.status === 'quota_full'
                  ? 'border-orange-600 bg-orange-50 text-orange-900'
                  : 'border-slate-200 hover:border-orange-300 text-slate-700'
              }`}
            >
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>{t('markQuotaFull')}</span>
            </button>

            <button
              onClick={() => handleStatusChange('closed')}
              className={`p-3 rounded-2xl border-2 font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                centre.status === 'closed'
                  ? 'border-rose-600 bg-rose-50 text-rose-900'
                  : 'border-slate-200 hover:border-rose-300 text-slate-700'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>{t('markClosed')}</span>
            </button>
          </div>

          {/* Optional reason message input */}
          <div className="pt-2">
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Add custom reason note for farmers (e.g. Weighbridge 2 under calibration, open at 2 PM)..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Big Call Next Action Box */}
        <div className="bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-amber-600/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
                Queue Station
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-paper/20">
                {centre.queue.activeQueueCount} Waiting
              </span>
            </div>

            <div className="mt-3">
              <div className="text-xs text-amber-100">Currently Serving</div>
              <div className="text-3xl sm:text-4xl font-black tracking-wider font-mono">
                {centre.queue.currentlyServingToken || 'None'}
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsCallingNext(true);
              await handleCallNext();
              setTimeout(() => setIsCallingNext(false), 800);
            }}
            disabled={isCallingNext}
            className={`mt-6 w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-sm sm:text-base shadow-xl transition-all btn-active-press flex items-center justify-center space-x-2 cursor-pointer ${
              isCallingNext ? 'animate-pulse ring-4 ring-amber-400/50' : ''
            }`}
          >
            {isCallingNext ? (
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
            )}
            <span>{isCallingNext ? 'Calling Token...' : t('callNextTokenBtn')}</span>
          </button>
        </div>
      </div>

      {/* Live Active Queue Management Table */}
      <div className="bg-paper rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-agri-600" />
            <span>{t('activeQueueTable')} ({centreTokens.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Real-time state sync with Farmer E-Pass
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">{t('tokenCol')}</th>
                <th className="p-3.5">{t('farmerCol')}</th>
                <th className="p-3.5">{t('cropCol')}</th>
                <th className="p-3.5">{t('vehicleCol')}</th>
                <th className="p-3.5">{t('stageCol')}</th>
                <th className="p-3.5">{t('actionCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {centreTokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No tokens booked for this centre yet.
                  </td>
                </tr>
              ) : (
                centreTokens.map((tok) => {
                  return (
                    <tr key={tok.tokenNumber} className="hover:bg-slate-50 font-medium">
                      {/* Token */}
                      <td className="p-3.5 font-bold font-mono text-sm text-slate-900">
                        {tok.tokenNumber}
                      </td>

                      {/* Farmer */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{tok.farmerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">+91 {tok.phone}</div>
                      </td>

                      {/* Crop */}
                      <td className="p-3.5">
                        <div className="font-bold text-agri-800">{tok.cropName}</div>
                        <div className="text-slate-500">{tok.quantityQuintals} Quintals</div>
                      </td>

                      {/* Vehicle */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-700">{tok.vehicleType}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tok.vehicleNumber}</div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tok.status === 'COMPLETED' || tok.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : tok.status === 'WEIGHING' || tok.status === 'TESTING'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : tok.status === 'CHECKED_IN'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          {tok.status === 'BOOKED' && (
                            <button
                              onClick={() =>
                                updateTokenStatus(tok.tokenNumber, { status: 'CHECKED_IN' })
                              }
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Gate In
                            </button>
                          )}

                          {tok.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => {
                                setSelectedTokenForEdit(tok);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Test Moisture
                            </button>
                          )}

                          {tok.status === 'TESTING' && (
                            <button
                              onClick={() =>
                                updateTokenStatus(tok.tokenNumber, { status: 'WEIGHING' })
                              }
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              To Weighbridge
                            </button>
                          )}

                          {tok.status === 'WEIGHING' && (
                            <button
                              onClick={() => handleProcessWeighment(tok)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              Approve & Pay
                            </button>
                          )}

                          {(tok.status === 'PAID' || tok.status === 'COMPLETED') && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid ₹{tok.netPayableAmount?.toLocaleString()}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Broadcast Tool */}
      <div className="bg-paper rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {t('broadcastAlertTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              Sends simulated SMS & Push notification banners to all registered farmers for this center
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('alertSubject')}
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="e.g. Rain Alert - Open yard unloading closed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Severity
              </label>
              <select
                value={broadcastSeverity}
                onChange={(e: any) => setBroadcastSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="alert">Critical Alert (Red)</option>
                <option value="success">Success / Bonus (Green)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t('alertBody')}
            </label>
            <textarea
              rows={2}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              placeholder="Enter message text..."
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{t('sendAlertBtn')}</span>
          </button>
        </form>
      </div>

      {/* Quality Moisture Modal */}
      {selectedTokenForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Moisture & Quality Inspection (Token: {selectedTokenForEdit.tokenNumber})
              </h3>
              <button
                onClick={() => setSelectedTokenForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessQualityModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Moisture Meter Reading (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="25"
                  required
                  value={moistureVal}
                  onChange={(e) => setMoistureVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-agri-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quality Grade Assigned
                </label>
                <select
                  value={gradeVal}
                  onChange={(e) => setGradeVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="Grade-A Super">Grade-A Super (FAQ Standard)</option>
                  <option value="Grade-A Normal">Grade-A Normal</option>
                  <option value="Grade-B Common">Grade-B Common</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedTokenForEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-agri-600 text-white text-xs font-bold"
                >
                  Save Quality Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function handleProcessQualityModal(e: React.FormEvent) {
    handleProcessTokenQuality(e);
  }
};
