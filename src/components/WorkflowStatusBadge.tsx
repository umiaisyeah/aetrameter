import React from 'react';
import { WorkflowStatus } from '../types';
import { Clock, CheckCircle2, ShieldCheck, AlertCircle, Camera, Receipt, Sparkles } from 'lucide-react';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  catatan?: string;
  hasPhoto?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showProgressTrack?: boolean;
  showPhotoBadge?: boolean;
  className?: string;
}

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  catatan,
  hasPhoto = true,
  size = 'md',
  showProgressTrack = true,
  showPhotoBadge = true,
  className = ''
}) => {
  // Determine stage progression: 0 = Belum Dibaca, 1 = Pending Verification, 2 = Verified, 3 = Invoiced
  const stage =
    status === 'Invoiced'
      ? 3
      : status === 'Verified'
      ? 2
      : status === 'Pending Verification'
      ? 1
      : 0;

  const progressPercent = stage === 3 ? 100 : stage === 2 ? 66 : stage === 1 ? 33 : 0;

  // Badge visual configuration
  const config = {
    'Belum Dibaca': {
      label: 'Belum Dibaca',
      bgClass: 'bg-slate-100 dark:bg-slate-800/80',
      textClass: 'text-slate-600 dark:text-slate-300',
      borderClass: 'border-slate-300 dark:border-slate-700',
      dotClass: 'bg-slate-400 dark:bg-slate-500',
      trackColor: 'bg-slate-300 dark:bg-slate-700',
      icon: Clock,
      pulse: false,
      glowShadow: ''
    },
    'Pending Verification': {
      label: 'Pending Verifikasi',
      bgClass: 'bg-amber-50 dark:bg-amber-950/70',
      textClass: 'text-amber-800 dark:text-amber-300',
      borderClass: 'border-amber-300 dark:border-amber-700/80',
      dotClass: 'bg-amber-500 animate-ping',
      trackColor: 'bg-amber-500',
      icon: Clock,
      pulse: true,
      glowShadow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]'
    },
    'Verified': {
      label: 'Verified (Siap Billing)',
      bgClass: 'bg-blue-50 dark:bg-blue-950/70',
      textClass: 'text-[#0055A5] dark:text-blue-300',
      borderClass: 'border-blue-300 dark:border-blue-700/80',
      dotClass: 'bg-blue-500',
      trackColor: 'bg-[#0055A5] dark:bg-blue-500',
      icon: CheckCircle2,
      pulse: false,
      glowShadow: 'shadow-[0_0_12px_rgba(0,85,165,0.2)]'
    },
    'Invoiced': {
      label: 'Invoiced (Faktur Terbit)',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/70',
      textClass: 'text-emerald-800 dark:text-emerald-300',
      borderClass: 'border-emerald-300 dark:border-emerald-700/80',
      dotClass: 'bg-emerald-500',
      trackColor: 'bg-emerald-500',
      icon: ShieldCheck,
      pulse: false,
      glowShadow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]'
    }
  }[status] || {
    label: status,
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-400',
    trackColor: 'bg-slate-400',
    icon: Clock,
    pulse: false,
    glowShadow: ''
  };

  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col gap-1.5 transition-all duration-300 ${className}`}>
      {/* Top Main Status Pill Badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold transition-all duration-300 select-none ${config.bgClass} ${config.textClass} ${config.borderClass} ${config.glowShadow}`}
        >
          {/* Animated Status Dot / Beacon */}
          <span className="relative flex h-2 w-2 shrink-0">
            {config.pulse && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${
                stage === 3
                  ? 'bg-emerald-500'
                  : stage === 2
                  ? 'bg-blue-500'
                  : stage === 1
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
          </span>

          <IconComponent className="w-3 h-3 shrink-0 transition-transform duration-300" />
          <span className="tracking-tight">{config.label}</span>

          {stage === 3 && (
            <Sparkles className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400 animate-pulse shrink-0" />
          )}
        </div>

        {/* Optional Photo Attachment Sub-Badge */}
        {showPhotoBadge && (
          <>
            {!hasPhoto || status === 'Belum Dibaca' ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200">
                <Camera className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>Foto &amp; BPM: Menunggu</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-200">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Foto &amp; BPM Terlampir</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* Visual Micro-Progress Stepper Bar */}
      {showProgressTrack && (
        <div className="w-full max-w-[200px] space-y-1">
          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 dark:text-slate-500 px-0.5">
            <span className={stage >= 1 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : ''}>1. Baca</span>
            <span className={stage >= 2 ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>2. Verifikasi</span>
            <span className={stage >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>3. Faktur</span>
          </div>

          {/* Connected track bar with 3 segments */}
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.2 flex gap-0.5">
            {/* Segment 1: Pencatatan (Reading) */}
            <div
              className={`h-full flex-1 rounded-full transition-all duration-500 ease-out ${
                stage >= 1 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-transparent'
              }`}
            />
            {/* Segment 2: Verifikasi (Verification) */}
            <div
              className={`h-full flex-1 rounded-full transition-all duration-500 ease-out ${
                stage >= 2 ? 'bg-[#0055A5] dark:bg-blue-400' : 'bg-transparent'
              }`}
            />
            {/* Segment 3: Billing / Invoiced */}
            <div
              className={`h-full flex-1 rounded-full transition-all duration-500 ease-out ${
                stage >= 3 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-transparent'
              }`}
            />
          </div>
        </div>
      )}

      {/* Field Note / History Snippet */}
      {catatan && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs truncate leading-tight font-sans">
          {catatan}
        </p>
      )}
    </div>
  );
};
