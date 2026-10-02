import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { IndustryCustomer } from '../types';
import { exportCustomersToExcel, exportCustomersToCsv, ExportSection } from '../utils/exportHelper';
import { showToast } from '../utils/notificationSystem';

interface ExportDropdownButtonProps {
  customers: IndustryCustomer[];
  section?: ExportSection;
  label?: string;
  className?: string;
}

export const ExportDropdownButton: React.FC<ExportDropdownButtonProps> = ({
  customers,
  section = 'all',
  label = 'Unduh Data',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    setIsOpen(false);
    exportCustomersToExcel(customers, section);
    showToast({
      title: 'Unduh Excel Berhasil! 📗',
      message: `File Excel (.xlsx) dengan ${customers.length} data industri berhasil diunduh.`,
      type: 'success'
    });
  };

  const handleExportCsv = () => {
    setIsOpen(false);
    exportCustomersToCsv(customers, section);
    showToast({
      title: 'Unduh CSV Berhasil! 📄',
      message: `File CSV (.csv) dengan ${customers.length} data industri berhasil diunduh.`,
      type: 'success'
    });
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3.5 py-2 rounded-xl bg-[#0055A5] hover:bg-[#003E78] active:scale-95 text-white font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer border border-blue-400/30 whitespace-nowrap shrink-0"
        title="Pilih format unduh Excel (.xlsx) atau CSV (.csv)"
      >
        <Download className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Pilih Format Unduh:
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-100">Format Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400">Format tabel terstruktur resmi</span>
              </div>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              XLSX
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-100">Format CSV (.csv)</span>
                <span className="text-[10px] text-slate-400">Kompatibel sistem database</span>
              </div>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              CSV
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
