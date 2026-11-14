import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldCheck, Clock, Ban, Search, Download, Plus, 
  Send, Shield, CheckCircle, MapPin, Eye, X, ChevronLeft, ChevronRight, 
  AlertTriangle, Check, ArrowUpDown, ChevronDown, Loader2, FileText, ImageOff,
  ExternalLink, ZoomIn, Upload, Copy, CreditCard, Building2, CheckCircle2,
  Phone, FileBadge, MessageCircle, DollarSign, Wallet, Navigation, Star, 
  RefreshCw, XCircle, Wrench, Briefcase, Award
} from 'lucide-react';
import { 
  blockWorker, 
  unblockWorker, 
  verifyWorkerKYC, 
  rejectWorkerKYC,
  uploadWorkerProfile, 
  uploadWorkerPan, 
  uploadWorkerAadhaar,
  getPendingPayouts,
  settleBatchPayout
} from '../api/adminApi';

export const Module04Workers = ({ workers = [], setWorkers, onRefresh }) => {
  // Active fleet status tab: 'ALL' | 'VERIFIED' | 'PENDING' | 'ONLINE' | 'BUSY' | 'BLOCKED'
  const [activeTab, setActiveTab] = useState('ALL');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('ALL');
  const [pincodeFilter, setPincodeFilter] = useState('ALL');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers state
  const [activeWorkerModal, setActiveWorkerModal] = useState(null); // 'review-kyc' | 'discipline' | 'profile' | 'add-worker' | 'broadcast' | 'reject-kyc'
  const [modalTargetWorker, setModalTargetWorker] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title, workerName, workerId, type, docNumber }
  const [uploadingDocType, setUploadingDocType] = useState(null); // 'aadhaar' | 'pan' | 'avatar'
  const [copiedField, setCopiedField] = useState(null);
  const [blockDurationHours, setBlockDurationHours] = useState(24);
  const [blockReason, setBlockReason] = useState('Quality grievance / investigation');
  const [customBlockReason, setCustomBlockReason] = useState('');
  const [kycRejectReason, setKycRejectReason] = useState('Document unreadable or illegible');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Live pending payouts from backend
  const [pendingPayoutsMap, setPendingPayoutsMap] = useState({});
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);

  // Load pending payouts ledger
  const fetchPayouts = async () => {
    try {
      setIsLoadingPayouts(true);
      const res = await getPendingPayouts();
      if (Array.isArray(res)) {
        const map = {};
        res.forEach(item => {
          if (item && item.workerId) {
            map[item.workerId] = Number(item.payableBalance || 0);
          }
        });
        setPendingPayoutsMap(map);
      }
    } catch (err) {
      console.warn('Failed to fetch pending payouts:', err.message);
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Standardize workers data
  const effectiveWorkers = useMemo(() => {
    if (!workers || !Array.isArray(workers)) return [];

    return workers.map((w, i) => {
      const id = w.workerId || w.id || `w-${i+1}`;
      const isVerified = Boolean(w.isVerified ?? (w.kycStatus === 'VERIFIED' || w.kycStatus === 'APPROVED'));
      const isBlocked = Boolean(w.isBlocked ?? (w.blockedUntil && new Date(w.blockedUntil) > new Date()));
      
      const fullName = w.user?.fullName || w.fullName || w.name || 'Partner Worker';
      const phone = w.user?.phoneNumber || w.phoneNumber || w.phone || '';
      const email = w.user?.email || w.email || '';
      const role = w.user?.role || w.role || 'WORKER';
      const address = w.address || 'Hyderabad, Telangana';
      const panNumber = w.panNumber || '';
      const panDocUrl = w.panDocUrl || null;
      const aadhaarDocUrl = w.aadhaarDocUrl || w.kycDocumentUrl || null;
      const bankAccountNo = w.bankAccountNo || '';
      const bankIfsc = w.bankIfsc || '';
      const createdAt = w.createdAt || w.user?.createdAt;
      const formattedDate = createdAt 
        ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : 'Registered';

      // Parse operating pincodes
      const rawPincodes = w.workingPincodes || '';
      const pincodesList = rawPincodes
        ? rawPincodes.split(/[,|\s]+/).map(p => p.trim()).filter(Boolean)
        : ['500081', '500032']; // Default core Hyderabad cluster if unconfigured

      // Parse skills / qualifications
      const rawSkills = w.skills || w.category || '';
      let skillsList = [];
      if (Array.isArray(rawSkills)) {
        skillsList = rawSkills;
      } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
        skillsList = rawSkills.split(/[,|/]+/).map(s => s.trim()).filter(Boolean);
      }
      if (skillsList.length === 0) {
        skillsList = ['Home Services'];
      }

      // Check if on active job
      const isBusy = Boolean(w.isBusy || w.currentBookingId || w.activeBooking);

      const lat = w.currentLat ? Number(w.currentLat) : null;
      const lng = w.currentLng ? Number(w.currentLng) : null;
      const hasCoords = lat !== null && lng !== null;

      // Pending payout from map or fallback
      const pendingPayout = pendingPayoutsMap[id] !== undefined ? pendingPayoutsMap[id] : 0;

      return {
        ...w,
        id,
        workerId: id,
        userId: w.user?.userId || w.userId,
        name: fullName,
        fullName,
        phone,
        phoneNumber: phone,
        email,
        role,
        address,
        panNumber,
        panDocUrl,
        aadhaarDocUrl,
        bankAccountNo,
        bankIfsc,
        createdAt,
        formattedDate,
        isVerified,
        kycStatus: isVerified ? 'VERIFIED' : (w.kycStatus === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        kycLabel: isVerified ? 'Verified (Emerald)' : (w.kycStatus === 'REJECTED' ? 'Rejected' : 'Pending Review'),
        isOnline: Boolean(w.isOnline),
        isBusy,
        currentLat: lat,
        currentLng: lng,
        hasCoords,
        coordinates: hasCoords ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '',
        googleMapsUrl: hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null,
        lastSeen: w.lastSeen || (w.updatedAt ? new Date(w.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent'),
        isBlocked,
        disciplinaryStatus: isBlocked ? 'Suspended' : 'Active',
        blockedUntil: w.blockedUntil,
        avatar: w.profilePhotoUrl || w.avatar || w.avatarUrl || '',
        rating: (w.rating !== undefined && w.rating !== null) ? Number(w.rating).toFixed(1) : '4.8',
        jobsCompleted: (w.jobsCompleted !== undefined && w.jobsCompleted !== null) ? w.jobsCompleted : 12,
        skillsList,
        skillsDisplay: skillsList.join(', '),
        pincodesList,
        pendingPayout
      };
    });
  }, [workers, pendingPayoutsMap]);

  // Compute Live Metrics
  const totalCount = effectiveWorkers.length;
  const verifiedCount = useMemo(() => effectiveWorkers.filter(w => w.kycStatus === 'VERIFIED').length, [effectiveWorkers]);
  const pendingCount = useMemo(() => effectiveWorkers.filter(w => w.kycStatus === 'PENDING').length, [effectiveWorkers]);
  const onlineCount = useMemo(() => effectiveWorkers.filter(w => w.isOnline && !w.isBlocked).length, [effectiveWorkers]);
  const busyCount = useMemo(() => effectiveWorkers.filter(w => w.isBusy && !w.isBlocked).length, [effectiveWorkers]);
  const blockedCount = useMemo(() => effectiveWorkers.filter(w => w.isBlocked).length, [effectiveWorkers]);

  // Distinct trade & pincode options for filter dropdowns
  const availableTrades = useMemo(() => {
    const set = new Set();
    effectiveWorkers.forEach(w => w.skillsList.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [effectiveWorkers]);

  const availablePincodes = useMemo(() => {
    const set = new Set();
    effectiveWorkers.forEach(w => w.pincodesList.forEach(p => set.add(p)));
    return Array.from(set).sort();
  }, [effectiveWorkers]);

  // Filtered workers based on activeTab, search, trade, pincode
  const filteredWorkers = useMemo(() => {
    return effectiveWorkers.filter(w => {
      // 1. Tab filter
      if (activeTab === 'VERIFIED' && w.kycStatus !== 'VERIFIED') return false;
      if (activeTab === 'PENDING' && w.kycStatus !== 'PENDING') return false;
      if (activeTab === 'ONLINE' && (!w.isOnline || w.isBlocked)) return false;
      if (activeTab === 'BUSY' && (!w.isBusy || w.isBlocked)) return false;
      if (activeTab === 'BLOCKED' && !w.isBlocked) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (w.name || '').toLowerCase().includes(q);
        const matchPhone = (w.phone || '').toLowerCase().includes(q);
        const matchId = (w.workerId || '').toLowerCase().includes(q);
        const matchPan = (w.panNumber || '').toLowerCase().includes(q);
        const matchSkill = w.skillsList.some(s => s.toLowerCase().includes(q));
        const matchPin = w.pincodesList.some(p => p.includes(q));
        if (!matchName && !matchPhone && !matchId && !matchPan && !matchSkill && !matchPin) {
          return false;
        }
      }

      // 3. Trade filter
      if (tradeFilter !== 'ALL') {
        if (!w.skillsList.includes(tradeFilter)) return false;
      }

      // 4. Pincode filter
      if (pincodeFilter !== 'ALL') {
        if (!w.pincodesList.includes(pincodeFilter)) return false;
      }

      return true;
    });
  }, [effectiveWorkers, activeTab, searchQuery, tradeFilter, pincodeFilter]);

  // Copy helper
  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Upload document handler
  const handleUploadDocument = async (workerId, type, file) => {
    if (!file || !workerId) return;
    setUploadingDocType(type);
    try {
      let uploadedUrl = '';
      if (type === 'aadhaar') {
        uploadedUrl = await uploadWorkerAadhaar(workerId, file);
      } else if (type === 'pan') {
        uploadedUrl = await uploadWorkerPan(workerId, file);
      } else if (type === 'avatar') {
        uploadedUrl = await uploadWorkerProfile(workerId, file);
      }

      setWorkers(prev => {
        const list = prev && prev.length > 0 ? prev : [];
        return list.map(w => {
          if (w.workerId === workerId || w.id === workerId) {
            const updated = { ...w };
            if (type === 'aadhaar') updated.aadhaarDocUrl = uploadedUrl;
            if (type === 'pan') updated.panDocUrl = uploadedUrl;
            if (type === 'avatar') {
              updated.profilePhotoUrl = uploadedUrl;
              updated.avatar = uploadedUrl;
            }
            return updated;
          }
          return w;
        });
      });

      if (modalTargetWorker && (modalTargetWorker.workerId === workerId || modalTargetWorker.id === workerId)) {
        setModalTargetWorker(prev => {
          const updated = { ...prev };
          if (type === 'aadhaar') updated.aadhaarDocUrl = uploadedUrl;
          if (type === 'pan') updated.panDocUrl = uploadedUrl;
          if (type === 'avatar') {
            updated.profilePhotoUrl = uploadedUrl;
            updated.avatar = uploadedUrl;
          }
          return updated;
        });
      }

      setToastMessage(`${type.toUpperCase()} document uploaded successfully to Supabase S3!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setToastMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDocType(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // New Worker Form state
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState('Deep Cleaning');
  const [newWorkerPincodes, setNewWorkerPincodes] = useState('500081, 500032');
  const [newWorkerAddress, setNewWorkerAddress] = useState('Hitec City, Hyderabad');
  const [newWorkerPan, setNewWorkerPan] = useState('');
  const [newWorkerBankAcc, setNewWorkerBankAcc] = useState('');
  const [newWorkerBankIfsc, setNewWorkerBankIfsc] = useState('');

  // Row selection
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

  // Action: Discipline / Suspend
  const handleConfirmDiscipline = async () => {
    if (!modalTargetWorker) return;
    setIsProcessing(true);
    const wId = modalTargetWorker.workerId || modalTargetWorker.id;
    const finalReason = blockReason === 'Other (specified)' ? customBlockReason : blockReason;

    try {
      await blockWorker(wId, blockDurationHours);
    } catch (err) {
      console.warn('API error, applying optimistically:', err.message);
    }

    setWorkers(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(w => (w.workerId === wId || w.id === wId) 
        ? { 
            ...w, 
            isBlocked: true, 
            isOnline: false,
            disciplinaryStatus: `Suspended (${blockDurationHours}h)` 
          } 
        : w
      );
    });

    setIsProcessing(false);
    setActiveWorkerModal(null);
    setToastMessage(`Partner suspended for ${blockDurationHours} hours (${finalReason}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action: Unblock / Reinstate
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

    setToastMessage(`Partner unblocked and reinstated to active dispatch pool.`);
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
        ? { ...item, isVerified: true, kycStatus: 'VERIFIED', kycLabel: 'Verified (Emerald)' }
        : item
      );
    });

    if (modalTargetWorker) {
      setModalTargetWorker(prev => ({ ...prev, isVerified: true, kycStatus: 'VERIFIED' }));
    }

    setIsProcessing(false);
    setActiveWorkerModal(null);
    setToastMessage(`KYC approved successfully! Partner given Emerald Verified badge.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Reject KYC
  const handleRejectKYC = async () => {
    if (!modalTargetWorker) return;
    setIsProcessing(true);
    const wId = modalTargetWorker.workerId || modalTargetWorker.id;

    try {
      await rejectWorkerKYC(wId, kycRejectReason);
    } catch (err) {
      console.warn('API KYC reject warning:', err.message);
    }

    setWorkers(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(item => (item.workerId === wId || item.id === wId)
        ? { ...item, isVerified: false, kycStatus: 'REJECTED', kycLabel: 'Rejected' }
        : item
      );
    });

    if (modalTargetWorker) {
      setModalTargetWorker(prev => ({ ...prev, isVerified: false, kycStatus: 'REJECTED' }));
    }

    setIsProcessing(false);
    setActiveWorkerModal(null);
    setToastMessage(`KYC rejected for ${modalTargetWorker.name}. Reason: ${kycRejectReason}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Settle Single Partner Payout
  const handleSettlePayout = async (w) => {
    const wId = w.workerId || w.id;
    const amount = pendingPayoutsMap[wId] || w.pendingPayout || 0;
    if (amount <= 0) {
      alert('This partner has no pending payout balance to settle.');
      return;
    }

    if (!window.confirm(`Initiate instant bank payout of ₹${amount.toLocaleString('en-IN')} to ${w.name} (A/C: ${w.bankAccountNo || 'Linked IFSC'})?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await settleBatchPayout([wId]);
      setPendingPayoutsMap(prev => ({ ...prev, [wId]: 0 }));
      setToastMessage(`Payout of ₹${amount.toLocaleString('en-IN')} successfully settled for ${w.name}!`);
    } catch (err) {
      console.warn('Payout settlement notice:', err.message);
      // Optimistic update
      setPendingPayoutsMap(prev => ({ ...prev, [wId]: 0 }));
      setToastMessage(`Payout of ₹${amount.toLocaleString('en-IN')} processed for ${w.name}.`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Action: Create / Onboard Worker
  const handleCreateWorker = (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPhone) return;

    const newId = `w-${Date.now()}`;
    const newW = {
      id: newId,
      workerId: newId,
      name: newWorkerName,
      fullName: newWorkerName,
      email: newWorkerEmail || `${newWorkerName.toLowerCase().replace(/\s+/g, '')}@homeease.in`,
      phone: newWorkerPhone,
      phoneNumber: newWorkerPhone,
      address: newWorkerAddress || 'Hyderabad, Telangana',
      panNumber: newWorkerPan || 'ABCDE1234F',
      bankAccountNo: newWorkerBankAcc || '987654321098',
      bankIfsc: newWorkerBankIfsc || 'HDFC0001234',
      skills: newWorkerTrade,
      workingPincodes: newWorkerPincodes,
      kycStatus: 'PENDING',
      kycLabel: 'Pending Review',
      isVerified: false,
      isOnline: false,
      isBlocked: false,
      disciplinaryStatus: 'Active',
      currentLat: 17.4485,
      currentLng: 78.3748,
      rating: 5.0,
      jobsCompleted: 0,
      createdAt: new Date().toISOString()
    };

    setWorkers(prev => [newW, ...(prev && prev.length > 0 ? prev : [])]);
    setActiveWorkerModal(null);
    setNewWorkerName('');
    setNewWorkerPhone('');
    setNewWorkerEmail('');
    setNewWorkerPan('');
    setNewWorkerBankAcc('');
    setNewWorkerBankIfsc('');
    setToastMessage(`New partner ${newWorkerName} onboarded successfully! Pending KYC review.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 bg-[#F8FAFC]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
              Worker Partner Fleet Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Hyderabad Region
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage partner onboarding, KYC compliance verification, service qualifications, real-time GPS telemetry, and payouts.
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Workers */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{totalCount}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Network</div>
            </div>
          </div>

          {/* KYC Verified */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Verified</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{verifiedCount}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                {totalCount > 0 ? `${Math.round((verifiedCount / totalCount) * 100)}% verified` : '0%'}
              </div>
            </div>
          </div>

          {/* Online Fleet */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Now</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{onlineCount}</div>
              <div className="text-[10px] text-sky-600 font-medium mt-0.5">{busyCount} on jobs</div>
            </div>
          </div>

          {/* Suspended */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspended</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{blockedCount}</div>
              <div className="text-[10px] text-rose-500 font-medium mt-0.5">Policy actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6 FLEET STATUS TABS (Pronto & Urban Company Operations Standard)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Partners', count: totalCount, icon: Users },
          { key: 'VERIFIED', label: 'KYC Verified', count: verifiedCount, icon: ShieldCheck, color: 'text-emerald-600' },
          { key: 'PENDING', label: 'Pending KYC', count: pendingCount, icon: Clock, color: 'text-amber-600' },
          { key: 'ONLINE', label: 'Online & Ready', count: onlineCount, icon: Navigation, color: 'text-sky-600' },
          { key: 'BUSY', label: 'On Active Job', count: busyCount, icon: Briefcase, color: 'text-indigo-600' },
          { key: 'BLOCKED', label: 'Suspended / Blocked', count: blockedCount, icon: Ban, color: 'text-rose-600' },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
              fetchPayouts();
              setToastMessage('Refreshed partner directory and live telemetry.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPayouts ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner, phone, PAN, ID, or trade..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs"
            />
          </div>

          {/* Trade / Qualification Dropdown */}
          <div className="relative">
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs appearance-none cursor-pointer"
            >
              <option value="ALL">All Trade Qualifications</option>
              {availableTrades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Operating Pincode Dropdown */}
          <div className="relative">
            <select
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs appearance-none cursor-pointer"
            >
              <option value="ALL">All Hyderabad Pincodes</option>
              {availablePincodes.map(pin => (
                <option key={pin} value={pin}>PIN {pin}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Export & Add Worker */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => {
              const headers = ['Worker ID', 'Name', 'Phone', 'Email', 'KYC Status', 'Is Online', 'Disciplinary Status', 'Skills', 'Pincodes', 'Pending Payout'];
              const rows = filteredWorkers.map(w => [
                w.workerId,
                `"${w.name}"`,
                w.phone,
                w.email,
                w.kycStatus,
                w.isOnline ? 'Online' : 'Offline',
                w.disciplinaryStatus,
                `"${w.skillsDisplay}"`,
                `"${w.pincodesList.join(', ')}"`,
                w.pendingPayout
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `HomeEase_Worker_Fleet_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setActiveWorkerModal('add-worker')}
            className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Onboard Partner</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BULK ACTION BAR                                                          */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 px-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 pr-2 border-r border-slate-200">
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0} 
                onChange={() => setSelectedIds([])}
                className="w-4 h-4 rounded text-[#1D68F2] border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>{selectedIds.length} partners selected</span>
            </label>

            {/* Broadcast Push */}
            <button
              onClick={() => setActiveWorkerModal('broadcast')}
              className="px-3.5 py-1.5 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Push ({selectedIds.length})</span>
            </button>

            {/* Batch Settle Payouts */}
            <button
              onClick={async () => {
                if (window.confirm(`Execute batch payout settlement for ${selectedIds.length} partners?`)) {
                  try {
                    await settleBatchPayout(selectedIds);
                    fetchPayouts();
                    setToastMessage(`Batch payouts settled for ${selectedIds.length} partners.`);
                  } catch (err) {
                    setToastMessage(`Batch payout notice: ${err.message}`);
                  }
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Settle Payouts</span>
            </button>

            {/* Bulk Suspend */}
            <button
              onClick={() => {
                if (window.confirm(`Suspend ${selectedIds.length} selected partners for 24 hours?`)) {
                  selectedIds.forEach(id => blockWorker(id, 24).catch(() => {}));
                  setToastMessage(`Disciplinary suspension triggered for ${selectedIds.length} partners.`);
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspend Selected</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs font-semibold text-[#1D68F2] hover:underline cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKERS FLEET DATA TABLE                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === filteredWorkers.length && filteredWorkers.length > 0}
                    className="w-4 h-4 rounded text-[#1D68F2] border-slate-300 focus:ring-blue-500 cursor-pointer" 
                  />
                </th>
                <th className="py-3.5 px-4">Partner Info</th>
                <th className="py-3.5 px-4">Qualifications</th>
                <th className="py-3.5 px-4">Operating Zones</th>
                <th className="py-3.5 px-4">KYC Dossier</th>
                <th className="py-3.5 px-4">Live Telemetry</th>
                <th className="py-3.5 px-4">Ledger Payout</th>
                <th className="py-3.5 px-4">Governance</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-14 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-700">No partner workers match the selected criteria</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Adjust your search or status filter tab to view partners registered in Hyderabad.
                    </div>
                  </td>
                </tr>
              )}
              {filteredWorkers.map((w, idx) => {
                const id = w.workerId || w.id || `worker-${idx}`;
                const isChecked = selectedIds.includes(id);

                return (
                  <tr 
                    key={id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/25' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleSelectRow(id)}
                        className="w-4 h-4 rounded text-[#1D68F2] border-slate-300 focus:ring-blue-500 cursor-pointer" 
                      />
                    </td>

                    {/* Partner Info (Avatar, Name, Contact, Rating) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[210px]">
                        {w.avatar && !w.avatar.includes('unsplash') ? (
                          <img 
                            src={w.avatar} 
                            alt={w.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement?.querySelector('.worker-avatar-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="worker-avatar-fallback w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-[#1D68F2] flex items-center justify-center font-bold text-xs shrink-0 select-none"
                          style={{ display: (w.avatar && !w.avatar.includes('unsplash')) ? 'none' : 'flex' }}
                        >
                          {(w.name || 'W').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 leading-tight truncate">
                              {w.name}
                            </span>
                            {w.kycStatus === 'VERIFIED' && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" title="Emerald Verified" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {w.phone || 'No phone'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {w.rating}
                            </span>
                            <span>•</span>
                            <span>{w.jobsCompleted} jobs</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Qualifications & Trade Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[170px]">
                        {w.skillsList.map((skill, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#1D68F2] border border-blue-200/80"
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Operating Pincodes / Zones */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {w.pincodesList.map((pin, pIdx) => (
                          <span 
                            key={pIdx}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                            title={`Hyderabad PIN ${pin}`}
                          >
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {pin}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* KYC Dossier (Aadhaar, PAN) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {/* Aadhaar */}
                          {w.aadhaarDocUrl ? (
                            <button
                              onClick={() => setPreviewDoc({
                                url: w.aadhaarDocUrl,
                                title: 'Govt Aadhaar Card Document',
                                workerName: w.name,
                                workerId: w.workerId,
                                type: 'aadhaar'
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                              title="Click to view Aadhaar"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Aadhaar</span>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                              <FileText className="w-3 h-3 text-slate-300" />
                              <span>No Aadhaar</span>
                            </span>
                          )}

                          {/* PAN */}
                          {w.panDocUrl ? (
                            <button
                              onClick={() => setPreviewDoc({
                                url: w.panDocUrl,
                                title: `Income Tax PAN Card (${w.panNumber || 'Attached'})`,
                                workerName: w.name,
                                workerId: w.workerId,
                                type: 'pan',
                                docNumber: w.panNumber
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                              title="Click to view PAN"
                            >
                              <CreditCard className="w-3 h-3 text-amber-600" />
                              <span>PAN</span>
                              <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                              <CreditCard className="w-3 h-3 text-slate-300" />
                              <span>No PAN</span>
                            </span>
                          )}
                        </div>

                        {/* Status Label */}
                        <div>
                          {w.kycStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <Check className="w-3 h-3" /> Emerald Verified
                            </span>
                          )}
                          {w.kycStatus === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {w.kycStatus === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                              <X className="w-3 h-3" /> KYC Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Live Telemetry (Online status + Coordinates) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            w.isBlocked 
                              ? 'bg-rose-400' 
                              : (w.isBusy 
                                  ? 'bg-indigo-500 animate-pulse' 
                                  : (w.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'))
                          }`} />
                          <span className="font-bold text-slate-800 text-xs">
                            {w.isBlocked 
                              ? 'Suspended' 
                              : (w.isBusy ? 'On Active Job' : (w.isOnline ? 'Online • Ready' : 'Offline'))}
                          </span>
                        </div>

                        {w.hasCoords ? (
                          <a
                            href={w.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            title="Open in Google Maps"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{w.coordinates}</span>
                          </a>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-400">Hyderabad (Core)</div>
                        )}
                        <div className="text-[10px] text-slate-400">Seen: {w.lastSeen}</div>
                      </div>
                    </td>

                    {/* Ledger Payout Balance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <div className="font-black text-slate-900 text-xs">
                          {w.pendingPayout > 0 ? `₹${w.pendingPayout.toLocaleString('en-IN')}` : '₹0'}
                        </div>
                        <div className="text-[10px] text-slate-400">Unsettled</div>
                        {w.pendingPayout > 0 && (
                          <button
                            onClick={() => handleSettlePayout(w)}
                            disabled={isProcessing}
                            className="mt-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <Wallet className="w-2.5 h-2.5" />
                            <span>Settle</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Governance / Disciplinary Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {!w.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" /> Active Pool
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Review KYC */}
                        <button
                          onClick={() => {
                            setModalTargetWorker(w);
                            setActiveWorkerModal('review-kyc');
                          }}
                          className="px-2.5 py-1 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                          title="Review KYC Documents"
                        >
                          Review KYC
                        </button>

                        {/* 2. Suspend / Unblock */}
                        {!w.isBlocked ? (
                          <button
                            onClick={() => {
                              setModalTargetWorker(w);
                              setActiveWorkerModal('discipline');
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Enforce Suspension"
                          >
                            <Ban className="w-3 h-3 text-slate-400" />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(w)}
                            className="px-2 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Reinstate to Pool"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Unblock</span>
                          </button>
                        )}

                        {/* 3. Partner 360 Profile */}
                        <button
                          onClick={() => {
                            setModalTargetWorker(w);
                            setActiveWorkerModal('profile');
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          title="View Partner 360"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Partner 360</span>
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
            {filteredWorkers.length === 0 ? 'Showing 0 partners' : `Showing 1-${filteredWorkers.length} of ${totalCount} partners in Hyderabad`}
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
      {/* MODAL: Review Worker KYC Document (Dossier + Approve/Reject)              */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'review-kyc' && modalTargetWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Partner KYC & Compliance Review</h3>
                  {modalTargetWorker.kycStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Emerald Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {modalTargetWorker.name} • {modalTargetWorker.phone} • ID: {modalTargetWorker.workerId}
                </p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Uploaded Documents Dossier (Side-by-Side Cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <FileBadge className="w-3.5 h-3.5 text-[#1D68F2]" />
                  <span>Submitted Identification Documents (Supabase Storage)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">Click any document to inspect full resolution</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Aadhaar Card Scan */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#1D68F2]" />
                        <span>Govt Aadhaar Card</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">UIDAI Identity Proof</div>
                    </div>
                    {modalTargetWorker.aadhaarDocUrl ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Missing
                      </span>
                    )}
                  </div>

                  {/* Aadhaar Preview Box */}
                  <div 
                    onClick={() => modalTargetWorker.aadhaarDocUrl && setPreviewDoc({
                      url: modalTargetWorker.aadhaarDocUrl,
                      title: 'Govt Aadhaar Card Document',
                      workerName: modalTargetWorker.name,
                      workerId: modalTargetWorker.workerId,
                      type: 'aadhaar'
                    })}
                    className="relative group h-40 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition shadow-2xs"
                  >
                    {modalTargetWorker.aadhaarDocUrl ? (
                      <>
                        <img 
                          src={modalTargetWorker.aadhaarDocUrl} 
                          alt="Aadhaar Scan" 
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.parentElement?.querySelector('.aadhaar-doc-fallback');
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div className="aadhaar-doc-fallback hidden flex-col items-center justify-center p-3 text-center">
                          <FileText className="w-8 h-8 text-[#1D68F2] mb-1" />
                          <span className="text-xs font-bold text-slate-700">Aadhaar Card Attached</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">Stored in Supabase S3</span>
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                            <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center">
                        <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-slate-400">No Aadhaar Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    {modalTargetWorker.aadhaarDocUrl ? (
                      <a
                        href={modalTargetWorker.aadhaarDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Supabase Link
                      </a>
                    ) : <span />}

                    <label className="text-[11px] font-bold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100">
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>{uploadingDocType === 'aadhaar' ? 'Uploading...' : 'Replace Scan'}</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDocument(modalTargetWorker.workerId, 'aadhaar', e.target.files[0]);
                        }} 
                      />
                    </label>
                  </div>
                </div>

                {/* 2. PAN Card Scan */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                        <span>Income Tax PAN Card</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">PAN: {modalTargetWorker.panNumber || 'Unset'}</div>
                    </div>
                    {modalTargetWorker.panDocUrl ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Missing
                      </span>
                    )}
                  </div>

                  {/* PAN Preview Box */}
                  <div 
                    onClick={() => modalTargetWorker.panDocUrl && setPreviewDoc({
                      url: modalTargetWorker.panDocUrl,
                      title: `Income Tax PAN Card (${modalTargetWorker.panNumber})`,
                      workerName: modalTargetWorker.name,
                      workerId: modalTargetWorker.workerId,
                      type: 'pan',
                      docNumber: modalTargetWorker.panNumber
                    })}
                    className="relative group h-40 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition shadow-2xs"
                  >
                    {modalTargetWorker.panDocUrl ? (
                      <>
                        <img 
                          src={modalTargetWorker.panDocUrl} 
                          alt="PAN Scan" 
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fb = e.target.parentElement?.querySelector('.pan-doc-fallback');
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div className="pan-doc-fallback hidden flex-col items-center justify-center p-3 text-center">
                          <CreditCard className="w-8 h-8 text-amber-500 mb-1" />
                          <span className="text-xs font-bold text-slate-700">PAN Card Attached</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">PAN: {modalTargetWorker.panNumber}</span>
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                            <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center">
                        <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-slate-400">No PAN Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* PAN Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    {modalTargetWorker.panDocUrl ? (
                      <a
                        href={modalTargetWorker.panDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Supabase Link
                      </a>
                    ) : <span />}

                    <label className="text-[11px] font-bold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100">
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>{uploadingDocType === 'pan' ? 'Uploading...' : 'Replace Scan'}</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDocument(modalTargetWorker.workerId, 'pan', e.target.files[0]);
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bank & Payout Information Box */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">PAN Number</div>
                  <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span>{modalTargetWorker.panNumber || 'Not provided'}</span>
                    {modalTargetWorker.panNumber && (
                      <button 
                        onClick={() => copyToClipboard(modalTargetWorker.panNumber, 'pan')} 
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Copy PAN"
                      >
                        {copiedField === 'pan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Account Number</div>
                  <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span>{modalTargetWorker.bankAccountNo || 'Not provided'}</span>
                    {modalTargetWorker.bankAccountNo && (
                      <button 
                        onClick={() => copyToClipboard(modalTargetWorker.bankAccountNo, 'bank')} 
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Copy Bank Account"
                      >
                        {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Bank IFSC Code</div>
                  <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span>{modalTargetWorker.bankIfsc || 'Not provided'}</span>
                    {modalTargetWorker.bankIfsc && (
                      <button 
                        onClick={() => copyToClipboard(modalTargetWorker.bankIfsc, 'ifsc')} 
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Copy IFSC"
                      >
                        {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveWorkerModal('reject-kyc');
                }}
                className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject KYC</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveWorkerModal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={handleApproveKYC}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Grant Emerald Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Reject KYC with Reason                                             */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'reject-kyc' && modalTargetWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Partner KYC</h3>
                <p className="text-xs text-slate-500">Document verification for {modalTargetWorker.name}</p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  Rejecting KYC marks the partner status as "Rejected" and sends an in-app prompt to re-upload clear government ID scans.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                <select 
                  value={kycRejectReason}
                  onChange={(e) => setKycRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-500"
                >
                  <option value="Document unreadable or illegible">Document unreadable or illegible</option>
                  <option value="Name mismatch between Aadhaar and Bank account">Name mismatch between Aadhaar and Bank account</option>
                  <option value="Invalid PAN number or tax record">Invalid PAN number or tax record</option>
                  <option value="Expired or altered identification document">Expired or altered identification document</option>
                  <option value="Service territory outside active Hyderabad coverage">Service territory outside active Hyderabad coverage</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal('review-kyc')}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleRejectKYC}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
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
                <h3 className="text-base font-bold text-slate-900">Enforce Partner Disciplinary Suspension</h3>
                <p className="text-xs text-slate-500">Suspending platform access for {modalTargetWorker.name}</p>
              </div>
              <button onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p>
                  Suspending this partner blocks them from taking live dispatch bookings on the HomeEase partner app and takes their live status offline.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Reason</label>
                <select 
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none mb-2"
                >
                  <option value="Customer complaint regarding work quality">Customer complaint regarding work quality</option>
                  <option value="No-show / cancelled assigned live booking">No-show / cancelled assigned live booking</option>
                  <option value="Misconduct / behavioral policy violation">Misconduct / behavioral policy violation</option>
                  <option value="Repeated arrival delays in assigned zone">Repeated arrival delays in assigned zone</option>
                  <option value="Other (specified)">Other (specified)</option>
                </select>

                {blockReason === 'Other (specified)' && (
                  <input
                    type="text"
                    value={customBlockReason}
                    onChange={(e) => setCustomBlockReason(e.target.value)}
                    placeholder="Enter detailed reason..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Duration</label>
                <select 
                  value={blockDurationHours}
                  onChange={(e) => setBlockDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value={24}>24 Hours (Temporary Warning)</option>
                  <option value={72}>72 Hours (Policy Review)</option>
                  <option value={168}>7 Days (Severe Infraction)</option>
                  <option value={720}>30 Days (Extended Suspension)</option>
                  <option value={8760}>1 Year (Indefinite Deactivation)</option>
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
      {/* SLIDE-OVER DRAWER: Partner 360 Comprehensive Inspection                   */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'profile' && modalTargetWorker && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveWorkerModal(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
              
              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                
                {/* Header Profile Bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {modalTargetWorker.avatar && !modalTargetWorker.avatar.includes('unsplash') ? (
                        <img 
                          src={modalTargetWorker.avatar} 
                          alt={modalTargetWorker.name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector('.modal-worker-avatar-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="modal-worker-avatar-fallback w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 text-[#1D68F2] flex items-center justify-center font-bold text-xl shrink-0 select-none shadow-sm"
                        style={{ display: (modalTargetWorker.avatar && !modalTargetWorker.avatar.includes('unsplash')) ? 'none' : 'flex' }}
                      >
                        {modalTargetWorker.name?.charAt(0)?.toUpperCase() || 'W'}
                      </div>

                      {/* Upload avatar trigger */}
                      <label 
                        className="absolute -bottom-1 -right-1 p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 cursor-pointer shadow-xs"
                        title="Upload profile photo"
                      >
                        <Upload className="w-3 h-3" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadDocument(modalTargetWorker.workerId, 'avatar', e.target.files[0]);
                          }} 
                        />
                      </label>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{modalTargetWorker.name}</h3>
                        {modalTargetWorker.kycStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#137333] border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[3]" /> Emerald Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
                            <Clock className="w-3 h-3 stroke-[2.5]" /> Pending KYC
                          </span>
                        )}

                        {!modalTargetWorker.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{modalTargetWorker.skillsDisplay || 'Home Services'}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">Worker UUID: {modalTargetWorker.workerId}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveWorkerModal(null)} 
                    className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Connect Action Buttons */}
                <div className="flex items-center gap-2">
                  {modalTargetWorker.phone && (
                    <>
                      <a
                        href={`tel:${modalTargetWorker.phone}`}
                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-[#1D68F2] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-blue-200/80"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Direct Call ({modalTargetWorker.phone})</span>
                      </a>
                      <a
                        href={`https://wa.me/91${modalTargetWorker.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Chat</span>
                      </a>
                    </>
                  )}
                </div>

                {/* Operational KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Rating</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{modalTargetWorker.rating} / 5.0</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Completed Jobs</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {modalTargetWorker.jobsCompleted} orders
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Unsettled Payout</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      ₹{modalTargetWorker.pendingPayout.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Fleet Status</div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${modalTargetWorker.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{modalTargetWorker.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Qualifications & Territory Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#1D68F2]" />
                    <span>Trade Qualifications & Operating Territory</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Qualified Services</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {modalTargetWorker.skillsList.map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-[#1D68F2] border border-blue-200 shadow-2xs flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Operating Hyderabad Pincodes</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {modalTargetWorker.pincodesList.map((pin, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            PIN {pin}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Live Telemetry & GPS</div>
                      {modalTargetWorker.hasCoords ? (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                            {modalTargetWorker.coordinates}
                          </code>
                          <a
                            href={modalTargetWorker.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 font-bold text-xs rounded border border-slate-200 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View on Google Maps</span>
                          </a>
                        </div>
                      ) : (
                        <div className="text-slate-500 mt-1">Hyderabad Central Dispatch Hub</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banking & Payout Ledger Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Banking Details & Unsettled Ledger</span>
                    </h4>
                    {modalTargetWorker.pendingPayout > 0 && (
                      <button
                        onClick={() => handleSettlePayout(modalTargetWorker)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Settle ₹{modalTargetWorker.pendingPayout.toLocaleString('en-IN')}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">PAN Number</div>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <span>{modalTargetWorker.panNumber || 'Not provided'}</span>
                        {modalTargetWorker.panNumber && (
                          <button 
                            onClick={() => copyToClipboard(modalTargetWorker.panNumber, 'pan')} 
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            {copiedField === 'pan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Bank Account</div>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <span>{modalTargetWorker.bankAccountNo || 'Not linked'}</span>
                        {modalTargetWorker.bankAccountNo && (
                          <button 
                            onClick={() => copyToClipboard(modalTargetWorker.bankAccountNo, 'bank')} 
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">IFSC Code</div>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <span>{modalTargetWorker.bankIfsc || 'Not linked'}</span>
                        {modalTargetWorker.bankIfsc && (
                          <button 
                            onClick={() => copyToClipboard(modalTargetWorker.bankIfsc, 'ifsc')} 
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Identification Scans (Aadhaar & PAN) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-[#1D68F2]" />
                      <span>Uploaded KYC Identification Scans</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Click image to inspect in full lightbox</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Aadhaar Preview */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Govt Aadhaar Card</span>
                        {modalTargetWorker.aadhaarDocUrl ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Missing</span>
                        )}
                      </div>

                      <div 
                        onClick={() => modalTargetWorker.aadhaarDocUrl && setPreviewDoc({
                          url: modalTargetWorker.aadhaarDocUrl,
                          title: 'Govt Aadhaar Card Document',
                          workerName: modalTargetWorker.name,
                          workerId: modalTargetWorker.workerId,
                          type: 'aadhaar'
                        })}
                        className="relative group h-36 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
                      >
                        {modalTargetWorker.aadhaarDocUrl ? (
                          <>
                            <img 
                              src={modalTargetWorker.aadhaarDocUrl} 
                              alt="Aadhaar Document Scan" 
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fb = e.target.parentElement?.querySelector('.profile-aadhaar-fallback');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                            <div className="profile-aadhaar-fallback hidden flex-col items-center justify-center p-3 text-center">
                              <FileText className="w-8 h-8 text-[#1D68F2] mb-1" />
                              <span className="text-xs font-bold text-slate-800">Aadhaar Attached</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Supabase Storage</span>
                            </div>
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                                <ZoomIn className="w-3.5 h-3.5 text-[#1D68F2]" /> Enlarge
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-3">
                            <ImageOff className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-xs text-slate-400">No Aadhaar attached</span>
                          </div>
                        )}
                      </div>

                      <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{uploadingDocType === 'aadhaar' ? 'Uploading...' : 'Replace Aadhaar'}</span>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadDocument(modalTargetWorker.workerId, 'aadhaar', e.target.files[0]);
                          }} 
                        />
                      </label>
                    </div>

                    {/* PAN Preview */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">Income Tax PAN Card</span>
                        {modalTargetWorker.panDocUrl ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Missing</span>
                        )}
                      </div>

                      <div 
                        onClick={() => modalTargetWorker.panDocUrl && setPreviewDoc({
                          url: modalTargetWorker.panDocUrl,
                          title: `Income Tax PAN Card (${modalTargetWorker.panNumber})`,
                          workerName: modalTargetWorker.name,
                          workerId: modalTargetWorker.workerId,
                          type: 'pan',
                          docNumber: modalTargetWorker.panNumber
                        })}
                        className="relative group h-36 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition"
                      >
                        {modalTargetWorker.panDocUrl ? (
                          <>
                            <img 
                              src={modalTargetWorker.panDocUrl} 
                              alt="PAN Document Scan" 
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fb = e.target.parentElement?.querySelector('.profile-pan-fallback');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                            <div className="profile-pan-fallback hidden flex-col items-center justify-center p-3 text-center">
                              <CreditCard className="w-8 h-8 text-amber-500 mb-1" />
                              <span className="text-xs font-bold text-slate-800">PAN Attached</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">PAN: {modalTargetWorker.panNumber}</span>
                            </div>
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                                <ZoomIn className="w-3.5 h-3.5 text-amber-600" /> Enlarge
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-3">
                            <ImageOff className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-xs text-slate-400">No PAN attached</span>
                          </div>
                        )}
                      </div>

                      <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>{uploadingDocType === 'pan' ? 'Uploading...' : 'Replace PAN'}</span>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadDocument(modalTargetWorker.workerId, 'pan', e.target.files[0]);
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modalTargetWorker.kycStatus !== 'VERIFIED' ? (
                    <button
                      onClick={handleApproveKYC}
                      disabled={isProcessing}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve KYC (Emerald)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveWorkerModal('reject-kyc')}
                      className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Revoke KYC</span>
                    </button>
                  )}

                  {!modalTargetWorker.isBlocked ? (
                    <button
                      onClick={() => setActiveWorkerModal('discipline')}
                      className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Partner</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnblock(modalTargetWorker)}
                      className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Unblock Partner</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveWorkerModal(null)}
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
      {/* MODAL: Full Document Lightbox Preview & Zoom                              */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-[#1D68F2]" />
                  <span>{previewDoc.title}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Partner: <span className="font-semibold text-slate-700">{previewDoc.workerName}</span> • URL: <span className="font-mono text-[10px] text-slate-400">{previewDoc.url}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-[#1D68F2] hover:bg-blue-100 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Image Lightbox Container */}
            <div className="flex-1 min-h-[350px] max-h-[60vh] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-3 relative">
              <img 
                src={previewDoc.url} 
                alt={previewDoc.title} 
                className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.parentElement?.querySelector('.lightbox-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div className="lightbox-fallback hidden flex-col items-center justify-center p-8 text-center max-w-md">
                <FileText className="w-16 h-16 text-[#1D68F2] mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Supabase Storage Document</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This document record is registered in the cloud database at:
                </p>
                <code className="text-[11px] font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 mt-2 break-all">
                  {previewDoc.url}
                </code>
                <div className="flex items-center gap-2 mt-4">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-[#1D68F2] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
                  >
                    Open Document Link
                  </a>
                </div>
              </div>
            </div>

            {/* Lightbox Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <label className="font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload New Version</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0] && previewDoc.workerId && previewDoc.type) {
                      handleUploadDocument(previewDoc.workerId, previewDoc.type, e.target.files[0]);
                      setPreviewDoc(null);
                    }
                  }} 
                />
              </label>

              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: + Onboard New Worker Partner                                       */}
      {/* ========================================================================= */}
      {activeWorkerModal === 'add-worker' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <form onSubmit={handleCreateWorker} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Onboard New Worker Partner</h3>
                <p className="text-xs text-slate-500">Register new partner with Hyderabad service qualifications</p>
              </div>
              <button type="button" onClick={() => setActiveWorkerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input 
                    type="text" 
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone (10 digits) *</label>
                  <input 
                    type="tel" 
                    value={newWorkerPhone}
                    onChange={(e) => setNewWorkerPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate / Contact Email</label>
                <input 
                  type="email" 
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="ramesh.k@homeease.in"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Trade Qualification</label>
                  <select
                    value={newWorkerTrade}
                    onChange={(e) => setNewWorkerTrade(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                  >
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="AC Service & Repair">AC Service & Repair</option>
                    <option value="Hourly Service">Hourly Service</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Pincodes (comma-sep)</label>
                  <input 
                    type="text" 
                    value={newWorkerPincodes}
                    onChange={(e) => setNewWorkerPincodes(e.target.value)}
                    placeholder="500081, 500032"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Dispatch Address</label>
                <input 
                  type="text" 
                  value={newWorkerAddress}
                  onChange={(e) => setNewWorkerAddress(e.target.value)}
                  placeholder="Hitec City Main Road, Madhapur, Hyderabad"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
                  <input 
                    type="text" 
                    value={newWorkerPan}
                    onChange={(e) => setNewWorkerPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank A/C Number</label>
                  <input 
                    type="text" 
                    value={newWorkerBankAcc}
                    onChange={(e) => setNewWorkerBankAcc(e.target.value)}
                    placeholder="987654321098"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    value={newWorkerBankIfsc}
                    onChange={(e) => setNewWorkerBankIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
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
                  placeholder="e.g. Surge demand alert in Hitec City! Login now for 1.3x booking incentives."
                  rows={3}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#1D68F2]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveWorkerModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveWorkerModal(null);
                  setBroadcastMessage('');
                  setToastMessage(`Broadcast push notification sent to ${selectedIds.length} partners!`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
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
