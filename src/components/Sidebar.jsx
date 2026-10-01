import React, { useState } from 'react';
import { 
  Home, Calendar, Users, Truck, User, BarChart3, FileText, 
  Wrench, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  Lock, LayoutDashboard, Grid, ListTree, Image, Tag, Bell, CreditCard, X
} from 'lucide-react';

export const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: Home },
  { id: 'bookings', name: 'Bookings', icon: Calendar },
  { id: 'workers', name: 'Workers', icon: Users },
  { id: 'fleet', name: 'Fleet', icon: Truck },
  { id: 'customers', name: 'Customers', icon: User },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'banners', name: 'Banners', icon: Image },
  { id: 'promotions', name: 'Coupons & Deals', icon: Tag },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'reports', name: 'Reports', icon: FileText },
  { id: 'categories', name: 'Master Categories', icon: Grid },
  { id: 'sub-services', name: 'Sub-Services', icon: ListTree },
];

export const Sidebar = ({ 
  activeModule, 
  setActiveModule, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen = false,
  setIsMobileOpen,
  currentRole, 
  onLogout 
}) => {
  // Services submenu is open if either categories or sub-services is active
  const isServicesActive = activeModule === 'categories' || activeModule === 'sub-services';
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);

  const handleNavClick = (id) => {
    setActiveModule(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // On mobile drawer, labels are always shown; on desktop, respects isCollapsed
  const showLabels = isMobileOpen || !isCollapsed;

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'customers', label: 'Customers', icon: User },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const marketingNavItems = [
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'promotions', label: 'Coupons', icon: Tag },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
  ];

  const analyticsNavItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-screen bg-[#070D18] text-slate-300 z-50 transition-all duration-300 flex flex-col border-r border-slate-800/80 shadow-2xl select-none 
          w-72 max-w-[85vw] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:z-30 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#050A14]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 44 44" fill="none" className="w-8 h-8 drop-shadow-sm">
                <path d="M 6 22 L 20 8 L 24 12 L 10 26 Z" fill="#00E5FF" />
                <path d="M 20 8 L 36 24 L 36 38 L 18 38 L 18 19 Z" fill="#2563EB" />
                <path d="M 8 34 L 18 34 L 18 38 L 8 38 Z" fill="#00E5FF" />
                <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
                <rect x="28" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
                <rect x="22" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />
                <rect x="28" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />
              </svg>
            </div>
            {showLabels && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-none">HomeEase</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Operations Suite</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Navigation Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          
          {/* Core Nav Items */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id || (item.id === 'payments' && activeModule === 'financials');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#1D68F2] text-white font-bold shadow-md shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
                }`}
                title={!showLabels ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* Services Dropdown */}
          <div>
            <button
              onClick={() => {
                if (isCollapsed && !isMobileOpen) {
                  setIsCollapsed(false);
                }
                setIsServicesExpanded(!isServicesExpanded);
                if (!isServicesActive) {
                  handleNavClick('categories');
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                isServicesActive 
                  ? 'bg-[#1D68F2] text-white font-bold shadow-md shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
              }`}
              title="Services"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Wrench className="w-4 h-4 flex-shrink-0" />
                {showLabels && <span className="truncate">Services</span>}
              </div>
              
              {showLabels && (
                isServicesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/80" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Nested Sub-items (Master Categories & Sub-Services) */}
            {(showLabels && isServicesExpanded) && (
              <div className="mt-1 space-y-1 pl-4">
                {/* Master Categories */}
                <button
                  onClick={() => handleNavClick('categories')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    activeModule === 'categories'
                      ? 'bg-[#0F1E36] text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="truncate">Master Categories</span>
                </button>

                {/* Sub-Services */}
                <button
                  onClick={() => handleNavClick('sub-services')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    activeModule === 'sub-services'
                      ? 'bg-[#0F1E36] text-blue-400 font-bold border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="truncate">Sub-Services</span>
                </button>
              </div>
            )}
          </div>

          {/* Growth & Marketing Section Divider */}
          {showLabels && (
            <div className="pt-3 pb-1 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Growth & Marketing
            </div>
          )}

          {/* Marketing Nav Items: Banners, Coupons, Notifications */}
          {marketingNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#1D68F2] text-white font-bold shadow-md shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
                }`}
                title={!showLabels ? item.label : undefined}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </div>
                {showLabels && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Analytics & Reports Section */}
          {analyticsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#1D68F2] text-white font-bold shadow-md shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 font-medium'
                }`}
                title={!showLabels ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

        </div>

        {/* Lock Session / Logout Action */}
        {onLogout && (
          <div className="px-3 py-2 border-t border-slate-800/80 bg-[#050A14]">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20 cursor-pointer ${
                !showLabels ? 'justify-center' : ''
              }`}
              title="Lock Session / Sign Out"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              {showLabels && <span>Lock Session / Sign Out</span>}
            </button>
          </div>
        )}

        {/* Footer Live Operational Status */}
        {showLabels ? (
          <div className="p-3 border-t border-slate-800/80 bg-[#050A14] text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <div className="font-semibold text-slate-300 text-[11px] leading-tight">System Online</div>
                <div className="text-[10px] text-slate-500 font-medium">HomeEase Operations Suite v2.8.0</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800/80 bg-[#050A14] flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online v2.8.0"></span>
          </div>
        )}
      </aside>
    </>
  );
};
