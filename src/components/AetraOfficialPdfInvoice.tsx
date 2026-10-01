import React, { useState } from 'react';
import { IndustryCustomer } from '../types';
import {
  KabupatenTangerangLogo,
  AetraOfficialLogo,
  SgsIsoLogo,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] my-auto print:max-h-none print:m-0 print:border-none print:shadow-none print:w-full print:rounded-none">
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
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 flex flex-col items-center gap-6 print:p-0 print:bg-white print:gap-0">
          
          {/* ========================================================================= */}
          {/* PAGE 1: OFFICIAL INVOICE & TAX INVOICE (HALAMAN 1)                         */}
          {/* ========================================================================= */}
          <div
            id="aetra-invoice-page-1"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-xl flex flex-col justify-between font-sans relative print:shadow-none print:rounded-none print:p-8 print:m-0 print:w-full print:min-h-[297mm] print:page-break-after-always"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* TOP HEADER SECTION */}
              <div className="flex justify-between items-start gap-4 pb-2">
                {/* Left: Pemda Kab Tangerang Logo & Aetra Company Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <KabupatenTangerangLogo className="h-14 w-auto shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight text-slate-800">
                    <h1 className="text-base font-black text-[#0055A5] uppercase tracking-tight">
                      PT Aetra Air Tangerang
                    </h1>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">
                      Jln. Raya STPI Curug No. 27, Kabupaten Tangerang 15810
                    </p>
                    <p className="text-[9.5px] text-slate-600">
                      Telp. 021 598 5474, Fax. 021 598 5479
                    </p>
                    <p className="text-[9.5px] text-[#0055A5] font-bold">
                      www.aetratangerang.co.id
                    </p>
                  </div>
                </div>

                {/* Middle: Aetra Brand Logo */}
                <div className="flex items-center shrink-0 pr-2">
                  <AetraOfficialLogo height={42} />
                </div>

                {/* Right: "Informasi Tagihan Air" Box */}
                <div className="w-56 shrink-0 border border-[#0055A5] rounded-t-lg overflow-hidden text-[10px]">
                  <div className="bg-[#0055A5] text-white py-1 text-center font-black text-xs uppercase tracking-wider">
                    Informasi Tagihan Air
                  </div>
                  <div className="p-1.5 bg-[#E6F0FA]/60 grid grid-cols-3 gap-1 text-[9px] font-bold text-center border-b border-blue-200">
                    <div>
                      <span className="block text-[7.5px] text-slate-500 font-normal">BULAN TAGIHAN</span>
                      <span className="text-[#0055A5] font-black">{inv.bulanTagihan}</span>
                    </div>
                    <div>
                      <span className="block text-[7.5px] text-slate-500 font-normal">NO. TAGIHAN</span>
                      <span className="font-mono text-slate-800">{inv.noTagihan}</span>
                    </div>
                    <div>
                      <span className="block text-[7.5px] text-slate-500 font-normal">TANGGAL JATUH TEMPO</span>
                      <span className="text-rose-700 font-black">{inv.tanggalJatuhTempo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CUSTOMER PROFILE & METADATA GRID */}
              <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 border border-blue-200/80 text-[9.5px] grid grid-cols-12 gap-2 leading-tight">
                {/* Left Column (Customer Name & Address) */}
                <div className="col-span-6 space-y-1">
                  <div>
                    <h2 className="font-black text-xs text-slate-900 uppercase">
                      {customer.nama}
                    </h2>
                    <p className="text-slate-600 uppercase text-[9px] mt-0.5">
                      {customer.lokasi || 'KP. COGREG RT.01/03 PASIR BOLANG - TIGARAKSA TANGERANG'}
                    </p>
                  </div>
                  <div className="pt-1 text-[9px]">
                    <span className="text-slate-500">NPWP: </span>
                    <span className="font-mono font-bold text-slate-800">{inv.npwpPelanggan}</span>
                  </div>
                  <div className="text-[9px]">
                    <span className="text-slate-500">SIKLUS/RUTE BACA: </span>
                    <span className="font-bold text-[#0055A5]">{inv.siklusRuteBaca}</span>
                  </div>
                </div>

                {/* Right Column (Technical Connection Data) */}
                <div className="col-span-6 space-y-1 pl-3 border-l border-blue-200">
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-slate-500">NOMOR PELANGGAN</span>
                    <span className="col-span-7 font-mono font-black text-[#0055A5]">: {inv.nomorPelanggan}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-slate-500">GOLONGAN TARIF</span>
                    <span className="col-span-7 font-bold text-slate-800">: {inv.golonganTarif}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-slate-500">KELOMPOK PELANGGAN</span>
                    <span className="col-span-7 font-bold text-slate-800">: {inv.kelompokPelanggan}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-slate-500">UKURAN METER</span>
                    <span className="col-span-7 font-bold text-slate-800">: {inv.ukuranMeter}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-slate-500">LOKASI SAMBUNGAN</span>
                    <span className="col-span-7 text-slate-700 uppercase text-[8.5px]">: {inv.lokasiSambungan}</span>
                  </div>
                </div>

                {/* Dates Footer inside Customer box */}
                <div className="col-span-12 pt-1 border-t border-blue-200/60 flex items-center justify-between text-[8.5px] text-slate-500 font-mono">
                  <div>
                    <span>TANGGAL CETAK : </span>
                    <strong className="text-slate-800">{inv.tanggalCetak}</strong>
                  </div>
                  <div>
                    <span>TANGGAL BILL : </span>
                    <strong className="text-slate-800">{inv.tanggalBill}</strong>
                  </div>
                </div>
              </div>

              {/* TABLE 1: PERINCIAN TAGIHAN (METER & TIER BLOCKS) */}
              <div className="mt-3 overflow-hidden rounded-md border border-[#0055A5]">
                <div className="bg-[#0055A5] text-white py-1 px-3 text-center font-black text-[10px] uppercase tracking-wider">
                  Perincian Tagihan
                </div>
                <table className="w-full text-center text-[9px] border-collapse">
                  <thead>
                    <tr className="bg-[#E6F0FA] text-slate-700 font-bold border-b border-blue-200 text-[8.5px]">
                      <th colSpan={2} className="py-1 px-2 border-r border-blue-200">KETERANGAN METER</th>
                      <th colSpan={3} className="py-1 px-2 border-r border-blue-200">PENCATATAN METER</th>
                      <th rowSpan={2} className="py-1 px-2 border-r border-blue-200 w-20">TOTAL PEMAKAIAN (m³)</th>
                      <th rowSpan={2} className="py-1 px-2 border-r border-blue-200 w-16">PEMAKAIAN (m³)</th>
                      <th rowSpan={2} className="py-1 px-2 border-r border-blue-200 w-16">TARIF (Rp)</th>
                      <th rowSpan={2} className="py-1 px-2 w-24 text-right pr-3">NILAI (Rp)</th>
                    </tr>
                    <tr className="bg-[#F1F5F9] text-slate-600 text-[8px] font-semibold border-b border-blue-200">
                      <th className="py-0.5 px-1 border-r border-blue-200">MEREK</th>
                      <th className="py-0.5 px-1 border-r border-blue-200">NOMOR SERI</th>
                      <th className="py-0.5 px-1 border-r border-blue-200">TANGGAL CATAT</th>
                      <th className="py-0.5 px-1 border-r border-blue-200">STAND AWAL</th>
                      <th className="py-0.5 px-1 border-r border-blue-200">STAND AKHIR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[9px]">
                    {/* Row 1: Block 1 */}
                    <tr>
                      <td className="py-1 px-1 border-r border-slate-200 text-[8px] font-sans font-bold" rowSpan={3}>
                        {inv.merekMeter}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 text-[8px] font-bold" rowSpan={3}>
                        {inv.nomorSeriMeter}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold" rowSpan={3}>
                        {inv.tanggalCatat}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold" rowSpan={3}>
                        {inv.standAwal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold" rowSpan={3}>
                        {inv.standAkhir.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-black text-[10px] text-[#0055A5]" rowSpan={3}>
                        {inv.totalPakai.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {inv.blok1.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {formatRupiah(inv.tarifBlok1)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok1)}
                      </td>
                    </tr>
                    {/* Row 2: Block 2 */}
                    <tr>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {inv.blok2.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {formatRupiah(inv.tarifBlok2)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok2)}
                      </td>
                    </tr>
                    {/* Row 3: Block 3 */}
                    <tr>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {inv.blok3.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200 font-bold">
                        {formatRupiah(inv.tarifBlok3)}
                      </td>
                      <td className="py-1 pr-3 text-right font-bold">
                        {formatRupiah(inv.nilaiBlok3)}
                      </td>
                    </tr>
                    {/* Subtotal row */}
                    <tr className="bg-[#E6F0FA]/80 font-black text-[9.5px] border-t-2 border-[#0055A5]">
                      <td colSpan={5} className="py-1 px-2 text-right border-r border-blue-200 font-sans uppercase">
                        Total
                      </td>
                      <td className="py-1 px-1 border-r border-blue-200 text-[#0055A5]">
                        {inv.totalPakai.toLocaleString('id-ID')}
                      </td>
                      <td colSpan={2} className="py-1 px-1 border-r border-blue-200"></td>
                      <td className="py-1 pr-3 text-right text-slate-900">
                        {formatRupiah(inv.totalNilaiAir)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: KETERANGAN TAGIHAN (CALCULATIONS & MATERAI) */}
              <div className="mt-3 overflow-hidden rounded-md border border-[#0055A5]">
                <div className="bg-[#0055A5] text-white py-1 px-3 text-center font-black text-[10px] uppercase tracking-wider">
                  Keterangan Tagihan
                </div>
                <div className="p-3 text-[9.5px] leading-relaxed space-y-0.5 font-mono">
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

                  <div className="py-1 border-t border-slate-200 my-1 grid grid-cols-2 text-[9px]">
                    <div className="flex justify-between pr-4 border-r border-slate-200">
                      <span className="font-sans">DPP</span>
                      <span>Rp. <strong className="inline-block w-24 text-right">{formatRupiah(inv.dpp)}</strong></span>
                    </div>
                    <div className="flex justify-between pl-4">
                      <span className="font-sans">PPN (12%)</span>
                      <span>Rp. <strong className="inline-block w-24 text-right">{formatRupiah(inv.ppn)}</strong></span>
                    </div>
                  </div>

                  {inv.meterai > 0 && (
                    <div className="flex justify-between items-center font-sans font-bold text-slate-800 bg-amber-50 px-1 rounded">
                      <span className="flex items-center gap-1">
                        <span>METERAI</span>
                        <span className="text-[8px] font-normal text-slate-500">(UU Bea Meterai &gt; 5 Juta)</span>
                      </span>
                      <span className="font-mono">Rp. <span className="inline-block w-28 text-right font-bold">{formatRupiah(inv.meterai)}</span></span>
                    </div>
                  )}

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

                  {/* TOTAL TAGIHAN KESELURUHAN & MATERAI AREA */}
                  <div className="pt-2 mt-1 border-t-2 border-[#0055A5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    {/* E-Meterai / Materai Stamp Area */}
                    {inv.meterai > 0 && (
                      <div className="border border-dashed border-slate-400 p-1.5 rounded bg-slate-50/80 text-center flex items-center gap-2">
                        {eMeteraiMode === 'peruri_digital' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white border border-slate-300 rounded p-0.5 flex items-center justify-center">
                              <QrCode className="w-8 h-8 text-[#0055A5]" />
                            </div>
                            <div className="text-left font-sans leading-tight">
                              <span className="font-black text-[8px] text-purple-900 uppercase block">e-Meterai PERURI Valid</span>
                              <span className="font-mono text-[7px] text-slate-600 block">SN: 260930-88192-AETRA</span>
                              <span className="text-[7px] text-emerald-600 font-bold block">✓ Rp 10.000 Lunas</span>
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-1 font-sans text-[8px] text-slate-500 text-center leading-tight">
                            <span className="block font-bold text-slate-700 uppercase">Tempel / Bubuhkan Meterai</span>
                            <span className="block font-mono text-[9px] text-[#0055A5] font-black">Rp 10.000</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-right flex-1">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-sans font-black text-xs text-slate-900 uppercase">
                          Total Tagihan Keseluruhan
                        </span>
                        <span className="font-mono font-black text-sm sm:text-base text-[#0055A5]">
                          Rp. {formatRupiah(inv.totalKeseluruhan)}
                        </span>
                      </div>
                      <p className="font-sans italic text-[8.5px] text-slate-600 mt-0.5">
                        {inv.terbilangStr}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TUNGGAKAN INFO */}
              <div className="mt-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-[8.5px] flex items-center justify-between font-sans">
                <span className="text-slate-600">
                  TOTAL TAGIHAN PERIODE SEBELUMNYA YANG BELUM DIBAYARKAN SAMPAI DENGAN {inv.tanggalCatat}
                </span>
                <span className="font-mono font-bold">Rp. 0</span>
              </div>
              <p className="text-[7.5px] text-slate-500 italic mt-0.5">
                Mohon abaikan jika sudah melakukan pembayaran, untuk mengetahui perincian tagihan hubungi Kantor Pelayanan Pelanggan atau Contact Centre Aetra
              </p>

              {/* FOOTNOTES & LEGAL NOTICES */}
              <div className="mt-2 pt-2 border-t border-slate-200 text-[7.5px] leading-tight text-slate-500 space-y-1">
                <p>
                  <strong>(1) PPN DIBEBASKAN SESUAI PP NOMOR 40 TAHUN 2015 SEBAGAIMANA TELAH BEBERAPA KALI DIUBAH TERAKHIR DENGAN PP NOMOR 58 TAHUN 2021</strong>
                </p>
                <p>
                  Dokumen ini adalah tagihan yang berfungsi sebagai faktur pajak sesuai dengan Peraturan Dirjen Pajak No. PER -16/PJ/2021 tanggal 01 Agustus 2021 dan mulai berlaku pertanggal 01 Agustus 2021.
                </p>
                <p className="font-semibold text-slate-600">
                  PT AETRA AIR TANGERANG · Jl. STPI Curug No. 27 RT. 003 RW. 003 Pos Bitung, Kadu Jaya, Curug, Kab. Tangerang 00000 · NPWP: 0028391423451000
                </p>
              </div>

              {/* TAX CHANGE 12% NOTICE & BADGES ROW */}
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-[7.5px] text-slate-600">
                <div className="flex-1 leading-snug">
                  <p className="font-bold text-slate-700">
                    Pelanggan yang terhormat, efektif 1 Januari 2025 Tarif Pajak Pertambahan Nilai (PPN) atas Objek Kena Pajak Berubah menjadi 12% (Dua Belas Persen).
                  </p>
                  <p className="text-[7px] text-slate-500">
                    Sesuai Peraturan Menteri Keuangan PMK No. 131 Tahun 2024 Pasal 3 ayat 2.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <SgsIsoLogo size={36} />
                  <HalalIndonesiaLogo size={36} />
                </div>
              </div>

              {/* TEAR-OFF / PAYMENT STUB (SLIP PEMBAYARAN) */}
              <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-400">
                <div className="p-2.5 rounded bg-[#E6F0FA]/70 border border-blue-200 grid grid-cols-12 gap-3 text-[8.5px] items-center">
                  <div className="col-span-7 space-y-0.5">
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 text-slate-500 font-bold">NAMA</span>
                      <span className="col-span-8 font-black text-slate-900 truncate">: {customer.nama}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 text-slate-500 font-bold">NOMOR PELANGGAN</span>
                      <span className="col-span-8 font-mono font-black text-[#0055A5]">: {inv.nomorPelanggan}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 text-slate-500 font-bold">BULAN TAGIHAN</span>
                      <span className="col-span-8 font-bold text-slate-800">: {inv.bulanTagihan}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 text-slate-500 font-bold">NO. TAGIHAN</span>
                      <span className="col-span-8 font-mono text-slate-800">: {inv.noTagihan}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 text-slate-500 font-bold">NOMINAL TAGIHAN</span>
                      <span className="col-span-8 font-mono font-black text-xs text-[#0055A5]">: Rp. {formatRupiah(inv.totalKeseluruhan)}</span>
                    </div>
                  </div>

                  <div className="col-span-5 pl-2 border-l border-blue-200 flex flex-col items-center justify-center">
                    <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      Barcode Pembayaran
                    </span>
                    <Barcode128Svg value={inv.nomorPelanggan} className="h-8 w-full max-w-[150px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 1 FOOTER CONTACT BAR */}
            <div className="mt-3 -mx-8 -mb-8 sm:-mx-10 sm:-mb-10 bg-[#0055A5] text-white py-1.5 px-4 text-[7.5px] flex items-center justify-between font-medium tracking-wide flex-wrap">
              <span>🌐 www.aetratangerang.co.id</span>
              <span>🐦 @AetraTng</span>
              <span>📸 @aetratangerang</span>
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
    </div>
  );
};
