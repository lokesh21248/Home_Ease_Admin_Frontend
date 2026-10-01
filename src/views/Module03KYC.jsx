import React, { useState } from 'react';
import { 
  FileCheck, ShieldCheck, CheckCircle2, XCircle, Clock, Eye, Filter, 
  Search, AlertTriangle, FileText, Check, X, ShieldAlert, Award, Building2, User, Loader2
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { verifyWorkerKYC, blockWorker } from '../api/adminApi';

export const Module03KYC = ({ workers = [], setWorkers, onRefresh }) => {
  const [filterTab, setFilterTab] = useState('Pending'); // All | Pending | Approved | Blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState(null); // Worker KYC object for modal preview
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Derive KYC queue items from live workers
  const queue = workers.map(w => ({
    id: w.workerId || w.id,
    workerId: w.workerId || w.id,
    name: w.fullName || w.name || 'Service Partner',
    phone: w.phoneNumber || w.phone || '+91 0000000000',
    city: w.city || 'Telemetry Node',
    submissionDate: w.createdAt ? new Date(w.createdAt).toLocaleString() : 'Recent',
    status: w.isBlocked ? 'Blocked' : w.isVerified ? 'Approved' : 'Pending',
    kycDocumentUrl: w.kycDocumentUrl,
    profilePhotoUrl: w.profilePhotoUrl,
    currentLat: w.currentLat,
    currentLng: w.currentLng,
    rawWorker: w,
  }));

  const filteredQueue = queue.filter(item => {
    const matchesTab = filterTab === 'All' || item.status === filterTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.workerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.phone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleApprove = async (id) => {
    setIsProcessing(true);
    try {
      await verifyWorkerKYC(id);
      setWorkers(prev => prev.map(w => (w.workerId === id || w.id === id) ? { ...w, isVerified: true } : w));
      if (selectedAudit && (selectedAudit.id === id || selectedAudit.workerId === id)) {
        setSelectedAudit(prev => ({ ...prev, status: 'Approved' }));
      }
      setActionAlert({ type: 'success', text: 'Worker KYC successfully verified & approved on AWS Cloud server!' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to verify worker KYC:', err);
      setActionAlert({ type: 'error', text: `Failed to approve KYC: ${err.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const handleReject = async (id) => {
    setIsProcessing(true);
    try {
      await blockWorker(id, 24);
      setWorkers(prev => prev.map(w => (w.workerId === id || w.id === id) ? { ...w, isBlocked: true } : w));
      if (selectedAudit && (selectedAudit.id === id || selectedAudit.workerId === id)) {
        setSelectedAudit(prev => ({ ...prev, status: 'Blocked' }));
      }
      setActionAlert({ type: 'success', text: 'Worker compliance rejected & suspended for 24h.' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reject worker KYC:', err);
      setActionAlert({ type: 'error', text: `Failed to reject KYC: ${err.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Worker KYC & Compliance Verification</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Review worker identification documents, verify background compliance, and approve partner onboarding applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Review: {queue.filter(q => q.status === 'Pending').length}
          </div>
        </div>
      </div>

      {actionAlert && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          actionAlert.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <span>{actionAlert.text}</span>
          <button onClick={() => setActionAlert(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {['All', 'Pending', 'Approved', 'Blocked'].map(tab => {
            const count = queue.filter(k => tab === 'All' || k.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  filterTab === tab 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                  filterTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker by name, ID, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Worker Profile</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">KYC Document Attachment</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No KYC compliance records matching filter ({filterTab}).
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.profilePhotoUrl && !item.profilePhotoUrl.includes('unsplash') ? (
                          <img 
                            src={item.profilePhotoUrl} 
                            alt="" 
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.kyc-avatar-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="kyc-avatar-fallback w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 select-none"
                          style={{ display: (item.profilePhotoUrl && !item.profilePhotoUrl.includes('unsplash')) ? 'none' : 'flex' }}
                        >
                          {item.name?.charAt(0)?.toUpperCase() || 'W'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.id ? `UUID: ${item.id.slice(0, 14)}...` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.phone}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {item.submissionDate}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.kycDocumentUrl ? (
                        <a 
                          href={item.kycDocumentUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> View S3 Doc
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No S3 document</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'Approved' && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            title="Verify and Approve Worker"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {item.status !== 'Blocked' && (
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="Suspend Worker"
                          >
                            <X className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
