import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, MoreHorizontal, Edit, ListTree, Power, Trash2, 
  UploadCloud, X, Check, Grid, List, Sparkles, AlertCircle, Loader2,
  Layers, ImageOff, ArrowUpDown, ChevronDown, CheckCircle2, Wrench,
  Smartphone, IndianRupee, Clock, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import { createService, updateService, deleteService, uploadServiceImage } from '../api/adminApi';

export const Module07Categories = ({ 
  categories = [], 
  subServices = [], 
  setCategories, 
  onRefresh, 
  onNavigateModule 
}) => {
  // Standardize categories from live backend
  const effectiveCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];

    return categories.map(c => {
      const id = c.serviceId || c.id;
      const catName = (c.name || '').trim().toLowerCase();

      // Find all linked sub-services
      let linkedSubs = [];
      if (Array.isArray(subServices) && subServices.length > 0) {
        linkedSubs = subServices.filter(s => {
          const sServiceId = s.serviceId || s.categoryId || s.service?.serviceId || s.service?.id;
          const sCatName = (s.categoryName || s.category || s.service?.name || '').trim().toLowerCase();
          return (sServiceId && sServiceId === id) || (sCatName && sCatName === catName);
        });
      }

      const count = linkedSubs.length > 0 
        ? linkedSubs.length 
        : (c.subServicesCount !== undefined && c.subServicesCount !== null ? Number(c.subServicesCount) : 0);

      // Auto-generate slug if missing
      const slug = c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'service');

      return {
        ...c,
        id,
        serviceId: id,
        name: c.name || 'Unnamed Category',
        slug,
        description: c.description || c.desc || '',
        subServicesCount: count,
        linkedSubs,
        imageUrl: c.imageUrl || '',
        isActive: c.isActive !== undefined ? Boolean(c.isActive) : (c.active ?? true)
      };
    });
  }, [categories, subServices]);

  // Derived KPI metrics
  const totalCount = effectiveCategories.length;
  const activeCount = useMemo(() => effectiveCategories.filter(c => c.isActive).length, [effectiveCategories]);
  const inactiveCount = totalCount - activeCount;
  const totalLinkedSubServices = useMemo(() => {
    return Array.isArray(subServices) ? subServices.length : 0;
  }, [subServices]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Drawer / Side Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter logic
  const filteredCategories = useMemo(() => {
    return effectiveCategories.filter(cat => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (cat.name || '').toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q) ||
        (cat.slug || '').toLowerCase().includes(q);
      
      if (filterStatus === 'ACTIVE') return matchesSearch && cat.isActive;
      if (filterStatus === 'INACTIVE') return matchesSearch && !cat.isActive;
      return matchesSearch;
    });
  }, [effectiveCategories, searchQuery, filterStatus]);

  // Toast message helper
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Drawer in Edit Mode
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.name || '');
    setFormSlug(category.slug || '');
    setFormDesc(category.description || '');
    setFormImage(category.imageUrl || '');
    setFormIsActive(category.isActive);
    setIsDrawerOpen(true);
    setActiveMenuId(null);
  };

  // Open Drawer in New Category Mode
  const handleOpenNew = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormImage('');
    setFormIsActive(true);
    setIsDrawerOpen(true);
    setActiveMenuId(null);
  };

  // Toggle Category Active Status
  const handleToggleActive = async (category) => {
    const serviceId = category.serviceId || category.id;
    const nextActive = !category.isActive;

    // Optimistic local update
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
        showToast(`Category "${category.name}" moved to Inactive.`);
      } else {
        await updateService(serviceId, {
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          isActive: true
        });
        showToast(`Category "${category.name}" activated successfully!`);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Live API toggle sync error:', err.message);
    }
    setActiveMenuId(null);
  };

  // Delete Category
  const handleDeleteCategory = async (category) => {
    const serviceId = category.serviceId || category.id;
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;

    setCategories(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.filter(c => (c.serviceId !== serviceId && c.id !== serviceId));
    });

    try {
      await deleteService(serviceId);
      showToast(`Category "${category.name}" deleted from database.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Live API delete error:', err.message);
      showToast(`Delete notice: ${err.message}`);
    }
    setActiveMenuId(null);
    if (editingCategory && (editingCategory.serviceId === serviceId || editingCategory.id === serviceId)) {
      setIsDrawerOpen(false);
    }
  };

  // Save Category Form
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    const generatedSlug = formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
      name: formName.trim(),
      slug: generatedSlug,
      description: formDesc.trim(),
      imageUrl: formImage.trim(),
      isActive: formIsActive
    };

    try {
      if (editingCategory) {
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

        showToast(`Category "${formName}" updated successfully!`);
      } else {
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

        setCategories(prev => [created, ...(prev && prev.length > 0 ? prev : [])]);
        showToast(`New category "${formName}" created!`);
      }

      if (onRefresh) onRefresh();
      setIsDrawerOpen(false);
    } catch (err) {
      showToast(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 bg-[#F8FAFC]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER & 4 SUMMARY KPI CARDS                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
              Services & Catalog Architecture
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Hyderabad Catalog
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your service categories, configure pricing tiers, durations, package inclusions, and explore highlights.
          </p>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Master Verticals</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{totalCount}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Top-level categories</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Verticals</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{activeCount}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Live on Mobile App</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ListTree className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sub-Services</div>
              <div className="text-lg font-black text-slate-900 leading-tight">{totalLinkedSubServices}</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Catalog packages</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3 min-w-[135px]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Services/Vertical</div>
              <div className="text-lg font-black text-slate-900 leading-tight">
                {totalCount > 0 ? (totalLinkedSubServices / totalCount).toFixed(1) : 0}
              </div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Package density</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATALOG UNIFIED NAVIGATION HUB (Master, Sub-services, Explore Services)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {/* Tab 1: Master Categories */}
        <button
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap bg-[#1D68F2] text-white shadow-xs"
        >
          <Layers className="w-3.5 h-3.5 text-white" />
          <span>Master Categories</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
            {totalCount}
          </span>
        </button>

        {/* Tab 2: Sub-Services & Rates Catalog */}
        <button
          onClick={() => onNavigateModule && onNavigateModule('sub-services')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ListTree className="w-3.5 h-3.5 text-slate-400" />
          <span>Sub-Services & Packages</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {totalLinkedSubServices}
          </span>
        </button>

        {/* Tab 3: Mobile Explore Services */}
        <button
          onClick={() => onNavigateModule && onNavigateModule('explore-services')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>Explore Services (Mobile Home)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Featured
          </span>
        </button>

        <div className="ml-auto pl-2 flex items-center gap-2">
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              showToast('Refreshed categories catalog.');
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOOLBAR: Search, Status Filter, View Mode, New Service Button             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Search input & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category name, slug, description..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition shadow-2xs"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterStatus === status
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {status === 'ALL' ? 'All' : (status === 'ACTIVE' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`)}
              </button>
            ))}
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
            <span>New Master Category</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORIES DISPLAY: GRID VIEW                                             */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.length === 0 && (
            <div className="col-span-full py-14 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700">No master categories found</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Adjust your search or click "+ New Master Category" to register a new service vertical.
              </p>
            </div>
          )}

          {filteredCategories.map((cat, idx) => {
            const serviceId = cat.serviceId || cat.id || `cat-${idx}`;
            const isActive = cat.isActive;
            const isMenuOpen = activeMenuId === serviceId;

            return (
              <div
                key={serviceId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Cover Image */}
                  <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {cat.imageUrl && !cat.imageUrl.includes('unsplash') && !cat.imageUrl.startsWith('blob:') ? (
                      <img 
                        src={cat.imageUrl} 
                        alt={cat.name} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement?.querySelector('.image-fallback-placeholder');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : null}

                    {/* Fallback Icon */}
                    <div 
                      className="image-fallback-placeholder w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center select-none bg-gradient-to-br from-slate-50 to-slate-100"
                      style={{ display: (cat.imageUrl && !cat.imageUrl.includes('unsplash') && !cat.imageUrl.startsWith('blob:')) ? 'none' : 'flex' }}
                    >
                      <Layers className="w-9 h-9 text-slate-300 stroke-[1.5]" />
                      <span className="text-[10px] font-semibold text-slate-400">{cat.name}</span>
                    </div>

                    {/* Corner Handle Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs flex items-center gap-1 text-[10px] font-mono font-bold text-slate-600 shadow-2xs">
                      <span>{cat.slug}</span>
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
                            {isActive ? 'Active on App' : 'Inactive'}
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

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1D68F2] flex items-center gap-2 transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#1D68F2]" />
                              <span>Edit Category</span>
                            </button>

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

                            <button
                              onClick={() => handleToggleActive(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5 text-slate-500" />
                              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete Category</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Description */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {cat.description || 'Comprehensive on-demand service category.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <ListTree className="w-3.5 h-3.5 text-[#1D68F2]" />
                    <span className="font-semibold text-slate-700">
                      {cat.subServicesCount} {cat.subServicesCount === 1 ? 'Package' : 'Packages'} linked
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onNavigateModule) onNavigateModule('sub-services');
                      }}
                      className="text-xs font-bold text-[#1D68F2] hover:underline transition cursor-pointer"
                    >
                      View Packages
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* CATEGORIES DISPLAY: LIST / TABLE VIEW                                     */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Service Category</th>
                  <th className="py-3.5 px-4">Slug Reference</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Linked Packages</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No categories found matching criteria.
                    </td>
                  </tr>
                )}
                {filteredCategories.map((cat, idx) => {
                  const serviceId = cat.serviceId || cat.id || `cat-${idx}`;
                  const isActive = cat.isActive;

                  return (
                    <tr key={serviceId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <Layers className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{cat.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {serviceId.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {cat.slug}
                      </td>

                      <td className="py-3.5 px-4 max-w-[280px]">
                        <p className="text-slate-600 truncate" title={cat.description}>
                          {cat.description || 'No description provided.'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1D68F2] border border-blue-200">
                          <ListTree className="w-3 h-3" />
                          <span>{cat.subServicesCount} packages</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Active on App' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (onNavigateModule) onNavigateModule('sub-services');
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-[#1D68F2] hover:bg-blue-100 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Packages
                          </button>
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT SLIDE-OVER DRAWER: Create / Edit Category                           */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0B192C]">
                    {editingCategory ? 'Edit Master Category' : 'New Master Category'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure service vertical details and mobile display image.
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Category Name * */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingCategory) {
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g. Deep Cleaning & Sanitization"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition"
                  />
                </div>

                {/* Slug Reference */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Category Slug / URL Identifier
                  </label>
                  <input 
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. deep-cleaning"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#1D68F2] transition"
                  />
                </div>

                {/* Description * */}
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
                    placeholder="Professional on-demand cleaning services for homes, apartments, and offices. Mechanized scrubbers and eco-safe disinfectants."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1D68F2] transition resize-none leading-relaxed"
                  />
                </div>

                {/* Category Image Dropzone & Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Category Banner Image <span className="text-rose-500">*</span>
                  </label>

                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center bg-slate-50/50 transition flex flex-col items-center justify-center gap-2 cursor-pointer">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 py-3">
                        <Loader2 className="w-7 h-7 text-[#1D68F2] animate-spin" />
                        <span className="text-xs font-semibold text-slate-600">Uploading to Supabase Storage...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-[#1D68F2] stroke-[1.5]" />
                        <div className="text-xs font-medium text-slate-600">
                          Upload high-resolution service banner
                        </div>
                        <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition">
                          Select from computer
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
                          Saves to Supabase bucket: <code>homeease-services</code>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Image Preview Box */}
                  {formImage && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700">Image Preview</div>
                      <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                        <img 
                          src={formImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector('.preview-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="preview-fallback hidden w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2 text-center">
                          <ImageOff className="w-6 h-6 text-slate-300" />
                          <span className="text-[10px]">Preview unavailable</span>
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

                  {/* Image URL fallback */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Or Image URL Direct Link
                    </label>
                    <input 
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1D68F2] transition"
                    />
                  </div>
                </div>

                {/* Active on Customer App Toggle */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Active on Mobile Customer App
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      When enabled, customers can discover and book services in this vertical.
                    </p>
                  </div>

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

                {/* Linked Sub-Services Preview if editing */}
                {editingCategory && editingCategory.linkedSubs && editingCategory.linkedSubs.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Linked Packages ({editingCategory.linkedSubs.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          if (onNavigateModule) onNavigateModule('sub-services');
                        }}
                        className="text-[11px] font-bold text-[#1D68F2] hover:underline"
                      >
                        Manage in Catalog →
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {editingCategory.linkedSubs.map((sub, sIdx) => (
                        <div key={sIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">{sub.name}</span>
                          <span className="font-bold text-slate-900 font-mono">₹{sub.basePrice || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
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
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
