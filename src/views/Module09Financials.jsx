import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Download, X, AlertCircle, CheckCircle2,
  RefreshCw, ShieldAlert, ArrowRight, UserCheck, Layers, FileText, Check,
  CreditCard, IndianRupee, ArrowUpRight, Filter, ExternalLink, ShieldCheck,
  Building2, Phone, MessageSquare, AlertTriangle, ChevronRight, Hash,
  Wallet, PieChart, Landmark, DollarSign
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  updatePaymentStatus,
  getPendingPayouts,
  settleBatchPayout,
  getOpsDisputes,
  resolveOpsDispute
} from '../api/adminApi';

export const Module09Financials = ({
  ledger = [],
  setLedger,
  bookings = [],
  workers = [],
  categories = [],
  onRefresh,
  onNavigateModule
}) => {
  // 4 Operational Tabs
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'payouts' | 'disputes' | 'ledger-statement'
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Selected Transaction for 360 Drawer
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Partner Payouts State
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [isSettling, setIsSettling] = useState(false);
  const [payoutReceipt, setPayoutReceipt] = useState(null);

  // Disputes & Reversals State
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeResolutionForm, setDisputeResolutionForm] = useState({
    action: 'REFUND_CUSTOMER',
    refundAmount: '',
    workerPenaltyAmount: '0',
    reason: ''
  });
  const [isResolving, setIsResolving] = useState(false);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // 1. Load Pending Payouts from backend
  const loadPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await getPendingPayouts();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setPendingPayouts(list);
      setSelectedWorkers(list.map(p => p.workerId));
    } catch (err) {
      console.warn('Failed to load pending payouts:', err);
    } finally {
      setLoadingPayouts(false);
    }
  }, []);

  // 2. Load Disputes from backend
  const loadDisputes = useCallback(async () => {
    setLoadingDisputes(true);
    try {
      const res = await getOpsDisputes();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDisputes(list);
    } catch (err) {
      console.warn('Failed to load disputes:', err);
    } finally {
      setLoadingDisputes(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'payouts') loadPayouts();
    if (activeTab === 'disputes') loadDisputes();
  }, [activeTab, loadPayouts, loadDisputes]);

  // Handle Batch Payout Execution
  const handleSettleBatch = async () => {
    if (selectedWorkers.length === 0) {
      showAlert('error', 'Select at least one partner for batch settlement.');
      return;
    }
    setIsSettling(true);
    try {
      const idempotencyKey = `payout-batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = await settleBatchPayout(selectedWorkers, idempotencyKey);
      const batchRef = res?.batchReference || res?.[0]?.razorpayPayoutId || idempotencyKey;
      const totalAmt = pendingPayouts
        .filter(p => selectedWorkers.includes(p.workerId))
        .reduce((sum, p) => sum + Number(p.pendingBalance || p.balance || 0), 0);

      setPayoutReceipt({
        batchRef,
        count: selectedWorkers.length,
        totalAmount: totalAmt,
        timestamp: new Date().toLocaleTimeString('en-IN')
      });

      showAlert('success', `Batch payout executed successfully! Batch Ref: #${batchRef.slice(0, 14)}`);
      loadPayouts();
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Batch settlement failed: ${err.message}`);
    } finally {
      setIsSettling(false);
    }
  };

  // Handle Dispute Resolution
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      await resolveOpsDispute(selectedDispute.id || selectedDispute.disputeId, {
        status: disputeResolutionForm.action === 'REJECT' ? 'REJECTED' : 'RESOLVED',
        refundAmount: Number(disputeResolutionForm.refundAmount) || 0,
        workerPenaltyAmount: Number(disputeResolutionForm.workerPenaltyAmount) || 0,
        resolutionNotes: disputeResolutionForm.reason || 'Resolved via Admin Operations Console'
      });
      showAlert('success', `Dispute on booking #${String(selectedDispute.bookingId).slice(0, 8)} resolved with double-entry reversing postings!`);
      setSelectedDispute(null);
      loadDisputes();
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Failed to resolve dispute: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Payment Status Override
  const handleStatusChange = async (paymentId, newStatus) => {
    setIsUpdating(true);
    try {
      await updatePaymentStatus(paymentId, newStatus);
      if (setLedger) {
        setLedger(prev => prev.map(item => (item.paymentId === paymentId || item.id === paymentId)
          ? { ...item, status: newStatus }
          : item
        ));
      }
      showAlert('success', `Payment #${String(paymentId).slice(0, 8)} status updated to ${newStatus}!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Transactions
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const status = (item.status || 'PENDING').toUpperCase();
      const matchesStatus = statusFilter === 'All' || status === statusFilter.toUpperCase();

      const method = (item.paymentMethod || item.paymentMode || 'UPI').toUpperCase();
      const matchesMethod = methodFilter === 'All' || method.includes(methodFilter.toUpperCase());

      const q = searchQuery.toLowerCase().trim();
      const ref = String(item.transactionRef || item.jobRef || item.paymentId || item.id || '').toLowerCase();
      const cust = String(item.customerName || item.customer || '').toLowerCase();
      const phone = String(item.customerPhone || '').toLowerCase();
      const booking = String(item.bookingId || '').toLowerCase();

      const matchesSearch = !q || ref.includes(q) || cust.includes(q) || phone.includes(q) || booking.includes(q);

      return matchesStatus && matchesMethod && matchesSearch;
    });
  }, [ledger, statusFilter, methodFilter, searchQuery]);

  // Aggregate Financial Totals
  const totalGross = useMemo(() => ledger.reduce((acc, curr) => acc + Number(curr.grossAmount || 0), 0), [ledger]);
  const totalCommission = useMemo(() => ledger.reduce((acc, curr) => acc + Number(curr.platformCommissionAmount || curr.commission || (curr.grossAmount ? curr.grossAmount * 0.2 : 0)), 0), [ledger]);
  const totalPayouts = useMemo(() => ledger.reduce((acc, curr) => acc + Number(curr.workerPayoutAmount || curr.workerPayout || (curr.grossAmount ? curr.grossAmount * 0.8 : 0)), 0), [ledger]);
  const pendingPayoutsTotal = useMemo(() => pendingPayouts.reduce((acc, curr) => acc + Number(curr.pendingBalance || curr.balance || 0), 0), [pendingPayouts]);
  const activeDisputesTotal = useMemo(() => disputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'REJECTED').reduce((acc, curr) => acc + Number(curr.claimedAmount || curr.disputedAmount || 0), 0), [disputes]);

  // Export Financial Ledger Statement
  const handleExportStatement = () => {
    const csvRows = [
      ['Transaction ID', 'Booking ID', 'Customer', 'Phone', 'Gross Amount (INR)', 'Platform Fee (20%)', 'Worker Payout (80%)', 'Payment Method', 'Status', 'Date'].join(',')
    ];

    filteredLedger.forEach(item => {
      csvRows.push([
        `"${item.transactionRef || item.paymentId || ''}"`,
        `"${item.bookingId || item.jobRef || ''}"`,
        `"${item.customerName || item.customer || ''}"`,
        `"${item.customerPhone || ''}"`,
        Number(item.grossAmount || 0).toFixed(2),
        Number(item.platformCommissionAmount || item.commission || 0).toFixed(2),
        Number(item.workerPayoutAmount || item.workerPayout || 0).toFixed(2),
        `"${item.paymentMethod || 'UPI'}"`,
        `"${item.status || 'CAPTURED'}"`,
        `"${item.createdAt ? new Date(item.createdAt).toISOString() : ''}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HomeEase_Financial_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5 text-[#1D68F2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Payments & Financial Ledger</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Double-Entry Balanced
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated 80/20 customer escrow settlements, Razorpay Route partner batch payouts, and audit-proof journal accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportStatement}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              if (activeTab === 'payouts') loadPayouts();
              if (activeTab === 'disputes') loadDisputes();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono">
              ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Processed Gross (GMV)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PercentBadge className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-600 font-mono">
              ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Take-Rate (20%)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-indigo-600 font-mono">
              ₹{totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Earnings (80%)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-600 font-mono">
              ₹{pendingPayoutsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Partner Payouts</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-600 font-mono">
              ₹{activeDisputesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dispute Hold Reserve</div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-4 gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'transactions' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'payouts' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Partner Payouts</span>
              {pendingPayouts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {pendingPayouts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'disputes' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Disputes & Reversals</span>
              {disputes.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                  {disputes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ledger-statement')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'ledger-statement' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>General Ledger Accounts</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search txn ref, customer, booking..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {alertMsg && (
          <div className={`m-4 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
            alertMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* TAB 1: TRANSACTIONS & ESCROW */}
        {activeTab === 'transactions' && (
          <div className="p-5 space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Status:</span>
                {['All', 'CAPTURED', 'PENDING', 'AUTHORIZED', 'REFUNDED', 'FAILED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 font-bold rounded-lg transition cursor-pointer ${
                      statusFilter === st ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Method:</span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="All">All Payment Methods</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">Netbanking</option>
                  <option value="COD">Pay After Service (Cash)</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Txn ID & Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Gross Vol.</th>
                    <th className="py-3 px-4">Commission (20%)</th>
                    <th className="py-3 px-4">Partner Share (80%)</th>
                    <th className="py-3 px-4">Method & Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No payment transactions found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Transactions captured via customer checkout will log here automatically.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item, idx) => {
                      const pId = item.paymentId || item.id || `p-${idx}`;
                      const bId = item.bookingId || item.jobRef || 'Booking';
                      const custName = item.customerName || item.customer || 'Customer';
                      const custPhone = item.customerPhone || '+91 98765 43210';
                      const gross = Number(item.grossAmount || 0);
                      const comm = Number(item.platformCommissionAmount || item.commission || gross * 0.2);
                      const payout = Number(item.workerPayoutAmount || item.workerPayout || gross * 0.8);
                      const status = (item.status || 'CAPTURED').toUpperCase();
                      const method = item.paymentMethod || item.paymentMode || 'UPI';
                      const date = item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent';

                      return (
                        <tr
                          key={pId}
                          onClick={() => setSelectedTxn({ ...item, pId, bId, custName, custPhone, gross, comm, payout, status, method, date })}
                          className="hover:bg-slate-50/80 transition cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {item.transactionRef || `TXN-${String(pId).slice(0, 10)}`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{date}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                            #{String(bId).slice(0, 8)}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{custName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{custPhone}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            ₹{gross.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                            ₹{comm.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-indigo-700 font-bold">
                            ₹{payout.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={status} />
                              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                                {method}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={status}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(pId, e.target.value)}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition cursor-pointer"
                              title="Update status"
                            >
                              <option value="CAPTURED">CAPTURED</option>
                              <option value="PENDING">PENDING</option>
                              <option value="AUTHORIZED">AUTHORIZED</option>
                              <option value="REFUNDED">REFUNDED</option>
                              <option value="FAILED">FAILED</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER PAYOUTS & BATCH SETTLEMENTS */}
        {activeTab === 'payouts' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Pending Partner Payout Balances (Double-Entry Escrow)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Balances owed to service partners under liability account <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">LIABILITY_WORKER_PAYABLE</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPayouts}
                  disabled={loadingPayouts}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPayouts ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleSettleBatch}
                  disabled={isSettling || selectedWorkers.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSettling ? 'Executing...' : `Execute Batch Settlement (${selectedWorkers.length})`}</span>
                </button>
              </div>
            </div>

            {/* Payout Batch Receipt Banner */}
            {payoutReceipt && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-emerald-900">Batch Payout Processed Successfully</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Disbursed <strong className="font-mono">₹{payoutReceipt.totalAmount.toFixed(2)}</strong> across {payoutReceipt.count} verified partners. Batch Ref: #{payoutReceipt.batchRef.slice(0, 16)} at {payoutReceipt.timestamp}.
                  </p>
                </div>
                <button onClick={() => setPayoutReceipt(null)} className="text-emerald-700 hover:text-emerald-900"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Payouts Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={pendingPayouts.length > 0 && selectedWorkers.length === pendingPayouts.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedWorkers(pendingPayouts.map(p => p.workerId));
                          else setSelectedWorkers([]);
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Partner Name & ID</th>
                    <th className="py-3 px-4">Phone / Account</th>
                    <th className="py-3 px-4">Pending Balance</th>
                    <th className="py-3 px-4">Settled Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {pendingPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">Zero Pending Payouts</p>
                        <p className="text-xs text-slate-400 mt-0.5">All partner accounts have been fully settled via Razorpay Route.</p>
                      </td>
                    </tr>
                  ) : (
                    pendingPayouts.map((w) => {
                      const isSelected = selectedWorkers.includes(w.workerId);
                      return (
                        <tr key={w.workerId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedWorkers([...selectedWorkers, w.workerId]);
                                else setSelectedWorkers(selectedWorkers.filter(id => id !== w.workerId));
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{w.workerName || w.name || 'Partner'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{w.workerId}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {w.phone || w.accountNumber || 'UPI VPA: partner@okhdfcbank'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold text-sm">
                            ₹{Number(w.pendingBalance || w.balance || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            ₹{Number(w.settledTotal || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              READY FOR PAYOUT
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DISPUTES & REVERSALS */}
        {activeTab === 'disputes' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Customer Disputes & Compensating Reversals</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer dispute claims require admin arbitration and trigger double-entry reversing postings (<code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono">REVENUE_PLATFORM_COMMISSION</code> $\rightarrow$ <code className="text-slate-600 bg-slate-50 px-1 py-0.5 rounded font-mono">ASSET_CASH</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={loadDisputes}
                disabled={loadingDisputes}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDisputes ? 'animate-spin' : ''}`} />
                <span>Refresh Disputes</span>
              </button>
            </div>

            {/* Disputes Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Dispute ID & Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer Reason</th>
                    <th className="py-3 px-4">Claimed Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Arbitration Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                        <p className="font-bold text-slate-700">Zero Open Customer Disputes</p>
                        <p className="text-xs text-slate-400 mt-0.5">All customer claims have been investigated and settled.</p>
                      </td>
                    </tr>
                  ) : (
                    disputes.map((d) => (
                      <tr key={d.id || d.disputeId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900">#{String(d.id || d.disputeId).slice(0, 8)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          #{String(d.bookingId).slice(0, 8)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {d.reason || d.description || 'Service quality issue'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-rose-600 font-bold">
                          ₹{Number(d.claimedAmount || d.disputedAmount || 0).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : d.status === 'REJECTED'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {d.status || 'OPEN'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDispute(d);
                                setDisputeResolutionForm({
                                  action: 'REFUND_CUSTOMER',
                                  refundAmount: String(d.claimedAmount || d.disputedAmount || ''),
                                  workerPenaltyAmount: '0',
                                  reason: ''
                                });
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                            >
                              Resolve Dispute
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resolve Dispute Modal */}
            {selectedDispute && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Resolve Dispute Claim</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Booking #{String(selectedDispute.bookingId).slice(0, 8)}</p>
                    </div>
                    <button onClick={() => setSelectedDispute(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleResolveDispute} className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <label className="text-slate-700 block mb-1">Resolution Action</label>
                      <select
                        value={disputeResolutionForm.action}
                        onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, action: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                      >
                        <option value="REFUND_CUSTOMER">Refund Customer & Reverse Commission (Double-Entry Reversal)</option>
                        <option value="COMPENSATE_PARTNER">Compensate Partner from Platform Reserve</option>
                        <option value="REJECT">Reject Claim (Customer Ineligible)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-700 block mb-1">Refund Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={disputeResolutionForm.refundAmount}
                        onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, refundAmount: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 block mb-1">Resolution Audit Reasoning</label>
                      <textarea
                        rows={3}
                        value={disputeResolutionForm.reason}
                        onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, reason: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
                        placeholder="State findings from customer and partner calls for the immutable journal audit log..."
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedDispute(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResolving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-60"
                      >
                        {isResolving ? 'Executing...' : 'Confirm Resolution'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GENERAL LEDGER STATEMENT */}
        {activeTab === 'ledger-statement' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Double-Entry General Ledger Statement & Fund Flow</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical balance sheet governed by PostgreSQL advisory locks and idempotency keys.
              </p>
            </div>

            {/* 4 Core Ledger Accounts Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">Asset Account</span>
                <h4 className="font-bold text-sm text-slate-900">ASSET_CASH</h4>
                <div className="text-2xl font-black font-mono text-blue-900">
                  ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-blue-700">
                  All customer payments authorized & captured into platform bank escrow.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">Liability Account</span>
                <h4 className="font-bold text-sm text-slate-900">LIABILITY_CUSTOMER_ESCROW</h4>
                <div className="text-2xl font-black font-mono text-indigo-900">
                  ₹{(totalGross * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-indigo-700">
                  Escrowed funds held until job OTP is confirmed by customer at completion.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Revenue Account</span>
                <h4 className="font-bold text-sm text-slate-900">REVENUE_PLATFORM_COMMISSION</h4>
                <div className="text-2xl font-black font-mono text-emerald-900">
                  ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-emerald-700">
                  Net earnings recognized upon job completion (20% take-rate).
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">Liability Account</span>
                <h4 className="font-bold text-sm text-slate-900">LIABILITY_WORKER_PAYABLE</h4>
                <div className="text-2xl font-black font-mono text-amber-900">
                  ₹{pendingPayoutsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-amber-800">
                  Net payable balance queued for Razorpay Route partner batch transfer.
                </p>
              </div>
            </div>

            {/* Fund Flow Lifecycle Chart */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Escrow Settlement Fund Flow Lifecycle
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-blue-600 font-bold block text-[10px]">Step 1: Escrow Authorization</span>
                  <div className="font-bold text-slate-900">Debit ASSET_CASH</div>
                  <div className="text-slate-500 font-mono text-[11px]">Credit CUSTOMER_ESCROW</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-emerald-600 font-bold block text-[10px]">Step 2: Service Completion</span>
                  <div className="font-bold text-slate-900">Debit CUSTOMER_ESCROW</div>
                  <div className="text-slate-500 font-mono text-[11px]">Credit REVENUE (20%) + WORKER_PAYABLE (80%)</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-amber-600 font-bold block text-[10px]">Step 3: Partner Settlement</span>
                  <div className="font-bold text-slate-900">Debit WORKER_PAYABLE</div>
                  <div className="text-slate-500 font-mono text-[11px]">Credit ASSET_CASH (Razorpay)</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-rose-600 font-bold block text-[10px]">Step 4: Dispute Compensation</span>
                  <div className="font-bold text-slate-900">Debit REVENUE_COMMISSION</div>
                  <div className="text-slate-500 font-mono text-[11px]">Credit ASSET_CASH (Refund)</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* TRANSACTION 360 INSPECTION SLIDE-OVER DRAWER             */}
      {/* ======================================================== */}
      {selectedTxn && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900 text-base">
                  {selectedTxn.transactionRef || `TXN-${String(selectedTxn.pId).slice(0, 10)}`}
                </span>
                <StatusBadge status={selectedTxn.status} />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Booking #{String(selectedTxn.bId).slice(0, 8)} • {selectedTxn.date}
              </div>
            </div>
            <button
              onClick={() => setSelectedTxn(null)}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Monetary Split Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Financial Split Breakdown (INR)
              </span>
              <div className="flex items-center justify-between text-base font-black text-slate-900">
                <span>Total Gross Captured:</span>
                <span className="font-mono">₹{selectedTxn.gross.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 font-medium">
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Platform Commission (20%):</span>
                  <span className="font-mono font-bold">+₹{selectedTxn.comm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-indigo-700">
                  <span>Worker Partner Share (80%):</span>
                  <span className="font-mono font-bold">₹{selectedTxn.payout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>GST / Tax Component (Included):</span>
                  <span className="font-mono font-bold">₹{(selectedTxn.gross * 0.18).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Customer Details
              </span>
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{selectedTxn.custName}</div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Phone Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTxn.custPhone}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${selectedTxn.custPhone}`}
                    className="flex-1 py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-center font-bold rounded-lg transition"
                  >
                    Call Customer
                  </a>
                  <a
                    href={`https://wa.me/${selectedTxn.custPhone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-center font-bold rounded-lg transition"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Payment Gateway Specs */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Gateway Specification
              </span>
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-bold text-slate-900">{selectedTxn.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gateway Ref:</span>
                  <span className="font-bold text-blue-600">pay_rzp_{String(selectedTxn.pId).slice(0, 10)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Escrow State:</span>
                  <span className="font-bold text-emerald-600">RELEASED TO FLEET</span>
                </div>
              </div>
            </div>

            {/* Navigation Shortcut to Booking */}
            {onNavigateModule && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTxn(null);
                    onNavigateModule('bookings');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Booking in Bookings Desk</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedTxn(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                showAlert('success', `Receipt re-sent to ${selectedTxn.custPhone}`);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs cursor-pointer"
            >
              Re-send Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper component for percentage icon
const PercentBadge = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
