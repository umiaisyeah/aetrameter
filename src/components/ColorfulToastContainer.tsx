import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ToastOptions, notificationManager } from '../utils/notificationSystem';

type ActiveToast = ToastOptions & { id: string; createdAt: number };

export const ColorfulToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.registerToastListener((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[90] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((toast) => {
        const type = toast.type || 'info';

        const styleMap = {
          success: {
            border: 'border-emerald-500/50 dark:border-emerald-500/40',
            bg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
            accent: 'bg-emerald-500',
            icon: CheckCircle2,
            iconColor: 'text-emerald-500',
            title: toast.title || 'Operasi Berhasil',
            badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          },
          warning: {
            border: 'border-amber-500/50 dark:border-amber-500/40',
            bg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
            accent: 'bg-amber-500',
            icon: AlertTriangle,
            iconColor: 'text-amber-500',
            title: toast.title || 'Peringatan',
            badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          },
          error: {
            border: 'border-rose-500/50 dark:border-rose-500/40',
            bg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
            accent: 'bg-rose-500',
            icon: AlertCircle,
            iconColor: 'text-rose-500',
            title: toast.title || 'Kesalahan',
            badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          },
          info: {
            border: 'border-blue-500/50 dark:border-blue-500/40',
            bg: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
            accent: 'bg-[#0055A5]',
            icon: Info,
            iconColor: 'text-[#0055A5] dark:text-blue-400',
            title: toast.title || 'Informasi',
            badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }
        };

        const config = styleMap[type];
        const IconComponent = config.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} shadow-xl p-3.5 flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-top-3 fade-in`}
          >
            {/* Left colored accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />

            <div className="pt-0.5 pl-1 shrink-0">
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                  {config.title}
                </span>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${config.badgeBg}`}>
                  {type}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>

              {toast.actionText && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction!();
                    notificationManager.removeToast(toast.id);
                  }}
                  className="mt-2 text-xs font-bold text-[#0055A5] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{toast.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => notificationManager.removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
