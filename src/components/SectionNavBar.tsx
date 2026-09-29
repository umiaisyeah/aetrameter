import React from 'react';
import { Database, Calendar, CheckCircle2, Receipt, History } from 'lucide-react';
import { IndustryCustomer, UserProfile } from '../types';

interface SectionNavBarProps {
  activeTab: string;
  workflowFilter: string;
  onSelectTab: (tab: string, statusFilter?: string) => void;
  customers: IndustryCustomer[];
  currentUser: UserProfile;
}

export const SectionNavBar: React.FC<SectionNavBarProps> = ({
  activeTab,
  workflowFilter,
  onSelectTab,
  customers,
  currentUser
}) => {
  // Compute counts for badges
  const totalCustomers = customers.length;
  const pendingCount = customers.filter((c) => c.status === 'Pending Verification' || c.status === 'Belum Dibaca').length;
  const verifiedCount = customers.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;

  const sections = [
    {
      id: 'database',
      label: 'Database & Input Cycle',
      shortLabel: 'Database',
      icon: Database,
      badge: totalCustomers,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
    },
    {
      id: 'monitoring',
      label: 'Monitoring Pembacaan Cycle',
      shortLabel: 'Monitoring Cycle',
      icon: Calendar,
      statusFilter: 'ALL',
      badge: `${customers.filter((c) => c.status !== 'Belum Dibaca').length}/${totalCustomers}`,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
    },
    {
      id: 'pending',
      label: 'Verifikasi Reading',
      shortLabel: 'Verifikasi Reading',
      icon: CheckCircle2,
      targetTab: 'monitoring',
      statusFilter: 'Pending Verification',
      badge: pendingCount,
      badgeColor: pendingCount > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    },
    {
      id: 'verified',
      label: 'Billing & Invoicing',
      shortLabel: 'Billing & Invoice',
      icon: Receipt,
      targetTab: 'monitoring',
      statusFilter: 'Verified',
      badge: verifiedCount,
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
    },
    {
      id: 'audit',
      label: 'Log Audit & Aktivitas',
      shortLabel: 'Log Audit',
      icon: History
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 md:px-6 shadow-xs sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden lg:inline whitespace-nowrap">
          Menu Utama:
        </span>
        {sections.map((item) => {
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
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#0055A5] text-white shadow-md ring-2 ring-blue-400/40 dark:ring-blue-600/40'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-[#E86216]'}`} />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="inline sm:hidden">{item.shortLabel}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
