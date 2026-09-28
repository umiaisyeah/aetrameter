import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CycleSchedule } from '../types';
import {
  parseYearlyCycleExcel,
  downloadYearlyCycleScheduleTemplate,
  MONTH_NAMES_ID
} from '../utils/excelDateHelper';
import { Upload, Download, Calendar, CheckCircle2, AlertCircle, X, FileSpreadsheet, Layers } from 'lucide-react';

interface ImportCycleScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (schedules: CycleSchedule[]) => void;
}

export const ImportCycleScheduleModal: React.FC<ImportCycleScheduleModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<CycleSchedule[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPreviewMonth, setSelectedPreviewMonth] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });

        const parsed = parseYearlyCycleExcel(workbook);

        if (!parsed || parsed.length === 0) {
          setErrorMessage(
            'Tidak ada data jadwal cycle yang valid ditemukan. Pastikan format file sesuai dengan template matriks 1 tahun (kolom tanggal 1-31) atau tabel jadwal cycle.'
          );
          return;
        }

        setParsedData(parsed);
      } catch (err) {
        console.error(err);
        setErrorMessage('Gagal membaca file Excel. Pastikan format file .xlsx atau .xls valid.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    onClose();
  };

  // Distinct months in parsed data
  const monthsInParsed = Array.from(new Set(parsedData.map((p) => p.bulan || 'September 2026')));

  const displayedPreview = parsedData.filter((item) => {
    if (selectedPreviewMonth === 'ALL') return true;
    return item.bulan === selectedPreviewMonth;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0055A5] dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                Impor Jadwal Cycle 1 Tahun via Excel
              </h3>
              <p className="text-xs text-slate-400">
                Otomatiskan plotting cycle per bulan di tiap tanggal (1-31) dari matriks kalender Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Instructions and Download Template */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Format Matriks Kalender 1 Tahun Sesuai Template:</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Mendukung format matriks kalender bulanan/tahunan (header bar <strong>Sep-26</strong>, baris tanggal <strong>1 - 31</strong>, kolom merah hari Minggu, dan nomor cycle 1-15 berwarna kuning) maupun format tabel data.
              </p>
            </div>
            <button
              onClick={downloadYearlyCycleScheduleTemplate}
              className="shrink-0 px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template 1 Tahun (.xlsx)</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#0055A5] dark:hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[#0055A5] dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs mb-1">
              {fileName ? fileName : 'Pilih File Matriks Kalender Cycle Excel (.xlsx / .xls)'}
            </p>
            <p className="text-[11px] text-slate-400">
              Sistem akan otomatis mendeteksi sheet 1 tahun atau matriks tanggal 1-31 dan memplot cycle per bulan secara otomatis.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium text-xs">{errorMessage}</span>
            </div>
          )}

          {/* Preview Section */}
          {parsedData.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Ditemukan {parsedData.length} Jadwal Plotting ({monthsInParsed.length} Bulan)
                  </span>
                </span>

                {monthsInParsed.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Filter Bulan:</span>
                    <select
                      value={selectedPreviewMonth}
                      onChange={(e) => setSelectedPreviewMonth(e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white"
                    >
                      <option value="ALL">Semua Bulan ({monthsInParsed.length})</option>
                      {monthsInParsed.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Bulan</th>
                      <th className="p-2.5">Cycle</th>
                      <th className="p-2.5">Hari H (Tgl)</th>
                      <th className="p-2.5">Rentang Tanggal</th>
                      <th className="p-2.5">Petugas Lapangan</th>
                      <th className="p-2.5">Kategori Tim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                    {displayedPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                          {item.bulan}
                        </td>
                        <td className="p-2.5 font-bold text-[#0055A5] dark:text-blue-400">
                          {item.cycle}
                        </td>
                        <td className="p-2.5 font-black text-[#E86216]">
                          Tgl {item.hariH}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          {item.tanggalMulai} - {item.tanggalSelesai}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {item.petugasUtama}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.kategoriPetugas === 'Key Account'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.kategoriPetugas}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedData.length === 0}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
              parsedData.length > 0
                ? 'bg-[#0055A5] hover:bg-blue-800 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan {parsedData.length} Jadwal Matriks Cycle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
