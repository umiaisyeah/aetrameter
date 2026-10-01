import React, { useState, useMemo } from 'react';
import { AuditLog, IndustryCustomer } from '../types';
import { History, Trash2, Search, Filter, Calendar as CalendarIcon, X, User, CheckCircle2, RotateCcw } from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
  customers?: IndustryCustomer[];
}

const MONTH_NAMES_MAP: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember'
};

const MONTH_CODE_SHORT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des'
};

export const AuditView: React.FC<AuditViewProps> = ({ logs, onClearLogs, customers = [] }) => {
  const [searchTxt, setSearchTxt] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // List of all distinct users, ensuring all 6 Admins and Billing are always listed
  const allKnownUsers = useMemo(() => {
    const defaultUsers = [
      'Akhmad Solihin',
      'Kabul Nugroho',
      'Tri Kartono',
      'Bayu Pramono',
      'Yaya Sunarya',
      'Melva Sinaga'
    ];
    const logUsers = logs.map((l) => l.user);
    return Array.from(new Set([...defaultUsers, ...logUsers]));
  }, [logs]);

  // Helper to parse log date string (formats: '25 Sep 2026 ...' or '25/09/2026' or '2026-09-25')
  const parseLogDate = (timeStr: string) => {
    // Check if starts with dd Mon yyyy (e.g., 25 Sep 2026)
    const matchDmy = timeStr.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (matchDmy) {
      const day = matchDmy[1].padStart(2, '0');
      const monthStr = matchDmy[2].toLowerCase();
      const year = matchDmy[3];

      let monthNum = '09';
      if (monthStr.startsWith('jan')) monthNum = '01';
      else if (monthStr.startsWith('feb')) monthNum = '02';
      else if (monthStr.startsWith('mar')) monthNum = '03';
      else if (monthStr.startsWith('apr')) monthNum = '04';
      else if (monthStr.startsWith('mei') || monthStr.startsWith('may')) monthNum = '05';
      else if (monthStr.startsWith('jun')) monthNum = '06';
      else if (monthStr.startsWith('jul')) monthNum = '07';
      else if (monthStr.startsWith('agu') || monthStr.startsWith('aug')) monthNum = '08';
      else if (monthStr.startsWith('sep')) monthNum = '09';
      else if (monthStr.startsWith('okt') || monthStr.startsWith('oct')) monthNum = '10';
      else if (monthStr.startsWith('nov')) monthNum = '11';
      else if (monthStr.startsWith('des') || monthStr.startsWith('dec')) monthNum = '12';

      return {
        isoDate: `${year}-${monthNum}-${day}`,
        monthNum,
        year
      };
    }

    // Check if ISO date yyyy-mm-dd
    const matchIso = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchIso) {
      return {
        isoDate: `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`,
        monthNum: matchIso[2],
        year: matchIso[1]
      };
    }

    return null;
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search
      const q = searchTxt.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.desc.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q) ||
        log.time.toLowerCase().includes(q);

      // 2. User Filter
      const matchUser =
        userFilter === 'ALL' ||
        log.user.toLowerCase().trim() === userFilter.toLowerCase().trim();

      // 3. Calendar Date Filter (exact date from <input type="date" />)
      let matchCalendarDate = true;
      if (selectedCalendarDate) {
        const parsed = parseLogDate(log.time);
        if (parsed) {
          matchCalendarDate = parsed.isoDate === selectedCalendarDate;
        } else {
          // fallback string match
          matchCalendarDate = log.time.includes(selectedCalendarDate);
        }
      }

      // 4. Month Filter
      let matchMonth = true;
      if (selectedMonth !== 'ALL') {
        const parsed = parseLogDate(log.time);
        if (parsed) {
          const selectedMonthNum = selectedMonth.slice(0, 2);
          matchMonth = parsed.monthNum === selectedMonthNum;
        } else {
          matchMonth = log.time.toLowerCase().includes(selectedMonth.toLowerCase());
        }
      }

      return matchSearch && matchUser && matchCalendarDate && matchMonth;
    });
  }, [logs, searchTxt, userFilter, selectedCalendarDate, selectedMonth]);

  const handleResetFilters = () => {
    setSearchTxt('');
    setUserFilter('ALL');
    setSelectedCalendarDate('');
    setSelectedMonth('ALL');
  };

  const hasActiveFilters =
    searchTxt !== '' ||
    userFilter !== 'ALL' ||
    selectedCalendarDate !== '' ||
    selectedMonth !== 'ALL';

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0055A5] dark:text-blue-400">
                <History className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base">
                  Log Audit &amp; Rekam Jejak Aktivitas Sistem
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seluruh transaksi stand meter, pembaruan cycle oleh <strong>Pak Kabul</strong> &amp; <strong>Pak Solihin</strong> (Tim Meter Reading), serta faktur invoice oleh <strong>Pak Yaya</strong> tercatat akuntabel.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                title="Reset semua filter pencarian"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Yakin ingin membersihkan seluruh rekaman log audit sistem?')) {
                  onClearLogs();
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          </div>
        </div>

        {/* Quick User Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
            <User className="w-3.5 h-3.5 text-[#0055A5]" /> Pengguna Cepat:
          </span>
          <button
            onClick={() => setUserFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
              userFilter === 'ALL'
                ? 'bg-[#0055A5] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({logs.length})
          </button>
          <button
            onClick={() => setUserFilter('Pak Kabul')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
              userFilter === 'Pak Kabul'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>Pak Kabul</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-200 text-emerald-900 font-mono font-black">
              {logs.filter((l) => l.user === 'Pak Kabul').length}
            </span>
          </button>
          <button
            onClick={() => setUserFilter('Pak Solihin')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
              userFilter === 'Pak Solihin'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Pak Solihin</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200 text-amber-900 font-mono font-black">
              {logs.filter((l) => l.user === 'Pak Solihin').length}
            </span>
          </button>
          <button
            onClick={() => setUserFilter('Pak Yaya')}
            className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
              userFilter === 'Pak Yaya'
                ? 'bg-[#E86216] text-white shadow-xs'
                : 'bg-orange-50 dark:bg-orange-950/50 text-[#E86216] dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'
            }`}
          >
            <span>Pak Yaya</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-orange-200 text-orange-900 font-mono font-black">
              {logs.filter((l) => l.user === 'Pak Yaya').length}
            </span>
          </button>
        </div>

        {/* Filter bar with Calendar Date & Month Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchTxt}
              onChange={(e) => setSearchTxt(e.target.value)}
              placeholder="Cari deskripsi transaksi / ID industri / peran..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Calendar Date Picker Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs">
            <CalendarIcon className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-extrabold uppercase text-slate-400">Pilih Tanggal Kalender:</span>
              <input
                type="date"
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none p-0 focus:outline-none cursor-pointer"
                title="Saring log berdasarkan tanggal tertentu dari kalender"
              />
            </div>
            {selectedCalendarDate && (
              <button
                onClick={() => setSelectedCalendarDate('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Hapus filter tanggal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Month Selector Filter (12 Bulan / 1 Tahun) */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
            >
              <option value="ALL">Semua Bulan (12 Bulan)</option>
              <option value="01 - Januari 2026">Januari 2026</option>
              <option value="02 - Februari 2026">Februari 2026</option>
              <option value="03 - Maret 2026">Maret 2026</option>
              <option value="04 - April 2026">April 2026</option>
              <option value="05 - Mei 2026">Mei 2026</option>
              <option value="06 - Juni 2026">Juni 2026</option>
              <option value="07 - Juli 2026">Juli 2026</option>
              <option value="08 - Agustus 2026">Agustus 2026</option>
              <option value="09 - September 2026">September 2026</option>
              <option value="10 - Oktober 2026">Oktober 2026</option>
              <option value="11 - November 2026">November 2026</option>
              <option value="12 - Desember 2026">Desember 2026</option>
            </select>
          </div>

          {/* User Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
            >
              <option value="ALL">Semua Pengguna</option>
              {allKnownUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>Menampilkan <strong>{filteredLogs.length}</strong> dari <strong>{logs.length}</strong> aktivitas sistem.</span>
            {selectedCalendarDate && (
              <span className="px-2 py-0.5 bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300 rounded-md font-bold text-[10px]">
                Tanggal: {selectedCalendarDate}
              </span>
            )}
            {selectedMonth !== 'ALL' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-md font-bold text-[10px]">
                Bulan: {selectedMonth}
              </span>
            )}
            {userFilter !== 'ALL' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md font-bold text-[10px]">
                Staf: {userFilter}
              </span>
            )}
          </div>
        </div>

        {/* Log table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50 text-[#003E78] dark:text-slate-200 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5">Waktu Transaksi</th>
                <th className="p-3.5">Pengguna / Staf</th>
                <th className="p-3.5">Peran Operasional</th>
                <th className="p-3.5">Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Tidak ada aktivitas yang sesuai dengan filter tanggal atau pengguna yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let badgeRoleClass = 'bg-blue-50 text-[#0055A5] dark:bg-blue-950/70 dark:text-blue-300 border-blue-200';
                  if (log.user.toLowerCase().includes('kabul')) {
                    badgeRoleClass = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300';
                  } else if (log.user.toLowerCase().includes('solihin')) {
                    badgeRoleClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
                  } else if (log.user.toLowerCase().includes('tri')) {
                    badgeRoleClass = 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300';
                  } else if (log.user.toLowerCase().includes('bayu')) {
                    badgeRoleClass = 'bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300';
                  } else if (log.user.toLowerCase().includes('yaya')) {
                    badgeRoleClass = 'bg-orange-50 text-[#E86216] dark:bg-orange-950/70 dark:text-orange-300 border-orange-300';
                  } else if (log.user.toLowerCase().includes('melva')) {
                    badgeRoleClass = 'bg-pink-50 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border-pink-300';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums text-[11px] font-semibold">
                        {log.time}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                            log.user.toLowerCase().includes('kabul')
                              ? 'bg-emerald-600'
                              : log.user.toLowerCase().includes('solihin')
                              ? 'bg-amber-600'
                              : log.user.toLowerCase().includes('tri')
                              ? 'bg-cyan-600'
                              : log.user.toLowerCase().includes('bayu')
                              ? 'bg-purple-600'
                              : log.user.toLowerCase().includes('melva')
                              ? 'bg-pink-600'
                              : 'bg-[#E86216]'
                          }`}>
                            {log.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${badgeRoleClass}`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                        {log.desc}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
