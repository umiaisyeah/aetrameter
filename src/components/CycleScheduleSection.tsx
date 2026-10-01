import React, { useState, useMemo } from 'react';
import { CycleSchedule, IndustryCustomer, MeterReader, ReaderCategory } from '../types';
import {
  Calendar,
  Upload,
  Download,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Shield,
  Building2,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Search
} from 'lucide-react';
import { downloadYearlyCycleScheduleTemplate } from '../utils/excelDateHelper';
import { CycleCalendarGridView } from './CycleCalendarGridView';
import { showColorfulAlert, showToast } from '../utils/notificationSystem';

interface CycleScheduleSectionProps {
  cycleSchedules: CycleSchedule[];
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  onOpenImportModal: () => void;
  onUpdateSchedule: (schedule: CycleSchedule) => void;
  onUpdateCustomersBatch?: (updatedCustomers: IndustryCustomer[]) => void;
}

export const CycleScheduleSection: React.FC<CycleScheduleSectionProps> = ({
  cycleSchedules,
  customers,
  meterReaders,
  onOpenImportModal,
  onUpdateSchedule,
  onUpdateCustomersBatch
}) => {
  const [editingSchedule, setEditingSchedule] = useState<CycleSchedule | null>(null);
  const [editingShiftModal, setEditingShiftModal] = useState<CycleSchedule | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [expandedShiftCycle, setExpandedShiftCycle] = useState<string | null>(null);

  // Form states for Shift Modal
  const [shiftCycle, setShiftCycle] = useState<string>('Cycle 3');
  const [shiftDate, setShiftDate] = useState<string>('2026-09-09');
  const [shiftHariH, setShiftHariH] = useState<number>(9);
  const [shiftHariHOriginal, setShiftHariHOriginal] = useState<number>(8);
  const [shiftAlasan, setShiftAlasan] = useState<
    'Target Volume Industri' | 'Penyesuaian Hari Kerja/Libur' | 'Maintenance Jaringan Pipa' | 'Permintaan Khusus Pelanggan' | 'Lainnya'
  >('Target Volume Industri');
  const [shiftKeterangan, setShiftKeterangan] = useState<string>(
    'Pergeseran hari baca untuk mengakomodasi jam operasional industri & penyesuaian lapangan.'
  );

  // Search & Checklist for Industries in Shift Modal
  const [shiftSearchQuery, setShiftSearchQuery] = useState<string>('');
  const [selectedShiftedCustomerIds, setSelectedShiftedCustomerIds] = useState<string[]>([]);

  // Merge default 15 cycles with imported schedules
  const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  const scheduleList = allCycles.map((cName, idx) => {
    const found = cycleSchedules.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
    const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());
    const completed = cycleCusts.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;

    let defaultPetugas = 'Belum Ditugaskan';
    let defaultKategori: ReaderCategory | undefined = undefined;

    // 1. Utamakan sinkronisasi dari input petugas baca di database industri pada cycle ini
    const custWithReader = cycleCusts.find((c) => c.petugasBaca && c.petugasBaca.trim() !== '');
    if (custWithReader && custWithReader.petugasBaca) {
      defaultPetugas = custWithReader.petugasBaca;
      const rMatch = meterReaders.find((r) => r.nama.toLowerCase() === custWithReader.petugasBaca!.toLowerCase());
      defaultKategori = rMatch?.kategori || custWithReader.kategoriPetugas;
    } else if (found?.petugasUtama && found.petugasUtama !== 'Belum Ditugaskan') {
      defaultPetugas = found.petugasUtama;
      defaultKategori = found.kategoriPetugas;
    } else {
      const readerForCycle = meterReaders.find((r) =>
        r.assignedCycles?.some((ac) => ac.toLowerCase() === cName.toLowerCase())
      );
      if (readerForCycle && cycleCusts.length > 0) {
        defaultPetugas = readerForCycle.nama;
        defaultKategori = readerForCycle.kategori;
      }
    }

    const defaultHariH = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25][idx] || 7 + idx;

    // Shifted customer ids for this cycle
    const shiftedCustsInCycle = cycleCusts.filter(c => c.adaPergeseran);
    const shiftedIds = found?.shiftedCustomerIds || shiftedCustsInCycle.map(c => c.id);

    return {
      cycle: cName,
      bulan: found?.bulan || 'September 2026',
      hariH: found?.hariH || defaultHariH,
      tanggalMulai: found?.tanggalMulai || `${String(defaultHariH).padStart(2, '0')} Sep 2026`,
      tanggalSelesai: found?.tanggalSelesai || `${String(defaultHariH + 1).padStart(2, '0')} Sep 2026`,
      petugasUtama: found?.petugasUtama || defaultPetugas,
      kategoriPetugas: found?.kategoriPetugas || defaultKategori,
      catatan: found?.catatan || '',
      adaPergeseran: found?.adaPergeseran || (cName === 'Cycle 3' && !found),
      hariHOriginal: found?.hariHOriginal || (cName === 'Cycle 3' ? 8 : defaultHariH),
      selisihHariPergeseran: found?.selisihHariPergeseran || (cName === 'Cycle 3' ? 1 : 0),
      alasanPergeseran: found?.alasanPergeseran || (cName === 'Cycle 3' ? 'Target Volume Industri' : undefined),
      keteranganPergeseran:
        found?.keteranganPergeseran ||
        (cName === 'Cycle 3'
          ? 'Pergeseran H+1 hari untuk mengakomodasi akumulasi jam kerja shift pabrik.'
          : ''),
      shiftedCustomerIds: shiftedIds,
      shiftedCount: shiftedIds.length,
      totalIndustri: cycleCusts.length,
      completed,
      status:
        cycleCusts.length > 0 && completed === cycleCusts.length
          ? 'Selesai'
          : completed > 0
          ? 'Sedang Berjalan'
          : 'Terjadwal'
    };
  });

  // Shifted cycles list
  const shiftedSchedules = scheduleList.filter((s) => s.adaPergeseran);
  const totalShiftedIndustries = customers.filter((c: IndustryCustomer) => c.adaPergeseran).length || shiftedSchedules.reduce((acc, s) => acc + (s.shiftedCount || s.totalIndustri), 0);

  // Current Cycle Customers in Modal
  const currentCycleCustomers = useMemo(() => {
    return customers.filter((c: IndustryCustomer) => c.cycle.toLowerCase() === shiftCycle.toLowerCase());
  }, [customers, shiftCycle]);

  const filteredCycleCustomers = useMemo(() => {
    if (!shiftSearchQuery.trim()) return currentCycleCustomers;
    const q = shiftSearchQuery.toLowerCase().trim();
    return currentCycleCustomers.filter(
      (c: IndustryCustomer) => c.id.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q) || c.kelas.toLowerCase().includes(q)
    );
  }, [currentCycleCustomers, shiftSearchQuery]);

  const handleOpenShiftModal = (schedule?: any) => {
    const targetCycle = schedule ? schedule.cycle : 'Cycle 3';
    setShiftCycle(targetCycle);

    const orig = schedule?.hariHOriginal || schedule?.hariH || 8;
    const actualH = schedule?.hariH || 9;
    setShiftHariHOriginal(orig);
    setShiftHariH(actualH);

    // Format date string for date picker (YYYY-MM-DD)
    const formattedDay = String(actualH).padStart(2, '0');
    setShiftDate(`2026-09-${formattedDay}`);

    setShiftAlasan(schedule?.alasanPergeseran || 'Target Volume Industri');
    setShiftKeterangan(
      schedule?.keteranganPergeseran ||
        'Pergeseran jadwal hari baca untuk penyesuaian operasional pabrik industri.'
    );

    setShiftSearchQuery('');

    // Pre-select industries that are shifted in this cycle
    const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === targetCycle.toLowerCase());
    const existingShiftedIds = schedule?.shiftedCustomerIds || cycleCusts.filter(c => c.adaPergeseran).map(c => c.id);
    
    if (existingShiftedIds && existingShiftedIds.length > 0) {
      setSelectedShiftedCustomerIds(existingShiftedIds);
    } else {
      // Default: select all industries in cycle
      setSelectedShiftedCustomerIds(cycleCusts.map(c => c.id));
    }

    setEditingShiftModal(schedule || {
      cycle: targetCycle,
      bulan: selectedMonth,
      hariH: actualH,
      tanggalMulai: `${formattedDay} Sep 2026`,
      tanggalSelesai: `${String(actualH + 1).padStart(2, '0')} Sep 2026`,
      petugasUtama: 'Petugas Lapangan'
    } as CycleSchedule);
  };

  const handleCycleChangeInModal = (cName: string) => {
    setShiftCycle(cName);
    const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());
    const existingSch = scheduleList.find(s => s.cycle.toLowerCase() === cName.toLowerCase());
    const shifted = cycleCusts.filter(c => c.adaPergeseran).map(c => c.id);
    if (existingSch?.shiftedCustomerIds && existingSch.shiftedCustomerIds.length > 0) {
      setSelectedShiftedCustomerIds(existingSch.shiftedCustomerIds);
    } else if (shifted.length > 0) {
      setSelectedShiftedCustomerIds(shifted);
    } else {
      setSelectedShiftedCustomerIds(cycleCusts.map(c => c.id));
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = scheduleList.find((s) => s.cycle.toLowerCase() === shiftCycle.toLowerCase());
    const selisih = shiftHariH - shiftHariHOriginal;
    const formattedHariH = String(shiftHariH).padStart(2, '0');
    const newTanggalStr = `${formattedHariH} Sep 2026`;

    const updatedSchedule: CycleSchedule = {
      cycle: shiftCycle,
      bulan: existing?.bulan || selectedMonth,
      hariH: shiftHariH,
      tanggalMulai: newTanggalStr,
      tanggalSelesai: `${String(Math.min(31, shiftHariH + 1)).padStart(2, '0')} Sep 2026`,
      petugasUtama: existing?.petugasUtama || 'Petugas Lapangan',
      kategoriPetugas: existing?.kategoriPetugas,
      catatan: existing?.catatan || 'Jadwal mengalami pergeseran hari baca',
      adaPergeseran: true,
      hariHOriginal: shiftHariHOriginal,
      selisihHariPergeseran: selisih,
      alasanPergeseran: shiftAlasan,
      keteranganPergeseran: shiftKeterangan,
      tanggalPergeseranBaru: newTanggalStr,
      shiftedCustomerIds: selectedShiftedCustomerIds
    };

    onUpdateSchedule(updatedSchedule);

    // Update customer records for selected shifted industries
    const updatedCustomersList = customers.map((c) => {
      if (c.cycle.toLowerCase() === shiftCycle.toLowerCase()) {
        const isShifted = selectedShiftedCustomerIds.includes(c.id);
        return {
          ...c,
          adaPergeseran: isShifted,
          tanggalPergeseranBaru: isShifted ? newTanggalStr : undefined,
          alasanPergeseran: isShifted ? shiftAlasan : undefined,
          keteranganPergeseran: isShifted ? shiftKeterangan : undefined,
          hariHOriginal: isShifted ? shiftHariHOriginal : undefined,
          hariHPergeseran: isShifted ? shiftHariH : undefined
        };
      }
      return c;
    });

    if (onUpdateCustomersBatch) {
      onUpdateCustomersBatch(updatedCustomersList);
    }

    setEditingShiftModal(null);
    showColorfulAlert({
      title: 'Pergeseran Hari Baca Disimpan! 📅',
      message: `Pergeseran Hari Baca ${shiftCycle} (Hari H: Tgl ${shiftHariHOriginal} → Tgl ${shiftHariH}) untuk ${selectedShiftedCustomerIds.length} industri terpilih berhasil disimpan & disinkronkan ke akun petugas lapangan!`,
      type: 'success',
      badge: 'SINKRONISASI BACA'
    });
  };

  const handleRemoveShift = (cName: string) => {
    const existing = scheduleList.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
    if (!existing) return;

    const origHariH = existing.hariHOriginal || existing.hariH;
    const reverted: CycleSchedule = {
      ...existing,
      hariH: origHariH,
      tanggalMulai: `${String(origHariH).padStart(2, '0')} Sep 2026`,
      tanggalSelesai: `${String(origHariH + 1).padStart(2, '0')} Sep 2026`,
      adaPergeseran: false,
      hariHOriginal: undefined,
      selisihHariPergeseran: undefined,
      alasanPergeseran: undefined,
      keteranganPergeseran: '',
      shiftedCustomerIds: []
    };

    onUpdateSchedule(reverted);

    // Revert customer shift status
    const updatedCustomersList = customers.map((c) => {
      if (c.cycle.toLowerCase() === cName.toLowerCase()) {
        return {
          ...c,
          adaPergeseran: false,
          tanggalPergeseranBaru: undefined,
          alasanPergeseran: undefined,
          keteranganPergeseran: undefined,
          hariHOriginal: undefined,
          hariHPergeseran: undefined
        };
      }
      return c;
    });

    if (onUpdateCustomersBatch) {
      onUpdateCustomersBatch(updatedCustomersList);
    }

    showToast({
      title: 'Jadwal Dinormalisasi',
      message: `Pergeseran untuk ${cName} telah dinormalisasi kembali ke Hari H Original (Tgl ${origHariH}).`,
      type: 'info'
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    onUpdateSchedule(editingSchedule);
    setEditingSchedule(null);
    showToast({
      title: 'Jadwal Diperbarui',
      message: `Jadwal untuk ${editingSchedule.cycle} berhasil diperbarui!`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-[#0055A5] dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base">
                Jadwal &amp; Plotting Matriks Kalender Cycle (1 Tahun)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Otomatisasi plotting tanggal pembacaan tiap cycle per bulan dari spreadsheet Excel matriks 1 tahun.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Matriks Excel 1 Thn</span>
          </button>
          <button
            onClick={downloadYearlyCycleScheduleTemplate}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template 1 Thn</span>
          </button>
        </div>
      </div>

      {/* Visual Matrix Calendar (Matching Excel image) */}
      <CycleCalendarGridView
        cycleSchedules={cycleSchedules}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* SECTION: Keterangan Pergeseran Hari Baca untuk Pemenuhan Target Volume */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-300/80 dark:border-amber-600/60 shadow-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-amber-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-800 dark:text-white text-base">
                  Keterangan Pergeseran Hari Baca &amp; Pemenuhan Target Volume
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white font-mono shadow-xs">
                  {shiftedSchedules.length} Cycle Bergeser
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring deviasi jadwal baca meter resmi untuk memenuhi kuota target volume air industri bulanan (m³) dan cut-off billing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenShiftModal()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Atur Pergeseran Hari Baca</span>
          </button>
        </div>

        {/* Stats summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-sm">
              {shiftedSchedules.length}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">Cycle Mengalami Pergeseran</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {shiftedSchedules.map((s) => s.cycle).join(', ') || 'Belum ada pergeseran'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0055A5] text-white font-black flex items-center justify-center text-sm">
              {totalShiftedIndustries}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300">Total Industri Bergeser</p>
              <p className="text-xs font-black text-[#0055A5] dark:text-blue-400">
                {totalShiftedIndustries} Pelanggan Industri
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Status Sinkronisasi</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Tersinkron ke Aplikasi Lapangan
              </p>
            </div>
          </div>
        </div>

        {/* Shift details list */}
        <div className="space-y-3">
          {shiftedSchedules.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Tidak Ada Pergeseran Hari Baca di Bulan Ini
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Semua 15 cycle berjalan tepat sesuai jadwal normal kalender. Klik <strong>+ Atur Pergeseran Hari Baca</strong> jika ada pergeseran jadwal pembacaan.
              </p>
            </div>
          ) : (
            shiftedSchedules.map((shift) => (
              <div
                key={shift.cycle}
                className="p-4 bg-white dark:bg-slate-900/70 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#0055A5] text-white">
                        {shift.cycle}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Jadwal Asli: Tgl {shift.hariHOriginal} → Aktual: Tgl {shift.hariH} (
                          {shift.selisihHariPergeseran && shift.selisihHariPergeseran > 0
                            ? `+${shift.selisihHariPergeseran} Hari`
                            : `${shift.selisihHariPergeseran} Hari`}
                          )
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Alasan: {shift.alasanPergeseran || 'Penyesuaian Jadwal'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300">
                        {shift.shiftedCount || shift.totalIndustri} Industri Terdampak
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">Keterangan Operasional:</strong>{' '}
                      {shift.keteranganPergeseran || 'Pergeseran dilakukan untuk penyesuaian operasional pabrik industri.'}
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                      <span>Petugas: <strong className="text-slate-700 dark:text-slate-300">{shift.petugasUtama}</strong></span>
                      <span>·</span>
                      <span>Total Industri di Cycle: <strong>{shift.totalIndustri} Pelanggan</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenShiftModal(shift)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah Pergeseran</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveShift(shift.cycle)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title="Kembalikan ke jadwal normal tanpa pergeseran"
                    >
                      Normalisasi
                    </button>
                  </div>
                </div>

                {/* Filtering & Customer List corresponding to this shifted cycle */}
                <div className="mt-3 pt-3 border-t border-amber-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExpandedShiftCycle(expandedShiftCycle === shift.cycle ? null : shift.cycle)}
                    className="text-xs font-bold text-[#0055A5] dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{expandedShiftCycle === shift.cycle ? '▼ Sembunyikan Daftar Industri Bergeser' : '▶ Lihat Daftar Industri Bergeser di Cycle Ini'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[10px]">
                      {customers.filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase() && (shift.shiftedCustomerIds ? shift.shiftedCustomerIds.includes(c.id) : c.adaPergeseran)).length} / {customers.filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase()).length} Industri
                    </span>
                  </button>

                  {expandedShiftCycle === shift.cycle && (
                    <div className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto text-xs">
                      {customers.filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase()).length === 0 ? (
                        <p className="text-slate-400 italic text-center py-2">Belum ada industri terdaftar di {shift.cycle}.</p>
                      ) : (
                        customers
                          .filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase())
                          .map((cust) => {
                            const isShifted = shift.shiftedCustomerIds ? shift.shiftedCustomerIds.includes(cust.id) : cust.adaPergeseran;
                            return (
                              <div key={cust.id} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                                isShifted ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60'
                              }`}>
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <span>{cust.id}</span> · <span>{cust.nama}</span>
                                    {isShifted ? (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white">
                                        Shift Tgl {shift.hariH}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        Jadwal Normal
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Stand Lalu: {cust.lalu.toLocaleString()} m³ | Petugas: {cust.petugasBaca || shift.petugasUtama}
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  {cust.status}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Table List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
              Daftar Rinci Tanggal Pembacaan Tiap Cycle (1 - 15)
            </h4>
            <p className="text-[11px] text-slate-400">
              Menampilkan Hari H baca meter, rentang tanggal verifikasi, serta status pergeseran target volume
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 uppercase font-extrabold text-[10px] sticky top-0 z-10">
              <tr>
                <th className="p-3">Nama Cycle</th>
                <th className="p-3">Hari H Baca Meter</th>
                <th className="p-3">Rentang Tanggal</th>
                <th className="p-3">Petugas Pembaca Lapangan</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-center">Industri Terdaftar</th>
                <th className="p-3 text-center">Status Siklus</th>
                <th className="p-3">Keterangan &amp; Pergeseran</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {scheduleList.map((row) => (
                <tr key={row.cycle} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3 font-extrabold text-[#0055A5] dark:text-blue-400">
                    <div className="flex items-center gap-1.5">
                      <span>{row.cycle}</span>
                      {row.adaPergeseran && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white">
                          Shift
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#FFF200] border border-amber-300 font-black text-black text-[11px] flex items-center justify-center shrink-0">
                        {row.hariH}
                      </span>
                      <span>Tanggal {row.hariH}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                    {row.tanggalMulai} - {row.tanggalSelesai}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {row.petugasUtama}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.kategoriPetugas === 'Key Account'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {row.kategoriPetugas || 'Petugas'}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                    {row.totalIndustri}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : row.status === 'Sedang Berjalan'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {row.status === 'Selesai' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : row.status === 'Sedang Berjalan' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{row.status}</span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs text-[11px]">
                    {row.adaPergeseran ? (
                      <span className="text-amber-700 dark:text-amber-300 font-medium line-clamp-2">
                        ⚠️ Pergeseran (Tgl {row.hariHOriginal} → {row.hariH}): {row.keteranganPergeseran}
                      </span>
                    ) : (
                      row.catatan || 'Jadwal Normal'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() =>
                          setEditingSchedule({
                            cycle: row.cycle,
                            bulan: row.bulan,
                            hariH: row.hariH,
                            tanggalMulai: row.tanggalMulai,
                            tanggalSelesai: row.tanggalSelesai,
                            petugasUtama: row.petugasUtama,
                            kategoriPetugas: row.kategoriPetugas,
                            catatan: row.catatan
                          })
                        }
                        className="px-2 py-1 text-xs font-semibold text-[#0055A5] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenShiftModal(row)}
                        className="px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition inline-flex items-center gap-1"
                        title="Atur pergeseran hari baca untuk cycle ini"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>Shift</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Atur Pergeseran Hari Baca Industri */}
      {editingShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border-2 border-amber-300 dark:border-amber-600 max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    Atur Pergeseran Hari Baca Industri
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih industri &amp; tanggal Hari H aktual pergeseran
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  1. Pilih Cycle yang Mengalami Pergeseran:
                </label>
                <select
                  value={shiftCycle}
                  onChange={(e) => handleCycleChangeInModal(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  {allCycles.map((c) => (
                    <option key={c} value={c}>
                      {c} ({customers.filter(cust => cust.cycle.toLowerCase() === c.toLowerCase()).length} Industri)
                    </option>
                  ))}
                </select>
              </div>

              {/* Kalender Pilih Hari H Aktual Pergeseran */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                <label className="block text-[11px] font-extrabold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>2. Pilih Hari H Aktual Pergeseran (Kalender):</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Pilih Tanggal di Kalender:</span>
                    <input
                      type="date"
                      value={shiftDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShiftDate(val);
                        if (val) {
                          const parts = val.split('-');
                          const dayNum = parseInt(parts[2], 10);
                          if (!isNaN(dayNum)) {
                            setShiftHariH(dayNum);
                          }
                        }
                      }}
                      className="w-full p-2 border-2 border-amber-400 dark:border-amber-500 rounded-xl bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white font-mono text-xs cursor-pointer focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hari H Asli:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Tgl {shiftHariHOriginal}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-100 dark:border-slate-700 pt-1">
                      <span className="text-amber-800 dark:text-amber-300 font-bold">Hari H Baru:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        Tgl {shiftHariH} ({shiftHariH - shiftHariHOriginal >= 0 ? `+${shiftHariH - shiftHariHOriginal}` : shiftHariH - shiftHariHOriginal} Hari)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist & Search Bar untuk Memilih Industri Terdampak */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                    3. Checklist Industri yang Bergeser ({currentCycleCustomers.length} Total):
                  </label>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedShiftedCustomerIds(currentCycleCustomers.map(c => c.id))}
                      className="text-[10px] font-bold text-[#0055A5] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedShiftedCustomerIds([])}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Batal Semua
                    </button>
                  </div>
                </div>

                {/* Search bar inside modal */}
                <div className="relative">
                  <input
                    type="text"
                    value={shiftSearchQuery}
                    onChange={(e) => setShiftSearchQuery(e.target.value)}
                    placeholder="Cari ID atau nama industri di cycle ini..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-[#0055A5]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {shiftSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setShiftSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Scrollable checklist items */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCycleCustomers.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-3">
                      {currentCycleCustomers.length === 0
                        ? `Belum ada industri terdaftar di ${shiftCycle}.`
                        : 'Tidak ada industri yang cocok dengan pencarian.'}
                    </p>
                  ) : (
                    filteredCycleCustomers.map((c: IndustryCustomer) => {
                      const isChecked = selectedShiftedCustomerIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 font-bold text-amber-950 dark:text-amber-100'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedShiftedCustomerIds((prev) =>
                                  prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 shrink-0 cursor-pointer"
                            />
                            <span className="font-mono font-black text-[#0055A5] dark:text-blue-400 shrink-0">{c.id}</span>
                            <span className="truncate font-semibold">{c.nama}</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {c.kelas}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 text-right pt-1">
                  ✓ {selectedShiftedCustomerIds.length} dari {currentCycleCustomers.length} Industri Dipilih Bergeser
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  4. Alasan / Kategori Pergeseran:
                </label>
                <select
                  value={shiftAlasan}
                  onChange={(e) => setShiftAlasan(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="Target Volume Industri">Target Volume Industri (Pemenuhan Kuota Billing Bulanan)</option>
                  <option value="Penyesuaian Hari Kerja/Libur">Penyesuaian Hari Libur Nasional / Weekend / Cuti Bersama</option>
                  <option value="Maintenance Jaringan Pipa">Maintenance / Perbaikan Jaringan Pipa Industri</option>
                  <option value="Permintaan Khusus Pelanggan">Permintaan Khusus Pelanggan Key Account</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  5. Keterangan Rinci Operasional Pergeseran:
                </label>
                <textarea
                  rows={2}
                  value={shiftKeterangan}
                  onChange={(e) => setShiftKeterangan(e.target.value)}
                  placeholder="Jelaskan alasan pergeseran hari baca, jam operasional shift industri..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-medium text-slate-800 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingShiftModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedShiftedCustomerIds.length === 0}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simpan Pergeseran Hari Baca ({selectedShiftedCustomerIds.length} Industri)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Single Cycle Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-5 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
              Ubah Jadwal Plotting {editingSchedule.cycle}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Hari H Baca Meter (Tanggal 1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingSchedule.hariH || 7}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, hariH: Number(e.target.value) })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Tanggal Mulai Pembacaan
                </label>
                <input
                  type="text"
                  value={editingSchedule.tanggalMulai}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, tanggalMulai: e.target.value })
                  }
                  placeholder="Contoh: 07 Sep 2026"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Tanggal Selesai Pembacaan
                </label>
                <input
                  type="text"
                  value={editingSchedule.tanggalSelesai}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, tanggalSelesai: e.target.value })
                  }
                  placeholder="Contoh: 08 Sep 2026"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Petugas Pembaca Lapangan
                </label>
                <select
                  value={editingSchedule.petugasUtama}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const r = meterReaders.find((m) => m.nama === selectedName);
                    setEditingSchedule({
                      ...editingSchedule,
                      petugasUtama: selectedName,
                      kategoriPetugas: r ? r.kategori : (selectedName === 'Belum Ditugaskan' ? undefined : editingSchedule.kategoriPetugas)
                    });
                  }}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold"
                >
                  <option value="Belum Ditugaskan">Belum Ditugaskan</option>
                  {meterReaders.map((r) => (
                    <option key={r.id} value={r.nama}>
                      {r.nama} ({r.perusahaan || r.kategori || 'Petugas Lapangan'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Catatan Wilayah
                </label>
                <input
                  type="text"
                  value={editingSchedule.catatan}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, catatan: e.target.value })
                  }
                  placeholder="Wilayah Industri Manis, dll."
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold bg-[#0055A5] hover:bg-blue-800 text-white rounded-xl shadow-xs transition"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
