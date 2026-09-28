import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, LogOut, Clock, Calendar, Database } from 'lucide-react';
import { UserProfile, CycleSchedule } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCycle: string;
  onCycleChange: (c: string) => void;
  selectedKelas: string;
  onKelasChange: (k: string) => void;
  selectedBulan: string;
  onBulanChange: (b: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserProfile;
  onLogout: () => void;
  cycleSchedules?: CycleSchedule[];
  onOpenSupabaseModal?: () => void;
  isSupabaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCycle,
  onCycleChange,
  selectedKelas,
  onKelasChange,
  selectedBulan,
  onBulanChange,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  cycleSchedules,
  onOpenSupabaseModal,
  isSupabaseConnected = false
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds}`);

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      setDateStr(now.toLocaleDateString('id-ID', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const cycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3.5 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-20 shadow-xs transition-colors duration-200">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari ID Pelanggan atau Nama Industri..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Filter and User Controls */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
        {/* Cycle Filter */}
        <select
          value={selectedCycle}
          onChange={(e) => onCycleChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
        >
          <option value="ALL">Semua Cycle (1-15)</option>
          {cycles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Kelas Filter */}
        <select
          value={selectedKelas}
          onChange={(e) => onKelasChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
        >
          <option value="ALL">Semua Kelas</option>
          <option value="Premium">Premium</option>
          <option value="Platinum">Platinum</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>

        {/* Bulan Filter (1 Tahun Penuh - 12 Bulan) */}
        <select
          value={selectedBulan}
          onChange={(e) => onBulanChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
        >
          <option value="ALL">Semua Bulan (1 Tahun)</option>
          <option value="Januari 2026">Januari 2026</option>
          <option value="Februari 2026">Februari 2026</option>
          <option value="Maret 2026">Maret 2026</option>
          <option value="April 2026">April 2026</option>
          <option value="Mei 2026">Mei 2026</option>
          <option value="Juni 2026">Juni 2026</option>
          <option value="Juli 2026">Juli 2026</option>
          <option value="Agustus 2026">Agustus 2026</option>
          <option value="September 2026">September 2026</option>
          <option value="Oktober 2026">Oktober 2026</option>
          <option value="November 2026">November 2026</option>
          <option value="Desember 2026">Desember 2026</option>
        </select>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Ganti Mode Terang / Gelap"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Mode Gelap</span>
            </>
          )}
        </button>

        {/* Supabase Backend Live Status & Config Button */}
        {onOpenSupabaseModal && (
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isSupabaseConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Pengaturan & Status Integrasi Supabase Backend Realtime"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supabase:</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{isSupabaseConnected ? 'Live' : 'Config'}</span>
            </span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>

        {/* Real-time Clock Widget */}
        <div className="hidden xl:flex flex-col text-right pl-1">
          <div className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 text-[#0055A5] dark:text-blue-400" />
            <span className="text-xs font-extrabold text-[#0055A5] dark:text-blue-400 font-mono tabular-nums">
              {timeStr}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Calendar className="w-2.5 h-2.5 text-slate-400" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E86216] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.avatar}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight">
                {currentUser.title}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 md:px-2.5 md:py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
