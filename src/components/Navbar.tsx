import React, { useState, useRef, useEffect } from 'react';
import { 
  Landmark, User, Map, LineChart, FileText, Settings, Globe, Shield, Mic, 
  Sparkles, Ticket, ChevronDown, LogOut, LogIn, CheckCircle2, UserCheck, 
  LayoutDashboard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationBell } from './NotificationBell';
import { Language } from '../translations';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenAdminGate: () => void;
  showHeader?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenAdminGate, showHeader = true }) => {
  const { 
    activeTab, 
    setActiveTab, 
    farmer, 
    logoutFarmer, 
    isAdminAuthed, 
    logoutAdmin, 
    userRole, 
    setUserRole, 
    activeToken, 
    myActiveTokens, 
    setViewPassToken 
  } = useApp();
  const { lang, setLang, t } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as Language);
  };

  return (
    <>
      {/* Top Navbar Ribbon */}
      <nav className={`w-full bg-paper/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-transform duration-300 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4 sm:gap-6">
            
            {/* 1. Clean Logo Lockup (Left) */}
            <div 
              className="flex items-center space-x-3.5 cursor-pointer group shrink-0" 
              onClick={() => handleTabClick('centres')}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-agri-800 via-agri-700 to-teal-600 flex items-center justify-center text-white text-xl shadow-md shadow-agri-700/20 group-hover:scale-105 group-hover:shadow-agri-700/30 transition-all duration-300 ring-1 ring-white/30">
                🌾
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-display font-black text-xl tracking-tight text-slate-900 leading-tight">
                  {t('appTitle')}
                </span>
                <span className="text-[11px] font-semibold text-agri-700 tracking-wide mt-0.5 leading-tight font-sans">
                  किसान सेतु
                </span>
              </div>
            </div>

            {/* 2. Primary Navigation Items (Center/Left - Without gray container box) */}
            <div className="hidden lg:flex items-center space-x-1.5 xl:space-x-2">
              <button
                onClick={() => handleTabClick('centres')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'centres' && userRole === 'farmer'
                    ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <Landmark className="w-4 h-4" />
                {t('centresTab')}
              </button>
              <button
                onClick={() => handleTabClick('map')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <Map className="w-4 h-4" />
                {t('mapTab')}
              </button>
              <button
                onClick={() => handleTabClick('prices')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'prices'
                    ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <LineChart className="w-4 h-4" />
                {t('pricesTab')}
              </button>
              <button
                onClick={() => handleTabClick('queue')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <FileText className="w-4 h-4" />
                {t('queueTab')}
              </button>
              <button
                onClick={() => handleTabClick('analytics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-agri-700 text-white shadow-sm shadow-agri-700/20 scale-[1.02]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('analyticsTab')}
              </button>
            </div>

            {/* 3. Center/Right: Highlighted Voice AI Button */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => handleTabClick('voice')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  activeTab === 'voice'
                    ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md shadow-purple-900/20 scale-[1.02]'
                    : 'text-purple-950 bg-purple-50/90 hover:bg-purple-100/90 border border-purple-200/90 hover:border-purple-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                <span>Voice AI</span>
                <span className="text-[8px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">NEW</span>
              </button>
            </div>

            {/* 4. Right Utility Cluster */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Compact Language Selector */}
              <div className="relative flex items-center bg-white/80 hover:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 transition-all shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
                <select
                  value={lang}
                  onChange={handleLanguageChange}
                  className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1 uppercase text-slate-800"
                  aria-label="Language"
                >
                  <option value="en">EN</option>
                  <option value="te">తెలుగు</option>
                  <option value="hi">हिंदी</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-0.5 shrink-0" />
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Active Token E-Pass Indicator */}
              {(activeToken || myActiveTokens.length > 0) && (
                <button
                  onClick={() => setViewPassToken(activeToken || myActiveTokens[0])}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all btn-active-press flex items-center gap-1.5 cursor-pointer border border-amber-600 animate-fadeIn"
                  title="View Active Digital Token E-Pass"
                >
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline font-mono">{activeToken ? activeToken.tokenNumber : myActiveTokens[0]?.tokenNumber}</span>
                  <span className="text-[9px] bg-white/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-extrabold">
                    {myActiveTokens.length > 1 ? `${myActiveTokens.length} Passes` : 'Pass'}
                  </span>
                </button>
              )}

              {/* Merged Single Profile Avatar & Dropdown Control */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="relative p-0.5 rounded-full cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
                  aria-label="User Profile and Account Control"
                  title={farmer ? `Farmer: ${farmer.name}` : isAdminAuthed ? 'Officer Account' : 'Account & Access'}
                >
                  {farmer ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-agri-700 to-agri-600 text-white font-black text-sm flex items-center justify-center shadow-sm ring-2 ring-agri-600/30">
                      {farmer.name ? farmer.name.charAt(0).toUpperCase() : 'F'}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                  ) : isAdminAuthed ? (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center shadow-sm ring-2 ring-amber-500/40">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white text-slate-600 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center shadow-2xs">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-paper/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-lifted z-50 overflow-hidden animate-fadeIn text-slate-800">
                    
                    {/* Dropdown Header: Account Status Summary */}
                    <div className="p-4 bg-gradient-to-br from-agri-800 to-agri-950 text-white">
                      <div className="flex items-center gap-3">
                        {farmer ? (
                          <div className="w-10 h-10 rounded-full bg-white/20 text-white font-black text-base flex items-center justify-center ring-2 ring-white/30">
                            {farmer.name.charAt(0).toUpperCase()}
                          </div>
                        ) : isAdminAuthed ? (
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center ring-2 ring-amber-400/30">
                            <Shield className="w-5 h-5 text-amber-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 text-white/80 flex items-center justify-center ring-2 ring-white/20">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black truncate leading-tight">
                            {farmer ? farmer.name : isAdminAuthed ? 'Mandi Officer' : 'Guest Farmer'}
                          </h4>
                          <p className="text-[11px] text-emerald-200/80 font-medium truncate mt-0.5">
                            {farmer ? farmer.phone : isAdminAuthed ? 'Official Portal Access' : 'Sign in to access passes'}
                          </p>
                        </div>
                      </div>

                      {/* Role Pill Badge */}
                      <div className="mt-3 flex items-center gap-1.5">
                        {farmer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Farmer Account Active
                          </span>
                        )}
                        {isAdminAuthed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-amber-400" />
                            Officer Session Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dropdown Menu Options */}
                    <div className="p-2 space-y-1">
                      
                      {/* Section 1: Farmer Controls */}
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Farmer Account
                      </div>
                      
                      {farmer ? (
                        <>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => {
                                handleTabClick('centres');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                              <Landmark className="w-4 h-4 text-agri-600" />
                              <span>Switch to Farmer View</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              logoutFarmer();
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('logout')} Farmer</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            onOpenLogin();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-agri-700 hover:bg-agri-50 rounded-xl transition cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-agri-600" />
                          <span>{t('loginRegister')}</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      {/* Section 2: Officer Portal Controls */}
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Officer Portal
                      </div>

                      {isAdminAuthed ? (
                        <>
                          <button
                            onClick={() => {
                              handleTabClick('admin');
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                              activeTab === 'admin' && userRole === 'admin'
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <LayoutDashboard className="w-4 h-4 text-amber-500" />
                              <span>Officer Dashboard</span>
                            </span>
                            {activeTab === 'admin' && userRole === 'admin' && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              logoutAdmin();
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout Officer</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            onOpenAdminGate();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>{t('officerPortal')} (PIN Login)</span>
                        </button>
                      )}
                    </div>
                  </div>
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
