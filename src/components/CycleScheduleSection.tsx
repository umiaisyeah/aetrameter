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
  Building2
} from 'lucide-react';
import { downloadYearlyCycleScheduleTemplate } from '../utils/excelDateHelper';
import { CycleCalendarGridView } from './CycleCalendarGridView';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');

  // Merge default 15 cycles with imported schedules
  const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  const scheduleList = allCycles.map((cName, idx) => {
    const found = cycleSchedules.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
    const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());
    const completed = cycleCusts.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;

    let defaultPetugas = 'Belum Ditugaskan';
    let defaultKategori: ReaderCategory | undefined = undefined;

    const readerForCycle = meterReaders.find((r) =>
      r.assignedCycles.some((ac) => ac.toLowerCase() === cName.toLowerCase())
    );
    if (readerForCycle) {
      defaultPetugas = readerForCycle.nama;
      defaultKategori = readerForCycle.kategori;
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    onUpdateSchedule(editingSchedule);
    setEditingSchedule(null);
    alert(`Jadwal untuk ${editingSchedule.cycle} berhasil diperbarui!`);
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

      {/* Schedule Table List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
              Daftar Rinci Tanggal Pembacaan Tiap Cycle
            </h4>
            <p className="text-[11px] text-slate-400">
              Menampilkan Hari H baca meter, rentang tanggal verifikasi, serta petugas lapangan penanggungjawab
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
                <th className="p-3">Catatan Wilayah</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {scheduleList.map((row) => (
                <tr key={row.cycle} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3 font-extrabold text-[#0055A5] dark:text-blue-400">
                    {row.cycle}
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
                      {row.kategoriPetugas}
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
                  <td className="p-3 text-slate-400 truncate max-w-xs">{row.catatan || '-'}</td>
                  <td className="p-3 text-center">
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
                      className="px-2.5 py-1 text-xs font-semibold text-[#0055A5] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
