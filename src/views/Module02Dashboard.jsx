import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, CalendarCheck, TrendingUp, IndianRupee, ArrowUpRight, 
  ShieldCheck, Activity, RefreshCw, PieChart as PieIcon, Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatusBadge } from '../components/StatusBadge';

export const Module02Dashboard = ({ 
  metrics, 
  rawStats, 
  categories = [], 
  ledger = [], 
  auditLogs = [],
  onNavigateModule, 
  onRefreshMetrics, 
  isRefreshing 
}) => {
  const [timeRange, setTimeRange] = useState('7D');
  const [selectedMetric, setSelectedMetric] = useState('gmv'); // gmv | bookings | commission

  // Extract from raw live stats if available or fallback
  const totalUsers = rawStats?.totalUsersCount ?? metrics?.totalCustomers?.value ?? 0;
  const activeWorkers = rawStats?.activeWorkersCount ?? metrics?.activeWorkers?.value ?? 0;
  const totalWorkers = rawStats?.totalWorkersCount ?? 0;
  const totalBookings = rawStats?.totalBookingsCount ?? metrics?.totalBookings?.value ?? 0;
  const completedBookings = rawStats?.completedBookingsCount ?? 0;
  const totalRev = rawStats?.totalRevenue ?? 0;
  const totalComm = rawStats?.totalPlatformCommission ?? 0;

  const formattedRevenue = rawStats 
    ? `₹${totalRev.toLocaleString('en-IN')}` 
    : '₹0';

  const formattedCommission = rawStats
    ? `₹${totalComm.toLocaleString('en-IN')}`
    : '₹0';

  // Compute Revenue Trend dynamically from live ledger or backend stats
  const revenueTrendData = useMemo(() => {
    if (ledger && ledger.length > 0) {
      // Group ledger by date/status
      return ledger.map((item, idx) => ({
        month: item.date ? item.date.split(' ')[0] : `Day ${idx + 1}`,
        gmv: item.grossAmount || 0,
        commission: item.platformCommissionAmount || item.commission || 0,
        bookings: 1
      }));
    }

    // Default trend curve reflecting live backend total revenue
    const baseRev = totalRev > 0 ? totalRev : 0;
    const baseComm = totalComm > 0 ? totalComm : 0;
    const baseBookings = totalBookings > 0 ? totalBookings : 0;

    return [
      { month: 'Day 1', gmv: Math.round(baseRev * 0.1), commission: Math.round(baseComm * 0.1), bookings: Math.round(baseBookings * 0.1) },
      { month: 'Day 2', gmv: Math.round(baseRev * 0.2), commission: Math.round(baseComm * 0.2), bookings: Math.round(baseBookings * 0.2) },
      { month: 'Day 3', gmv: Math.round(baseRev * 0.35), commission: Math.round(baseComm * 0.35), bookings: Math.round(baseBookings * 0.35) },
      { month: 'Day 4', gmv: Math.round(baseRev * 0.5), commission: Math.round(baseComm * 0.5), bookings: Math.round(baseBookings * 0.5) },
      { month: 'Day 5', gmv: Math.round(baseRev * 0.7), commission: Math.round(baseComm * 0.7), bookings: Math.round(baseBookings * 0.7) },
      { month: 'Day 6', gmv: Math.round(baseRev * 0.85), commission: Math.round(baseComm * 0.85), bookings: Math.round(baseBookings * 0.85) },
      { month: 'Today', gmv: baseRev, commission: baseComm, bookings: baseBookings },
    ];
  }, [ledger, totalRev, totalComm, totalBookings]);

  // Compute category distribution dynamically from live categories
  const categoryBreakdown = useMemo(() => {
    const palette = ['#2563EB', '#16A34A', '#D97706', '#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981'];
    if (!categories || categories.length === 0) return [];
    
    const count = categories.length;
    return categories.map((cat, idx) => ({
      name: cat.name,
      value: Math.round(100 / count),
      amount: `${cat.subServicesCount || 0} sub-services`,
      color: palette[idx % palette.length]
    }));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Executive Dashboard Overview</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Real-time platform metrics, service order trends, revenue performance, and system activity logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Telemetry
          </div>
          <button 
            onClick={onRefreshMetrics}
            disabled={isRefreshing}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/20 ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh Live Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Customers */}
        <div 
          onClick={() => onNavigateModule && onNavigateModule('customers')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Registered Users</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalUsers.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Total registered accounts on AWS</div>
        </div>

        {/* Active Workers */}
        <div 
          onClick={() => onNavigateModule && onNavigateModule('workers')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Workers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{activeWorkers.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Online
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Total Partners: {totalWorkers}</div>
        </div>

        {/* Total Bookings */}
        <div 
          onClick={() => onNavigateModule && onNavigateModule('dispatch')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Bookings</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalBookings.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Completed: {completedBookings.toLocaleString()}</div>
        </div>

        {/* GMV & Commission Earnings */}
        <div 
          onClick={() => onNavigateModule && onNavigateModule('financials')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">GMV & Commission</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{formattedRevenue}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Platform Commission: {formattedCommission}</div>
        </div>
      </div>

      {/* Main Interactive Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Booking Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Revenue & Booking Volume Growth
              </h3>
              <p className="text-xs text-slate-500">Gross Merchandise Value (GMV) vs Platform Commission Split</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button 
                  onClick={() => setSelectedMetric('gmv')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${selectedMetric === 'gmv' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
                >
                  GMV
                </button>
                <button 
                  onClick={() => setSelectedMetric('commission')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${selectedMetric === 'commission' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Commission
                </button>
                <button 
                  onClick={() => setSelectedMetric('bookings')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${selectedMetric === 'bookings' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'}`}
                >
                  Bookings
                </button>
              </div>

              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
                <option value="YTD">Year to Date</option>
              </select>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => selectedMetric === 'bookings' ? v : `₹${v.toLocaleString()}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => selectedMetric === 'bookings' ? [val, 'Bookings'] : [`₹${Number(val).toLocaleString()}`, selectedMetric.toUpperCase()]}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke={selectedMetric === 'commission' ? '#16A34A' : selectedMetric === 'bookings' ? '#D97706' : '#2563EB'} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill={selectedMetric === 'commission' ? 'url(#colorCommission)' : 'url(#colorGmv)'} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Category Breakdown Doughnut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" /> Category Breakdown
            </h3>
            <p className="text-xs text-slate-500">Service distribution from live catalog</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center p-4 text-xs text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                No active categories loaded yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      formatter={(val, name, item) => [`${val}% (${item.payload.amount})`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-400">Total GMV</span>
                  <span className="text-sm font-black text-slate-800">{formattedRevenue}</span>
                </div>
              </>
            )}
          </div>

          {/* Category Legend Table */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            {categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                </div>
                <div className="font-bold text-slate-800 font-mono">
                  {cat.value}% <span className="text-slate-400 font-normal">({cat.amount})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live System Audit Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Platform Security & Audit Event Feed
            </h3>
            <p className="text-xs text-slate-500">Real-time log of administrator actions and system overrides</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-xl">Timestamp</th>
                <th className="py-2.5 px-4">Admin User</th>
                <th className="py-2.5 px-4">Action Performed</th>
                <th className="py-2.5 px-4">Target Entity</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-600">No security audit events recorded</div>
                    <div className="text-xs text-slate-400 mt-0.5">Admin actions and authorization triggers during this session will be logged here.</div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.admin}</td>
                    <td className="py-3 px-4 text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-blue-600 font-semibold">{log.target}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
