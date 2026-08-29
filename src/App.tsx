import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { useLanguage } from './context/LanguageContext';

// Components
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { VoiceAssistant } from './components/VoiceAssistant';
import { CentreCard } from './components/CentreCard';
import { CentreDetailModal } from './components/CentreDetailModal';
import { MandiMapView } from './components/MandiMapView';
import { TokenBookingModal } from './components/TokenBookingModal';
import { LiveQueueTracker } from './components/LiveQueueTracker';
import { PriceBoard } from './components/PriceBoard';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminPinGate } from './components/AdminPinGate';
import { FarmerAuthModal } from './components/FarmerAuthModal';
import { TokenPassModal } from './components/TokenPassModal';

// Icons
import { Landmark, Search, MapPin, Globe, Sparkles, AlertCircle, SlidersHorizontal } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    centres,
    userRole,
    setUserRole,
    farmer,
    viewPassToken,
    setViewPassToken,
    searchQuery,
    setSearchQuery,
    selectedCrop,
    setSelectedCrop,
    selectedDistrict,
    setSelectedDistrict,
    selectedStatus,
    setSelectedStatus,
    selectedRadius,
    setSelectedRadius,
    detectUserLocation,
    isLocating,
    loading
  } = useApp();

  const { t } = useLanguage();

  // Local Modal States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminGateOpen, setIsAdminGateOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [detailCentre, setDetailCentre] = useState<any>(null);
  const [bookingCentre, setBookingCentre] = useState<any>(null);

  // Extract unique districts from centres list for filter options
  const districtsList = Array.from(new Set(centres.map(c => c.district)));

  // Crops list for filter options
  const cropsList = [
    { id: 'paddy-grade-a', name: 'Paddy (Grade A)' },
    { id: 'paddy-common', name: 'Paddy (Common)' },
    { id: 'wheat', name: 'Wheat' },
    { id: 'maize', name: 'Maize' },
    { id: 'cotton-long', name: 'Cotton' },
    { id: 'soyabean', name: 'Soyabean' },
    { id: 'chilli', name: 'Red Chilli' },
    { id: 'turmeric', name: 'Turmeric' }
  ];

  return (
    <div className="min-h-screen bg-paper bg-gradient-app-shell flex flex-col font-sans text-ink selection:bg-amber-200 paper-bg-texture">
      {/* Top Level Sticky Header Container */}
      <header className="sticky top-0 z-50 w-full shadow-xs">
        <Navbar
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenAdminGate={() => {
            setUserRole('admin');
            setActiveTab('admin');
          }}
        />
        <AlertBanner />
      </header>

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'admin' ? (
          /* Secure Officer Portal Panel */
          <AdminPinGate>
            <AdminDashboard />
          </AdminPinGate>
        ) : (
          /* Farmer Portal Layout */
          <>
            {activeTab === 'centres' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                
                {/* Hero Showcase Banner */}
                <div className="bg-gradient-to-r from-agri-950 via-agri-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-lifted border border-agri-700/40 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold font-mono uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        Live Mandi Procurement Network
                      </div>
                      <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                        Smart Crop Procurement & Slot Scheduling
                      </h1>
                      <p className="text-xs sm:text-sm text-agri-100/90 leading-relaxed font-semibold">
                        Direct connection to government procurement yards. Check queue status, compare MSP benchmarks, and book instant digital delivery passes.
                      </p>
                    </div>

                    {/* Live Metric Badges */}
                    <div className="flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>5 Centres Open Today</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Paddy MSP: ₹2,300/Qtl</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Board */}
                <div className="bg-[#FFFDF8] rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-card space-y-4 paper-bg-texture glow-hover">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-xs font-extrabold text-slate-800 focus:outline-none focus:border-agri-500 focus:ring-4 focus:ring-agri-500/15 transition-all shadow-xs"
                      />
                    </div>

                    {/* Proximity Location Button */}
                    <button
                      onClick={detectUserLocation}
                      disabled={isLocating}
                      className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all btn-active-press cursor-pointer flex items-center justify-center gap-2 border border-slate-950 disabled:opacity-60"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      {isLocating ? t('locating') : t('useLocationBtn')}
                    </button>
                  </div>

                  {/* Quick Preset Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider mr-1">Quick:</span>
                    <button
                      onClick={() => { setSelectedCrop('all'); setSelectedStatus('all'); setSelectedRadius('all'); setSelectedDistrict('all'); }}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${
                        selectedCrop === 'all' && selectedStatus === 'all' && selectedRadius === 'all' && selectedDistrict === 'all'
                          ? 'bg-agri-700 text-white border-agri-800 shadow-xs'
                          : 'bg-slate-100/70 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      All Mandis
                    </button>
                    <button
                      onClick={() => setSelectedStatus('open')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedStatus === 'open'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-100/70 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      Open Now
                    </button>
                    <button
                      onClick={() => setSelectedCrop('paddy-grade-a')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${
                        selectedCrop === 'paddy-grade-a'
                          ? 'bg-agri-700 text-white border-agri-800 shadow-xs'
                          : 'bg-slate-100/70 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      🌾 Paddy (Grade A)
                    </button>
                    <button
                      onClick={() => setSelectedCrop('wheat')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${
                        selectedCrop === 'wheat'
                          ? 'bg-agri-700 text-white border-agri-800 shadow-xs'
                          : 'bg-slate-100/70 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      🌾 Wheat
                    </button>
                    <button
                      onClick={() => setSelectedRadius('15')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${
                        selectedRadius === '15'
                          ? 'bg-agri-700 text-white border-agri-800 shadow-xs'
                          : 'bg-slate-100/70 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      📍 Within 15 km
                    </button>
                  </div>

                  {/* Mobile Filters Toggle Button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setIsFilterSheetOpen(!isFilterSheetOpen)}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl border border-slate-300 flex items-center justify-between transition-all btn-active-press"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-agri-600" />
                        <span>Advanced Filters</span>
                      </span>
                      <span className="text-[10px] bg-agri-600 text-white px-2 py-0.5 rounded-full font-mono">
                        {[selectedCrop, selectedDistrict, selectedStatus, selectedRadius].filter(v => v !== 'all').length > 0
                          ? `${[selectedCrop, selectedDistrict, selectedStatus, selectedRadius].filter(v => v !== 'all').length} Active`
                          : 'All'}
                      </span>
                    </button>
                  </div>

                  {/* Dropdowns filtering row (Collapsible on mobile, grid on desktop) */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-slate-700 ${isFilterSheetOpen ? 'block' : 'hidden md:grid'}`}>
                    <div>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-800 focus:outline-none focus:border-agri-500 focus:ring-2 focus:ring-agri-500/15 transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="all">{t('cropFilter')}</option>
                        {cropsList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-800 focus:outline-none focus:border-agri-500 focus:ring-2 focus:ring-agri-500/15 transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="all">{t('districtFilter')}</option>
                        {districtsList.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-800 focus:outline-none focus:border-agri-500 focus:ring-2 focus:ring-agri-500/15 transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="all">{t('statusFilter')}</option>
                        <option value="open">{t('markOpen')}</option>
                        <option value="break">{t('markBreak')}</option>
                        <option value="quota_full">{t('markQuotaFull')}</option>
                        <option value="closed">{t('markClosed')}</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedRadius}
                        onChange={(e) => setSelectedRadius(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-extrabold text-slate-800 focus:outline-none focus:border-agri-500 focus:ring-2 focus:ring-agri-500/15 transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="all">{t('radiusFilter')}</option>
                        <option value="5">Within 5 km</option>
                        <option value="15">Within 15 km</option>
                        <option value="30">Within 30 km</option>
                        <option value="50">Within 50 km</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main page layout: Voice search alongside list */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Column Widgets */}
                  <div className="lg:col-span-1 space-y-6">
                    <VoiceAssistant />
                    
                    {/* Welcome card */}
                    <div className="bg-gradient-to-br from-agri-700 to-agri-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2">
                        <Landmark className="w-32 h-32" />
                      </div>
                      <h3 className="font-display font-black text-sm uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Kisan Setu E-Hub
                      </h3>
                      <p className="text-[11px] text-agri-100 mt-2 leading-relaxed font-semibold">
                        Access real-time Mandi schedules, book delivery appointments, estimate MSP payouts, and view live queue progress.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Mandi cards grid */}
                  <div className="lg:col-span-3">
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="bg-[#FFFDF8] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="h-4 skeleton-shimmer rounded-full w-1/3" />
                            <div className="h-6 skeleton-shimmer rounded-xl w-3/4" />
                            <div className="h-16 skeleton-shimmer rounded-2xl w-full" />
                            <div className="h-10 skeleton-shimmer rounded-xl w-full" />
                          </div>
                        ))}
                      </div>
                    ) : centres.length === 0 ? (
                      <div className="bg-paper border border-slate-200 rounded-3xl p-16 text-center space-y-2">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-slate-800 text-sm">No Procurement Centres Found</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          No matching procurement yards match your search keyword or selected filters. Try broadening filters.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {centres.map(centre => (
                          <CentreCard
                            key={centre.id}
                            centre={centre}
                            onOpenDetails={(c) => setDetailCentre(c)}
                            onOpenBooking={(c) => setBookingCentre(c)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <MandiMapView
                onOpenBooking={(c) => setBookingCentre(c)}
              />
            )}

            {activeTab === 'prices' && <PriceBoard />}

            {activeTab === 'queue' && <LiveQueueTracker />}

            {activeTab === 'analytics' && <AnalyticsModal />}
          </>
        )}
      </main>

      {/* Global Modals mounting */}
      {isLoginOpen && (
        <FarmerAuthModal onClose={() => setIsLoginOpen(false)} />
      )}


      {detailCentre && (
        <CentreDetailModal
          centre={detailCentre}
          onClose={() => setDetailCentre(null)}
          onBook={() => {
            setBookingCentre(detailCentre);
            setDetailCentre(null);
          }}
        />
      )}

      {bookingCentre && (
        <TokenBookingModal
          centre={bookingCentre}
          onClose={() => setBookingCentre(null)}
          onSuccess={(token) => {
            setBookingCentre(null);
            setViewPassToken(token);
            setActiveTab('queue');
          }}
        />
      )}

      {viewPassToken && (
        <TokenPassModal
          token={viewPassToken}
          onClose={() => setViewPassToken(null)}
        />
      )}
    </div>
  );
};
