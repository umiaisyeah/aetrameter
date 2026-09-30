import React from 'react';
import { AetraLogo } from './AetraLogo';
import { Database, CheckCircle2, Receipt, History, Calendar, X } from 'lucide-react';
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
      icon: Database
    },
    {
      id: 'monitoring',
      label: 'Monitoring Pembacaan Cycle',
      icon: Calendar,
      statusFilter: 'ALL'
    },
    {
      id: 'pending',
      label: 'Verifikasi Reading',
      icon: CheckCircle2,
      targetTab: 'monitoring',
      statusFilter: 'Pending Verification'
    },
    {
      id: 'verified',
      label: 'Billing & Invoicing',
      icon: Receipt,
      targetTab: 'monitoring',
      statusFilter: 'Verified'
    },
    {
      id: 'audit',
      label: 'Log Audit & Aktivitas',
      icon: History
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#003E78] dark:bg-slate-950 text-slate-200 flex flex-col justify-between p-4 border-r border-blue-900/60 dark:border-slate-800 shadow-xl shrink-0 h-full transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="bg-white rounded-xl p-3 shadow-md border border-blue-100 flex items-center justify-center flex-1">
              <AetraLogo className="h-7" />
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-blue-900/40 hover:bg-blue-800 text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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

        <div className="pt-4 border-t border-blue-800/60 dark:border-slate-800 px-1">
          <p className="text-[10px] text-blue-300/60">PT Aetra Air Tangerang © 2026</p>
        </div>
      </aside>
    </>
  );
};
