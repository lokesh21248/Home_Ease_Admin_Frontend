import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, ShieldAlert, Zap, Radio } from 'lucide-react';

export const StatusBadge = ({ status, text }) => {
  const normalized = (status || text || '').toString().toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  if (['SUCCESS', 'APPROVED', 'VERIFIED', 'ACTIVE', 'ONLINE', 'COMPLETED', 'VIP'].some(k => normalized.includes(k))) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
    Icon = CheckCircle2;
  } else if (['PENDING', 'IN TRANSIT', 'IN PROGRESS', 'SCHEDULED', 'FLAGGED', 'WARNING', 'UNASSIGNED', 'SEARCHING'].some(k => normalized.includes(k))) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
    Icon = AlertTriangle;
  } else if (['ASSIGNED', 'CONFIRMED', 'ACCEPTED'].some(k => normalized.includes(k))) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm';
    Icon = CheckCircle2;
  } else if (['REJECTED', 'FAILED', 'BLOCKED', 'OFFLINE', 'EXPIRED', 'DEACTIVATED', 'REFUNDED', 'CANCELLED', 'CANCELED'].some(k => normalized.includes(k))) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm';
    Icon = XCircle;
  } else if (['BUSY', 'IN SERVICE'].some(k => normalized.includes(k))) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm';
    Icon = Radio;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{text || status}</span>
    </span>
  );
};
