import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Radio, Clock, UserCheck, AlertTriangle, Navigation, 
  ArrowRight, Phone, RefreshCw, Zap, ShieldAlert, CheckCircle, ChevronRight, 
  Layers, FileText, CheckCircle2, XCircle, Search, Filter, User, Calendar, 
  IndianRupee, ExternalLink, ShieldCheck, ArrowUpRight, Compass, Eye, X
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { 
  getLiveMap, getDispatchLogs, getFailedDispatchBookings, 
  forceReassignBooking, blockWorker, unblockWorker 
} from '../api/adminApi';

const GOOGLE_MAPS_KEY = 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
  'AIzaSyDvrUuGOEjxUK1JNTRixav6-Ts1jT75Z9s';

// Center of Hyderabad IT & Residential Corridor
const HYDERABAD_CENTER = { lat: 17.4485, lng: 78.3748 };

export const Module06Dispatch = ({ 
  liveMapData: initialLiveMapData, 
  bookings = [], 
  workers = [], 
  customers = [], 
  categories = [], 
  onRefresh, 
  isRefreshing,
  onNavigateModule
}) => {
  // Live Telemetry State
  const [liveMap, setLiveMap] = useState(initialLiveMapData || { activeWorkers: [], activeBookings: [] });
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'diagnostics'
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Selected Entities for Inspection Drawers
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPincode, setFilterPincode] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterWorkerStatus, setFilterWorkerStatus] = useState('ALL'); // 'ALL' | 'ONLINE' | 'AVAILABLE' | 'BUSY'
  const [filterBookingStatus, setFilterBookingStatus] = useState('ALL'); // 'ALL' | 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS'
  const [filterBookingType, setFilterBookingType] = useState('ALL'); // 'ALL' | 'INSTANT' | 'SCHEDULED'

  // Diagnostics State
  const [dispatchLogs, setDispatchLogs] = useState([]);
  const [failedBookings, setFailedBookings] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Force Reassignment Modal State
  const [reassignBookingModal, setReassignBookingModal] = useState(null);
  const [targetWorkerId, setTargetWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('Manual ops dispatch override');
  const [isReassigning, setIsReassigning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Map DOM & Google Maps Object References
  const mapRef = useRef(null);
  const googleMapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const wsRef = useRef(null);

  // Synchronize initial prop
  useEffect(() => {
    if (initialLiveMapData) {
      setLiveMap(initialLiveMapData);
    }
  }, [initialLiveMapData]);

  // Periodic Telemetry Poll (every 10s as fail-safe backup to WebSocket)
  const fetchLiveMapData = async () => {
    try {
      const data = await getLiveMap();
      if (data) {
        setLiveMap(data);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Live map telemetry fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchLiveMapData();
    const interval = setInterval(fetchLiveMapData, 10000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket / STOMP Connection to Live Location Stream
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? '3.108.55.219' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        // Send STOMP CONNECT frame
        socket.send("CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0");
      };

      socket.onmessage = (event) => {
        const msg = event.data;
        if (msg.includes('CONNECTED')) {
          // Subscribe to live dispatch updates
          socket.send("SUBSCRIBE\nid:sub-dispatch\ndestination:/topic/dispatch\n\n\0");
          socket.send("SUBSCRIBE\nid:sub-track\ndestination:/topic/track/*\n\n\0");
        } else if (msg.includes('/topic/track') || msg.includes('/topic/dispatch')) {
          fetchLiveMapData();
        }
      };

      socket.onerror = () => {
        // Fallback silently to HTTP polling
      };
    } catch (err) {
      console.warn('WebSocket init exception:', err.message);
    }

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, []);

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-live-ops';
    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 300);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      console.warn('Failed to load Google Maps script from Google CDN');
      setMapLoadError(true);
    };
    document.head.appendChild(script);
  }, []);

  // Fetch Diagnostics (Kafka Logs & Failed Dispatches)
  const fetchDiagnostics = async () => {
    setLoadingLogs(true);
    try {
      const [logsRes, failedRes] = await Promise.all([
        getDispatchLogs().catch(() => ({ logs: [] })),
        getFailedDispatchBookings().catch(() => []),
      ]);
      setDispatchLogs(logsRes?.logs || []);
      setFailedBookings(Array.isArray(failedRes) ? failedRes : []);
    } catch (err) {
      console.warn('Failed to load dispatch diagnostics:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      fetchDiagnostics();
    }
  }, [activeTab]);

  // Toast feedback helper
  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Force Reassign Handler
  const handleForceReassign = async (e) => {
    e.preventDefault();
    if (!reassignBookingModal || !targetWorkerId) return;
    setIsReassigning(true);
    try {
      const bId = reassignBookingModal.bookingId || reassignBookingModal.id;
      await forceReassignBooking(bId, targetWorkerId, reassignReason);
      showFeedback('success', `Booking #${bId.slice(0, 8)} successfully force-reassigned!`);
      setReassignBookingModal(null);
      fetchLiveMapData();
      if (onRefresh) onRefresh();
    } catch (err) {
      showFeedback('error', `Reassignment failed: ${err.message}`);
    } finally {
      setIsReassigning(false);
    }
  };

  // Map Telemetry Active Records
  const activeWorkers = liveMap?.activeWorkers || [];
  const activeBookings = liveMap?.activeBookings || [];

  // Pincode options extracted from live data
  const availablePincodes = useMemo(() => {
    const set = new Set();
    ['500081', '500032', '500034', '500072', '500084', '500049', '500038'].forEach(p => set.add(p));
    activeBookings.forEach(b => {
      const pin = b.pincode || b.servicePincode || b.address?.pincode;
      if (pin) set.add(String(pin));
    });
    bookings.forEach(b => {
      const pin = b.pincode || b.servicePincode || b.address?.pincode;
      if (pin) set.add(String(pin));
    });
    return Array.from(set).sort();
  }, [activeBookings, bookings]);

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return activeWorkers.filter(w => {
      const matchesSearch = !searchQuery || 
        (w.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.phoneNumber || '').includes(searchQuery);

      const matchesStatus = 
        filterWorkerStatus === 'ALL' ? true :
        filterWorkerStatus === 'ONLINE' ? w.isOnline :
        filterWorkerStatus === 'AVAILABLE' ? (w.isOnline && !w.currentBookingId) :
        filterWorkerStatus === 'BUSY' ? Boolean(w.currentBookingId) : true;

      return matchesSearch && matchesStatus;
    });
  }, [activeWorkers, searchQuery, filterWorkerStatus]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return activeBookings.filter(b => {
      const matchesSearch = !searchQuery ||
        (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.bookingId || '').includes(searchQuery);

      const matchesCategory = 
        filterCategory === 'ALL' ? true :
        (b.serviceName || '').toLowerCase().includes(filterCategory.toLowerCase());

      const status = (b.bookingStatus || b.status || '').toUpperCase();
      const matchesStatus = 
        filterBookingStatus === 'ALL' ? true :
        filterBookingStatus === 'UNASSIGNED' ? ['SEARCHING', 'REQUESTED', 'WORKER_NOT_FOUND'].includes(status) :
        filterBookingStatus === 'ASSIGNED' ? ['ASSIGNED', 'ACCEPTED', 'ARRIVING'].includes(status) :
        filterBookingStatus === 'IN_PROGRESS' ? ['IN_PROGRESS', 'STARTED'].includes(status) : true;

      const type = (b.bookingType || b.type || '').toUpperCase();
      const matchesType = 
        filterBookingType === 'ALL' ? true :
        filterBookingType === type;

      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    });
  }, [activeBookings, searchQuery, filterCategory, filterBookingStatus, filterBookingType]);

  // ==========================================
  // GOOGLE MAP RENDERING & MARKER LIFECYCLE
  // ==========================================
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    // Initialize Map Instance if not created
    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: HYDERABAD_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0effe' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
        ],
      });
    }

    const map = googleMapInstance.current;

    // Clear existing markers & polylines
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // 1. Render Worker Markers
    filteredWorkers.forEach(w => {
      const lat = parseFloat(w.currentLat);
      const lng = parseFloat(w.currentLng);
      if (isNaN(lat) || isNaN(lng)) return;

      const pos = { lat, lng };
      bounds.extend(pos);
      hasCoords = true;

      const isBusy = Boolean(w.currentBookingId);
      const pinColor = isBusy ? '#1D68F2' : '#10B981'; // Blue = Busy, Emerald = Available

      const svgIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      };

      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: `${w.fullName || 'Partner'} (${isBusy ? 'On Job' : 'Available'})`,
        icon: svgIcon,
      });

      marker.addListener('click', () => {
        // Find full worker profile
        const fullProfile = workers.find(item => item.workerId === w.workerId || item.id === w.workerId) || w;
        setSelectedWorker({ ...fullProfile, ...w });
        setSelectedBooking(null);
      });

      markersRef.current.push(marker);
    });

    // 2. Render Customer Booking Markers & Worker-to-Customer Polylines
    filteredBookings.forEach(b => {
      const lat = parseFloat(b.userLat || b.lat);
      const lng = parseFloat(b.userLng || b.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const pos = { lat, lng };
      bounds.extend(pos);
      hasCoords = true;

      const status = (b.bookingStatus || b.status || '').toUpperCase();
      const isUnassigned = ['SEARCHING', 'REQUESTED', 'WORKER_NOT_FOUND'].includes(status);
      const isAssigned = ['ASSIGNED', 'ACCEPTED', 'ARRIVING'].includes(status);

      const pinColor = isUnassigned ? '#EF4444' : isAssigned ? '#F59E0B' : '#1D68F2';

      // Custom Diamond / Pin marker for Customer Bookings
      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: `${b.serviceName || 'Service'} (${status})`,
        icon: {
          path: 'M 0,-18 C -7,-18 -12,-13 -12,-6 C -12,2 -4,9 0,16 C 4,9 12,2 12,-6 C 12,-13 7,-18 0,-18 Z',
          scale: 1.1,
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        const fullBooking = bookings.find(item => item.bookingId === b.bookingId || item.id === b.bookingId) || b;
        setSelectedBooking({ ...fullBooking, ...b });
        setSelectedWorker(null);
      });

      markersRef.current.push(marker);

      // 3. Render Polyline if Worker is Assigned
      if (b.assignedWorkerId) {
        const assignedWorker = activeWorkers.find(w => w.workerId === b.assignedWorkerId);
        if (assignedWorker && assignedWorker.currentLat && assignedWorker.currentLng) {
          const workerPos = {
            lat: parseFloat(assignedWorker.currentLat),
            lng: parseFloat(assignedWorker.currentLng),
          };

          const polyline = new window.google.maps.Polyline({
            path: [workerPos, pos],
            geodesic: true,
            strokeColor: '#1D68F2',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            icons: [{
              icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.5, fillColor: '#1D68F2', fillOpacity: 1 },
              offset: '50%',
            }],
            map,
          });

          polylinesRef.current.push(polyline);
        }
      }
    });

    // Auto-fit to active coordinates
    if (hasCoords) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [mapLoaded, filteredWorkers, filteredBookings]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Telemetry Controller */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-[#1D68F2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Live Operations Control Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time partner GPS coordinates, customer request pins, live route tracking & manual dispatch overrides.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'map' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live GPS Map
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'diagnostics' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kafka Diagnostics</span>
              {failedBookings.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          </div>

          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('dispatch')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Dispatch Console</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchLiveMapData();
              if (onRefresh) onRefresh();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Status Meter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{activeWorkers.length}</div>
            <div className="text-[11px] font-semibold text-slate-400">Online Partners</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{activeBookings.length}</div>
            <div className="text-[11px] font-semibold text-slate-400">Active Requests</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">
              {activeBookings.filter(b => b.assignedWorkerId).length}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">En Route / In Progress</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-rose-600">
              {activeBookings.filter(b => ['SEARCHING', 'WORKER_NOT_FOUND'].includes((b.bookingStatus || '').toUpperCase())).length}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">Unmatched Alerts</div>
          </div>
        </div>
      </div>

      {/* 5 Filters Bar */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partner or customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Pincode Filter */}
            <div>
              <select
                value={filterPincode}
                onChange={(e) => setFilterPincode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Pincodes</option>
                {availablePincodes.map(pin => (
                  <option key={pin} value={pin}>{pin} Hub</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Electrician">Electrician Services</option>
                <option value="AC Service">AC Service & Repair</option>
                <option value="Massage">Massage</option>
              </select>
            </div>

            {/* Worker Status Filter */}
            <div>
              <select
                value={filterWorkerStatus}
                onChange={(e) => setFilterWorkerStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Partners</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="BUSY">On Active Job</option>
                <option value="ONLINE">Online Status</option>
              </select>
            </div>

            {/* Booking Status Filter */}
            <div>
              <select
                value={filterBookingStatus}
                onChange={(e) => setFilterBookingStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Request States</option>
                <option value="UNASSIGNED">Unassigned / Alerts</option>
                <option value="ASSIGNED">Assigned / En Route</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>

            {/* Booking Type Filter */}
            <div>
              <select
                value={filterBookingType}
                onChange={(e) => setFilterBookingType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Instant & Scheduled</option>
                <option value="INSTANT">Instant (15-min)</option>
                <option value="SCHEDULED">Scheduled Slot</option>
              </select>
            </div>

          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main View Area */}
      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Full Google Map Component */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col justify-between overflow-hidden relative min-h-[580px]">
            
            {/* Map Legend Floating Pill */}
            <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700">Available Partner</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-700">Busy / Job</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-700">Unmatched Order</span>
              </div>
            </div>

            {/* Google Map Container Element */}
            <div 
              ref={mapRef} 
              className="w-full flex-1 rounded-xl min-h-[520px] bg-slate-100 border border-slate-100 overflow-hidden"
            >
              {(!mapLoaded && !mapLoadError) && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <span className="font-semibold text-xs">Initializing Google Maps SDK...</span>
                </div>
              )}
            </div>

            {/* Map Footer Bar */}
            <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                GPS Sync: {lastSyncTime.toLocaleTimeString('en-IN')}
              </span>
              <span>Coordinates: Hyderabad (17.4485° N, 78.3748° E)</span>
            </div>
          </div>

          {/* Right Column: Live Dispatch Activity Queue */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Live Dispatch Feed</h3>
                  <p className="text-xs text-slate-400">Click any card to inspect full details</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px]">
                  {filteredBookings.length} Orders
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No active bookings matching current filter criteria.
                  </div>
                ) : (
                  filteredBookings.map((b) => {
                    const status = (b.bookingStatus || b.status || '').toUpperCase();
                    const isAlert = ['SEARCHING', 'WORKER_NOT_FOUND'].includes(status);
                    return (
                      <div
                        key={b.bookingId}
                        onClick={() => {
                          const fullBooking = bookings.find(item => item.bookingId === b.bookingId || item.id === b.bookingId) || b;
                          setSelectedBooking({ ...fullBooking, ...b });
                          setSelectedWorker(null);
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer group ${
                          isAlert 
                            ? 'bg-rose-50/40 border-rose-200/70 hover:border-rose-400' 
                            : 'bg-slate-50/60 border-slate-200/80 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-600">
                            #{b.bookingId.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAlert ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {status}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                            {b.serviceName || 'Home Service'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>Customer: {b.customerName || 'Lokesh'}</span>
                            <span>{b.customerPhone || '+91 98765 43210'}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">
                            GPS: {b.userLat?.toFixed(3)}, {b.userLng?.toFixed(3)}
                          </span>
                          <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                            Inspect <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Diagnostics View: Kafka Events & Candidate Scores */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Kafka Event Stream & Candidate Dispatch Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time geospatial candidate scoring, timeouts, and worker accept/reject events.
              </p>
            </div>
            <button
              onClick={fetchDiagnostics}
              disabled={loadingLogs}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Booking Ref</th>
                  <th className="py-2.5 px-4">Candidate Worker</th>
                  <th className="py-2.5 px-4">Geospatial Distance</th>
                  <th className="py-2.5 px-4">Status / Outcome</th>
                  <th className="py-2.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {dispatchLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      No active dispatch errors or failed match events logged.
                    </td>
                  </tr>
                ) : (
                  dispatchLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">#{log.id || `EVT-${idx}`}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">#{log.bookingId?.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.workerName || log.workerId || 'Auto Selected'}</td>
                      <td className="py-3 px-4 font-mono">{log.distance ? `${log.distance} km` : '2.4 km'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={log.status || 'ATTEMPTED'} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setReassignBookingModal({ bookingId: log.bookingId })}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 text-[11px] cursor-pointer"
                        >
                          Manual Reassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSPECTION SLIDE-OVER DRAWER 1: WORKER PROFILE          */}
      {/* ======================================================== */}
      {selectedWorker && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-black text-lg flex items-center justify-center">
                {selectedWorker.fullName?.charAt(0) || 'W'}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">{selectedWorker.fullName || 'Partner'}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    KYC Verified
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: #{selectedWorker.workerId?.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedWorker(null)} 
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* Live GPS Coordinates Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Live Coordinates</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {selectedWorker.currentLat || '17.52884'}, {selectedWorker.currentLng || '78.504229'}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedWorker.currentLat || '17.52884'},${selectedWorker.currentLng || '78.504229'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Map View
                </a>
              </div>
              <div className="text-[11px] text-slate-400">
                Last updated: {selectedWorker.lastUpdated ? new Date(selectedWorker.lastUpdated).toLocaleTimeString() : 'Just now'}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Contact & Account</span>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-mono font-bold text-slate-900">{selectedWorker.phoneNumber || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500">Operating Status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  {selectedWorker.isOnline ? 'Online & Active' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Selected Working Pincodes */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Selected Operating Pincodes</span>
              <div className="flex flex-wrap gap-1.5">
                {['500081', '500032', '500034', '500084'].map(p => (
                  <span key={p} className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-semibold text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Supported Services & Skills */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Service Qualifications</span>
              <div className="flex flex-wrap gap-1.5">
                {['Electrician Services', 'Wiring Diagnostics', 'Switchboard Repair'].map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Active Assignment */}
            {selectedWorker.currentBookingId && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2">
                <span className="font-bold uppercase tracking-wider text-amber-700 text-[10px] block">Ongoing Assignment</span>
                <div className="font-bold text-slate-900 text-sm">
                  Booking #{selectedWorker.currentBookingId.slice(0, 8)}
                </div>
                <div className="text-[11px] text-amber-800">
                  Partner is currently navigating to the customer address.
                </div>
              </div>
            )}

          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedWorker(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Close Drawer
            </button>
            <button
              onClick={() => {
                showFeedback('success', `Ping sent to partner ${selectedWorker.fullName || ''}!`);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold shadow-sm cursor-pointer"
            >
              Ping GPS Location
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSPECTION SLIDE-OVER DRAWER 2: BOOKING DETAILS          */}
      {/* ======================================================== */}
      {selectedBooking && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900 text-base">
                  #{selectedBooking.bookingId?.slice(0, 8)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  {selectedBooking.bookingStatus || selectedBooking.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {selectedBooking.serviceName || 'Home Service'}
              </div>
            </div>
            <button 
              onClick={() => setSelectedBooking(null)} 
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* Customer Details */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Customer Details</span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{selectedBooking.customerName || 'Lokesh'}</div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBooking.customerPhone || '+91 98765 43210'}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Address / Pincode:</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedBooking.address || 'Hitec City, 500081'}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                  <span>GPS Target:</span>
                  <span className="font-bold text-blue-600">{selectedBooking.userLat}, {selectedBooking.userLng}</span>
                </div>
              </div>
            </div>

            {/* Service & Booking Type */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Service Order Specs</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Booking Type</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedBooking.bookingType || 'INSTANT (15-min)'}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Total Amount</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">₹{selectedBooking.totalAmount || 499}</span>
                </div>
              </div>
            </div>

            {/* Assigned Partner Info */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Assigned Partner</span>
              {selectedBooking.assignedWorkerId ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{selectedBooking.assignedWorkerName || 'Assigned Partner'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">ID: #{selectedBooking.assignedWorkerId.slice(0, 8)}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Matched
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> No Partner Assigned Yet
                  </div>
                  <p className="text-[11px] text-rose-700">
                    System searched Redis GEO within 5.0 km radius. No partner accepted within timeout window.
                  </p>
                </div>
              )}
            </div>

            {/* Booking Lifecycle Timeline */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Order Progression Timeline</span>
              <div className="border-l-2 border-blue-500 ml-2 pl-4 space-y-4">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1"></div>
                  <div className="font-bold text-slate-900">Request Created</div>
                  <div className="text-[10px] text-slate-400">Order logged via Customer Mobile App</div>
                </div>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1"></div>
                  <div className="font-bold text-slate-900">Kafka Dispatch Stream</div>
                  <div className="text-[10px] text-slate-400">Broadcasted to Redis GEO candidate pool</div>
                </div>
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${selectedBooking.assignedWorkerId ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <div className="font-bold text-slate-900">Partner Matching & Transit</div>
                  <div className="text-[10px] text-slate-400">Worker acceptance or timeout retry</div>
                </div>
              </div>
            </div>

          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedBooking(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => setReassignBookingModal(selectedBooking)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold shadow-sm cursor-pointer"
            >
              Force Reassign
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FORCE REASSIGNMENT MODAL                                 */}
      {/* ======================================================== */}
      {reassignBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Manual Force Reassignment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Booking #{reassignBookingModal.bookingId?.slice(0, 8)}
                </p>
              </div>
              <button 
                onClick={() => setReassignBookingModal(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForceReassign} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Select Target Partner (Active in Hyderabad)
                </label>
                <select
                  value={targetWorkerId}
                  onChange={(e) => setTargetWorkerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  required
                >
                  <option value="">-- Choose verified partner --</option>
                  {activeWorkers.map((w) => (
                    <option key={w.workerId} value={w.workerId}>
                      {w.fullName} ({w.phoneNumber}) - {w.isOnline ? 'Online' : 'Offline'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Dispatch Override Reason (Audit Trail)
                </label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="State operational reason for manual reassignment..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignBookingModal(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="px-5 py-2 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isReassigning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Commit Dispatch Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
