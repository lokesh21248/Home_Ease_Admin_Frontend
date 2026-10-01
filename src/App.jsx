import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { 
  ADMIN_ROLES, DEFAULT_SECURITY_SETTINGS 
} from './constants/system';

import {
  getDashboardStats,
  getServices,
  getSubServices,
  getWorkers,
  getUsers,
  getBanners,
  getCoupons,
  getPayments,
  getLiveMap,
  getBookings,
  getNotifications,
  checkServerHealth
} from './api/adminApi';

// Import Module Views
import { Module01Auth } from './views/Module01Auth';
import { Module02Dashboard } from './views/Module02Dashboard';
import { Module02Bookings } from './views/Module02Bookings';
import { Module03KYC } from './views/Module03KYC';
import { Module04Workers } from './views/Module04Workers';
import { Module05Customers } from './views/Module05Customers';
import { Module06Dispatch } from './views/Module06Dispatch';
import { Module07Categories } from './views/Module07Categories';
import { Module08SubServices } from './views/Module08SubServices';
import { Module09Financials } from './views/Module09Financials';
import { ModuleAnalytics } from './views/ModuleAnalytics';
import { Module10Banners } from './views/Module10Banners';
import { Module11Promotions } from './views/Module11Promotions';
import { Module12Notifications } from './views/Module12Notifications';

const DEFAULT_BANNERS = [];
const DEFAULT_NOTIFICATIONS = [];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Session-based auth: Opening localhost initially asks for login
    return sessionStorage.getItem('homeease_admin_authenticated') === 'true';
  });
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(ADMIN_ROLES[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('homeease_admin_authenticated', 'true');
    setIsAuthenticated(true);
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('homeease_admin_authenticated');
    localStorage.removeItem('homeease_admin_authenticated');
    setIsAuthenticated(false);
    setActiveModule('dashboard');
  };

  // Responsive Navigation State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Live Server Status & Sync State
  const [serverOnline, setServerOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Live Cloud Data Engines across Modules
  const [rawStats, setRawStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [liveMapData, setLiveMapData] = useState({
    totalOnlineWorkers: 0,
    totalActiveBookings: 0,
    activeWorkers: [],
    activeBookings: []
  });
  const [ledger, setLedger] = useState([]);
  const [bookings, setBookings] = useState(() => {
    const cached = localStorage.getItem('homeease_admin_bookings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [banners, setBanners] = useState(() => {
    const cached = localStorage.getItem('homeease_admin_banners');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Remove any dummy/preset banners, keep only real ones user adds
          const userOnly = parsed.filter(b => 
            !b.bannerId?.startsWith('b00') && 
            !b.id?.startsWith('b00') &&
            !b.title?.includes('Festival Home Cleaning Fest') &&
            !b.title?.includes('Festive Home Deep Cleaning') &&
            !b.title?.includes('Beat the Summer Heat') &&
            !b.title?.includes('Weekend Wellness') &&
            !b.title?.includes('Welcome to HomeEase') &&
            !b.title?.includes('Quick Emergency Repairs')
          );
          localStorage.setItem('homeease_admin_banners', JSON.stringify(userOnly));
          return userOnly;
        }
      } catch (e) {}
    }
    localStorage.setItem('homeease_admin_banners', JSON.stringify([]));
    return [];
  });
  const [promotions, setPromotions] = useState(() => {
    localStorage.removeItem('homeease_admin_coupons');
    return [];
  });
  const [notifications, setNotifications] = useState([]);
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SECURITY_SETTINGS);
  const [auditLogs, setAuditLogs] = useState([]);

  // Synchronize All Live Data from AWS Live Server (http://3.107.161.126:8080)
  const syncAllLiveData = useCallback(async () => {
    setIsSyncing(true);

    try {
      // 1. Dashboard Stats
      try {
        const stats = await getDashboardStats();
        setRawStats(stats);
        setServerOnline(true);
      } catch (err) {
        console.warn('Dashboard stats error:', err.message);
        setServerOnline(false);
      }

      // 2. Services Verticals
      let currentCategories = categories;
      try {
        const sList = await getServices();
        if (Array.isArray(sList)) {
          setCategories(sList);
          currentCategories = sList;
        }
      } catch (err) {
        console.warn('Services fetch error:', err.message);
      }

      // 3. Sub-Services Catalog
      try {
        const subList = await getSubServices(currentCategories);
        if (Array.isArray(subList)) setSubServices(subList);
      } catch (err) {
        console.warn('Sub-services fetch error:', err.message);
      }

      // 4. Workers & KYC
      try {
        const wList = await getWorkers();
        if (Array.isArray(wList)) setWorkers(wList);
      } catch (err) {
        console.warn('Workers fetch error:', err.message);
      }

      // 5. Users / Customers
      try {
        const uList = await getUsers();
        if (Array.isArray(uList)) setCustomers(uList);
      } catch (err) {
        console.warn('Users fetch error:', err.message);
      }

      // 6. Live Map Telemetry
      try {
        const mapData = await getLiveMap();
        if (mapData) setLiveMapData(mapData);
      } catch (err) {
        console.warn('Live map fetch error:', err.message);
      }

      // 7. Payments & Financial Ledger
      try {
        const pList = await getPayments();
        if (Array.isArray(pList)) setLedger(pList);
      } catch (err) {
        console.warn('Payments fetch error:', err.message);
      }

      // 8. Bookings & Order Lifecycle
      try {
        const bList = await getBookings();
        if (Array.isArray(bList) && bList.length > 0) {
          setBookings(bList);
          localStorage.setItem('homeease_admin_bookings', JSON.stringify(bList));
        }
      } catch (err) {
        console.warn('Bookings fetch error:', err.message);
      }

      // 8. Promotional Banners
      try {
        const bList = await getBanners(false);
        if (Array.isArray(bList) && bList.length > 0) {
          setBanners(bList);
          localStorage.setItem('homeease_admin_banners', JSON.stringify(bList));
        } else {
          const cached = localStorage.getItem('homeease_admin_banners');
          if (cached) setBanners(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('Banners fetch error (fallback to cache):', err.message);
        const cached = localStorage.getItem('homeease_admin_banners');
        if (cached) setBanners(JSON.parse(cached));
      }

      // 9. Coupons & Discounts
      try {
        const cList = await getCoupons(false);
        if (Array.isArray(cList)) {
          setPromotions(cList);
          localStorage.setItem('homeease_admin_coupons', JSON.stringify(cList));
        }
      } catch (err) {
        console.warn('Coupons fetch error:', err.message);
      }

      // 10. Live Push Notifications & Broadcasts (Zero Dummy Data)
      try {
        const nList = await getNotifications();
        if (Array.isArray(nList)) {
          const liveNotifs = nList.map(n => ({
            id: n.notificationId || n.id,
            notificationId: n.notificationId || n.id,
            title: n.title,
            body: n.message || n.body,
            message: n.message || n.body,
            target: n.recipientName || 'All Users',
            recipientName: n.recipientName || 'All Users',
            status: n.status === 'SENT' ? 'Delivered' : (n.status === 'PENDING' ? 'Scheduled' : n.status),
            sentTime: n.sentAt ? new Date(n.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : (n.createdAt ? new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just Now'),
            iconType: n.type === 'REMINDER' ? 'alert' : 'promo',
            type: n.type,
            createdAt: n.createdAt
          }));
          setNotifications(liveNotifs);
        }
      } catch (err) {
        console.warn('Notifications fetch error:', err.message);
      }

    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    syncAllLiveData();
  }, [syncAllLiveData]);

  const handleOmniSearch = (query) => {
    if (!query) return;
    const q = query.toLowerCase();
    if (q.includes('kyc') || q.includes('aadhaar')) setActiveModule('kyc');
    else if (q.includes('worker') || q.includes('partner')) setActiveModule('workers');
    else if (q.includes('customer') || q.includes('user')) setActiveModule('customers');
    else if (q.includes('dispatch') || q.includes('map')) setActiveModule('dispatch');
    else if (q.includes('category') || q.includes('service')) setActiveModule('categories');
    else if (q.includes('rate') || q.includes('sub-service')) setActiveModule('sub-services');
    else if (q.includes('payout') || q.includes('payment') || q.includes('gross') || q.includes('finance')) setActiveModule('payments');
    else if (q.includes('promo') || q.includes('coupon')) setActiveModule('promotions');
    else if (q.includes('banner')) setActiveModule('banners');
    else if (q.includes('notify') || q.includes('broadcast')) setActiveModule('notifications');
  };

  // Full-Screen Authentication Gate (Operations Portal)
  if (!isAuthenticated || activeModule === 'auth') {
    return (
      <Module01Auth 
        onLoginSuccess={handleLoginSuccess}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* 240px Collapsible Left Admin Navigation Sidebar */}
      <Sidebar 
        activeModule={activeModule}
        setActiveModule={(mod) => {
          setActiveModule(mod);
          setIsMobileSidebarOpen(false);
        }}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        currentRole={currentRole}
        onLogout={handleLogout}
      />

      {/* Main Dynamic View Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Header */}
        <Header 
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          onOmniSearch={handleOmniSearch}
          notifications={notifications}
          onRefreshAll={syncAllLiveData}
          isSyncing={isSyncing}
          serverOnline={serverOnline}
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Screen View Module Switcher */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 min-w-0 overflow-x-hidden">
          {activeModule === 'dashboard' && (
            <Module02Dashboard 
              rawStats={rawStats}
              categories={categories}
              ledger={ledger}
              auditLogs={auditLogs}
              onNavigateModule={setActiveModule}
              onRefreshMetrics={syncAllLiveData}
              isRefreshing={isSyncing}
            />
          )}

          {activeModule === 'kyc' && (
            <Module03KYC 
              workers={workers}
              setWorkers={setWorkers}
              onRefresh={syncAllLiveData}
            />
          )}

          {activeModule === 'workers' && (
            <Module04Workers 
              workers={workers} 
              setWorkers={setWorkers}
              onRefresh={syncAllLiveData}
            />
          )}

          {activeModule === 'customers' && (
            <Module05Customers 
              customers={customers} 
              setCustomers={setCustomers}
              onRefresh={syncAllLiveData}
            />
          )}

          {activeModule === 'bookings' && (
            <Module02Bookings 
              bookings={bookings}
              setBookings={setBookings}
              workers={workers}
              customers={customers}
              categories={categories}
              subServices={subServices}
              liveMapData={liveMapData}
              ledger={ledger}
              onRefresh={syncAllLiveData}
              isRefreshing={isSyncing}
            />
          )}

          {(activeModule === 'dispatch' || activeModule === 'fleet') && (
            <Module06Dispatch 
              liveMapData={liveMapData}
              onRefresh={syncAllLiveData}
              isRefreshing={isSyncing}
            />
          )}

          {(activeModule === 'categories' || activeModule === 'services') && (
            <Module07Categories 
              categories={categories} 
              subServices={subServices}
              setCategories={setCategories}
              onRefresh={syncAllLiveData}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'sub-services' && (
            <Module08SubServices 
              subServices={subServices} 
              setSubServices={setSubServices}
              categories={categories}
              onRefresh={syncAllLiveData}
            />
          )}

          {(activeModule === 'payments' || activeModule === 'financials') && (
            <Module09Financials 
              ledger={ledger} 
              setLedger={setLedger}
              onRefresh={syncAllLiveData}
            />
          )}

          {(activeModule === 'analytics' || activeModule === 'reports') && (
            <ModuleAnalytics 
              bookings={bookings}
              workers={workers}
              customers={customers}
              categories={categories}
              ledger={ledger}
              rawStats={rawStats}
              onRefresh={syncAllLiveData}
              isRefreshing={isSyncing}
            />
          )}

          {activeModule === 'banners' && (
            <Module10Banners 
              banners={banners} 
              setBanners={setBanners}
              categories={categories}
              onRefresh={syncAllLiveData}
            />
          )}

          {activeModule === 'promotions' && (
            <Module11Promotions 
              promotions={promotions} 
              setPromotions={setPromotions}
              onRefresh={syncAllLiveData}
            />
          )}

          {activeModule === 'notifications' && (
            <Module12Notifications 
              notifications={notifications} 
              setNotifications={setNotifications}
              onRefresh={syncAllLiveData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
