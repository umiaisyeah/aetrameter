import React from 'react';
import { IndustryCustomer, UserProfile, WorkflowStatus } from '../types';
import { FileText, Download, AlertTriangle, CheckCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

interface OverviewViewProps {
  customers: IndustryCustomer[];
  selectedCycle: string;
  workflowFilter: string;
  onWorkflowFilterChange: (status: string) => void;
  onOpenDetail: (customer: IndustryCustomer) => void;
  onOpenPrintReport: () => void;
  onExportCSV: () => void;
  currentUser: UserProfile;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  customers,
  selectedCycle,
  workflowFilter,
  onWorkflowFilterChange,
  onOpenDetail,
  onOpenPrintReport,
  onExportCSV,
  currentUser
}) => {
  // Statistics calculation
  const totalTarget = customers.length;
  const completedReading = customers.filter(
    (c) => c.status === 'Verified' || c.status === 'Invoiced'
  ).length;
  const pendingReading = customers.filter(
    (c) => c.status === 'Pending Verification' || c.status === 'Belum Dibaca'
  ).length;
  const countPendingVerif = customers.filter((c) => c.status === 'Pending Verification').length;
  const countVerified = customers.filter((c) => c.status === 'Verified').length;
  const countInvoiced = customers.filter((c) => c.status === 'Invoiced').length;

  const readingPercentage = totalTarget > 0 ? Math.round((completedReading / totalTarget) * 100) : 0;

  // Filtered rows
  const filteredCustomers = customers.filter((c) => {
    if (workflowFilter === 'ALL') return true;
    return c.status === workflowFilter;
  });

  // Donut chart stroke math
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (readingPercentage / 100) * circumference;

  return (
    <div className="space-y-5">
      {/* Top 3-card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Cycle Reading Progress */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Monitoring Pembacaan Cycle
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  readingPercentage === 100
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {selectedCycle === 'ALL' ? 'SEMUA CYCLE' : selectedCycle}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 mb-3.5">
              Progres kelengkapan pembacaan meter pelanggan industri pada siklus terpilih.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Total Pelanggan Target:</span>
                <span className="font-bold text-slate-800 dark:text-white font-mono tabular-nums">
                  {totalTarget} Industri
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Sudah Selesai Dibaca:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {completedReading}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Belum Dibaca / Pending:</span>
                <span className="font-bold text-[#E86216] font-mono tabular-nums">{pendingReading}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-600 dark:text-slate-300 font-bold">Rasio Keterbacaan:</span>
                <span className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base font-mono tabular-nums">
                  {readingPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Donut Visualizer */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider mb-2">
            Visualisasi Keterbacaan Cycle
          </h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-slate-100 dark:text-slate-700"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Pending slice */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-[#E86216]"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={0}
                stroke="currentColor"
                fill="transparent"
              />
              {/* Completed slice */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white font-mono tabular-nums">
                {readingPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tercatat</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300">Selesai ({completedReading})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E86216]"></span>
              <span className="text-slate-600 dark:text-slate-300">Pending ({pendingReading})</span>
            </div>
          </div>
        </div>

        {/* Card 3: Role Quick Action & Workflow Cards */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2.5">
          <button
            onClick={() => onWorkflowFilterChange('Pending Verification')}
            className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
              workflowFilter === 'Pending Verification'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#E86216]'
            }`}
          >
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Perlu Verifikasi Reading
              </p>
              <p className="text-xl font-black text-[#E86216] font-mono tabular-nums mt-0.5">
                {countPendingVerif}
              </p>
              <span className="text-[9px] text-[#E86216] font-bold flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Otoritas Tim Meter Reading
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onWorkflowFilterChange('Verified')}
            className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
              workflowFilter === 'Verified'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#0055A5]'
            }`}
          >
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Ready for Billing
              </p>
              <p className="text-xl font-black text-[#0055A5] dark:text-blue-400 font-mono tabular-nums mt-0.5">
                {countVerified}
              </p>
              <span className="text-[9px] text-[#0055A5] dark:text-blue-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Otoritas Pak Yaya (Billing)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onWorkflowFilterChange('Invoiced')}
            className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
              workflowFilter === 'Invoiced'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Invoiced & Sent Email
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                {countInvoiced}
              </p>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Selesai Diproses
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-[#003E78] text-white rounded-xl p-3 px-4 text-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="bg-[#E86216] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0">
            Info Sistem
          </span>
          <p className="font-medium text-[11px] sm:text-xs">
            Sistem SIMBA-IN Aktif - Pembacaan meter terhubung otomatis dengan kalkulasi tarif Rp 12.500/m³, bea materai Rp 10.000 (&gt;1.000 m³), serta deteksi anomali volume.
          </p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/80 dark:bg-slate-800/80">
          <div>
            <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-sm">
              Tabel Monitoring Pembacaan Meter Industri
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Verifikasi visual foto fisik meter, dokumen BPM, & pemrosesan billing per cycle
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={workflowFilter}
              onChange={(e) => onWorkflowFilterChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none shadow-xs"
            >
              <option value="ALL">Semua Status Workflow</option>
              <option value="Belum Dibaca">Belum Dibaca</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Verified">Verified (Ready Billing)</option>
              <option value="Invoiced">Invoiced</option>
            </select>

            <button
              onClick={onOpenPrintReport}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 text-xs font-bold bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50 text-[#003E78] dark:text-slate-200 uppercase font-extrabold border-b border-slate-200 dark:border-slate-700 text-[10px] tracking-wider">
                <th className="p-3.5">Pelanggan Industri</th>
                <th className="p-3.5">Cycle</th>
                <th className="p-3.5 text-right">Stand Lalu (m³)</th>
                <th className="p-3.5 text-right">Stand Skrg (m³)</th>
                <th className="p-3.5 text-right">Volume (m³)</th>
                <th className="p-3.5 text-right">Bea Materai (Rp)</th>
                <th className="p-3.5 text-right">Total Tagihan (Rp)</th>
                <th className="p-3.5">Status Alur Kerja & Catatan</th>
                <th className="p-3.5 text-center">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada data industri yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item) => {
                  const vol = Math.max(0, item.skrg - item.lalu);
                  const estTagihan = vol * 12500;
                  const materai = vol > 1000 ? 10000 : 0;
                  const totalTagihan = estTagihan + materai;

                  let badgeColor =
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
                  if (item.status === 'Pending Verification') {
                    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                  } else if (item.status === 'Verified') {
                    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                  } else if (item.status === 'Invoiced') {
                    badgeColor =
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                  }

                  // Anomaly flag if spike > 50%
                  const prevVol =
                    item.history && item.history.length >= 2
                      ? item.history[item.history.length - 1] - item.history[item.history.length - 2]
                      : 0;
                  const isAnomaly = prevVol > 0 && vol > prevVol * 1.5;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-start gap-1.5">
                          {isAnomaly && (
                            <span title="Peringatan Lonjakan Pemakaian Air!">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {item.nama}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.id} · <span className="font-sans font-medium text-slate-500">{item.kelas}</span> · {item.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-[#0055A5] dark:text-blue-400">
                        {item.cycle}
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {item.lalu.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {item.skrg.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right font-black text-[#E86216] tabular-nums">
                        {vol.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-slate-600 dark:text-slate-300">
                        Rp {materai.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        Rp {totalTagihan.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${badgeColor}`}
                        >
                          {item.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs truncate">
                          {item.catatan || '-'}
                        </p>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onOpenDetail(item)}
                          className="px-3 py-1.5 bg-[#E6F0FA] dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 hover:bg-[#0055A5] hover:text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
                        >
                          🔍 Detail & Aksi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
