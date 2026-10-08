import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IndustryCustomer } from '../types';
import {
  KabupatenTangerangLogo,
  AetraOfficialLogo,
  TuvNordLogo,
  KanLogo,
  HalalIndonesiaLogo,
  Barcode128Svg
} from './AetraInvoiceBrandLogos';
import {
  calculateAetraInvoice,
  formatRupiah,
  InvoiceCalculationResult
} from '../utils/aetraInvoiceCalculator';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Stamp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { showToast } from '../utils/notificationSystem';

interface AetraOfficialPdfInvoiceProps {
  customer: IndustryCustomer;
  onClose: () => void;
}

export const AetraOfficialPdfInvoice: React.FC<AetraOfficialPdfInvoiceProps> = ({
  customer,
  onClose
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [eMeteraiMode, setEMeteraiMode] = useState<'placeholder' | 'peruri_digital'>('placeholder');

  const inv: InvoiceCalculationResult = calculateAetraInvoice(customer);

  // Direct Browser High-Quality Print
  const handlePrint = () => {
    window.print();
  };

  // Generate and Download PDF using jsPDF + html2canvas
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    showToast({
      title: 'Membuat Dokumen PDF...',
      message: 'Sedang merender halaman 1 dan 2 faktur resmi Aetra.',
      type: 'info'
    });

    try {
      const page1Element = document.getElementById('aetra-invoice-page-1');
      const page2Element = document.getElementById('aetra-invoice-page-2');

      if (!page1Element) {
        throw new Error('Elemen faktur tidak ditemukan');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Render Page 1
      const canvas1 = await html2canvas(page1Element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Render Page 2 if exists
      if (page2Element) {
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const fileName = `Faktur_Tagihan_Aetra_${customer.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${inv.bulanTagihan.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      showToast({
        title: 'PDF Berhasil Diunduh! 📄',
        message: `File ${fileName} siap digunakan atau dicetak.`,
        type: 'success'
      });
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast({
        title: 'Gagal Membuat PDF',
        message: 'Silakan gunakan tombol "Cetak Faktur" untuk menyimpan via browser.',
        type: 'warning'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ESC key listener to easily close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible print:block"
    >
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] my-auto relative z-10 print:max-h-none print:m-0 print:border-none print:shadow-none print:w-full print:rounded-none print:bg-white print:block">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-r from-[#0055A5] to-[#E86216] rounded-xl text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Faktur Resmi Tagihan Air PT Aetra Air Tangerang
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Template Resmi 2 Halaman
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {customer.nama} · {customer.id} · {customer.cycle} · Stand: {inv.standAwal.toLocaleString()} → {inv.standAkhir.toLocaleString()} m³ ({inv.totalPakai.toLocaleString()} m³)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* E-Meterai Toggle Adapter */}
            {inv.isMateraiApplied && (
              <button
                type="button"
                onClick={() => setEMeteraiMode(eMeteraiMode === 'placeholder' ? 'peruri_digital' : 'placeholder')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  eMeteraiMode === 'peruri_digital'
                    ? 'bg-purple-900/60 text-purple-200 border-purple-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Alihkan opsi e-Meterai Peruri Digital / Meterai Tempel Manual"
              >
                <Stamp className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">e-Meterai:</span>
                <span>{eMeteraiMode === 'peruri_digital' ? 'Peruri QR' : 'Manual'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'Memproses PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Faktur</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 flex flex-col items-center gap-6 print:p-0 print:bg-white print:gap-0 print:overflow-visible print:block">
          
          {/* ========================================================================= */}
          {/* PAGE 1: OFFICIAL INVOICE & TAX INVOICE (HALAMAN 1)                         */}
          {/* ========================================================================= */}
          <div
            id="aetra-invoice-page-1"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl flex flex-col justify-between font-sans relative print:shadow-none print:rounded-none print:p-6 print:m-0 print:w-full print:min-h-[297mm] print:page-break-after-always"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="space-y-0">
              {/* TOP HEADER SECTION (BORDERED BOX) */}
              <div className="border-2 border-[#0055A5] flex flex-row bg-white">
                {/* Left Part: Pemda Kab Tangerang Logo + Aetra Address + Aetra Logo */}
                <div className="flex-1 p-2.5 sm:p-3 flex items-center justify-between border-r-2 border-[#0055A5] gap-3">
                  {/* Logo Pemda Kabupaten Tangerang */}
                  <div className="shrink-0 flex items-center justify-center pl-1">
                    <KabupatenTangerangLogo size={52} />
                  </div>

                  {/* Company Info (Centered) */}
                  <div className="text-center flex-1 px-2">
                    <h1 className="text-sm sm:text-base font-black text-[#0055A5] uppercase tracking-tight">
                      PT Aetra Air Tangerang
                    </h1>
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-700 leading-tight mt-0.5 font-medium">
                      Jln. Raya STPI Curug No. 27, Kabupaten Tangerang 15810
                    </p>
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-700 leading-tight font-medium">
                      Telp. 021 598 5474, Fax. 021 598 5479
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-[#0055A5] font-black leading-tight mt-0.5">
                      www.aat.co.id
                    </p>
                  </div>

                  {/* Logo Aetra Tangerang */}
                  <div className="shrink-0 flex items-center justify-center pr-1">
                    <AetraOfficialLogo height={44} />
                  </div>
                </div>

                {/* Right Part: Informasi Tagihan Air */}
                <div className="w-64 sm:w-72 shrink-0 flex flex-col bg-white">
                  <div className="bg-[#DCEBF8] text-[#0055A5] font-black text-[11px] sm:text-xs text-center py-1.5 border-b border-[#0055A5] tracking-wide">
                    Informasi Tagihan Air
                  </div>
                  <div className="grid grid-cols-3 text-center bg-[#0055A5] text-white font-bold text-[7.5px] sm:text-[8px] leading-tight">
                    <div className="py-1 px-0.5 border-r border-white/30">BULAN TAGIHAN</div>
                    <div className="py-1 px-0.5 border-r border-white/30">NO. TAGIHAN</div>
                    <div className="py-1 px-0.5">TANGGAL JATUH TEMPO</div>
                  </div>
                  <div className="grid grid-cols-3 text-center bg-white text-slate-900 font-bold text-[8.5px] sm:text-[9.5px] flex-1 items-center border-t border-[#0055A5]">
                    <div className="py-2 px-0.5 border-r border-slate-300 font-black text-[#0055A5]">{inv.bulanTagihan}</div>
                    <div className="py-2 px-0.5 border-r border-slate-300 font-mono">{inv.noTagihan}</div>
                    <div className="py-2 px-0.5 text-rose-700 font-black">{inv.tanggalJatuhTempo}</div>
                  </div>
                </div>
              </div>

              {/* SECOND SECTION: CUSTOMER & BILLING METADATA (LIGHT BLUE CONTAINER) */}
              <div className="border-x-2 border-b-2 border-[#0055A5] bg-[#EBF3FA] flex flex-row text-[9px] leading-tight">
                {/* Left Column: Customer Details */}
                <div className="w-1/2 p-3 sm:p-3.5 flex flex-col justify-center space-y-1">
                  <h2 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
                    {customer.nama}
                  </h2>
                  <p className="text-[9px] text-slate-700 uppercase font-medium">
                    {customer.lokasi || 'KP. COGREG RT.01/03 PASIR BOLANG - TIGARAKSA TANGERANG'}
                  </p>
                  <div className="pt-1 text-[8.5px] space-y-0.5 text-slate-600 font-medium">
                    <div>
                      <span>NPWP : </span>
                      <span className="font-mono font-bold text-slate-800">{inv.npwpPelanggan}</span>
                    </div>
                    <div>
                      <span>SIKLUS / RUTE : </span>
                      <span className="font-bold text-[#0055A5]">{inv.siklusRuteBaca}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Connection & Billing Parameters */}
                <div className="w-1/2 p-3 sm:p-3.5 border-l-2 border-[#0055A5] space-y-1">
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-semibold">NOMOR PELANGGAN</span>
                    <span className="font-mono font-black text-[#0055A5]">: {inv.nomorPelanggan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-semibold">GOLONGAN TARIF</span>
                    <span className="font-bold text-slate-800">: {inv.golonganTarif}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-semibold">KELOMPOK PELANGGAN</span>
                    <span className="font-bold text-slate-800">: {inv.kelompokPelanggan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-semibold">UKURAN METER</span>
                    <span className="font-bold text-slate-800">: {inv.ukuranMeter}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-semibold">LOKASI SAMBUNGAN</span>
                    <span className="text-slate-800 uppercase">: {inv.lokasiSambungan}</span>
                  </div>
                  <div className="flex pt-1.5 mt-1 border-t border-blue-200/80 justify-between text-[8px] sm:text-[8.5px] font-mono">
                    <div>
                      <span className="text-slate-600">TANGGAL CETAK : </span>
                      <span className="font-bold text-slate-900">{inv.tanggalCetak}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">TANGGAL BILL : </span>
                      <span className="font-bold text-slate-900">{inv.tanggalBill}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* THIRD SECTION: PERINCIAN TAGIHAN */}
              <div className="mt-2.5 border-2 border-[#0055A5] overflow-hidden">
                <div className="bg-[#0055A5] text-white py-1 px-3 text-center font-black text-[10px] sm:text-[11px] uppercase tracking-wider">
                  PERINCIAN TAGIHAN
                </div>
                <table className="w-full text-center text-[8.5px] sm:text-[9px] border-collapse bg-white">
                  <thead>
                    <tr className="bg-white text-slate-800 font-bold border-b border-[#0055A5] text-[8px] sm:text-[8.5px]">
                      <th colSpan={2} className="py-1 px-1 border-r border-[#0055A5]">KETERANGAN METER</th>
                      <th colSpan={3} className="py-1 px-1 border-r border-[#0055A5]">PENCATATAN METER</th>
                      <th rowSpan={2} className="py-1 px-1 border-r border-[#0055A5] w-20 leading-tight">TOTAL<br />PEMAKAIAN<br /><span className="text-[7.5px] font-normal">(m³)</span></th>
                      <th rowSpan={2} className="py-1 px-1 border-r border-[#0055A5] w-16 leading-tight">PEMAKAIAN<br /><span className="text-[7.5px] font-normal">(m³)</span></th>
                      <th rowSpan={2} className="py-1 px-1 border-r border-[#0055A5] w-16 leading-tight">TARIF<br /><span className="text-[7.5px] font-normal">(Rp)</span></th>
                      <th rowSpan={2} className="py-1 px-2 w-24 text-right pr-3 leading-tight">NILAI<br /><span className="text-[7.5px] font-normal">(Rp)</span></th>
                    </tr>
                    <tr className="bg-white text-slate-700 text-[7.5px] sm:text-[8px] font-bold border-b border-[#0055A5]">
                      <th className="py-0.5 px-1 border-r border-[#0055A5]">MEREK</th>
                      <th className="py-0.5 px-1 border-r border-[#0055A5]">NOMOR SERI</th>
                      <th className="py-0.5 px-1 border-r border-[#0055A5]">TANGGAL CATAT</th>
                      <th className="py-0.5 px-1 border-r border-[#0055A5]">STAND AWAL</th>
                      <th className="py-0.5 px-1 border-r border-[#0055A5]">STAND AKHIR</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 font-mono text-[8.5px] sm:text-[9px]">
                    {/* Row 1: Block 1 */}
                    <tr className="border-b border-slate-200">
                      <td className="py-1 px-1 border-r border-[#0055A5] text-[8px] font-sans font-bold" rowSpan={3}>
                        {inv.merekMeter}
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] text-[8px] font-bold" rowSpan={3}>
                        {inv.nomorSeriMeter}
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] font-bold" rowSpan={3}>
                        {inv.tanggalCatat}
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] font-bold" rowSpan={3}>
                        {inv.standAwal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] font-bold" rowSpan={3}>
                        {inv.standAkhir.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] font-black text-[#0055A5]" rowSpan={3}>
                        {inv.totalPakai.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {inv.blok1.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {formatRupiah(inv.tarifBlok1)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok1)}
                      </td>
                    </tr>
                    {/* Row 2: Block 2 */}
                    <tr className="border-b border-slate-200">
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {inv.blok2.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {formatRupiah(inv.tarifBlok2)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok2)}
                      </td>
                    </tr>
                    {/* Row 3: Block 3 */}
                    <tr className="border-b border-[#0055A5]">
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {inv.blok3.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 font-bold">
                        {formatRupiah(inv.tarifBlok3)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok3)}
                      </td>
                    </tr>
                    {/* Subtotal row */}
                    <tr className="bg-white font-black text-[9px] border-t border-[#0055A5]">
                      <td colSpan={5} className="py-1 px-2 text-right border-r border-[#0055A5] font-sans uppercase">
                      </td>
                      <td className="py-1 px-1 border-r border-[#0055A5] text-[#0055A5]">
                        {inv.totalPakai.toLocaleString('id-ID')}
                      </td>
                      <td colSpan={2} className="py-1 px-1 border-r border-[#0055A5]"></td>
                      <td className="py-1 pr-3 text-right text-slate-900">
                        {formatRupiah(inv.totalNilaiAir)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* FOURTH SECTION: KETERANGAN TAGIHAN */}
              <div className="mt-2.5 border-2 border-[#0055A5]">
                <div className="bg-[#0055A5] text-white py-1 px-3 text-center font-black text-[10px] sm:text-[11px] uppercase tracking-wider">
                  KETERANGAN TAGIHAN
                </div>

                <div className="p-3 bg-white text-[8.5px] sm:text-[9px] leading-relaxed flex flex-col justify-between">
                  <div className="space-y-0.5 font-mono">
                    <div className="flex justify-between items-center font-sans">
                      <span>BIAYA PEMAKAIAN AIR</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right font-bold">{formatRupiah(inv.biayaPakaiAir)}</span> (1)</span>
                    </div>
                    <div className="flex justify-between items-center font-sans">
                      <span>BIAYA PEMAKAIAN MINIMUM</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right font-bold">0</span> (1)</span>
                    </div>
                    <div className="flex justify-between items-center font-sans">
                      <span>ABONEMEN</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right font-bold">{formatRupiah(inv.abonemen)}</span> (1)</span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-slate-500">
                      <span>DENDA KETERLAMBATAN BULAN LALU</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right">0</span></span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-slate-500">
                      <span>CICILAN BULAN INI</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right">0</span></span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-slate-500">
                      <span>BIAYA LAIN</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right">0</span></span>
                    </div>

                    <div className="py-1 border-t border-slate-200 my-0.5 grid grid-cols-2 text-[8.5px]">
                      <div className="flex justify-between pr-4 border-r border-slate-200">
                        <span className="font-sans">DPP</span>
                        <span>Rp. <strong className="inline-block w-24 text-right">{formatRupiah(inv.dpp)}</strong></span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="font-sans">PPN (12% Dibebaskan)</span>
                        <span>Rp. <strong className="inline-block w-24 text-right">0</strong></span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center font-sans">
                      <span>TAGIHAN AIR BULAN BERJALAN</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right font-bold">{formatRupiah(inv.praTotal)}</span></span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-slate-500">
                      <span>DISKON</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right">0</span></span>
                    </div>
                    <div className="flex justify-between items-center font-sans text-slate-500">
                      <span>KELEBIHAN PEMBAYARAN BULAN SEBELUMNYA</span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right">0</span></span>
                    </div>

                    <div className="pt-1.5 mt-1 border-t-2 border-[#0055A5] flex items-center justify-between">
                      <span className="font-sans font-black text-xs text-slate-900 uppercase">
                        TOTAL TAGIHAN KESELURUHAN
                      </span>
                      <span className="font-mono font-black text-sm text-[#0055A5]">
                        Rp. {formatRupiah(inv.totalKeseluruhan)}
                      </span>
                    </div>
                    <p className="font-sans italic text-[8px] text-slate-600 mt-0.5">
                      Terbilang: {inv.terbilangStr}
                    </p>
                  </div>
                </div>
              </div>

              {/* BEA METERAI LUNAS BOX & CERTIFICATIONS (TÜV NORD, KAN, MUI HALAL) */}
              <div className="mt-2.5 flex items-end justify-between gap-6">
                {/* Certifications (TÜV NORD, KAN, HALAL) */}
                <div className="flex items-center gap-4">
                  <TuvNordLogo size={44} />
                  <div className="h-10 w-px bg-slate-200" />
                  <KanLogo size={44} />
                  <div className="h-10 w-px bg-slate-200" />
                  <HalalIndonesiaLogo size={44} />
                </div>

                {/* BEA METERAI LUNAS BOX */}
                <div className="w-52 border-2 border-[#0055A5]">
                  <div className="bg-[#0055A5] text-white font-black text-[9px] py-1 text-center uppercase tracking-wider">
                    BEA METERAI LUNAS
                  </div>
                  <div className="h-14 bg-white p-1.5 flex flex-col items-center justify-center text-center">
                    {eMeteraiMode === 'peruri_digital' ? (
                      <div className="flex items-center gap-2">
                        <QrCode className="w-8 h-8 text-[#0055A5]" />
                        <div className="text-left font-sans text-[7px] leading-tight">
                          <span className="font-black text-purple-900 block">e-Meterai PERURI Valid</span>
                          <span className="font-mono text-slate-600 block">SN: 260930-88192</span>
                          <span className="text-emerald-700 font-bold block">✓ Rp 10.000 Lunas</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[7.5px] font-sans font-bold text-slate-700 uppercase leading-snug">
                        BEA METERAI LUNAS
                        <span className="block font-mono text-[8px] text-[#0055A5]">DENGAN SISTEM KOMPUTERISASI</span>
                        <span className="block font-mono text-[7px] text-slate-500">Rp 10.000</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FIFTH SECTION: SLIP PEMBAYARAN / BARCODE PEMBAYARAN */}
              <div className="mt-2.5 border-2 border-[#0055A5] bg-[#EBF3FA] p-3 flex flex-row items-center justify-between gap-3 text-[9px]">
                {/* Left: Summary Data */}
                <div className="flex-1 space-y-1">
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-bold">NAMA</span>
                    <span className="font-black text-slate-900 uppercase truncate">: {customer.nama}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-bold">NOMOR PELANGGAN</span>
                    <span className="font-mono font-black text-[#0055A5]">: {inv.nomorPelanggan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-bold">BULAN TAGIHAN</span>
                    <span className="font-bold text-slate-800">: {inv.bulanTagihan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-bold">NO. TAGIHAN</span>
                    <span className="font-mono text-slate-800">: {inv.noTagihan}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-700 font-bold">NOMINAL TAGIHAN</span>
                    <span className="font-mono font-black text-slate-900">: Rp. {formatRupiah(inv.totalKeseluruhan)}</span>
                  </div>
                </div>

                {/* Right: Barcode Box */}
                <div className="w-64 sm:w-72 bg-white border border-[#0055A5] p-2 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[8.5px] font-black text-[#0055A5] uppercase tracking-wider mb-1">
                    BARCODE PEMBAYARAN
                  </span>
                  <Barcode128Svg value={inv.nomorPelanggan} className="h-9 w-full max-w-[200px]" />
                </div>
              </div>
            </div>

            {/* SIXTH SECTION: FOOTER CONTACT BAR */}
            <div className="mt-3 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 bg-[#0055A5] text-white py-1.5 px-4 text-[7.5px] sm:text-[8px] flex items-center justify-between font-medium tracking-wide flex-wrap">
              <span>🌐 www.aat.co.id</span>
              <span>🐦 @AetraTNG</span>
              <span>📷 @aetratangerang</span>
              <span>✉️ contact.center@aat.co.id</span>
              <span>📞 021-598 5474</span>
              <span>📱 0877 8822 4645</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PAGE 2: INFORMASI PELANGGAN PT AETRA AIR TANGERANG (HALAMAN 2)             */}
          {/* ========================================================================= */}
          <div
            id="aetra-invoice-page-2"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-xl flex flex-col justify-between font-sans text-[8.5px] leading-relaxed relative print:shadow-none print:rounded-none print:p-8 print:m-0 print:w-full print:min-h-[297mm]"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* PAGE 2 HEADER */}
              <div className="text-center pb-3 border-b-2 border-[#0055A5]">
                <h2 className="text-sm font-black text-[#0055A5] uppercase tracking-wider">
                  Informasi Pelanggan PT Aetra Air Tangerang
                </h2>
              </div>

              {/* SECTION A */}
              <div className="mt-3 space-y-1">
                <div className="bg-[#0055A5] text-white py-0.5 px-2 font-black text-[9px] uppercase tracking-wide rounded-t">
                  A. Informasi Tagihan dan Pembayaran
                </div>
                <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 border border-slate-200 rounded-b text-[8px] text-slate-700">
                  <div className="space-y-1">
                    <p>
                      <strong>1.</strong> Pembayaran tagihan harus dilakukan sebelum tanggal <strong>JATUH TEMPO</strong> untuk menghindari denda dan pemutusan.
                    </p>
                    <p>
                      <strong>2.</strong> Apabila tanggal JATUH TEMPO jatuh pada hari raya/hari libur, maka pembayaran harus dilakukan paling lambat <strong>1 (satu) hari kerja sebelumnya</strong>.
                    </p>
                    <p>
                      <strong>3.</strong> Pembayaran melalui transfer, harap mencantumkan informasi data Pelanggan (Nomor Pelanggan dan/atau Nama Pelanggan). Kelalaian atau kesalahan dalam mencantumkan Nomor Pelanggan dan/atau Nama Pelanggan dapat menyebabkan tidak teridentifikasinya pembayaran.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <strong>4.</strong> Apabila tagihan belum diterima sampai dengan akhir bulan, Pelanggan dapat menghubungi Kantor Pelayanan Pelanggan atau Contact Center 24 jam PT Aetra Air Tangerang (AAT) untuk informasi jumlah tagihan.
                    </p>
                    <p>
                      <strong>5.</strong> Tidak diterimanya tagihan tidak menghapus kewajiban Pelanggan untuk membayar tagihan tepat waktu.
                    </p>
                    <p>
                      <strong>6.</strong> Apabila terdapat informasi yang tidak sesuai dalam tagihan ini, Pelanggan dapat mengajukan keberatan ke Kantor Pelayanan Pelanggan atau melalui Contact Center 24 jam PT Aetra Air Tangerang (AAT) sebelum tanggal JATUH TEMPO atau sebelum tagihan dibayarkan.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B */}
              <div className="mt-3 space-y-1">
                <div className="bg-[#0055A5] text-white py-0.5 px-2 font-black text-[9px] uppercase tracking-wide rounded-t">
                  B. Informasi Lokasi dan Cara Pembayaran
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-b text-[8px] text-slate-700 space-y-1.5">
                  <p>
                    <strong>1.</strong> Pembayaran tagihan air PT Aetra Air Tangerang (AAT) dapat dilakukan di lokasi dan dengan cara pembayaran sesuai informasi di bawah ini:
                  </p>
                  
                  {/* Payment Matrix Table */}
                  <table className="w-full text-center border-collapse text-[7.5px]">
                    <thead>
                      <tr className="bg-[#0055A5] text-white font-bold">
                        <th className="py-1 px-1 border border-blue-300 w-6">No.</th>
                        <th className="py-1 px-2 border border-blue-300 text-left">Lokasi Pembayaran</th>
                        <th className="py-1 px-1 border border-blue-300">Tunai</th>
                        <th className="py-1 px-1 border border-blue-300">ATM</th>
                        <th className="py-1 px-1 border border-blue-300">Mesin EDC</th>
                        <th className="py-1 px-1 border border-blue-300">Internet Banking</th>
                        <th className="py-1 px-1 border border-blue-300">SMS Banking</th>
                        <th className="py-1 px-1 border border-blue-300">Mobile Banking</th>
                        <th className="py-1 px-1 border border-blue-300">Virtual Account</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="py-0.5 border border-slate-200 font-bold">1</td>
                        <td className="py-0.5 px-2 border border-slate-200 text-left font-bold">Bank Mandiri</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                      </tr>
                      <tr className="bg-slate-50/60">
                        <td className="py-0.5 border border-slate-200 font-bold">2</td>
                        <td className="py-0.5 px-2 border border-slate-200 text-left font-bold">Bank BCA</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 border border-slate-200 font-bold">3</td>
                        <td className="py-0.5 px-2 border border-slate-200 text-left font-bold">PT Pos Indonesia</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                      </tr>
                      <tr className="bg-slate-50/60">
                        <td className="py-0.5 border border-slate-200 font-bold">4</td>
                        <td className="py-0.5 px-2 border border-slate-200 text-left font-bold">Indomaret</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                      </tr>
                      <tr>
                        <td className="py-0.5 border border-slate-200 font-bold">5</td>
                        <td className="py-0.5 px-2 border border-slate-200 text-left font-bold">Alfamart</td>
                        <td className="py-0.5 border border-slate-200 text-emerald-600 font-bold">✔</td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                        <td className="py-0.5 border border-slate-200"></td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-[7px] text-slate-500 italic">
                    Bukti transaksi agar disimpan sebagai tanda bukti sudah melakukan pembayaran.
                  </p>
                  <p>
                    <strong>2.</strong> Pembayaran tagihan hanya dapat dilakukan di lokasi pembayaran resmi seperti yang disebutkan di atas. Pembayaran yang dilakukan di luar ketentuan di atas bukan tanggung jawab PT Aetra Air Tangerang (AAT).
                  </p>
                  <p>
                    <strong>3.</strong> Resi Pembayaran harap disimpan sebagai tanda bukti saat memproses pengaduan dan guna pemeriksaan sewaktu-waktu.
                  </p>
                </div>
              </div>

              {/* SECTION C */}
              <div className="mt-3 space-y-1">
                <div className="bg-[#0055A5] text-white py-0.5 px-2 font-black text-[9px] uppercase tracking-wide rounded-t">
                  C. Informasi Meter
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-b text-[8px] text-slate-700 space-y-1">
                  <p>
                    <strong>1.</strong> Demi menjaga keakurasian pembacaan meter, Pelanggan harus memastikan agar meter air dapat terjangkau setiap saat, tidak terhalang apapun dan terbaca dengan jelas oleh Petugas Pencatat Meter. Pemakaian air akan diestimasi jika Petugas Pencatat Meter tidak dapat menjangkau dan membaca meter.
                  </p>
                  <p>
                    <strong>2. Pelanggan dilarang:</strong>
                  </p>
                  <ul className="list-disc list-inside pl-2 space-y-0.5 text-[7.5px] text-slate-600">
                    <li>Melepas, merusak dan menyebabkan hilangnya segel meter air;</li>
                    <li>Membalik arah dan menimbun serta menyebabkan hilangnya meter air;</li>
                    <li>Mengubah ukuran dan letak pipa air yang dipasang dan memindahkan meter air;</li>
                    <li>Menyadap air langsung dari pipa air tanpa melalui meter air;</li>
                    <li>Menggunakan pompa air listrik untuk menyedot air melalui meter air;</li>
                    <li>Menjual air kepada pihak lain; dan</li>
                    <li>Memasukkan zat apapun (ke dalam pipa sambungan) sebelum meter air yang dapat merusak kualitas air atau melakukan sesuatu yang dapat membuat air terkontaminasi.</li>
                  </ul>
                  <p>
                    <strong>3.</strong> Sanksi terhadap pelanggaran di atas dapat berupa denda sesuai ketentuan yang berlaku dan/atau pemutusan sambungan air.
                  </p>
                </div>
              </div>

              {/* SECTION D */}
              <div className="mt-3 space-y-1">
                <div className="bg-[#0055A5] text-white py-0.5 px-2 font-black text-[9px] uppercase tracking-wide rounded-t">
                  D. Informasi Pemutusan dan Penyambungan
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-b text-[8px] text-slate-700 space-y-1">
                  <p>
                    <strong>1.</strong> Pembayaran tagihan sesudah tanggal <strong>JATUH TEMPO</strong> akan dikenakan denda per bulan keterlambatan, yang besarnya sesuai dengan kelompok Pelanggan, sebagai berikut:
                  </p>
                  
                  {/* Late Fine Schedule Table */}
                  <table className="w-full text-center border-collapse text-[7.5px] my-1">
                    <thead>
                      <tr className="bg-[#0055A5] text-white font-bold">
                        <th className="py-1 px-1 border border-blue-300">Kelompok Pelanggan</th>
                        <th className="py-1 px-1 border border-blue-300">Sosial</th>
                        <th className="py-1 px-1 border border-blue-300">R1</th>
                        <th className="py-1 px-1 border border-blue-300">R2</th>
                        <th className="py-1 px-1 border border-blue-300">R3</th>
                        <th className="py-1 px-1 border border-blue-300">R4</th>
                        <th className="py-1 px-1 border border-blue-300">Instansi Pemerintah</th>
                        <th className="py-1 px-1 border border-blue-300">Komersil</th>
                        <th className="py-1 px-1 border border-blue-300">Industri</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="py-0.5 px-1 border border-slate-200 font-bold text-left">Denda Keterlambatan per Bulan (Rp)</td>
                        <td className="py-0.5 border border-slate-200 font-mono">5.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">10.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">10.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">15.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">20.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">20.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono">20.000</td>
                        <td className="py-0.5 border border-slate-200 font-mono font-bold text-[#0055A5]">50.000</td>
                      </tr>
                    </tbody>
                  </table>

                  <p>
                    <strong>2.</strong> Apabila tagihan tidak dibayarkan sampai tanggal JATUH TEMPO, maka PT Aetra Air Tangerang (AAT) dapat memutus aliran air sementara.
                  </p>
                  <p>
                    <strong>3.</strong> Penyambungan kembali aliran air yang diputus sementara, dilakukan setelah Pelanggan melunasi seluruh tunggakan, denda keterlambatan dan biaya ganti segel.
                  </p>
                  <p>
                    <strong>4.</strong> Apabila tagihan tidak dibayar dalam jangka waktu 60 (enam puluh) hari kerja setelah tanggal terbit tagihan, maka PT Aetra Air Tangerang (AAT) dapat memutus sambungan air secara permanen.
                  </p>
                  <p>
                    <strong>5.</strong> Penyambungan kembali aliran air yang diputus permanen, dilakukan setelah Pelanggan melunasi seluruh tunggakan, denda keterlambatan dan biaya sambungan baru.
                  </p>
                  <p>
                    <strong>6.</strong> Ketentuan pemutusan dan penyambungan akan dilakukan berdasarkan pada properti tempat sambungan air berada tanpa memperhatikan penagihan kepemilikan/penguasaan atas properti tersebut.
                  </p>
                  <p>
                    <strong>7.</strong> Apabila Pelanggan membeli, menjual, menyewa atau menyewakan rumah/properti, Pelanggan harus memastikan bahwa rumah/properti tersebut sudah terbebas dari tunggakan atau denda atau kewajiban lain dengan/kepada PT Aetra Air Tangerang (AAT).
                  </p>
                </div>
              </div>
            </div>

            {/* PAGE 2 FOOTER */}
            <div className="mt-4 pt-2 border-t border-slate-300 text-center text-[7.5px] text-slate-500 font-mono">
              PT AETRA AIR TANGERANG · LEMBAR INFORMASI PELANGGAN &amp; KETENTUAN LAYANAN AIR BERSIH · HALAMAN 2 DARI 2
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
