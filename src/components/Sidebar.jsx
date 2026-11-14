import React, { useState } from 'react';
import {
  LayoutDashboard, Radio, CalendarCheck, Users, User,
  Wrench, MapPin, Navigation, Clock, CreditCard,
  Tag, ShieldAlert, Bell, BarChart3, Settings,
  ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp,
  Sparkles, Lock
} from 'lucide-react';

export const Sidebar = ({
  activeModule,
  setActiveModule,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
  currentRole: _currentRole,
  onLogout
}) => {
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);

  const handleNavClick = (id) => {
    setActiveModule(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const showLabels = isMobileOpen || !isCollapsed;

  // 15 Modules ordered per HomeEase Operations Architecture
  const modules = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live-operations', label: 'Live Operations', icon: Radio, pulse: true },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'customers', label: 'Customers', icon: User },
    { 
      id: 'services', 
      label: 'Services & Categories', 
      icon: Wrench,
      hasSubmenu: true,
      subItems: [
        { id: 'categories', label: 'Master Categories' },
        { id: 'sub-services', label: 'Sub-Services' },
        { id: 'explore-services', label: 'Explore Services' }
      ]
    },
    { id: 'service-areas', label: 'Service Areas', icon: MapPin },
    { id: 'dispatch', label: 'Dispatch Management', icon: Navigation },
    { id: 'schedule-slots', label: 'Schedule & Slots', icon: Clock },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'coupons', label: 'Offers & Coupons', icon: Tag },
    { id: 'support', label: 'Support & Complaints', icon: ShieldAlert },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  const isModuleActive = (item) => {
    if (activeModule === item.id) return true;
    if (item.id === 'overview' && (activeModule === 'dashboard' || !activeModule)) return true;
    if (item.id === 'services' && (activeModule === 'categories' || activeModule === 'sub-services' || activeModule === 'explore-services')) return true;
    if (item.id === 'payments' && activeModule === 'financials') return true;
    if (item.id === 'coupons' && activeModule === 'promotions') return true;
    if (item.id === 'analytics' && activeModule === 'reports') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-white text-slate-800 z-50 transition-all duration-300 flex flex-col border-r border-slate-200 select-none
          w-64 max-w-[85vw] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:z-30 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8">
                <path d="M 6 22 L 20 8 L 24 12 L 10 26 Z" fill="#00E5FF" />
                <path d="M 20 8 L 36 24 L 36 38 L 18 38 L 18 19 Z" fill="#1D68F2" />
                <path d="M 8 34 L 18 34 L 18 38 L 8 38 Z" fill="#00E5FF" />
                <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
                <rect x="28" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
              </svg>
            </div>
            {showLabels && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-base tracking-tight leading-none">HomeEase</span>
                <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase mt-1">Operations Platform</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 15 Modules List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {modules.map((item) => {
            const Icon = item.icon;
            const active = isModuleActive(item);

            if (item.hasSubmenu) {
              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => {
                      if (isCollapsed && !isMobileOpen) setIsCollapsed(false);
                      setIsServicesExpanded(!isServicesExpanded);
                      if (!active) handleNavClick('categories');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                    title={!showLabels ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                      {showLabels && <span className="truncate">{item.label}</span>}
                    </div>
                    {showLabels && (
                      isServicesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Submenu */}
                  {showLabels && isServicesExpanded && (
                    <div className="pl-7 pr-1 space-y-0.5 pt-0.5">
                      {item.subItems.map((sub) => {
                        const subActive = activeModule === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleNavClick(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                              subActive
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${subActive ? 'bg-white' : 'bg-slate-300'}`} />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
                title={!showLabels ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </div>

                {showLabels && item.pulse && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ${
                !showLabels ? 'justify-center' : ''
              }`}
              title="Sign Out"
            >
              <Lock className="w-3.5 h-3.5" />
              {showLabels && <span>Sign Out</span>}
            </button>
          )}

          {showLabels ? (
            <div className="text-[10px] text-slate-400 font-medium px-1 flex items-center justify-between">
              <span>HomeEase Ops v3.0</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Live"></span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
