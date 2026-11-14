import React, { useState, useEffect } from 'react';
import { 
  Menu, Search, Bell, ChevronDown, CheckCircle, 
  AlertTriangle, LogOut, Sparkles, X, Calendar, 
  ArrowRight, ShieldCheck, UserCheck, ExternalLink, Hash
} from 'lucide-react';
import { ADMIN_ROLES } from '../constants/system';

export const Header = ({ 
  activeModule: _activeModule,
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
  onOpenMobileSidebar,
  onQuickBookingSearch
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickBookingId, setQuickBookingId] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  const notificationCount = Array.isArray(notifications) ? notifications.length : 0;

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      setCurrentDateFormatted(now.toLocaleDateString('en-IN', options));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onOmniSearch) onOmniSearch(e.target.value);
  };

  const handleQuickBookingSubmit = (e) => {
    e.preventDefault();
    if (!quickBookingId.trim()) return;
    if (onQuickBookingSearch) {
      onQuickBookingSearch(quickBookingId.trim());
    } else if (setActiveModule) {
      setActiveModule('bookings');
      if (onOmniSearch) onOmniSearch(quickBookingId.trim());
    }
    setQuickBookingId('');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Left Section: Sidebar Toggle Hamburger & Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
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
            <svg viewBox="0 0 44 44" fill="none" className="w-7 h-7">
              <path d="M 6 22 L 20 8 L 24 12 L 10 26 Z" fill="#00E5FF" />
              <path d="M 20 8 L 36 24 L 36 38 L 18 38 L 18 19 Z" fill="#1D68F2" />
              <path d="M 8 34 L 18 34 L 18 38 L 8 38 Z" fill="#00E5FF" />
              <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
              <rect x="28" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">HomeEase</span>
        </div>

        {/* Live Date Indicator (Desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentDateFormatted || 'Operations Live'}</span>
        </div>
      </div>

      {/* Center Section: Global Search + Quick Booking Lookup */}
      <div className="flex-1 max-w-2xl mx-3 sm:mx-6 hidden md:flex items-center gap-2">
        {/* Global Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search customers, workers, services..."
            className="w-full pl-10 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>

        {/* Quick Booking Search */}
        <form onSubmit={handleQuickBookingSubmit} className="relative w-56 flex-shrink-0">
          <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
          <input 
            type="text"
            value={quickBookingId}
            onChange={(e) => setQuickBookingId(e.target.value)}
            placeholder="Quick Booking ID..."
            className="w-full pl-8 pr-8 py-1.5 bg-blue-50/40 border border-blue-200 rounded-lg text-xs font-medium text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          <button 
            type="submit" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 transition"
            title="Jump to Booking"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Right Section: Mobile Search Toggle + Status + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Mobile Search Icon Toggle */}
        <button 
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* System Health Status */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
            serverOnline !== false 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title="AWS Backend Health"
        >
          <span className={`w-2 h-2 rounded-full ${serverOnline !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="hidden sm:inline">{serverOnline !== false ? 'Online' : 'Offline'}</span>
        </div>

        {/* Refresh / Sync Button */}
        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isSyncing}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer ${
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
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2.5 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" /> Notifications
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{notificationCount} Live</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n, i) => (
                    <div key={n.id || i} className="p-3 hover:bg-slate-50 transition cursor-pointer">
                      <p className="text-xs font-semibold text-slate-800">{n.title || 'Platform Alert'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.body || n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.sentTime || 'Just Now'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No pending notifications.
                  </div>
                )}
              </div>
              {setActiveModule && (
                <div className="pt-2 px-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      setActiveModule('notifications');
                    }}
                    className="w-full text-center py-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  >
                    Open Notification Center →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              AD
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">Admin Ops</span>
              <span className="text-[10px] font-semibold text-blue-600 leading-tight">SUPER ADMIN</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Operations Suite</p>
                <p className="text-[11px] text-slate-500">admin@homeease.com</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  if (setActiveModule) setActiveModule('settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" /> System Settings
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                </button>
              )}
            </div>
          )}
        </div>
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
            placeholder="Search orders, workers, services..."
            className="flex-1 py-2 text-xs font-medium text-slate-800 focus:outline-none"
          />
          <button 
            onClick={() => setShowMobileSearch(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
