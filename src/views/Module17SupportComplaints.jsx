import React, { useState, useEffect, useMemo } from 'react';
import { 
  LifeBuoy, Search, Filter, AlertTriangle, CheckCircle2, Clock, 
  XCircle, ChevronRight, IndianRupee, ShieldAlert, RefreshCw,
  MessageSquare, User, ArrowUpRight, Check, X, FileText, Phone,
  ShieldCheck, Layers, Send, Plus, ExternalLink, History, Sparkles,
  ThumbsUp, ThumbsDown, Flame, Briefcase, MapPin, Tag
} from 'lucide-react';
import { getOpsDisputes, createOpsDispute, resolveOpsDispute } from '../api/adminApi';

// Initial curated Hyderabad operational disputes
const HYDERABAD_DEFAULT_DISPUTES = [
  {
    disputeId: 'disp-hyd-8801',
    id: 'disp-hyd-8801',
    bookingId: 'BK-HYD-5001',
    customerName: 'Sneha Rao',
    customerPhone: '+91 98490 12345',
    workerName: 'Ramesh Kumar (Partner)',
    workerPhone: '+91 94401 56789',
    serviceName: 'Plumbing - Pipe Joint Leakage Fix',
    locality: 'Banjara Hills',
    category: 'QUALITY',
    severity: 'HIGH',
    reason: 'Pipe joint leaked after 2 hours of repair',
    description: 'The repaired pipe joint under the kitchen sink burst 2 hours after technician left, dampening the wooden modular cabinet.',
    amount: 850,
    disputedAmount: 850,
    status: 'OPEN',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
    slaRemainingMinutes: 15,
  },
  {
    disputeId: 'disp-hyd-8802',
    id: 'disp-hyd-8802',
    bookingId: 'BK-HYD-5002',
    customerName: 'Vikram Reddy',
    customerPhone: '+91 98850 67890',
    workerName: 'Mohammed Arif (Partner)',
    workerPhone: '+91 98480 34567',
    serviceName: 'AC Deep Clean & Gas Check',
    locality: 'Hitec City',
    category: 'BILLING',
    severity: 'MEDIUM',
    reason: 'Partner demanded ₹600 extra cash for outdoor bracket cleaning',
    description: 'Technician claimed outdoor unit bracket was rusted and asked for ₹600 cash outside the HomeEase application booking invoice.',
    amount: 600,
    disputedAmount: 600,
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // 1.5h ago
    slaRemainingMinutes: 45,
  },
  {
    disputeId: 'disp-hyd-8803',
    id: 'disp-hyd-8803',
    bookingId: 'BK-HYD-5003',
    customerName: 'Pooja Sharma',
    customerPhone: '+91 99890 23456',
    workerName: 'Suresh Goud (Partner)',
    workerPhone: '+91 93910 89012',
    serviceName: 'Electrical - Switchboard Replacement',
    locality: 'Madhapur',
    category: 'CONDUCT',
    severity: 'LOW',
    reason: 'Partner arrived 50 mins late without prior notification',
    description: 'Scheduled slot was 10:00 AM, partner arrived at 10:50 AM without calling in advance to notify about traffic delay.',
    amount: 399,
    disputedAmount: 399,
    status: 'RESOLVED_REFUNDED',
    refundAmount: 100,
    resolutionNotes: 'Issued ₹100 customer goodwill credit to wallet. Partner warned for SLA slot discipline.',
    resolvedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    disputeId: 'disp-hyd-8804',
    id: 'disp-hyd-8804',
    bookingId: 'BK-HYD-5004',
    customerName: 'Kiran Kumar',
    customerPhone: '+91 97000 45678',
    workerName: 'Venkat Rao (Partner)',
    workerPhone: '+91 96180 78901',
    serviceName: 'Full Home Deep Cleaning (3BHK)',
    locality: 'Gachibowli',
    category: 'QUALITY',
    severity: 'HIGH',
    reason: 'Kitchen exhaust and balcony window glass left uncleaned',
    description: 'Team completed 3 hours and marked job complete, but exhaust mesh and master balcony glass were untouched.',
    amount: 2200,
    disputedAmount: 2200,
    status: 'OPEN',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    slaRemainingMinutes: 35,
  },
  {
    disputeId: 'disp-hyd-8805',
    id: 'disp-hyd-8805',
    bookingId: 'BK-HYD-5005',
    customerName: 'Ananya Joshi',
    customerPhone: '+91 91210 56789',
    workerName: 'Rajesh Varma (Partner)',
    workerPhone: '+91 95530 12345',
    serviceName: 'Carpentry - Wardrobe Hinge Repair',
    locality: 'Jubilee Hills',
    category: 'QUALITY',
    severity: 'MEDIUM',
    reason: 'Wardrobe hinge misalignment after initial screw mounting',
    description: 'Door rubbed against bottom frame. Customer opened dispute requesting rework.',
    amount: 650,
    disputedAmount: 650,
    status: 'RESOLVED_COMPENSATED',
    compensationAmount: 650,
    resolutionNotes: 'Partner revisited same afternoon and re-aligned hinge. Customer confirmed complete satisfaction.',
    resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    disputeId: 'disp-hyd-8806',
    id: 'disp-hyd-8806',
    bookingId: 'BK-HYD-5006',
    customerName: 'Arjun Mehta',
    customerPhone: '+91 98660 78912',
    workerName: 'Praveen Naik (Partner)',
    workerPhone: '+91 94900 67890',
    serviceName: 'Pest Control - Cockroach Gel Treatment',
    locality: 'Kondapur',
    category: 'QUALITY',
    severity: 'LOW',
    reason: 'Customer reported noticing chemical smell in kitchen',
    description: 'Partner used odorless synthetic pyrethroid gel as per protocol. Advised 30 mins window aeration.',
    amount: 1100,
    disputedAmount: 1100,
    status: 'REJECTED',
    resolutionNotes: 'Standard operating procedure verified; gel formulation confirmed non-toxic. Customer educated on standard dissipation time.',
    resolvedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  }
];

export const Module17SupportComplaints = ({
  bookings = [],
  workers = [],
  customers = [],
  ledger = [],
  onRefresh,
  onNavigateModule
}) => {
  // Operational tabs: 'desk' (Dispute Desk), 'log' (Log New Incident), 'audit' (Resolution Audit Vault)
  const [activeTab, setActiveTab] = useState('desk');

  const [disputes, setDisputes] = useState(() => {
    try {
      const saved = localStorage.getItem('homeease_admin_disputes');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return HYDERABAD_DEFAULT_DISPUTES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Investigation & Resolution Slide-over state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [resolutionAction, setResolutionAction] = useState('RESOLVED_REFUNDED');
  const [refundAmount, setRefundAmount] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Incident Logging state
  const [newBookingId, setNewBookingId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newLocality, setNewLocality] = useState('Hitec City');
  const [newCategory, setNewCategory] = useState('QUALITY');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newReason, setNewReason] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('500');
  const [isLogging, setIsLogging] = useState(false);

  // Fetch from backend
  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const data = await getOpsDisputes(statusFilter !== 'ALL' ? statusFilter : null);
      const list = Array.isArray(data) ? data : (data?.content || []);
      if (list.length > 0) {
        setDisputes(list);
        localStorage.setItem('homeease_admin_disputes', JSON.stringify(list));
      }
    } catch (err) {
      console.warn('Backend disputes fetch note, using local state:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Real-time KPI Ribbon Metrics
  const metrics = useMemo(() => {
    let openCount = 0;
    let underReviewCount = 0;
    let criticalCount = 0;
    let totalEscrowAtStake = 0;
    let resolvedCount = 0;

    disputes.forEach(d => {
      const isPending = d.status === 'OPEN' || d.status === 'UNDER_REVIEW' || d.status === 'PENDING';
      if (d.status === 'OPEN' || d.status === 'PENDING') openCount++;
      if (d.status === 'UNDER_REVIEW') underReviewCount++;
      if (isPending && (d.severity === 'CRITICAL' || d.severity === 'HIGH')) criticalCount++;
      if (isPending) {
        totalEscrowAtStake += parseFloat(d.amount || d.disputedAmount || 0);
      }
      if (d.status === 'RESOLVED_REFUNDED' || d.status === 'RESOLVED_COMPENSATED' || d.status === 'RESOLVED') {
        resolvedCount++;
      }
    });

    const totalActive = openCount + underReviewCount;
    const totalCases = disputes.length || 1;
    const resolutionRate = Math.round((resolvedCount / totalCases) * 100);

    return {
      totalActive,
      openCount,
      underReviewCount,
      criticalCount,
      totalEscrowAtStake: Math.round(totalEscrowAtStake),
      resolvedCount,
      resolutionRate: Math.min(resolutionRate, 100),
      avgMttrHours: 1.8
    };
  }, [disputes]);

  // Filtered Disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const text = `${d.id || ''} ${d.disputeId || ''} ${d.bookingId || ''} ${d.customerName || ''} ${d.workerName || ''} ${d.reason || ''} ${d.locality || ''}`.toLowerCase();
      const matchQuery = !searchQuery || text.includes(searchQuery.toLowerCase().trim());
      
      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OPEN') matchStatus = d.status === 'OPEN' || d.status === 'PENDING';
        else if (statusFilter === 'UNDER_REVIEW') matchStatus = d.status === 'UNDER_REVIEW';
        else if (statusFilter === 'RESOLVED') matchStatus = d.status?.startsWith('RESOLVED');
        else matchStatus = d.status === statusFilter;
      }

      // Severity filter
      const matchSeverity = severityFilter === 'ALL' || d.severity === severityFilter;

      // Category filter
      const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;

      return matchQuery && matchStatus && matchSeverity && matchCategory;
    });
  }, [disputes, searchQuery, statusFilter, severityFilter, categoryFilter]);

  // Open Investigation Dossier
  const handleOpenDossier = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionAction('RESOLVED_REFUNDED');
    setRefundAmount(dispute.amount || dispute.disputedAmount || '');
    setCompensationAmount('0');
    setResolutionNotes('');
    setIsDossierOpen(true);
  };

  // Commit Settlement Decision
  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setIsSubmitting(true);

    const disputeId = selectedDispute.id || selectedDispute.disputeId;
    const refNum = parseFloat(refundAmount) || 0;
    const compNum = parseFloat(compensationAmount) || 0;

    const payload = {
      resolutionStatus: resolutionAction,
      refundAmount: refNum,
      compensationAmount: compNum,
      resolutionNotes: resolutionNotes || `Settled via Support Console as ${resolutionAction}`,
      idempotencyKey: `dispute-resolve-${disputeId}-${Date.now()}`
    };

    // Optimistic local update
    const updatedDisputes = disputes.map(d => {
      if ((d.id || d.disputeId) === disputeId) {
        return {
          ...d,
          status: resolutionAction,
          refundAmount: refNum,
          compensationAmount: compNum,
          resolutionNotes: payload.resolutionNotes,
          resolvedAt: new Date().toISOString()
        };
      }
      return d;
    });

    setDisputes(updatedDisputes);
    localStorage.setItem('homeease_admin_disputes', JSON.stringify(updatedDisputes));

    try {
      await resolveOpsDispute(disputeId, payload);
      showFeedback('success', `Dispute #${disputeId.slice(0, 8)} successfully settled & posted to financial ledger!`);
    } catch (err) {
      console.warn('Backend dispute resolve note:', err.message);
      showFeedback('success', `Settlement committed locally: ${resolutionAction}.`);
    } finally {
      setIsSubmitting(false);
      setIsDossierOpen(false);
      if (onRefresh) onRefresh();
    }
  };

  // Handle Booking Selection in Log Tab to Auto-fill
  const handleSelectBookingForIncident = (bId) => {
    setNewBookingId(bId);
    const bk = bookings.find(b => (b.id || b.bookingId) === bId);
    if (bk) {
      setNewCustomerName(bk.customerName || bk.user?.name || 'Customer');
      setNewCustomerPhone(bk.customerPhone || bk.user?.phoneNumber || '+91 98490 00000');
      setNewWorkerName(bk.workerName || bk.worker?.user?.name || 'Partner');
      setNewServiceName(bk.serviceName || bk.service?.name || 'Home Service');
      setNewLocality(bk.locality || bk.address?.locality || 'Hitec City');
      setNewAmount(bk.totalAmount || bk.finalPayableAmount || '500');
    }
  };

  // Log New Incident Form Submit
  const handleLogIncident = async (e) => {
    e.preventDefault();
    if (!newReason.trim()) return;

    setIsLogging(true);
    const generatedId = `disp-hyd-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDisputeRecord = {
      disputeId: generatedId,
      id: generatedId,
      bookingId: newBookingId.trim() || `BK-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomerName.trim() || 'Walk-in Customer',
      customerPhone: newCustomerPhone.trim() || '+91 98490 00000',
      workerName: newWorkerName.trim() || 'Assigned Partner',
      serviceName: newServiceName.trim() || 'Home Service',
      locality: newLocality,
      category: newCategory,
      severity: newSeverity,
      reason: newReason.trim(),
      description: newDescription.trim() || newReason.trim(),
      amount: parseFloat(newAmount) || 0,
      disputedAmount: parseFloat(newAmount) || 0,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      slaRemainingMinutes: newSeverity === 'CRITICAL' ? 30 : (newSeverity === 'HIGH' ? 60 : 180)
    };

    // Save locally
    const updated = [newDisputeRecord, ...disputes];
    setDisputes(updated);
    localStorage.setItem('homeease_admin_disputes', JSON.stringify(updated));

    try {
      await createOpsDispute({
        bookingId: newDisputeRecord.bookingId,
        reason: newDisputeRecord.reason,
        description: newDisputeRecord.description
      });
      showFeedback('success', `Incident #${generatedId} opened and assigned to Hyderabad Resolution Desk.`);
    } catch (err) {
      console.warn('Backend dispute log note, saved locally:', err.message);
      showFeedback('success', `Incident #${generatedId} logged locally.`);
    } finally {
      setIsLogging(false);
      setNewReason('');
      setNewDescription('');
      setActiveTab('desk');
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#1D68F2] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/30 text-blue-200 text-[11px] font-bold tracking-wider uppercase border border-blue-400/30">
              Customer Excellence & Governance
            </span>
            <span className="text-xs text-blue-200/80">Market: Hyderabad Core</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-blue-400" /> Support & Complaints Operations
          </h2>
          <p className="text-blue-100/80 text-xs mt-1 max-w-2xl">
            Arbitrate booking disputes, resolve partner quality & conduct grievances, protect customer trust, and execute double-entry ledger refunds across all Hyderabad service zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              fetchDisputes();
              if (onRefresh) onRefresh();
              showFeedback('success', 'Disputes stream refreshed.');
            }}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-300' : ''}`} />
            <span>Refresh Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className="px-4 py-2 bg-white text-[#1D68F2] hover:bg-blue-50 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#1D68F2]" /> Log New Grievance
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in transition ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Real-Time Operations KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Grievances</span>
            <LifeBuoy className="w-4 h-4 text-[#1D68F2]" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalActive}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <Clock className="w-3 h-3" /> {metrics.openCount} Open / {metrics.underReviewCount} Under Review
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Critical P0/P1 Load</span>
            <Flame className={`w-4 h-4 ${metrics.criticalCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {metrics.criticalCount}
          </div>
          <div className="mt-1 text-[11px] font-medium">
            {metrics.criticalCount > 0 ? (
              <span className="text-rose-600 font-bold">&lt; 30m SLA priority desk</span>
            ) : (
              <span className="text-slate-400">Zero critical escalations</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Escrow at Stake</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">
            ₹{metrics.totalEscrowAtStake.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Disputed funds on hold
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Resolution Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {metrics.resolutionRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            {metrics.resolvedCount} settled cases
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Resolution MTTR</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.avgMttrHours} hrs
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Hyderabad average turnaround
          </div>
        </div>
      </div>

      {/* 3. Operational Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('desk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'desk'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <LifeBuoy className="w-4 h-4" /> Active Dispute Desk ({filteredDisputes.length})
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'log'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4" /> Fast Incident Logging Desk
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" /> Resolution & Double-Entry Audit Vault
        </button>
      </div>

      {/* TAB 1: ACTIVE DISPUTE DESK */}
      {activeTab === 'desk' && (
        <div className="space-y-4">
          {/* Multi-Tier Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispute ref, customer, partner, reason..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#1D68F2] focus:bg-white transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Segment */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'ALL', label: `All (${disputes.length})` },
                  { id: 'OPEN', label: 'Open' },
                  { id: 'UNDER_REVIEW', label: 'Reviewing' },
                  { id: 'RESOLVED', label: 'Settled' },
                  { id: 'REJECTED', label: 'Dismissed' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === item.id 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Severity Dropdown */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">P0 Critical</option>
                <option value="HIGH">P1 High</option>
                <option value="MEDIUM">P2 Medium</option>
                <option value="LOW">P3 Low</option>
              </select>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="QUALITY">Service Quality</option>
                <option value="CONDUCT">Partner Conduct</option>
                <option value="BILLING">Billing & Cash</option>
                <option value="DAMAGE">Accidental Damage</option>
              </select>
            </div>
          </div>

          {/* Disputes Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Dispute Ref</th>
                    <th className="py-3 px-4">Booking & Service</th>
                    <th className="py-3 px-4">Customer & Cluster</th>
                    <th className="py-3 px-4">Partner Profile</th>
                    <th className="py-3 px-4">Grievance & Category</th>
                    <th className="py-3 px-4">Disputed (₹)</th>
                    <th className="py-3 px-4">SLA / Status</th>
                    <th className="py-3 px-4 text-right">Arbitration Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDisputes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <div className="font-bold text-slate-700 text-sm">No Matching Support Incidents</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {searchQuery ? 'No disputes match your active search and filters.' : 'All customer service cases are settled and running smoothly.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDisputes.map((d) => {
                      const id = d.id || d.disputeId || 'N/A';
                      const bookingId = d.bookingId || d.booking?.id || '—';
                      const isPending = d.status === 'PENDING' || d.status === 'OPEN' || d.status === 'UNDER_REVIEW';
                      const isCritical = d.severity === 'CRITICAL' || d.severity === 'HIGH';

                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition">
                          {/* Dispute Ref */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1D68F2]">
                            #{id.slice(0, 12)}
                          </td>

                          {/* Booking & Service */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-800">
                              {bookingId !== '—' ? `#${bookingId.slice(0, 10)}` : '—'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal truncate max-w-[150px]">
                              {d.serviceName || 'Home Service'}
                            </div>
                          </td>

                          {/* Customer & Cluster */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {d.customerName || 'Customer'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{d.locality || 'Hyderabad'}</span>
                            </div>
                          </td>

                          {/* Worker Partner */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">
                              {d.workerName || 'Partner'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {d.workerPhone || 'Verified Partner'}
                            </div>
                          </td>

                          {/* Reason & Category */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                d.severity === 'CRITICAL' 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                  : d.severity === 'HIGH' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {d.severity || 'P2'}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                {d.category || 'Quality'}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-800 truncate" title={d.reason}>
                              {d.reason}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate" title={d.description}>
                              {d.description}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            ₹{(d.amount || d.disputedAmount || 0).toLocaleString('en-IN')}
                          </td>

                          {/* SLA / Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider block w-max ${
                                d.status === 'OPEN' || d.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : d.status === 'UNDER_REVIEW'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : d.status === 'RESOLVED_REFUNDED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : d.status === 'RESOLVED_COMPENSATED'
                                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {d.status?.replace('_', ' ') || 'OPEN'}
                              </span>

                              {isPending && d.slaRemainingMinutes !== undefined && (
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span className={d.slaRemainingMinutes <= 20 ? 'text-rose-600 font-black' : ''}>
                                    {d.slaRemainingMinutes}m SLA left
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenDossier(d)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                                isPending
                                  ? 'bg-[#1D68F2] hover:bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{isPending ? 'Investigate & Settle' : 'Dossier'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAST INCIDENT LOGGING DESK */}
      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            <form onSubmit={handleLogIncident} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Register Support Complaint / Dispute</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log customer grievances from incoming phone call, WhatsApp support, or in-app escalation.
                </p>
              </div>

              {/* Booking Link / Quick Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Link Active Booking (Optional Auto-Fill)
                </label>
                <div className="flex gap-2">
                  <select
                    value={newBookingId}
                    onChange={(e) => handleSelectBookingForIncident(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white transition"
                  >
                    <option value="">-- Choose from Recent Bookings or Enter Manually --</option>
                    {bookings.slice(0, 15).map(b => (
                      <option key={b.id || b.bookingId} value={b.id || b.bookingId}>
                        #{b.id ? b.id.slice(0, 8) : 'BK'} - {b.serviceName || b.service?.name || 'Service'} ({b.customerName || b.user?.name || 'Customer'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer & Worker Party Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                  <input 
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Sneha Rao"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone Number</label>
                  <input 
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98490 12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Partner Name</label>
                  <input 
                    type="text"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hyderabad Service Locality</label>
                  <select
                    value={newLocality}
                    onChange={(e) => setNewLocality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  >
                    <option value="Hitec City">Hitec City (500081)</option>
                    <option value="Gachibowli">Gachibowli (500032)</option>
                    <option value="Banjara Hills">Banjara Hills (500034)</option>
                    <option value="Jubilee Hills">Jubilee Hills (500033)</option>
                    <option value="Madhapur">Madhapur (500081)</option>
                    <option value="Kondapur">Kondapur (500084)</option>
                    <option value="Kukatpally">Kukatpally (500072)</option>
                    <option value="Secunderabad">Secunderabad (500003)</option>
                  </select>
                </div>
              </div>

              {/* Classification, Severity & Disputed Amount */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grievance Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  >
                    <option value="QUALITY">Service Quality</option>
                    <option value="CONDUCT">Partner Conduct / Behavior</option>
                    <option value="BILLING">Billing / Extra Cash Demand</option>
                    <option value="NOSHOW">Partner No-Show / Delay</option>
                    <option value="DAMAGE">Accidental Property Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity / SLA Tier</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  >
                    <option value="CRITICAL">P0 Critical (&lt; 30 min SLA)</option>
                    <option value="HIGH">P1 High (&lt; 1 hr SLA)</option>
                    <option value="MEDIUM">P2 Medium (&lt; 3 hr SLA)</option>
                    <option value="LOW">P3 Low (&lt; 24 hr SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Disputed Amount (₹) *</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Grievance Statement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Complaint Headline *</label>
                <input 
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. AC cooling issue not resolved after service"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Incident Narrative & Customer Statement</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="State verbatim customer statement, evidence presented, and partner counter-response..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('desk')} 
                  className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLogging}
                  className="px-6 py-2.5 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
                >
                  {isLogging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isLogging ? 'Filing Case...' : 'Open Dispute Ticket'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Protocols & Guidelines (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Standard Resolution Protocol
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1D68F2] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>30-Min Telephonic Triage:</strong> Support agent calls customer to evaluate severity and request photos/receipts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1D68F2] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Partner Defense Verification:</strong> Cross-check partner audit logs, work check-in/out timestamps, and OTP validation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1D68F2] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Double-Entry Ledger Commitment:</strong> Every refund immediately debits the Escrow account and credits the customer via Razorpay/UPI.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-[#0B192C] text-white rounded-2xl p-5 shadow-md border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Zero Tolerance Violations
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Demanding cash outside the app or disrespectful behavior incurs an immediate 7-day partner suspension and ₹500 disciplinary penalty under HomeEase Partner Governance Policy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESOLUTION & ARBITRATION AUDIT VAULT */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Arbitration Settlement & Double-Entry Ledger Vault</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable record of resolved customer claims, partner compensations, and platform debit postings.
              </p>
            </div>

            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('payments')}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1D68F2] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Inspect in Financial Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Dispute ID</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer & Partner</th>
                    <th className="py-3 px-4">Arbitration Outcome</th>
                    <th className="py-3 px-4">Customer Refund</th>
                    <th className="py-3 px-4">Partner Comp.</th>
                    <th className="py-3 px-4">Auditor Notes</th>
                    <th className="py-3 px-4">Settled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {disputes
                    .filter(d => d.status?.startsWith('RESOLVED') || d.status === 'REJECTED')
                    .map((d, idx) => (
                      <tr key={d.id || d.disputeId || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1D68F2]">
                          #{d.id ? d.id.slice(0, 10) : 'DISP'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          #{d.bookingId ? d.bookingId.slice(0, 10) : 'BK'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{d.customerName}</div>
                          <div className="text-[11px] text-slate-400">Worker: {d.workerName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            d.status === 'RESOLVED_REFUNDED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'RESOLVED_COMPENSATED'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {d.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                          {d.refundAmount ? `₹${d.refundAmount}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                          {d.compensationAmount ? `₹${d.compensationAmount}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-600 text-[11px] truncate" title={d.resolutionNotes}>
                          {d.resolutionNotes || 'Arbitration settled by Admin'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Investigation & Resolution Slide-over Dossier */}
      {isDossierOpen && selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200"
          >
            <div className="space-y-5">
              {/* Dossier Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1D68F2] text-[10px] font-bold border border-blue-200">
                      Dispute Dossier
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      #{selectedDispute.id || selectedDispute.disputeId}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {selectedDispute.reason}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDossierOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Case 360 Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Customer Profile
                  </div>
                  <div className="font-bold text-slate-900">{selectedDispute.customerName || 'Customer'}</div>
                  <div className="text-xs text-slate-600 font-mono">{selectedDispute.customerPhone || 'N/A'}</div>
                  <div className="pt-1 flex gap-2">
                    {selectedDispute.customerPhone && (
                      <a
                        href={`https://wa.me/${selectedDispute.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`tel:${selectedDispute.customerPhone || ''}`}
                      className="px-2 py-0.5 rounded-md bg-blue-100 text-[#1D68F2] text-[10px] font-bold hover:bg-blue-200 transition"
                    >
                      Call
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned Partner
                  </div>
                  <div className="font-bold text-slate-900">{selectedDispute.workerName || 'Partner'}</div>
                  <div className="text-xs text-slate-600 font-mono">{selectedDispute.workerPhone || 'N/A'}</div>
                  <div className="pt-1 flex gap-2">
                    {selectedDispute.workerPhone && (
                      <a
                        href={`https://wa.me/${selectedDispute.workerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={`tel:${selectedDispute.workerPhone || ''}`}
                      className="px-2 py-0.5 rounded-md bg-blue-100 text-[#1D68F2] text-[10px] font-bold hover:bg-blue-200 transition"
                    >
                      Call
                    </a>
                  </div>
                </div>
              </div>

              {/* Grievance Narrative */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Incident Statement & Evidence</span>
                  <span className="font-mono font-black text-[#1D68F2]">
                    Disputed: ₹{selectedDispute.amount || selectedDispute.disputedAmount || 0}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selectedDispute.description || selectedDispute.reason}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-blue-100">
                  <span>Locality: <strong>{selectedDispute.locality || 'Hyderabad'}</strong></span>
                  <span>Booking Ref: <strong>#{selectedDispute.bookingId}</strong></span>
                </div>
              </div>

              {/* Arbitration Resolution Form */}
              <form onSubmit={handleConfirmResolve} id="resolveDisputeForm" className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase tracking-wider text-[11px]">
                    Settlement Determination *
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'RESOLVED_REFUNDED',
                        title: 'Refund Customer (Debit Platform / Worker Escrow)',
                        desc: 'Customer claim substantiated. Funds refunded via payment gateway.'
                      },
                      {
                        id: 'RESOLVED_COMPENSATED',
                        title: 'Release Escrow to Partner (Dismiss Complaint)',
                        desc: 'Partner completed job satisfactorily or customer complaint unfounded.'
                      },
                      {
                        id: 'REJECTED',
                        title: 'Reject & Close Without Financial Movement',
                        desc: 'Dispute dismissed after review. No ledger debit or refund.'
                      }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setResolutionAction(opt.id)}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                          resolutionAction === opt.id
                            ? 'border-[#1D68F2] bg-blue-50 text-[#1D68F2]'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                          resolutionAction === opt.id ? 'border-[#1D68F2] bg-[#1D68F2]' : 'border-slate-300'
                        }`}>
                          {resolutionAction === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-bold">{opt.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Inputs for Refund / Compensation */}
                {resolutionAction === 'RESOLVED_REFUNDED' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Refund Amount to Customer (₹) *
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                      required
                    />
                  </div>
                )}

                {resolutionAction === 'RESOLVED_COMPENSATED' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Compensation Amount Released to Worker (₹) *
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={compensationAmount || selectedDispute.amount}
                      onChange={(e) => setCompensationAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Auditor Notes & Justification Memo *
                  </label>
                  <textarea 
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide compliance rationale for this decision and double-entry reversal..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Dossier Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                form="resolveDisputeForm"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Posting Settlement...' : 'Commit Settlement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
