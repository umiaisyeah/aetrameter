import React, { useState, useMemo } from 'react';
import { IndustryCustomer, MeterReader, CycleSchedule, ReaderCategory } from '../types';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  ArrowUpRight,
  Search,
  Building2,
  Shield,
  Briefcase
} from 'lucide-react';
import { downloadYearlyCycleScheduleTemplate } from '../utils/excelDateHelper';
import { CycleCalendarGridView } from './CycleCalendarGridView';
import {
  getAssignedCustomersForReader,
  getAssignedCyclesForReader,
  sortCyclesNaturally,
  getReaderCategory,
  getReaderCompany
} from '../utils/readerAssignmentHelper';

interface MeterReaderProgressSectionProps {
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  onSelectCycle: (cycle: string) => void;
  onOpenImportSchedule: () => void;
}

export const MeterReaderProgressSection: React.FC<MeterReaderProgressSectionProps> = ({
  customers,
  meterReaders,
  cycleSchedules,
  onSelectCycle,
  onOpenImportSchedule
}) => {
  const [selectedReaderFilter, setSelectedReaderFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'table' | 'cards'>('matrix');
  const [searchCycle, setSearchCycle] = useState<string>('');

  // Map schedule by cycle name
  const scheduleMap = useMemo(() => {
    const map = new Map<string, CycleSchedule>();
    cycleSchedules.forEach((sch) => {
      map.set(sch.cycle.toLowerCase(), sch);
    });
    return map;
  }, [cycleSchedules]);

  // Aggregate cycle progress statistics
  const cycleProgressList = useMemo(() => {
    const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

    return allCycles.map((cName) => {
      const schedule = scheduleMap.get(cName.toLowerCase());
      const cycleCustomers = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());
      const total = cycleCustomers.length;
      const completed = cycleCustomers.filter(
        (c) => c.status === 'Verified' || c.status === 'Invoiced'
      ).length;
      const pending = cycleCustomers.filter(
        (c) => c.status === 'Pending Verification'
      ).length;
      const unread = cycleCustomers.filter(
        (c) => c.status === 'Belum Dibaca'
      ).length;

      const rawPct = total > 0 ? ((completed + pending) / total) * 100 : 0;
      const percentage = rawPct === 0 ? 0 : (rawPct < 1 ? Number(rawPct.toFixed(1)) : Math.round(rawPct));

      // Determine field reader and category strictly synced: 1 person = 1 role
      const readersForCycle = meterReaders.filter((r) => {
        const rCycles = getAssignedCyclesForReader(r, customers);
        return rCycles.some((ac) => ac.toLowerCase() === cName.toLowerCase());
      });

      let assignedReader = 'Belum Ditugaskan';
      let kategori: ReaderCategory = 'Belum Ditugaskan';

      if (readersForCycle.length > 0) {
        assignedReader = readersForCycle.map((r) => r.nama).join(', ');
        kategori = getReaderCategory(readersForCycle[0].nama);
      } else {
        const directCustReaders = Array.from(
          new Set(
            cycleCustomers
              .map((c) => c.petugasBaca?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );
        if (directCustReaders.length > 0) {
          assignedReader = directCustReaders.join(', ');
          kategori = getReaderCategory(directCustReaders[0]);
        } else if (schedule?.petugasUtama && schedule.petugasUtama !== 'Belum Ditugaskan') {
          assignedReader = schedule.petugasUtama;
          kategori = getReaderCategory(schedule.petugasUtama);
        }
      }

      // Status
      let statusLabel: 'Selesai' | 'Sedang Berjalan' | 'Belum Dimulai' | 'Belum Ada Data' = 'Belum Ada Data';
      if (total > 0) {
        if (completed === total) {
          statusLabel = 'Selesai';
        } else if (completed > 0 || pending > 0 || cycleCustomers.some((c) => c.status === 'Pending Verification')) {
          statusLabel = 'Sedang Berjalan';
        } else {
          statusLabel = 'Belum Dimulai';
        }
      }

      return {
        cycle: cName,
        hariH: schedule?.hariH || 7,
        tanggalMulai: schedule?.tanggalMulai || 'Terjadwal',
        tanggalSelesai: schedule?.tanggalSelesai || 'Terjadwal',
        readerName: assignedReader,
        kategori,
        total,
        completed,
        pending,
        percentage,
        statusLabel,
        catatan: schedule?.catatan || ''
      };
    });
  }, [customers, scheduleMap, meterReaders]);

  // Reader overall stats strictly based on inputted/imported data (ZERO OVERLAP)
  const readerStats = useMemo(() => {
    return meterReaders.map((reader) => {
      const sortedCycles = getAssignedCyclesForReader(reader, customers);
      const assignedCusts = getAssignedCustomersForReader(reader, customers);
      const totalIndustri = assignedCusts.length;
      const totalCompleted = assignedCusts.filter(
        (c) => c.status === 'Verified' || c.status === 'Invoiced'
      ).length;
      const totalPending = assignedCusts.filter(
        (c) => c.status === 'Pending Verification'
      ).length;
      const totalUnread = assignedCusts.filter(
        (c) => c.status === 'Belum Dibaca'
      ).length;
      const rawOverall = totalIndustri > 0 ? ((totalCompleted + totalPending) / totalIndustri) * 100 : 0;
      const overallPercent = rawOverall === 0 ? 0 : (rawOverall < 1 ? Number(rawOverall.toFixed(1)) : Math.round(rawOverall));

      return {
        reader,
        assignedCycleCount: sortedCycles.length,
        totalIndustri,
        totalCompleted,
        totalPending,
        totalUnread,
        overallPercent
      };
    });
  }, [meterReaders, customers]);

  // Filtered cycle list
  const filteredCycles = useMemo(() => {
    return cycleProgressList.filter((item) => {
      const matchReader =
        selectedReaderFilter === 'ALL' ||
        item.readerName.toLowerCase().includes(selectedReaderFilter.toLowerCase());

      const matchCategory =
        selectedCategoryFilter === 'ALL' || item.kategori === selectedCategoryFilter;

      const matchSearch =
        !searchCycle ||
        item.cycle.toLowerCase().includes(searchCycle.toLowerCase()) ||
        item.readerName.toLowerCase().includes(searchCycle.toLowerCase()) ||
        item.tanggalMulai.toLowerCase().includes(searchCycle.toLowerCase());

      return matchReader && matchCategory && matchSearch;
    });
  }, [cycleProgressList, selectedReaderFilter, selectedCategoryFilter, searchCycle]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-5 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-[#E86216]">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-slate-800 dark:text-white text-base">
              Status Progress Pembaca Meter Lapangan per Cycle
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring penyelesaian pembacaan fisik meteran oleh petugas lapangan sesuai plotting matriks kalender cycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportSchedule}
            className="px-3.5 py-2 text-xs font-bold bg-[#0055A5] hover:bg-blue-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor Matriks Kalender 1 Thn (.xlsx)</span>
          </button>
          <button
            onClick={downloadYearlyCycleScheduleTemplate}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition flex items-center gap-1.5"
            title="Unduh template Excel 1 tahun"
          >
            <span>Unduh Template 1 Thn</span>
          </button>
        </div>
      </div>

      {/* Role Notice: Admin vs Field Officers */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200">
            <strong>Struktur Operasional:</strong> <em>Pak Solihin</em> &amp; <em>Pak Kabul</em> bertindak sebagai <strong>Tim Meter Reading</strong> (Input Cycle &amp; Data Industri). Pembaca meter fisik di lapangan dilakukan oleh <strong>Petugas Lapangan / Kontraktor</strong> yang ditugaskan.
          </span>
        </div>
      </div>

      {/* Field Readers Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {readerStats.length === 0 ? (
          <div className="col-span-full p-6 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Users className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">
              Belum Ada Data Petugas Lapangan
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Data nama petugas lapangan dan perusahaannya belum diinput. Anda dapat menambahkan data petugas melalui tab <strong>Master Data &rarr; Section Pembaca Meter</strong> atau impor Excel.
            </p>
          </div>
        ) : (
          readerStats.map(({ reader, assignedCycleCount, totalIndustri, totalCompleted, totalPending, overallPercent }) => (
            <div
              key={reader.id}
              onClick={() => setSelectedReaderFilter(selectedReaderFilter === reader.nama ? 'ALL' : reader.nama)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedReaderFilter === reader.nama
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#0055A5] dark:border-blue-400 ring-2 ring-[#0055A5]/20'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl font-extrabold flex items-center justify-center text-xs text-white shadow-xs ${
                      reader.kategori === 'Key Account'
                        ? 'bg-gradient-to-tr from-purple-700 to-indigo-500'
                        : 'bg-gradient-to-tr from-[#0055A5] to-blue-500'
                    }`}
                  >
                    {reader.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-xs">
                      {reader.nama}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {reader.nip} {reader.perusahaan ? `· ${reader.perusahaan}` : ''}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    reader.kategori === 'Key Account'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {reader.kategori || 'Petugas'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Penugasan:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {assignedCycleCount} Cycle ({totalIndustri} Industri)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Selesai / Pending:</span>
                  <span className="font-semibold font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalCompleted}</span>
                    <span className="text-slate-400"> / </span>
                    <span className="text-[#E86216] font-bold">{totalPending}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] mb-0.5 font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Progres Keterbacaan</span>
                    <span className="font-mono text-[#0055A5] dark:text-blue-400 font-extrabold">
                      {overallPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        overallPercent === 100
                          ? 'bg-emerald-500'
                          : overallPercent > 50
                          ? 'bg-[#0055A5]'
                          : 'bg-[#E86216]'
                      }`}
                      style={{ width: `${overallPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Control & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-100"
          >
            <option value="ALL">Semua Tim Lapangan</option>
            <option value="Kontraktor">Kontraktor / Mitra</option>
            <option value="Key Account">Tim Key Account</option>
          </select>

          {/* Reader Name Filter */}
          <select
            value={selectedReaderFilter}
            onChange={(e) => setSelectedReaderFilter(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-100"
          >
            <option value="ALL">Semua Petugas Lapangan</option>
            {meterReaders.map((r) => (
              <option key={r.id} value={r.nama}>
                {r.nama} ({r.perusahaan || r.kategori})
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchCycle}
              onChange={(e) => setSearchCycle(e.target.value)}
              placeholder="Cari cycle / tanggal..."
              className="pl-7 pr-3 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>

          <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                viewMode === 'matrix'
                  ? 'bg-[#8CC63F] text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Matriks Kalender
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Kartu
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Matriks Kalender Sesuai Gambar User */}
      {viewMode === 'matrix' && (
        <CycleCalendarGridView
          cycleSchedules={cycleSchedules}
          onSelectCycle={onSelectCycle}
        />
      )}

      {/* VIEW 2: Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-extrabold text-[10px] uppercase sticky top-0 z-10">
              <tr>
                <th className="p-3">Cycle</th>
                <th className="p-3">Hari H &amp; Rentang Tanggal</th>
                <th className="p-3">Petugas Pembaca Meter</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-center">Target Industri</th>
                <th className="p-3 text-center">Selesai Dibaca</th>
                <th className="p-3 text-center">Pending / Belum</th>
                <th className="p-3 w-36">Progres</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredCycles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    Tidak ada cycle yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredCycles.map((row) => (
                  <tr key={row.cycle} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-extrabold text-[#0055A5] dark:text-blue-400">
                      {row.cycle}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-[#FFF200] border border-amber-300 font-black text-black text-[11px] flex items-center justify-center shrink-0">
                          {row.hariH}
                        </span>
                        <span className="font-semibold">
                          Tgl {row.hariH} ({row.tanggalMulai} - {row.tanggalSelesai})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {row.readerName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.kategori === 'Key Account'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {row.kategori}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-slate-700 dark:text-slate-200">
                      {row.total > 0 ? (
                        row.total
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal italic">0 Industri</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {row.completed}
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-[#E86216]">
                      {row.pending}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              row.percentage === 100
                                ? 'bg-emerald-500'
                                : row.percentage > 0
                                ? 'bg-blue-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            style={{ width: `${row.percentage}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right font-mono font-bold text-[11px] text-slate-700 dark:text-slate-200">
                          {row.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.statusLabel === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : row.statusLabel === 'Sedang Berjalan'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : row.statusLabel === 'Belum Ada Data'
                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {row.statusLabel === 'Selesai' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : row.statusLabel === 'Sedang Berjalan' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span>{row.statusLabel}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectCycle(row.cycle)}
                        disabled={row.total === 0}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition inline-flex items-center gap-1 ${
                          row.total > 0
                            ? 'text-[#0055A5] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer'
                            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                        title={row.total > 0 ? 'Tampilkan pelanggan industri cycle ini' : 'Belum ada data industri yang diinput admin'}
                      >
                        <span>{row.total > 0 ? 'Filter' : 'Kosong'}</span>
                        {row.total > 0 && <ArrowUpRight className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredCycles.map((row) => (
            <div
              key={row.cycle}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-black text-[#0055A5] dark:text-blue-400 text-sm">
                    {row.cycle}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      row.kategori === 'Key Account'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}
                  >
                    {row.kategori}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold mb-1">
                  <span className="w-5 h-5 rounded-md bg-[#FFF200] border border-amber-300 font-black text-black text-[11px] flex items-center justify-center shrink-0">
                    {row.hariH}
                  </span>
                  <span>Hari H: Tanggal {row.hariH} ({row.tanggalMulai})</span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Petugas Lapangan: <strong className="text-slate-800 dark:text-slate-100">{row.readerName}</strong>
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {row.completed} / {row.total} Industri
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">{row.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full ${
                      row.percentage === 100
                        ? 'bg-emerald-500'
                        : row.percentage > 0
                        ? 'bg-[#0055A5]'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    style={{ width: `${row.percentage}%` }}
                  ></div>
                </div>

                <button
                  onClick={() => onSelectCycle(row.cycle)}
                  className="w-full py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#0055A5] dark:text-blue-400 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                >
                  <span>Lihat Industri Cycle Ini</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
