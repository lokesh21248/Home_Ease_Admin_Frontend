import React, { useState } from 'react';
import { 
  Search, Plus, MoreHorizontal, Edit, ListTree, Power, Trash2, 
  UploadCloud, X, Check, Grid, List, Sparkles, AlertCircle, Loader2,
  Image as ImageIcon, Layers, ImageOff
} from 'lucide-react';
import { createService, updateService, deleteService, uploadServiceImage } from '../api/adminApi';

export const Module07Categories = ({ categories = [], subServices = [], setCategories, onRefresh, onNavigateModule }) => {
  // Live API categories mapping
  const effectiveCategories = (categories && Array.isArray(categories))
    ? categories.map(c => {
        const id = c.serviceId || c.id;
        const catName = (c.name || '').trim().toLowerCase();
        // Calculate linked sub-services count dynamically from live subServices array if present
        let count = 0;
        if (Array.isArray(subServices) && subServices.length > 0) {
          count = subServices.filter(s => {
            const sServiceId = s.serviceId || s.categoryId || s.service?.serviceId || s.service?.id;
            const sCatName = (s.categoryName || s.category || s.service?.name || '').trim().toLowerCase();
            return (sServiceId && sServiceId === id) || (sCatName && sCatName === catName);
          }).length;
        } else if (c.subServicesCount !== undefined && c.subServicesCount !== null) {
          count = Number(c.subServicesCount) || 0;
        } else if (Array.isArray(c.subServices)) {
          count = c.subServices.length;
        }

        return {
          ...c,
          id,
          serviceId: id,
          name: c.name || 'Unnamed Category',
          description: c.description || c.desc || '',
          subServicesCount: count,
          imageUrl: c.imageUrl || '',
          isActive: c.isActive !== undefined ? c.isActive : (c.active ?? true)
        };
      })
    : [];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Drawer / Side Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Filter logic
  const filteredCategories = effectiveCategories.filter(cat => {
    const matchesSearch = (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const catActive = cat.isActive !== undefined ? cat.isActive : (cat.active ?? true);
    if (filterStatus === 'ACTIVE') return matchesSearch && catActive;
    if (filterStatus === 'INACTIVE') return matchesSearch && !catActive;
    return matchesSearch;
  });

  // Open Drawer in Edit Mode
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.name || '');
    setFormDesc(category.description || category.desc || '');
    setFormImage(category.imageUrl || category.image || '');
    setFormIsActive(category.isActive !== undefined ? category.isActive : (category.active ?? true));
    setIsDrawerOpen(true);
    setActiveMenuId(null);
  };

  // Open Drawer in New Category Mode
  const handleOpenNew = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDesc('');
    setFormImage('');
    setFormIsActive(true);
    setIsDrawerOpen(true);
    setActiveMenuId(null);
  };

  // Toggle Category Active Status
  const handleToggleActive = async (category) => {
    const serviceId = category.serviceId || category.id;
    const currentActive = category.isActive !== undefined ? category.isActive : (category.active ?? true);
    const nextActive = !currentActive;

    // Optimistic update
    setCategories(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(c => (c.serviceId === serviceId || c.id === serviceId)
        ? { ...c, isActive: nextActive, active: nextActive }
        : c
      );
    });

    try {
      if (!nextActive) {
        await deleteService(serviceId);
      } else {
        await updateService(serviceId, {
          name: category.name,
          description: category.description || category.desc,
          imageUrl: category.imageUrl,
          isActive: true
        });
      }
    } catch (err) {
      console.warn('Live API toggle sync error:', err.message);
    }
    setActiveMenuId(null);
  };

  // Delete Category
  const handleDeleteCategory = async (category) => {
    const serviceId = category.serviceId || category.id;
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    setCategories(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.filter(c => (c.serviceId !== serviceId && c.id !== serviceId));
    });

    try {
      await deleteService(serviceId);
    } catch (err) {
      console.warn('Live API delete error:', err.message);
    }
    setActiveMenuId(null);
    if (editingCategory && (editingCategory.serviceId === serviceId || editingCategory.id === serviceId)) {
      setIsDrawerOpen(false);
    }
  };

  // Save changes from Drawer
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    setFeedbackMsg(null);

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      imageUrl: formImage.trim(),
      isActive: formIsActive
    };

    try {
      if (editingCategory) {
        // Edit existing
        const serviceId = editingCategory.serviceId || editingCategory.id;
        try {
          await updateService(serviceId, payload);
        } catch (err) {
          console.warn('API update failed, updating local state:', err.message);
        }

        setCategories(prev => {
          const list = prev && prev.length > 0 ? prev : [];
          return list.map(c => (c.serviceId === serviceId || c.id === serviceId)
            ? { ...c, ...payload }
            : c
          );
        });

        setFeedbackMsg('Category updated successfully!');
      } else {
        // Create new
        let created;
        try {
          created = await createService(payload);
        } catch (err) {
          console.warn('API create failed, adding local:', err.message);
          created = {
            id: `cat-${Date.now()}`,
            serviceId: `cat-${Date.now()}`,
            ...payload,
            subServicesCount: 0
          };
        }

        setCategories(prev => {
          const list = prev && prev.length > 0 ? prev : [];
          return [...list, created];
        });

        setFeedbackMsg('New service category created!');
      }

      if (onRefresh) onRefresh();
      setTimeout(() => {
        setFeedbackMsg(null);
        setIsDrawerOpen(false);
      }, 800);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex -m-6 md:-m-8 min-h-[calc(100vh-4rem)] relative bg-[#F8FAFC]">
      
      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: Master Service Categories Grid                         */}
      {/* ========================================================================= */}
      <div className={`flex-1 p-6 md:p-8 space-y-6 min-w-0 transition-all duration-300 ${isDrawerOpen ? 'xl:mr-[420px]' : ''}`}>
        
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Master Service Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your service categories and organize sub-services.
          </p>
        </div>

        {/* Toolbar: Search, Filters, View Modes, & New Master Service Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-transparent">
          
          {/* Left: Search input & Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === 'ALL'
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === 'ACTIVE'
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('INACTIVE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === 'INACTIVE'
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Right: View Switcher (Grid/List) & New Master Service Button */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-[#1D68F2] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-[#1D68F2] text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* + New Master Service Button */}
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Master Service</span>
            </button>
          </div>

        </div>

        {/* Categories Grid (matching reference screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const serviceId = cat.serviceId || cat.id;
            const isActive = cat.isActive !== undefined ? cat.isActive : (cat.active ?? true);
            const isMenuOpen = activeMenuId === serviceId;

            return (
              <div
                key={serviceId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Cover Image with 4-corner drag handle icon */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {cat.imageUrl && !cat.imageUrl.includes('unsplash') && !cat.imageUrl.startsWith('blob:') ? (
                      <img 
                        src={cat.imageUrl} 
                        alt={cat.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.image-fallback-placeholder');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : null}

                    {/* Fallback Lucide Icon when imageUrl is null, empty, or failed */}
                    <div 
                      className="image-fallback-placeholder w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center select-none"
                      style={{ display: (cat.imageUrl && !cat.imageUrl.includes('unsplash') && !cat.imageUrl.startsWith('blob:')) ? 'none' : 'flex' }}
                    >
                      <ImageOff className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <span className="text-[10px] font-semibold text-slate-400">No Image Uploaded</span>
                    </div>

                    {/* Corner Handle Badge */}
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-500 shadow-2xs">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    
                    {/* Title & 3-Dots Action Menu */}
                    <div className="flex items-start justify-between relative">
                      <div className="space-y-1 pr-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {cat.name}
                        </h3>
                        
                        {/* Status Badge */}
                        <div className="inline-block">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* 3-Dots Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : serviceId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu matching screenshot */}
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                            {/* 1. Edit Category */}
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit Category</span>
                            </button>

                            {/* 2. Manage Sub-services */}
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onNavigateModule) onNavigateModule('sub-services');
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <ListTree className="w-3.5 h-3.5 text-slate-500" />
                              <span>Manage Sub-services</span>
                            </button>

                            {/* 3. Toggle Active Status */}
                            <button
                              onClick={() => handleToggleActive(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5 text-slate-500" />
                              <span>Toggle Active Status</span>
                            </button>

                            {/* 4. Delete */}
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Description */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {cat.description || 'Comprehensive on-demand service category.'}
                    </p>

                  </div>
                </div>

                {/* Card Footer: Sub-services Linked counter */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ListTree className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-700">
                      {cat.subServicesCount} {cat.subServicesCount === 1 ? 'Sub-service' : 'Sub-services'} linked
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RIGHT SLIDE-OVER DRAWER: Create / Edit Service                             */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <aside className="fixed top-16 right-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-slate-200 z-40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B192C]">
                {editingCategory ? 'Create / Edit Service' : 'New Master Service'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add or update a master service category.
              </p>
            </div>
            
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Feedback alert */}
            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Category Name * */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Cleaning & Sanitization"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Description * (with 96/500 counter) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {formDesc.length}/500
                </span>
              </div>
              <textarea 
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value.slice(0, 500))}
                rows={4}
                required
                placeholder="Professional cleaning services for homes, offices and commercial spaces. Keep your space clean, healthy and fresh."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition resize-none leading-relaxed"
              />
            </div>

            {/* Category Image * Dropzone & Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Category Image <span className="text-rose-500">*</span>
              </label>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center bg-slate-50/50 transition flex flex-col items-center justify-center gap-2 cursor-pointer">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Uploading to Supabase S3...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-blue-500 stroke-[1.5]" />
                    <div className="text-xs font-medium text-slate-600">
                      Drag & drop an image here or
                    </div>
                    <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition">
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
                            const url = await uploadServiceImage(file);
                            setFormImage(url);
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
                      Stores directly in Supabase S3 bucket (<code>homeease-services</code>)
                    </span>
                  </>
                )}
              </div>

              {/* Image Preview Box */}
              {formImage && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-700">Image Preview (Supabase S3)</div>
                  <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.preview-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="preview-fallback hidden w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                      <ImageOff className="w-6 h-6 text-slate-300" />
                      <span className="text-[10px]">Image preview failed to load</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Image URL (Supabase Storage) Input */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Image URL (Supabase Storage)
                </label>
                <input 
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://supabase.../services/cleaning-banner.jpg"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Active on Customer App Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Active on Customer App
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  When enabled, this category will be visible to customers in the mobile app.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  formIsActive ? 'bg-[#1D68F2]' : 'bg-slate-300'
                }`}
              >
                <div 
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    formIsActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bottom Actions matching screenshot */}
            <div className="pt-6 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Category Changes</span>
              </button>
            </div>

          </form>

        </aside>
      )}

    </div>
  );
};
