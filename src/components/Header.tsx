import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Clock,
  Calendar as CalendarIcon,
  Database,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarDays,
  Menu
} from 'lucide-react';
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
  onSwitchToFieldReader?: () => void;
  onToggleSidebar?: () => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

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
  isSupabaseConnected = false,
  onSwitchToFieldReader,
  onToggleSidebar
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Extract initial year from selectedBulan if available
  useEffect(() => {
    if (selectedBulan !== 'ALL') {
      const match = selectedBulan.match(/\d{4}/);
      if (match) {
        setCalendarYear(parseInt(match[0], 10));
      }
    }
  }, [selectedBulan]);

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
      {/* Search Input & Sidebar Toggle */}
      <div className="flex items-center gap-2 w-full md:w-80">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shrink-0 transition"
            title="Sembunyikan / Tampilkan Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari ID Pelanggan atau Nama Industri..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
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

        {/* INTERACTIVE YEAR & MONTH CALENDAR FILTER POPOVER */}
        <div className="relative" ref={calendarRef}>
          <button
            type="button"
            onClick={() => setIsCalendarOpen((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-2 shadow-xs cursor-pointer ${
              isCalendarOpen
                ? 'bg-[#0055A5] text-white border-[#0055A5]'
                : selectedBulan !== 'ALL'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0055A5] dark:text-blue-300 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-slate-400'
            }`}
            title="Pilih Bulan dan Tahun Kalender Tagihan"
          >
            <CalendarDays className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>
              {selectedBulan === 'ALL' ? `Semua Bulan (${calendarYear})` : selectedBulan}
            </span>
          </button>

          {/* Calendar Picker Dropdown Modal */}
          {isCalendarOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95 text-xs">
              {/* Year Navigation Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCalendarYear((y) => y - 1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Tahun Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Tahun {calendarYear}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">Kalender Penagihan &amp; Catat Meter</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarYear((y) => y + 1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Tahun Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12 Month Grid */}
              <div className="grid grid-cols-3 gap-1.5 py-3">
                {MONTH_NAMES.map((mName) => {
                  const fullMonthStr = `${mName} ${calendarYear}`;
                  const isSelected = selectedBulan === fullMonthStr;
                  const isCurrentMonth = mName === 'September' && calendarYear === 2026;

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        onBulanChange(fullMonthStr);
                        setIsCalendarOpen(false);
                      }}
                      className={`py-2 px-1.5 rounded-xl font-bold text-center text-xs transition relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#0055A5] text-white shadow-xs font-black ring-2 ring-blue-300 dark:ring-blue-800'
                          : 'bg-slate-50 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      <div>{mName.slice(0, 3)}</div>
                      {isCurrentMonth && !isSelected && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1.5 right-1.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Preset Actions */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onBulanChange(`September ${calendarYear}`);
                    setIsCalendarOpen(false);
                  }}
                  className="w-full py-1.5 text-center text-[11px] font-bold text-[#0055A5] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition"
                >
                  Bulan Berjalan: September {calendarYear}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBulanChange('ALL');
                    setIsCalendarOpen(false);
                  }}
                  className={`w-full py-1.5 text-center text-[11px] font-bold rounded-lg transition ${
                    selectedBulan === 'ALL'
                      ? 'bg-[#E86216] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Tampilkan Semua Bulan (Tahun {calendarYear})
                </button>
              </div>
            </div>
          )}
        </div>

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

        {/* Mobile Field Reader Quick Switcher */}
        {onSwitchToFieldReader && (
          <button
            type="button"
            onClick={onSwitchToFieldReader}
            className="px-3 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Buka Antarmuka Aplikasi Pembaca Meter Lapangan"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mode Lapangan</span>
          </button>
        )}

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
            <CalendarIcon className="w-2.5 h-2.5 text-slate-400" />
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

