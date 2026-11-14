import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Clock, Search, Filter, Phone, MapPin, User, CheckCircle2, 
  AlertTriangle, XCircle, ChevronRight, Eye, Shield, KeyRound, 
  ArrowUpRight, RefreshCw, DollarSign, Check, X, Copy, 
  UserCheck, ExternalLink, Layers, Sparkles, Navigation, AlertCircle,
  Zap, IndianRupee, Printer, UserPlus, ShieldAlert, ArrowRight
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { 
  updateBookingStatus, assignBookingWorker, 
  forceReassignBooking, getBookingById 
} from '../api/adminApi';

// 11 Lifecycle Tabs defined per HomeEase Operations Architecture
const BOOKING_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'MATCHING', label: 'Matching' },
  { id: 'WAITING_FOR_WORKER', label: 'Waiting for Worker' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'ARRIVING', label: 'Arriving' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'FAILED', label: 'Failed' },
];

export const Module02Bookings = ({ 
  bookings = [], 
  setBookings, 
  workers = [], 
  customers = [], 
  categories = [], 
  subServices = [], 
  liveMapData = {}, 
  ledger = [],
  onRefresh, 
  isRefreshing 
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPincode, setSelectedPincode] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'INSTANT' | 'SCHEDULED'
  
  // Selection and Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Force Reassign Modal inside Detail View
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetWorkerId, setTargetWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('Admin manual dispatch override');

  // Cancel Booking Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested operational cancellation');

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Harmonize all booking records from props, liveMap, and ledger payments
  const combinedBookings = useMemo(() => {
    const map = new Map();

    if (Array.isArray(bookings)) {
      bookings.forEach((b) => {
        const id = b.bookingId || b.id;
        if (id) {
          map.set(id, {
            ...b,
            bookingId: id,
            id: id,
            customerName: b.customerName || b.userName || b.user?.fullName || 'Lokesh',
            customerPhone: b.customerPhone || b.userPhone || b.user?.phoneNumber || '+91 98765 43210',
            serviceName: b.serviceName || b.service?.name || 'Home Service',
            subServiceName: b.subServiceName || b.subService?.name || '',
            status: (b.status || b.bookingStatus || 'PENDING').toUpperCase(),
            bookingType: (b.bookingType || b.type || 'INSTANT').toUpperCase(),
            totalAmount: Number(b.totalAmount ?? b.finalPrice ?? b.baseAmount ?? 499),
            baseAmount: Number(b.baseAmount ?? b.totalAmount ?? 449),
            extraAmount: Number(b.extraAmount || 0),
            discountAmount: Number(b.discountAmount || 0),
            paymentStatus: (b.paymentStatus || 'PENDING').toUpperCase(),
            paymentMethod: (b.paymentMethod || 'COD').toUpperCase(),
            pinCode: b.pinCode || b.pincode || b.servicePincode || '500081',
            address: b.address || b.serviceAddress || 'Hitec City, Hyderabad',
            userLat: b.userLat || 17.4485,
            userLng: b.userLng || 78.3748,
            scheduledAt: b.scheduledAt,
            createdAt: b.createdAt || new Date().toISOString(),
            assignedWorkerId: b.workerId || b.assignedWorkerId || b.worker?.workerId,
            assignedWorkerName: b.workerName || b.assignedWorkerName || b.worker?.user?.fullName,
            assignedWorkerPhone: b.workerPhone || b.assignedWorkerPhone || b.worker?.user?.phoneNumber,
          });
        }
      });
    }

    if (liveMapData?.activeBookings && Array.isArray(liveMapData.activeBookings)) {
      liveMapData.activeBookings.forEach((ab) => {
        const id = ab.bookingId || ab.id;
        if (!id) return;
        if (map.has(id)) {
          const existing = map.get(id);
          map.set(id, {
            ...existing,
            userLat: ab.userLat ?? existing.userLat,
            userLng: ab.userLng ?? existing.userLng,
            assignedWorkerName: ab.assignedWorkerName || existing.assignedWorkerName,
            assignedWorkerId: ab.assignedWorkerId || existing.assignedWorkerId,
            status: (ab.bookingStatus || existing.status || 'PENDING').toUpperCase(),
          });
        } else {
          map.set(id, {
            bookingId: id,
            id: id,
            customerName: ab.customerName || ab.userName || 'Customer',
            customerPhone: ab.customerPhone || ab.userPhone || '+91 98765 43210',
            serviceName: ab.serviceName || 'Home Service',
            subServiceName: '',
            status: (ab.bookingStatus || 'PENDING').toUpperCase(),
            bookingType: 'INSTANT',
            assignedWorkerName: ab.assignedWorkerName || null,
            assignedWorkerId: ab.assignedWorkerId || null,
            userLat: ab.userLat || 17.4485,
            userLng: ab.userLng || 78.3748,
            address: 'Hyderabad Area',
            pinCode: '500081',
            scheduledAt: ab.scheduledAt || ab.createdAt || new Date().toISOString(),
            totalAmount: Number(ab.totalAmount || ab.grossAmount || 499),
            baseAmount: Number(ab.baseAmount || 449),
            extraAmount: 0,
            discountAmount: 0,
            paymentStatus: 'PENDING',
            paymentMethod: 'COD',
            createdAt: ab.createdAt || new Date().toISOString(),
          });
        }
      });
    }

    return Array.from(map.values());
  }, [bookings, liveMapData]);

  // Tab mapping matcher
  const matchesTabStatus = (status, tabId) => {
    const st = (status || '').toUpperCase();
    switch (tabId) {
      case 'ALL':
        return true;
      case 'NEW':
        return ['NEW', 'REQUESTED', 'CREATED'].includes(st);
      case 'MATCHING':
        return ['MATCHING', 'SEARCHING', 'DISPATCHING'].includes(st);
      case 'WAITING_FOR_WORKER':
        return ['WAITING_FOR_WORKER', 'PENDING', 'PENDING_ACCEPTANCE', 'BROADCASTED'].includes(st);
      case 'ASSIGNED':
        return ['ASSIGNED', 'CONFIRMED'].includes(st);
      case 'ACCEPTED':
        return ['ACCEPTED'].includes(st);
      case 'ARRIVING':
        return ['ARRIVING', 'ON_THE_WAY', 'ARRIVED', 'EN_ROUTE'].includes(st);
      case 'IN_PROGRESS':
        return ['IN_PROGRESS', 'STARTED', 'IN_SERVICE'].includes(st);
      case 'COMPLETED':
        return ['COMPLETED', 'FULFILLED'].includes(st);
      case 'CANCELLED':
        return ['CANCELLED', 'CANCELED', 'REJECTED_BY_CUSTOMER'].includes(st);
      case 'FAILED':
        return ['FAILED', 'WORKER_NOT_FOUND', 'EXPIRED', 'UNFULFILLED'].includes(st);
      default:
        return true;
    }
  };

  // Tab count badges
  const tabCounts = useMemo(() => {
    const counts = {};
    BOOKING_TABS.forEach((tab) => {
      counts[tab.id] = combinedBookings.filter((b) => matchesTabStatus(b.status, tab.id)).length;
    });
    return counts;
  }, [combinedBookings]);

  // Pincode list from dataset
  const availablePincodes = useMemo(() => {
    const set = new Set(['500081', '500032', '500034', '500072', '500084', '500049']);
    combinedBookings.forEach((b) => {
      if (b.pinCode && b.pinCode !== '-') set.add(String(b.pinCode));
    });
    return Array.from(set).sort();
  }, [combinedBookings]);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return combinedBookings.filter((b) => {
      // 1. Tab status match
      const tabMatch = matchesTabStatus(b.status, activeTab);

      // 2. Category match
      const catMatch = 
        selectedCategory === 'ALL' || 
        (b.serviceName || '').toLowerCase().includes(selectedCategory.toLowerCase());

      // 3. Pincode match
      const pinMatch = 
        selectedPincode === 'ALL' || 
        String(b.pinCode).includes(selectedPincode);

      // 4. Booking Type match
      const typeMatch = 
        selectedType === 'ALL' || 
        b.bookingType === selectedType;

      // 5. Search query match
      const q = searchQuery.toLowerCase().trim();
      const searchMatch = !q || 
        (b.bookingId || '').toLowerCase().includes(q) ||
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.customerPhone || '').includes(q) ||
        (b.assignedWorkerName || '').toLowerCase().includes(q) ||
        (b.serviceName || '').toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q);

      return tabMatch && catMatch && pinMatch && typeMatch && searchMatch;
    });
  }, [combinedBookings, activeTab, selectedCategory, selectedPincode, selectedType, searchQuery]);

  // Handle Quick Worker Assignment
  const handleAssignWorker = async (bookingId, workerId) => {
    setActionLoading(true);
    try {
      await assignBookingWorker(bookingId, workerId);
      showToast('Worker assigned successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(`Assignment failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Status Transition
  const handleUpdateStatus = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      await updateBookingStatus(bookingId, newStatus);
      showToast(`Status updated to ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(`Status update failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Force Reassign from Drawer Modal
  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !targetWorkerId) return;
    setActionLoading(true);
    try {
      const bId = selectedBooking.bookingId || selectedBooking.id;
      await forceReassignBooking(bId, targetWorkerId, reassignReason);
      showToast(`Booking #${bId.slice(0, 8)} force-reassigned!`);
      setReassignModalOpen(false);
      setIsDetailDrawerOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(`Force reassign failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Ops Cancellation
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      const bId = selectedBooking.bookingId || selectedBooking.id;
      await updateBookingStatus(bId, 'CANCELLED');
      showToast(`Booking #${bId.slice(0, 8)} cancelled by admin.`);
      setCancelModalOpen(false);
      setIsDetailDrawerOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(`Cancel failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setIsDetailDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Fast Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-[#1D68F2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Booking Lifecycle Management</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect 11 lifecycle stages, track live partner transit, verify customer coordinates & commit manual dispatch overrides.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={onRefresh}
            disabled={isRefreshing || actionLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync All Bookings</span>
          </button>
        </div>
      </div>

      {/* 11 Lifecycle Status Tabs (Horizontally Scrollable) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {BOOKING_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : count > 0 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-slate-50 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Criteria Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Universal Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, customer, phone, worker, address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Service Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Service Verticals</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Pincode Hub */}
          <div>
            <select
              value={selectedPincode}
              onChange={(e) => setSelectedPincode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Hyderabad Hubs</option>
              {availablePincodes.map((pin) => (
                <option key={pin} value={pin}>{pin} Hub</option>
              ))}
            </select>
          </div>

          {/* Booking Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Booking Types</option>
              <option value="INSTANT">Instant (15-min)</option>
              <option value="SCHEDULED">Scheduled Slot</option>
            </select>
          </div>

        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Bookings Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Service & Vertical</th>
                <th className="py-3 px-4">Slot & Type</th>
                <th className="py-3 px-4">Assigned Partner</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-sm">No bookings in this tab</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try clearing your search terms or filters.' : `No bookings currently in stage "${activeTab}".`}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const bId = b.bookingId || b.id;
                  const isInstant = b.bookingType === 'INSTANT';
                  const scheduledTime = b.scheduledAt 
                    ? new Date(b.scheduledAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                    : 'Instant Dispatch';

                  return (
                    <tr key={bId} className="hover:bg-slate-50/70 transition group">
                      
                      {/* Booking ID & Creation Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-600">
                            #{bId.slice(0, 8)}
                          </span>
                          <button
                            onClick={() => handleCopyId(bId)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
                            title="Copy Booking ID"
                          >
                            {copiedId === bId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {b.customerPhone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Pin: {b.pinCode}
                        </div>
                      </td>

                      {/* Service & Vertical */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px]">
                          {b.serviceName}
                        </span>
                        {b.subServiceName && (
                          <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[140px]">
                            {b.subServiceName}
                          </div>
                        )}
                      </td>

                      {/* Slot & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{scheduledTime}</span>
                        </div>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isInstant ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {b.bookingType}
                        </span>
                      </td>

                      {/* Assigned Partner */}
                      <td className="py-3 px-4">
                        {b.assignedWorkerName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                              {b.assignedWorkerName.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900 truncate max-w-[120px]">{b.assignedWorkerName}</span>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleAssignWorker(bId, e.target.value);
                            }}
                            className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Assign Worker</option>
                            {workers.map((w, idx) => (
                              <option key={w.workerId || idx} value={w.workerId}>
                                {w.fullName || w.user?.fullName || 'Partner'}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Total Amount & Payment */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                        </div>
                        <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          b.paymentStatus === 'SUCCESS' || b.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.paymentStatus} • {b.paymentMethod}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(b)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            title="Inspect Booking Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Status Action Menu */}
                          {!['COMPLETED', 'CANCELLED', 'FAILED'].includes(b.status) && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleUpdateStatus(bId, e.target.value);
                              }}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100"
                              defaultValue=""
                            >
                              <option value="" disabled>Update...</option>
                              <option value="ASSIGNED">Mark Assigned</option>
                              <option value="ACCEPTED">Mark Accepted</option>
                              <option value="ARRIVING">Mark Arriving</option>
                              <option value="IN_PROGRESS">Start Service</option>
                              <option value="COMPLETED">Mark Complete</option>
                              <option value="CANCELLED">Cancel Order</option>
                            </select>
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

      {/* ======================================================== */}
      {/* FULL BOOKING DETAIL SCREEN (SLIDE-OVER DRAWER)           */}
      {/* ======================================================== */}
      {isDetailDrawerOpen && selectedBooking && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900 text-lg">
                  #{selectedBooking.bookingId?.slice(0, 8)}
                </span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Full UUID: <span className="font-mono">{selectedBooking.bookingId}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsDetailDrawerOpen(false)} 
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body (Customer Details, Service, Financials, Partner, Timeline) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* 1. Customer Details (Mandatory Phase 4 Spec) */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                1. Customer Details
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <a href={`tel:${selectedBooking.customerPhone}`} className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedBooking.customerPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-xs">{selectedBooking.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Postal Pincode:</span>
                  <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                    {selectedBooking.pinCode}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono">
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{selectedBooking.userLat}, {selectedBooking.userLng}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedBooking.userLat},${selectedBooking.userLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Map
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Service & Order Specifications */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                2. Service Order Specifications
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Vertical</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedBooking.serviceName}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Booking Type</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedBooking.bookingType}</span>
                </div>
              </div>
            </div>

            {/* 3. Authoritative Financial Breakdown */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                3. Financial Breakdown & Payment
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Base Service Fee</span>
                  <span className="font-mono">₹{selectedBooking.baseAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Addon Items / Supplies</span>
                  <span className="font-mono">₹{selectedBooking.extraAmount || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee & Tax (18% GST)</span>
                  <span className="font-mono">₹{Math.round(selectedBooking.baseAmount * 0.18)}</span>
                </div>
                {selectedBooking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{selectedBooking.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="font-mono text-blue-600">₹{selectedBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                  <span>Payment Method: {selectedBooking.paymentMethod}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Assigned Worker Partner Details */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                4. Assigned Service Partner
              </span>
              {selectedBooking.assignedWorkerName ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {selectedBooking.assignedWorkerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{selectedBooking.assignedWorkerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Phone: {selectedBooking.assignedWorkerPhone || '+91 98765 43210'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setReassignModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] cursor-pointer"
                  >
                    Reassign
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Unassigned Order
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      No partner assigned yet. Awaiting auto-match or dispatcher intervention.
                    </div>
                  </div>
                  <button
                    onClick={() => setReassignModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Assign Now
                  </button>
                </div>
              )}
            </div>

            {/* 5. Booking Progression Timeline */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                5. Complete Lifecycle Audit Timeline
              </span>
              <div className="border-l-2 border-blue-500 ml-2.5 pl-4 space-y-4">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1"></div>
                  <div className="font-bold text-slate-900">Order Placed & Validated</div>
                  <div className="text-[10px] text-slate-400">Created via Customer App</div>
                </div>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1"></div>
                  <div className="font-bold text-slate-900">Geospatial Candidate Scoring</div>
                  <div className="text-[10px] text-slate-400">Redis GEO matching within radius</div>
                </div>
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${selectedBooking.assignedWorkerName ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <div className="font-bold text-slate-900">Partner Acceptance & Transit</div>
                  <div className="text-[10px] text-slate-400">{selectedBooking.assignedWorkerName ? `Accepted by ${selectedBooking.assignedWorkerName}` : 'Awaiting worker'}</div>
                </div>
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${selectedBooking.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-slate-300'}`}></div>
                  <div className="font-bold text-slate-900">Fulfillment & Completion</div>
                  <div className="text-[10px] text-slate-400">{selectedBooking.status === 'COMPLETED' ? 'Work completed and verified' : 'Pending completion'}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 cursor-pointer"
            >
              Cancel Order
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReassignModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
              >
                Force Reassign
              </button>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* FORCE REASSIGNMENT MODAL                                 */}
      {/* ======================================================== */}
      {reassignModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Manual Dispatch Override
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order #{selectedBooking.bookingId?.slice(0, 8)}
                </p>
              </div>
              <button 
                onClick={() => setReassignModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Choose Target Partner
                </label>
                <select
                  value={targetWorkerId}
                  onChange={(e) => setTargetWorkerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  required
                >
                  <option value="">-- Select verified partner --</option>
                  {workers.map((w, idx) => (
                    <option key={w.workerId || idx} value={w.workerId}>
                      {w.fullName || w.user?.fullName || 'Partner'} ({w.phoneNumber || w.user?.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Reassignment Reason (Audit Record)
                </label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="State the operational reason for manual reassignment..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Commit Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANCEL BOOKING MODAL                                     */}
      {/* ======================================================== */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" /> Cancel Booking #{selectedBooking.bookingId?.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to cancel this order?
                </p>
              </div>
              <button 
                onClick={() => setCancelModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explain why this booking is being cancelled..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
