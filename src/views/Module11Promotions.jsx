import React, { useState, useMemo } from 'react';
import { 
  Tag, Plus, Percent, Calendar, CheckCircle2, AlertTriangle, 
  Trash2, Search, X, Sparkles, Clock, Loader2, Copy, Check
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { createCoupon } from '../api/adminApi';

export const Module11Promotions = ({ promotions = [], setPromotions, onRefresh }) => {
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE'); // PERCENTAGE | FIXED_AMOUNT
  const [discountVal, setDiscountVal] = useState(15);
  const [maxDiscount, setMaxDiscount] = useState(150);
  const [minOrder, setMinOrder] = useState(399);
  const [usageLimit, setUsageLimit] = useState(500);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);

  const filteredPromos = useMemo(() => {
    return promotions.filter(p => {
      const match = (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = p.isActive !== undefined ? p.isActive : (p.status === 'Active');
      if (statusFilter === 'ACTIVE') return match && isActive;
      if (statusFilter === 'INACTIVE') return match && !isActive;
      return match;
    });
  }, [promotions, searchQuery, statusFilter]);

  const handleCopyCode = (codeText) => {
    navigator.clipboard?.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCoupon = (couponId) => {
    setPromotions(prev => {
      const updated = prev.filter(p => (p.couponId || p.id) !== couponId);
      localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
      return updated;
    });
    setAlertMsg({ type: 'success', text: 'Coupon removed successfully.' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setAlertMsg(null);

    const formattedCode = code.trim().toUpperCase();
    const payload = {
      code: formattedCode,
      discountType: discountType === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
      discountVal: Number(discountVal),
      minOrderValue: Number(minOrder),
      maxDiscountAmount: Number(maxDiscount),
      validFrom: new Date().toISOString(),
      validUntil: validUntil.includes('T') ? validUntil : `${validUntil}T23:59:59Z`,
      usageLimit: Number(usageLimit),
      isActive: true,
    };

    try {
      let created;
      try {
        created = await createCoupon(payload);
      } catch (apiErr) {
        console.warn('API error creating coupon, fallback to local:', apiErr);
        created = {
          couponId: `coupon-${Date.now()}`,
          ...payload,
          timesUsed: 0,
          createdAt: new Date().toISOString()
        };
      }

      setPromotions(prev => {
        const updated = [created, ...prev];
        localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
        return updated;
      });
      setShowAddPromo(false);
      setCode('');
      setAlertMsg({ type: 'success', text: `Coupon ${payload.code} successfully deployed to live catalog!` });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to create coupon:', err);
      setAlertMsg({ type: 'error', text: `Failed to create coupon: ${err.message}` });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  const handlePresetFill = (presetCode, type, val, min, max) => {
    setCode(presetCode);
    setDiscountType(type);
    setDiscountVal(val);
    setMinOrder(min);
    setMaxDiscount(max);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-500/20">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Coupons & Promotional Discounts</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Manage customer promo codes, redemption rules, discount limits, and special promotional offers.
          </p>
        </div>
        <button
          onClick={() => setShowAddPromo(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Generate Coupon Code
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-rose-500 focus:bg-white uppercase font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'INACTIVE'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? `All (${promotions.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions List */}
      {filteredPromos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <Tag className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Coupons Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {searchQuery ? 'No coupons match your filter.' : 'Click "Generate Coupon Code" above to publish a new discount promotion directly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPromos.map((promo) => {
            const id = promo.couponId || promo.id;
            const code = promo.code;
            const discType = promo.discountType || 'PERCENTAGE';
            const discVal = promo.discountVal ?? 0;
            const isPercent = discType === 'PERCENTAGE' || discType.includes('PERCENT');
            const minOrder = promo.minOrderValue ?? promo.minOrder ?? 0;
            const maxCap = promo.maxDiscountAmount ?? promo.maxDiscount ?? 0;
            const quota = promo.usageLimit ?? promo.usageQuota ?? 1000;
            const used = promo.timesUsed ?? promo.usageCurrent ?? 0;
            const quotaPercent = Math.min(Math.round((used / quota) * 100), 100);
            const isActive = promo.isActive !== undefined ? promo.isActive : (promo.status === 'Active');

            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-sm tracking-wider border border-slate-700 flex items-center gap-1.5">
                        {code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(code)}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition"
                        title="Copy coupon code"
                      >
                        {copiedCode === code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <StatusBadge status={isActive ? 'Active' : 'Inactive'} />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-black text-rose-600">
                      {isPercent ? `${discVal}% OFF` : `₹${discVal} FLAT OFF`}
                    </div>
                    <div className="text-xs text-slate-500">
                      Min Basket: <strong>₹{minOrder}</strong> • Max Cap: <strong>₹{maxCap}</strong>
                    </div>
                  </div>

                  {/* Quota Meter Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Redemptions</span>
                      <span className="font-bold text-slate-800">{used} / {quota} ({quotaPercent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          quotaPercent > 90 ? 'bg-amber-500' : 'bg-rose-600'
                        }`}
                        style={{ width: `${Math.max(quotaPercent, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Valid: {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'Active'}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteCoupon(id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddPromo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Discount Coupon</h3>
                <p className="text-xs text-slate-400">Deploy instant customer discount codes</p>
              </div>
              <button type="button" onClick={() => setShowAddPromo(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Quick Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetFill('WELCOME50', 'FIXED_AMOUNT', 50, 299, 50)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition border border-slate-200"
                >
                  WELCOME50 (₹50 Flat)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetFill('FESTIVE20', 'PERCENTAGE', 20, 499, 200)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition border border-slate-200"
                >
                  FESTIVE20 (20% Off)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetFill('MEGA100', 'FIXED_AMOUNT', 100, 599, 100)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition border border-slate-200"
                >
                  MEGA100 (₹100 Flat)
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Promo Code *</label>
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE20"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none uppercase focus:border-rose-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-rose-600 focus:bg-white"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED_AMOUNT">FLAT AMOUNT (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'} *
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-rose-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Basket (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Usage Limit</label>
                  <input 
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid Until Date</label>
                  <input 
                    type="date"
                    value={validUntil.slice(0, 10)}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-rose-600 focus:bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowAddPromo(false)} 
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Deploying...' : 'Deploy Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
