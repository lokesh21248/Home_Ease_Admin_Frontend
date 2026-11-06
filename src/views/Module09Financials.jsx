import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, X, AlertCircle, CheckCircle2,
  RefreshCw, ShieldAlert, ArrowRight, UserCheck, Layers, FileText, Check, DollarSign
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  updatePaymentStatus,
  getPendingPayouts,
  settleBatchPayout,
  getOpsDisputes,
  resolveOpsDispute
} from '../api/adminApi';

export const Module09Financials = ({ ledger = [], setLedger, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'payouts' | 'disputes'
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Phase 5/6 Payouts & Disputes state
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [isSettling, setIsSettling] = useState(false);

  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeResolutionForm, setDisputeResolutionForm] = useState({
    action: 'REFUND_CUSTOMER',
    refundAmount: '',
    workerPenaltyAmount: '',
    reason: ''
  });
  const [isResolving, setIsResolving] = useState(false);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

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

  const handleSettleBatch = async () => {
    if (selectedWorkers.length === 0) {
      showAlert('error', 'Select at least one partner for batch settlement.');
      return;
    }
    setIsSettling(true);
    try {
      const res = await settleBatchPayout(selectedWorkers);
      showAlert('success', `Batch payout executed: ${res?.batchReference || 'Settled'} for ₹${res?.totalAmount || '0.00'}`);
      loadPayouts();
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Batch settlement failed: ${err.message}`);
    } finally {
      setIsSettling(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      await resolveOpsDispute(selectedDispute.id || selectedDispute.disputeId, {
        status: disputeResolutionForm.action === 'REJECT' ? 'REJECTED' : 'RESOLVED',
        refundAmount: Number(disputeResolutionForm.refundAmount) || 0,
        workerPenaltyAmount: Number(disputeResolutionForm.workerPenaltyAmount) || 0,
        resolutionNotes: disputeResolutionForm.reason || 'Resolved via Admin Console'
      });
      showAlert('success', `Dispute on booking ${selectedDispute.bookingId} resolved with ledger journal postings!`);
      setSelectedDispute(null);
      loadDisputes();
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Failed to resolve dispute: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredLedger = ledger.filter(item => {
    const status = item.status || 'PENDING';
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const ref = (item.transactionRef || item.jobRef || item.paymentId || item.id || '').toLowerCase();
    const cust = (item.customerName || item.customer || '').toLowerCase();
    const phone = (item.customerPhone || '').toLowerCase();
    const matchesSearch = ref.includes(searchQuery.toLowerCase()) || 
                          cust.includes(searchQuery.toLowerCase()) ||
                          phone.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (paymentId, newStatus) => {
    setIsUpdating(true);
    try {
      await updatePaymentStatus(paymentId, newStatus);
      setLedger(prev => prev.map(item => (item.paymentId === paymentId || item.id === paymentId) 
        ? { ...item, status: newStatus } 
        : item
      ));
      showAlert('success', `Payment transaction status updated to ${newStatus} on AWS!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showAlert('error', `Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const totalGross = ledger.reduce((acc, curr) => acc + (curr.grossAmount || 0), 0);
  const totalCommission = ledger.reduce((acc, curr) => acc + (curr.platformCommissionAmount || curr.commission || 0), 0);
  const totalPayouts = ledger.reduce((acc, curr) => acc + (curr.workerPayoutAmount || curr.workerPayout || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Payments & Double-Entry Ledger</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Double-entry ledger balances, automated 80/20 escrow settlement, idempotent Razorpay Route partner payouts, and customer disputes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'payouts' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Partner Payouts
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'disputes' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Disputes
            </button>
          </div>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ledger, null, 2));
              const dl = document.createElement('a');
              dl.setAttribute("href", dataStr);
              dl.setAttribute("download", "financial_ledger_statement.json");
              dl.click();
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          alertMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Summary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Processed Gross (GMV)</span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sum of customer transactions</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Platform Commission</span>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Platform Earnings (20%)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Worker Payout Amount</span>
          <div className="text-2xl font-black text-blue-600 mt-2 font-mono">₹{totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-1">Net partner disbursements (80%)</div>
        </div>
      </div>

      {/* VIEW 1: TRANSACTIONS & ESCROW */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto w-full sm:w-auto">
              {['All', 'CAPTURED', 'PENDING', 'AUTHORIZED', 'FAILED', 'REFUNDED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search txn ref, customer, phone..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Txn ID & Date</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer & Phone</th>
                    <th className="py-3 px-4">Gross Vol.</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Worker Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Status Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No transactions found matching filter ({statusFilter}). Live payments executed by customers will log here automatically.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item, idx) => {
                      const pId = item.paymentId || item.id || `p-${idx}`;
                      const bId = item.bookingId || item.jobRef || 'Booking';
                      const custName = item.customerName || item.customer || 'Customer';
                      const custPhone = item.customerPhone || 'N/A';
                      const gross = item.grossAmount || 0;
                      const comm = item.platformCommissionAmount || item.commission || 0;
                      const payout = item.workerPayoutAmount || item.workerPayout || 0;
                      const status = item.status || 'PENDING';
                      const date = item.createdAt ? new Date(item.createdAt).toLocaleString() : (item.date || 'Recent');

                      return (
                        <tr key={pId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900">{item.transactionRef || (pId ? pId.slice(0, 14) : '')}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{date}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-blue-600 font-bold truncate max-w-[120px]">
                            {bId}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{custName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{custPhone}</div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{Number(gross).toFixed(2)}</td>

                          <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">₹{Number(comm).toFixed(2)}</td>

                          <td className="py-3.5 px-4 font-mono text-blue-700 font-bold">₹{Number(payout).toFixed(2)}</td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={status} />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={status}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(pId, e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition"
                              title="Override transaction status on AWS"
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
        </div>
      )}

      {/* VIEW 2: PARTNER PAYOUT BATCHES */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Partner Payout Balances (Double-Entry Escrow)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Balances owed under <code className="text-blue-600 bg-blue-50 px-1 rounded">LIABILITY_WORKER_PAYABLE</code>. Select partners to execute batch transfer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadPayouts}
                disabled={loadingPayouts}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPayouts ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={handleSettleBatch}
                disabled={isSettling || selectedWorkers.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> {isSettling ? 'Settling...' : `Execute Batch Settlement (${selectedWorkers.length})`}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={pendingPayouts.length > 0 && selectedWorkers.length === pendingPayouts.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedWorkers(pendingPayouts.map(p => p.workerId));
                        else setSelectedWorkers([]);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
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
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loadingPayouts ? 'Loading partner balances...' : 'No pending payouts in queue. All partner accounts are settled.'}
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
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{w.workerName || w.name || 'Partner'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.workerId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">{w.phone || w.accountNumber || 'UPI / Bank'}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold text-sm">
                          ₹{Number(w.pendingBalance || w.balance || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          ₹{Number(w.settledTotal || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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

      {/* VIEW 3: DISPUTES & ESCALATIONS */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Disputes & Compensating Reversals</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Resolving disputes posts double-entry reversing entries (<code className="text-rose-600 bg-rose-50 px-1 rounded">REVENUE_PLATFORM_FEE</code> $\to$ <code className="text-slate-600 bg-slate-50 px-1 rounded">ASSET_CASH</code>).
              </p>
            </div>
            <button
              onClick={loadDisputes}
              disabled={loadingDisputes}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDisputes ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Dispute ID & Date</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Dispute Reason</th>
                  <th className="py-3 px-4">Claimed Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {loadingDisputes ? 'Loading disputes...' : 'No active disputes logged.'}
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id || d.disputeId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900">{d.id ? d.id.slice(0, 10) : 'DSP'}</div>
                        <div className="text-[10px] text-slate-400">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-600 font-bold truncate max-w-[120px]">{d.bookingId}</td>
                      <td className="py-3.5 px-4 text-slate-800">{d.reason || d.description || 'Service quality issue'}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-600 font-bold">₹{Number(d.claimedAmount || d.disputedAmount || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          d.status === 'REJECTED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {d.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setDisputeResolutionForm({
                                action: 'REFUND_CUSTOMER',
                                refundAmount: String(d.claimedAmount || d.disputedAmount || ''),
                                workerPenaltyAmount: '0',
                                reason: ''
                              });
                            }}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition"
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
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Resolve Dispute on Booking</h3>
                  <button onClick={() => setSelectedDispute(null)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl space-y-1">
                  <div><strong>Booking Ref:</strong> <span className="font-mono">{selectedDispute.bookingId}</span></div>
                  <div><strong>Customer Reason:</strong> {selectedDispute.reason || 'Service complaint'}</div>
                </div>

                <form onSubmit={handleResolveDispute} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Resolution Action</label>
                    <select
                      value={disputeResolutionForm.action}
                      onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, action: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="REFUND_CUSTOMER">Refund Customer & Deduct Platform Fee</option>
                      <option value="COMPENSATE_PARTNER">Compensate Partner from Reserve</option>
                      <option value="REJECT">Reject Dispute Claim</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Customer Refund Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={disputeResolutionForm.refundAmount}
                      onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, refundAmount: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Resolution Audit Notes</label>
                    <textarea
                      rows={2}
                      value={disputeResolutionForm.reason}
                      onChange={(e) => setDisputeResolutionForm({ ...disputeResolutionForm, reason: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      placeholder="Reasoning for ledger audit log..."
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDispute(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResolving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
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
    </div>
  );
};
