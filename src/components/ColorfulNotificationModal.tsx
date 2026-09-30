import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  X,
  ArrowRight,
  Database,
  Layers,
  FileCheck2,
  Check
} from 'lucide-react';
import { ColorfulModalOptions, notificationManager } from '../utils/notificationSystem';

export const ColorfulNotificationModal: React.FC = () => {
  const [modal, setModal] = useState<ColorfulModalOptions | null>(null);
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    const unsubscribe = notificationManager.registerModalListener((newModal) => {
      setModal(newModal);
      setProgress(100);
    });
    return unsubscribe;
  }, []);

  // Handle auto-close timer if specified
  useEffect(() => {
    if (!modal?.autoCloseMs) return;

    const intervalMs = 50;
    const totalSteps = modal.autoCloseMs / intervalMs;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const remainingPercent = Math.max(0, 100 - (currentStep / totalSteps) * 100);
      setProgress(remainingPercent);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        notificationManager.closeModal();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [modal]);

  // Keyboard shortcut (Escape or Enter to close/confirm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modal) return;
      if (e.key === 'Escape') {
        if (modal.onCancel) modal.onCancel();
        notificationManager.closeModal();
      } else if (e.key === 'Enter') {
        if (modal.onConfirm) modal.onConfirm();
        notificationManager.closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  if (!modal) return null;

  const type = modal.type || 'info';

  // Distinctive vibrant theme styles
  const themes = {
    success: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      ambientGlow: 'bg-emerald-500/20',
      borderGlow: 'border-emerald-400/40 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30',
      buttonBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30',
      icon: CheckCircle2,
      label: 'BERHASIL'
    },
    warning: {
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      ambientGlow: 'bg-amber-500/20',
      borderGlow: 'border-amber-400/40 dark:border-amber-500/40',
      badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30',
      buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30',
      icon: AlertTriangle,
      label: 'PERHATIAN'
    },
    error: {
      gradient: 'from-rose-500 via-red-500 to-pink-500',
      ambientGlow: 'bg-rose-500/20',
      borderGlow: 'border-rose-400/40 dark:border-rose-500/40',
      badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      iconBg: 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30',
      buttonBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
      icon: AlertCircle,
      label: 'PERINGATAN'
    },
    info: {
      gradient: 'from-[#0055A5] via-blue-500 to-cyan-500',
      ambientGlow: 'bg-blue-500/20',
      borderGlow: 'border-blue-400/40 dark:border-blue-500/40',
      badgeBg: 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      iconBg: 'bg-gradient-to-tr from-[#0055A5] to-cyan-500 text-white shadow-blue-500/30',
      buttonBg: 'bg-gradient-to-r from-[#0055A5] to-blue-600 hover:from-[#003E78] hover:to-blue-700 text-white shadow-blue-500/30',
      icon: Info,
      label: 'INFORMASI'
    }
  };

  const currentTheme = themes[type];
  const IconComponent = currentTheme.icon;

  // Auto-detect tags / highlights from message (e.g. ID, Nama, Cycle, Kelas, Pembaca Meter)
  const defaultTags = modal.tags || (modal.message.includes('Cycle') ? ['ID Pelanggan', 'Nama Industri', 'Cycle', 'Kelas', 'Pembaca Meter'] : []);

  const handleConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    notificationManager.closeModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) modal.onCancel();
    notificationManager.closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Decorative ambient color light behind modal */}
      <div
        className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${currentTheme.ambientGlow} -top-10 -left-10`}
      />
      <div
        className={`absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${currentTheme.ambientGlow} -bottom-10 -right-10`}
      />

      {/* Main Modal Card */}
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 ${currentTheme.borderGlow} overflow-hidden animate-in zoom-in-95 duration-200 transition-all`}
      >
        {/* Top vibrant colorful gradient stripe */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${currentTheme.gradient}`} />

        {/* Modal Header & Content */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Row: Floating Icon + Badges + Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 shrink-0 ${currentTheme.iconBg}`}
              >
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-2xs ${currentTheme.badgeBg}`}
                  >
                    {modal.badge || currentTheme.label}
                  </span>
                  {type === 'success' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                      <span>SIMBA-IN Live</span>
                    </span>
                  )}
                </div>
                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white mt-1 leading-snug">
                  {modal.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Notifikasi (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Special Visual Data Counter Card (If count is available, e.g. 250 Data Industri) */}
          {modal.count !== undefined && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/40 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-emerald-950/30 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0055A5] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Volume Data
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none mt-0.5">
                    {modal.count.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-sans font-bold text-[#E86216]">Industri</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Siap Dibaca</span>
                </span>
              </div>
            </div>
          )}

          {/* Formatted Message Body */}
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="whitespace-pre-line">{modal.message}</p>

            {/* Recognized metadata tags / chips */}
            {defaultTags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#0055A5]" />
                  <span>Kolom Terintegrasi:</span>
                </span>
                {defaultTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white dark:bg-slate-700 text-[#0055A5] dark:text-blue-300 border border-slate-200 dark:border-slate-600 shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Additional details bullets if any */}
            {modal.details && modal.details.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700 space-y-1">
                {modal.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-close Progress Countdown Bar */}
          {modal.autoCloseMs && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ease-linear duration-50 bg-gradient-to-r ${currentTheme.gradient}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Interactive Button Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {modal.cancelText && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {modal.cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${currentTheme.buttonBg}`}
            >
              <span>{modal.confirmText || 'Oke, Mengerti'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
