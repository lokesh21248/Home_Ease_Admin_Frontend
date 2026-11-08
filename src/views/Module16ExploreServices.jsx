import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, ImageOff, UploadCloud, X, Check,
  IndianRupee, Layers, ChevronDown, ChevronLeft, ChevronRight, Loader2,
  Sparkles, Star, ArrowUp, ArrowDown, ExternalLink, AlertCircle, RefreshCw,
  Smartphone, Tag, CheckCircle2, RotateCcw, Info
} from 'lucide-react';
import {
  getExploreServices,
  createExploreService,
  updateExploreService,
  toggleExploreServiceStatus,
  reorderExploreServices,
  deleteExploreService,
  uploadExploreServiceImage
} from '../api/adminApi';

export const Module16ExploreServices = ({ categories = [], onRefresh, onNavigateModule }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE' | 'ALL'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drawer / Side Panel State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    price: '',
    originalPrice: '',
    rating: '4.8',
    reviewCount: '0',
    displayOrder: 0,
    isActive: true,
    isFeatured: false,
  });

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Fetch live explore services from backend
  const fetchExploreServices = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await getExploreServices();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load explore services:', err);
      showFeedback('error', 'Unable to fetch explore services from backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreServices();
  }, [fetchExploreServices]);

  // Derived counts for KPI cards & status tabs
  const activeCount = useMemo(() => items.filter(i => i.isActive !== false).length, [items]);
  const inactiveCount = useMemo(() => items.filter(i => i.isActive === false).length, [items]);
  const featuredCount = useMemo(() => items.filter(i => i.isFeatured === true && i.isActive !== false).length, [items]);
  const totalCount = items.length;

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.categoryName || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || desc.includes(q) || cat.includes(q);

      const matchesCategory =
        selectedCategoryFilter === 'ALL' ||
        item.categoryId === selectedCategoryFilter;

      const itemActive = item.isActive !== false;
      const matchesStatus =
        filterStatus === 'ALL' ? true :
          filterStatus === 'ACTIVE' ? itemActive :
            !itemActive;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategoryFilter, filterStatus]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safeCurrentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, filterStatus]);

  // Open Drawer for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.displayOrder || 0)) + 1 : 1;
    setFormData({
      name: '',
      slug: '',
      description: '',
      categoryId: categories[0]?.serviceId || categories[0]?.id || '',
      imageUrl: '',
      price: '',
      originalPrice: '',
      rating: '4.8',
      reviewCount: '24',
      displayOrder: maxOrder,
      isActive: true,
      isFeatured: false,
    });
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      categoryId: item.categoryId || '',
      imageUrl: item.imageUrl || '',
      price: item.price !== undefined ? String(item.price) : '',
      originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? String(item.originalPrice) : '',
      rating: item.rating !== undefined ? String(item.rating) : '4.8',
      reviewCount: item.reviewCount !== undefined ? String(item.reviewCount) : '0',
      displayOrder: item.displayOrder !== undefined ? item.displayOrder : 0,
      isActive: item.isActive !== false,
      isFeatured: Boolean(item.isFeatured),
    });
    setIsDrawerOpen(true);
  };

  // Auto-slug generator
  const handleNameChange = (newName) => {
    const autoSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: (!editingItem || !prev.slug || prev.slug === autoSlug) ? autoSlug : prev.slug
    }));
  };

  // Image Upload handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('error', 'Please choose a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'Image size must be under 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadExploreServiceImage(file);
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, imageUrl: uploadedUrl }));
        showFeedback('success', 'Image uploaded to Supabase Storage successfully.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showFeedback('error', 'Upload failed. You can also paste an external image URL.');
    } finally {
      setIsUploading(false);
    }
  };

  // Save handler (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showFeedback('error', 'Please enter a service name.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      showFeedback('error', 'Please provide an image for the explore service.');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      showFeedback('error', 'Please enter a valid offer price.');
      return;
    }
    if (formData.originalPrice && Number(formData.originalPrice) < Number(formData.price)) {
      showFeedback('error', 'Original price must be greater than or equal to offer price.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || null,
        categoryId: formData.categoryId || null,
        imageUrl: formData.imageUrl.trim(),
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        rating: Number(formData.rating || 4.8),
        reviewCount: parseInt(formData.reviewCount || '0', 10),
        displayOrder: parseInt(formData.displayOrder || '0', 10),
        isActive: Boolean(formData.isActive),
        isFeatured: Boolean(formData.isFeatured),
      };

      if (editingItem) {
        const id = editingItem.id;
        const updated = await updateExploreService(id, payload);
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
        showFeedback('success', `"${payload.name}" updated successfully.`);
      } else {
        const created = await createExploreService(payload);
        setItems(prev => [created, ...prev]);
        showFeedback('success', `"${payload.name}" added to explore services.`);
      }

      setIsDrawerOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Save failed:', err);
      showFeedback('error', err.message || 'Failed to save explore service.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status in table
  const handleToggleActive = async (item) => {
    const id = item.id;
    const currentActive = item.isActive !== false;
    const targetActive = !currentActive;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: targetActive } : i));

    try {
      await toggleExploreServiceStatus(id, targetActive);
      showFeedback('success', `Service ${targetActive ? 'activated' : 'deactivated'} on customer feed.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Toggle status failed:', err);
      // Revert optimistic update
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: currentActive } : i));
      showFeedback('error', 'Failed to toggle status on live backend.');
    }
  };

  // Move display order Up or Down
  const handleMoveOrder = async (item, direction) => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];

    // Swap orders
    const newItems = [...items];
    const tempOrder = item.displayOrder;
    newItems[currentIndex] = { ...item, displayOrder: targetItem.displayOrder };
    newItems[targetIndex] = { ...targetItem, displayOrder: tempOrder };

    // Sort by new displayOrder
    newItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setItems(newItems);

    try {
      await reorderExploreServices([
        { id: item.id, displayOrder: targetItem.displayOrder },
        { id: targetItem.id, displayOrder: tempOrder },
      ]);
      showFeedback('success', 'Order updated on customer feed.');
    } catch (err) {
      console.error('Reorder failed:', err);
      showFeedback('error', 'Failed to update order on backend.');
      fetchExploreServices(true);
    }
  };

  // Delete / Soft-delete
  const handleDelete = async (item) => {
    const isConfirmed = window.confirm(`Remove "${item.name}" from Explore Services?`);
    if (!isConfirmed) return;

    const id = item.id;
    // Optimistic remove
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      await deleteExploreService(id, false);
      showFeedback('success', `"${item.name}" removed from explore services.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
      showFeedback('error', 'Failed to delete service from backend.');
      fetchExploreServices(true);
    }
  };

  // Discount percentage calculation for preview
  const discountPercent = useMemo(() => {
    const p = Number(formData.price);
    const op = Number(formData.originalPrice);
    if (op && p && op > p) {
      return Math.round(((op - p) / op) * 100);
    }
    return 0;
  }, [formData.price, formData.originalPrice]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Floating Feedback Notification */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 animate-slide-in ${feedback.type === 'success'
          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
          : 'bg-rose-600 text-white shadow-rose-500/20'
          }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-80 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1D68F2] border border-blue-100 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Explore Services Feed
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1D68F2] border border-blue-200">
                  Customer App Live
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage featured cards, discounted highlights, and custom offerings shown on the mobile app home screen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchExploreServices(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
            title="Refresh Explore Services from Live Backend"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1D68F2]' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Explore Service</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Explore Items</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Catalog items registered</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Live on Customer App</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Visible on home carousel</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Featured Spotlights</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{featuredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Highlighted with gold badge</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Inactive / Drafts</span>
            <ImageOff className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-600">{inactiveCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Hidden from customer app</div>
        </div>
      </div>

      {/* Filter Bar & Status Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">

        {/* Top Filter Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${filterStatus === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Active</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}>
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${filterStatus === 'INACTIVE'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Inactive / Drafts</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'INACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                }`}>
                {inactiveCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>All Items</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-600">
                {totalCount}
              </span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.serviceId || c.id} value={c.serviceId || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Explore Services Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">Order</th>
                <th className="py-3 px-3 w-20">Media</th>
                <th className="py-3 px-4">Service Details</th>
                <th className="py-3 px-3">Master Category</th>
                <th className="py-3 px-3">Pricing (₹)</th>
                <th className="py-3 px-3">Customer Rating</th>
                <th className="py-3 px-3 text-center">Featured</th>
                <th className="py-3 px-3 text-center">Live Feed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1D68F2]" />
                      <span className="text-xs font-medium">Loading explore services catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-700">No explore services found</span>
                      <span className="text-[11px] text-slate-400 max-w-sm">
                        {searchQuery || selectedCategoryFilter !== 'ALL' || filterStatus !== 'ALL'
                          ? 'Try adjusting your search criteria or filter options.'
                          : 'Click "Add Explore Service" above to spotlight your first service on the mobile app home screen.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isActive = item.isActive !== false;
                  const hasDiscount = item.originalPrice && Number(item.originalPrice) > Number(item.price);
                  const discount = hasDiscount
                    ? Math.round(((Number(item.originalPrice) - Number(item.price)) / Number(item.originalPrice)) * 100)
                    : 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${!isActive ? 'bg-slate-50/40 text-slate-400' : 'text-slate-800'}`}
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 text-center font-bold text-slate-700 text-xs">
                            {item.displayOrder || idx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveOrder(item, 'up')}
                              disabled={idx === 0 && safeCurrentPage === 1}
                              className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(item, 'down')}
                              disabled={idx === paginatedItems.length - 1 && safeCurrentPage === totalPages}
                              className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-14 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0 relative group">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`fallback-icon ${item.imageUrl ? 'hidden' : ''} text-slate-400`}>
                            <ImageOff className="w-4 h-4" />
                          </div>
                          {item.isFeatured && (
                            <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-amber-400 text-white shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-white" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name, Slug & Description */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 hover:text-blue-600 transition truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          slug: {item.slug || '—'}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Master Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {item.categoryName || 'General / Uncategorized'}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{Number(item.price).toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span className="text-slate-400 line-through text-[11px]">
                              ₹{Number(item.originalPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                            {discount}% OFF
                          </div>
                        )}
                      </td>

                      {/* Customer Rating */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating ? Number(item.rating).toFixed(1) : '4.8'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ({item.reviewCount || 0})
                          </span>
                        </div>
                      </td>

                      {/* Featured Star */}
                      <td className="py-3 px-3 text-center">
                        {item.isFeatured ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ★ SPOTLIGHT
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Live Feed Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          title={isActive ? 'Deactivate from customer feed' : 'Activate on customer feed'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Explore Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Explore Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <div>
            {filteredItems.length === 0
              ? 'Showing 0 services'
              : `Showing ${((safeCurrentPage - 1) * pageSize) + 1}–${Math.min(safeCurrentPage * pageSize, filteredItems.length)} of ${filteredItems.length} services`}
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
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${safeCurrentPage === page
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

      {/* Slide-over Drawer for Add/Edit with Live Mobile Card Preview */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSaving && setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full z-10 animate-slide-left">

            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-[#1D68F2]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingItem ? 'Edit Explore Service' : 'Add New Explore Service'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Changes reflect immediately in the customer mobile app home feed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSaving && setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Form + Live Mobile Card Preview) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Form Fields (7 cols) */}
                <form id="exploreForm" onSubmit={handleSave} className="lg:col-span-7 space-y-4">

                  {/* Service Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sofa & Fabric Upholstery Deep Shampoo"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Category & Slug Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Master Category
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.serviceId || c.id} value={c.serviceId || c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        placeholder="sofa-fabric-shampoo"
                        value={formData.slug}
                        onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Pricing Row: Offer Price & Original Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Offer Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="599.00"
                          value={formData.price}
                          onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                          required
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Original Price (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="899.00"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData(p => ({ ...p, originalPrice: e.target.value }))}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image Upload / URL Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Media / Photo <span className="text-rose-500">*</span>
                    </label>

                    <div className="flex items-center gap-2 mb-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition">
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        <span>{isUploading ? 'Uploading to Supabase...' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-400 text-xs">or paste image URL below</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Rating, Reviews & Display Order */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Rating (0–5)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="4.8"
                        value={formData.rating}
                        onChange={(e) => setFormData(p => ({ ...p, rating: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Reviews Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="48"
                        value={formData.reviewCount}
                        onChange={(e) => setFormData(p => ({ ...p, reviewCount: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="1"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData(p => ({ ...p, displayOrder: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Service Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="High-powered stain removal with anti-allergen steam vacuuming."
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Toggles: Featured & Active */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(p => ({ ...p, isFeatured: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Spotlight / Featured Badge
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Active on Customer App
                      </span>
                    </label>
                  </div>

                </form>

                {/* Right Column: Live Mobile Card Preview (5 cols) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-[280px]">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-bold flex items-center gap-1 text-slate-700">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        Live Mobile Feed Preview
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                        140px card
                      </span>
                    </div>

                    {/* Customer App Card Mockup */}
                    <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
                      <div className="w-[140px] bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col transition-all">

                        {/* Upper Image Container */}
                        <div className="w-full h-[105px] bg-slate-200 relative overflow-hidden flex items-center justify-center">
                          {formData.imageUrl ? (
                            <img
                              src={formData.imageUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageOff className="w-6 h-6 text-slate-400" />
                          )}

                          {/* Price Pill Tag */}
                          {formData.price && Number(formData.price) > 0 && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                              ₹{Number(formData.price)}
                            </div>
                          )}

                          {/* Discount Pill */}
                          {discountPercent > 0 && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-bold shadow-xs">
                              {discountPercent}%
                            </div>
                          )}
                        </div>

                        {/* Lower Content */}
                        <div className="p-2 flex flex-col justify-between flex-1 space-y-1">

                          {/* Rating & Reviews */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-800">
                              {formData.rating ? Number(formData.rating).toFixed(1) : '4.8'}
                            </span>
                            <span className="text-slate-400 text-[9px]">
                              ({formData.reviewCount || '0'})
                            </span>
                          </div>

                          {/* Service Name */}
                          <div className="font-semibold text-slate-900 text-[11px] leading-tight line-clamp-2">
                            {formData.name || 'Service Name Preview'}
                          </div>

                          {/* Category Tag */}
                          <div className="text-[9px] text-blue-600 font-medium truncate">
                            {categories.find(c => (c.serviceId || c.id) === formData.categoryId)?.name || 'General Category'}
                          </div>

                          {/* Price & Strikethrough */}
                          <div className="flex items-baseline gap-1 pt-0.5">
                            <span className="text-[11px] font-bold text-slate-900">
                              ₹{formData.price ? Number(formData.price).toLocaleString('en-IN') : '0'}
                            </span>
                            {formData.originalPrice && Number(formData.originalPrice) > Number(formData.price) && (
                              <span className="text-[9px] text-slate-400 line-through">
                                ₹{Number(formData.originalPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-400 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>
                        This card renders horizontally inside the customer app home screen carousel above Categories.
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/75">
              <button
                type="button"
                onClick={() => !isSaving && setIsDrawerOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="exploreForm"
                disabled={isSaving || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingItem ? 'Update Service' : 'Create Service'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default Module16ExploreServices;

