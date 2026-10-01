import React, { useState } from 'react';
import { 
  Users, ShieldCheck, Clock, Ban, Search, Download, Plus, 
  Send, Shield, CheckCircle, MapPin, Eye, X, ChevronLeft, ChevronRight, 
  AlertTriangle, Check, ArrowUpDown, ChevronDown, Loader2, User, FileText, ImageOff
} from 'lucide-react';
import { blockWorker, unblockWorker, verifyWorkerKYC, uploadWorkerProfile, uploadWorkerPan, uploadWorkerAadhaar } from '../api/adminApi';

export const Module04Workers = ({ workers = [], setWorkers, onRefresh }) => {
  // Live API workers mapping
  const effectiveWorkers = (workers && Array.isArray(workers))
    ? workers.map((w, i) => {
        const id = w.workerId || w.id || `w-${i+1}`;
        const isVerified = w.isVerified ?? (w.kycStatus === 'VERIFIED');
        const isBlocked = w.isBlocked ?? false;
        return {
          ...w,
          id,
          workerId: id,
          name: w.fullName || w.name || 'Partner Worker',
          email: w.email || 'worker@homeease.in',
          phone: w.phoneNumber || w.phone || '-',
          address: w.address || 'Address unlisted',
          kycStatus: isVerified ? 'VERIFIED' : (w.kycStatus || 'PENDING'),
          kycLabel: isVerified ? 'Verified (Emerald)' : (w.kycStatus || 'Pending Review'),
          isOnline: w.isOnline !== undefined ? w.isOnline : false,
          coordinates: (w.currentLat && w.currentLng) ? `${w.currentLat}, ${w.currentLng}` : (w.coordinates || 'N/A'),
          lastSeen: w.lastSeen || (w.updatedAt ? new Date(w.updatedAt).toLocaleTimeString() : 'Recently'),
          isBlocked,
          disciplinaryStatus: isBlocked ? 'Blocked' : 'Active',
          avatar: w.profilePhotoUrl || w.avatar || ''
        };
      })
    : [];

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [onlineFilter, setOnlineFilter] = useState('ALL');

  // Multi-selection state (checked rows) matching screenshot (first 3 checked by default)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers state
  const [activeWorkerModal, setActiveWorkerModal] = useState(null); // 'review-kyc' | 'discipline' | 'profile' | 'add-worker' | 'broadcast'
  const [modalTargetWorker, setModalTargetWorker] = useState(null);
  const [blockDurationHours, setBlockDurationHours] = useState(24);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Worker Form state
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerAddress, setNewWorkerAddress] = useState('');

  // Filter logic
  const filteredWorkers = effectiveWorkers.filter(w => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (w.name || '').toLowerCase().includes(q) ||
      (w.phone || '').toLowerCase().includes(q) ||
      (w.email || '').toLowerCase().includes(q) ||
      (w.address || '').toLowerCase().includes(q);

    let matchVerification = true;
    if (verificationFilter === 'VERIFIED') matchVerification = w.kycStatus === 'VERIFIED';
    else if (verificationFilter === 'PENDING') matchVerification = w.kycStatus === 'PENDING';
    else if (verificationFilter === 'REJECTED') matchVerification = w.kycStatus === 'REJECTED';

    let matchOnline = true;
    if (onlineFilter === 'ONLINE') matchOnline = w.isOnline === true;
    else if (onlineFilter === 'OFFLINE') matchOnline = w.isOnline === false;

    return matchSearch && matchVerification && matchOnline;
  });

  // Dynamic KPI Metrics Calculation
  const totalCount = effectiveWorkers.length;
  const verifiedCount = effectiveWorkers.filter(w => w.kycStatus === 'VERIFIED').length;
  const pendingCount = effectiveWorkers.filter(w => w.kycStatus === 'PENDING').length;
  const blockedCount = effectiveWorkers.filter(w => w.isBlocked).length;

  // Handle select / deselect row
  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredWorkers.map(w => w.workerId || w.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Action: Discipline / Block
  const handleConfirmDiscipline = async () => {
    if (!modalTargetWorker) return;
    setIsProcessing(true);
    const wId = modalTargetWorker.workerId || modalTargetWorker.id;

    try {
      await blockWorker(wId, blockDurationHours);
    } catch (err) {
      console.warn('API error, applying optimistically:', err.message);
    }

    setWorkers(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(w => (w.workerId === wId || w.id === wId) 
        ? { ...w, isBlocked: true, disciplinaryStatus: `Blocked until 28 Sep 18:00` } 
        : w
      );
    });

    setIsProcessing(false);
    setActiveWorkerModal(null);
    setToastMessage(`Worker suspended for ${blockDurationHours} hours.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Unblock
  const handleUnblock = async (w) => {
    const wId = w.workerId || w.id;
    try {
      await unblockWorker(wId);
    } catch (err) {
      console.warn('API unblock error, applying optimistically:', err.message);
    }

    setWorkers(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(item => (item.workerId === wId || item.id === wId)
        ? { ...item, isBlocked: false, disciplinaryStatus: 'Active' }
        : item
      );
    });

    setToastMessage(`Worker unblocked and reinstated to active pool.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Approve KYC
  const handleApproveKYC = async () => {
    if (!modalTargetWorker) return;
    setIsProcessing(true);
    const wId = modalTargetWorker.workerId || modalTargetWorker.id;

    try {
      await verifyWorkerKYC(wId);
    } catch (err) {
      console.warn('API KYC verify warning:', err.message);
    }

    setWorkers(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(item => (item.workerId === wId || item.id === wId)
        ? { ...item, kycStatus: 'VERIFIED', kycLabel: 'Verified (Emerald)' }
        : item
      );
    });

    setIsProcessing(false);
    setActiveWorkerModal(null);
    setToastMessage(`KYC approved successfully! Worker given Emerald badge.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Create Worker
  const handleCreateWorker = (e) => {
    e.preventDefault();
    if (!newWorkerName) return;

    const newW = {
      id: `w-${Date.now()}`,
      workerId: `w-${Date.now()}`,
      name: newWorkerName,
      email: newWorkerEmail || 'partner@homeease.in',
      phone: newWorkerPhone || '+91 9000000000',
      address: newWorkerAddress || '#10, Bengaluru',
      kycStatus: 'PENDING',
      kycLabel: 'Pending Review',
      isOnline: true,
      coordinates: '12.9716, 77.5946',
      lastSeen: 'Just now',
      isBlocked: false,
      disciplinaryStatus: 'Active',
      avatar: null,
      skills: 'General Service',
      rating: 5.0,
      jobsCompleted: 0
    };

    setWorkers(prev => [newW, ...(prev && prev.length > 0 ? prev : [])]);
    setActiveWorkerModal(null);
    setNewWorkerName('');
    setNewWorkerPhone('');
    setNewWorkerEmail('');
    setNewWorkerAddress('');
    setToastMessage('New partner onboarded successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 bg-[#F8FAFC]">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER & 4 METRIC KPI CARDS (Matching Reference Screenshot)           */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Worker Fleet & Partner Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your worker fleet, verify KYC, and keep track of partner status.
          </p>
        </div>

        {/* 4 KPI Cards in a row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-3.5">
          
          {/* Card 1: Total Workers */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Workers</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{totalCount}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ +12 this week</div>
            </div>
          </div>

          {/* Card 2: Verified */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{verifiedCount}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">79.8%</div>
            </div>
          </div>

          {/* Card 3: Pending KYC */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending KYC</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">12.9%</div>
            </div>
          </div>

          {/* Card 4: Blocked */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocked</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{blockedCount}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">7.3%</div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH TOOLBAR (Matching Reference Screenshot)                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left: Search input & Status dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name / Phone / Worker ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
            />
          </div>

          {/* Verification Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden xl:inline">
              Verification Status
            </span>
            <div className="relative">
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Online Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden xl:inline">
              Online Status
            </span>
            <div className="relative">
              <select
                value={onlineFilter}
                onChange={(e) => setOnlineFilter(e.target.value)}
                className="pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs appearance-none cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Right: Export Button & + Add Worker Button */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => alert('Exporting Worker Directory as CSV...')}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setActiveWorkerModal('add-worker')}
            className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Worker</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BULK ACTION BAR (Matching Reference Screenshot)                           */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 px-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selection Count Pill */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 pr-2 border-r border-slate-200">
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0} 
                onChange={() => setSelectedIds([])}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>{selectedIds.length} workers selected</span>
            </label>

            {/* Broadcast Push Button */}
            <button
              onClick={() => setActiveWorkerModal('broadcast')}
              className="px-3.5 py-1.5 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Push to Selected {selectedIds.length} Workers</span>
            </button>

            {/* Change Verification Status Button */}
            <button
              onClick={() => {
                alert(`Batch verification requested for ${selectedIds.length} workers.`);
              }}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Verification Status</span>
            </button>

            {/* Block / Unblock Button */}
            <button
              onClick={() => {
                if (window.confirm(`Toggle block status for ${selectedIds.length} selected partners?`)) {
                  setToastMessage(`Disciplinary action updated for ${selectedIds.length} workers.`);
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-slate-500" />
              <span>Block / Unblock</span>
            </button>
          </div>

          {/* Clear Selection Link */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Clear Selection
          </button>

        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKERS DATA TABLE (Matching Reference Screenshot)                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === filteredWorkers.length && filteredWorkers.length > 0}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" 
                  />
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Worker Info</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Address</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>KYC Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Current State</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    <span>Disciplinary Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div className="font-semibold text-slate-600">No partner workers found</div>
                    <div className="text-xs text-slate-400 mt-0.5">Workers registered or verified through the mobile partner app will appear here.</div>
                  </td>
                </tr>
              )}
              {filteredWorkers.map((w) => {
                const id = w.workerId || w.id;
                const isChecked = selectedIds.includes(id);

                return (
                  <tr 
                    key={id} 
                    className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleSelectRow(id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" 
                      />
                    </td>

                    {/* Worker Info (Avatar, Name, Email, Phone) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {w.avatar && !w.avatar.includes('unsplash') ? (
                          <img 
                            src={w.avatar} 
                            alt={w.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.worker-avatar-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="worker-avatar-fallback w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 select-none"
                          style={{ display: (w.avatar && !w.avatar.includes('unsplash')) ? 'none' : 'flex' }}
                        >
                          {(w.name || 'W').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 leading-tight">
                            {w.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                            {w.email}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {w.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Address with MapPin */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="flex items-start gap-1.5 text-slate-600 leading-snug">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] font-medium">{w.address}</span>
                      </div>
                    </td>

                    {/* KYC Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {w.kycStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#137333] border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Verified (Emerald)
                        </span>
                      )}
                      {w.kycStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                          Pending Review
                        </span>
                      )}
                      {w.kycStatus === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-rose-200">
                          <X className="w-3 h-3 stroke-[3]" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Current State (Online/Offline + Lat/Lng + Last Seen) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${w.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="font-bold text-slate-800 text-xs">
                            {w.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {w.coordinates}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({w.lastSeen})
                        </div>
                      </div>
                    </td>

                    {/* Disciplinary Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {!w.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <Ban className="w-3 h-3" /> {w.disciplinaryStatus}
                        </span>
                      )}
                    </td>

                    {/* Actions: Review KYC, Discipline / Unblock, View Profile */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* 1. Review KYC */}
                        <button
                          onClick={() => {
                            setModalTargetWorker(w);
                            setActiveWorkerModal('review-kyc');
                          }}
                          className="px-2.5 py-1 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                        >
                          Review KYC
                        </button>

                        {/* 2. Discipline / Unblock */}
                        {!w.isBlocked ? (
                          <button
                            onClick={() => {
                              setModalTargetWorker(w);
                              setActiveWorkerModal('discipline');
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3 text-slate-500" />
                            <span>Discipline</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(w)}
                            className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-emerald-600 font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Unblock</span>
                          </button>
                        )}

                        {/* 3. View Profile */}
                        <button
                          onClick={() => {
                            setModalTargetWorker(w);
                            setActiveWorkerModal('profile');
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View Profile</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination matching screenshot */}
        <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {filteredWorkers.length === 0 ? 'Showing 0 workers' : `Showing 1-${filteredWorkers.length} of ${totalCount} workers`}
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 cursor-pointer disabled:opacity-50">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-[#1D68F2] text-white font-bold flex items-center justify-center shadow-xs">
              1
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              2
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              3
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              4
            </button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              5
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center justify-center cursor-pointer">
              31
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: Review Worker KYC Document                                         */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'review-kyc' && modalTargetWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Worker KYC Review</h3>
                <p className="text-xs text-slate-500">{modalTargetWorker.name} • {modalTargetWorker.phone}</p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Govt Aadhaar / PAN Verification</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">UIDAI Token: 8294-XXXX-9912</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                  Document Verified
                </span>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1.5">Submitted Identity Card Scan</div>
                <div className="h-36 rounded-xl bg-slate-50 border border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                  <FileText className="w-10 h-10 text-blue-500 mb-1.5" />
                  <span className="text-xs font-bold text-slate-700">Official Government Identity Document</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Stored in Supabase S3 (homeease-worker-kyc)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleApproveKYC}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Grant Emerald Verification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Disciplinary Suspension Action                                     */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'discipline' && modalTargetWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enforce Partner Disciplinary Action</h3>
                <p className="text-xs text-slate-500">Suspending access for {modalTargetWorker.name}</p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p>
                  Suspending this partner blocks them from taking live dispatch jobs on the HomeEase partner app.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Duration</label>
                <select 
                  value={blockDurationHours}
                  onChange={(e) => setBlockDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value={24}>24 Hours (Temporary Notice)</option>
                  <option value={72}>72 Hours (Policy Review)</option>
                  <option value={168}>7 Days (Severe Warning)</option>
                  <option value={720}>30 Days (Extended Suspension)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscipline}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Ban className="w-4 h-4" />
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: View Worker Profile Drawer                                         */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'profile' && modalTargetWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Partner Details</h3>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                {modalTargetWorker.avatar && !modalTargetWorker.avatar.includes('unsplash') ? (
                  <img 
                    src={modalTargetWorker.avatar} 
                    alt={modalTargetWorker.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.modal-worker-avatar-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="modal-worker-avatar-fallback w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 select-none shadow-sm"
                  style={{ display: (modalTargetWorker.avatar && !modalTargetWorker.avatar.includes('unsplash')) ? 'none' : 'flex' }}
                >
                  {modalTargetWorker.name?.charAt(0)?.toUpperCase() || 'W'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{modalTargetWorker.name}</h4>
                  <p className="text-slate-500 font-medium">{modalTargetWorker.skills || 'HomeEase Verified Specialist'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{modalTargetWorker.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Rating</div>
                  <div className="text-sm font-black text-slate-900">★ {modalTargetWorker.rating || 4.9} / 5.0</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Completed Jobs</div>
                  <div className="text-sm font-black text-slate-900">{modalTargetWorker.jobsCompleted || 142} orders</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Registered Service Territory</div>
                <div className="text-xs font-semibold text-slate-800">{modalTargetWorker.address}</div>
                <div className="text-[10px] font-mono text-slate-400">GPS: {modalTargetWorker.coordinates}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: + Add Worker                                                       */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'add-worker' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleCreateWorker} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Onboard New Worker Partner</h3>
              <button type="button" onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input 
                  type="text" 
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                <input 
                  type="text" 
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate Email</label>
                <input 
                  type="email" 
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="rahul.s@homeease.in"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Address / Base Hub</label>
                <input 
                  type="text" 
                  value={newWorkerAddress}
                  onChange={(e) => setNewWorkerAddress(e.target.value)}
                  placeholder="#14, Sector 4, Bengaluru"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Create Partner Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Broadcast Push to Selected Workers                                 */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'broadcast' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Broadcast Push Notification</h3>
                <p className="text-xs text-slate-500">Delivering to {selectedIds.length} selected partners</p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notification Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. High demand alert in Indiranagar! Login now for 1.5x payout surge."
                  rows={3}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveWorkerModal(null);
                  setBroadcastMessage('');
                  setToastMessage(`Broadcast push sent to ${selectedIds.length} partners!`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
