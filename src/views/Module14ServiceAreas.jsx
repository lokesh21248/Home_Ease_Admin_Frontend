import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Building2, Check, ChevronLeft, ChevronRight, Hash, Loader2,
  MapPin, Plus, RefreshCw, Search, Upload, X
} from 'lucide-react';
import {
  bulkCreatePincodes, createCity, createPincode, createState,
  getCities, getPincodes, getServiceAreaOverview, getStates,
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
  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
    {label}
  </label>
);

export const Module14ServiceAreas = () => {
  const [activeTab, setActiveTab] = useState('states');
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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [warningDialog, setWarningDialog] = useState(null);

  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [summary, stateList, cityList] = await Promise.all([
        getServiceAreaOverview(),
        getStates(),
        getCities()
      ]);
      setOverview(summary);
      setStates(Array.isArray(stateList) ? stateList : []);
      setCities(Array.isArray(cityList) ? cityList : []);
    } catch (err) {
      setError(err.message || 'Unable to load service area data.');
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
        stateId: stateFilter,
        cityId: cityFilter,
        active: statusFilter,
        q: search.trim(),
        page,
        size: 20
      });
      setPincodePage(normalizePincodePage(result));
    } catch (err) {
      setError(err.message || 'Unable to load pincodes.');
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
    const defaultState = stateFilter || states[0]?.stateId || '';
    const defaultCity = cities.find(city => city.stateId === defaultState)?.cityId || '';
    setEditor({ type, record: null });
    setForm({
      name: '',
      stateId: defaultState,
      cityId: defaultCity,
      pincode: '',
      areaName: '',
      isActive: false
    });
    setError('');
  };

  const openEdit = (type, record) => {
    setEditor({ type, record });
    setForm({
      name: record.name || '',
      stateId: record.stateId || states[0]?.stateId || '',
      cityId: record.cityId || '',
      pincode: record.pincode || '',
      areaName: record.areaName || '',
      isActive: Boolean(record.isActive)
    });
    setError('');
  };

  const refreshData = async () => {
    await loadDirectory();
    if (activeTab === 'pincodes') await loadPincodes();
  };

  const saveEntity = async (event) => {
    event.preventDefault();
    if (!editor) return;
    const { type, record } = editor;
    const isCreate = !record;
    const body = type === 'state'
      ? { name: form.name.trim(), isActive: form.isActive }
      : type === 'city'
        ? { stateId: form.stateId, name: form.name.trim(), isActive: form.isActive }
        : isCreate
          ? {
              pincode: form.pincode.trim(),
              cityId: form.cityId,
              stateId: form.stateId,
              areaName: form.areaName.trim(),
              isActive: form.isActive
            }
          : { areaName: form.areaName.trim(), isActive: form.isActive };

    if (type !== 'pincode' && !body.name) {
      setError(`Enter a ${type} name.`);
      return;
    }
    if (type === 'city' && !body.stateId) {
      setError('Select a state for this city.');
      return;
    }
    if (type === 'pincode' && (!body.cityId || (isCreate && !/^\d{6}$/.test(body.pincode)))) {
      setError('Select a city and enter a valid 6-digit pincode.');
      return;
    }
    if (type === 'pincode' && !body.areaName) {
      setError('Enter an area name.');
      return;
    }

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
      setNotice(`${type === 'pincode' ? 'Pincode' : type[0].toUpperCase() + type.slice(1)} ${isCreate ? 'created' : 'updated'} successfully.`);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to ${isCreate ? 'create' : 'update'} ${type}.`);
    } finally {
      setIsSaving(false);
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
      setNotice(`${type === 'pincode' ? 'Pincode' : type[0].toUpperCase() + type.slice(1)} updated successfully.`);
      await refreshData();
    } catch (err) {
      setError(err.message || `Unable to deactivate ${type}.`);
    } finally {
      setIsSaving(false);
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
      setNotice(`${items.length} pincodes imported successfully.`);
      await refreshData();
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Bulk import must be valid JSON.' : (err.message || 'Bulk import failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(0);
    setNotice('');
    setError('');
  };

  const statItems = [
    { label: 'States', value: overview?.stats?.totalStates ?? states.length, icon: MapPin, color: 'text-blue-600 bg-blue-50' },
    { label: 'Cities', value: overview?.stats?.totalCities ?? cities.length, icon: Building2, color: 'text-violet-600 bg-violet-50' },
    { label: 'Pincodes', value: overview?.stats?.totalPincodes ?? '—', icon: Hash, color: 'text-cyan-700 bg-cyan-50' },
    { label: 'Active Pincodes', value: overview?.stats?.activePincodes ?? '—', icon: Check, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Inactive Pincodes', value: overview?.stats?.inactivePincodes ?? '—', icon: AlertCircle, color: 'text-amber-700 bg-amber-50' }
  ];

  const tabs = [
    { id: 'states', label: 'States' },
    { id: 'cities', label: 'Cities' },
    { id: 'pincodes', label: 'Pincodes' }
  ];

  const visibleCities = cities.filter(city => !stateFilter || city.stateId === stateFilter);
  const rows = activeTab === 'states'
    ? states
    : activeTab === 'cities'
      ? visibleCities
      : pincodePage.content;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Coverage controls</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Service Areas</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage serviceable states, cities, and postal pincodes across the platform.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'pincodes' && (
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" /> Bulk import
            </button>
          )}
          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => openCreate(activeTab === 'pincodes' ? 'pincode' : activeTab === 'cities' ? 'city' : 'state')}
            disabled={activeTab !== 'states' && states.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add {activeTab === 'pincodes' ? 'pincode' : activeTab === 'cities' ? 'city' : 'state'}
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <Check className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}



      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-xl font-black text-slate-900">{item.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'pincodes' ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:flex">
              <label className="relative min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search pincode or area" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </label>
              <select value={stateFilter} onChange={event => { setStateFilter(event.target.value); setCityFilter(''); setPage(0); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400">
                <option value="">All states</option>
                {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
              </select>
              <select value={cityFilter} onChange={event => { setCityFilter(event.target.value); setPage(0); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400">
                <option value="">All cities</option>
                {cities.filter(city => !stateFilter || city.stateId === stateFilter).map(city => <option key={city.cityId} value={city.cityId}>{city.name}</option>)}
              </select>
              <select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(0); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400">
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          ) : activeTab === 'cities' ? (
            <select value={stateFilter} onChange={event => setStateFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400">
              <option value="">All states</option>
              {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
            </select>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                {activeTab === 'states' && <><th className="px-5 py-3">State</th><th className="px-5 py-3">Cities</th><th className="px-5 py-3">Pincodes</th></>}
                {activeTab === 'cities' && <><th className="px-5 py-3">City</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Pincodes</th></>}
                {activeTab === 'pincodes' && <><th className="px-5 py-3">Pincode</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">City / State</th></>}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading && rows.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-14 text-center text-sm text-slate-400"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading service areas…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-14 text-center text-sm text-slate-400">No {activeTab} found for these filters.</td></tr>
              ) : rows.map((row, index) => {
                const type = activeTab === 'states' ? 'state' : activeTab === 'cities' ? 'city' : 'pincode';
                const id = getEntityId(row, type) || `${type}-${index}`;
                const active = Boolean(row.isActive);
                return (
                  <tr key={id} className="hover:bg-slate-50/70">
                    {activeTab === 'states' && <>
                      <td className="px-5 py-4 font-bold text-slate-900">{row.name}</td>
                      <td className="px-5 py-4 text-slate-600">{row.cityCount ?? 0}</td>
                      <td className="px-5 py-4 text-slate-600">{row.pincodeCount ?? 0}</td>
                    </>}
                    {activeTab === 'cities' && <>
                      <td className="px-5 py-4 font-bold text-slate-900">{row.name}</td>
                      <td className="px-5 py-4 text-slate-600">{row.stateName || states.find(state => state.stateId === row.stateId)?.name || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">{row.pincodeCount ?? 0}</td>
                    </>}
                    {activeTab === 'pincodes' && <>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{row.pincode}</td>
                      <td className="px-5 py-4 text-slate-700">{row.areaName || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">{row.cityName || '—'}<span className="block text-[11px] text-slate-400">{row.stateName || ''}</span></td>
                    </>}
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => openEdit(type, row)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {activeTab === 'pincodes' && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <span>{pincodePage.totalElements} total pincodes</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 0 || isLoading} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span>Page {page + 1} of {Math.max(pincodePage.totalPages, 1)}</span>
              <button type="button" disabled={page + 1 >= pincodePage.totalPages || isLoading} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>

      {editor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !isSaving) setEditor(null); }}>
          <form onSubmit={saveEntity} className="my-auto w-full max-w-lg space-y-5 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">{editor.record ? 'Edit' : 'Add'} {editor.type === 'pincode' ? 'Pincode' : editor.type}</h2>
                <p className="mt-1 text-xs text-slate-500">Changes are saved directly to the service area API.</p>
              </div>
              <button type="button" onClick={() => setEditor(null)} disabled={isSaving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {editor.type === 'state' && (
              <label className="block space-y-1.5 text-xs font-bold text-slate-700">State name
                <input autoFocus value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. Telangana" />
              </label>
            )}
            {editor.type === 'city' && (
              <>
                <label className="block space-y-1.5 text-xs font-bold text-slate-700">State
                  <select value={form.stateId} onChange={event => setForm(current => ({ ...current, stateId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400">
                    {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5 text-xs font-bold text-slate-700">City name
                  <input autoFocus value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. Hyderabad" />
                </label>
              </>
            )}
            {editor.type === 'pincode' && (
              <>
                {!editor.record && (
                  <label className="block space-y-1.5 text-xs font-bold text-slate-700">Pincode
                    <input autoFocus inputMode="numeric" maxLength={6} value={form.pincode} onChange={event => setForm(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm font-semibold outline-none focus:border-blue-400" placeholder="6-digit postal code" />
                  </label>
                )}
                {!editor.record && (
                  <>
                    <label className="block space-y-1.5 text-xs font-bold text-slate-700">State
                      <select value={form.stateId} onChange={event => {
                        const nextStateId = event.target.value;
                        const nextCity = cities.find(city => city.stateId === nextStateId)?.cityId || '';
                        setForm(current => ({ ...current, stateId: nextStateId, cityId: nextCity }));
                      }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400">
                        {states.map(state => <option key={state.stateId} value={state.stateId}>{state.name}</option>)}
                      </select>
                    </label>
                    <label className="block space-y-1.5 text-xs font-bold text-slate-700">City
                      <select value={form.cityId} onChange={event => setForm(current => ({ ...current, cityId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400">
                        <option value="">Select a city</option>
                        {citiesForSelectedState.map(city => <option key={city.cityId} value={city.cityId}>{city.name}</option>)}
                      </select>
                    </label>
                  </>
                )}
                <label className="block space-y-1.5 text-xs font-bold text-slate-700">Area name
                  <input autoFocus={Boolean(editor.record)} value={form.areaName} onChange={event => setForm(current => ({ ...current, areaName: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. Kukatpally" />
                </label>
              </>
            )}
            <Toggle checked={form.isActive} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} label="Active and available for new bookings" />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditor(null)} disabled={isSaving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleBulkImport} className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Bulk import pincodes</h2>
                <p className="mt-1 text-xs text-slate-500">Paste a JSON array. The import is submitted as one atomic API request.</p>
              </div>
              <button type="button" onClick={() => setBulkOpen(false)} disabled={isSaving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <textarea
              value={bulkJson}
              onChange={event => setBulkJson(event.target.value)}
              rows={10}
              placeholder={'[\n  {\n    "pincode": "500081",\n    "cityId": "city-id",\n    "stateId": "state-id",\n    "areaName": "Madhapur",\n    "isActive": false\n  }\n]'}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setBulkOpen(false)} disabled={isSaving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Import records
              </button>
            </div>
          </form>
        </div>
      )}

      {warningDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
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
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm & Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
