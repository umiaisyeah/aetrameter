import React from 'react';
import {
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  FileCheck,
  Receipt,
  Camera,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { IndustryCustomer } from '../types';

interface IndustryWorkflowTrackerProps {
  customer: IndustryCustomer;
  className?: string;
}

export const IndustryWorkflowTracker: React.FC<IndustryWorkflowTrackerProps> = ({
  customer,
  className = ''
}) => {
  const isRead = customer.status !== 'Belum Dibaca' && customer.skrg > 0;
  const isVerified = customer.status === 'Verified' || customer.status === 'Invoiced';
  const isInvoiced = customer.status === 'Invoiced';

  // Helper timestamps
  const defaultBaseDate = customer.bulan ? customer.bulan.replace('ALL', 'September 2026') : 'September 2026';
  const scheduleTime = `01 ${defaultBaseDate.includes('2026') ? defaultBaseDate : defaultBaseDate + ' 2026'} 08:00:00 WIB`;
  
  const readerUser = customer.petugasBaca || 'Anjarini Sukamto (Petugas Lapangan)';
  const readerTime = customer.waktuBaca || customer.meterWaktuFoto || (isRead ? `28 Sep 2026 09:45:18 WIB` : 'Belum Dilakukan');

  const verifierUser =
    customer.verifiedBy ||
    (isVerified ? 'Akhmad Solihin (Admin Meter Reading)' : 'Tim Meter Reading (Akhmad Solihin / Kabul Nugroho / Tri Kartono)');
  const verifierTime =
    customer.verifiedAt ||
    (isVerified ? customer.waktuBaca ? `${customer.waktuBaca}` : '29 Sep 2026 10:15:30 WIB' : 'Menunggu Verifikasi Admin');

  const billingUser =
    customer.invoicedBy ||
    (isInvoiced ? 'Yaya Sunarya (Admin Billing & Invoicing)' : 'Tim Billing & Invoicing (Yaya Sunarya / Melva Sinaga)');
  const billingTime =
    customer.invoicedAt ||
    (isInvoiced ? '30 Sep 2026 11:30:00 WIB' : 'Menunggu Penerbitan Tagihan');

  const currentUsage = Math.max(0, customer.skrg - customer.lalu);

  const steps = [
    {
      id: 'penjadwalan',
      stepNumber: '1',
      title: 'Penjadwalan & Plotting Siklus Cycle',
      icon: Calendar,
      user: 'Bayu Pramono (Admin Master Data SIMBA)',
      role: 'Admin Penjadwalan & Master Data',
      time: scheduleTime,
      isCompleted: true,
      isActive: false,
      accentColor: 'blue',
      badge: 'TERPLOT OTOMATIS',
      details: `Industri ${customer.nama} (${customer.id}) telah dialokasikan ke ${customer.cycle} dengan jadwal penugasan petugas pembaca meter.`
    },
    {
      id: 'pencatatan',
      stepNumber: '2',
      title: 'Pembacaan Stand Meter & Unggah Dokumen BPM Fisik',
      icon: Camera,
      user: readerUser,
      role: customer.kategoriPetugas || 'Petugas Pembaca Meter Lapangan',
      time: readerTime,
      isCompleted: isRead,
      isActive: customer.status === 'Belum Dibaca',
      accentColor: 'blue',
      badge: isRead ? 'SELESAI DIBACA' : 'MENUNGGU PETUGAS',
      details: isRead
        ? `Stand Terbaca: ${customer.skrg.toLocaleString()} m³ (Volume Pemakaian: ${currentUsage.toLocaleString()} m³). Bukti foto stand meter & dokumen BPM fisik telah terunggah dengan geotagging GPS presisi.`
        : 'Petugas lapangan sedang menuju lokasi industri untuk mencatat angka meteran dan mengambil foto fisik lembar BPM.'
    },
    {
      id: 'verifikasi',
      stepNumber: '3',
      title: 'Verifikasi Reading & Validasi Dokumen Lapangan',
      icon: ShieldCheck,
      user: verifierUser,
      role: 'Admin Meter Reading (Otoritas Validasi)',
      time: verifierTime,
      isCompleted: isVerified,
      isActive: customer.status === 'Pending Verification',
      accentColor: 'emerald',
      badge: isVerified ? 'TERVERIFIKASI RESMI' : customer.status === 'Pending Verification' ? 'ANTREAN VERIFIKASI' : 'BELUM DIVERIFIKASI',
      details: isVerified
        ? `Hasil pembacaan fisik stand meter (${customer.skrg.toLocaleString()} m³) dan dokumen BPM telah divalidasi dan disetujui resmi oleh ${verifierUser}. Data siap untuk proses billing.`
        : isRead
        ? 'Data bacaan lapangan telah masuk ke server dan menunggu validasi administratif dari Tim Meter Reading.'
        : 'Menunggu pembacaan meter di lapangan selesai dilakukan.'
    },
    {
      id: 'billing',
      stepNumber: '4',
      title: 'Billing & Penerbitan Faktur Tagihan Air Resmi',
      icon: Receipt,
      user: billingUser,
      role: 'Admin Billing & Invoicing (Otoritas Faktur)',
      time: billingTime,
      isCompleted: isInvoiced,
      isActive: customer.status === 'Verified',
      accentColor: 'purple',
      badge: isInvoiced ? 'FAKTUR RESMI TERBIT' : customer.status === 'Verified' ? 'SIAP DITERBITKAN' : 'MENUNGGU VERIFIKASI',
      details: isInvoiced
        ? `Faktur resmi tagihan air PT Aetra Air Tangerang telah diterbitkan oleh ${billingUser}, dibubuhi nomor seri resmi, dan berkas tagihan terkirim ke email pelanggan (${customer.email}).`
        : isVerified
        ? 'Data telah diverifikasi penuh dan siap diproses cetak faktur / penerbitan invoice resmi oleh Tim Billing.'
        : 'Menunggu proses verifikasi meter reading selesai.'
    }
  ];

  return (
    <div className={`p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#003E78] to-[#0055A5] text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Alur Kerja &amp; Jejak Rekam Pengguna (Workflow Tracking)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian komprehensif setiap step, catatan waktu (tanggal &amp; jam WIB), serta penanggung jawab (pembaca meter &amp; admin).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
              customer.status === 'Invoiced'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                : customer.status === 'Verified'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : customer.status === 'Pending Verification'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            Status: {customer.status}
          </span>
        </div>
      </div>

      {/* Stepper Timeline with Connecting Line */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-emerald-500 before:to-purple-500">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative">
              {/* Node Indicator Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  step.isCompleted
                    ? 'bg-emerald-500 border-white dark:border-slate-900 text-white shadow-sm ring-2 ring-emerald-400/40'
                    : step.isActive
                    ? 'bg-[#E86216] border-white dark:border-slate-900 text-white shadow-sm animate-pulse ring-2 ring-orange-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                }`}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className="text-[10px] font-black">{step.stepNumber}</span>
                )}
              </div>

              {/* Step Card Content */}
              <div className={`p-3.5 rounded-2xl border transition-all text-xs ${
                step.isCompleted
                  ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80'
                  : step.isActive
                  ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/60 shadow-xs'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-75'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 dark:text-white text-xs sm:text-[13px] flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
                      <span>{step.title}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      step.isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : step.isActive
                        ? 'bg-orange-100 text-[#E86216] dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}>
                      {step.badge}
                    </span>
                  </div>
                  
                  {/* Catatan Waktu */}
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-300 font-mono font-bold flex items-center gap-1.5 bg-white dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{step.time}</span>
                  </span>
                </div>

                {/* User Attribution Row */}
                <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200 font-semibold mb-2 bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                  <div className="flex items-center gap-1 text-[#0055A5] dark:text-blue-300 font-extrabold">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Penanggung Jawab:</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800/80">
                    {step.user}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    · {step.role}
                  </span>
                </div>

                {/* Step Detailed Summary */}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {step.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
