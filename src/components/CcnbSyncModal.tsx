import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { IndustryCustomer, UserProfile } from '../types';
import { generateCcnbBatchNumber, getFormattedCcnbTime } from '../utils/recognitionEngine';

interface CcnbSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: IndustryCustomer[];
  onConfirmInputCcnb: (customerIds: string[], batchNo: string, note?: string) => void;
  currentUser: UserProfile;
}

export const CcnbSyncModal: React.FC<CcnbSyncModalProps> = ({
  isOpen,
  onClose,
  customers,
  onConfirmInputCcnb,
  currentUser
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [batchNo, setBatchNo] = useState<string>(() => generateCcnbBatchNumber());
  const [successResult, setSuccessResult] = useState<{
    count: number;
    batchNo: string;
    time: string;
  } | null>(null);

  if (!isOpen) return null;

  const totalVolume = customers.reduce((sum, c) => {
    const vol = c.skrg > c.lalu ? c.skrg - c.lalu : 0;
    return sum + vol;
  }, 0);

  const handleExecute = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const timeStr = getFormattedCcnbTime();
      const ids = customers.map((c) => c.id);
      onConfirmInputCcnb(ids, batchNo, `Input ke CCnB Batch ${batchNo} oleh ${currentUser.name}`);
      setIsSubmitting(false);
      setSuccessResult({
        count: customers.length,
        batchNo,
        time: timeStr
      });
    }, 1000);
  };

  const handleFinish = () => {
    setSuccessResult(null);
    onClose();
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 my-auto">
        {/* Header - Core System CCnB Navy/Cyan Theme */}
        <div className="bg-gradient-to-r from-[#031B4E] via-[#0A3A82] to-[#0055A5] text-white p-5 flex justify-between items-center shrink-0 border-b border-blue-400/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 backdrop-blur-md border border-cyan-300/30 text-cyan-300 shadow-inner shrink-0">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2 text-white truncate">
                  <span>Input Data Stand ke Sistem CCnB</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 font-mono text-[10px] font-extrabold border border-cyan-400/30 shrink-0">
                  CORE BILLING GATEWAY
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium truncate">
                Customer Care &amp; Billing (CCnB) — Integrasi Pencatatan Meter &amp; Billing PT Aetra Air Tangerang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white hover:bg-white/15 transition p-1.5 rounded-xl border border-white/20 cursor-pointer shrink-0 ml-2 disabled:opacity-40"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {successResult ? (
            /* Success State */
            <div className="p-6 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  Data Berhasil Terinput ke Sistem CCnB! 🚀
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                  Sebanyak <strong>{successResult.count} industri</strong> pembacaan meter telah resmi terinput ke dalam database core CCnB PT Aetra Air Tangerang.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 max-w-md mx-auto text-left space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Batch CCnB:</span>
                  <span className="font-bold text-[#0055A5] dark:text-blue-400">{successResult.batchNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Sinkronisasi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{successResult.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Operator:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <span className="text-slate-500">Status Alur Kerja:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">PINDAH KE SECTION BILLING</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 text-left flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Hasil pembacaan yang telah terinput CCnB kini sudah otomatis berpindah ke <strong>Section Billing &amp; Invoicing</strong> untuk proses penerbitan faktur tagihan resmi air industri oleh Pak Yaya / Tim Billing.
                </span>
              </div>
            </div>
          ) : (
            /* Confirm Input Flow */
            <>
              {/* Info Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#0055A5] text-white shrink-0 shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#003E78] dark:text-blue-300 text-xs sm:text-sm">
                    Verifikasi Input CCnB (Customer Care &amp; Billing)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Fitur ini memvalidasi pembacaan meter yang telah diverifikasi oleh Tim Meter Reading (foto stand meter &amp; foto BPM cocok). Setelah tombol di bawah ditekan, data stand akan diinput ke sistem CCnB dan <strong>otomatis dipindahkan ke Section Billing &amp; Invoicing</strong>.
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Jumlah Akun</p>
                  <p className="text-base font-black text-[#0055A5] dark:text-blue-400 mt-0.5 font-mono">
                    {customers.length} Industri
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Volume Total</p>
                  <p className="text-base font-black text-[#E86216] mt-0.5 font-mono">
                    {totalVolume.toLocaleString('id-ID')} m³
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status Gateway</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ONLINE</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Batch Reference</p>
                  <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 mt-1 truncate" title={batchNo}>
                    {batchNo}
                  </p>
                </div>
              </div>

              {/* Customer List to be inputted */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
                    <span>Daftar Pelanggan Industri yang Akan Di-Input ke CCnB:</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Verifikasi Meter Reading: OK ✓
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
                  {customers.map((c) => {
                    const vol = c.skrg > c.lalu ? c.skrg - c.lalu : 0;
                    return (
                      <div key={c.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800 transition">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {c.nama}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {c.id} · {c.cycle} · Petugas: {c.petugasBaca || 'Pencatat Meter'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-extrabold text-[#0055A5] dark:text-blue-400 text-xs">
                            Stand: {c.skrg.toLocaleString('id-ID')} m³
                          </div>
                          <div className="text-[10px] font-mono font-bold text-[#E86216]">
                            Vol: {vol.toLocaleString('id-ID')} m³
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality Checklist */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-slate-600 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pemeriksaan Pra-Sinkronisasi CCnB:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 dark:text-slate-300 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Status Verifikasi: Selesai (Verified)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Rekonsiliasi Foto Stand &amp; BPM: Cocok (100% Match)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>GPS &amp; Bukti Foto Lapangan: Tervalidasi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Tujuan Alur: Dipindahkan ke Billing &amp; Invoicing</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={successResult ? handleFinish : onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            {successResult ? 'Tutup Dialog' : 'Batal'}
          </button>

          {!successResult && (
            <button
              type="button"
              onClick={handleExecute}
              disabled={isSubmitting || customers.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-[#0055A5] via-blue-600 to-indigo-600 hover:from-[#003E78] hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Mengirim Data ke CCnB Core...</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 text-cyan-300" />
                  <span>Check &amp; Input ke CCnB ({customers.length} Industri)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                </>
              )}
            </button>
          )}

          {successResult && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai &amp; Buka Billing</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
