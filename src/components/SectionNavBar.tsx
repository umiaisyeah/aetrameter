import React from 'react';
import { Database, Calendar, CheckCircle2, Receipt, History, TrendingUp, Sparkles } from 'lucide-react';
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
  // Compute metrics for badges and progress
  const totalCustomers = customers.length;
  const unreadCount = customers.filter((c) => c.status === 'Belum Dibaca').length;
  const pendingCount = customers.filter((c) => c.status === 'Pending Verification').length;
  const verifiedCount = customers.filter((c) => c.status === 'Verified').length;
  const invoicedCount = customers.filter((c) => c.status === 'Invoiced').length;

  const totalVerifiedAndInvoiced = verifiedCount + invoicedCount;
  const verificationRate = totalCustomers > 0 ? Math.round((totalVerifiedAndInvoiced / totalCustomers) * 100) : 0;
  const billingRate = totalVerifiedAndInvoiced > 0 ? Math.round((invoicedCount / totalVerifiedAndInvoiced) * 100) : 0;

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
      badge: `${totalVerifiedAndInvoiced}/${totalCustomers}`,
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
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 md:px-6 shadow-xs sticky top-0 z-20 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden xl:inline whitespace-nowrap">
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
                    ? 'bg-gradient-to-r from-[#0055A5] to-blue-600 text-white shadow-md ring-2 ring-blue-400/40 dark:ring-blue-600/40'
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

        {/* Live Colorful Progress Indicator in Section Bar (Context-Specific) */}
        <div className="flex items-center gap-3 shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Progress Verifikasi Reading Bar - Khusus di Section Verifikasi Reading */}
          {activeTab === 'monitoring' && workflowFilter === 'Pending Verification' && (
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold shadow-xs animate-in fade-in"
              title="Progress Verifikasi Reading"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">Progress Verifikasi:</span>
              </div>
              <div className="w-20 sm:w-28 h-2.5 bg-emerald-200/80 dark:bg-emerald-900 rounded-full overflow-hidden p-0.5 border border-emerald-300/40">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${verificationRate}%` }}
                />
              </div>
              <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">
                {verificationRate}%
              </span>
            </div>
          )}

          {/* Progress Billing & Invoicing Bar - Khusus di Section Billing & Invoicing */}
          {activeTab === 'monitoring' && workflowFilter === 'Verified' && (
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-300 text-[11px] font-bold shadow-xs animate-in fade-in"
              title="Progress Billing & Invoicing"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">Progress Billing:</span>
              </div>
              <div className="w-20 sm:w-28 h-2.5 bg-purple-200/80 dark:bg-purple-900 rounded-full overflow-hidden p-0.5 border border-purple-300/40">
                <div
                  className="h-full bg-gradient-to-r from-[#E86216] via-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${billingRate}%` }}
                />
              </div>
              <span className="font-mono font-black text-xs text-purple-700 dark:text-purple-300">
                {billingRate}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
