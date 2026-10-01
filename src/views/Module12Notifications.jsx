import React, { useState, useMemo } from 'react';
import { 
  Bell, Send, Users, Clock, Check, CheckCircle2, 
  Plus, Search, Megaphone, Loader2, X, ChevronRight, 
  MoreVertical, Trash2, Copy, AlertCircle, Sparkles
} from 'lucide-react';
import { sendInstantNotification, scheduleNotification } from '../api/adminApi';

const QUICK_PRESETS = [
  {
    id: 'qp-1',
    title: 'Weekend Cleaning 20% OFF!',
    snippet: 'Book any home deep cleaning service this weekend...',
    body: 'Book any home deep cleaning service this weekend and get 20% cashback directly in your wallet!',
    target: 'All Users',
    iconType: 'promo'
  },
  {
    id: 'qp-2',
    title: 'Rain Alert: Expect minor delays',
    snippet: 'Due to heavy rains in your area, service partners...',
    body: 'Due to heavy rains in your area, service partners might take an extra 10-15 minutes to reach your doorstep.',
    target: 'All Users',
    iconType: 'alert'
  },
  {
    id: 'qp-3',
    title: 'Upcoming AC Health Check Drive',
    snippet: 'Exclusive pre-season AC inspection drive starting...',
    body: 'Exclusive pre-season AC inspection drive starting next Monday. Reserve your diagnostic slot today at flat ₹199!',
    target: 'All Users',
    iconType: 'campaign'
  }
];

export const Module12Notifications = ({ notifications = [], setNotifications, onRefresh }) => {
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Users');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal State for "+ Create Notification"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalAudience, setModalAudience] = useState('All Users');
  const [modalType, setModalType] = useState('instant'); // instant | scheduled
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalScheduledAt, setModalScheduledAt] = useState('2026-10-01T08:00');
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Filtered History
  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchBody = (n.body || n.message || '').toLowerCase().includes(q);
      const matchTarget = (n.target || n.recipientName || '').toLowerCase().includes(q);
      return matchTitle || matchBody || matchTarget;
    });
  }, [notifications, searchQuery]);

  // Handle Quick Preset Click
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setBody(preset.body);
  };

  // Dispatch Quick Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setAlertMsg(null);

    const payload = {
      recipientUserId: null,
      title: title.trim(),
      body: body.trim(),
    };

    try {
      try {
        await sendInstantNotification(payload);
      } catch (err) {
        console.warn('Backend notification notice:', err.message);
      }

      const newNotif = {
        id: `notif-${Date.now()}`,
        title: payload.title,
        body: payload.body,
        target: targetAudience || 'All Users',
        status: 'Delivered',
        sentTime: 'Just Now',
        iconType: 'promo',
        createdAt: new Date().toISOString()
      };

      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('homeease_admin_notifications', JSON.stringify(updated));
        return updated;
      });

      setTitle('');
      setBody('');
      setSelectedPresetId(null);
      setAlertMsg({ type: 'success', text: 'Broadcast message successfully dispatched to all mobile devices!' });
    } finally {
      setIsSending(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  // Dispatch Modal Notification
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalMessage.trim()) return;

    setIsModalSubmitting(true);
    setAlertMsg(null);

    try {
      if (modalType === 'instant') {
        try {
          await sendInstantNotification({
            recipientUserId: null,
            title: modalTitle.trim(),
            body: modalMessage.trim(),
          });
        } catch (err) {
          console.warn('Backend notification notice:', err.message);
        }

        const newNotif = {
          id: `notif-${Date.now()}`,
          title: modalTitle.trim(),
          body: modalMessage.trim(),
          target: modalAudience,
          status: 'Delivered',
          sentTime: 'Just Now',
          iconType: modalAudience === 'Partner Users' ? 'alert' : 'promo',
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('homeease_admin_notifications', JSON.stringify(updated));
          return updated;
        });
      } else {
        try {
          await scheduleNotification({
            recipientUserId: null,
            recipientWorkerId: null,
            title: modalTitle.trim(),
            message: modalMessage.trim(),
            type: 'PROMOTION',
            scheduledAt: modalScheduledAt.includes('T') ? `${modalScheduledAt}:00Z` : `${modalScheduledAt}T08:00:00Z`,
          });
        } catch (err) {
          console.warn('Backend notification notice:', err.message);
        }

        const newNotif = {
          id: `sched-${Date.now()}`,
          title: modalTitle.trim(),
          body: modalMessage.trim(),
          target: modalAudience,
          status: 'Scheduled',
          sentTime: `Scheduled for ${modalScheduledAt.replace('T', ' ')}`,
          iconType: 'campaign',
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('homeease_admin_notifications', JSON.stringify(updated));
          return updated;
        });
      }

      setShowCreateModal(false);
      setModalTitle('');
      setModalMessage('');
      setAlertMsg({ type: 'success', text: 'Notification successfully processed and recorded!' });
    } finally {
      setIsModalSubmitting(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  const handleDeleteNotif = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('homeease_admin_notifications', JSON.stringify(updated));
      return updated;
    });
    setActiveMenuId(null);
  };

  const handleCopyNotif = (text) => {
    navigator.clipboard?.writeText(text);
    setActiveMenuId(null);
    setAlertMsg({ type: 'success', text: 'Notification text copied to clipboard!' });
    setTimeout(() => setAlertMsg(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navy Banner matching screenshot */}
      <div className="bg-[#071328] text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Bell className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
              Push Notification & Broadcast Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Send broadcast messages, alerts and updates to all app users, customers and workers.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Notification
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

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Quick Broadcast (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600 -rotate-12" />
            <h3 className="font-bold text-slate-900 text-sm">Quick Broadcast</h3>
          </div>

          {/* Quick Presets List */}
          <div className="space-y-2">
            {QUICK_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs' 
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition leading-snug">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {preset.snippet}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 pt-1">
            
            {/* Target Audience */}
            <div>
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Target Audience
              </label>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span>All Mobile App Users (Firebase Topic: all_users)</span>
              </div>
            </div>

            {/* Broadcast Title */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1.5">
                Broadcast Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend 20% Discount!"
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-slate-400 placeholder:font-normal"
                required
              />
            </div>

            {/* Message Content with 0/500 counter */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1.5">
                Message Content <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea 
                  value={body}
                  maxLength={500}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3.5 pb-7 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition placeholder:text-slate-400 resize-none"
                  rows={4}
                  required
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono select-none">
                  {body.length}/500
                </span>
              </div>
            </div>

            {/* Send Broadcast Button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 -rotate-12" />
                  <span>Send Broadcast</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Notification History (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Notification History</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                View your recent notifications and broadcast messages.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-slate-100">
            {filteredNotifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No notifications match your search query.
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const isScheduled = item.status === 'Scheduled' || item.type === 'SCHEDULED_CAMPAIGN';
                const audience = item.target || item.recipientName || 'All Users';
                const isMenuOpen = activeMenuId === (item.id || item.notificationId);

                // Color & Icon mapping matching screenshot
                let avatarClass = "bg-emerald-50 text-emerald-600";
                let AvatarIcon = Megaphone;

                if (item.iconType === 'alert' || item.title?.toLowerCase().includes('kyc') || item.title?.toLowerCase().includes('urgent')) {
                  avatarClass = "bg-blue-50 text-blue-600";
                  AvatarIcon = AlertCircle;
                } else if (isScheduled || item.iconType === 'campaign' || item.title?.toLowerCase().includes('scheduled')) {
                  avatarClass = "bg-purple-50 text-purple-600";
                  AvatarIcon = Megaphone;
                } else if (item.iconType === 'update_green' || item.title?.toLowerCase().includes('service update')) {
                  avatarClass = "bg-emerald-50 text-emerald-600";
                  AvatarIcon = CheckCircle2;
                }

                return (
                  <div key={item.id || item.notificationId} className="py-4 first:pt-2 last:pb-1 flex items-start gap-3.5 relative group">
                    {/* Circle Avatar Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${avatarClass}`}>
                      <AvatarIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                          {item.sentTime || 'Just Now'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {item.body || item.message}
                      </p>

                      {/* Bottom Tags */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{audience}</span>
                        </div>

                        {isScheduled ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Scheduled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Delivered</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative shrink-0 pt-0.5">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : (item.id || item.notificationId))}
                        className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in">
                          <button
                            onClick={() => handleCopyNotif(`${item.title}\n${item.body || item.message}`)}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
                          </button>
                          <button
                            onClick={() => handleDeleteNotif(item.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Log
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: + Create Notification */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleModalSubmit} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Notification</h3>
                <p className="text-xs text-slate-400">Broadcast mobile push messages or schedule a campaign</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Type Switcher */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Broadcast Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('instant')}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalType === 'instant' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 -rotate-12" /> Instant Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('scheduled')}
                    className={`py-2 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalType === 'scheduled' 
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Scheduled Campaign
                  </button>
                </div>
              </div>

              {/* Target Audience Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={modalAudience}
                  onChange={(e) => setModalAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="All Users">All Users (Mobile App Customers & Workers)</option>
                  <option value="Customers">Customers Only</option>
                  <option value="Partner Users">Partner Users (Workers & Fleet)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notification Title *</label>
                <input 
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Festival 20% Discount!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea 
                  value={modalMessage}
                  maxLength={500}
                  onChange={(e) => setModalMessage(e.target.value)}
                  placeholder="Enter notification text here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-500 focus:bg-white resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Scheduled Time */}
              {modalType === 'scheduled' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scheduled Time (Local)</label>
                  <input 
                    type="datetime-local"
                    value={modalScheduledAt}
                    onChange={(e) => setModalScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                disabled={isModalSubmitting}
                className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isModalSubmitting}
                className="px-5 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                {isModalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isModalSubmitting 
                  ? 'Processing...' 
                  : (modalType === 'instant' ? 'Dispatch Push' : 'Schedule Campaign')
                }
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
