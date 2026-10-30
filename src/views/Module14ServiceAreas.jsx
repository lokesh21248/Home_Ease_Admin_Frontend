import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Building2, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Edit2, Hash, Loader2, MapPin, Plus, RefreshCw, Search,
  Sparkles, Trash2, Upload, X
} from 'lucide-react';
import {
  bulkCreatePincodes, createCity, createPincode, createState,
  deactivateCity, deactivatePincode, deactivateState,
  deleteCity, deletePincode, deleteState,
  getCities, getPincodes, getServiceAreaOverview, getStates,
  lookupPincodeLocation,
  updateCity, updatePincode, updateState
} from '../api/adminApi';

const getEntityId = (entity, type) => {
  if (type === 'state') return entity.stateId || entity.id;
  if (type === 'city') return entity.cityId || entity.id;
  return entity.pincodeId || entity.id;
};

const normalizePincodePage = (result) => {
  if (Array.isArray(result)) {
    return { content: result, page: 0, size: result.length || 20, totalElements: result.length, totalPages: 1 };
  }
  return {
    content: Array.isArray(result?.content) ? result.content : [],
    page: Number(result?.page) || 0,
    size: Number(result?.size) || 20,
    totalElements: Number(result?.totalElements) || 0,
    totalPages: Number(result?.totalPages) || 0
  };
};

const Toggle = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    />
    {label}
  </label>
);

export const Module14ServiceAreas = () => {
  // PIN code is the primary identifier for service availability
  const [activeTab, setActiveTab] = useState('pincodes');
  const [overview, setOverview] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pincodePage, setPincodePage] = useState(normalizePincodePage(null));
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [form, setForm] = useState({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [localitySuggestions, setLocalitySuggestions] = useState([]);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [warningDialog, setWarningDialog] = useState(null);
  const [cascadeDelete, setCascadeDelete] = useState(false);

  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [summary, stateList, cityList] = await Promise.all([
        getServiceAreaOverview().catch(() => null),
        getStates().catch(() => []),
        getCities().catch(() => [])
      ]);
      setOverview(summary);
      setStates(Array.isArray(stateList) ? stateList : []);
      setCities(Array.isArray(cityList) ? cityList : []);
    } catch (err) {
      setError(err.message || 'Unable to load service area directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPincodes = useCallback(async () => {
    if (activeTab !== 'pincodes') return;
    setIsLoading(true);
    setError('');
    try {
      const result = await getPincodes({
        stateId: stateFilter || undefined,
        cityId: cityFilter || undefined,
        active: statusFilter || undefined,
        q: search.trim() || undefined,
        page,
        size: 20
      });
      setPincodePage(normalizePincodePage(result));
    } catch (err) {
      setError(err.message || 'Unable to load PIN codes.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, cityFilter, page, search, stateFilter, statusFilter]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (activeTab !== 'pincodes') return undefined;
    const timer = setTimeout(loadPincodes, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadPincodes]);

  const citiesForSelectedState = useMemo(
    () => cities.filter(city => !form.stateId || city.stateId === form.stateId),
    [cities, form.stateId]
  );

  const openCreate = (type) => {
    setEditor({ type, record: null });
    setIsDetectingLocation(false);
    setLocalitySuggestions([]);
    setShowManualOverride(false);
    setError('');

    if (type === 'pincode') {
      setForm({
        pincode: '',
        areaName: '',
        cityId: '',
        cityName: '',
        stateId: '',
        stateName: '',
        isActive: true, // Sensible active default for newly added serviceable areas
        locationFound: false,
      });
    } else if (type === 'city') {
      const defaultState = stateFilter || states[0]?.stateId || '';
      setForm({
        name: '',
        stateId: defaultState,
        isActive: true
      });
    } else {
      setForm({
        name: '',
        isActive: true
      });
    }
  };

  const openEdit = (type, record) => {
    setEditor({ type, record });
    setIsDetectingLocation(false);
    setLocalitySuggestions([]);
    setShowManualOverride(false);
    setError('');

    if (type === 'pincode') {
      setForm({
        pincode: record.pincode || '',
        areaName: record.areaName || '',
        cityId: record.cityId || '',
        cityName: record.cityName || '',
        stateId: record.stateId || '',
        stateName: record.stateName || '',
        isActive: Boolean(record.isActive),
        locationFound: Boolean(record.cityName || record.stateName),
      });
    } else if (type === 'city') {
      setForm({
        name: record.name || '',
        stateId: record.stateId || states[0]?.stateId || '',
        isActive: Boolean(record.isActive)
      });
    } else {
      setForm({
        name: record.name || '',
        isActive: Boolean(record.isActive)
      });
    }
  };

  const refreshData = async () => {
    await loadDirectory();
    if (activeTab === 'pincodes') await loadPincodes();
  };

  // Automatically lookup and populate City & State when 6 digits are typed
  const handlePincodeChange = async (rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6);
    setForm(current => ({
      ...current,
      pincode: digits,
      ...(digits.length < 6 ? { cityName: '', stateName: '', cityId: '', stateId: '', locationFound: false } : {})
    }));

    if (digits.length === 6) {
      setIsDetectingLocation(true);
      try {
        const loc = await lookupPincodeLocation(digits);
        if (loc?.found) {
          // Attempt to match with existing system states and cities
          const matchedState = states.find(s => s.name?.trim().toLowerCase() === loc.state.trim().toLowerCase());
          const matchedCity = cities.find(c => c.name?.trim().toLowerCase() === loc.city.trim().toLowerCase());

          setForm(current => ({
            ...current,
            cityName: loc.city || '',
            stateName: loc.state || '',
            cityId: matchedCity?.cityId || '',
            stateId: matchedState?.stateId || '',
            locationFound: true,
          }));
          setLocalitySuggestions(loc.localities || []);
        } else {
          setForm(current => ({
            ...current,
            locationFound: false,
          }));
          setLocalitySuggestions([]);
        }
      } catch {
        // Non-blocking network fallback
      } finally {
        setIsDetectingLocation(false);
      }
    } else {
      setLocalitySuggestions([]);
    }
  };

  const saveEntity = async (event) => {
    event.preventDefault();
    if (!editor) return;
    const { type, record } = editor;
    const isCreate = !record;

    // Validation
    if (type === 'state') {
      if (!form.name?.trim()) {
        setError('Please enter a state name.');
        return;
      }
    } else if (type === 'city') {
      if (!form.name?.trim()) {
        setError('Please enter a city name.');
        return;
      }
      if (!form.stateId) {
        setError('Please select a parent state for this city.');
        return;
      }
    } else if (type === 'pincode') {
      if (!form.pincode || !/^\d{6}$/.test(form.pincode.trim())) {
        setError('PIN code is required and must be exactly 6 digits.');
        return;
      }
      // Note: Area / Locality is optional. City and State are auto-populated optional metadata.
    }

    const body = type === 'state'
      ? { name: form.name.trim(), isActive: form.isActive }
      : type === 'city'
        ? { stateId: form.stateId, name: form.name.trim(), isActive: form.isActive }
        : isCreate
          ? {
              pincode: form.pincode.trim(),
              areaName: form.areaName?.trim() || null,
              cityId: form.cityId || null,
              stateId: form.stateId || null,
              isActive: Boolean(form.isActive)
            }
          : {
              areaName: form.areaName?.trim() || null,
              cityId: form.cityId || null,
              stateId: form.stateId || null,
              isActive: Boolean(form.isActive)
            };

    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      let result;
      if (isCreate) {
        result = type === 'state'
          ? await createState(body)
          : type === 'city'
            ? await createCity(body)
            : await createPincode(body);
      } else {
        const id = getEntityId(record, type);
        result = type === 'state'
          ? await updateState(id, body)
          : type === 'city'
            ? await updateCity(id, body)
            : await updatePincode(id, body);

        if (result?.warning) {
          setWarningDialog({
            type,
            id,
            body,
            message: result.message || 'Deactivation will block new bookings but affects upcoming bookings.',
            affectedUpcomingBookings: result.affectedUpcomingBookings ?? 0,
          });
          setIsSaving(false);
          return;
        }
      }

      setEditor(null);
      setNotice(`${type === 'pincode' ? 'PIN code' : type[0].toUpperCase() + type.slice(1)} ${isCreate ? 'added' : 'updated'} successfully.`);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to ${isCreate ? 'create' : 'update'} ${type}.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick 1-click inline toggle for PIN code service availability
  const handleQuickTogglePincode = async (pincodeRecord) => {
    const id = getEntityId(pincodeRecord, 'pincode');
    const nextActive = !pincodeRecord.isActive;
    setTogglingId(id);
    setError('');
    try {
      const result = await updatePincode(id, {
        isActive: nextActive,
        areaName: pincodeRecord.areaName || null,
        cityId: pincodeRecord.cityId || null,
        stateId: pincodeRecord.stateId || null
      });

      if (result?.warning) {
        setWarningDialog({
          type: 'pincode',
          id,
          body: {
            isActive: nextActive,
            areaName: pincodeRecord.areaName || null,
            cityId: pincodeRecord.cityId || null,
            stateId: pincodeRecord.stateId || null
          },
          message: result.message || 'Deactivation will block new bookings for this PIN code.',
          affectedUpcomingBookings: result.affectedUpcomingBookings ?? 0,
        });
        return;
      }

      setNotice(`PIN code ${pincodeRecord.pincode} service availability is now ${nextActive ? 'Active' : 'Inactive'}.`);
      await refreshData();
    } catch (err) {
      setError(err.message || 'Unable to update service availability.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!warningDialog) return;
    const { type, id, body } = warningDialog;
    setIsSaving(true);
    setError('');
    try {
      const result = type === 'state'
        ? await updateState(id, body, true)
        : type === 'city'
          ? await updateCity(id, body, true)
          : await updatePincode(id, body, true);

      if (result?.warning) {
        throw new Error(result.message || 'The server did not complete the requested update.');
      }

      setWarningDialog(null);
      setEditor(null);
      setNotice(`${type === 'pincode' ? 'PIN code' : type[0].toUpperCase() + type.slice(1)} updated successfully.`);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to deactivate ${type}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (type, record) => {
    setCascadeDelete(false);
    setDeleteDialog({ type, record });
    setError('');
  };

  const handleDeactivateInstead = async () => {
    if (!deleteDialog) return;
    const { type, record } = deleteDialog;
    const id = getEntityId(record, type);
    const label = record.pincode || record.name || 'record';

    setIsDeleting(true);
    setError('');
    try {
      if (type === 'state') await deactivateState(id);
      else if (type === 'city') await deactivateCity(id);
      else await deactivatePincode(id);

      setNotice(`${type === 'pincode' ? 'PIN code' : type[0].toUpperCase() + type.slice(1)} "${label}" deactivated successfully.`);
      setDeleteDialog(null);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to deactivate ${type}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog) return;
    const { type, record } = deleteDialog;
    const id = getEntityId(record, type);
    const label = record.pincode || record.name || 'record';

    setIsDeleting(true);
    setError('');
    try {
      if (type === 'state') {
        await deleteState(id, cascadeDelete);
        setStates(current => current.filter(s => getEntityId(s, 'state') !== id));
      } else if (type === 'city') {
        await deleteCity(id, cascadeDelete);
        setCities(current => current.filter(c => getEntityId(c, 'city') !== id));
      } else {
        await deletePincode(id);
        setPincodePage(current => ({
          ...current,
          content: current.content.filter(p => getEntityId(p, 'pincode') !== id),
          totalElements: Math.max(0, current.totalElements - 1),
        }));
      }

      setNotice(`${type === 'pincode' ? 'PIN code' : type[0].toUpperCase() + type.slice(1)} "${label}" deleted successfully.`);
      setDeleteDialog(null);
      setCascadeDelete(false);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to delete ${type}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkImport = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const items = JSON.parse(bulkJson);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Paste a non-empty JSON array of pincode records.');
      }
      await bulkCreatePincodes(items);
      setBulkOpen(false);
      setBulkJson('');
      setNotice(`${items.length} PIN codes imported successfully.`);
      await refreshData();
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Bulk import must be valid JSON.' : (err.message || 'Bulk import failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setStatusFilter('');
    setPage(0);
    setNotice('');
    setError('');
  };

  const statItems = [
    { label: 'Total PIN Codes', value: overview?.stats?.totalPincodes ?? pincodePage.totalElements ?? '—', icon: Hash, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active PIN Codes', value: overview?.stats?.activePincodes ?? '—', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Inactive PIN Codes', value: overview?.stats?.inactivePincodes ?? '—', icon: AlertCircle, color: 'text-amber-700 bg-amber-50' },
    { label: 'Cities', value: overview?.stats?.totalCities ?? cities.length, icon: Building2, color: 'text-violet-600 bg-violet-50' },
    { label: 'States', value: overview?.stats?.totalStates ?? states.length, icon: MapPin, color: 'text-cyan-700 bg-cyan-50' }
  ];

  const tabs = [
    { id: 'pincodes', label: 'PIN Codes (Primary Identifier)', icon: Hash },
    { id: 'cities', label: 'Cities', icon: Building2 },
    { id: 'states', label: 'States', icon: MapPin }
  ];

  const filteredStates = states.filter(state => {
    if (statusFilter === 'true' && !state.isActive) return false;
    if (statusFilter === 'false' && state.isActive) return false;
    if (search.trim() && !state.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
    return true;
  });

  const filteredCities = cities.filter(city => {
    if (stateFilter && city.stateId !== stateFilter) return false;
    if (statusFilter === 'true' && !city.isActive) return false;
    if (statusFilter === 'false' && city.isActive) return false;
    if (search.trim() && !city.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
    return true;
  });

  const rows = activeTab === 'states'
    ? filteredStates
    : activeTab === 'cities'
      ? filteredCities
      : pincodePage.content;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
            <Sparkles className="h-3 w-3" /> PIN Code Serviceability Engine
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Service Areas</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            PIN code is the primary identifier for service availability. State and City are automatically populated from postal location data without requiring manual entry.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'pincodes' && (
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Bulk import
            </button>
          )}
          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => openCreate(activeTab === 'pincodes' ? 'pincode' : activeTab === 'cities' ? 'city' : 'state')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add {activeTab === 'pincodes' ? 'PIN Code' : activeTab === 'cities' ? 'City' : 'State'}
          </button>
        </div>
      </section>

      {/* Notifications and Alerts */}
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {notice}
        </div>
      )}

      {/* KPI Stat Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 truncate">{item.label}</p>
                <p className="mt-0.5 text-xl font-black text-slate-900">{item.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Tabs and Table Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Specific Search and Filters */}
          {activeTab === 'states' ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search state…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          ) : activeTab === 'cities' ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search city…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <select
                value={stateFilter}
                onChange={event => setStateFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All states</option>
                {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          ) : (
            /* PIN Codes Filter Bar */
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-56 flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => { setSearch(event.target.value); setPage(0); }}
                  placeholder="Search PIN code or locality…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <select
                value={statusFilter}
                onChange={event => { setStatusFilter(event.target.value); setPage(0); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All availability</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
              {states.length > 0 && (
                <select
                  value={stateFilter}
                  onChange={event => { setStateFilter(event.target.value); setCityFilter(''); setPage(0); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All states</option>
                  {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
                </select>
              )}
              {cities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={event => { setCityFilter(event.target.value); setPage(0); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All cities</option>
                  {cities.filter(city => !stateFilter || city.stateId === stateFilter).map(city => (
                    <option key={city.cityId} value={city.cityId}>{city.name}</option>
                  ))}
                </select>
              )}
              {(search || statusFilter || stateFilter || cityFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setStatusFilter(''); setStateFilter(''); setCityFilter(''); setPage(0); }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                {activeTab === 'states' && (
                  <>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3">Cities</th>
                    <th className="px-5 py-3">PIN Codes</th>
                  </>
                )}
                {activeTab === 'cities' && (
                  <>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3">PIN Codes</th>
                  </>
                )}
                {activeTab === 'pincodes' && (
                  <>
                    <th className="px-5 py-3">PIN Code</th>
                    <th className="px-5 py-3">Area / Locality</th>
                    <th className="px-5 py-3">City & State</th>
                  </>
                )}
                <th className="px-5 py-3">Service Availability</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center text-sm text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />
                    Loading service area data…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center text-sm text-slate-400">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No {activeTab} found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or active filters.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const type = activeTab === 'states' ? 'state' : activeTab === 'cities' ? 'city' : 'pincode';
                  const id = getEntityId(row, type) || `${type}-${index}`;
                  const active = Boolean(row.isActive);

                  return (
                    <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                      {activeTab === 'states' && (
                        <>
                          <td className="px-5 py-4 font-bold text-slate-900">{row.name}</td>
                          <td className="px-5 py-4 text-slate-600">{row.cityCount ?? 0}</td>
                          <td className="px-5 py-4 text-slate-600">{row.pincodeCount ?? 0}</td>
                        </>
                      )}
                      {activeTab === 'cities' && (
                        <>
                          <td className="px-5 py-4 font-bold text-slate-900">{row.name}</td>
                          <td className="px-5 py-4 text-slate-600">
                            {row.stateName || states.find(state => state.stateId === row.stateId)?.name || '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{row.pincodeCount ?? 0}</td>
                        </>
                      )}
                      {activeTab === 'pincodes' && (
                        <>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Hash className="h-3.5 w-3.5" />
                              </span>
                              <span className="font-mono text-sm font-black tracking-wider text-slate-900">
                                {row.pincode}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {row.areaName ? (
                              <span className="font-medium text-slate-800">{row.areaName}</span>
                            ) : (
                              <span className="text-xs italic text-slate-400">All localities in PIN</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-800 font-medium text-xs">
                              {row.cityName || '—'}
                              {row.stateName && (
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  {row.stateName}
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}

                      {/* Service Availability / Status Column */}
                      <td className="px-5 py-4">
                        {type === 'pincode' ? (
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePincode(row)}
                            disabled={togglingId === id}
                            className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title={`Click to toggle availability (currently ${active ? 'Active' : 'Inactive'})`}
                          >
                            {togglingId === id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            )}
                            <span>{active ? 'Active' : 'Inactive'}</span>
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(type, row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                            title={`Edit ${type}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(type, row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            title={`Delete ${type}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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

        {/* PIN Codes Pagination */}
        {activeTab === 'pincodes' && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span className="font-medium">
              {pincodePage.totalElements} total serviceable PIN codes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 0 || isLoading}
                onClick={() => setPage(current => current - 1)}
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium text-slate-700">
                Page {page + 1} of {Math.max(pincodePage.totalPages, 1)}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pincodePage.totalPages || isLoading}
                onClick={() => setPage(current => current + 1)}
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Editor Modal for Adding / Editing Entities */}
      {editor && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={event => { if (event.target === event.currentTarget && !isSaving) setEditor(null); }}
        >
          <form onSubmit={saveEntity} className="my-auto w-full max-w-lg space-y-5 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editor.record ? 'Edit' : 'Add'} {editor.type === 'pincode' ? 'PIN Code' : editor.type[0].toUpperCase() + editor.type.slice(1)}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {editor.type === 'pincode'
                    ? 'PIN code is the primary identifier for service availability.'
                    : `Configure service availability for ${editor.type}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* State Form */}
            {editor.type === 'state' && (
              <label className="block space-y-1.5 text-xs font-bold text-slate-700">
                State name
                <input
                  autoFocus
                  value={form.name}
                  onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Telangana"
                />
              </label>
            )}

            {/* City Form */}
            {editor.type === 'city' && (
              <>
                <label className="block space-y-1.5 text-xs font-bold text-slate-700">
                  State
                  <select
                    value={form.stateId}
                    onChange={event => setForm(current => ({ ...current, stateId: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  >
                    {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-xs font-bold text-slate-700">
                  City name
                  <input
                    autoFocus
                    value={form.name}
                    onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Hyderabad"
                  />
                </label>
              </>
            )}

            {/* PIN Code Form */}
            {editor.type === 'pincode' && (
              <div className="space-y-4">
                {/* 1. PIN Code (Required, Exactly 6 digits) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-blue-600" />
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {form.pincode?.length || 0}/6 digits
                    </span>
                  </div>

                  {!editor.record ? (
                    <div className="relative">
                      <input
                        autoFocus
                        inputMode="numeric"
                        maxLength={6}
                        value={form.pincode}
                        onChange={event => handlePincodeChange(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-base font-bold tracking-wider text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-sm"
                        placeholder="Enter 6-digit PIN (e.g. 500072)"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {isDetectingLocation && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Loader2 className="h-3 w-3 animate-spin" /> Detecting…
                          </span>
                        )}
                        {!isDetectingLocation && form.locationFound && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Detected
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                        {form.pincode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Primary Identifier
                      </span>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    Required, exactly 6 digits. Primary identifier for service availability.
                  </p>
                </div>

                {/* 2. Auto-populated City & State Cards */}
                <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/20 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      Location Data
                    </span>
                    {form.locationFound ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" /> Automatically Populated
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Optional metadata
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                        {form.cityName || (isDetectingLocation ? 'Detecting…' : (form.pincode?.length === 6 ? 'Not detected' : 'Auto-resolves on 6 digits'))}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                        {form.stateName || (isDetectingLocation ? 'Detecting…' : (form.pincode?.length === 6 ? 'Not detected' : 'Auto-resolves on 6 digits'))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      Admin is not required to manually enter State or City.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowManualOverride(v => !v)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 cursor-pointer"
                    >
                      {showManualOverride ? 'Hide link' : 'Manual link'}
                    </button>
                  </div>

                  {showManualOverride && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600">Link System State</label>
                        <select
                          value={form.stateId}
                          onChange={e => {
                            const sid = e.target.value;
                            const sObj = states.find(s => s.stateId === sid);
                            setForm(c => ({ ...c, stateId: sid, stateName: sObj?.name || c.stateName }));
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        >
                          <option value="">None / Auto</option>
                          {states.map(s => <option key={s.stateId} value={s.stateId}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600">Link System City</label>
                        <select
                          value={form.cityId}
                          onChange={e => {
                            const cid = e.target.value;
                            const cObj = cities.find(c => c.cityId === cid);
                            setForm(c => ({ ...c, cityId: cid, cityName: cObj?.name || c.cityName }));
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        >
                          <option value="">None / Auto</option>
                          {citiesForSelectedState.map(c => (
                            <option key={c.cityId} value={c.cityId}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Area / Locality (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Area / Locality <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    {form.areaName && (
                      <button
                        type="button"
                        onClick={() => setForm(c => ({ ...c, areaName: '' }))}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    value={form.areaName || ''}
                    onChange={event => setForm(current => ({ ...current, areaName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-300"
                    placeholder="e.g. Kukatpally, Sector 15 (optional)"
                  />

                  {localitySuggestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">
                        Detected localities for PIN {form.pincode}:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {localitySuggestions.slice(0, 10).map(loc => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setForm(c => ({ ...c, areaName: loc }))}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                              form.areaName === loc
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            + {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Service Availability (Active / Inactive) */}
                <div className={`rounded-xl border p-3.5 transition ${
                  form.isActive ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Service Availability</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          form.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${form.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                          {form.isActive ? 'Active (Service Available)' : 'Inactive (Service Unavailable)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {form.isActive
                          ? 'Customers in this PIN code can place and schedule service bookings.'
                          : 'Service is disabled for this PIN code; customer bookings will be blocked.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(current => ({ ...current, isActive: !current.isActive }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        form.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          form.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State/City Toggle Fallback */}
            {editor.type !== 'pincode' && (
              <Toggle
                checked={form.isActive}
                onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))}
                label="Active and available for service"
              />
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditor(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editor.record ? 'Save changes' : 'Add record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleBulkImport} className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Bulk import PIN codes</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Paste a JSON array of PIN codes. City and State are optional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={bulkJson}
              onChange={event => setBulkJson(event.target.value)}
              rows={10}
              placeholder={'[\n  {\n    "pincode": "500081",\n    "areaName": "Madhapur",\n    "isActive": true\n  },\n  {\n    "pincode": "500072",\n    "areaName": "Kukatpally",\n    "isActive": true\n  }\n]'}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Import records
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Bookings Deactivation Warning Dialog */}
      {warningDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Upcoming Bookings Warning</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{warningDialog.message}</p>
                {warningDialog.affectedUpcomingBookings > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                    <span className="font-bold">{warningDialog.affectedUpcomingBookings}</span> upcoming booking(s) will remain active, but new bookings will be blocked.
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setWarningDialog(null)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm & Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs" role="presentation">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete {deleteDialog.type === 'pincode' ? 'PIN Code' : deleteDialog.type[0].toUpperCase() + deleteDialog.type.slice(1)}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    "{deleteDialog.record?.pincode || deleteDialog.record?.name}"
                  </span>
                  {deleteDialog.record?.areaName ? ` (${deleteDialog.record.areaName})` : ''}?
                </p>

                {deleteDialog.type === 'pincode' && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      Deleting will remove this PIN code from serviceable coverage. If you only want to pause service, click <span className="font-semibold text-slate-800">"Deactivate Instead"</span>.
                    </p>
                  </div>
                )}

                {deleteDialog.type === 'state' && (deleteDialog.record?.cityCount > 0 || deleteDialog.record?.pincodeCount > 0) && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                    <p className="font-semibold">
                      ⚠️ This state currently contains {deleteDialog.record?.cityCount ?? 0} cities and {deleteDialog.record?.pincodeCount ?? 0} PIN codes.
                    </p>
                    <label className="flex items-center gap-2 font-medium cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={cascadeDelete}
                        onChange={e => setCascadeDelete(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Cascade delete attached cities and PIN codes</span>
                    </label>
                  </div>
                )}

                {deleteDialog.type === 'city' && deleteDialog.record?.pincodeCount > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                    <p className="font-semibold">
                      ⚠️ This city currently contains {deleteDialog.record?.pincodeCount ?? 0} PIN codes.
                    </p>
                    <label className="flex items-center gap-2 font-medium cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={cascadeDelete}
                        onChange={e => setCascadeDelete(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Cascade delete attached PIN codes</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleDeactivateInstead}
                disabled={isDeleting}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition cursor-pointer"
                title="Disable bookings without deleting"
              >
                Deactivate Instead
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setDeleteDialog(null); setCascadeDelete(false); }}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={
                    isDeleting ||
                    (deleteDialog.type === 'state' && (deleteDialog.record?.cityCount > 0 || deleteDialog.record?.pincodeCount > 0) && !cascadeDelete) ||
                    (deleteDialog.type === 'city' && deleteDialog.record?.pincodeCount > 0 && !cascadeDelete)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {isDeleting ? 'Deleting…' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
