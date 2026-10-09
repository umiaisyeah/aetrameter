import React from 'react';
import { IndustryCustomer } from '../types';
import {
  CheckCircle2,
  Clock,
  Receipt,
  Droplets,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';

interface SectionProgressHubProps {
  customers: IndustryCustomer[];
  onFilterStatus?: (statusFilter: string) => void;
  variant?: 'dual' | 'verification_only' | 'billing_only' | 'compact';
}

// Helper akurat untuk menghitung persentase progress tanpa pembulatan nol yang keliru
export const formatProgressPercent = (count: number, denom: number): {
  pctStr: string;   // Contoh: '0.4%' atau '100%' atau '0%'
  numStr: string;   // Contoh: '0.4' atau '100' atau '0'
  barWidth: number; // Minimal 1.5% agar progress bar memiliki indikator visual saat count > 0
} => {
  if (denom <= 0 || count <= 0) {
    return { pctStr: '0%', numStr: '0', barWidth: 0 };
  }
  const raw = (count / denom) * 100;
  if (raw >= 100) {
    return { pctStr: '100%', numStr: '100', barWidth: 100 };
  }
  // Format dengan 1 desimal jika di bawah 1% atau bukan bilangan bulat
  const formatted = raw < 1 || raw % 1 !== 0 ? raw.toFixed(1) : String(Math.round(raw));
  return {
    pctStr: `${formatted}%`,
    numStr: formatted,
    barWidth: Math.max(1.5, Math.min(100, raw))
  };
};

export const SectionProgressHub: React.FC<SectionProgressHubProps> = ({
  customers,
  onFilterStatus,
  variant = 'dual'
}) => {
  const total = customers.length;

  // Reading verification metrics
  const unreadCount = customers.filter((c) => c.status === 'Belum Dibaca').length;
  const pendingCount = customers.filter((c) => c.status === 'Pending Verification').length;
  const verifiedCount = customers.filter((c) => c.status === 'Verified').length;
  const invoicedCount = customers.filter((c) => c.status === 'Invoiced').length;

  // SINKRONISASI VERIFIKASI: Total yang selesai diverifikasi (Verified + Invoiced)
  const totalVerifiedAndInvoiced = verifiedCount + invoicedCount;
  const verificationStat = formatProgressPercent(totalVerifiedAndInvoiced, total);

  // SINKRONISASI INVOICING: Sesuai dengan data yang SUDAH DIVERIFIKASI!
  // Target penagihan/invoicing dihitung dari total data yang sudah diverifikasi resmi oleh Tim Meter Reading
  const billingTarget = totalVerifiedAndInvoiced;
  const billingStatFromVerified = formatProgressPercent(invoicedCount, billingTarget);
  const overallBillingStat = formatProgressPercent(invoicedCount, total);

  // Financial & volume totals
  const totalVolumeM3 = customers.reduce((acc, c) => {
    if (c.status === 'Belum Dibaca') return acc;
    return acc + Math.max(0, (c.skrg || 0) - (c.lalu || 0));
  }, 0);

  const invoicedVolumeM3 = customers.reduce((acc, c) => {
    if (c.status !== 'Invoiced') return acc;
    return acc + Math.max(0, (c.skrg || 0) - (c.lalu || 0));
  }, 0);

  const estimatedTarifPerM3 = 17872;
  const totalInvoicedRupiah = invoicedVolumeM3 * estimatedTarifPerM3;
  const totalPotensiRupiah = totalVolumeM3 * estimatedTarifPerM3;

  const countMaterai = customers.filter((c) => {
    const vol = Math.max(0, (c.skrg || 0) - (c.lalu || 0));
    return vol * estimatedTarifPerM3 > 5000000;
  }).length;

  return (
    <div className="space-y-4">
      {/* Dual Progress Mode (Default for Monitoring & Overview) */}
      {(variant === 'dual' || variant === 'compact') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Card 1: Progress Verifikasi Reading (Emerald / Teal / Cyan Theme) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#064e3b] to-teal-950 text-white p-5 shadow-xl border border-emerald-500/40 transition-all duration-300 hover:shadow-emerald-500/10">
            {/* Ambient Decorative Glows */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm tracking-wide text-white">
                        Progress Verifikasi Reading
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-400/25 text-emerald-200 border border-emerald-400/30">
                        Tim Meter Reading
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80 mt-0.5">
                      Validasi stand meter fisik &amp; BPM pembacaan lapangan
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 block">Capaian</span>
                  <span className="text-2xl font-black font-mono text-emerald-300 tracking-tight">
                    {verificationStat.pctStr}
                  </span>
                </div>
              </div>

              {/* Colorful Animated Linear Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-100">
                  <span>Tingkat Verifikasi Selesai:</span>
                  <span className="font-mono text-white">
                    {totalVerifiedAndInvoiced} / {total} Industri ({verificationStat.pctStr})
                  </span>
                </div>
                <div className="w-full h-3 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-emerald-400/30">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full transition-all duration-700 ease-out shadow-xs"
                    style={{ width: `${verificationStat.barWidth}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Mini Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  onClick={() => onFilterStatus && onFilterStatus('Belum Dibaca')}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition cursor-pointer"
                  title="Klik untuk filter industri Belum Dibaca"
                >
                  <span className="text-[10px] font-bold text-emerald-200/90 block">Belum Dibaca</span>
                  <span className="font-mono font-black text-amber-300 text-base">{unreadCount}</span>
                  <span className="text-[9px] text-emerald-200/70 block mt-0.5">Industri</span>
                </div>

                <div
                  onClick={() => onFilterStatus && onFilterStatus('Pending Verification')}
                  className="p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md border border-amber-400/30 transition cursor-pointer"
                  title="Klik untuk filter industri Pending Verifikasi"
                >
                  <span className="text-[10px] font-bold text-amber-200 block">Pending Verif</span>
                  <span className="font-mono font-black text-amber-200 text-base">{pendingCount}</span>
                  <span className="text-[9px] text-amber-200/70 block mt-0.5">Verifikasi BPM</span>
                </div>

                <div
                  onClick={() => onFilterStatus && onFilterStatus('Verified')}
                  className="p-2.5 rounded-2xl bg-emerald-500/25 hover:bg-emerald-500/35 backdrop-blur-md border border-emerald-400/40 transition cursor-pointer"
                  title="Klik untuk filter industri Verified"
                >
                  <span className="text-[10px] font-bold text-emerald-200 block">Terverifikasi</span>
                  <span className="font-mono font-black text-emerald-300 text-base">{totalVerifiedAndInvoiced}</span>
                  <span className="text-[9px] text-emerald-200/70 block mt-0.5">Siap Billing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Progress Billing & Invoicing (Indigo / Purple / Orange Theme) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-[#1e1b4b] to-purple-950 text-white p-5 shadow-xl border border-purple-500/40 transition-all duration-300 hover:shadow-purple-500/10">
            {/* Ambient Decorative Glows */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E86216] via-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm tracking-wide text-white">
                        Progress Billing &amp; Invoicing
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/25 text-orange-200 border border-orange-400/30">
                        Tim Billing &amp; Invoicing
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/80 mt-0.5">
                      Penerbitan faktur pajak &amp; tagihan air industri resmi
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-purple-300 block">Invoiced</span>
                  <span className="text-2xl font-black font-mono text-amber-300 tracking-tight">
                    {billingStatFromVerified.pctStr}
                  </span>
                </div>
              </div>

              {/* Colorful Animated Linear Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-purple-100">
                  <span>Status Faktur &amp; Invoice Resmi Terbit:</span>
                  <span className="font-mono text-white">
                    {invoicedCount} / {billingTarget} Industri Terverifikasi ({billingStatFromVerified.pctStr})
                  </span>
                </div>
                <div className="w-full h-3 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-purple-400/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#E86216] via-purple-400 to-amber-300 rounded-full transition-all duration-700 ease-out shadow-xs"
                    style={{ width: `${billingStatFromVerified.barWidth}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Mini Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  onClick={() => onFilterStatus && onFilterStatus('Verified')}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition cursor-pointer"
                  title="Klik untuk filter industri siap diterbitkan invoice"
                >
                  <span className="text-[10px] font-bold text-purple-200/90 block">Siap Tagih</span>
                  <span className="font-mono font-black text-emerald-300 text-base">{verifiedCount}</span>
                  <span className="text-[9px] text-purple-200/70 block mt-0.5">Verified</span>
                </div>

                <div
                  onClick={() => onFilterStatus && onFilterStatus('Invoiced')}
                  className="p-2.5 rounded-2xl bg-purple-500/25 hover:bg-purple-500/35 backdrop-blur-md border border-purple-400/40 transition cursor-pointer"
                  title="Klik untuk filter invoice terbit"
                >
                  <span className="text-[10px] font-bold text-purple-200 block">Invoice Terbit</span>
                  <span className="font-mono font-black text-amber-300 text-base">{invoicedCount}</span>
                  <span className="text-[9px] text-purple-200/70 block mt-0.5">Sudah Terkirim</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-orange-500/20 backdrop-blur-md border border-orange-400/30">
                  <span className="text-[10px] font-bold text-orange-200 block">Target Terverif</span>
                  <span className="font-mono font-black text-orange-300 text-base">{billingTarget}</span>
                  <span className="text-[9px] text-orange-200/70 block mt-0.5">Sesuai Verifikasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Verifikasi Reading Deep Dive Card */}
      {variant === 'verification_only' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#064e3b] to-teal-950 text-white p-6 shadow-xl border-2 border-emerald-500/40">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-500/30 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-white">
                      Dashboard Progress Verifikasi Reading
                    </h3>
                    <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      Live Meter Reading
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Monitoring validasi lapangan stand meter industri Cycle 1 - 15
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-300 block uppercase">Pencapaian Verifikasi</span>
                  <span className="text-3xl font-black font-mono text-emerald-300">
                    {verificationStat.pctStr}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-100">
                <span>Total Verifikasi Selesai:</span>
                <span className="font-mono text-emerald-300 font-extrabold text-sm">
                  {totalVerifiedAndInvoiced} dari {total} Industri Selesai Diverifikasi ({verificationStat.pctStr})
                </span>
              </div>
              <div className="w-full h-3.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-emerald-400/30">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${verificationStat.barWidth}%` }}
                />
              </div>
            </div>

            {/* 4 Detail metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                <span className="text-[11px] font-bold text-emerald-200 block">Total Target Industri</span>
                <span className="font-mono font-black text-white text-xl mt-1 block">{total}</span>
                <span className="text-[10px] text-emerald-200/70">Cycle 1 s/d 15</span>
              </div>

              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30">
                <span className="text-[11px] font-bold text-amber-200 block">Belum Dibaca Petugas</span>
                <span className="font-mono font-black text-amber-300 text-xl mt-1 block">{unreadCount}</span>
                <span className="text-[10px] text-amber-200/70">Menunggu Catat Lapangan</span>
              </div>

              <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-400/30">
                <span className="text-[11px] font-bold text-sky-200 block">Pending Verifikasi</span>
                <span className="font-mono font-black text-sky-300 text-xl mt-1 block">{pendingCount}</span>
                <span className="text-[10px] text-sky-200/70">Perlu Validasi Visual BPM</span>
              </div>

              <div className="p-3 bg-emerald-500/25 rounded-2xl border border-emerald-400/40">
                <span className="text-[11px] font-bold text-emerald-200 block">Sudah Terverifikasi</span>
                <span className="font-mono font-black text-emerald-300 text-xl mt-1 block">{totalVerifiedAndInvoiced}</span>
                <span className="text-[10px] text-emerald-200/70">Siap Diterbitkan Faktur</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Billing & Invoicing Deep Dive Card */}
      {variant === 'billing_only' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-[#1e1b4b] to-purple-950 text-white p-6 shadow-xl border-2 border-purple-500/40">
          <div className="absolute right-0 top-0 w-80 h-80 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/30 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E86216] via-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                  <Receipt className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-white">
                      Dashboard Progress Billing &amp; Invoicing
                    </h3>
                    <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      Invoicing Unit Industri
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Pengelolaan penerbitan tagihan resmi, perhitungan volume &amp; e-materai
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-300 block uppercase">Progress Invoicing</span>
                  <span className="text-3xl font-black font-mono text-amber-300">
                    {billingStatFromVerified.pctStr}
                  </span>
                  <span className="text-[10px] text-purple-200/80 block font-medium">
                    dari {billingTarget} terverifikasi ({overallBillingStat.pctStr} total)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-purple-100">
                <span>Penerbitan Invoice dari Data Terverifikasi:</span>
                <span className="font-mono text-amber-300 font-extrabold text-sm">
                  {invoicedCount} dari {billingTarget} Industri Terverifikasi Telah Diterbitkan Faktur ({billingStatFromVerified.pctStr})
                </span>
              </div>
              <div className="w-full h-3.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-purple-400/30">
                <div
                  className="h-full bg-gradient-to-r from-[#E86216] via-purple-400 to-amber-300 rounded-full transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${billingStatFromVerified.barWidth}%` }}
                />
              </div>
            </div>

            {/* 4 Detail metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                <span className="text-[11px] font-bold text-purple-200 block">Siap Diterbitkan Invoice</span>
                <span className="font-mono font-black text-white text-xl mt-1 block">{verifiedCount}</span>
                <span className="text-[10px] text-purple-200/70">Status Verified</span>
              </div>

              <div className="p-3 bg-purple-500/25 rounded-2xl border border-purple-400/40">
                <span className="text-[11px] font-bold text-purple-200 block">Faktur / Invoice Terbit</span>
                <span className="font-mono font-black text-amber-300 text-xl mt-1 block">{invoicedCount}</span>
                <span className="text-[10px] text-purple-200/70">Telah Dikirim ke Surel</span>
              </div>

              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                <span className="text-[11px] font-bold text-blue-200 block">Total Sudah Terverifikasi</span>
                <span className="font-mono font-black text-blue-300 text-xl mt-1 block">{billingTarget}</span>
                <span className="text-[10px] text-blue-200/70">Target Penagihan Aktif</span>
              </div>

              <div className="p-3 bg-orange-500/20 rounded-2xl border border-orange-400/30">
                <span className="text-[11px] font-bold text-orange-200 block">Total Nilai Tagihan Terbit</span>
                <span className="font-mono font-black text-orange-300 text-base mt-1 block truncate">
                  Rp {totalInvoicedRupiah.toLocaleString()}
                </span>
                <span className="text-[10px] text-orange-200/70">{countMaterai} Faktur dgn e-Materai</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
