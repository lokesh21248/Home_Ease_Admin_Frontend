import React, { useState } from 'react';
import { 
  FileCheck, ShieldCheck, CheckCircle2, XCircle, Clock, Eye, Filter, 
  Search, AlertTriangle, FileText, Check, X, ShieldAlert, Award, Building2, User, Loader2,
  ExternalLink, ZoomIn, Copy, CreditCard, FileBadge, ImageOff, Phone, Mail, MapPin
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { verifyWorkerKYC, blockWorker } from '../api/adminApi';

export const Module03KYC = ({ workers = [], setWorkers, onRefresh }) => {
  const [filterTab, setFilterTab] = useState('Pending'); // All | Pending | Approved | Blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState(null); // Worker KYC object for modal preview
  const [previewDoc, setPreviewDoc] = useState(null); // Lightbox zoom: { url, title, workerName }
  const [copiedField, setCopiedField] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Derive KYC queue items from live workers
  const queue = (workers && Array.isArray(workers))
    ? workers.map(w => {
        const id = w.workerId || w.id;
        const isVerified = w.isVerified ?? (w.kycStatus === 'VERIFIED');
        const isBlocked = w.isBlocked ?? (w.blockedUntil && new Date(w.blockedUntil) > new Date()) ?? false;
        const fullName = w.user?.fullName || w.fullName || w.name || '';
        const phone = w.user?.phoneNumber || w.phoneNumber || w.phone || '';
        const email = w.user?.email || w.email || '';
        const address = w.address || '';
        const panNumber = w.panNumber || '';
        const panDocUrl = w.panDocUrl || null;
        const aadhaarDocUrl = w.aadhaarDocUrl || w.kycDocumentUrl || null;
        const bankAccountNo = w.bankAccountNo || '';
        const bankIfsc = w.bankIfsc || '';
        const profilePhotoUrl = w.profilePhotoUrl || w.avatar || '';

        return {
          id,
          workerId: id,
          name: fullName || 'Partner Worker',
          fullName: fullName,
          phone: phone,
          phoneNumber: phone,
          email: email,
          address: address,
          city: w.city || '',
          submissionDate: w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          status: isBlocked ? 'Blocked' : isVerified ? 'Approved' : 'Pending',
          isVerified,
          isBlocked,
          kycDocumentUrl: aadhaarDocUrl,
          aadhaarDocUrl,
          panDocUrl,
          panNumber,
          bankAccountNo,
          bankIfsc,
          profilePhotoUrl,
          currentLat: w.currentLat,
          currentLng: w.currentLng,
          rawWorker: w,
        };
      })
    : [];

  const filteredQueue = queue.filter(item => {
    const matchesTab = filterTab === 'All' || item.status === filterTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.workerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.panNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleApprove = async (id) => {
    setIsProcessing(true);
    try {
      await verifyWorkerKYC(id);
      setWorkers(prev => prev.map(w => (w.workerId === id || w.id === id) ? { ...w, isVerified: true, kycStatus: 'VERIFIED' } : w));
      if (selectedAudit && (selectedAudit.id === id || selectedAudit.workerId === id)) {
        setSelectedAudit(prev => ({ ...prev, status: 'Approved', isVerified: true }));
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
        setSelectedAudit(prev => ({ ...prev, status: 'Blocked', isBlocked: true }));
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
            Review worker identification documents (Aadhaar & PAN cards), verify banking details, and approve partner onboarding applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Review: {queue.filter(q => q.status === 'Pending').length}
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Verified: {queue.filter(q => q.status === 'Approved').length}
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
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
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
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker name, phone, PAN, ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-600"
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
                <th className="py-3 px-4">Service Territory</th>
                <th className="py-3 px-4">Uploaded Documents</th>
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
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.kyc-avatar-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="kyc-avatar-fallback w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs"
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

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-mono text-slate-800">{item.phone}</div>
                      <div className="text-[11px] text-slate-400">{item.email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="text-slate-700 truncate" title={item.address}>{item.address}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.submissionDate}</div>
                    </td>

                    {/* Uploaded Documents Column (Aadhaar & PAN) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {/* Aadhaar Badge */}
                          {item.aadhaarDocUrl ? (
                            <button
                              onClick={() => setPreviewDoc({
                                url: item.aadhaarDocUrl,
                                title: 'Govt Aadhaar Card Document',
                                workerName: item.name
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
                              title="Click to preview Aadhaar scan"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>Aadhaar</span>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                              <FileText className="w-3 h-3 text-slate-300" />
                              <span>No Aadhaar</span>
                            </span>
                          )}

                          {/* PAN Badge */}
                          {item.panDocUrl ? (
                            <button
                              onClick={() => setPreviewDoc({
                                url: item.panDocUrl,
                                title: `Income Tax PAN Card (${item.panNumber})`,
                                workerName: item.name
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                              title="Click to preview PAN scan"
                            >
                              <CreditCard className="w-3 h-3 text-amber-600" />
                              <span>PAN</span>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                              <CreditCard className="w-3 h-3 text-slate-300" />
                              <span>No PAN</span>
                            </span>
                          )}
                        </div>

                        {item.panNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            PAN: <span className="font-bold text-slate-600">{item.panNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Review Dossier */}
                        <button
                          onClick={() => setSelectedAudit(item)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Inspect all documents & details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Dossier
                        </button>

                        {item.status !== 'Approved' && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Verify and Approve Worker"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {item.status !== 'Blocked' && (
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={isProcessing}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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

      {/* ========================================================================= */}
      {/* MODAL: Full KYC Dossier Inspection                                        */}
      {/* ========================================================================= */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Partner KYC Dossier Inspection</h3>
                  <StatusBadge status={selectedAudit.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAudit.name} • {selectedAudit.phone || 'No phone'} • {selectedAudit.address || 'No address registered'}
                </p>
              </div>
              <button onClick={() => setSelectedAudit(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Aadhaar Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Govt Aadhaar Card Scan</span>
                  </div>
                  {selectedAudit.aadhaarDocUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Missing
                    </span>
                  )}
                </div>

                <div 
                  onClick={() => selectedAudit.aadhaarDocUrl && setPreviewDoc({
                    url: selectedAudit.aadhaarDocUrl,
                    title: 'Govt Aadhaar Card Document',
                    workerName: selectedAudit.name
                  })}
                  className="relative group h-40 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
                >
                  {selectedAudit.aadhaarDocUrl ? (
                    <>
                      <img 
                        src={selectedAudit.aadhaarDocUrl} 
                        alt="Aadhaar Scan" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentElement.querySelector('.aadhaar-fb');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      <div className="aadhaar-fb hidden flex-col items-center justify-center p-3 text-center">
                        <FileText className="w-8 h-8 text-blue-500 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Aadhaar Card Attached</span>
                        <span className="text-[10px] text-slate-400">Stored in Supabase S3</span>
                      </div>
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-slate-400">No Aadhaar Document</span>
                    </div>
                  )}
                </div>

                {selectedAudit.aadhaarDocUrl && (
                  <div className="text-right">
                    <a
                      href={selectedAudit.aadhaarDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Direct S3 File
                    </a>
                  </div>
                )}
              </div>

              {/* 2. PAN Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      <span>Income Tax PAN Card</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">PAN: {selectedAudit.panNumber}</div>
                  </div>
                  {selectedAudit.panDocUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Uploaded
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Missing
                    </span>
                  )}
                </div>

                <div 
                  onClick={() => selectedAudit.panDocUrl && setPreviewDoc({
                    url: selectedAudit.panDocUrl,
                    title: `Income Tax PAN Card (${selectedAudit.panNumber})`,
                    workerName: selectedAudit.name
                  })}
                  className="relative group h-40 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition"
                >
                  {selectedAudit.panDocUrl ? (
                    <>
                      <img 
                        src={selectedAudit.panDocUrl} 
                        alt="PAN Scan" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentElement.querySelector('.pan-fb');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      <div className="pan-fb hidden flex-col items-center justify-center p-3 text-center">
                        <CreditCard className="w-8 h-8 text-amber-500 mb-1" />
                        <span className="text-xs font-bold text-slate-700">PAN Card Attached</span>
                        <span className="text-[10px] text-slate-400">PAN: {selectedAudit.panNumber}</span>
                      </div>
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-white text-slate-800 rounded-md text-[11px] font-bold shadow-md flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-slate-400">No PAN Document</span>
                    </div>
                  )}
                </div>

                {selectedAudit.panDocUrl && (
                  <div className="text-right">
                    <a
                      href={selectedAudit.panDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Direct S3 File
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Payout & Banking Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">PAN Number</div>
                <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedAudit.panNumber || 'Not provided'}</span>
                  {selectedAudit.panNumber && (
                    <button onClick={() => copyToClipboard(selectedAudit.panNumber, 'pan')} className="text-slate-400 hover:text-slate-600">
                      {copiedField === 'pan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Account</div>
                <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedAudit.bankAccountNo || 'Not provided'}</span>
                  {selectedAudit.bankAccountNo && (
                    <button onClick={() => copyToClipboard(selectedAudit.bankAccountNo, 'bank')} className="text-slate-400 hover:text-slate-600">
                      {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">IFSC Code</div>
                <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedAudit.bankIfsc || 'Not provided'}</span>
                  {selectedAudit.bankIfsc && (
                    <button onClick={() => copyToClipboard(selectedAudit.bankIfsc, 'ifsc')} className="text-slate-400 hover:text-slate-600">
                      {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedAudit.status !== 'Blocked' && (
                <button
                  onClick={() => handleReject(selectedAudit.id)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Suspend Access</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {selectedAudit.status !== 'Approved' && (
                  <button
                    onClick={() => handleApprove(selectedAudit.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Approve Emerald KYC</span>
                  </button>
                )}
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
                  <FileBadge className="w-4 h-4 text-blue-600" />
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
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition"
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
                  const fb = e.target.parentElement.querySelector('.lightbox-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div className="lightbox-fallback hidden flex-col items-center justify-center p-8 text-center max-w-md">
                <FileText className="w-16 h-16 text-blue-500 mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Supabase S3 Document Scan</h4>
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
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
                  >
                    Open Document Link
                  </a>
                </div>
              </div>
            </div>

            {/* Lightbox Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100 text-xs">
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
    </div>
  );
};
