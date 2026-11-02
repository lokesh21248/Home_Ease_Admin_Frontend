import React, { useState, useEffect } from 'react';
import { 
  MapPin, Radio, Clock, UserCheck, AlertTriangle, Navigation, 
  ArrowRight, Phone, RefreshCw, Zap, ShieldAlert, CheckCircle, ChevronRight, Layers, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { getDispatchLogs, getFailedDispatchBookings } from '../api/adminApi';

export const Module06Dispatch = ({ liveMapData, onRefresh, isRefreshing }) => {
  const onlineWorkersCount = liveMapData?.totalOnlineWorkers ?? 0;
  const activeBookingsCount = liveMapData?.totalActiveBookings ?? 0;
  const activeWorkers = liveMapData?.activeWorkers || [];
  const activeBookings = liveMapData?.activeBookings || [];

  const [selectedItem, setSelectedItem] = useState(activeBookings[0] || activeWorkers[0] || null);
  const [dispatchLogs, setDispatchLogs] = useState([]);
  const [failedBookings, setFailedBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'diagnostics'
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    fetchDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dispatch Operations & Fleet Telemetry</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Live partner coordinates, active fulfillment routes, and Kafka-Redis geospatial candidate dispatch diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Fleet Map
            </button>
            <button
              onClick={() => {
                setActiveTab('diagnostics');
                fetchDiagnostics();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'diagnostics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Dispatch Diagnostics
              {failedBookings.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          </div>
          <button 
            onClick={() => {
              if (onRefresh) onRefresh();
              fetchDiagnostics();
            }}
            disabled={isRefreshing || loadingLogs}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/20 ${isRefreshing || loadingLogs ? 'animate-spin' : ''}`}
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'fleet' ? (
        /* Main Grid: Interactive Map Simulation + Job Telemetric Cards */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Interactive Map Telemetry View */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl relative min-h-[460px] flex flex-col justify-between overflow-hidden">
            {/* Map Grid Background Graphics */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

            {/* Map Top Status Bar */}
            <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" /> Geolocation Cluster: <span className="text-blue-400 font-mono">Live Operations</span>
                </span>
                <span className="hidden sm:inline text-slate-500 font-mono">GPS Sync: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                  {onlineWorkersCount} Workers Online
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30">
                  {activeBookingsCount} In-Progress Jobs
                </span>
              </div>
            </div>

            {/* Interactive Map Pin Visualizer Canvas */}
            <div className="relative z-10 my-8 flex-1 min-h-[300px] flex items-center justify-center">
              {activeWorkers.length === 0 && activeBookings.length === 0 ? (
                <div className="text-center p-8 bg-slate-950/70 border border-slate-800 rounded-2xl backdrop-blur-sm max-w-sm">
                  <Navigation className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
                  <h4 className="text-white font-bold text-sm">Geospatial Fleet Tracking</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Real-time partner locations and active dispatch routes will render here as partners come online.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  {/* Render Active Workers as Live Pins */}
                  {activeWorkers.map((w, idx) => (
                    <div 
                      key={w.workerId || idx}
                      onClick={() => setSelectedItem({ type: 'worker', data: w })}
                      className="absolute cursor-pointer group transition transform hover:scale-110"
                      style={{
                        top: `${30 + (idx * 20) % 50}%`,
                        left: `${25 + (idx * 30) % 60}%`
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center text-white animate-pulse">
                        <Navigation className="w-5 h-5 text-emerald-400 rotate-45" />
                      </div>
                      <div className="mt-1 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-md text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                        {w.fullName} (Partner)
                      </div>
                    </div>
                  ))}

                  {/* Render Active Bookings as Live Pins */}
                  {activeBookings.map((b, idx) => (
                    <div 
                      key={b.bookingId || idx}
                      onClick={() => setSelectedItem({ type: 'booking', data: b })}
                      className="absolute cursor-pointer group transition transform hover:scale-110"
                      style={{
                        top: `${40 + (idx * 25) % 45}%`,
                        left: `${45 + (idx * 25) % 45}%`
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-600/30 border-2 border-amber-400 flex items-center justify-center text-white animate-pulse">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="mt-1 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-md text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                        {b.serviceName || 'Active Booking'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map Footer Telemetry Stats */}
            <div className="relative z-10 flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 gap-2">
              <span>Telemetry Server: AWS Port 8080</span>
              <span>Protocol: Redis GEO / Spatial Matching</span>
            </div>
          </div>

          {/* Right Dispatch Feed List */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Active Dispatch Queue
              </h3>
              <p className="text-xs text-slate-400">
                Real-time bookings and worker assignment telemetry.
              </p>

              {activeBookings.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                  0 Active in-progress dispatch bookings currently registered on live backend.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {activeBookings.map((b, idx) => (
                    <div 
                      key={b.bookingId || `booking-${idx}`}
                      onClick={() => setSelectedItem({ type: 'booking', data: b })}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition cursor-pointer bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{b.customerName}</span>
                        <StatusBadge status={b.bookingStatus || 'IN_PROGRESS'} />
                      </div>
                      <div className="text-[11px] text-blue-600 font-semibold">{b.serviceName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Partner: {b.assignedWorkerName || 'Unassigned'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-900 text-xs">Partner Availability Status</h4>
              <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
                <span>Online Partners (GPS Active):</span>
                <strong className="font-mono text-emerald-600">{onlineWorkersCount}</strong>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>In-Progress Fulfillment:</span>
                <strong className="font-mono text-amber-600">{activeBookingsCount}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Task 8: Dispatch Diagnostics & Failure Monitoring Screen */
        <div className="space-y-6">
          {/* Failed Bookings Alert Section */}
          {failedBookings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Unfulfilled Bookings ({failedBookings.length}) — No Available Partner Found</span>
                </div>
                <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                  Action Required
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {failedBookings.map((b) => (
                  <div key={b.bookingId} className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900 font-mono">#{b.bookingId.slice(0, 8)}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-semibold">
                        WORKER_NOT_FOUND
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">{b.serviceName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Location: {b.customerLat?.toFixed(4)}, {b.customerLng?.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispatch Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" /> Dispatch Audit & Candidate Matching Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete trace of spatial discovery, radius expansion tiers (5→10→15→20km), worker eligibility, and multi-channel delivery.
                </p>
              </div>
              <button
                onClick={fetchDiagnostics}
                disabled={loadingLogs}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh Logs
              </button>
            </div>

            {dispatchLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No dispatch audit entries found. New customer bookings will record dispatch attempts automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3 font-mono">Booking ID</th>
                      <th className="p-3">Customer Coords</th>
                      <th className="p-3">Radius Tier</th>
                      <th className="p-3">Candidates</th>
                      <th className="p-3">Delivery (Kafka / WS / FCM)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Rejection Breakdown</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {dispatchLogs.map((log) => {
                      let parsedReasons = null;
                      try {
                        if (log.rejectedWorkerReasons) {
                          parsedReasons = JSON.parse(log.rejectedWorkerReasons);
                        }
                      } catch {}

                      return (
                        <tr key={log.logId} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-800">
                            #{log.bookingId ? log.bookingId.slice(0, 8) : 'N/A'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {log.customerLat?.toFixed(3)}, {log.customerLng?.toFixed(3)}
                          </td>
                          <td className="p-3 text-blue-600 font-bold">
                            {(log.searchRadiusMeters / 1000).toFixed(0)} km
                          </td>
                          <td className="p-3 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              log.eligibleWorkersCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.eligibleWorkersCount} found
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="text-emerald-600 font-bold">K:</span> {log.kafkaStatus || 'OK'} •{' '}
                            <span className="text-blue-600 font-bold">WS:</span> {log.websocketStatus || 'OK'} •{' '}
                            <span className="text-indigo-600 font-bold">FCM:</span> {log.fcmStatus || 'OK'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              log.assignmentStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                              log.assignmentStatus === 'WORKER_NOT_FOUND' ? 'bg-rose-100 text-rose-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {log.assignmentStatus || 'SEARCHING'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">
                            {parsedReasons && Object.keys(parsedReasons).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(parsedReasons).map(([wId, reason], i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-600">
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[10px]">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 'Just now'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
