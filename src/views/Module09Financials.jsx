import React, { useState } from 'react';
import { 
  CreditCard, IndianRupee, ArrowUpRight, CheckCircle2, 
  AlertTriangle, RefreshCw, Filter, Search, Download, ShieldCheck, X, Loader2
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { updatePaymentStatus } from '../api/adminApi';

export const Module09Financials = ({ ledger = [], setLedger, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

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
      setAlertMsg({ type: 'success', text: `Payment transaction status updated to ${newStatus} on AWS!` });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update transaction status:', err);
      setAlertMsg({ type: 'error', text: `Failed to update status: ${err.message}` });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setAlertMsg(null), 4000);
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
          <h2 className="text-2xl font-black text-white tracking-tight">Payments & Financial Ledger</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Real-time transaction history, platform commission breakdown, escrow disbursements, and payment status management.
          </p>
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
          <Download className="w-4 h-4" /> Export Financial Report
        </button>
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
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Platform Earnings</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Worker Payout Amount</span>
          <div className="text-2xl font-black text-blue-600 mt-2 font-mono">₹{totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="text-[11px] text-slate-400 mt-1">Net partner disbursements</div>
        </div>
      </div>

      {/* Controls & Filter */}
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

      {/* Financial Ledger Table */}
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
                filteredLedger.map(item => {
                  const pId = item.paymentId || item.id;
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
  );
};
