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
  AlertCircle
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

  const readerUser = customer.petugasBaca || 'Petugas Pembaca Meter Lapangan';
  const readerTime = customer.waktuBaca || 'Belum Dilakukan';

  const verifierUser =
    customer.verifiedBy ||
    (isVerified ? 'Akhmad Solihin (Tim Meter Reading)' : 'Menunggu Verifikasi Tim Meter Reading');
  const verifierTime =
    customer.verifiedAt ||
    (isVerified ? customer.waktuBaca || '30 Sep 2026' : 'Belum Diverifikasi');

  const billingUser =
    customer.invoicedBy ||
    (isInvoiced ? 'Yaya Sunarya (Tim Billing & Invoicing)' : 'Menunggu Penerbitan Tim Billing');
  const billingTime =
    customer.invoicedAt ||
    (isInvoiced ? customer.waktuBaca || '30 Sep 2026' : 'Belum Diterbitkan');

  const steps = [
    {
      id: 'pencatatan',
      title: '1. Pencatatan Stand Meter Lapangan',
      icon: Camera,
      user: readerUser,
      role: customer.kategoriPetugas || 'Pencatat Meter (PT Hideco)',
      time: readerTime,
      isCompleted: isRead,
      isActive: customer.status === 'Belum Dibaca',
      accentColor: 'blue',
      details: isRead
        ? `Stand Terbaca: ${customer.skrg.toLocaleString()} m³ (Volume: ${Math.max(0, customer.skrg - customer.lalu).toLocaleString()} m³)`
        : 'Menunggu petugas membaca fisik meter di lokasi industri'
    },
    {
      id: 'verifikasi',
      title: '2. Verifikasi & Validasi Stand Reading',
      icon: ShieldCheck,
      user: verifierUser,
      role: 'Tim Meter Reading Aetra',
      time: verifierTime,
      isCompleted: isVerified,
      isActive: customer.status === 'Pending Verification',
      accentColor: 'emerald',
      details: isVerified
        ? 'Foto fisik meter & lembar BPM telah diverifikasi dan disetujui untuk diterbitkan tagihan'
        : isRead
        ? 'Stand meter siap diperiksa dan divalidasi oleh Tim Meter Reading'
        : 'Menunggu pembacaan stand meter lapangan'
    },
    {
      id: 'billing',
      title: '3. Billing, e-Materai & Penerbitan Faktur',
      icon: Receipt,
      user: billingUser,
      role: 'Tim Billing & Invoicing Aetra',
      time: billingTime,
      isCompleted: isInvoiced,
      isActive: customer.status === 'Verified',
      accentColor: 'purple',
      details: isInvoiced
        ? `Faktur resmi diterbitkan & email tagihan terkirim ke ${customer.email}`
        : isVerified
        ? 'Data siap diproses cetak faktur dan dikirim ke pelanggan industri'
        : 'Menunggu proses verifikasi meter reading selesai'
    }
  ];

  return (
    <div className={`p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Pelacakan Riwayat Alur (Historical Tracking Alur Kerja)
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Riwayat lengkap setiap tahapan beserta penanggung jawab akun pengguna (user attribution)
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            customer.status === 'Invoiced'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              : customer.status === 'Verified'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : customer.status === 'Pending Verification'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {customer.status}
        </span>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative">
              {/* Node Indicator Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  step.isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                    : step.isActive
                    ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                }`}
              >
                {step.isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>

              {/* Step Card Content */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <span className="font-extrabold text-slate-800 dark:text-white text-xs">
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{step.time}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200 font-bold mb-1">
                  <User className="w-3.5 h-3.5 text-[#0055A5] dark:text-cyan-400 shrink-0" />
                  <span>Petugas / User: </span>
                  <span className="text-[#0055A5] dark:text-cyan-300 font-extrabold">{step.user}</span>
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                    {step.role}
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
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
