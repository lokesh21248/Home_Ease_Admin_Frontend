import React, { useState, useMemo } from 'react';
import { 
  Key, ShieldCheck, RefreshCw, Lock, ShieldAlert, Users, 
  CheckCircle2, AlertTriangle, Trash2, Copy, Check, Plus, 
  Search, X, Sliders, Globe, Server, Clock, Shield, 
  FileText, CheckCircle, Eye, EyeOff, ExternalLink, Zap, 
  Award, Smartphone, AlertCircle, Download
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ADMIN_ROLES } from '../constants/system';

// Initial Curated API Keys
const DEFAULT_API_KEYS = [
  {
    id: 'key-hyd-01',
    name: 'Mobile App Firebase Gateway',
    prefix: 'he_live_9f81a7b...',
    fullToken: 'he_live_9f81a7b449102847291048201',
    environment: 'Production Live',
    scope: 'Read/Write',
    created: '2026-01-15',
    lastUsed: 'Just Now',
    status: 'ACTIVE'
  },
  {
    id: 'key-hyd-02',
    name: 'Razorpay Payment & Webhook Settle',
    prefix: 'he_live_4b72c9d...',
    fullToken: 'he_live_4b72c9d182947201948201948',
    environment: 'Production Live',
    scope: 'Financial Ops',
    created: '2026-02-01',
    lastUsed: '8 mins ago',
    status: 'ACTIVE'
  },
  {
    id: 'key-hyd-03',
    name: 'Partner Telemetry & Live GPS Stream',
    prefix: 'he_live_1d99e3a...',
    fullToken: 'he_live_1d99e3a849201948201948201',
    environment: 'Production Live',
    scope: 'Read/Write',
    created: '2026-03-10',
    lastUsed: '1 min ago',
    status: 'ACTIVE'
  },
  {
    id: 'key-hyd-04',
    name: 'Analytics BI Warehouse Extractor',
    prefix: 'he_test_3a81f5c...',
    fullToken: 'he_test_3a81f5c839201948201948201',
    environment: 'Sandbox Testing',
    scope: 'Read Only',
    created: '2026-04-05',
    lastUsed: '2 hours ago',
    status: 'ACTIVE'
  }
];

// Initial Curated Security Audit Logs
const DEFAULT_SECURITY_LOGS = [
  {
    id: 'log-01',
    timestamp: '2026-11-09 10:45:12',
    event: 'SUPER_ADMIN_SESSION_START',
    operator: 'Super Admin (Admin #0001)',
    ip: '103.112.45.12 (Hyderabad, IN)',
    status: 'Active',
    severity: 'LOW',
    details: 'Authenticated via 2FA Google Authenticator token.'
  },
  {
    id: 'log-02',
    timestamp: '2026-11-09 10:12:30',
    event: 'DISPUTE_ARBITRATION_COMMITTED',
    operator: 'Ops Lead (Admin #0002)',
    ip: '103.112.45.18 (Gachibowli, IN)',
    status: 'Success',
    severity: 'MEDIUM',
    details: 'Dispute #disp-hyd-8803 resolved with ₹100 customer wallet credit.'
  },
  {
    id: 'log-03',
    timestamp: '2026-11-09 09:30:15',
    event: 'ZONE_DISPATCH_RADIUS_MODIFIED',
    operator: 'Super Admin (Admin #0001)',
    ip: '103.112.45.12 (Hyderabad, IN)',
    status: 'Audited',
    severity: 'MEDIUM',
    details: 'Zone 500081 (Hitec City) wave search radius expanded to 5.0km.'
  },
  {
    id: 'log-04',
    timestamp: '2026-11-08 18:22:40',
    event: 'BATCH_PAYOUT_EXECUTED',
    operator: 'Finance Manager (Admin #0004)',
    ip: '103.112.45.24 (Banjara Hills, IN)',
    status: 'Success',
    severity: 'HIGH',
    details: 'Multi-partner payout of ₹38,400 committed to Razorpay gateway.'
  },
  {
    id: 'log-05',
    timestamp: '2026-11-08 14:15:00',
    event: 'API_KEY_ROTATED',
    operator: 'Super Admin (Admin #0001)',
    ip: '103.112.45.12 (Hyderabad, IN)',
    status: 'Audited',
    severity: 'HIGH',
    details: 'Rotated secret token for Mobile App Firebase Gateway.'
  }
];

// RBAC Privilege Grid Specifications
const RBAC_MODULE_PERMISSIONS = [
  { module: 'Live Operations & Google Maps', superAdmin: 'Full Access', opsManager: 'Full Access', kycLead: 'Read Only', catalogManager: 'No Access' },
  { module: 'Booking Lifecycle Management', superAdmin: 'Full Access', opsManager: 'Full Access', kycLead: 'Read Only', catalogManager: 'Read Only' },
  { module: 'Worker Partner KYC & Governance', superAdmin: 'Full Access', opsManager: 'View & Flag', kycLead: 'Full Access', catalogManager: 'No Access' },
  { module: 'Customer Governance & Profiles', superAdmin: 'Full Access', opsManager: 'Read Only', kycLead: 'View & Verify', catalogManager: 'Marketing View' },
  { module: 'Services & Dynamic Catalog', superAdmin: 'Full Access', opsManager: 'Read Only', kycLead: 'No Access', catalogManager: 'Full Access' },
  { module: 'Service Areas & Geo-Fencing', superAdmin: 'Full Access', opsManager: 'Manage Radii', kycLead: 'No Access', catalogManager: 'No Access' },
  { module: 'Dispatch Management & Wave Radii', superAdmin: 'Full Access', opsManager: 'Full Access', kycLead: 'No Access', catalogManager: 'No Access' },
  { module: 'Schedule & Slots Capacity', superAdmin: 'Full Access', opsManager: 'Full Access', kycLead: 'No Access', catalogManager: 'Read Only' },
  { module: 'Payments & Financial Ledger', superAdmin: 'Full Access', opsManager: 'Escrow View', kycLead: 'No Access', catalogManager: 'No Access' },
  { module: 'Offers, Coupons & Banners', superAdmin: 'Full Access', opsManager: 'Read Only', kycLead: 'No Access', catalogManager: 'Full Access' },
  { module: 'Support Grievances & Disputes', superAdmin: 'Full Access', opsManager: 'Arbitrate', kycLead: 'Safety Audit', catalogManager: 'No Access' },
  { module: 'Push Notifications & Broadcasts', superAdmin: 'Full Access', opsManager: 'Operational Pushes', kycLead: 'Compliance Alerts', catalogManager: 'Marketing Pushes' },
  { module: 'Executive Reports & Analytics', superAdmin: 'Full Access', opsManager: 'Fulfillment Metrics', kycLead: 'Safety Audits', catalogManager: 'Demand Trends' },
  { module: 'System Settings, API Keys & RBAC', superAdmin: 'Full Access', opsManager: 'No Access', kycLead: 'No Access', catalogManager: 'No Access' }
];

export const Module13Settings = ({ 
  securitySettings = {}, 
  setSecuritySettings, 
  onRefresh, 
  onNavigateModule 
}) => {
  // Navigation Tabs: 'keys' | 'rbac' | 'policies' | 'logs'
  const [activeTab, setActiveTab] = useState('keys');

  // API Key State with local storage fallback
  const apiKeys = useMemo(() => {
    if (Array.isArray(securitySettings?.apiKeys) && securitySettings.apiKeys.length > 0) {
      return securitySettings.apiKeys;
    }
    return DEFAULT_API_KEYS;
  }, [securitySettings?.apiKeys]);

  // Security Logs State with local storage fallback
  const securityLogs = useMemo(() => {
    if (Array.isArray(securitySettings?.securityLogs) && securitySettings.securityLogs.length > 0) {
      return securitySettings.securityLogs;
    }
    return DEFAULT_SECURITY_LOGS;
  }, [securitySettings?.securityLogs]);

  // UI States
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState('Read/Write');
  const [keyEnv, setKeyEnv] = useState('Production Live');
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  // Security Policies State
  const [jwtExpiration, setJwtExpiration] = useState(securitySettings.jwtExpiration || '8 Hours');
  const [twoFactorMandatory, setTwoFactorMandatory] = useState(
    securitySettings.twoFactorMandatory !== undefined ? securitySettings.twoFactorMandatory : true
  );
  const [maxFailedLogins, setMaxFailedLogins] = useState(securitySettings.maxFailedLogins || 5);
  const [ipWhitelist, setIpWhitelist] = useState(securitySettings.ipWhitelist || '103.112.45.0/24 (Hyderabad HQ)');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  // Logs Search & Filter
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSeverityFilter, setLogSeverityFilter] = useState('ALL');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return securityLogs.filter(l => {
      const q = logSearchQuery.toLowerCase().trim();
      const matchText = (l.event || '').toLowerCase().includes(q) ||
        (l.operator || '').toLowerCase().includes(q) ||
        (l.ip || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q);

      const matchSeverity = logSeverityFilter === 'ALL' || l.severity === logSeverityFilter;
      return matchText && matchSeverity;
    });
  }, [securityLogs, logSearchQuery, logSeverityFilter]);

  // Rotate Key
  const handleRotateKey = (id) => {
    const updated = apiKeys.map(k => {
      if (k.id === id) {
        const rand = Math.random().toString(36).substring(2, 9);
        return {
          ...k,
          prefix: `he_live_${rand}...`,
          fullToken: `he_live_${rand}${Date.now()}`,
          lastUsed: 'Rotated Just Now'
        };
      }
      return k;
    });

    if (setSecuritySettings) {
      setSecuritySettings(prev => ({
        ...prev,
        apiKeys: updated
      }));
    }

    setAlertMsg({ type: 'success', text: 'API Key rotated successfully! Previous token immediately invalidated.' });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Copy Key Token
  const handleCopyKey = (keyItem) => {
    navigator.clipboard?.writeText(keyItem.fullToken || keyItem.prefix);
    setCopiedKeyId(keyItem.id);
    setAlertMsg({ type: 'success', text: `Token for "${keyItem.name}" copied to clipboard.` });
    setTimeout(() => {
      setCopiedKeyId(null);
      setAlertMsg(null);
    }, 2500);
  };

  // Delete Key
  const handleDeleteKey = (id) => {
    if (!window.confirm('Revoke and permanently delete this API key? Services using this token will fail immediately.')) {
      return;
    }
    const updated = apiKeys.filter(k => k.id !== id);
    if (setSecuritySettings) {
      setSecuritySettings(prev => ({
        ...prev,
        apiKeys: updated
      }));
    }
    setAlertMsg({ type: 'success', text: 'API Key revoked and deleted.' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Generate New Key
  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const rand = Math.random().toString(36).substring(2, 9);
    const isTest = keyEnv.includes('Sandbox');
    const prefixStr = isTest ? `he_test_${rand}...` : `he_live_${rand}...`;
    const fullTokenStr = isTest ? `he_test_${rand}${Date.now()}` : `he_live_${rand}${Date.now()}`;

    const newKey = {
      id: `key-hyd-${Date.now()}`,
      name: keyName.trim(),
      prefix: prefixStr,
      fullToken: fullTokenStr,
      environment: keyEnv,
      scope: keyScope,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
      status: 'ACTIVE'
    };

    const updated = [newKey, ...apiKeys];
    if (setSecuritySettings) {
      setSecuritySettings(prev => ({
        ...prev,
        apiKeys: updated
      }));
    }

    setShowNewKeyModal(false);
    setKeyName('');
    setAlertMsg({ type: 'success', text: `New API Key "${newKey.name}" generated with scope ${keyScope}!` });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Save Security Policies
  const handleSavePolicies = (e) => {
    e.preventDefault();
    setIsSavingPolicies(true);

    if (setSecuritySettings) {
      setSecuritySettings(prev => ({
        ...prev,
        jwtExpiration,
        twoFactorMandatory,
        maxFailedLogins: Number(maxFailedLogins),
        ipWhitelist
      }));
    }

    setTimeout(() => {
      setIsSavingPolicies(false);
      setAlertMsg({ type: 'success', text: 'Corporate security policies updated and synced to authentication microservice!' });
      setTimeout(() => setAlertMsg(null), 4000);
    }, 600);
  };

  // Export Audit Logs
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `security_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#1D68F2] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/30 text-blue-200 text-[11px] font-bold tracking-wider uppercase border border-blue-400/30">
              Enterprise Governance & Security
            </span>
            <span className="text-xs text-blue-200/80">RBAC & Cryptographic Access</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400" /> Admin Settings & Security Governance
          </h2>
          <p className="text-blue-100/80 text-xs mt-1 max-w-2xl">
            Manage administrative API gateway tokens, role-based access matrix, authentication timeout policies, and immutable security audit logs for the Hyderabad metro operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="px-4 py-2 bg-white text-[#1D68F2] hover:bg-blue-50 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Key className="w-4 h-4 text-[#1D68F2]" /> Generate New API Key
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {alertMsg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in ${
          alertMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Real-Time Security KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Admin Roles Active</span>
            <Users className="w-4 h-4 text-[#1D68F2]" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {ADMIN_ROLES.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3" /> RBAC Matrix Active
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active API Keys</span>
            <Key className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600">
            {apiKeys.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Scoped service tokens
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>2FA Enforcement</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {twoFactorMandatory ? 'Enforced' : 'Optional'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Google Authenticator / SMS
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>JWT Expiry Window</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {jwtExpiration}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Session timeout policy
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Audit Events</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {securityLogs.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Immutable session trail
          </div>
        </div>
      </div>

      {/* 3. Operational Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'keys'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4" /> API Keys & Webhook Gateway ({apiKeys.length})
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> RBAC Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" /> Security & Auth Policies
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" /> Security Audit Logs ({filteredLogs.length})
        </button>
      </div>

      {/* TAB 1: API KEYS & WEBHOOK GATEWAY */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Cryptographic Service API Keys</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine-to-machine authentication tokens for Firebase, Razorpay, Partner telemetry, and BI extractors.
              </p>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-3.5 py-1.5 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Generate Token
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Key Identifier</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Secret Token Token</th>
                    <th className="py-3 px-4">Permission Scope</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{key.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Created: {key.created}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          key.environment.includes('Live')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {key.environment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1D68F2]">{key.prefix}</span>
                          <button
                            onClick={() => handleCopyKey(key)}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            title="Copy secret token"
                          >
                            {copiedKeyId === key.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                          {key.scope}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {key.lastUsed}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRotateKey(key.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-amber-200"
                            title="Rotate secret key"
                          >
                            <RefreshCw className="w-3 h-3" /> Rotate
                          </button>
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Revoke key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PERMISSION MATRIX */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Role Cards Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADMIN_ROLES.map((role) => (
              <div key={role.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${role.badgeClass || 'bg-blue-50 text-blue-700'}`}>
                    Active Profile
                  </span>
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="text-xs font-black text-slate-900 leading-snug">{role.name}</h4>
                <p className="text-[11px] text-slate-500">
                  {role.id === 'super_admin' ? 'Root level authorization across all financial and operational sub-modules.' :
                   role.id === 'ops_manager' ? 'Supervises live dispatches, wave radii, booking lifecycles, and customer disputes.' :
                   role.id === 'kyc_lead' ? 'Verifies partner identity documents, background checks, and disciplinary suspensions.' :
                   'Manages service catalog, price structures, coupons, and promotional banners.'}
                </p>
              </div>
            ))}
          </div>

          {/* Granular Permission Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Module Privilege Authorization Matrix</h3>
                <p className="text-xs text-slate-400 mt-0.5">Enforced at the Spring Boot Security Gateway layer via JWT claims</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">14 Protected Modules</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">System Operational Module</th>
                    <th className="py-3 px-4">Super Admin</th>
                    <th className="py-3 px-4">Ops Manager</th>
                    <th className="py-3 px-4">Trust & Safety Lead</th>
                    <th className="py-3 px-4">Catalog Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {RBAC_MODULE_PERMISSIONS.map((perm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {perm.module}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          {perm.superAdmin}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          perm.opsManager === 'Full Access' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          perm.opsManager === 'No Access' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {perm.opsManager}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          perm.kycLead === 'Full Access' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          perm.kycLead === 'No Access' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {perm.kycLead}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          perm.catalogManager === 'Full Access' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          perm.catalogManager === 'No Access' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {perm.catalogManager}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & AUTHENTICATION POLICIES */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Administrative Security & Authentication Policies</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enforce identity verification rules and lockout thresholds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* JWT Expiration */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Admin Session JWT Expiry</label>
              <select
                value={jwtExpiration}
                onChange={(e) => setJwtExpiration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
              >
                <option value="4 Hours">4 Hours (High Security Strict)</option>
                <option value="8 Hours">8 Hours (Standard Corporate Workday)</option>
                <option value="24 Hours">24 Hours (Extended Operations Shift)</option>
              </select>
              <p className="text-[11px] text-slate-400">Forces admin re-authentication upon session expiration.</p>
            </div>

            {/* Max Failed Logins */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Max Failed Login Attempts Before Lockout</label>
              <select
                value={maxFailedLogins}
                onChange={(e) => setMaxFailedLogins(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
              >
                <option value={3}>3 Attempts (Strict Zero-Trust)</option>
                <option value={5}>5 Attempts (Recommended Standard)</option>
                <option value={10}>10 Attempts (Relaxed)</option>
              </select>
              <p className="text-[11px] text-slate-400">Account locks for 30 mins after consecutive failed attempts.</p>
            </div>

            {/* IP Whitelist */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block font-bold text-slate-800">Corporate Subnet IP Whitelist (CIDR / Comma-separated)</label>
              <input 
                type="text"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="e.g. 103.112.45.0/24, 182.74.88.10"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
              />
              <p className="text-[11px] text-slate-400">Restricts admin dashboard accessibility to trusted office VPN subnets.</p>
            </div>

            {/* 2FA Enforcement Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">Mandatory Two-Factor Authentication (2FA)</div>
                <div className="text-[11px] text-slate-500">Require TOTP code (Google Authenticator) for all admin roles</div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorMandatory(!twoFactorMandatory)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  twoFactorMandatory ? 'bg-[#1D68F2]' : 'bg-slate-300'
                }`}
              >
                <span 
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    twoFactorMandatory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Maintenance Mode Emergency Switch */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Platform Maintenance Mode
                </div>
                <div className="text-[11px] text-rose-600/80">Temporarily pauses new customer checkout across Hyderabad</div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'
                }`}
              >
                <span 
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingPolicies}
              className="px-6 py-2.5 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
            >
              {isSavingPolicies ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isSavingPolicies ? 'Syncing...' : 'Save Security Policies'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Search event, operator, IP, or details..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#1D68F2] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <button
                onClick={handleExportLogs}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Signature</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Origin IP</th>
                    <th className="py-3 px-4">Severity / Status</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400">
                        No audit events match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1D68F2]">
                          {log.event}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {log.operator}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                          {log.ip}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.severity === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            log.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {log.severity} • {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Generate New API Key */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleGenerateKey} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Cryptographic API Key</h3>
                <p className="text-xs text-slate-400">Scoped token for microservice integration</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNewKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Description Name *</label>
                <input 
                  type="text" 
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Hyderabad Dispatch Kafka Gateway"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-[#1D68F2] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Environment</label>
                <select 
                  value={keyEnv}
                  onChange={(e) => setKeyEnv(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                >
                  <option value="Production Live">Production Live (Live Gateway)</option>
                  <option value="Sandbox Testing">Sandbox Testing (Mock Gateway)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Permission Scope</label>
                <select 
                  value={keyScope}
                  onChange={(e) => setKeyScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                >
                  <option value="Read/Write">Read/Write Access</option>
                  <option value="Read Only">Read Only (Telemetry/Queries)</option>
                  <option value="Financial Ops">Financial Ops (Ledger & Payouts)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowNewKeyModal(false)} 
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Generate Key Token</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
