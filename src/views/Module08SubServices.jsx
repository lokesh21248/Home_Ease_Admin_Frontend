import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Clock, UploadCloud, X, Check, 
  IndianRupee, Package, Layers, ChevronDown, ChevronLeft, ChevronRight, Loader2, ImageOff,
  RotateCcw, AlertCircle, Smartphone
} from 'lucide-react';
import { createSubService, updateSubService, deleteSubService, uploadSubServiceImage } from '../api/adminApi';

export const Module08SubServices = ({ 
  subServices = [], 
  setSubServices, 
  categories = [], 
  onRefresh,
  onNavigateModule 
}) => {
  // Live API sub-services mapping
  const effectiveSubServices = (subServices && Array.isArray(subServices))
    ? subServices.map(s => ({
        ...s,
        id: s.subServiceId || s.id,
        subServiceId: s.subServiceId || s.id,
        name: s.name || 'Unnamed Sub-Service',
        description: s.description || '',
        categoryName: s.service?.name || s.categoryName || 'General',
        basePrice: s.basePrice || 0,
        unitLabel: s.unitLabel || 'per service',
        estimatedMins: s.estimatedMins || 60,
        pricingType: s.pricingType || 'FIXED',
        imageUrl: s.imageUrl || '',
        imageFileName: s.imageFileName || '',
        imageMeta: s.imageMeta || '',
        isActive: s.isActive !== undefined ? Boolean(s.isActive) : true
      }))
    : [];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE' | 'ALL'
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [tableFeedback, setTableFeedback] = useState(null);

  // Drawer / Side Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  
const UNIT_PRESETS = [
  'per session',
  'per person',
  'per visit',
  'per hour',
  'per job',
  'per service',
  'per bathroom',
  'per kitchen',
  'per room',
  'per sofa',
  'per machine',
  'per tap',
  'per appliance'
];

  // Drawer form state
  const [formCategory, setFormCategory] = useState(categories[0]?.name || '');
  const [formName, setFormName] = useState('');
  const [formBasePrice, setFormBasePrice] = useState(0);
  const [formUnitLabel, setFormUnitLabel] = useState('per session');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [formDuration, setFormDuration] = useState(60);
  const [formPricingType, setFormPricingType] = useState('FIXED');
  const [formImage, setFormImage] = useState('');
  const [formImageFileName, setFormImageFileName] = useState('');
  const [formImageMeta, setFormImageMeta] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Available Category Options from Live Backend (deduplicated by name)
  const categoryOptions = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return Array.from(new Set(categories.map(c => c?.name?.trim()).filter(Boolean)));
  }, [categories]);

  // Feedback toast helper
  const showFeedback = (type, text) => {
    setTableFeedback({ type, text });
    setTimeout(() => {
      setTableFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Status counts for badge tabs
  const activeCount = useMemo(() => effectiveSubServices.filter(s => s.isActive !== false).length, [effectiveSubServices]);
  const inactiveCount = useMemo(() => effectiveSubServices.filter(s => s.isActive === false).length, [effectiveSubServices]);
  const totalCount = effectiveSubServices.length;

  // Filter logic (respects Category, Search, AND Active/Inactive Status)
  const filteredSubs = useMemo(() => {
    return effectiveSubServices.filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat = selectedCategoryFilter === 'ALL' || item.categoryName === selectedCategoryFilter;
      
      const itemActive = item.isActive !== false;
      const matchesStatus = 
        filterStatus === 'ALL' ? true :
        filterStatus === 'ACTIVE' ? itemActive :
        !itemActive;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [effectiveSubServices, searchQuery, selectedCategoryFilter, filterStatus]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds([]);
  }, [searchQuery, selectedCategoryFilter, filterStatus]);

  // Paginated records for table view
  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSubs.slice(start, start + pageSize);
  }, [filteredSubs, safeCurrentPage, pageSize]);

  // Open Drawer in Edit Mode
  const handleOpenEdit = (item) => {
    setEditingSub(item);
    setFormCategory(item.categoryName || categoryOptions[0]);
    setFormName(item.name || '');
    setFormBasePrice(item.basePrice || 499);
    const unit = item.unitLabel || 'per session';
    setFormUnitLabel(unit);
    setIsCustomUnit(!UNIT_PRESETS.includes(unit));
    setFormDuration(item.estimatedMins || 60);
    setFormPricingType(item.pricingType || 'FIXED');
    setFormImage(item.imageUrl || '');
    setFormImageFileName(item.imageFileName || 'service-image.jpg');
    setFormImageMeta(item.imageMeta || 'JPG • 640x360 • 124 KB');
    setFormIsActive(item.isActive !== undefined ? item.isActive : true);
    setIsDrawerOpen(true);
  };

  // Open Drawer in New Mode
  const handleOpenNew = () => {
    setEditingSub(null);
    const initialCat = (selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : categoryOptions[0]) || '';
    const isMassage = initialCat.toLowerCase().includes('massage') || initialCat.toLowerCase().includes('spa');
    setFormCategory(initialCat);
    setFormName('');
    setFormBasePrice(499);
    setFormUnitLabel(isMassage ? 'per session' : 'per session');
    setIsCustomUnit(false);
    setFormDuration(60);
    setFormPricingType('FIXED');
    setFormImage('');
    setFormImageFileName('');
    setFormImageMeta('');
    setFormIsActive(true);
    setIsDrawerOpen(true);
  };

  // Toggle Active on Row (persisted to live backend)
  const handleToggleRowActive = async (item) => {
    const id = item.subServiceId || item.id;
    const currentActive = item.isActive !== false;
    const nextActive = !currentActive;

    // Optimistic local state update
    setSubServices(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      return list.map(s => {
        const matchId = s.subServiceId || s.id;
        if (matchId === id) {
          return { ...s, isActive: nextActive };
        }
        return s;
      });
    });

    try {
      if (!nextActive) {
        await deleteSubService(id);
        showFeedback('success', `"${item.name}" deactivated and archived.`);
      } else {
        const parentCat = categories.find(c => c.name === item.categoryName || c.serviceId === item.serviceId);
        const parentId = parentCat?.serviceId || parentCat?.id || item.serviceId || item.service?.serviceId;
        await updateSubService(id, {
          name: item.name,
          pricingType: item.pricingType || 'FIXED',
          basePrice: item.basePrice || 0,
          unitLabel: item.unitLabel || 'per service',
          estimatedMins: item.estimatedMins || 60,
          imageUrl: item.imageUrl || '',
          isActive: true,
          ...(parentId ? { service: { serviceId: parentId } } : {})
        });
        showFeedback('success', `"${item.name}" restored and activated!`);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Status toggle error:', err.message);
      // Revert optimistic update
      setSubServices(prev => {
        const list = prev && prev.length > 0 ? prev : [];
        return list.map(s => {
          const matchId = s.subServiceId || s.id;
          if (matchId === id) {
            return { ...s, isActive: currentActive };
          }
          return s;
        });
      });
      showFeedback('error', `Failed to update status: ${err.message}`);
    }
  };

  // Delete Row (soft deactivates or permanently purges)
  const handleDeleteRow = async (item, hard = false) => {
    const id = item.subServiceId || item.id;
    const confirmMsg = hard
      ? `Are you sure you want to PERMANENTLY delete "${item.name}"? This will purge it completely from the database.`
      : `Are you sure you want to deactivate "${item.name}"? This sub-service will be moved to Inactive / Archived.`;

    if (!window.confirm(confirmMsg)) return;

    // Optimistically update local state so row immediately reflects the action
    setSubServices(prev => {
      const list = prev && prev.length > 0 ? prev : [];
      if (hard) {
        return list.filter(s => (s.subServiceId || s.id) !== id);
      }
      return list.map(s => {
        const matchId = s.subServiceId || s.id;
        if (matchId === id) {
          return { ...s, isActive: false };
        }
        return s;
      });
    });

    try {
      await deleteSubService(id, hard);
      showFeedback('success', hard ? `"${item.name}" permanently deleted from database!` : `"${item.name}" deactivated and archived.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Backend delete error:', err.message);
      // Revert on error
      if (onRefresh) onRefresh();
      showFeedback('error', `Failed to delete: ${err.message}`);
    }
  };

  // Checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredSubs.map(s => s.subServiceId || s.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Save changes from drawer
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    setFeedbackMsg(null);

    const parentCat = categories.find(c => c.name === formCategory || c.id === formCategory || c.serviceId === formCategory);
    const parentServiceId = parentCat ? (parentCat.serviceId || parentCat.id) : null;

    const payload = {
      name: formName.trim(),
      categoryName: parentCat ? parentCat.name : formCategory,
      serviceId: parentServiceId,
      categoryId: parentServiceId,
      service: parentCat ? { serviceId: parentServiceId, name: parentCat.name } : null,
      basePrice: Number(formBasePrice),
      unitLabel: formUnitLabel,
      estimatedMins: Number(formDuration),
      pricingType: formPricingType,
      imageUrl: formImage,
      imageFileName: formImageFileName,
      imageMeta: formImageMeta,
      isActive: formIsActive
    };

    try {
      if (editingSub) {
        // Edit existing via API
        const subId = editingSub.subServiceId || editingSub.id;
        try {
          if (parentServiceId) {
            await updateSubService(subId, {
              service: { serviceId: parentServiceId },
              name: payload.name,
              pricingType: payload.pricingType,
              basePrice: payload.basePrice,
              unitLabel: payload.unitLabel,
              estimatedMins: payload.estimatedMins,
              imageUrl: payload.imageUrl,
              isActive: payload.isActive
            });
          }
        } catch (apiErr) {
          console.warn('Backend update sub-service note:', apiErr.message);
        }

        setSubServices(prev => {
          const list = prev && prev.length > 0 ? prev : [];
          return list.map(s => (s.subServiceId === subId || s.id === subId)
            ? { ...s, ...payload }
            : s
          );
        });
        setFeedbackMsg('Sub-service updated successfully!');
        if (onRefresh) onRefresh();
      } else {
        // Create new via API
        let apiSubId = null;
        try {
          if (parentServiceId) {
            const apiRes = await createSubService({
              service: { serviceId: parentServiceId },
              name: payload.name,
              pricingType: payload.pricingType,
              basePrice: payload.basePrice,
              unitLabel: payload.unitLabel,
              estimatedMins: payload.estimatedMins,
              imageUrl: payload.imageUrl,
              isActive: payload.isActive
            });
            if (apiRes && (apiRes.subServiceId || apiRes.id)) {
              apiSubId = apiRes.subServiceId || apiRes.id;
            }
          }
        } catch (err) {
          console.warn('API sync warning:', err.message);
        }

        const newObj = {
          id: apiSubId || `sub-${Date.now()}`,
          subServiceId: apiSubId || `sub-${Date.now()}`,
          description: 'Custom on-demand service package',
          ...payload
        };

        setSubServices(prev => {
          const list = prev && prev.length > 0 ? prev : [];
          return [newObj, ...list];
        });

        setFeedbackMsg('New sub-service created successfully!');
      }

      if (onRefresh) onRefresh();
      setTimeout(() => {
        setFeedbackMsg(null);
        setIsDrawerOpen(false);
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Pricing Type Badge styling
  const renderPricingBadge = (type) => {
    switch (type) {
      case 'HOURLY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3E8FF] text-[#9333EA] border border-purple-200">
            HOURLY
          </span>
        );
      case 'PER_UNIT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
            PER_UNIT
          </span>
        );
      case 'FIXED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E0F2FE] text-[#0284C7] border border-sky-200">
            FIXED
          </span>
        );
    }
  };

  return (
    <div className="flex -m-6 md:-m-8 min-h-[calc(100vh-4rem)] relative bg-[#F8FAFC]">
      
      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: Sub-Services & Pricing Catalog Table                   */}
      {/* ========================================================================= */}
      <div className={`flex-1 p-6 md:p-8 space-y-5 min-w-0 transition-all duration-300 ${isDrawerOpen ? 'xl:mr-[440px]' : ''}`}>
        
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Sub-Services & Pricing Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage sub-services, pricing and availability for all service categories.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CATALOG UNIFIED NAVIGATION HUB (Master, Sub-services, Explore Services)   */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onNavigateModule && onNavigateModule('categories')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Master Categories</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {categories.length}
            </span>
          </button>

          <button
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap bg-[#1D68F2] text-white shadow-xs"
          >
            <Package className="w-3.5 h-3.5 text-white" />
            <span>Sub-Services & Packages</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
              {totalCount}
            </span>
          </button>

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
        </div>

        {/* Top-Level Status Feedback Alert */}
        {tableFeedback && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-xs transition-all ${
            tableFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              {tableFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{tableFeedback.text}</span>
            </div>
            <button 
              onClick={() => setTableFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar: Category Filter Dropdown, Search Input, Status Tabs, & Add Sub-Service Button */}
        <div className="flex flex-col gap-3">
          
          {/* Top Bar: Status Tabs (Active / Inactive / All) */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs w-fit">
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'ACTIVE'
                  ? 'bg-[#1D68F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Active</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterStatus === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
              }`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'INACTIVE'
                  ? 'bg-[#1D68F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Inactive / Archived</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterStatus === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {inactiveCount}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'ALL'
                  ? 'bg-[#1D68F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterStatus === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {totalCount}
              </span>
            </button>
          </div>

          {/* Search, Category Selector & Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Left: Category Dropdown & Search */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              
              {/* Filter by Category Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden sm:inline">
                  Filter by Category:
                </span>
                <div className="relative">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {categoryOptions.map((cat, idx) => (
                      <option key={`filter-cat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-xs min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-services..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-2xs"
                />
              </div>

            </div>

            {/* Right: + Add Sub-Service Button */}
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Sub-Service</span>
            </button>

          </div>
        </div>

        {/* Sub-Services Data Table (matching reference screenshot) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedRowIds.length === filteredSubs.length && filteredSubs.length > 0}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" 
                    />
                  </th>
                  <th className="py-3 px-3">Image</th>
                  <th className="py-3 px-4">Sub-Service Name</th>
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Pricing Type</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Unit Label</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-center">Active</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedSubs.length === 0 && (
              <tr>
                <td colSpan="10" className="py-12 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <div className="font-semibold text-slate-600">
                    {filterStatus === 'INACTIVE' 
                      ? 'No inactive or archived sub-services' 
                      : 'No sub-services match the selected filters'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {filterStatus === 'INACTIVE'
                      ? 'Deleted or deactivated sub-services will be listed here for archiving and recovery.'
                      : 'Try modifying your search or click "Add Sub-Service" to create a new one.'}
                  </div>
                </td>
              </tr>
            )}
                {paginatedSubs.map((item, idx) => {
                  const id = item.subServiceId || item.id || `sub-${idx}`;
                  const isChecked = selectedRowIds.includes(id);
                  const isActive = item.isActive !== false;

                  return (
                    <tr 
                      key={id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectRow(id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" 
                        />
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs overflow-hidden flex items-center justify-center">
                          {item.imageUrl && !item.imageUrl.includes('unsplash') ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.subservice-img-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                          <div 
                            className="subservice-img-fallback w-full h-full flex items-center justify-center text-slate-300"
                            style={{ display: (item.imageUrl && !item.imageUrl.includes('unsplash')) ? 'none' : 'flex' }}
                          >
                            <ImageOff className="w-5 h-5 text-slate-300" />
                          </div>
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {item.description || 'Comprehensive on-demand service package'}
                        </div>
                      </td>

                      {/* Parent Category */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                          {item.categoryName}
                        </span>
                      </td>

                      {/* Pricing Type Badge */}
                      <td className="py-3 px-4">
                        {renderPricingBadge(item.pricingType)}
                      </td>

                      {/* Base Price */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{Number(item.basePrice).toLocaleString('en-IN')}.00
                      </td>

                      {/* Unit Label */}
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {item.unitLabel || 'per visit'}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.estimatedMins || 60} mins</span>
                        </div>
                      </td>

                      {/* Active Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRowActive(item)}
                          className={`w-10 h-5 inline-flex items-center rounded-full p-0.5 transition cursor-pointer ${
                            isActive ? 'bg-[#1D68F2]' : 'bg-slate-300'
                          }`}
                          title={isActive ? 'Click to deactivate' : 'Click to reactivate'}
                        >
                          <div 
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions (Edit Pencil + Delete Trash / Restore) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Sub-Service"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => handleDeleteRow(item, false)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                              title="Deactivate / Archive Sub-Service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleRowActive(item)}
                                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                                title="Restore Sub-Service"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Restore</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRow(item, true)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                                title="Permanently Delete from Database"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {filteredSubs.length === 0 
                ? 'Showing 0 sub-services' 
                : `Showing ${((safeCurrentPage - 1) * pageSize) + 1}-${Math.min(safeCurrentPage * pageSize, filteredSubs.length)} of ${filteredSubs.length} sub-services`}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button 
                    key={`page-${page}`}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                      safeCurrentPage === page
                        ? 'bg-[#1D68F2] text-white shadow-xs'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* RIGHT SLIDE-OVER DRAWER: Configure Sub-Service                             */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <aside className="fixed top-16 right-0 bottom-0 w-full sm:w-[440px] bg-white border-l border-slate-200 z-40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B192C]">
                Configure Sub-Service
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add or update a sub-service with pricing and details.
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
          <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Feedback alert */}
            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Select Service * Dropdown */}
            {/* Select Parent Service Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Select Service <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setFormCategory(newCat);
                    if (newCat.toLowerCase().includes('massage') || newCat.toLowerCase().includes('spa') || newCat.toLowerCase().includes('therapy')) {
                      setFormUnitLabel('per session');
                      setIsCustomUnit(false);
                    }
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition appearance-none cursor-pointer"
                >
                  {categoryOptions.map((cat, idx) => (
                    <option key={`form-cat-${cat}-${idx}`} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sub-Service Name * */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Sub-Service Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={formName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormName(val);
                  if (val.toLowerCase().includes('massage') || val.toLowerCase().includes('therapy') || val.toLowerCase().includes('spa')) {
                    if (formUnitLabel === 'per job' || formUnitLabel === 'per bathroom' || !formUnitLabel) {
                      setFormUnitLabel('per session');
                      setIsCustomUnit(false);
                    }
                  }
                }}
                placeholder="e.g. Swedish Full Body Massage"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Base Price & Unit Label (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Base Price (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(e.target.value)}
                  placeholder="499"
                  required
                  min="0"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Unit Label <span className="text-rose-500">*</span>
                  </label>
                  {isCustomUnit && (
                    <button 
                      type="button" 
                      onClick={() => { setIsCustomUnit(false); setFormUnitLabel('per session'); }} 
                      className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Presets list
                    </button>
                  )}
                </div>

                {!isCustomUnit ? (
                  <div className="relative">
                    <select
                      value={UNIT_PRESETS.includes(formUnitLabel) ? formUnitLabel : (formUnitLabel ? 'custom' : 'per session')}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomUnit(true);
                        } else {
                          setFormUnitLabel(e.target.value);
                        }
                      }}
                      className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition appearance-none cursor-pointer"
                    >
                      <option value="per session">per session</option>
                      <option value="per person">per person</option>
                      <option value="per visit">per visit</option>
                      <option value="per hour">per hour</option>
                      <option value="per job">per job</option>
                      <option value="per service">per service</option>
                      <option value="per bathroom">per bathroom</option>
                      <option value="per kitchen">per kitchen</option>
                      <option value="per room">per room</option>
                      <option value="per sofa">per sofa</option>
                      <option value="per machine">per machine</option>
                      <option value="per tap">per tap</option>
                      <option value="per appliance">per appliance</option>
                      <option value="custom">✏️ Custom unit label...</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      type="text"
                      value={formUnitLabel}
                      onChange={(e) => setFormUnitLabel(e.target.value)}
                      placeholder="e.g. per session, per 60 mins"
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-400 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-2xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Duration (Minutes) * Slider matching screenshot */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Estimated Duration (Minutes) <span className="text-rose-500">*</span></span>
              </div>

              <div className="relative pt-6 pb-2 px-1">
                {/* Floating Blue Pill Tooltip showing current minutes value */}
                <div 
                  className="absolute top-0 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#1D68F2] text-white text-[11px] font-bold shadow-xs pointer-events-none"
                  style={{
                    left: `${Math.max(5, Math.min(95, ((formDuration - 15) / (240 - 15)) * 100))}%`
                  }}
                >
                  {formDuration}m
                </div>

                {/* Range Slider Track */}
                <input 
                  type="range"
                  min="15"
                  max="240"
                  step="5"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1D68F2]"
                />

                {/* Min / Max / Mid Markers */}
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                  <span>15m</span>
                  <span>60</span>
                  <span>240m</span>
                </div>
              </div>
            </div>

            {/* Pricing Type * (3 Selectable Cards) matching screenshot */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Pricing Type <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Fixed Card */}
                <div
                  onClick={() => setFormPricingType('FIXED')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 cursor-pointer transition ${
                    formPricingType === 'FIXED'
                      ? 'border-[#1D68F2] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ₹
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Fixed</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Set a fixed price for the service
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-1 ${
                    formPricingType === 'FIXED' ? 'border-[#1D68F2] bg-[#1D68F2]' : 'border-slate-300'
                  }`}>
                    {formPricingType === 'FIXED' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* 2. Hourly Card */}
                <div
                  onClick={() => setFormPricingType('HOURLY')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 cursor-pointer transition ${
                    formPricingType === 'HOURLY'
                      ? 'border-[#1D68F2] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Hourly</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Charge per hour of work
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-1 ${
                    formPricingType === 'HOURLY' ? 'border-[#1D68F2] bg-[#1D68F2]' : 'border-slate-300'
                  }`}>
                    {formPricingType === 'HOURLY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* 3. Per Unit Card */}
                <div
                  onClick={() => setFormPricingType('PER_UNIT')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 cursor-pointer transition ${
                    formPricingType === 'PER_UNIT'
                      ? 'border-[#1D68F2] bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Per Unit</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Charge per item or unit
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-1 ${
                    formPricingType === 'PER_UNIT' ? 'border-[#1D68F2] bg-[#1D68F2]' : 'border-slate-300'
                  }`}>
                    {formPricingType === 'PER_UNIT' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

              </div>
            </div>

            {/* Image Upload * matching screenshot */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Image Upload <span className="text-rose-500">*</span>
              </label>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center bg-slate-50/50 transition flex flex-col items-center justify-center gap-1.5">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Uploading to Supabase S3...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 text-blue-500 stroke-[1.5]" />
                    <div className="text-xs font-medium text-slate-600">
                      Drag & drop an image here or
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
                            const url = await uploadSubServiceImage(file);
                            setFormImage(url);
                            setFormImageFileName(file.name);
                            setFormImageMeta(`Supabase S3 • ${(file.size / 1024).toFixed(0)} KB`);
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
                      Stores in Supabase S3 bucket (<code>homeease-sub-services</code>)
                    </span>
                  </>
                )}
              </div>

              {/* Uploaded File Info Card matching screenshot */}
              {formImage && (
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={formImage} 
                      alt="Thumbnail" 
                      className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {formImageFileName || 'bathroom-cleaning.jpg'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {formImageMeta || 'JPG • 640x360 • 124 KB'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFormImage('');
                      setFormImageFileName('');
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Active on Customer App Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Active on Customer App
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  When enabled, this sub-service will be visible to customers in the mobile app.
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
            <div className="pt-5 border-t border-slate-200 flex items-center gap-3">
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
                <span>Save Changes</span>
              </button>
            </div>

          </form>

        </aside>
      )}

    </div>
  );
};
