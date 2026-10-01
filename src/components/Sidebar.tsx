import React from 'react';
import { AetraLogo } from './AetraLogo';
import { Database, CheckCircle2, Receipt, History, Calendar, X, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  workflowFilter: string;
  onSelectTab: (tab: string, statusFilter?: string) => void;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  workflowFilter,
  onSelectTab,
  currentUser,
  isOpen,
  onClose
}) => {
  const navItems = [
    {
      id: 'database',
      label: 'Database & Input Cycle',
      description: 'Master data industri & cycle',
      icon: Database,
      badge: 'Master'
    },
    {
      id: 'monitoring',
      label: 'Monitoring Pembacaan Cycle',
      description: 'Siklus catat meter 1 - 15',
      icon: Calendar,
      statusFilter: 'ALL',
      badge: 'Live 1-15'
    },
    {
      id: 'pending',
      label: 'Verifikasi Reading',
      description: 'Validasi stand & foto BPM',
      icon: CheckCircle2,
      targetTab: 'monitoring',
      statusFilter: 'Pending Verification',
      badge: 'Validasi'
    },
    {
      id: 'verified',
      label: 'Billing & Invoicing',
      description: 'Penerbitan faktur tagihan air',
      icon: Receipt,
      targetTab: 'monitoring',
      statusFilter: 'Verified',
      badge: 'Invoicing'
    },
    {
      id: 'audit',
      label: 'Log Audit & Aktivitas',
      description: 'Jejak rekam histori sistem',
      icon: History,
      badge: 'Log'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay with smooth fade */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Main Sidebar with ultra-smooth gliding transition and rich gradient */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[width,transform,opacity] select-none border-r border-cyan-500/25 dark:border-blue-900/40 ${
          isOpen
            ? 'w-72 translate-x-0 opacity-100'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'
        } bg-gradient-to-b from-[#021b3d] via-[#052e5e] via-[#084285] to-[#01142b] dark:from-[#030d1c] dark:via-[#071d3a] dark:via-[#0b2b52] dark:to-[#020b17] text-slate-100`}
      >
        {/* Ambient Decorative Gradient Highlights */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none transition-transform duration-1000" />
        <div className="absolute bottom-20 left-0 w-56 h-56 bg-[#E86216]/25 rounded-full blur-3xl pointer-events-none transition-transform duration-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle Shimmer Line on edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Top Header & Navigation */}
        <div className="relative z-10 p-4 space-y-5">
          {/* Logo Card with Glossy Glassmorphism */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl py-3 px-4 shadow-xl border border-white/20 dark:border-slate-700/80 flex items-center justify-start transition-all duration-300 hover:scale-[1.01] hover:shadow-cyan-500/10 min-w-0">
              <AetraLogo className="w-full" />
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white md:hidden transition cursor-pointer shrink-0"
              title="Tutup Menu Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick System Badge */}
          <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin shrink-0" />
              <div className="min-w-0">
                <span className="font-black text-white text-xs tracking-wider block">SIMBA</span>
                <span className="text-[8px] font-bold text-cyan-200 truncate block">Sistem Integrasi Metering &amp; Billing</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-mono text-[9px] font-black border border-emerald-400/30 shrink-0 ml-1">
              ONLINE
            </span>
          </div>

          {/* Navigation Links with Micro-Interactions */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              let isActive = false;
              if (item.id === 'database') {
                isActive = activeTab === 'database';
              } else if (item.id === 'monitoring') {
                isActive =
                  activeTab === 'monitoring' &&
                  (workflowFilter === 'ALL' ||
                    (workflowFilter !== 'Pending Verification' && workflowFilter !== 'Verified'));
              } else if (item.id === 'pending') {
                isActive = activeTab === 'monitoring' && workflowFilter === 'Pending Verification';
              } else if (item.id === 'verified') {
                isActive = activeTab === 'monitoring' && workflowFilter === 'Verified';
              } else if (item.id === 'audit') {
                isActive = activeTab === 'audit';
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.targetTab) {
                      onSelectTab(item.targetTab, item.statusFilter);
                    } else {
                      onSelectTab(item.id, item.statusFilter);
                    }
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer relative overflow-hidden group text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E86216] via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/30 scale-[1.02]'
                      : 'text-blue-100/90 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }`}
                >
                  {/* Left Indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white rounded-r-full shadow-xs" />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'bg-white/5 text-blue-200 group-hover:bg-white/15 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-extrabold">{item.label}</span>
                      <span className={`block text-[10px] font-medium truncate ${
                        isActive ? 'text-orange-100' : 'text-blue-300/70'
                      }`}>
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${
                    isActive ? 'text-white translate-x-0.5' : 'text-blue-300/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                  }`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & System Status Card */}
        <div className="relative z-10 p-4 border-t border-white/15 bg-black/20 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#E86216] to-amber-400 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                {currentUser.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-white truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-blue-200/80 truncate leading-tight">
                  {currentUser.title}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-300/70 font-medium">
            <span>PT Aetra Air Tangerang</span>
            <span className="font-mono">© 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
};
