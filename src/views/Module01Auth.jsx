import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, Check, ShieldCheck, Zap, Clock, Cloud, 
  Truck, MapPin, Bell, ArrowRight, Loader2, Database, AlertCircle, X, CheckCircle2 
} from 'lucide-react';

/**
 * Modern SVG Logo for HomeEase matching official branding
 */
export const HomeEaseLogo = ({ theme = 'light', size = 'default' }) => {
  const isDark = theme === 'dark';
  const iconSize = size === 'large' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'large' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${iconSize} flex-shrink-0`}>
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          {/* Cyan Roof Eaves / Slant */}
          <path 
            d="M 6 22 L 20 8 L 24 12 L 10 26 Z" 
            fill="url(#cyanGrad)" 
          />
          {/* Deep Royal Blue Main Roof & Building Structure */}
          <path 
            d="M 20 8 L 36 24 L 36 38 L 18 38 L 18 19 Z" 
            fill="url(#blueGrad)" 
          />
          {/* Cyan Foundation Step Block */}
          <path 
            d="M 8 34 L 18 34 L 18 38 L 8 38 Z" 
            fill="#00E5FF" 
          />
          {/* 4 Crisp Cyan Window Panes (2x2 Grid) */}
          <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
          <rect x="28" y="24" width="4" height="4" rx="0.5" fill="#38BDF8" />
          <rect x="22" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />
          <rect x="28" y="30" width="4" height="4" rx="0.5" fill="#38BDF8" />

          {/* Gradients */}
          <defs>
            <linearGradient id="cyanGrad" x1="6" y1="8" x2="24" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00E5FF" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="blueGrad" x1="18" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`${textSize} font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          Home<span className={isDark ? 'text-sky-400' : 'text-blue-600'}>Ease</span>
        </span>
      </div>
    </div>
  );
};

export const Module01Auth = ({ onLoginSuccess, currentRole, setCurrentRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [latency, setLatency] = useState(34);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Subtle live ping simulation for latency
  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return Math.max(28, Math.min(42, next));
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please enter your administrator email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your secure access password');
      return;
    }

    setIsAuthenticating(true);

    // Simulate enterprise JWT SSL handshake & credential validation
    setTimeout(() => {
      setIsAuthenticating(false);
      sessionStorage.setItem('homeease_admin_authenticated', 'true');
      sessionStorage.setItem('homeease_admin_user', email);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 750);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#030914] select-none">
      {/* ========================================================================= */}
      {/* LEFT PANEL: Hero & Microservices Architecture (Dark Futuristic Navy)      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex relative w-full lg:w-1/2 bg-gradient-to-br from-[#020713] via-[#051126] to-[#081B3B] p-8 sm:p-12 lg:p-16 flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        
        {/* Subtle Background Radial Tech Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Ambient Subtle Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38BDF8 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Top Header: Brand Logo & Tagline */}
        <div className="relative z-10 space-y-1">
          <HomeEaseLogo theme="dark" size="large" />
          <p className="text-xs text-slate-400 font-medium tracking-wide pl-1">
            Smarter Operations. Happier Homes.
          </p>
        </div>

        {/* Middle Hero Section: Headline & Interactive Microservices Tree */}
        <div className="relative z-10 my-10 lg:my-0 space-y-8 max-w-xl">
          {/* Main Headline */}
          <div className="space-y-2.5">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-normal text-white tracking-tight leading-tight">
              Powering a Connected <br />
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">
                Home Delivery
              </span>{' '}
              <span className="font-extrabold text-white">Ecosystem</span>
            </h2>
            <p className="text-slate-300/80 text-xs sm:text-sm leading-relaxed max-w-lg font-normal">
              Our microservices architecture ensures high availability, real-time tracking and seamless delivery operations across the entire network.
            </p>
          </div>

          {/* Connected Architecture Flow Diagram */}
          <div className="relative pt-4 pb-2">
            
            {/* Top Node: Monolith (Core Application) */}
            <div className="flex justify-center">
              <div className="relative px-6 py-3.5 rounded-2xl bg-[#0B1A3B]/85 border border-sky-500/50 shadow-xl shadow-sky-950/50 flex items-center gap-3.5 backdrop-blur-md hover:border-sky-400 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/40 flex-shrink-0 group-hover:scale-105 transition-transform">
                  {/* Layered Database / Server Stack Icon */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-1.5 rounded-full bg-white shadow-xs" />
                    <div className="w-5 h-1.5 rounded-full bg-sky-100 shadow-xs" />
                    <div className="w-5 h-1.5 rounded-full bg-blue-100 shadow-xs" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide leading-none">Monolith</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Core Application</p>
                </div>
              </div>
            </div>

            {/* Tree Branching Vector Connector Lines */}
            <div className="relative w-full flex flex-col items-center my-0.5 pointer-events-none">
              {/* Vertical line from Monolith to Junction */}
              <div className="w-[2px] h-6 bg-sky-500/70" />
              
              {/* Glowing Central Junction Dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 ring-4 ring-cyan-500/30 shadow-[0_0_8px_#38BDF8]" />

              {/* Horizontal Distribution Line across 3 children */}
              <div className="relative w-[78%] h-[2px] bg-sky-500/60 flex justify-between items-start">
                {/* Left Branch Drop line */}
                <div className="w-[2px] h-6 bg-sky-500/60 -ml-[1px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 -ml-[2px] mt-5 ring-2 ring-teal-500/30" />
                </div>
                {/* Center Branch Drop line */}
                <div className="w-[2px] h-6 bg-sky-500/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 -ml-[2px] mt-5 ring-2 ring-sky-500/30" />
                </div>
                {/* Right Branch Drop line */}
                <div className="w-[2px] h-6 bg-sky-500/60 -mr-[1px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 -ml-[2px] mt-5 ring-2 ring-purple-500/30" />
                </div>
              </div>
            </div>

            {/* Bottom 3 Microservices Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-2">
              
              {/* Node 1: Dispatch */}
              <div className="rounded-2xl bg-[#091D33]/85 border border-teal-500/35 p-3.5 sm:p-4 text-center flex flex-col items-center gap-2 hover:border-teal-400/70 transition-all duration-300 shadow-lg shadow-teal-950/30 group">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-white tracking-wide">Dispatch</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Logistics & Assignment</p>
                </div>
              </div>

              {/* Node 2: Tracking */}
              <div className="rounded-2xl bg-[#092244]/85 border border-sky-500/45 p-3.5 sm:p-4 text-center flex flex-col items-center gap-2 hover:border-sky-400/80 transition-all duration-300 shadow-lg shadow-sky-950/40 group">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-white tracking-wide">Tracking</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Real-time Location</p>
                </div>
              </div>

              {/* Node 3: Notification */}
              <div className="rounded-2xl bg-[#17143B]/85 border border-purple-500/35 p-3.5 sm:p-4 text-center flex flex-col items-center gap-2 hover:border-purple-400/70 transition-all duration-300 shadow-lg shadow-purple-950/30 group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-white tracking-wide">Notification</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Alerts & Communication</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-300 leading-snug">
              Secure Architecture
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-800/80 sm:pl-3">
            <Zap className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-300 leading-snug">
              High Availability
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-800/80 sm:pl-3">
            <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-300 leading-snug">
              Real-time Tracking
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-800/80 sm:pl-3">
            <Cloud className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-300 leading-snug">
              Scalable Infrastructure
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: Operations Portal Sign-In (Clean Crisp White)                */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        
        <div className="max-w-[440px] w-full space-y-6">
          
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center space-y-2">
            <HomeEaseLogo theme="light" size="large" />

            <div className="pt-2">
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#0B1528] tracking-tight leading-tight">
                HomeEase Operations Portal
              </h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase mt-1">
                RESTRICTED ACCESS
              </p>
            </div>
          </div>

          {/* Validation Error Alert if any */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@homeease.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" /> Secure
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Session Options: Remember Checkbox & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-medium text-slate-600">
                  Remember this hardware session
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#0084FF] via-[#2563EB] to-[#7C3AED] hover:from-[#0076E5] hover:to-[#6D28D9] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-80"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  {/* Circular Spinner Ring Graphic matching the screenshot */}
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white inline-block animate-spin" style={{ animationDuration: '3s' }} />
                  <span>Authenticate & Enter Control Room</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* System Status Pill Banner */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs transition">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-bold text-slate-800">AWS</span>
              <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
                ap-southeast-2 (Sydney)
              </span>
            </div>

            <span className="text-slate-300">|</span>

            <div className="text-slate-500 font-medium text-[11px] sm:text-xs">
              System Status: <span className="text-emerald-600 font-bold">Healthy</span>{' '}
              <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">
                (Latency {latency}ms)
              </span>
            </div>
          </div>

          {/* Security Compliance Footer Note */}
          <div className="pt-2 flex items-center justify-center gap-2 text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-[11px] leading-snug">
              Unauthorized access is logged with IP & client fingerprinting under SOC2 compliance.
            </p>
          </div>

        </div>

        {/* Modal: Forgot Password / Credentials Recovery */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Reset Portal Password</h3>
                <button 
                  onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!forgotSent ? (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your registered corporate admin email. An encrypted authentication recovery link will be dispatched immediately.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Admin Email</label>
                    <input 
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@homeease.com"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Dispatch Recovery Link
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-2.5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800">Recovery Link Dispatched</h4>
                  <p className="text-[11px] text-slate-500">
                    Instructions sent to <span className="font-semibold text-slate-700">{forgotEmail}</span>. Link expires in 15 minutes.
                  </p>
                  <button 
                    onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                    className="mt-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    Return to Sign-In
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
