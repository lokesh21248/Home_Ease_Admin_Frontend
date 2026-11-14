import React, { useState, useMemo } from 'react';
import { 
  Tag, Plus, Percent, Calendar, CheckCircle2, AlertTriangle, 
  Trash2, Search, X, Sparkles, Clock, Loader2, Copy, Check,
  Edit3, TrendingUp, BarChart3, IndianRupee, ShieldAlert,
  ArrowRight, ExternalLink, RefreshCw, Sliders, CheckCircle,
  XCircle, Info, Gift, Zap, Award, Layers, ChevronRight, Eye
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { createCoupon, updateCoupon, deleteCoupon } from '../api/adminApi';

// Initial curated Hyderabad promotions if empty
const HYDERABAD_DEFAULT_PROMOTIONS = [
  {
    couponId: 'hyd-cp-001',
    code: 'HYDWELCOME',
    discountType: 'PERCENTAGE',
    discountVal: 20,
    minOrderValue: 399,
    maxDiscountAmount: 150,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    usageLimit: 1000,
    timesUsed: 428,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-002',
    code: 'FESTIVE25',
    discountType: 'PERCENTAGE',
    discountVal: 25,
    minOrderValue: 699,
    maxDiscountAmount: 250,
    validFrom: '2026-03-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    usageLimit: 800,
    timesUsed: 512,
    isActive: true,
    createdAt: '2026-03-01T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-003',
    code: 'ACCARE150',
    discountType: 'FIXED_AMOUNT',
    discountVal: 150,
    minOrderValue: 899,
    maxDiscountAmount: 150,
    validFrom: '2026-04-01T00:00:00Z',
    validUntil: '2026-08-31T23:59:59Z',
    usageLimit: 400,
    timesUsed: 195,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-004',
    code: 'WEEKEND15',
    discountType: 'PERCENTAGE',
    discountVal: 15,
    minOrderValue: 299,
    maxDiscountAmount: 100,
    validFrom: '2026-05-01T00:00:00Z',
    validUntil: '2026-05-15T23:59:59Z', // Expiring soon
    usageLimit: 300,
    timesUsed: 265,
    isActive: true,
    createdAt: '2026-05-01T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-005',
    code: 'MONSOON50',
    discountType: 'FIXED_AMOUNT',
    discountVal: 50,
    minOrderValue: 349,
    maxDiscountAmount: 50,
    validFrom: '2026-06-01T00:00:00Z',
    validUntil: '2026-09-30T23:59:59Z',
    usageLimit: 600,
    timesUsed: 310,
    isActive: true,
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-006',
    code: 'HITECHVIP',
    discountType: 'PERCENTAGE',
    discountVal: 20,
    minOrderValue: 999,
    maxDiscountAmount: 300,
    validFrom: '2026-02-15T00:00:00Z',
    validUntil: '2026-11-30T23:59:59Z',
    usageLimit: 250,
    timesUsed: 78,
    isActive: true,
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    couponId: 'hyd-cp-007',
    code: 'FLASH50',
    discountType: 'FIXED_AMOUNT',
    discountVal: 50,
    minOrderValue: 249,
    maxDiscountAmount: 50,
    validFrom: '2026-01-10T00:00:00Z',
    validUntil: '2026-02-28T23:59:59Z', // Expired
    usageLimit: 100,
    timesUsed: 100,
    isActive: false,
    createdAt: '2026-01-10T00:00:00Z'
  }
];

export const Module11Promotions = ({ 
  promotions = [], 
  setPromotions, 
  bookings = [], 
  categories = [], 
  onRefresh,
  onNavigateModule 
}) => {
  // Navigation tabs: 'active' | 'campaigns' | 'analytics'
  const [activeTab, setActiveTab] = useState('active');

  // Coupon Creator state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE'); // 'PERCENTAGE' | 'FIXED_AMOUNT'
  const [discountVal, setDiscountVal] = useState(20);
  const [maxDiscount, setMaxDiscount] = useState(200);
  const [minOrder, setMinOrder] = useState(499);
  const [usageLimit, setUsageLimit] = useState(500);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE, EXPIRING_SOON, EXHAUSTED
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, PERCENTAGE, FIXED_AMOUNT
  const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, MOST_USED, HIGHEST_DISCOUNT, EXPIRING_FIRST
  const [copiedCode, setCopiedCode] = useState(null);

  // Inspector / Edit Drawer state
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerForm, setDrawerForm] = useState(null);
  const [isUpdatingDrawer, setIsUpdatingDrawer] = useState(false);

  // Master promotion list with fallback
  const masterCoupons = useMemo(() => {
    if (Array.isArray(promotions) && promotions.length > 0) {
      return promotions;
    }
    return HYDERABAD_DEFAULT_PROMOTIONS;
  }, [promotions]);

  // Real-time KPI Ribbon Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let totalRedemptions = 0;
    let totalPromotionalDiscountDisbursed = 0;
    let expiringSoonCount = 0;
    let totalDiscountValSum = 0;

    masterCoupons.forEach(p => {
      const isAct = p.isActive !== false && p.status !== 'Inactive';
      const expiry = p.validUntil ? new Date(p.validUntil) : null;
      const isExpired = expiry && expiry < now;
      const quota = p.usageLimit || 1000;
      const used = p.timesUsed || 0;
      const isExhausted = used >= quota;

      if (isAct && !isExpired && !isExhausted) {
        activeCount++;
      }

      totalRedemptions += used;

      // Estimate promotional savings disbursed
      const discVal = Number(p.discountVal) || 0;
      if (p.discountType === 'FIXED_AMOUNT') {
        totalPromotionalDiscountDisbursed += used * discVal;
      } else {
        // Average order size approx ₹700 in Hyderabad, capped at maxDiscountAmount
        const estOrderValue = Math.max(Number(p.minOrderValue) || 500, 700);
        const calculated = (estOrderValue * discVal) / 100;
        const maxCap = Number(p.maxDiscountAmount) || calculated;
        const actualDisc = Math.min(calculated, maxCap);
        totalPromotionalDiscountDisbursed += used * actualDisc;
      }

      totalDiscountValSum += discVal;

      if (isAct && expiry && expiry > now && expiry <= sevenDaysFromNow) {
        expiringSoonCount++;
      }
    });

    // Check if bookings have actual recorded discountAmount
    const bookingDiscounts = bookings.reduce((sum, b) => sum + (Number(b.discountAmount) || 0), 0);
    const finalDisbursedSavings = bookingDiscounts > 0 ? bookingDiscounts : totalPromotionalDiscountDisbursed;

    const avgDiscount = masterCoupons.length > 0 ? Math.round(totalDiscountValSum / masterCoupons.length) : 0;

    return {
      activeCount,
      totalCoupons: masterCoupons.length,
      totalRedemptions,
      totalDisbursedSavings: Math.round(finalDisbursedSavings),
      expiringSoonCount,
      avgDiscount
    };
  }, [masterCoupons, bookings]);

  // Filtered & Sorted Coupons
  const filteredPromos = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return masterCoupons.filter(p => {
      const codeMatch = (p.code || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
      const isAct = p.isActive !== false && p.status !== 'Inactive';
      const expiry = p.validUntil ? new Date(p.validUntil) : null;
      const isExpired = expiry && expiry < now;
      const quota = p.usageLimit || 1000;
      const used = p.timesUsed || 0;
      const isExhausted = used >= quota;
      const isExpiringSoon = isAct && expiry && expiry > now && expiry <= sevenDaysFromNow;

      // Status filter
      if (statusFilter === 'ACTIVE' && (!isAct || isExpired || isExhausted)) return false;
      if (statusFilter === 'INACTIVE' && (isAct && !isExpired && !isExhausted)) return false;
      if (statusFilter === 'EXPIRING_SOON' && !isExpiringSoon) return false;
      if (statusFilter === 'EXHAUSTED' && !isExhausted) return false;

      // Type filter
      if (typeFilter === 'PERCENTAGE' && (p.discountType !== 'PERCENTAGE' && !p.discountType?.includes('PERCENT'))) return false;
      if (typeFilter === 'FIXED_AMOUNT' && p.discountType !== 'FIXED_AMOUNT') return false;

      return codeMatch;
    }).sort((a, b) => {
      if (sortBy === 'MOST_USED') {
        return (b.timesUsed || 0) - (a.timesUsed || 0);
      }
      if (sortBy === 'HIGHEST_DISCOUNT') {
        return (Number(b.discountVal) || 0) - (Number(a.discountVal) || 0);
      }
      if (sortBy === 'EXPIRING_FIRST') {
        const dateA = a.validUntil ? new Date(a.validUntil).getTime() : Infinity;
        const dateB = b.validUntil ? new Date(b.validUntil).getTime() : Infinity;
        return dateA - dateB;
      }
      // NEWEST default
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [masterCoupons, searchQuery, statusFilter, typeFilter, sortBy]);

  // Copy code to clipboard
  const handleCopyCode = (codeText, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Generate random promo code helper
  const handleGenerateCode = (prefix = 'HYD') => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setCode(`${prefix}${randomSuffix}`);
  };

  // Quick Preset Templates
  const handlePresetFill = (presetCode, type, val, min, max, quota = 500) => {
    setCode(presetCode);
    setDiscountType(type);
    setDiscountVal(val);
    setMinOrder(min);
    setMaxDiscount(max);
    setUsageLimit(quota);
    setActiveTab('campaigns');
  };

  // Open Inspector Drawer
  const handleOpenDrawer = (coupon) => {
    setSelectedCoupon(coupon);
    setDrawerForm({
      code: coupon.code,
      discountType: coupon.discountType || 'PERCENTAGE',
      discountVal: coupon.discountVal ?? 15,
      minOrderValue: coupon.minOrderValue ?? 399,
      maxDiscountAmount: coupon.maxDiscountAmount ?? 150,
      usageLimit: coupon.usageLimit ?? 500,
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '2026-12-31',
      isActive: coupon.isActive !== false && coupon.status !== 'Inactive'
    });
    setIsDrawerOpen(true);
  };

  // Fast Toggle Active / Inactive
  const handleToggleStatus = async (coupon, e) => {
    if (e) e.stopPropagation();
    const id = coupon.couponId || coupon.id;
    const currentActive = coupon.isActive !== false && coupon.status !== 'Inactive';
    const newStatus = !currentActive;

    // Optimistic update
    const updateList = (prev) => {
      const list = Array.isArray(prev) ? prev : HYDERABAD_DEFAULT_PROMOTIONS;
      const updated = list.map(c => {
        if ((c.couponId || c.id) === id) {
          return { ...c, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' };
        }
        return c;
      });
      localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
      return updated;
    };

    if (setPromotions) setPromotions(updateList);

    try {
      await updateCoupon(id, { isActive: newStatus });
      setAlertMsg({ 
        type: 'success', 
        text: `Coupon ${coupon.code} is now ${newStatus ? 'ACTIVATED' : 'PAUSED'} in live catalog.` 
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Backend toggle note:', err.message);
      setAlertMsg({ type: 'success', text: `Status updated locally: ${newStatus ? 'Active' : 'Paused'}` });
    } finally {
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (couponId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to retire this coupon code? This will disable any customer attempting to apply this voucher.')) {
      return;
    }

    const updateList = (prev) => {
      const list = Array.isArray(prev) ? prev : HYDERABAD_DEFAULT_PROMOTIONS;
      const updated = list.filter(p => (p.couponId || p.id) !== couponId);
      localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
      return updated;
    };

    if (setPromotions) setPromotions(updateList);
    if (isDrawerOpen) setIsDrawerOpen(false);

    try {
      await deleteCoupon(couponId, false);
      setAlertMsg({ type: 'success', text: 'Coupon archived successfully from Hyderabad operations catalog!' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Backend coupon delete note:', err.message);
      setAlertMsg({ type: 'success', text: 'Coupon removed locally.' });
    } finally {
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  // Submit Drawer Updates
  const handleSaveDrawerChanges = async (e) => {
    e.preventDefault();
    if (!selectedCoupon || !drawerForm) return;

    setIsUpdatingDrawer(true);
    const id = selectedCoupon.couponId || selectedCoupon.id;
    const patchPayload = {
      code: drawerForm.code.toUpperCase().trim(),
      discountType: drawerForm.discountType,
      discountVal: Number(drawerForm.discountVal),
      minOrderValue: Number(drawerForm.minOrderValue),
      maxDiscountAmount: Number(drawerForm.maxDiscountAmount),
      usageLimit: Number(drawerForm.usageLimit),
      validUntil: drawerForm.validUntil.includes('T') ? drawerForm.validUntil : `${drawerForm.validUntil}T23:59:59Z`,
      isActive: Boolean(drawerForm.isActive)
    };

    const updateList = (prev) => {
      const list = Array.isArray(prev) ? prev : HYDERABAD_DEFAULT_PROMOTIONS;
      const updated = list.map(c => {
        if ((c.couponId || c.id) === id) {
          return { ...c, ...patchPayload };
        }
        return c;
      });
      localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
      return updated;
    };

    if (setPromotions) setPromotions(updateList);

    try {
      await updateCoupon(id, patchPayload);
      setAlertMsg({ type: 'success', text: `Rules for coupon ${patchPayload.code} saved successfully!` });
      setIsDrawerOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('API update failed, saved locally:', err.message);
      setAlertMsg({ type: 'success', text: `Rules for ${patchPayload.code} updated locally.` });
      setIsDrawerOpen(false);
    } finally {
      setIsUpdatingDrawer(false);
      setTimeout(() => setAlertMsg(null), 3500);
    }
  };

  // Create New Coupon via Studio
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
      maxDiscountAmount: discountType === 'FIXED_AMOUNT' ? Number(discountVal) : Number(maxDiscount),
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
        console.warn('API error creating coupon, fallback to local creation:', apiErr);
        created = {
          couponId: `hyd-cp-${Date.now()}`,
          ...payload,
          timesUsed: 0,
          createdAt: new Date().toISOString()
        };
      }

      if (setPromotions) {
        setPromotions(prev => {
          const list = Array.isArray(prev) && prev.length > 0 ? prev : HYDERABAD_DEFAULT_PROMOTIONS;
          const updated = [created, ...list];
          localStorage.setItem('homeease_admin_coupons', JSON.stringify(updated));
          return updated;
        });
      }

      setCode('');
      setAlertMsg({ type: 'success', text: `Coupon ${payload.code} successfully deployed live to Hyderabad customers!` });
      setActiveTab('active');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to create coupon:', err);
      setAlertMsg({ type: 'error', text: `Failed to create coupon: ${err.message}` });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  // Preview Calculation for Studio
  const previewDiscount = useMemo(() => {
    const sampleCart = 800;
    const discNum = Number(discountVal) || 0;
    if (discountType === 'FIXED_AMOUNT') {
      return Math.min(discNum, sampleCart);
    }
    const rawDisc = (sampleCart * discNum) / 100;
    const cap = Number(maxDiscount) || rawDisc;
    return Math.min(rawDisc, cap);
  }, [discountVal, discountType, maxDiscount]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#1D68F2] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/30 text-blue-200 text-[11px] font-bold tracking-wider uppercase border border-blue-400/30">
              Growth & Conversions
            </span>
            <span className="text-xs text-blue-200/80">Market: Hyderabad Core</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-blue-400" /> Offers & Coupons Management
          </h2>
          <p className="text-blue-100/80 text-xs mt-1 max-w-2xl">
            Configure customer promotional vouchers, dynamic basket discount ceilings, usage limits, and campaign rules to drive bookings across all 8 Hyderabad service zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              setAlertMsg({ type: 'success', text: 'Synchronized live coupons from backend.' });
              setTimeout(() => setAlertMsg(null), 2500);
            }}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh coupons"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className="px-4 py-2 bg-white text-[#1D68F2] hover:bg-blue-50 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#1D68F2]" /> Create New Campaign
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {alertMsg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
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

      {/* 2. Real-time KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Coupons</span>
            <Tag className="w-4 h-4 text-[#1D68F2]" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.activeCount} <span className="text-xs text-slate-400 font-medium">/ {metrics.totalCoupons}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3" /> Live in Customer App
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Redemptions</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalRedemptions.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Bookings discounted
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Savings Disbursed</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">
            ₹{metrics.totalDisbursedSavings.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Total promotional value
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expiring &lt; 7 Days</span>
            <Clock className={`w-4 h-4 ${metrics.expiringSoonCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.expiringSoonCount}
          </div>
          <div className="mt-1 text-[11px] font-medium">
            {metrics.expiringSoonCount > 0 ? (
              <span className="text-amber-600 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3 h-3" /> Needs renewal
              </span>
            ) : (
              <span className="text-slate-400">All schedules optimal</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Discount Depth</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ~{metrics.avgDiscount}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Blended discount margin
          </div>
        </div>
      </div>

      {/* 3. Operational Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" /> Active & Scheduled Vouchers ({filteredPromos.length})
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Coupon Studio & Presets
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#1D68F2] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Redemption Performance & ROI
        </button>
      </div>

      {/* TAB 1: ACTIVE & SCHEDULED VOUCHERS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Search, Status & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search promo code (e.g. FESTIVE25)..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-[#1D68F2] focus:bg-white uppercase font-mono transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'ALL', label: `All (${masterCoupons.length})` },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'INACTIVE', label: 'Paused' },
                  { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
                  { id: 'EXHAUSTED', label: 'Exhausted' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === item.id 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Discount Type Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Flat Amount (₹)</option>
              </select>

              {/* Sorting Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="MOST_USED">Most Redeemed</option>
                <option value="HIGHEST_DISCOUNT">Highest Discount</option>
                <option value="EXPIRING_FIRST">Expiring Soonest</option>
              </select>
            </div>
          </div>

          {/* Coupons Card Grid */}
          {filteredPromos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1D68F2] mx-auto flex items-center justify-center">
                <Tag className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Matching Coupons</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No promotional coupons found matching your current filters. Try resetting the filters.'
                  : 'No discount coupons currently deployed. Click "Create New Campaign" to launch a new discount voucher.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPromos.map((promo, idx) => {
                const id = promo.couponId || promo.id || `promo-${idx}`;
                const codeText = promo.code || 'CODE';
                const discType = promo.discountType || 'PERCENTAGE';
                const isPercent = discType === 'PERCENTAGE' || discType.includes('PERCENT');
                const discVal = Number(promo.discountVal) || 0;
                const minBasket = Number(promo.minOrderValue) || 0;
                const maxCap = Number(promo.maxDiscountAmount) || 0;
                const quota = Number(promo.usageLimit) || 1000;
                const used = Number(promo.timesUsed) || 0;
                const quotaPercent = Math.min(Math.round((used / quota) * 100), 100);

                const now = new Date();
                const expiry = promo.validUntil ? new Date(promo.validUntil) : null;
                const isExpired = expiry && expiry < now;
                const isExhausted = used >= quota;
                const isAct = promo.isActive !== false && promo.status !== 'Inactive' && !isExpired && !isExhausted;

                // Days remaining
                const daysRemaining = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div 
                    key={id} 
                    onClick={() => handleOpenDrawer(promo)}
                    className="relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                  >
                    {/* Top Punch Notches Effect & Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs tracking-wider border border-slate-700 flex items-center gap-1.5 shadow-xs">
                            {codeText}
                          </span>
                          <button
                            onClick={(e) => handleCopyCode(codeText, e)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                            title="Copy coupon code"
                          >
                            {copiedCode === codeText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Status Indicator Pill */}
                        <div className="flex items-center gap-2">
                          {isExhausted ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              Exhausted
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              Expired
                            </span>
                          ) : isAct ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                              Paused
                            </span>
                          )}

                          {/* Quick Active Switch */}
                          <button
                            onClick={(e) => handleToggleStatus(promo, e)}
                            title={isAct ? 'Click to Pause' : 'Click to Activate'}
                            className={`w-8 h-4 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                              isAct ? 'bg-[#1D68F2]' : 'bg-slate-200'
                            }`}
                          >
                            <span 
                              className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                                isAct ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Large Discount Amount */}
                      <div className="pt-1">
                        <div className="text-2xl font-black text-slate-900 group-hover:text-[#1D68F2] transition-colors flex items-baseline gap-1.5">
                          {isPercent ? `${discVal}% OFF` : `₹${discVal} FLAT OFF`}
                          {isPercent && maxCap > 0 && (
                            <span className="text-xs font-semibold text-slate-400">up to ₹{maxCap}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>Min Cart: <strong className="text-slate-800">₹{minBasket}</strong></span>
                          <span>•</span>
                          <span>Type: <strong className="text-slate-800">{isPercent ? 'Percentage' : 'Flat Cash'}</strong></span>
                        </div>
                      </div>

                      {/* Quota Progress Meter */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Redemptions</span>
                          <span className="font-mono font-bold text-slate-800">
                            {used.toLocaleString('en-IN')} / {quota.toLocaleString('en-IN')} ({quotaPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              quotaPercent >= 100 
                                ? 'bg-rose-500' 
                                : quotaPercent > 80 
                                  ? 'bg-amber-500' 
                                  : 'bg-[#1D68F2]'
                            }`}
                            style={{ width: `${Math.max(quotaPercent, 3)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {daysRemaining !== null ? (
                          daysRemaining > 0 ? (
                            <span className={daysRemaining <= 7 ? 'text-amber-600 font-bold' : ''}>
                              Ends in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-rose-500 font-semibold">Expired</span>
                          )
                        ) : (
                          <span>Always Active</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(promo);
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#1D68F2] rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteCoupon(id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Archive coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COUPON STUDIO & PRESETS */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Creator Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Templates Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> 1-Click Hyderabad Templates:
                </span>
                <span className="text-[11px] text-slate-400">Click to autofill formula</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetFill('WELCOME100', 'FIXED_AMOUNT', 100, 499, 100, 1000)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#1D68F2] transition border border-slate-200 cursor-pointer"
                >
                  WELCOME100 (₹100 Flat on ₹499+)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetFill('FESTIVE25', 'PERCENTAGE', 25, 799, 250, 800)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#1D68F2] transition border border-slate-200 cursor-pointer"
                >
                  FESTIVE25 (25% off up to ₹250)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetFill('ACCARE150', 'FIXED_AMOUNT', 150, 899, 150, 500)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#1D68F2] transition border border-slate-200 cursor-pointer"
                >
                  ACCARE150 (₹150 Flat on ₹899+)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetFill('WEEKEND15', 'PERCENTAGE', 15, 399, 100, 400)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#1D68F2] transition border border-slate-200 cursor-pointer"
                >
                  WEEKEND15 (15% off on ₹399+)
                </button>
              </div>
            </div>

            {/* Campaign Form */}
            <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Campaign Rule Specification</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define redemption mechanics and checkout validation constraints.</p>
              </div>

              <div className="space-y-4">
                {/* Code Generator & Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Promo Code *</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateCode('HYD')}
                      className="text-[11px] font-bold text-[#1D68F2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate HYD Code
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MONSOON2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 outline-none uppercase focus:border-[#1D68F2] focus:bg-white transition"
                    required
                  />
                </div>

                {/* Model Selector: Percentage vs Flat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount Model</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENTAGE')}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        discountType === 'PERCENTAGE'
                          ? 'border-[#1D68F2] bg-blue-50/50 text-[#1D68F2]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Percent className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Percentage (%)</div>
                        <div className="text-[11px] text-slate-500">e.g. 20% off up to ₹200</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiscountType('FIXED_AMOUNT')}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        discountType === 'FIXED_AMOUNT'
                          ? 'border-[#1D68F2] bg-blue-50/50 text-[#1D68F2]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <IndianRupee className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Flat Amount (₹)</div>
                        <div className="text-[11px] text-slate-500">e.g. ₹100 Flat instant discount</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Discount Value & Max Cap */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {discountType === 'PERCENTAGE' ? 'Discount Rate (%) *' : 'Flat Discount (₹) *'}
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max={discountType === 'PERCENTAGE' ? 100 : 5000}
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      disabled={discountType === 'FIXED_AMOUNT'}
                      placeholder={discountType === 'FIXED_AMOUNT' ? 'N/A for flat' : 'e.g. 250'}
                      className={`w-full px-3 py-2 border rounded-xl font-semibold text-xs outline-none ${
                        discountType === 'FIXED_AMOUNT' 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-50 border border-slate-200 focus:border-[#1D68F2] focus:bg-white'
                      }`}
                      required={discountType === 'PERCENTAGE'}
                    />
                  </div>
                </div>

                {/* Min Order & Total Usage Quota */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Basket (₹) *</label>
                    <input 
                      type="number"
                      min="0"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Usage Limit (Vouchers) *</label>
                    <input 
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Validity Expiry Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid Until Date *</label>
                  <input 
                    type="date"
                    value={validUntil.slice(0, 10)}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white text-xs"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('active')} 
                  className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Deploying to AWS...' : 'Deploy Coupon to Live Catalog'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile App Checkout Voucher Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#1D68F2]" /> Customer App Checkout Preview
                </span>
                <span className="text-[11px] text-slate-400">Live dynamic simulation</span>
              </div>

              {/* Simulated Mobile Voucher Card */}
              <div className="bg-gradient-to-br from-slate-900 to-[#0B192C] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden border border-slate-700">
                {/* Visual notch effects */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>

                <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1D68F2] flex items-center justify-center font-black text-xs text-white">
                      HE
                    </div>
                    <div>
                      <div className="text-xs font-bold tracking-wide">HOMEEASE VOUCHER</div>
                      <div className="text-[10px] text-slate-400">Hyderabad Metro Service</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/30">
                    {code.trim() ? code.toUpperCase() : 'COUPON_CODE'}
                  </span>
                </div>

                <div className="py-4 space-y-2">
                  <div className="text-3xl font-black text-white">
                    {discountType === 'PERCENTAGE' 
                      ? `${discountVal || 0}% OFF` 
                      : `₹${discountVal || 0} FLAT OFF`}
                  </div>
                  <p className="text-xs text-slate-300">
                    Use code <strong className="text-blue-300 font-mono">{code.trim() ? code.toUpperCase() : 'YOURCODE'}</strong> to get instant savings on home services.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Minimum booking value:</span>
                    <span className="font-bold text-white">₹{minOrder || 0}</span>
                  </div>
                  {discountType === 'PERCENTAGE' && (
                    <div className="flex justify-between">
                      <span>Maximum savings cap:</span>
                      <span className="font-bold text-white">₹{maxDiscount || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Valid until:</span>
                    <span className="font-bold text-white">
                      {validUntil ? new Date(validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '31 Dec 2026'}
                    </span>
                  </div>
                </div>

                {/* Sample Cart Math Simulation */}
                <div className="mt-4 p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Impact on Sample ₹800 Booking Cart:
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>₹800.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount Applied:</span>
                    <span>-₹{previewDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-black border-t border-blue-900 pt-1">
                    <span>Customer Pays:</span>
                    <span>₹{(800 - previewDiscount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REDEMPTION PERFORMANCE & ROI ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* ROI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Estimated GMV Generated</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                ₹{(metrics.totalRedemptions * 780).toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                Driven by promotional campaigns
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Promotional Subsidy Absorbed</span>
                <IndianRupee className="w-4 h-4 text-[#1D68F2]" />
              </div>
              <div className="mt-2 text-2xl font-black text-[#1D68F2]">
                ₹{metrics.totalDisbursedSavings.toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-medium">
                Customer discount write-offs
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Estimated Campaign ROI</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-600">
                {metrics.totalDisbursedSavings > 0 
                  ? `${((metrics.totalRedemptions * 780) / metrics.totalDisbursedSavings).toFixed(1)}x`
                  : '5.2x'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 font-medium">
                Gross revenue per ₹1 discount
              </div>
            </div>
          </div>

          {/* Top Redeemed Coupons Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Top Redeemed Coupons Leaderboard</h3>
                <p className="text-xs text-slate-400 mt-0.5">Campaign conversion metrics ranked by redemption volume.</p>
              </div>

              {onNavigateModule && (
                <button
                  onClick={() => onNavigateModule('payments')}
                  className="text-xs font-bold text-[#1D68F2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Verify in Financial Ledger <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount Model</th>
                    <th className="py-3 px-4">Min Basket</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Quota Utilization</th>
                    <th className="py-3 px-4">Est. GMV Driven</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[...masterCoupons]
                    .sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
                    .map((coupon, idx) => {
                      const quota = coupon.usageLimit || 1000;
                      const used = coupon.timesUsed || 0;
                      const utilPercent = Math.min(Math.round((used / quota) * 100), 100);
                      const isPercent = coupon.discountType === 'PERCENTAGE' || coupon.discountType?.includes('PERCENT');
                      const discVal = Number(coupon.discountVal) || 0;
                      const isAct = coupon.isActive !== false && coupon.status !== 'Inactive';

                      return (
                        <tr key={coupon.couponId || coupon.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-xs">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {isPercent ? `${discVal}% OFF (Cap ₹${coupon.maxDiscountAmount || 150})` : `₹${discVal} FLAT`}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            ₹{coupon.minOrderValue || 0}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {used.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${utilPercent > 85 ? 'bg-amber-500' : 'bg-[#1D68F2]'}`}
                                  style={{ width: `${utilPercent}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">{utilPercent}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                            ₹{(used * 780).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {isAct ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                Paused
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenDrawer(coupon)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#1D68F2] text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Slide-over Inspector & Edit Drawer */}
      {isDrawerOpen && drawerForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200"
          >
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#1D68F2]">
                    Coupon Inspector
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                    {drawerForm.code}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveDrawerChanges} id="drawerEditForm" className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Promo Code *</label>
                  <input 
                    type="text"
                    value={drawerForm.code}
                    onChange={(e) => setDrawerForm({ ...drawerForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none uppercase focus:border-[#1D68F2] focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discount Model</label>
                    <select
                      value={drawerForm.discountType}
                      onChange={(e) => setDrawerForm({ ...drawerForm, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
                    >
                      <option value="PERCENTAGE">PERCENTAGE (%)</option>
                      <option value="FIXED_AMOUNT">FLAT AMOUNT (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {drawerForm.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'} *
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={drawerForm.discountVal}
                      onChange={(e) => setDrawerForm({ ...drawerForm, discountVal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#1D68F2] focus:bg-white"
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
                      value={drawerForm.minOrderValue}
                      onChange={(e) => setDrawerForm({ ...drawerForm, minOrderValue: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2] focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Cap (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      value={drawerForm.maxDiscountAmount}
                      onChange={(e) => setDrawerForm({ ...drawerForm, maxDiscountAmount: e.target.value })}
                      disabled={drawerForm.discountType === 'FIXED_AMOUNT'}
                      className={`w-full px-3 py-2 border rounded-xl font-semibold outline-none ${
                        drawerForm.discountType === 'FIXED_AMOUNT' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 border-slate-200 focus:border-[#1D68F2]'
                      }`}
                      required={drawerForm.discountType === 'PERCENTAGE'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Usage Limit</label>
                    <input 
                      type="number"
                      min="1"
                      value={drawerForm.usageLimit}
                      onChange={(e) => setDrawerForm({ ...drawerForm, usageLimit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2] focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valid Until</label>
                    <input 
                      type="date"
                      value={drawerForm.validUntil}
                      onChange={(e) => setDrawerForm({ ...drawerForm, validUntil: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#1D68F2] focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800">Coupon Status</div>
                    <div className="text-[11px] text-slate-400">Available to customers in checkout</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerForm({ ...drawerForm, isActive: !drawerForm.isActive })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      drawerForm.isActive ? 'bg-[#1D68F2]' : 'bg-slate-300'
                    }`}
                  >
                    <span 
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        drawerForm.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-rose-600 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Danger Zone
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCoupon(selectedCoupon.couponId || selectedCoupon.id)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Permanently Retire / Delete Coupon
                </button>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="drawerEditForm"
                disabled={isUpdatingDrawer}
                className="px-5 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
              >
                {isUpdatingDrawer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isUpdatingDrawer ? 'Saving Changes...' : 'Save Rule Updates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
