import React, { useState, useMemo } from 'react';
import { CycleSchedule } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Info, UserCheck, Shield } from 'lucide-react';
import { MONTH_NAMES_ID, MONTH_CODES } from '../utils/excelDateHelper';
import { getReaderCategory } from '../utils/readerAssignmentHelper';

interface CycleCalendarGridViewProps {
  cycleSchedules: CycleSchedule[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  onSelectCycle?: (cycle: string) => void;
}

export const CycleCalendarGridView: React.FC<CycleCalendarGridViewProps> = ({
  cycleSchedules,
  selectedMonth = 'September 2026',
  onMonthChange,
  onSelectCycle
}) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(8); // September (0-indexed = 8)
  const [hoveredCycle, setHoveredCycle] = useState<CycleSchedule | null>(null);

  const year = 2026;
  const currentMonthName = MONTH_NAMES_ID[currentMonthIndex];
  const currentMonthCode = MONTH_CODES[currentMonthIndex];
  const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();

  // Find Sundays for this month
  const sundayDays = useMemo(() => {
    const sundays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, currentMonthIndex, d);
      if (date.getDay() === 0) {
        sundays.push(d);
      }
    }
    return sundays;
  }, [year, currentMonthIndex, daysInMonth]);

  // Map schedules for this month
  const monthSchedules = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const cName = `Cycle ${i + 1}`;
      const found = cycleSchedules.find(
        (s) =>
          s.cycle.toLowerCase() === cName.toLowerCase() &&
          (s.bulan?.toLowerCase().includes(currentMonthName.toLowerCase()) ||
            s.bulan?.toLowerCase().includes(currentMonthCode.toLowerCase()))
      );

      if (found && found.hariH) {
        return found;
      }

      // Fallback calculation for Sep-26 matching image
      let hariH = 7 + i;
      // Skip Sundays
      if (currentMonthIndex === 8) {
        // September 2026 specific exact mapping from image
        const exactHariH = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25];
        hariH = exactHariH[i] || 7 + i;
      }

      const praBaca = Math.max(1, hariH - 2);
      const verif = Math.min(daysInMonth, hariH + 1);
      const billing = Math.min(daysInMonth, hariH + 2);

      return {
        cycle: cName,
        bulan: `${currentMonthName} 2026`,
        hariH,
        tglPraBaca: praBaca,
        tglVerifikasi: verif,
        tglBilling: billing,
        tanggalMulai: `${String(hariH).padStart(2, '0')} ${currentMonthName.slice(0, 3)} 2026`,
        tanggalSelesai: `${String(verif).padStart(2, '0')} ${currentMonthName.slice(0, 3)} 2026`,
        petugasUtama: found?.petugasUtama || 'Belum Ditugaskan',
        kategoriPetugas: found?.petugasUtama && found.petugasUtama !== 'Belum Ditugaskan'
          ? getReaderCategory(found.petugasUtama)
          : found?.kategoriPetugas,
        catatan: found?.catatan || `Plotting Matriks Kalender ${currentMonthName}`
      };
    });
  }, [cycleSchedules, currentMonthIndex, currentMonthName, currentMonthCode, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentMonthIndex((prev) => (prev > 0 ? prev - 1 : 11));
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex((prev) => (prev < 11 ? prev + 1 : 0));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4 transition-colors">
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <span>Matriks Plotting Jadwal Cycle 1 Tahun (Tanggal 1 - 31)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono">
                {currentMonthCode}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Format matriks kalender resmi operasional: siklus terplot otomatis per tanggal tiap bulannya.
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={currentMonthIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setCurrentMonthIndex(idx);
              onMonthChange?.(`${MONTH_NAMES_ID[idx]} 2026`);
            }}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
          >
            {MONTH_NAMES_ID.map((m, idx) => (
              <option key={m} value={idx}>
                {m} 2026 ({MONTH_CODES[idx]})
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Calendar Grid (Exact Replica of Excel Image) */}
      <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-inner bg-slate-50 dark:bg-slate-900/60">
        <table className="w-full text-center border-collapse text-xs select-none">
          {/* Main Month Bar (Green Header from Screenshot) */}
          <thead>
            <tr>
              <th
                colSpan={32}
                className="bg-[#8CC63F] text-slate-900 font-black text-sm py-2 px-4 uppercase tracking-wider border-b border-slate-300"
              >
                {currentMonthCode} - Kalender Pembacaan Meter Industri
              </th>
            </tr>
            {/* Days Row: 1 to 31 */}
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] border-b border-slate-300 dark:border-slate-700">
              <th className="p-2 border-r border-slate-300 dark:border-slate-700 w-20 text-left pl-3 text-[#0055A5] dark:text-blue-400">
                Cycle
              </th>
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const isSunday = sundayDays.includes(day);
                const isValidDay = day <= daysInMonth;

                return (
                  <th
                    key={day}
                    className={`p-1.5 min-w-[28px] max-w-[32px] border-r border-slate-300 dark:border-slate-700 ${
                      !isValidDay
                        ? 'bg-slate-200/50 dark:bg-slate-900/80 text-slate-300 dark:text-slate-600'
                        : isSunday
                        ? 'bg-red-600 text-white font-black'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Cycle Rows 1 to 15 */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80">
            {monthSchedules.map((sch, cIdx) => {
              const cycleNum = cIdx + 1;

              return (
                <tr
                  key={sch.cycle}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {/* Left Label */}
                  <td className="p-1.5 pl-3 text-left font-black text-xs text-[#0055A5] dark:text-blue-400 border-r border-slate-300 dark:border-slate-700 whitespace-nowrap bg-white dark:bg-slate-800">
                    <button
                      onClick={() => onSelectCycle?.(sch.cycle)}
                      className="hover:underline font-mono"
                    >
                      Cycle {cycleNum}
                    </button>
                  </td>

                  {/* Columns for days 1 to 31 */}
                  {Array.from({ length: 31 }, (_, dIdx) => {
                    const day = dIdx + 1;
                    const isSunday = sundayDays.includes(day);
                    const isValidDay = day <= daysInMonth;

                    const isHariH = day === sch.hariH;

                    // If not a valid day in this month
                    if (!isValidDay) {
                      return (
                        <td
                          key={day}
                          className="border-r border-slate-300 dark:border-slate-700 bg-slate-200/40 dark:bg-slate-900/80"
                        ></td>
                      );
                    }

                    // Sunday Column
                    if (isSunday && !isHariH) {
                      return (
                        <td
                          key={day}
                          className="border-r border-slate-300 dark:border-slate-700 bg-red-600"
                        ></td>
                      );
                    }

                    // Workflow Colored Cells (Hari H Only)
                    if (isHariH) {
                      return (
                        <td
                          key={day}
                          onMouseEnter={() => setHoveredCycle(sch)}
                          onMouseLeave={() => setHoveredCycle(null)}
                          onClick={() => onSelectCycle?.(sch.cycle)}
                          className="border-r border-slate-300 dark:border-slate-700 bg-[#FFF200] text-black font-black text-xs cursor-pointer hover:scale-105 transition-transform shadow-xs relative"
                          title={`Hari H Pembacaan ${sch.cycle}: Tanggal ${day} ${currentMonthName}\nPetugas Lapangan: ${sch.petugasUtama} (${sch.kategoriPetugas})`}
                        >
                          <span className="font-extrabold">{cycleNum}</span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={day}
                        className="border-r border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40"
                      ></td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover Info Banner */}
      {hoveredCycle && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0055A5] dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              {hoveredCycle.cycle} (Hari H: Tgl {hoveredCycle.hariH} {hoveredCycle.bulan})
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Petugas Lapangan: <strong className="text-[#0055A5] dark:text-blue-300">{hoveredCycle.petugasUtama}</strong>
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              hoveredCycle.kategoriPetugas === 'Key Account'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {hoveredCycle.kategoriPetugas}
          </span>
        </div>
      )}

      {/* Workflow Colors Legend (Matching Exact Image Colors) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-extrabold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            Keterangan Warna Workflow:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-xs bg-[#FFF200] border border-amber-300 font-black text-[9px] flex items-center justify-center text-black shadow-2xs">
              N
            </span>
            <span className="text-slate-800 dark:text-white font-bold text-[11px]">
              Hari H Pembacaan Meter (Nomor Cycle)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-xs bg-red-600 inline-block shadow-2xs"></span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Hari Minggu / Libur
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          *Admin Meter Reading: Pak Solihin &amp; Pak Kabul (Office / Database)
        </div>
      </div>
    </div>
  );
};
