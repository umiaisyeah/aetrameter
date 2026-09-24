import React from 'react';
import { AetraLogo } from './AetraLogo';
import { BarChart3, Database, CheckCircle2, Receipt, History, Building2 } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  workflowFilter: string;
  onSelectTab: (tab: string, statusFilter?: string) => void;
  currentUser: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, workflowFilter, onSelectTab, currentUser }) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview SIMBA-IN',
      icon: BarChart3,
      statusFilter: 'ALL'
    },
    {
      id: 'database',
      label: 'Database & Input Cycle',
      icon: Database
    },
    {
      id: 'pending',
      label: 'Verifikasi Reading',
      icon: CheckCircle2,
      targetTab: 'overview',
      statusFilter: 'Pending Verification'
    },
    {
      id: 'verified',
      label: 'Billing & Invoicing',
      icon: Receipt,
      targetTab: 'overview',
      statusFilter: 'Verified'
    },
    {
      id: 'audit',
      label: 'Log Audit & Aktivitas',
      icon: History
    }
  ];

  return (
    <aside className="w-64 bg-[#003E78] dark:bg-slate-950 text-slate-200 flex flex-col justify-between p-4 hidden md:flex border-r border-blue-900/60 dark:border-slate-800 shadow-xl shrink-0 h-full">
      <div>
        <div className="bg-white rounded-xl p-3.5 mb-6 shadow-md border border-blue-100 flex items-center justify-center">
          <AetraLogo className="h-8" />
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            let isActive = false;
            if (item.id === 'overview') {
              isActive =
                activeTab === 'overview' &&
                (workflowFilter === 'ALL' ||
                  (workflowFilter !== 'Pending Verification' && workflowFilter !== 'Verified'));
            } else if (item.id === 'pending') {
              isActive = activeTab === 'overview' && workflowFilter === 'Pending Verification';
            } else if (item.id === 'verified') {
              isActive = activeTab === 'overview' && workflowFilter === 'Verified';
            } else if (item.id === 'database') {
              isActive = activeTab === 'database';
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#E86216] text-white shadow-md'
                    : 'text-blue-100/90 hover:bg-[#0055A5] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-blue-800/60 dark:border-slate-800 px-1 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-blue-200/80">
          <Building2 className="w-3.5 h-3.5 text-orange-400" />
          <span className="truncate">Unit Pelayanan Industri</span>
        </div>
        <p className="text-[10px] text-blue-300/60">PT Aetra Air Tangerang © 2026</p>
      </div>
    </aside>
  );
};
