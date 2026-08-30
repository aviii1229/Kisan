import React from 'react';
import { Menu, X, Landmark, User, Map, LineChart, FileText, Settings, Globe, Shield, Mic, Sparkles, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationBell } from './NotificationBell';
import { Language } from '../translations';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenAdminGate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenAdminGate }) => {
  const { activeTab, setActiveTab, farmer, logoutFarmer, isAdminAuthed, logoutAdmin, userRole, setUserRole, activeToken, myActiveTokens, setViewPassToken } = useApp();
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleTabClick = (tab: 'centres' | 'map' | 'prices' | 'queue' | 'analytics' | 'admin' | 'voice') => {
    if (tab === 'admin') {
      if (isAdminAuthed) {
        setUserRole('admin');
        setActiveTab('admin');
      } else {
        onOpenAdminGate();
      }
    } else {
      setUserRole('farmer');
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as Language);
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="w-full bg-paper/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => handleTabClick('centres')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-agri-700 via-agri-600 to-teal-500 flex items-center justify-center text-white text-lg shadow-md shadow-agri-600/20 group-hover:scale-105 group-hover:shadow-glow transition-all duration-300">
                🌾
              </div>
              <div>
                <span className="font-display font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 via-agri-950 to-agri-800 bg-clip-text text-transparent block leading-tight">
                  {t('appTitle')}
                </span>
                <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-widest block font-mono">
                  Kisan Setu • किसान सेतु
                </span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/60">
              <button
                onClick={() => handleTabClick('centres')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'centres' && userRole === 'farmer'
                    ? 'bg-gradient-to-r from-agri-700 to-agri-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Landmark className="w-4 h-4" />
                {t('centresTab')}
              </button>
              <button
                onClick={() => handleTabClick('map')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-gradient-to-r from-agri-700 to-agri-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Map className="w-4 h-4" />
                {t('mapTab')}
              </button>
              <button
                onClick={() => handleTabClick('prices')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'prices'
                    ? 'bg-gradient-to-r from-agri-700 to-agri-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <LineChart className="w-4 h-4" />
                {t('pricesTab')}
              </button>
              <button
                onClick={() => handleTabClick('queue')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-gradient-to-r from-agri-700 to-agri-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <FileText className="w-4 h-4" />
                {t('queueTab')}
              </button>
              <button
                onClick={() => handleTabClick('voice')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md shadow-purple-900/20 scale-[1.02]'
                    : 'text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>Voice AI</span>
                <span className="text-[8px] bg-purple-600 text-white font-mono px-1 rounded uppercase tracking-widest font-extrabold">NEW</span>
              </button>
              <button
                onClick={() => handleTabClick('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-agri-700 to-agri-600 text-white shadow-md shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('analyticsTab')}
              </button>
            </div>

            {/* User Settings & Auth Controls */}
            <div className="flex items-center space-x-2.5">
              {/* Language Selector */}
              <div className="relative flex items-center bg-[#FFFDF8] border border-slate-300 rounded-xl px-2 py-1 text-slate-700 focus-within:ring-2 focus-within:ring-agri-500">
                <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <select
                  value={lang}
                  onChange={handleLanguageChange}
                  className="bg-transparent text-xs font-bold focus:outline-none pr-1 cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="te">తెలుగు</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Active Token E-Pass Quick Button */}
              {(activeToken || myActiveTokens.length > 0) && (
                <button
                  onClick={() => setViewPassToken(activeToken || myActiveTokens[0])}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all btn-active-press flex items-center gap-1.5 cursor-pointer border border-amber-600 animate-fadeIn"
                  title="View Active Digital Token E-Pass"
                >
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline font-mono">{activeToken ? activeToken.tokenNumber : myActiveTokens[0]?.tokenNumber}</span>
                  <span className="text-[9px] bg-white/20 px-1 rounded uppercase tracking-wider font-extrabold">
                    {myActiveTokens.length > 1 ? `${myActiveTokens.length} Passes` : 'Pass'}
                  </span>
                </button>
              )}

              {/* Farmer Account / Auth Button */}
              {farmer ? (
                <div className="hidden sm:flex items-center bg-[#FFFDF8] border-2 border-dashed border-agri-400 rounded-xl px-3 py-1.5 gap-2">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wide leading-none">Farmer Account</span>
                    <span className="text-xs font-bold text-slate-950 block leading-tight mt-0.5">
                      {farmer.name}
                    </span>
                  </div>
                  <button
                    onClick={logoutFarmer}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title={t('logout')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-2 bg-agri-600 hover:bg-agri-500 text-white font-bold text-xs rounded-xl shadow-md shadow-agri-600/10 transition-all btn-active-press flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('loginRegister')}</span>
                </button>
              )}

              {/* Officer Portal Trigger Desktop */}
              <div className="hidden lg:block">
                {isAdminAuthed ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTabClick('admin')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all btn-active-press cursor-pointer shadow-sm ${
                        activeTab === 'admin' && userRole === 'admin'
                          ? 'bg-slate-900 text-white border-slate-950 shadow-md'
                          : 'bg-[#FFFDF8] border-slate-300 text-slate-800 hover:bg-slate-100/80'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      Dashboard
                    </button>
                    <button
                      onClick={logoutAdmin}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Logout Officer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTabClick('admin')}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-[#FFFDF8] border border-slate-300 hover:bg-slate-100/80 flex items-center gap-1.5 transition-all btn-active-press cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    {t('officerPortal')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Fixed Navigation Bar (<lg screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t-2 border-slate-200 lg:hidden flex items-center justify-around py-1.5 px-2 shadow-lifted paper-bg-texture pb-safe">
        <button
          onClick={() => handleTabClick('centres')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'centres' && userRole === 'farmer'
              ? 'text-agri-600 bg-agri-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-5 h-5 mb-0.5" />
          <span>Centres</span>
        </button>

        <button
          onClick={() => handleTabClick('map')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'map'
              ? 'text-agri-600 bg-agri-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </button>

        <button
          onClick={() => handleTabClick('prices')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'prices'
              ? 'text-agri-600 bg-agri-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LineChart className="w-5 h-5 mb-0.5" />
          <span>MSP</span>
        </button>

        <button
          onClick={() => handleTabClick('queue')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'queue'
              ? 'text-agri-600 bg-agri-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Queue</span>
        </button>

        <button
          onClick={() => handleTabClick('voice')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'voice'
              ? 'text-purple-700 bg-purple-100'
              : 'text-purple-600 hover:text-purple-800'
          }`}
        >
          <Mic className="w-5 h-5 mb-0.5" />
          <span>Voice AI</span>
        </button>

        <button
          onClick={() => handleTabClick('analytics')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'analytics'
              ? 'text-agri-600 bg-agri-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => handleTabClick('admin')}
          className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-2 rounded-xl text-[10px] font-extrabold transition-all btn-active-press ${
            activeTab === 'admin' && userRole === 'admin'
              ? 'text-slate-900 bg-slate-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5 text-amber-600" />
          <span>Officer</span>
        </button>
      </nav>
    </>
  );
};
export default Navbar;
