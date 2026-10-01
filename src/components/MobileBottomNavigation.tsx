import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Receipt,
  Database,
  History,
  Smartphone,
  Sparkles,
  Layers
} from 'lucide-react';
import { IndustryCustomer, UserProfile } from '../types';

interface MobileBottomNavigationProps {
  activeTab: string;
  workflowFilter: string;
  onSelectTab: (tab: string, statusFilter?: string) => void;
  customers: IndustryCustomer[];
  currentUser: UserProfile;
  onSwitchToFieldReader?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  workflowFilter,
  onSelectTab,
  customers,
  currentUser,
  onSwitchToFieldReader
}) => {
  // Metric counts for badges
  const totalCustomers = customers.length;
  const pendingCount = customers.filter((c) => c.status === 'Pending Verification').length;
  const verifiedCount = customers.filter((c) => c.status === 'Verified').length;
  const readCount = customers.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;

  const handleTabClick = (tab: string, statusFilter?: string) => {
    // Optional light haptic feedback on supported mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    onSelectTab(tab, statusFilter);
  };

  const navItems = [
    {
      id: 'monitoring',
      label: 'Monitoring',
      shortLabel: 'Monitor',
      icon: Calendar,
      tab: 'monitoring',
      statusFilter: 'ALL',
      isActive:
        activeTab === 'monitoring' &&
        (workflowFilter === 'ALL' ||
          (workflowFilter !== 'Pending Verification' && workflowFilter !== 'Verified')),
      badge: `${readCount}/${totalCustomers}`,
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 'verifikasi',
      label: 'Verifikasi',
      shortLabel: 'Verifikasi',
      icon: CheckCircle2,
      tab: 'monitoring',
      statusFilter: 'Pending Verification',
      isActive: activeTab === 'monitoring' && workflowFilter === 'Pending Verification',
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse'
    },
    {
      id: 'billing',
      label: 'Billing',
      shortLabel: 'Billing',
      icon: Receipt,
      tab: 'monitoring',
      statusFilter: 'Verified',
      isActive: activeTab === 'monitoring' && workflowFilter === 'Verified',
      badge: verifiedCount > 0 ? verifiedCount : undefined,
      badgeColor: 'bg-purple-600 text-white'
    },
    {
      id: 'database',
      label: 'Database',
      shortLabel: 'Database',
      icon: Database,
      tab: 'database',
      statusFilter: undefined,
      isActive: activeTab === 'database',
      badge: undefined
    },
    {
      id: 'audit',
      label: 'Audit Log',
      shortLabel: 'Audit',
      icon: History,
      tab: 'audit',
      statusFilter: undefined,
      isActive: activeTab === 'audit',
      badge: undefined
    }
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden print:hidden select-none pointer-events-auto">
      {/* Safe Area Gradient Backdrop */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] px-2 pt-1.5 pb-2">
        {/* Subtle Top Accent Color Stripe */}
        <div className="absolute -top-px left-0 right-0 h-0.5 bg-gradient-to-r from-[#0055A5] via-[#00A3E0] via-emerald-500 via-amber-500 to-[#E86216]" />

        {/* 5-Button Thumb Navigation Grid */}
        <div className="grid grid-cols-5 gap-1 items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.tab, item.statusFilter)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
                  active
                    ? 'bg-gradient-to-b from-blue-50 to-blue-100/70 dark:from-blue-950/80 dark:to-slate-800 text-[#0055A5] dark:text-blue-400 font-black shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
                }`}
              >
                {/* Active Indicator Micro Pill Top */}
                {active && (
                  <span className="absolute -top-1 w-6 h-1 rounded-full bg-[#0055A5] dark:bg-blue-400 shadow-[0_0_8px_rgba(0,85,165,0.6)] animate-in fade-in duration-200" />
                )}

                {/* Icon with Relative Badge */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                    }`}
                  />
                  {/* Badge Counter */}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[8px] font-black leading-none shadow-xs border border-white dark:border-slate-900 ${
                        item.badgeColor || 'bg-blue-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label text */}
                <span
                  className={`text-[9.5px] mt-1 tracking-tight truncate max-w-full ${
                    active ? 'font-black' : 'font-bold'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick 1-Tap Floating Field Reader Quick Access Ribbon on Mobile */}
        {onSwitchToFieldReader && (
          <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate font-bold text-[9px]">
                {currentUser.name} ({currentUser.title})
              </span>
            </div>
            <button
              type="button"
              onClick={onSwitchToFieldReader}
              className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-[#E86216] text-white font-extrabold text-[9px] shadow-xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
            >
              <Smartphone className="w-2.5 h-2.5" />
              <span>Buka Mode Lapangan ↗</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
