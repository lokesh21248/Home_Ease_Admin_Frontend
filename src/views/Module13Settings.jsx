import React, { useState } from 'react';
import { 
  Settings, Key, ShieldCheck, RefreshCw, Lock, Eye, 
  EyeOff, CheckCircle2, AlertTriangle, UserCheck, ShieldAlert, Cpu
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { ADMIN_ROLES } from '../constants/system';

export const Module13Settings = ({ securitySettings, setSecuritySettings }) => {
  const [activeTab, setActiveTab] = useState('keys'); // keys | rbac | logs
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState('Read/Write');

  const rotateApiKey = (id) => {
    setSecuritySettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(k => k.id === id ? {
        ...k,
        prefix: `he_live_${Math.random().toString(36).substring(2, 7)}...`,
        lastUsed: 'Rotated Just Now'
      } : k)
    }));
  };

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const newKey = {
      id: `key-${Date.now()}`,
      name: keyName,
      prefix: `he_live_${Math.random().toString(36).substring(2, 7)}...`,
      created: '2026-09-21',
      scope: keyScope,
      lastUsed: 'Never'
    };

    setSecuritySettings(prev => ({
      ...prev,
      apiKeys: [...prev.apiKeys, newKey]
    }));

    setShowNewKeyModal(false);
    setKeyName('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">System Settings & Security Access</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            API key management, authentication policies, role-based access control, and administrative security audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'keys' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            API Key Management
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'rbac' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            RBAC Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Security Audit Logs
          </button>
        </div>

        {activeTab === 'keys' && (
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" /> Generate New API Key
          </button>
        )}
      </div>

      {/* Tab 1: API Keys */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Key Identifier</th>
                <th className="py-3 px-4">Key Prefix Token</th>
                <th className="py-3 px-4">Permission Scope</th>
                <th className="py-3 px-4">Last Telemetry Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {(!securitySettings.apiKeys || securitySettings.apiKeys.length === 0) ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-600">No active API keys generated</div>
                    <div className="text-xs text-slate-400 mt-0.5">Click &quot;Generate New API Key&quot; above to create a service token.</div>
                  </td>
                </tr>
              ) : securitySettings.apiKeys.map(k => (
                <tr key={k.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{k.name}</td>
                  <td className="py-3.5 px-4 font-mono text-blue-600 font-bold">{k.prefix}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-bold">
                      {k.scope}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{k.lastUsed}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => rotateApiKey(k.id)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 1-Click Rotate Key
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Privileges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADMIN_ROLES.map(role => (
              <div key={role.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{role.name}</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">FULL PERMISSIONS</span>
                </div>
                <p className="text-[11px] text-slate-500">Authorized to perform administrative overrides and module operations.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {(!securitySettings.securityLogs || securitySettings.securityLogs.length === 0) ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-600">No security audit logs recorded</div>
                    <div className="text-xs text-slate-400 mt-0.5">Administrative logins and key rotations during this session will be logged here.</div>
                  </td>
                </tr>
              ) : securitySettings.securityLogs.map(sec => (
                <tr key={sec.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-slate-400">{sec.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{sec.event}</td>
                  <td className="py-3 px-4 font-mono text-blue-600">{sec.ip}</td>
                  <td className="py-3 px-4"><StatusBadge status={sec.status} /></td>
                  <td className="py-3 px-4 text-slate-500">{sec.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleGenerateKey} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Generate Secret API Key</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Description Name</label>
                <input 
                  type="text" 
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Partner Webhook Gateway"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Permission Scope</label>
                <select 
                  value={keyScope}
                  onChange={(e) => setKeyScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="Read/Write">Read/Write Access</option>
                  <option value="Read Only">Read Only</option>
                  <option value="Financial Ops">Financial Ops Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs">Generate Token</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
