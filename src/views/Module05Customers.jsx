import React, { useState, useMemo } from 'react';
import { 
  Users, Shield, Search, Phone, Mail, Calendar, 
  CheckCircle2, UserCheck, Eye, X, Copy, Check, Lock, ShieldCheck, Sparkles, Loader2,
  ArrowUpDown, ChevronDown, Download, MessageCircle, MapPin, DollarSign, Wallet, 
  Star, Clock, AlertTriangle, ChevronLeft, ChevronRight, ShoppingBag, TrendingUp, 
  Award, ExternalLink, RefreshCw, UserPlus
} from 'lucide-react';
import { updateUserRole } from '../api/adminApi';

export const Module05Customers = ({ customers = [], setCustomers, bookings = [], onRefresh }) => {
  // Active Segment Tab: 'ALL' | 'VIP' | 'ACTIVE' | 'NEW' | 'ADMINS'
  const [activeSegmentTab, setActiveSegmentTab] = useState('ALL');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [pincodeFilter, setPincodeFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // Slide-over Customer 360 Inspection Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Role management state
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState(null);
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
  const [roleConfirmTarget, setRoleConfirmTarget] = useState(null); // { user, targetRole }
  const [toastMessage, setToastMessage] = useState(null);

  // Copy helper
  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Role update execution
  const executeRoleChange = async () => {
    if (!roleConfirmTarget) return;
    const { user, targetRole } = roleConfirmTarget;
    const userId = user.userId || user.id;

    setIsUpdatingRole(true);
    setRoleMessage(null);
    try {
      await updateUserRole(userId, targetRole);
      setCustomers(prev => prev.map(u => (u.userId === userId || u.id === userId) ? { ...u, role: targetRole } : u));
      if (selectedCustomer && (selectedCustomer.userId === userId || selectedCustomer.id === userId)) {
        setSelectedCustomer(prev => ({ ...prev, role: targetRole }));
      }
      setToastMessage(`Account role updated to ${targetRole} for ${user.fullName || user.name || 'User'}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Role update error:', err.message);
      setToastMessage(`Failed to update role: ${err.message}`);
    } finally {
      setIsUpdatingRole(false);
      setShowRoleConfirmModal(false);
      setRoleConfirmTarget(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Aggregate Bookings per Customer
  // Maps userId or phone or customerName to their bookings list
  const customerBookingsMap = useMemo(() => {
    const map = {};
    if (!bookings || !Array.isArray(bookings)) return map;

    bookings.forEach(b => {
      const bUserId = b.customerUserId || b.userId || b.customerId;
      const bPhone = (b.customerPhone || b.phone || '').trim();
      const bName = (b.customerName || b.name || '').trim().toLowerCase();

      // Aggregate keys
      const keys = [];
      if (bUserId) keys.push(`id:${bUserId}`);
      if (bPhone) keys.push(`phone:${bPhone}`);
      if (bName) keys.push(`name:${bName}`);

      keys.forEach(k => {
        if (!map[k]) map[k] = [];
        // Avoid duplicate booking entries in same key
        if (!map[k].some(item => (item.id || item.bookingId) === (b.id || b.bookingId))) {
          map[k].push(b);
        }
      });
    });

    return map;
  }, [bookings]);

  // Enrich customer records with real operational booking telemetry & LTV
  const enrichedCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];

    const now = new Date();

    return customers.map((c, i) => {
      const userId = c.userId || c.id || `c-${i + 1}`;
      const fullName = c.fullName || c.name || 'Customer Account';
      const phone = c.phoneNumber || c.phone || '';
      const email = c.email || '';
      const role = (c.role || (c.isWorker ? 'WORKER' : 'CUSTOMER')).toUpperCase();
      const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || Boolean(c.isAdmin);
      const isWorker = Boolean(c.isWorker || role === 'WORKER');

      // Match bookings by userId, then phone, then name
      const matchedBookings = customerBookingsMap[`id:${userId}`] ||
        (phone ? customerBookingsMap[`phone:${phone}`] : null) ||
        (fullName ? customerBookingsMap[`name:${fullName.trim().toLowerCase()}`] : null) ||
        [];

      // Sort customer bookings newest first
      const sortedBookings = [...matchedBookings].sort((a, b) => {
        const dateA = new Date(a.scheduledAt || a.createdAt || 0);
        const dateB = new Date(b.scheduledAt || b.createdAt || 0);
        return dateB - dateA;
      });

      // Total orders
      const totalOrders = sortedBookings.length;
      const completedOrders = sortedBookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED').length;
      const cancelledOrders = sortedBookings.filter(b => (b.status || '').toUpperCase() === 'CANCELLED').length;

      // Calculate Lifetime Value (LTV)
      const lifetimeValue = sortedBookings.reduce((sum, b) => {
        const amt = Number(b.totalAmount || b.amount || b.price || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      const averageOrderValue = completedOrders > 0 ? Math.round(lifetimeValue / completedOrders) : (totalOrders > 0 ? Math.round(lifetimeValue / totalOrders) : 0);

      // Extract delivery address & pincode
      const latestBookingWithAddress = sortedBookings.find(b => b.customerAddress || b.address || b.pincode);
      const rawAddress = c.address || latestBookingWithAddress?.customerAddress || latestBookingWithAddress?.address || 'Hyderabad, Telangana';
      const rawPincode = c.pincode || latestBookingWithAddress?.pincode || (rawAddress.match(/\b(500\d{3})\b/)?.[1] || '500081');

      // Account joined date
      const createdAt = c.createdAt || (sortedBookings[sortedBookings.length - 1]?.createdAt) || null;
      const formattedDate = createdAt 
        ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : 'Registered';
      
      const daysSinceJoined = createdAt ? Math.floor((now - new Date(createdAt)) / (1000 * 60 * 60 * 24)) : 30;

      // Customer Segmentation Logic
      let segment = 'Regular Customer';
      let segmentColor = 'bg-slate-100 text-slate-700 border-slate-200';
      let segmentKey = 'REGULAR';

      if (isAdmin) {
        segment = 'Platform Admin';
        segmentColor = 'bg-purple-100 text-purple-800 border-purple-200';
        segmentKey = 'ADMIN';
      } else if (lifetimeValue >= 2500 || totalOrders >= 3) {
        segment = 'VIP Elite';
        segmentColor = 'bg-amber-100 text-amber-900 border-amber-300 font-black';
        segmentKey = 'VIP';
      } else if (totalOrders >= 1) {
        segment = 'Active Booker';
        segmentColor = 'bg-blue-100 text-blue-800 border-blue-200';
        segmentKey = 'ACTIVE';
      } else if (daysSinceJoined <= 14) {
        segment = 'New Member';
        segmentColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        segmentKey = 'NEW';
      }

      return {
        ...c,
        id: userId,
        userId,
        fullName,
        name: fullName,
        phone,
        email,
        role,
        isAdmin,
        isWorker,
        address: rawAddress,
        pincode: rawPincode,
        createdAt,
        formattedDate,
        daysSinceJoined,
        matchedBookings: sortedBookings,
        totalOrders,
        completedOrders,
        cancelledOrders,
        lifetimeValue,
        averageOrderValue,
        segment,
        segmentColor,
        segmentKey
      };
    });
  }, [customers, customerBookingsMap]);

  // Dynamic Summary Metrics
  const totalUsersCount = enrichedCustomers.length;
  const customersOnly = useMemo(() => enrichedCustomers.filter(c => !c.isAdmin), [enrichedCustomers]);
  const adminsOnly = useMemo(() => enrichedCustomers.filter(c => c.isAdmin), [enrichedCustomers]);

  const vipCustomersCount = useMemo(() => customersOnly.filter(c => c.segmentKey === 'VIP').length, [customersOnly]);
  const activeBookersCount = useMemo(() => customersOnly.filter(c => c.totalOrders > 0).length, [customersOnly]);
  const newMembersCount = useMemo(() => customersOnly.filter(c => c.segmentKey === 'NEW').length, [customersOnly]);

  const totalGrossLtv = useMemo(() => {
    return customersOnly.reduce((sum, c) => sum + c.lifetimeValue, 0);
  }, [customersOnly]);

  const averageCustomerLtv = useMemo(() => {
    return activeBookersCount > 0 ? Math.round(totalGrossLtv / activeBookersCount) : 0;
  }, [totalGrossLtv, activeBookersCount]);

  // Distinct Hyderabad Pincodes for Filter
  const availablePincodes = useMemo(() => {
    const set = new Set();
    enrichedCustomers.forEach(c => {
      if (c.pincode) set.add(c.pincode);
    });
    return Array.from(set).sort();
  }, [enrichedCustomers]);

  // Filtered List based on Segment Tab, Search, and Pincode
  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      // 1. Segment Tab Filter
      if (activeSegmentTab === 'VIP' && c.segmentKey !== 'VIP') return false;
      if (activeSegmentTab === 'ACTIVE' && c.totalOrders === 0) return false;
      if (activeSegmentTab === 'NEW' && c.segmentKey !== 'NEW') return false;
      if (activeSegmentTab === 'ADMINS' && !c.isAdmin) return false;
      if (activeSegmentTab === 'ALL' && c.isAdmin) return false; // Show pure customer pool under ALL

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (c.fullName || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchId = (c.userId || '').toLowerCase().includes(q);
        const matchAddress = (c.address || '').toLowerCase().includes(q);
        const matchPincode = (c.pincode || '').includes(q);

        if (!matchName && !matchPhone && !matchEmail && !matchId && !matchAddress && !matchPincode) {
          return false;
        }
      }

      // 3. Pincode Filter
      if (pincodeFilter !== 'ALL') {
        if (c.pincode !== pincodeFilter) return false;
      }

      return true;
    });
  }, [enrichedCustomers, activeSegmentTab, searchQuery, pincodeFilter]);

  return (
    <div className="space-y-5 bg-[#F8FAFC]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER & 4 SUMMARY KPI CARDS                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
              Customer Directory & Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Hyderabad Region
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor customer accounts, booking history, lifetime value (LTV), delivery territories, and account governance.
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Customers */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{customersOnly.length}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Customer Accounts</div>
            </div>
          </div>

          {/* Active Bookers */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Bookers</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{activeBookersCount}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Transacted</div>
            </div>
          </div>

          {/* Average LTV */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Customer LTV</div>
              <div className="text-lg font-black text-slate-900 leading-tight">₹{averageCustomerLtv.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Lifetime spend</div>
            </div>
          </div>

          {/* Administrators */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff & Admins</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{adminsOnly.length}</div>
              <div className="text-[10px] text-purple-600 font-medium mt-0.5">Privileged access</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 CUSTOMER SEGMENT TABS (Pronto & Urban Company Analytics Caliber)        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Customers', count: customersOnly.length, icon: Users },
          { key: 'VIP', label: 'VIP Elite (High LTV)', count: vipCustomersCount, icon: Award, color: 'text-amber-600' },
          { key: 'ACTIVE', label: 'Active Bookers', count: activeBookersCount, icon: ShoppingBag, color: 'text-blue-600' },
          { key: 'NEW', label: 'New Members', count: newMembersCount, icon: UserPlus, color: 'text-emerald-600' },
          { key: 'ADMINS', label: 'Platform Admins', count: adminsOnly.length, icon: Shield, color: 'text-purple-600' },
        ].map(tab => {
          const isActive = activeSegmentTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSegmentTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-[#1D68F2] text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : (tab.color || 'text-slate-400')}`} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}

        <div className="ml-auto pl-2 flex items-center gap-2">
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              setToastMessage('Refreshed customer directory and live booking telemetry.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition"
            title="Refresh Directory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Pincode Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, phone, email, address..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs"
            />
          </div>

          {/* Operating Pincode Dropdown */}
          <div className="relative">
            <select
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs appearance-none cursor-pointer"
            >
              <option value="ALL">All Hyderabad Delivery Pincodes</option>
              {availablePincodes.map(pin => (
                <option key={pin} value={pin}>PIN {pin}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Export Button */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => {
              const headers = ['User ID', 'Customer Name', 'Phone', 'Email', 'Role', 'Segment', 'Lifetime Value', 'Total Orders', 'Completed Orders', 'Pincode', 'Address', 'Joined Date'];
              const rows = filteredCustomers.map(c => [
                c.userId,
                `"${c.fullName}"`,
                c.phone,
                c.email,
                c.role,
                c.segment,
                c.lifetimeValue,
                c.totalOrders,
                c.completedOrders,
                c.pincode,
                `"${c.address}"`,
                c.formattedDate
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `HomeEase_Customer_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMERS DATA TABLE                                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Profile</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Delivery Territory</th>
                <th className="py-3.5 px-4">Segment</th>
                <th className="py-3.5 px-4">Order History</th>
                <th className="py-3.5 px-4">Lifetime Spend (LTV)</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-700">No customer accounts found</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Adjust your search or segment filter to view registered customers in Hyderabad.
                    </div>
                  </td>
                </tr>
              )}
              {filteredCustomers.map((c, idx) => {
                const id = c.userId || c.id || `c-${idx}`;

                return (
                  <tr 
                    key={id} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Customer Profile (Avatar, Name, Email, UUID) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[210px]">
                        <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-xs shrink-0 shadow-2xs select-none ${
                          c.isAdmin 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : (c.segmentKey === 'VIP' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-50 text-[#1D68F2] border border-blue-200')
                        }`}>
                          {c.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 leading-tight truncate">
                              {c.fullName}
                            </span>
                            {c.isAdmin && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center gap-0.5 border border-purple-200">
                                <Shield className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-[180px]">
                            {c.email || 'No email registered'}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span>ID: {c.userId.slice(0, 8)}...</span>
                            <button
                              onClick={() => handleCopyId(c.userId)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Copy User ID"
                            >
                              {copiedId === c.userId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.phone ? (
                        <a 
                          href={`tel:${c.phone}`}
                          className="font-mono text-slate-700 hover:text-[#1D68F2] transition flex items-center gap-1.5 font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Delivery Territory & Pincode */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex items-start gap-1.5 text-slate-600 leading-snug">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium truncate" title={c.address}>
                            {c.address}
                          </div>
                          {c.pincode && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              PIN {c.pincode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Segment Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${c.segmentColor}`}>
                        {c.segmentKey === 'VIP' && <Award className="w-3 h-3 text-amber-600" />}
                        {c.segmentKey === 'ACTIVE' && <ShoppingBag className="w-3 h-3 text-blue-600" />}
                        {c.segmentKey === 'NEW' && <UserPlus className="w-3 h-3 text-emerald-600" />}
                        {c.segmentKey === 'ADMIN' && <Shield className="w-3 h-3 text-purple-600" />}
                        <span>{c.segment}</span>
                      </span>
                    </td>

                    {/* Order Statistics */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.completedOrders} completed • {c.cancelledOrders} cancelled
                        </div>
                      </div>
                    </td>

                    {/* Lifetime Spend (LTV) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="font-black text-slate-900 text-xs">
                          {c.lifetimeValue > 0 ? `₹${c.lifetimeValue.toLocaleString('en-IN')}` : '₹0'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.completedOrders > 0 ? `Avg ₹${c.averageOrderValue}/order` : 'No transactions'}
                        </div>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.formattedDate}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                          title="View Customer 360"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Customer 360</span>
                        </button>

                        <button
                          onClick={() => {
                            setRoleConfirmTarget({
                              user: c,
                              targetRole: c.isAdmin ? 'CUSTOMER' : 'ADMIN'
                            });
                            setShowRoleConfirmModal(true);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            c.isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={c.isAdmin ? 'Demote to Customer' : 'Promote to Admin'}
                        >
                          {c.isAdmin ? 'Demote' : 'Role'}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="px-5 py-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
          <div>
            {filteredCustomers.length === 0 ? 'Showing 0 customers' : `Showing 1-${filteredCustomers.length} of ${customersOnly.length} customers in Hyderabad`}
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 cursor-pointer disabled:opacity-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-[#1D68F2] text-white font-bold flex items-center justify-center shadow-xs">
              1
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              2
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: Customer 360 Inspection & Order History                 */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
              
              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                
                {/* Header Profile Bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full font-black flex items-center justify-center text-xl shrink-0 shadow-sm border-2 ${
                      selectedCustomer.isAdmin 
                        ? 'bg-purple-100 text-purple-700 border-purple-300' 
                        : (selectedCustomer.segmentKey === 'VIP' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-50 text-[#1D68F2] border-blue-200')
                    }`}>
                      {selectedCustomer.fullName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{selectedCustomer.fullName}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${selectedCustomer.segmentColor}`}>
                          {selectedCustomer.segmentKey === 'VIP' && <Award className="w-3 h-3 text-amber-600" />}
                          <span>{selectedCustomer.segment}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedCustomer.email || 'No email attached'}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">User UUID: {selectedCustomer.userId}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedCustomer(null)} 
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Direct Communication Bar */}
                <div className="flex items-center gap-2">
                  {selectedCustomer.phone && (
                    <>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-[#1D68F2] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-blue-200/80"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Direct Call ({selectedCustomer.phone})</span>
                      </a>
                      <a
                        href={`https://wa.me/91${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Chat</span>
                      </a>
                    </>
                  )}
                  {selectedCustomer.email && (
                    <a
                      href={`mailto:${selectedCustomer.email}`}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-200"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  )}
                </div>

                {/* Customer Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Spend (LTV)</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      ₹{selectedCustomer.lifetimeValue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Total Bookings</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {selectedCustomer.totalOrders} orders
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Completed Orders</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      {selectedCustomer.completedOrders} ({selectedCustomer.totalOrders > 0 ? Math.round((selectedCustomer.completedOrders / selectedCustomer.totalOrders) * 100) : 0}%)
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Member Since</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {selectedCustomer.formattedDate}
                    </div>
                  </div>
                </div>

                {/* Saved Address & Delivery Hub */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1D68F2]" />
                    <span>Primary Service Territory & Delivery Hub</span>
                  </h4>

                  <div className="text-xs text-slate-800 font-medium">
                    {selectedCustomer.address}
                  </div>

                  {selectedCustomer.pincode && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200">
                        Pincode: {selectedCustomer.pincode}
                      </span>
                      <span className="text-[11px] text-slate-400">Hyderabad Metropolitan Cluster</span>
                    </div>
                  )}
                </div>

                {/* Complete Order History Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#1D68F2]" />
                      <span>Booking History ({selectedCustomer.matchedBookings.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Chronological order list</span>
                  </div>

                  {selectedCustomer.matchedBookings.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <div className="font-semibold text-slate-700">No Bookings Placed Yet</div>
                      <p className="text-slate-400 mt-0.5">Orders booked via the customer mobile app will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Booking ID</th>
                            <th className="py-2.5 px-3">Service</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCustomer.matchedBookings.map((b, bIdx) => {
                            const bId = b.id || b.bookingId || `b-${bIdx}`;
                            const sName = b.serviceName || b.subServiceName || 'Home Service';
                            const bDate = b.scheduledAt || b.createdAt 
                              ? new Date(b.scheduledAt || b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : 'Scheduled';
                            const bStatus = (b.status || 'NEW').toUpperCase();
                            const bAmount = Number(b.totalAmount || b.amount || b.price || 0);

                            let badgeCls = 'bg-slate-100 text-slate-700';
                            if (bStatus === 'COMPLETED') badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            else if (bStatus === 'IN_PROGRESS' || bStatus === 'ARRIVING') badgeCls = 'bg-blue-50 text-blue-700 border-blue-200';
                            else if (bStatus === 'CANCELLED') badgeCls = 'bg-rose-50 text-rose-700 border-rose-200';
                            else if (bStatus === 'MATCHING' || bStatus === 'WAITING_FOR_WORKER') badgeCls = 'bg-amber-50 text-amber-700 border-amber-200';

                            return (
                              <tr key={bId} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                  #{bId.slice(0, 8)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {sName}
                                  {b.assignedWorkerName && (
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      Worker: {b.assignedWorkerName}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-medium">
                                  {bDate}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls}`}>
                                    {bStatus}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                  ₹{bAmount.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Account Governance & Role Modification */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Account Role & Access Privileges</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Current role: <span className="font-bold text-slate-700">{selectedCustomer.role}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setRoleConfirmTarget({
                          user: selectedCustomer,
                          targetRole: selectedCustomer.isAdmin ? 'CUSTOMER' : 'ADMIN'
                        });
                        setShowRoleConfirmModal(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        selectedCustomer.isAdmin
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {selectedCustomer.isAdmin ? 'Demote to Customer' : 'Promote to Platform Admin'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  HomeEase Customer Governance ID #{selectedCustomer.userId.slice(0, 8)}
                </span>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Role Change Confirmation                                           */}
      {/* ========================================================================= */}
      {showRoleConfirmModal && roleConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Confirm Role Privileges</h3>
              </div>
              <button onClick={() => setShowRoleConfirmModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Modify account role for {roleConfirmTarget.user.fullName || roleConfirmTarget.user.name}?
                  </p>
                  <p className="mt-1 text-purple-700 leading-relaxed">
                    Target Role: <strong className="font-mono">{roleConfirmTarget.targetRole}</strong>. 
                    {roleConfirmTarget.targetRole === 'ADMIN' 
                      ? ' Granting Admin privileges provides full read/write access to dispatch operations, KYC approvals, and catalog editing.'
                      : ' Demoting will revoke all admin panel login and operational privileges.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowRoleConfirmModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeRoleChange}
                disabled={isUpdatingRole}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isUpdatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Role Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
