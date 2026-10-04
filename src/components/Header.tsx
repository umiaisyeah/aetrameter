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
  Menu,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { UserProfile, CycleSchedule } from '../types';
import { SimbaLogo } from './SimbaLogo';

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
  onSyncNow?: () => void;
  isSyncing?: boolean;
  lastSyncText?: string;
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
  onToggleSidebar,
  onSyncNow,
  isSyncing = false,
  lastSyncText = 'Baru saja'
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
    <div className="sticky top-0 z-30 shadow-md">
      {/* Top Colorful System Text Marquee Ticker */}
      <div className="bg-gradient-to-r from-[#001738] via-[#004b93] via-[#0284c7] via-[#059669] via-[#d97706] to-[#E86216] text-white py-1 px-3 text-[11px] font-extrabold flex items-center gap-2 overflow-hidden border-b border-white/15 shadow-sm">
        <span className="bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-slate-950 animate-spin" />
          <span>SISTEM AKTIF</span>
        </span>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee font-black tracking-wide text-white drop-shadow-xs">
            🌊 SIMBA (Sistem Integrasi Metering &amp; Billing Aetra Air Tangerang) &nbsp;—&nbsp; ⚡ STATUS SISTEM: Real-Time Live Sync Admin &amp; Field Reader App &nbsp;—&nbsp; 👥 SINKRONISASI PENUGASAN PETUGAS: Key Account &amp; Kontraktor &nbsp;—&nbsp; 🏢 PT AETRA AIR TANGERANG
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20 text-white shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ONLINE</span>
        </span>
      </div>

      {/* Micro Rainbow Accent Stripe */}
      <div className="h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 via-emerald-400 via-amber-400 to-[#E86216]" />

      <header className="bg-gradient-to-r from-[#071933] via-[#0a2752] via-[#00478f] to-[#082046] dark:from-[#020b18] dark:via-[#071933] dark:to-[#051833] text-white shadow-xl border-b border-cyan-500/25 transition-colors duration-200">
        {/* Tier 1: Main Header Navigation Bar */}
        <div className="p-2.5 sm:px-4 flex items-center justify-between gap-3 border-b border-white/10">
          {/* Left: Sidebar Toggle, SIMBA Brand Logo & Search Input */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 max-w-xl">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 transition cursor-pointer border border-white/15 shadow-xs"
                title="Sembunyikan / Tampilkan Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* SIMBA Brand Badge: Logo SIMBA di atas, PT Aetra Air Tangerang di bawahnya */}
            <div className="flex items-center shrink-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-white/20">
              <SimbaLogo variant="compact" />
            </div>

            {/* Search Bar - High Contrast & Guaranteed Clickable */}
            <div className="relative flex-1 min-w-[170px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari ID Pelanggan atau Industri..."
                autoComplete="off"
                className="w-full pl-9 pr-8 py-2 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-xs font-semibold shadow-inner border border-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-black p-1 cursor-pointer z-10"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right: Clock Widget, Dark Mode & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Real-time Clock Widget */}
            <div className="hidden lg:flex flex-col text-right pr-2.5 border-r border-white/20">
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-xs font-black text-white font-mono tabular-nums tracking-wide">
                  {timeStr}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-blue-200 font-medium">
                <CalendarIcon className="w-2.5 h-2.5 text-blue-300" />
                <span>{dateStr}</span>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-md"
              title="Ganti Mode Terang / Gelap"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span className="hidden xl:inline text-xs font-bold">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-200" />
                  <span className="hidden xl:inline text-xs font-bold">Gelap</span>
                </>
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E86216] to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-md border border-white/30 shrink-0">
                {currentUser.avatar}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-black text-white leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-blue-200 leading-tight">
                  {currentUser.title}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-rose-500/80 hover:bg-rose-600 text-white border border-rose-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ml-1"
                title="Keluar dari sistem"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Filters & Operational Toolbar */}
        <div className="px-3 py-2 sm:px-4 bg-slate-950/25 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Cycle Filter, Kelas Filter, Month Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline-block text-[11px] font-extrabold text-cyan-200 uppercase tracking-wider mr-0.5">
              Filter:
            </span>

            {/* Cycle Filter */}
            <select
              value={selectedCycle}
              onChange={(e) => onCycleChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-white text-[#003E78] dark:bg-slate-800 dark:text-white border border-white/40 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
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
              className="px-2.5 py-1.5 text-xs font-bold bg-white text-[#003E78] dark:bg-slate-800 dark:text-white border border-white/40 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 cursor-pointer"
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
                    ? 'bg-amber-500 text-white border-amber-400'
                    : selectedBulan !== 'ALL'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/25 backdrop-blur-md'
                }`}
                title="Pilih Bulan dan Tahun Kalender Tagihan"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  {selectedBulan === 'ALL' ? `Semua Bulan (${calendarYear})` : selectedBulan}
                </span>
              </button>

              {/* Calendar Picker Dropdown Modal */}
              {isCalendarOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800 dark:text-slate-100">
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
          </div>

          {/* Right: Operational Status Badges & Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-time Auto-Sync Indicator & Instant Trigger Button */}
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 backdrop-blur-md"
                title="Sinkronisasi Otomatis Cloud Real-Time (Klik untuk sinkronkan sekarang)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline font-bold">Sync:</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-300 font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isSyncing ? 'Proses...' : 'Live'}</span>
                </span>
              </button>
            )}

            {/* Mobile Field Reader Quick Switcher */}
            {onSwitchToFieldReader && (
              <button
                type="button"
                onClick={onSwitchToFieldReader}
                className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-[#E86216] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition shadow-md border border-orange-400/40 flex items-center gap-1.5 cursor-pointer"
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
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                }`}
                title="Pengaturan & Status Integrasi Supabase Backend Realtime"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supabase:</span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{isSupabaseConnected ? 'Live' : 'Config'}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

