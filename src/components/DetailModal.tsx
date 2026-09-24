import React, { useState, useEffect } from 'react';
import { IndustryCustomer, UserProfile } from '../types';
import { X, AlertTriangle, Info, Mail, Printer, CheckCircle, Camera, FileCheck } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: IndustryCustomer | null;
  currentUser: UserProfile;
  onSaveReading: (updatedCustomer: IndustryCustomer) => void;
  onProcessInvoice: (customer: IndustryCustomer) => void;
  onOpenPrintInvoice: (customer: IndustryCustomer) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  currentUser,
  onSaveReading,
  onProcessInvoice,
  onOpenPrintInvoice
}) => {
  const [inputSkrg, setInputSkrg] = useState<number>(customer?.skrg ?? 0);
  const [catatan, setCatatan] = useState<string>(customer?.catatan || '');
  const [showOutlookBox, setShowOutlookBox] = useState<boolean>(false);
  const [outlookLink, setOutlookLink] = useState<string>('');

  useEffect(() => {
    if (customer) {
      setInputSkrg(customer.skrg);
      setCatatan(customer.catatan || '');
      setShowOutlookBox(customer.status === 'Invoiced');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Calculations
  const lalu = customer.lalu;
  const currentStand = Number(inputSkrg) || 0;
  const vol = Math.max(0, currentStand - lalu);
  const estTagihan = vol * 12500;
  const materai = vol > 1000 ? 10000 : 0;
  const totalTagihan = estTagihan + materai;

  // Anomaly calculation
  const historyData = customer.history || [Math.max(0, lalu - 500), lalu];
  const prevUsage =
    historyData.length >= 2
      ? historyData[historyData.length - 1] - historyData[historyData.length - 2]
      : Math.round(lalu * 0.08);
  const isAnomaly = prevUsage > 0 && vol > prevUsage * 1.5;

  const isBillingUser = currentUser.role === 'yaya';

  const handleSave = () => {
    if (isBillingUser) {
      // Billing user executes invoice process
      const updated: IndustryCustomer = {
        ...customer,
        skrg: currentStand,
        status: 'Invoiced',
        catatan: `Faktur tagihan diterbitkan oleh ${currentUser.name} (${new Date().toLocaleDateString('id-ID')})`
      };

      const mailto = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(
        `Tagihan Air Industri PT Aetra Air Tangerang - ${customer.id} (${customer.nama})`
      )}&body=${encodeURIComponent(
        `Kepada Yth. Bagian Keuangan / Finance\n${customer.nama}\nID Pelanggan: ${customer.id}\n\nBerikut kami sampaikan rincian tagihan pemakaian air bersih PT Aetra Air Tangerang periode ${customer.bulan}:\n\n- Stand Meter Lalu: ${lalu.toLocaleString()} m³\n- Stand Meter Sekarang: ${currentStand.toLocaleString()} m³\n- Total Pemakaian: ${vol.toLocaleString()} m³\n- Tarif Air Industri: Rp 12.500 / m³\n- Biaya Pemakaian Air: Rp ${estTagihan.toLocaleString()}\n- Bea Materai: Rp ${materai.toLocaleString()}\n- TOTAL TAGIHAN: Rp ${totalTagihan.toLocaleString()}\n\nFaktur resmi PDF dapat diunduh dan dicetak melalui lampiran invoice.\n\nAtas kerja sama yang baik, kami ucapkan terima kasih.\n\nSalam hormat,\nTim Billing & Invoicing\nPT Aetra Air Tangerang`
      )}`;

      setOutlookLink(mailto);
      setShowOutlookBox(true);
      onProcessInvoice(updated);

      // Trigger default mail client
      window.location.href = mailto;
    } else {
      // Meter reading user saves reading
      if (currentStand < lalu) {
        alert('Stand Meter saat ini tidak boleh lebih kecil dari Stand Bulan Lalu!');
        return;
      }

      const updatedHistory = [...historyData];
      if (updatedHistory[updatedHistory.length - 1] !== currentStand) {
        updatedHistory.push(currentStand);
      }

      const updated: IndustryCustomer = {
        ...customer,
        skrg: currentStand,
        status: 'Pending Verification',
        catatan: catatan.trim() || `Diverifikasi di lapangan oleh ${currentUser.name}`,
        history: updatedHistory
      };

      onSaveReading(updated);
      alert('Stand meter berhasil dibaca dan status workflow diatur ke Pending Verification!');
      onClose();
    }
  };

  // Sparkline calculation for SVG historical chart
  const maxHistoryVal = Math.max(...historyData, currentStand, 1);
  const minHistoryVal = Math.min(...historyData, currentStand);
  const chartHeight = 70;
  const chartWidth = 320;
  const points = historyData.map((val, idx) => {
    const x = (idx / (historyData.length - 1 || 1)) * (chartWidth - 20) + 10;
    const y = chartHeight - ((val - minHistoryVal) / (maxHistoryVal - minHistoryVal || 1)) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 my-auto">
        {/* Header */}
        <div className="bg-[#003E78] dark:bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-orange-400" />
              <span>Detail Pembacaan Meter, Dokumen BPM & Riwayat</span>
            </h3>
            <p className="text-[11px] text-blue-200">PT Aetra Air Tangerang - Unit Pelayanan Industri</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Customer info card */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Nama Akun / Perusahaan</p>
              <h4 className="text-base font-black text-[#0055A5] dark:text-blue-400">
                {customer.nama}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                ID Pelanggan:{' '}
                <span className="font-mono text-[#E86216] font-bold">{customer.id}</span> · Kelas:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{customer.kelas}</span> · Surel:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.email}</span>
              </p>
              {customer.lokasi && (
                <p className="text-[11px] text-slate-400 mt-0.5">Lokasi: {customer.lokasi}</p>
              )}
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300">
                {customer.cycle}
              </span>
            </div>
          </div>

          {/* Role limitation alert */}
          {isBillingUser && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
              <span>
                Anda masuk sebagai Tim Billing (Pak Yaya). Stand meter dikunci dan hanya dapat diedit oleh Tim Meter Reading di lapangan.
              </span>
            </div>
          )}

          {/* Anomaly warning */}
          {isAnomaly && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-xs">Peringatan Anomali Lonjakan Pemakaian!</p>
                <p className="text-[11px] font-normal">
                  Pemakaian air bulan ini ({vol.toLocaleString()} m³) naik drastis (&gt;50% dari bulan sebelumnya {prevUsage.toLocaleString()} m³). Harap cek ulang fisik meteran dan pipa di lapangan.
                </p>
              </div>
            </div>
          )}

          {/* Outlook success banner */}
          {showOutlookBox && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Invoice Berhasil Diproses!</span>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Email Outlook siap dikirim ke {customer.email}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {outlookLink && (
                  <a
                    href={outlookLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Kirim Ulang Email</span>
                  </a>
                )}
                <button
                  onClick={() => onOpenPrintInvoice(customer)}
                  className="px-3 py-1.5 bg-[#0055A5] hover:bg-[#003E78] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Faktur</span>
                </button>
              </div>
            </div>
          )}

          {/* Photo inspection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
                <span>Foto Fisik Meteran Air di Lokasi</span>
              </p>
              <div className="h-40 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-900 relative">
                <img
                  src={customer.fotoMeter}
                  alt={`Meteran ${customer.nama}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  SN: MTR-{customer.id.replace('IND-', '')}-2026
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#E86216]" />
                <span>Foto Dokumen BPM (Bukti Pembacaan Meter)</span>
              </p>
              <div className="h-40 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-900 relative">
                <img
                  src={customer.fotoBPM}
                  alt={`BPM ${customer.nama}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  BPM Validated & Stamped
                </span>
              </div>
            </div>
          </div>

          {/* Historical Usage Graph */}
          <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                📈 Tren Riwayat Pembacaan Meter (5 Periode Terakhir)
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                Satuan: m³ (Meter Kubik)
              </span>
            </div>
            <div className="w-full h-24 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
              <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <polyline
                  fill="none"
                  stroke="#0055A5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {historyData.map((val, idx) => {
                  const x = (idx / (historyData.length - 1 || 1)) * (chartWidth - 20) + 10;
                  const y =
                    chartHeight -
                    ((val - minHistoryVal) / (maxHistoryVal - minHistoryVal || 1)) *
                      (chartHeight - 20) -
                    10;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="4" fill="#E86216" />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        className="font-mono font-semibold"
                      >
                        {val.toLocaleString()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Calculations Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#E6F0FA] dark:bg-slate-700/70 p-4 rounded-2xl border border-blue-200 dark:border-slate-600">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Stand Lalu</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white font-mono tabular-nums">
                {lalu.toLocaleString()} m³
              </p>
            </div>

            <div>
              <label className="block text-[#0055A5] dark:text-blue-300 font-bold mb-0.5 text-[11px]">
                Stand Skrg (m³)
              </label>
              <input
                type="number"
                value={inputSkrg}
                readOnly={isBillingUser}
                onChange={(e) => setInputSkrg(Number(e.target.value))}
                className={`w-full p-1.5 border border-blue-300 dark:border-slate-500 rounded-xl text-sm font-bold font-mono text-[#0055A5] dark:text-white focus:ring-2 focus:ring-[#0055A5] ${
                  isBillingUser
                    ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed text-slate-500'
                    : 'bg-white dark:bg-slate-800'
                }`}
              />
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Volume Konsumsi</p>
              <p className="text-sm font-black text-[#E86216] font-mono tabular-nums">
                {vol.toLocaleString()} m³
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                Total Tagihan ({materai > 0 ? '+Materai' : 'No Materai'})
              </p>
              <p className="text-sm font-black text-[#0055A5] dark:text-blue-400 font-mono tabular-nums">
                Rp {totalTagihan.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Catatan Lapangan & Status Pemeriksaan
            </label>
            <input
              type="text"
              value={catatan}
              readOnly={isBillingUser}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan keterangan kondisi fisik meteran atau verifikasi..."
              className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs ${
                isBillingUser ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
            >
              Tutup
            </button>
            <button
              onClick={() => onOpenPrintInvoice(customer)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau Faktur</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`px-5 py-2 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 ${
              isBillingUser
                ? 'bg-[#0055A5] hover:bg-[#003E78]'
                : 'bg-[#E86216] hover:bg-orange-700'
            }`}
          >
            {isBillingUser ? (
              <>
                <Mail className="w-4 h-4" />
                <span>Proses Verifikasi & Kirim Invoice Email</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Perubahan Reading</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
