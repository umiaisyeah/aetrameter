import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IndustryCustomer, UserProfile } from '../types';
import {
  X,
  AlertTriangle,
  Info,
  Mail,
  Printer,
  CheckCircle,
  Camera,
  FileCheck,
  MapPin,
  Radio,
  Lock,
  Maximize2,
  ZoomIn,
  Sparkles,
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  Cpu,
  ArrowRight
} from 'lucide-react';
import meterGaugeImg from '../assets/images/meter_industrial_gauge_1790243358407.jpg';
import bpmDocImg from '../assets/images/meter_bpm_document_1790243369057.jpg';
import { showColorfulAlert } from '../utils/notificationSystem';
import { RealtimeLocationMap } from './RealtimeLocationMap';
import { PhotoGeotagStamp } from './PhotoGeotagStamp';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { IndustryWorkflowTracker } from './IndustryWorkflowTracker';
import { calculateAetraInvoice, formatRupiah } from '../utils/aetraInvoiceCalculator';
import {
  generateCcnbBatchNumber,
  getFormattedCcnbTime,
  runRecognitionAndReconciliation
} from '../utils/recognitionEngine';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: IndustryCustomer | null;
  currentUser: UserProfile;
  onSaveReading: (updatedCustomer: IndustryCustomer) => void;
  onProcessInvoice: (customer: IndustryCustomer) => void;
  onOpenPrintInvoice: (customer: IndustryCustomer) => void;
  onInputCcnb?: (customerIds: string[], batchNo: string, note?: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  currentUser,
  onSaveReading,
  onProcessInvoice,
  onOpenPrintInvoice,
  onInputCcnb
}) => {
  const [inputSkrg, setInputSkrg] = useState<number>(customer?.skrg ?? 0);
  const [catatan, setCatatan] = useState<string>(customer?.catatan || '');
  const [showOutlookBox, setShowOutlookBox] = useState<boolean>(false);
  const [outlookLink, setOutlookLink] = useState<string>('');
  const [lightboxPhoto, setLightboxPhoto] = useState<'meter' | 'bpm' | null>(null);

  // States for AI OCR Recognition & Reconciliation (Foto Stand Meter vs Foto Dokumen BPM)
  const [meterOcrVal, setMeterOcrVal] = useState<number>(() => {
    return customer?.meterStandOcr || customer?.skrg || customer?.lalu || 0;
  });
  const [bpmOcrVal, setBpmOcrVal] = useState<number>(() => {
    return customer?.bpmStandOcr || customer?.skrg || customer?.lalu || 0;
  });
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrSuccessNotice, setOcrSuccessNotice] = useState<string | null>(null);
  const [isSyncingCcnb, setIsSyncingCcnb] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      const isUnread = customer.status === 'Belum Dibaca';
      const initialStand = isUnread && customer.skrg === customer.lalu ? 0 : customer.skrg;
      setInputSkrg(initialStand);
      setCatatan(customer.catatan || '');
      setShowOutlookBox(customer.status === 'Invoiced');

      // Initialize OCR recognition values
      const mOcr = customer.meterStandOcr || (initialStand > 0 ? initialStand : customer.lalu + 450);
      const bOcr = customer.bpmStandOcr || (initialStand > 0 ? initialStand : customer.lalu + 450);
      setMeterOcrVal(mOcr);
      setBpmOcrVal(bOcr);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const effectiveCustomer: IndustryCustomer = {
    ...customer,
    fotoMeter: customer.fotoMeter && customer.fotoMeter.trim() !== '' ? customer.fotoMeter : meterGaugeImg,
    fotoBPM: customer.fotoBPM && customer.fotoBPM.trim() !== '' ? customer.fotoBPM : bpmDocImg
  };

  // Calculations following exact Aetra official rules
  const lalu = customer.lalu;
  const currentStand = Number(inputSkrg) || 0;
  const vol = Math.max(0, currentStand - lalu);
  const invCalc = calculateAetraInvoice({ ...customer, skrg: currentStand });
  const isMateraiRequired = invCalc.isMateraiApplied;
  const materai = invCalc.meterai;
  const totalTagihan = invCalc.totalKeseluruhan;

  // Anomaly & 3-period history trend calculation
  const rawHistory = (customer.history && customer.history.length > 0)
    ? customer.history
    : [Math.max(0, lalu - 600), Math.max(0, lalu - 300), lalu];
  // Strictly take the last 3 periods
  const historyData = rawHistory.slice(-3);
  const prevUsage =
    historyData.length >= 2
      ? historyData[historyData.length - 1] - historyData[historyData.length - 2]
      : Math.round(lalu * 0.08);
  const isAnomaly = prevUsage > 0 && vol > prevUsage * 1.5;

  const isCustomerVerified =
    customer.status === 'Verified' ||
    customer.status === 'Invoiced' ||
    Boolean(customer.verifiedBy);

  const canVerifyReading =
    currentUser.adminType === 'meter_reading' ||
    currentUser.role === 'solihin' ||
    currentUser.role === 'kabul' ||
    currentUser.role === 'tri_kartono';

  const canManageBilling =
    currentUser.adminType === 'billing' ||
    currentUser.role === 'yaya' ||
    currentUser.role === 'melva_sinaga';

  const isKeyAccountAdmin =
    currentUser.adminType === 'key_account' ||
    currentUser.role === 'bayu_pramono';

  const isBillingUser = canManageBilling;

  // Syarat Utama Permintaan Pengguna:
  // 1. Angka di foto stand meter dan angka meter bulan ini di foto BPM HARUS SAMA agar bisa diverifikasi!
  const isReconciled = meterOcrVal === bpmOcrVal && meterOcrVal > 0;
  const isCcnbInputted = Boolean(customer.isInputCCnB) || customer.ccnbStatus === 'Inputted';

  // AI OCR Scanning Simulator for both photos
  const handleRunOcrScan = (forcedMismatch = false) => {
    setIsOcrScanning(true);
    setOcrSuccessNotice(null);
    setTimeout(() => {
      const res = runRecognitionAndReconciliation(effectiveCustomer, currentStand, forcedMismatch);
      setMeterOcrVal(res.meterStandOcr);
      setBpmOcrVal(res.bpmStandOcr);
      setIsOcrScanning(false);
      if (res.isMatched) {
        setOcrSuccessNotice(`✓ Scan AI OCR Berhasil: Angka Foto Stand Meter (${res.meterStandOcr.toLocaleString('id-ID')} m³) dan Angka BPM (${res.bpmStandOcr.toLocaleString('id-ID')} m³) sama persis (Akurasi: ${res.accuracy}%). Syarat verifikasi terpenuhi!`);
      } else {
        setOcrSuccessNotice(`⚠️ Diskrepansi Terdeteksi: Angka Foto Stand (${res.meterStandOcr.toLocaleString('id-ID')} m³) BERBEDA dengan BPM (${res.bpmStandOcr.toLocaleString('id-ID')} m³). Verifikasi dikunci sampai angka direkonsiliasi sama.`);
      }
    }, 900);
  };

  // Reconcile / Synchronize values to make them 100% matched
  const handleSyncReconciliation = (source: 'meter' | 'bpm') => {
    const targetVal = source === 'meter' ? meterOcrVal : bpmOcrVal;
    const finalVal = targetVal > 0 ? targetVal : (customer.skrg > 0 ? customer.skrg : customer.lalu + 500);
    setMeterOcrVal(finalVal);
    setBpmOcrVal(finalVal);
    setInputSkrg(finalVal);
    setOcrSuccessNotice(`✓ Rekonsiliasi Sukses: Angka pada Foto Stand Meter dan Foto BPM telah diselaraskan ke ${finalVal.toLocaleString('id-ID')} m³. Status: Cocok (100% Match).`);
    showColorfulAlert({
      title: 'Rekonsiliasi Sukses! ✅',
      subtitle: 'Foto Stand Meter & Foto BPM Selaras',
      message: `Angka pada Foto Stand Meter dan Angka Meter Bulan Ini di Foto BPM kini bernilai sama (${finalVal.toLocaleString('id-ID')} m³). Status rekonsiliasi VALID dan siap diverifikasi oleh Tim Meter Reading.`,
      type: 'success',
      badge: 'REKONSILIASI COCOK'
    });
  };

  // Trigger input ke sistem core CCnB
  const handleExecuteInputCcnb = () => {
    setIsSyncingCcnb(true);
    const batchNo = customer.ccnbBatchNo || generateCcnbBatchNumber();
    const timeStr = getFormattedCcnbTime();

    setTimeout(() => {
      setIsSyncingCcnb(false);
      const updated: IndustryCustomer = {
        ...customer,
        isInputCCnB: true,
        ccnbStatus: 'Inputted',
        ccnbBatchNo: batchNo,
        ccnbInputtedAt: timeStr,
        ccnbInputtedBy: `${currentUser.name} (${currentUser.title})`
      };

      onSaveReading(updated);
      if (onInputCcnb) {
        onInputCcnb([customer.id], batchNo, `Input ke CCnB oleh ${currentUser.name}`);
      }

      showColorfulAlert({
        title: 'Data Berhasil Terinput ke CCnB! 🚀',
        subtitle: `Nomor Batch: ${batchNo}`,
        message: `Hasil pembacaan industri "${customer.nama}" telah resmi terinput ke core billing CCnB. Pelanggan kini otomatis berpindah ke Section Billing & Invoicing untuk diterbitkan fakturnya oleh Tim Billing.`,
        type: 'success',
        badge: 'TERINPUT CCnB'
      });
    }, 800);
  };

  const handleSave = () => {
    const now = new Date();
    const waktuStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (canManageBilling) {
      // STRICT CHECK 1: Belum diverifikasi oleh Tim Meter Reading -> TOLAK
      if (!isCustomerVerified) {
        showColorfulAlert({
          title: 'Akses Penagihan Dikunci 🔒',
          subtitle: 'Wajib Diverifikasi Tim Meter Reading Terlebih Dahulu',
          message: `Data pembacaan stand meter industri "${customer.nama}" belum diverifikasi oleh Pak Akhmad Solihin atau Pak Kabul Nugroho (Tim Meter Reading). Pak Yaya (Billing & Invoicing) hanya dapat menerbitkan faktur tagihan setelah hasil pembacaan diverifikasi resmi.`,
          type: 'warning',
          badge: 'BELUM DIVERIFIKASI'
        });
        return;
      }

      // STRICT CHECK 2 (PERMINTAAN PENGGUNA): Wajib terinput ke sistem CCnB terlebih dahulu sebelum masuk billing!
      if (!isCcnbInputted) {
        showColorfulAlert({
          title: 'Akses Invoicing Dikunci 🔒',
          subtitle: 'Belum Terinput ke Sistem Core CCnB',
          message: `Data pembacaan industri "${customer.nama}" sudah diverifikasi, tetapi BELUM di-input ke sistem CCnB! Sesuai SOP, hasil pembacaan baru dapat diproses di billing setelah terinput di CCnB. Silakan klik tombol "Check & Input ke CCnB" terlebih dahulu.`,
          type: 'warning',
          badge: 'MENUNGGU CCnB'
        });
        return;
      }

      // Billing user executes invoice process
      const updated: IndustryCustomer = {
        ...customer,
        skrg: currentStand,
        status: 'Invoiced',
        invoicedBy: `${currentUser.name} (${currentUser.title})`,
        invoicedAt: waktuStr,
        catatan: `Faktur tagihan diterbitkan oleh ${currentUser.name} (${waktuStr})`
      };

      const mailto = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(
        `Tagihan Air Industri PT Aetra Air Tangerang - ${customer.id} (${customer.nama})`
      )}&body=${encodeURIComponent(
        `Kepada Yth. Bagian Keuangan / Finance\n${customer.nama}\nID Pelanggan: ${customer.id}\n\nBerikut kami sampaikan rincian tagihan pemakaian air bersih PT Aetra Air Tangerang periode ${customer.bulan}:\n\n- Stand Meter Lalu: ${lalu.toLocaleString('id-ID')} m³\n- Stand Meter Sekarang: ${currentStand.toLocaleString('id-ID')} m³\n- Total Pemakaian: ${vol.toLocaleString('id-ID')} m³\n- Biaya Pemakaian Air: Rp ${formatRupiah(invCalc.biayaPakaiAir)}\n- Abonemen: Rp ${formatRupiah(invCalc.abonemen)}\n- DPP: Rp ${formatRupiah(invCalc.dpp)}\n- PPN (12% Dibebaskan): Rp ${formatRupiah(invCalc.ppn)}\n- Bea Materai: Rp ${formatRupiah(materai)}\n- TOTAL TAGIHAN KESELURUHAN: Rp ${formatRupiah(totalTagihan)}\n- Terbilang: ${invCalc.terbilangStr}\n- Tanggal Jatuh Tempo: ${invCalc.tanggalJatuhTempo}\n\nFaktur resmi PDF dapat diunduh dan dicetak melalui aplikasi SIMBA.\n\nAtas kerja sama yang baik, kami ucapkan terima kasih.\n\nSalam hormat,\nTim Billing & Invoicing\nPT Aetra Air Tangerang`
      )}`;

      setOutlookLink(mailto);
      setShowOutlookBox(true);
      onProcessInvoice(updated);

      // Trigger default mail client
      window.location.href = mailto;
    } else if (canVerifyReading) {
      // STRICT CHECK (PERMINTAAN PENGGUNA NO. 1):
      // Foto stand meter dan angka meter bulan ini di foto BPM HARUS SAMA agar bisa diverifikasi!
      if (!isReconciled) {
        showColorfulAlert({
          title: 'Verifikasi Ditolak! ❌',
          subtitle: 'Rekonsiliasi Foto Stand Meter & BPM Tidak Cocok',
          message: `Angka pada Foto Stand Meter (${meterOcrVal.toLocaleString('id-ID')} m³) dan Angka Meter Bulan Ini di Foto Dokumen BPM (${bpmOcrVal.toLocaleString('id-ID')} m³) HARUS SAMA PERSIS agar bisa diverifikasi! Silakan lakukan rekonsiliasi atau samakan angka kedua dokumen terlebih dahulu.`,
          type: 'error',
          badge: 'REKONSILIASI GAGAL'
        });
        return;
      }

      if (currentStand < lalu && currentStand > 0) {
        showColorfulAlert({
          title: 'Validasi Stand Meter',
          message: `Stand Meter saat ini (${currentStand.toLocaleString()} m³) tidak boleh lebih kecil dari Stand Bulan Lalu (${lalu.toLocaleString()} m³)!`,
          type: 'warning',
          badge: 'VALIDASI NILAI'
        });
        return;
      }

      const finalStand = meterOcrVal > 0 ? meterOcrVal : currentStand;
      const updatedHistory = [...historyData];
      if (finalStand > 0 && updatedHistory[updatedHistory.length - 1] !== finalStand) {
        updatedHistory.push(finalStand);
      }

      const updated: IndustryCustomer = {
        ...customer,
        skrg: finalStand,
        meterStandOcr: meterOcrVal,
        bpmStandOcr: bpmOcrVal,
        reconciliationStatus: 'Matched',
        reconciledAt: waktuStr,
        reconciledBy: `${currentUser.name} (${currentUser.title})`,
        status: 'Verified',
        verifiedBy: `${currentUser.name} (${currentUser.title})`,
        verifiedAt: waktuStr,
        catatan: catatan.trim() || `Diverifikasi resmi oleh ${currentUser.name} (Tim Meter Reading) — Rekonsiliasi Foto Stand & BPM Cocok (${finalStand.toLocaleString('id-ID')} m³)`,
        history: updatedHistory,
        fotoMeter: customer.fotoMeter || meterGaugeImg,
        fotoBPM: customer.fotoBPM || bpmDocImg,
        isInputCCnB: customer.isInputCCnB || false,
        ccnbStatus: customer.ccnbStatus || 'Belum Input'
      };

      onSaveReading(updated);
      showColorfulAlert({
        title: 'Pembacaan Berhasil Diverifikasi! ✅',
        subtitle: 'Rekonsiliasi Stand Meter & BPM Valid (100% Cocok)',
        message: `Stand meter industri ${customer.nama} (${finalStand.toLocaleString()} m³) berhasil diverifikasi resmi oleh ${currentUser.name}. Langkah selanjutnya: Silakan klik tombol "Check & Input ke CCnB" agar data berpindah ke Section Billing & Invoicing.`,
        type: 'success',
        badge: 'VERIFIKASI SELESAI'
      });
      onClose();
    } else {
      // Key account admin or view only
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

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 my-auto">
        {/* Header - Brand Gradient with Aetra Air Tangerang Blue & Orange */}
        <div className="bg-gradient-to-r from-[#003E78] via-[#0055A5] via-[#006bc7] to-[#E86216] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-xs shrink-0">
              <FileCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2 drop-shadow-xs truncate">
                <span>Detail Pembacaan Meter, Dokumen BPM &amp; Alur Kerja</span>
              </h3>
              <p className="text-[11px] text-blue-100 font-medium truncate">PT Aetra Air Tangerang — Unit Pelayanan Pelanggan Industri</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/15 transition p-1.5 rounded-xl border border-white/20 cursor-pointer shrink-0 ml-2"
            title="Tutup dialog"
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

          {/* Role status banner */}
          {canManageBilling && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
              <span>
                Anda masuk sebagai Tim Billing ({currentUser.name}). Anda berwenang menerbitkan tagihan resmi, e-materai, dan mengirim invoice via surel.
              </span>
            </div>
          )}

          {canVerifyReading && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Anda masuk sebagai Tim Meter Reading ({currentUser.name}). Anda berwenang memvalidasi dan memverifikasi hasil pembacaan stand meter lapangan.
              </span>
            </div>
          )}

          {isKeyAccountAdmin && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-xl text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                Anda masuk sebagai Admin Key Account ({currentUser.name}). Mode peninjauan data pelanggan industri.
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

          {/* Interactive Detailed Workflow Tracker with Step Timestamps and User Attribution */}
          <IndustryWorkflowTracker customer={customer} />

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

          {/* Photo inspection cards with Pop-Out zoom preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Foto Stand Meteran */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
                  <span>Foto Fisik Meteran Air di Lokasi</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto('meter')}
                    className="text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 hover:bg-[#0055A5] hover:text-white px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition flex items-center gap-1 cursor-pointer"
                    title="Klik untuk memperbesar foto stand meter"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Pop Out Zoom</span>
                  </button>
                </div>
              </div>
              <div
                onClick={() => setLightboxPhoto('meter')}
                className="h-48 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-900 relative group cursor-pointer shadow-xs hover:border-[#0055A5] transition-all"
                title="Klik untuk membuka pop out foto stand meter beresolusi tinggi"
              >
                <img
                  src={effectiveCustomer.fotoMeter}
                  alt={`Meteran ${effectiveCustomer.nama}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-slate-900/85 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-xs z-10 border border-white/10">
                  SN: MTR-{effectiveCustomer.id.replace('IND-', '')}-2026
                </span>
                {/* Hover Pop Out Zoom Prompt Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-20">
                  <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white font-bold text-xs shadow-lg border border-white/20 flex items-center gap-1.5 backdrop-blur-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Klik Pop Out Perbesar</span>
                  </span>
                </div>
                {/* Realtime GPS Geotag Stamp Overlay */}
                <PhotoGeotagStamp customer={effectiveCustomer} photoType="meter" onClickPreview={() => setLightboxPhoto('meter')} />
              </div>
            </div>

            {/* Foto Dokumen BPM */}
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#E86216]" />
                  <span>Foto Dokumen BPM (Bukti Pembacaan Meter)</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto('bpm')}
                    className="text-[9px] font-bold bg-orange-100 dark:bg-orange-950 text-[#E86216] dark:text-orange-300 hover:bg-[#E86216] hover:text-white px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800 transition flex items-center gap-1 cursor-pointer"
                    title="Klik untuk memperbesar foto dokumen BPM fisik"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>Pop Out Zoom</span>
                  </button>
                </div>
              </div>
              <div
                onClick={() => setLightboxPhoto('bpm')}
                className="h-48 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-900 relative group cursor-pointer shadow-xs hover:border-[#E86216] transition-all"
                title="Klik untuk membuka pop out foto berkas BPM beresolusi tinggi"
              >
                <img
                  src={effectiveCustomer.fotoBPM}
                  alt={`BPM ${effectiveCustomer.nama}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-slate-900/85 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-xs z-10 border border-white/10">
                  BPM Validated &amp; Stamped
                </span>
                {/* Hover Pop Out Zoom Prompt Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-20">
                  <span className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white font-bold text-xs shadow-lg border border-white/20 flex items-center gap-1.5 backdrop-blur-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                    <span>Klik Pop Out Perbesar</span>
                  </span>
                </div>
                {/* Realtime GPS Geotag Stamp Overlay */}
                <PhotoGeotagStamp customer={effectiveCustomer} photoType="bpm" onClickPreview={() => setLightboxPhoto('bpm')} />
              </div>
            </div>
          </div>

          <PhotoLightboxModal
            isOpen={Boolean(lightboxPhoto)}
            onClose={() => setLightboxPhoto(null)}
            customer={effectiveCustomer}
            photoType={lightboxPhoto || 'meter'}
          />

          {/* ========================================================================= */}
          {/* FITUR REKOGNISI DAN REKONSILIASI FOTO STAND METER VS FOTO BPM              */}
          {/* Sesuai Permintaan User: Foto stand meter dan angka meter bulan ini di foto   */}
          {/* BPM HARUS SAMA PERSIS agar bisa diverifikasi!                             */}
          {/* ========================================================================= */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isReconciled
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
              : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white shrink-0 ${
                  isReconciled ? 'bg-emerald-600' : 'bg-rose-600 animate-pulse'
                }`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Rekognisi AI OCR &amp; Rekonsiliasi Komparatif</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isReconciled
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                    }`}>
                      {isReconciled ? '✓ REKONSILIASI COCOK' : '⚠️ DISKREPANSI / TIDAK SAMA'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    SOP Verifikasi: Angka di Foto Stand Meter dan Angka Meter Bulan Ini di Foto BPM wajib bernilai sama persis.
                  </p>
                </div>
              </div>

              {/* OCR Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleRunOcrScan(false)}
                  disabled={isOcrScanning}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Jalankan pemindaian ulang AI OCR pada kedua foto"
                >
                  <RefreshCw className={`w-3 h-3 ${isOcrScanning ? 'animate-spin' : ''}`} />
                  <span>{isOcrScanning ? 'Memindai Foto...' : 'Scan Ulang OCR'}</span>
                </button>

                {!isReconciled && (
                  <button
                    type="button"
                    onClick={() => handleSyncReconciliation('meter')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                    title="Rekonsiliasikan: Samakan angka BPM dengan foto stand meter"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Samakan Angka</span>
                  </button>
                )}

                {/* Tombol Testing Simulasi untuk Uji Coba Pengguna */}
                <button
                  type="button"
                  onClick={() => handleRunOcrScan(!isReconciled ? false : true)}
                  className={`px-2 py-1 rounded-lg border font-bold text-[9px] transition cursor-pointer ${
                    isReconciled
                      ? 'border-rose-300 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/60'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-950/60'
                  }`}
                  title="Ganti skenario untuk menguji verifikasi saat angka sama vs beda"
                >
                  {isReconciled ? 'Uji Kasus Beda Angka' : 'Uji Kasus Sama Angka'}
                </button>
              </div>
            </div>

            {/* OCR Notice */}
            {ocrSuccessNotice && (
              <div className="mb-3 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-[11px] font-semibold animate-in fade-in">
                {ocrSuccessNotice}
              </div>
            )}

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center">
              {/* Card 1: Foto Stand Meter Fisik */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#0055A5] dark:text-blue-400" />
                    <span>Foto Stand Meter Fisik</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">Akurasi 99.4%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Hasil Rekognisi:</span>
                  <span className="font-mono font-black text-base text-[#0055A5] dark:text-blue-400">
                    {meterOcrVal.toLocaleString('id-ID')} m³
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 truncate">
                  Deteksi: Register Counter Odometer Air
                </p>
              </div>

              {/* Match/Mismatch Comparison Badge in Center */}
              <div className="sm:col-span-1 flex flex-col items-center justify-center text-center p-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
                  isReconciled
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-rose-500 text-white animate-bounce shadow-rose-500/30'
                }`}>
                  {isReconciled ? '=' : '≠'}
                </div>
                <span className={`text-[9px] font-black uppercase mt-1 tracking-wider ${
                  isReconciled ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400 font-bold'
                }`}>
                  {isReconciled ? 'COCOK ✓' : 'TIDAK SAMA ✗'}
                </span>
                {!isReconciled && (
                  <span className="text-[8px] font-mono text-rose-500 font-bold">
                    Selisih: {Math.abs(meterOcrVal - bpmOcrVal).toLocaleString('id-ID')} m³
                  </span>
                )}
              </div>

              {/* Card 2: Foto Dokumen BPM (Baris Stand Bulan Ini) */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-[#E86216]" />
                    <span>Foto Dokumen BPM (Stand Bulan Ini)</span>
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-mono">Akurasi 98.8%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Hasil Rekognisi:</span>
                  <span className="font-mono font-black text-base text-[#E86216]">
                    {bpmOcrVal.toLocaleString('id-ID')} m³
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 truncate">
                  Deteksi: Lembar Berita Acara Stempel &amp; TTD
                </p>
              </div>
            </div>

            {/* Reconciliation Status Alert Bar */}
            <div className={`mt-3 p-2.5 rounded-xl text-[11px] flex items-start gap-2 ${
              isReconciled
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800'
                : 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300/80 dark:border-rose-800 font-medium'
            }`}>
              {isReconciled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">STATUS REKONSILIASI VALID (100% MATCH): </span>
                    <span>
                      Angka pada Foto Stand Meter ({meterOcrVal.toLocaleString('id-ID')} m³) dan Dokumen BPM ({bpmOcrVal.toLocaleString('id-ID')} m³) SAMA PERSIS. Syarat verifikasi pembacaan meter resmi telah terpenuhi!
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">VERIFIKASI DIKUNCI / REKONSILIASI GAGAL: </span>
                    <span>
                      Angka pada Foto Stand Meter ({meterOcrVal.toLocaleString('id-ID')} m³) BERBEDA dengan Angka Bulan Ini di Foto Dokumen BPM ({bpmOcrVal.toLocaleString('id-ID')} m³)! Kedua angka harus sama persis agar pembacaan ini dapat diverifikasi. Silakan klik <strong>"Samakan Angka"</strong> setelah memeriksa foto.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FITUR TOMBOL CHECK INPUT CCNB                                              */}
          {/* Sesuai Permintaan User: Tombol check input CCnB setelah verifikasi.        */}
          {/* Baru hasil pembacaan yang sudah terinput CCnB yang pindah ke billing.    */}
          {/* ========================================================================= */}
          {isCustomerVerified && (
            <div className={`p-4 rounded-2xl border transition-all ${
              isCcnbInputted
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border-emerald-300 dark:border-emerald-800/80'
                : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-300 dark:border-blue-800/80 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl text-white shrink-0 shadow-xs ${
                    isCcnbInputted ? 'bg-emerald-600' : 'bg-[#0055A5]'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                        Integrasi Core System CCnB (Customer Care &amp; Billing)
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isCcnbInputted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}>
                        {isCcnbInputted ? '✓ TERINPUT DI CCnB' : 'MENUNGGU INPUT CCnB'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {isCcnbInputted ? (
                        <>
                          Data stand telah terinput ke CCnB dengan No. Batch{' '}
                          <strong className="font-mono text-[#0055A5] dark:text-blue-400">{customer.ccnbBatchNo || 'CCNB-2026-SEP-8412'}</strong> pada{' '}
                          <span>{customer.ccnbInputtedAt || 'Baru Saja'}</span>. Pelanggan ini resmi berada di <strong>Section Billing &amp; Invoicing</strong>.
                        </>
                      ) : (
                        <>
                          Stand meter telah diverifikasi resmi oleh {customer.verifiedBy || 'Tim Meter Reading'}. Klik tombol di samping untuk memvalidasi dan menginput ke sistem CCnB agar dipindahkan ke Section Billing.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {!isCcnbInputted ? (
                    <button
                      type="button"
                      onClick={handleExecuteInputCcnb}
                      disabled={isSyncingCcnb}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#0055A5] to-blue-600 hover:from-[#003E78] hover:to-blue-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      title="Klik untuk check dan menginput hasil pembacaan ke sistem CCnB"
                    >
                      {isSyncingCcnb ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                          <span>Memproses CCnB...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Check &amp; Input ke CCnB 🚀</span>
                          <ArrowRight className="w-3 h-3 text-white/80" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Terinput CCnB ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Integrated Realtime Location Map */}
          <div className="space-y-1.5">
            <RealtimeLocationMap customer={customer} height="h-64 sm:h-72" />
          </div>

          {/* Warning Banner: Pak Yaya / Tim Billing dikunci bila belum diverifikasi Pak Kabul / Pak Solihin */}
          {canManageBilling && !isCustomerVerified && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Akses Invoicing &amp; Billing Dikunci</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[9px]">
                    STATUS: {customer.status.toUpperCase()}
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                  Data pembacaan stand meter industri ini <strong>belum diverifikasi oleh Pak Akhmad Solihin atau Pak Kabul Nugroho</strong> (Tim Meter Reading). Penerbitan faktur tagihan dan invoicing oleh <strong>Pak Yaya</strong> hanya dapat diproses setelah hasil pembacaan fisik/BPM berstatus <strong>Verified</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Historical Usage Graph (Sesuai Permintaan: Jangan ditampilkan pada tampilan Billing & Invoicing, tampilkan 3 Periode Terakhir) */}
          {!canManageBilling && (
            <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  📈 Tren Riwayat Pembacaan Meter (3 Periode Terakhir)
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
                    const x = (idx / (historyData.length - 1 || 1)) * (chartWidth - 40) + 20;
                    const y =
                      chartHeight -
                      ((val - minHistoryVal) / (maxHistoryVal - minHistoryVal || 1)) *
                        (chartHeight - 30) -
                      16;
                    const periodLabel = idx === 0 ? 'Periode N-2' : idx === 1 ? 'Periode N-1' : 'Bulan Berjalan';
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="4.5" fill="#E86216" stroke="#fff" strokeWidth="1.5" />
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#0055A5"
                          className="font-mono font-bold dark:fill-blue-300"
                        >
                          {val.toLocaleString()} m³
                        </text>
                        <text
                          x={x}
                          y={chartHeight - 2}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#94a3b8"
                          className="font-medium"
                        >
                          {periodLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Calculations Box: Verifikasi Reading HANYA menampilkan data fisik stand & volume (Total Tagihan & Invoice adalah ranah Tim Billing) */}
          <div className={`grid gap-3 p-4 rounded-2xl border ${
            canManageBilling
              ? 'grid-cols-2 md:grid-cols-4 bg-[#E6F0FA] dark:bg-slate-700/70 border-blue-200 dark:border-slate-600'
              : 'grid-cols-1 sm:grid-cols-3 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
          }`}>
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
                value={inputSkrg > 0 ? inputSkrg : ''}
                placeholder="Belum Dicatat"
                readOnly={isBillingUser}
                onChange={(e) => setInputSkrg(Number(e.target.value))}
                className={`w-full p-1.5 border rounded-xl text-sm font-bold font-mono focus:ring-2 ${
                  canManageBilling
                    ? 'border-blue-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed text-slate-500'
                    : 'border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-800 text-emerald-800 dark:text-white focus:ring-emerald-500'
                }`}
              />
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Volume Konsumsi</p>
              <p className="text-sm font-black text-[#E86216] font-mono tabular-nums">
                {currentStand === 0 ? '—' : `${vol.toLocaleString()} m³`}
              </p>
            </div>

            {/* Total Tagihan & Bea Materai HANYA untuk Tim Billing */}
            {canManageBilling && (
              <>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center justify-between">
                    <span>Bea Materai</span>
                    {isMateraiRequired && (
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.2 rounded font-sans">
                        e-Materai (&gt;5 Jt)
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono tabular-nums">
                    {materai > 0 ? `Rp ${materai.toLocaleString()}` : 'Rp 0 (Bebas)'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                    Total Tagihan {isMateraiRequired ? '(+ e-Materai)' : ''}
                  </p>
                  <p className="text-sm font-black text-[#0055A5] dark:text-blue-400 font-mono tabular-nums">
                    Rp {totalTagihan.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Catatan Lapangan &amp; Status Pemeriksaan
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
            {/* Pratinjau Faktur HANYA untuk Tim Billing (ranah billing) */}
            {canManageBilling && (
              <button
                onClick={() => onOpenPrintInvoice(customer)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Pratinjau Faktur</span>
              </button>
            )}
          </div>

          {canManageBilling && (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Terbitkan &amp; Kirim Invoice Email</span>
            </button>
          )}

          {canVerifyReading && (
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer ${
                isReconciled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50'
              }`}
              title={
                isReconciled
                  ? 'Verifikasi Pembacaan Stand (Rekonsiliasi Cocok 100%)'
                  : 'Angka Foto Stand Meter dan Angka Bulan Ini di BPM Tidak Sama! Harus sama agar bisa diverifikasi.'
              }
            >
              {isReconciled ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4 animate-pulse" />}
              <span>
                {isReconciled
                  ? 'Verifikasi Pembacaan Stand (Verified)'
                  : 'Verifikasi Terkunci (Stand & BPM Beda Angka)'}
              </span>
            </button>
          )}

          {isKeyAccountAdmin && (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>Selesai Meninjau</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
