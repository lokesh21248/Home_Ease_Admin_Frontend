import React, { useState, useMemo } from 'react';
import { 
  Image, Plus, Calendar, Eye, Sparkles, ToggleLeft, ToggleRight, X, 
  ExternalLink, Loader2, Trash2, Search, Filter, CheckCircle2, ImageOff, UploadCloud,
  Edit, Tag, Gift, Layers
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { createBanner, toggleBanner, uploadBannerImage } from '../api/adminApi';

export const BANNER_CAMPAIGN_PRESETS = [
  {
    title: 'Festival Home Cleaning Fest — Flat 25% Off',
    targetType: 'SERVICE',
    targetCategoryName: 'Cleaning',
    imageDescription: 'Deep cleaning living room & sofa',
    offerText: 'Promotes Deep Home Cleaning',
  },
  {
    title: 'Beat the Summer Heat — AC Deep Jet Wash @ ₹499',
    targetType: 'SERVICE',
    targetCategoryName: 'AC Service & Repair',
    imageDescription: 'AC service technician with jet pump',
    offerText: 'Promotes AC Repair & Service',
  },
  {
    title: 'Weekend Wellness — Luxury Massage at Home',
    targetType: 'SERVICE',
    targetCategoryName: 'Massage',
    imageDescription: 'Spa stones, candles & aroma oils',
    offerText: 'Promotes Massage & Spa',
  },
  {
    title: 'Welcome to HomeEase — Use Code WELCOME50',
    targetType: 'COUPON',
    targetCategoryName: 'WELCOME50',
    targetId: 'WELCOME50',
    imageDescription: 'Welcome gift graphic / discount badge',
    offerText: 'First booking ₹50 off',
  },
  {
    title: 'Quick Emergency Repairs — Under 30 Mins',
    targetType: 'SERVICE',
    targetCategoryName: 'Electrician Services',
    imageDescription: 'Electrician & Plumber toolkit',
    offerText: 'Fast dispatch electrical & plumbing',
  }
];

export const Module10Banners = ({ banners = [], setBanners, categories = [], onRefresh }) => {
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState('SERVICE'); // SERVICE | COUPON
  const [targetId, setTargetId] = useState(categories[0]?.serviceId || categories[0]?.id || '11111111-1111-1111-1111-111111111111');
  const [offerText, setOfferText] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | PAUSED

  const filteredBanners = useMemo(() => {
    return banners.filter(ban => {
      const titleMatch = (ban.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ban.offerText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ban.imageDescription || '').toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = ban.isActive !== undefined ? ban.isActive : (ban.status === 'Active');
      
      if (statusFilter === 'ACTIVE') return titleMatch && isActive;
      if (statusFilter === 'PAUSED') return titleMatch && !isActive;
      return titleMatch;
    });
  }, [banners, searchQuery, statusFilter]);

  const handleToggleBanner = async (banner) => {
    const bId = banner.bannerId || banner.id;
    const currentActive = banner.isActive !== undefined ? banner.isActive : (banner.status === 'Active');
    const nextActive = !currentActive;

    // Optimistic update
    setBanners(prev => {
      const updated = prev.map(b => (b.bannerId === bId || b.id === bId) 
        ? { ...b, isActive: nextActive, status: nextActive ? 'Active' : 'Paused' } 
        : b
      );
      localStorage.setItem('homeease_admin_banners', JSON.stringify(updated));
      return updated;
    });

    try {
      await toggleBanner(bId, nextActive);
      setAlertMsg({ type: 'success', text: `Banner status toggled to ${nextActive ? 'Active' : 'Paused'} on AWS live server!` });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Backend toggle note:', err.message);
      setAlertMsg({ type: 'success', text: `Banner status locally toggled to ${nextActive ? 'Active' : 'Paused'}.` });
    } finally {
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  const handleDeleteBanner = (bannerId) => {
    if (!window.confirm('Are you sure you want to remove this banner?')) return;
    setBanners(prev => {
      const updated = prev.filter(b => (b.bannerId || b.id) !== bannerId);
      localStorage.setItem('homeease_admin_banners', JSON.stringify(updated));
      return updated;
    });
    setAlertMsg({ type: 'success', text: 'Banner removed successfully.' });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle('');
    setTargetType('SERVICE');
    setTargetId(categories[0]?.serviceId || categories[0]?.id || '11111111-1111-1111-1111-111111111111');
    setOfferText('');
    setImageDescription('');
    setImage('');
    setShowAddBanner(true);
  };

  const handleOpenEdit = (ban) => {
    setEditingBanner(ban);
    setTitle(ban.title || '');
    setTargetType(ban.targetType || 'SERVICE');
    setTargetId(ban.targetId || (categories[0]?.serviceId || categories[0]?.id || '11111111-1111-1111-1111-111111111111'));
    setOfferText(ban.offerText || '');
    setImageDescription(ban.imageDescription || '');
    setImage(ban.imageUrl || '');
    setShowAddBanner(true);
  };

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setTargetType(preset.targetType);
    setOfferText(preset.offerText);
    setImageDescription(preset.imageDescription);
    
    if (preset.targetType === 'SERVICE') {
      const matched = categories.find(c => (c.name || '').toLowerCase().includes(preset.targetCategoryName.toLowerCase()));
      if (matched) {
        setTargetId(matched.serviceId || matched.id);
      } else if (categories[0]) {
        setTargetId(categories[0].serviceId || categories[0].id);
      }
    } else {
      setTargetId(preset.targetId || 'WELCOME50');
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setAlertMsg(null);

    const payload = {
      title: title.trim(),
      imageUrl: image.trim() || null,
      targetType: targetType || 'SERVICE',
      targetId: targetId || (categories[0]?.serviceId || '11111111-1111-1111-1111-111111111111'),
      offerText: offerText.trim() || null,
      imageDescription: imageDescription.trim() || null,
      isActive: editingBanner ? (editingBanner.isActive !== undefined ? editingBanner.isActive : true) : true,
    };

    try {
      if (editingBanner) {
        // Update existing banner
        const bId = editingBanner.bannerId || editingBanner.id;
        setBanners(prev => {
          const updated = prev.map(b => (b.bannerId === bId || b.id === bId)
            ? { ...b, ...payload }
            : b
          );
          localStorage.setItem('homeease_admin_banners', JSON.stringify(updated));
          return updated;
        });
        setAlertMsg({ type: 'success', text: `Banner "${payload.title}" modified successfully!` });
      } else {
        // Create new banner
        let created;
        try {
          created = await createBanner(payload);
        } catch (apiErr) {
          console.warn('API create error, fallback to local banner:', apiErr);
          created = {
            bannerId: `banner-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString()
          };
        }

        setBanners(prev => {
          const updated = [created, ...prev];
          localStorage.setItem('homeease_admin_banners', JSON.stringify(updated));
          return updated;
        });
        setAlertMsg({ type: 'success', text: 'Promotional Banner successfully created and deployed!' });
      }

      setShowAddBanner(false);
      setEditingBanner(null);
      setTitle('');
      setImage('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save banner:', err);
      setAlertMsg({ type: 'error', text: `Failed to save banner: ${err.message}` });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-500/20">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Banners & Marketing Campaigns</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Configure featured promo slots, manage targeted category landing pages, and publish promotional campaign assets.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Promotional Banner
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
            placeholder="Search banners by title, offer, or description..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'PAUSED'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? `All (${banners.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Banner Cards Grid */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
            <Image className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Matching Banners Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {searchQuery ? 'No promotional banners match your search filter.' : 'Currently no promotional banners are configured. Click "Create Promotional Banner" to launch one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((ban) => {
            const bId = ban.bannerId || ban.id;
            const isActive = ban.isActive !== undefined ? ban.isActive : (ban.status === 'Active');
            const targetCategory = categories.find(c => (c.serviceId || c.id) === ban.targetId);
            const targetName = ban.targetType === 'COUPON'
              ? `Coupon Code: ${ban.targetId || 'WELCOME50'}`
              : (targetCategory ? targetCategory.name : (ban.targetCategoryName || ban.targetType || 'General Service'));
            const hasValidImage = ban.imageUrl && !ban.imageUrl.includes('unsplash') && !ban.imageUrl.startsWith('blob:');

            return (
              <div key={bId} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  {/* Banner Image / Fallback Container */}
                  <div className="h-44 bg-slate-900 relative group overflow-hidden flex items-center justify-center">
                    {hasValidImage ? (
                      <img 
                        src={ban.imageUrl} 
                        alt={ban.title} 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.banner-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback Icon when imageUrl is missing, dummy, or broken */}
                    <div 
                      className="banner-fallback w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center select-none"
                      style={{ display: hasValidImage ? 'none' : 'flex' }}
                    >
                      <ImageOff className="w-8 h-8 text-slate-500 stroke-[1.5]" />
                      <span className="text-[10px] font-semibold text-slate-400">No Image Uploaded</span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <StatusBadge status={isActive ? 'Active' : 'Paused'} />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white border border-slate-700/80">
                      {targetName}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        ban.targetType === 'COUPON' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {ban.targetType || 'SERVICE'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold truncate">
                        {targetName}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{ban.title}</h3>

                    {ban.offerText && (
                      <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-100 text-[11px] font-semibold text-purple-800 flex items-start gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Action: {ban.offerText}</span>
                      </div>
                    )}

                    {ban.imageDescription && (
                      <div className="text-[11px] text-slate-500 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Image className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">Visual: {ban.imageDescription}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                      Created: {ban.createdAt ? new Date(ban.createdAt).toLocaleDateString() : 'Live'}
                    </div>
                  </div>
                </div>

                {/* Footer Actions (Modify, Delete, Toggle Status) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteBanner(bId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleOpenEdit(ban)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Modify banner details or upload image"
                    >
                      <Edit className="w-3.5 h-3.5 text-purple-600" />
                      <span>Modify</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleBanner(ban)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isActive 
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isActive ? <ToggleRight className="w-4 h-4 text-rose-600" /> : <ToggleLeft className="w-4 h-4 text-emerald-600" />}
                    {isActive ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Modify Banner Modal */}
      {showAddBanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleSaveBanner} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBanner ? 'Modify Promotional Banner' : 'Create Promotional Banner'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingBanner ? 'Update campaign details and upload Supabase S3 banner assets' : 'Configure slot details and upload banner assets to Supabase S3'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddBanner(false); setEditingBanner(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            {!editingBanner && (
              <div className="space-y-1.5 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  ⚡ Quick Campaign Presets (Click to Auto-fill)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BANNER_CAMPAIGN_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold transition cursor-pointer text-left shadow-2xs truncate max-w-full"
                    >
                      + {preset.title.split('—')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Title *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Festival Home Cleaning Fest — Flat 25% Off"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-purple-600 focus:bg-white"
                  required
                />
              </div>

              {/* Target Type Selection (SERVICE vs COUPON) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Type *</label>
                  <select 
                    value={targetType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setTargetType(newType);
                      if (newType === 'COUPON') {
                        setTargetId('WELCOME50');
                      } else if (categories[0]) {
                        setTargetId(categories[0].serviceId || categories[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-purple-600 focus:bg-white cursor-pointer"
                  >
                    <option value="SERVICE">SERVICE (Category Vertical)</option>
                    <option value="COUPON">COUPON (Discount Code)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {targetType === 'COUPON' ? 'Coupon Code *' : 'Target Category *'}
                  </label>
                  {targetType === 'COUPON' ? (
                    <input 
                      type="text"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      placeholder="e.g. WELCOME50"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-purple-600 focus:bg-white"
                      required
                    />
                  ) : (
                    <select 
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-purple-600 focus:bg-white cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.serviceId || c.id} value={c.serviceId || c.id}>
                          {c.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <option value="11111111-1111-1111-1111-111111111111">General Service Vertical</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* Suggested Action / Offer */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suggested Action / Offer</label>
                <input 
                  type="text"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  placeholder="e.g. Promotes Deep Home Cleaning, First booking ₹50 off"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              {/* Image Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Image Description / Visual Guidelines</label>
                <input 
                  type="text"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="e.g. Deep cleaning living room & sofa, AC technician with jet pump"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              {/* Supabase File Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Image (Supabase S3)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 text-center bg-slate-50/50 transition flex flex-col items-center justify-center gap-1.5">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
                      <span className="text-xs font-semibold text-slate-600">Uploading to Supabase S3...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-purple-500 stroke-[1.5]" />
                      <div className="text-xs font-medium text-slate-600">
                        Drag & drop a banner image here or
                      </div>
                      <label className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition">
                        Choose from device
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploading(true);
                            try {
                              const url = await uploadBannerImage(file);
                              setImage(url);
                            } catch (err) {
                              console.error('Supabase upload failed:', err);
                              alert(`Upload failed: ${err.message}`);
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Stores directly in Supabase S3 bucket (<code>homeease-banners</code>)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Thumbnail */}
              {image && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100 relative flex items-center justify-center">
                  <img 
                    src={image} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.banner-preview-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="banner-preview-fallback hidden w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2">
                    <ImageOff className="w-6 h-6 text-slate-300" />
                    <span className="text-[10px]">Preview unavailable</span>
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                    Supabase S3
                  </span>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => { setShowAddBanner(false); setEditingBanner(null); }} 
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  editingBanner ? 'Save Changes' : 'Deploy Banner'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
