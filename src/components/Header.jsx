import React, { useState } from 'react';
import { 
  Menu, Search, Bell, Shield, ChevronDown, CheckCircle, 
  AlertTriangle, LogOut, Sparkles, X 
} from 'lucide-react';
import { ADMIN_ROLES } from '../constants/system';

export const Header = ({ 
  activeModule, 
  setActiveModule,
  currentRole, 
  setCurrentRole, 
  onOmniSearch, 
  notifications, 
  onRefreshAll, 
  isSyncing, 
  serverOnline, 
  onLogout,
  isCollapsed,
  setIsCollapsed,
  onOpenMobileSidebar
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onOmniSearch) onOmniSearch(e.target.value);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Left Section: Sidebar Toggle Hamburger & Mobile Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger (Opens slide-over drawer) */}
        <button 
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Hamburger (Toggles collapse) */}
        {setIsCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 flex-shrink-0">
            <svg viewBox="0 0 44 44" fill="none" className="w-7 h-7 drop-shadow-xs">
              <path d="M 6 22 L 20 8 L 24 12 L 10 26 Z" fill="#00E5FF" />
              <path d="M 20 8 L 36 24 L 36 38 L 18 38 L 18 19 Z" fill="#2563EB" />
              <path d="M 8 34 L 18 34 L 18 38 L 8 38 Z" fill="#00E5FF" />
              <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
              <rect x="28" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
              <rect x="22" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />
              <rect x="28" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">HomeEase</span>
        </div>
      </div>

      {/* Center Section: Search Bar (Desktop) */}
      <div className="relative flex-1 max-w-xl mx-2 sm:mx-4 hidden md:block">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input 
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search categories (e.g. Cleaning, AC Repair, Plumbing...)"
          className="w-full pl-11 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-full text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
        />
      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center gap-2 z-40 md:hidden">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input 
            type="text"
            autoFocus
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search categories, orders..."
            className="flex-1 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          />
          <button 
            onClick={() => setShowMobileSearch(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Section: Mobile Search Toggle + System Health + Sync + Notifications + Admin Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        
        {/* Mobile Search Icon Toggle */}
        <button 
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* System Status Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition ${
            serverOnline !== false 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
              : 'bg-rose-50 text-rose-700 border-rose-200/80'
          }`}
          title="AWS Live Cloud Cluster"
        >
          <span className={`w-2 h-2 rounded-full ${serverOnline !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="hidden sm:inline">{serverOnline !== false ? 'System Healthy' : 'System Offline'}</span>
        </div>

        {/* Sync Button */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isSyncing}
            className={`p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer ${
              isSyncing ? 'animate-spin text-blue-600' : ''
            }`}
            title="Refresh Live Data"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
              3
            </span>
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" /> Notifications
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Unassigned High-Priority Job</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Job #JOB-9923 in Cyber City has no assigned worker for 10 mins.</p>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">5 mins ago</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">KYC Verification Submission</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Rajesh Verma (Electrical) submitted documents for verification.</p>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">14 mins ago</span>
                    </div>
                  </div>
                </div>
              </div>
              {setActiveModule && (
                <div className="pt-2 px-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      setActiveModule('notifications');
                    }}
                    className="w-full text-center py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition cursor-pointer"
                  >
                    Open Notification Center →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upper Admin Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B2545] text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-xs select-none">
              AD
            </div>

            <div className="hidden sm:block text-left select-none">
              <div className="text-xs font-bold text-slate-800 leading-tight">Admin</div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                {currentRole?.name?.split('/')[0] || 'Super Admin'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white font-bold flex items-center justify-center text-[11px]">
                  AD
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">Admin Account</div>
                  <div className="text-[10px] text-slate-400 truncate">admin@homeease.com</div>
                </div>
              </div>

              {/* Role Context Selector */}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Admin Context
              </div>
              <div className="px-2 space-y-1">
                {ADMIN_ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      if (setCurrentRole) setCurrentRole(role);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                      currentRole?.id === role.id 
                        ? 'bg-blue-50 text-blue-700 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{role.name.split('/')[0]}</span>
                    {currentRole?.id === role.id && <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Sign Out / Lock Session Action */}
              {onLogout && (
                <div className="pt-2 mt-2 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out / Lock Portal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
