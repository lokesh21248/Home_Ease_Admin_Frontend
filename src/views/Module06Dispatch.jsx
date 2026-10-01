import React, { useState } from 'react';
import { 
  MapPin, Radio, Clock, UserCheck, AlertTriangle, Navigation, 
  ArrowRight, Phone, RefreshCw, Zap, ShieldAlert, CheckCircle, ChevronRight, Layers
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Module06Dispatch = ({ liveMapData, onRefresh, isRefreshing }) => {
  const onlineWorkersCount = liveMapData?.totalOnlineWorkers ?? 0;
  const activeBookingsCount = liveMapData?.totalActiveBookings ?? 0;
  const activeWorkers = liveMapData?.activeWorkers || [];
  const activeBookings = liveMapData?.activeBookings || [];

  const [selectedItem, setSelectedItem] = useState(activeBookings[0] || activeWorkers[0] || null);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Live Map & Fleet Tracking</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Live partner coordinates, active job fulfillment routes, and real-time geospatial field coverage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Fleet Tracking
          </div>
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/20 ${isRefreshing ? 'animate-spin' : ''}`}
            title="Poll Live GPS"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Simulation + Job Telemetric Cards */}
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
            <span>AWS Telemetry Server: 3.107.161.126:8080</span>
            <span>Protocol: REST / Lat-Lng Coordinates</span>
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
                {activeBookings.map((b) => (
                  <div 
                    key={b.bookingId}
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
    </div>
  );
};
