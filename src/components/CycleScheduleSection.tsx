import React, { useState } from 'react';
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
  Check
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
}

export const CycleScheduleSection: React.FC<CycleScheduleSectionProps> = ({
  cycleSchedules,
  customers,
  meterReaders,
  onOpenImportModal,
  onUpdateSchedule
}) => {
  const [editingSchedule, setEditingSchedule] = useState<CycleSchedule | null>(null);
  const [editingShiftModal, setEditingShiftModal] = useState<CycleSchedule | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [expandedShiftCycle, setExpandedShiftCycle] = useState<string | null>(null);

  // Form states for Shift Modal
  const [shiftCycle, setShiftCycle] = useState<string>('Cycle 3');
  const [shiftHariH, setShiftHariH] = useState<number>(9);
  const [shiftHariHOriginal, setShiftHariHOriginal] = useState<number>(8);
  const [shiftAlasan, setShiftAlasan] = useState<
    'Target Volume Industri' | 'Penyesuaian Hari Kerja/Libur' | 'Maintenance Jaringan Pipa' | 'Permintaan Khusus Pelanggan' | 'Lainnya'
  >('Target Volume Industri');
  const [shiftTargetVolume, setShiftTargetVolume] = useState<number>(4500);
  const [shiftKeterangan, setShiftKeterangan] = useState<string>(
    'Pergeseran H+1 hari untuk mengakomodasi akumulasi jam kerja shift pabrik demi pemenuhan target volume bulanan.'
  );

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
      targetVolumeTambahanM3: found?.targetVolumeTambahanM3 || (cName === 'Cycle 3' ? 4500 : 0),
      keteranganPergeseran:
        found?.keteranganPergeseran ||
        (cName === 'Cycle 3'
          ? 'Pergeseran H+1 hari untuk mengakomodasi akumulasi jam kerja shift pabrik demi pemenuhan target volume bulanan.'
          : ''),
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
  const totalShiftedVolume = shiftedSchedules.reduce((acc, s) => acc + (s.targetVolumeTambahanM3 || 0), 0);

  const handleOpenShiftModal = (schedule?: any) => {
    if (schedule) {
      setShiftCycle(schedule.cycle);
      setShiftHariH(schedule.hariH);
      setShiftHariHOriginal(schedule.hariHOriginal || schedule.hariH - 1);
      setShiftAlasan(schedule.alasanPergeseran || 'Target Volume Industri');
      setShiftTargetVolume(schedule.targetVolumeTambahanM3 || 5000);
      setShiftKeterangan(
        schedule.keteranganPergeseran ||
          'Pergeseran jadwal hari baca untuk pemenuhan target volume billing air industri bulanan.'
      );
      setEditingShiftModal(schedule);
    } else {
      setShiftCycle('Cycle 4');
      setShiftHariH(11);
      setShiftHariHOriginal(10);
      setShiftAlasan('Target Volume Industri');
      setShiftTargetVolume(5000);
      setShiftKeterangan('Pergeseran H+1 hari untuk mengejar kuota target volume produksi pabrik sebelum cut-off billing.');
      setEditingShiftModal({
        cycle: 'Cycle 4',
        bulan: selectedMonth,
        hariH: 11,
        tanggalMulai: '11 Sep 2026',
        tanggalSelesai: '12 Sep 2026',
        petugasUtama: 'Febriadi'
      } as CycleSchedule);
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = scheduleList.find((s) => s.cycle.toLowerCase() === shiftCycle.toLowerCase());
    const selisih = shiftHariH - shiftHariHOriginal;

    const updated: CycleSchedule = {
      cycle: shiftCycle,
      bulan: existing?.bulan || selectedMonth,
      hariH: shiftHariH,
      tanggalMulai: `${String(shiftHariH).padStart(2, '0')} Sep 2026`,
      tanggalSelesai: `${String(shiftHariH + 1).padStart(2, '0')} Sep 2026`,
      petugasUtama: existing?.petugasUtama || 'Petugas Lapangan',
      kategoriPetugas: existing?.kategoriPetugas,
      catatan: existing?.catatan || 'Jadwal mengalami pergeseran target volume',
      adaPergeseran: true,
      hariHOriginal: shiftHariHOriginal,
      selisihHariPergeseran: selisih,
      alasanPergeseran: shiftAlasan,
      targetVolumeTambahanM3: shiftTargetVolume,
      keteranganPergeseran: shiftKeterangan
    };

    onUpdateSchedule(updated);
    setEditingShiftModal(null);
    showColorfulAlert({
      title: 'Pergeseran Hari Baca Disimpan! 📅',
      message: `Pergeseran Hari Baca untuk ${shiftCycle} (Tgl ${shiftHariHOriginal} → Tgl ${shiftHariH}) berhasil disimpan & otomatis disinkronkan ke kalender matriks dan aplikasi petugas lapangan!`,
      type: 'success',
      badge: 'PERGESERAN CYCLE'
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
      targetVolumeTambahanM3: 0,
      keteranganPergeseran: ''
    };

    onUpdateSchedule(reverted);
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
            <div className="w-10 h-10 rounded-xl bg-[#0055A5] text-white font-black flex items-center justify-center text-xs">
              m³
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300">Estimasi Tambahan Volume</p>
              <p className="text-xs font-black text-[#0055A5] dark:text-blue-400">
                +{totalShiftedVolume.toLocaleString('id-ID')} m³
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
                Semua 15 cycle berjalan tepat sesuai jadwal normal kalender. Klik <strong>+ Atur Pergeseran Hari Baca</strong> jika ada pergeseran untuk mengejar target volume.
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
                        Alasan: {shift.alasanPergeseran || 'Target Volume Industri'}
                      </span>
                      {shift.targetVolumeTambahanM3 && shift.targetVolumeTambahanM3 > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Target Volume: +{shift.targetVolumeTambahanM3.toLocaleString('id-ID')} m³
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">Keterangan Operasional:</strong>{' '}
                      {shift.keteranganPergeseran || 'Pergeseran dilakukan untuk mengoptimalkan pembacaan stand meter volume besar.'}
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                      <span>Petugas: <strong className="text-slate-700 dark:text-slate-300">{shift.petugasUtama}</strong></span>
                      <span>·</span>
                      <span>Total Industri: <strong>{shift.totalIndustri} Pelanggan</strong></span>
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
                    <span>{expandedShiftCycle === shift.cycle ? '▼ Sembunyikan Daftar Industri Sesuai Cycle Ini' : '▶ Lihat Filter Industri Sesuai Cycle Ini'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[10px]">
                      {customers.filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase()).length} Pelanggan
                    </span>
                  </button>

                  {expandedShiftCycle === shift.cycle && (
                    <div className="mt-3 space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto text-xs">
                      {customers.filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase()).length === 0 ? (
                        <p className="text-slate-400 italic text-center py-2">Belum ada industri terdaftar di {shift.cycle}.</p>
                      ) : (
                        customers
                          .filter((c) => c.cycle.toLowerCase() === shift.cycle.toLowerCase())
                          .map((cust) => (
                            <div key={cust.id} className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  <span>{cust.id}</span> · <span>{cust.nama}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Stand Lalu: {cust.lalu.toLocaleString()} m³ | Stand Skrg: {cust.skrg.toLocaleString()} m³ | Petugas: {cust.petugasBaca || shift.petugasUtama}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {cust.status}
                              </span>
                            </div>
                          ))
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

      {/* MODAL: Atur Pergeseran Hari Baca untuk Pemenuhan Target Volume */}
      {editingShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border-2 border-amber-300 dark:border-amber-600 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    Atur Pergeseran Hari Baca &amp; Target Volume
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otomatis sinkron ke Kalender Matriks dan Akun Petugas Lapangan
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Pilih Cycle yang Mengalami Pergeseran:
                </label>
                <select
                  value={shiftCycle}
                  onChange={(e) => setShiftCycle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                >
                  {allCycles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Hari H Asli / Normal:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={shiftHariHOriginal}
                    onChange={(e) => setShiftHariHOriginal(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold text-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1 text-amber-600 dark:text-amber-400">
                    Hari H Aktual Pergeseran:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={shiftHariH}
                    onChange={(e) => setShiftHariH(Number(e.target.value))}
                    className="w-full p-2.5 border-2 border-amber-400 dark:border-amber-500 rounded-xl bg-amber-50/50 dark:bg-slate-700 font-black text-amber-900 dark:text-amber-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Alasan / Kategori Pergeseran:
                </label>
                <select
                  value={shiftAlasan}
                  onChange={(e) => setShiftAlasan(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
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
                  Estimasi Tambahan / Target Volume Terdampak (m³):
                </label>
                <input
                  type="number"
                  value={shiftTargetVolume}
                  onChange={(e) => setShiftTargetVolume(Number(e.target.value))}
                  placeholder="Contoh: 5000"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-mono font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Keterangan Rinci Operasional Pergeseran:
                </label>
                <textarea
                  rows={3}
                  value={shiftKeterangan}
                  onChange={(e) => setShiftKeterangan(e.target.value)}
                  placeholder="Jelaskan alasan pergeseran hari baca, jam operasional shift industri, target kubikasi yang ingin dicapai..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-medium text-slate-800 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingShiftModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simpan Pergeseran Hari Baca
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
