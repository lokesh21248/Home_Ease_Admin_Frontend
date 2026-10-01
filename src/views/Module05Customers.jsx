import React, { useState, useMemo } from 'react';
import { 
  Users, Shield, Search, Phone, Mail, Calendar, 
  CheckCircle2, UserCheck, Eye, X, Copy, Check, Lock, ShieldCheck, Sparkles
} from 'lucide-react';

export const Module05Customers = ({ customers = [], setCustomers, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'admins'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Partition users cleanly into Customers and Administrators
  const customerList = useMemo(() => {
    return customers.filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'CUSTOMER' || (!r && !u.isWorker);
    });
  }, [customers]);

  const adminList = useMemo(() => {
    return customers.filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'ADMIN' || r === 'SUPER_ADMIN' || u.isAdmin;
    });
  }, [customers]);

  // Current active list based on selected tab
  const activeList = activeTab === 'customers' ? customerList : adminList;

  // Search filter
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeList;

    return activeList.filter(u => {
      const name = (u.fullName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || '').toLowerCase();
      const id = (u.userId || u.id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [activeList, searchQuery]);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {activeTab === 'customers' ? 'Customer Accounts Directory' : 'Platform Administrators & Staff'}
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            {activeTab === 'customers' 
              ? 'Directory of registered customer accounts, contact information, and service profiles.'
              : 'Registered administrative accounts, operations supervisors, and staff access credentials.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-2">
            {activeTab === 'customers' ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{customerList.length} Customers Registered</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{adminList.length} Active Admins</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Customers vs Administrators) & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('customers');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'customers' 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'customers' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {customerList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admins');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'admins' 
                ? 'bg-white text-purple-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administrators</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'admins' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {adminList.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'customers' ? "Search customers by name, phone, email..." : "Search admins by name, email..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{activeTab === 'customers' ? 'Customer Profile' : 'Administrator'}</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">{activeTab === 'customers' ? 'Account Role' : 'Admin Role'}</th>
                <th className="py-3 px-4">{activeTab === 'customers' ? 'Account Status' : 'Access Level'}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      {activeTab === 'customers' ? <Users className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div className="font-bold text-slate-700 text-sm">
                      {activeTab === 'customers' ? 'No Customers Found' : 'No Administrators Found'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery 
                        ? 'No accounts matched your search terms. Try clearing the filter.' 
                        : (activeTab === 'customers' 
                            ? 'Customers who sign up on the HomeEase customer mobile app will appear here.'
                            : 'No administrator accounts registered.')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const uId = user.userId || user.id || 'N/A';
                  const name = user.fullName || user.name || (activeTab === 'customers' ? 'Customer User' : 'System Admin');
                  const email = user.email || 'No email provided';
                  const phone = user.phoneNumber || user.phone || 'N/A';
                  const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Active';

                  return (
                    <tr key={uId} className="hover:bg-slate-50/80 transition group">
                      
                      {/* User Account / Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm ${
                            activeTab === 'admins' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {name}
                              {activeTab === 'admins' && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold flex items-center gap-0.5 border border-purple-200">
                                  <Shield className="w-3 h-3 text-purple-600" /> Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {email}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>ID: {uId.slice(0, 10)}...</span>
                              <button 
                                onClick={() => handleCopyId(uId)} 
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy ID"
                              >
                                {copiedId === uId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        <a 
                          href={phone !== 'N/A' ? `tel:${phone}` : undefined}
                          className="font-mono text-slate-700 hover:text-blue-600 transition flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{phone}</span>
                        </a>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{regDate}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {activeTab === 'admins' ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono uppercase inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3 h-3 text-purple-600" /> SUPER ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono uppercase inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200">
                            CUSTOMER
                          </span>
                        )}
                      </td>

                      {/* Status / Access Level */}
                      <td className="py-3.5 px-4">
                        {activeTab === 'admins' ? (
                          <span className="text-purple-700 font-semibold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Full Permissions
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Account
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center ${
                  (selectedUser.role || '').toUpperCase() === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {(selectedUser.fullName || selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedUser.fullName || selectedUser.name || 'User Profile'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedUser.userId || selectedUser.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Account Role:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {selectedUser.role || (activeTab === 'customers' ? 'CUSTOMER' : 'ADMIN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <span className="font-semibold text-slate-700">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Phone:</span>
                  <span className="font-semibold text-slate-700 font-mono">{selectedUser.phoneNumber || selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Created Date:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              </div>

              {selectedUser.address && (
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Registered Address</label>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {selectedUser.address}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
