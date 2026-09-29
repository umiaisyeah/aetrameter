import React from 'react';
import { IndustryCustomer } from '../types';
import { AetraLogo } from './AetraLogo';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface OfficialAetraInvoiceModalProps {
  customer: IndustryCustomer;
  onClose: () => void;
}

// Helper to convert number to Indonesian words (Terbilang)
function terbilang(nilai: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  
  if (nilai < 12) {
    return bilangan[nilai];
  } else if (nilai < 20) {
    return terbilang(nilai - 10) + ' Belas';
  } else if (nilai < 100) {
    return terbilang(Math.floor(nilai / 10)) + ' Puluh ' + terbilang(nilai % 10);
  } else if (nilai < 200) {
    return 'Seratus ' + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    return terbilang(Math.floor(nilai / 100)) + ' Ratus ' + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    return 'Seribu ' + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    return terbilang(Math.floor(nilai / 1000)) + ' Ribu ' + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    return terbilang(Math.floor(nilai / 1000000)) + ' Juta ' + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    return terbilang(Math.floor(nilai / 1000000000)) + ' Miliar ' + terbilang(nilai % 1000000000);
  }
  return '' + nilai;
}

export const OfficialAetraInvoiceModal: React.FC<OfficialAetraInvoiceModalProps> = ({ customer, onClose }) => {
  const vol = Math.max(0, customer.skrg - customer.lalu);
  const tagihanAir = vol * 17872;
  const abonemen = 87901;
  const dpp = Math.round(tagihanAir / 1.12);
  const ppn = tagihanAir - dpp;
  const isMaterai = tagihanAir > 5000000;
  const materai = isMaterai ? 10000 : 0;
  const totalTagihan = tagihanAir + abonemen + materai;
  
  const terbilangStr = `(( ${terbilang(totalTagihan)} Rupiah ))`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] print:m-0 print:shadow-none print:max-h-none print:border-none">
        
        {/* Modal Action Header (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                Official PT Aetra Air Tangerang - Invoice &amp; Faktur Pajak
              </h3>
              <p className="text-[11px] text-slate-400">
                Template Resmi Sesuai Standar PT Aetra Air Tangerang (Industrial Billing)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Container */}
        <div className="p-8 overflow-y-auto font-sans text-xs text-slate-900 bg-white print:p-0 space-y-6">
          
          {/* HEADER SECTION */}
          <div className="border-b-2 border-[#0055A5] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <AetraLogo className="h-12" />
              <div>
                <h1 className="text-lg font-black text-[#0055A5] uppercase tracking-tight">
                  PT Aetra Air Tangerang
                </h1>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Jl. Raya STPI Curug No. 27, Kabupaten Tangerang 15810<br />
                  Telp. 021 598 5474, Fax. 021 598 5479 · www.aetratangerang.co.id
                </p>
              </div>
            </div>

            {/* INFORMASI TAGIHAN AIR BOX */}
            <div className="w-full md:w-72 border border-[#0055A5] rounded-xl overflow-hidden shadow-xs">
              <div className="bg-[#0055A5] text-white text-center font-black py-1.5 text-xs uppercase tracking-wider">
                Informasi Tagihan Air
              </div>
              <div className="bg-blue-50/55 p-2.5 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">BULAN TAGIHAN:</span>
                  <span className="font-bold text-slate-900">SEPTEMBER 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">NO. TAGIHAN:</span>
                  <span className="font-bold text-slate-900">02260909008531</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="font-semibold text-slate-600">JATUH TEMPO:</span>
                  <span className="font-black text-rose-600">20/10/2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER & METER INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div className="font-black text-[#0055A5] text-sm uppercase">
                {customer.nama}
              </div>
              <div className="text-slate-700 font-medium">
                {customer.lokasi || 'Kp. Cogreg RT.01/03 Pasir Bolang - Tigaraksa Tangerang'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                NPWP: <strong className="text-slate-800">0027643048451000</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                SIKLUS / RUTE BACA: <strong className="text-slate-800">{customer.cycle} / S15C001</strong>
              </div>
            </div>

            <div className="space-y-1 font-mono text-[11px] border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
              <div className="flex justify-between">
                <span className="text-slate-500">NOMOR PELANGGAN</span>
                <span className="font-black text-[#0055A5]">{customer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GOLONGAN TARIF</span>
                <span className="font-bold text-slate-800">ID7 - Pergudangan/Industri Lainnya</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KELOMPOK PELANGGAN</span>
                <span className="font-bold text-slate-800">{customer.kelas || 'Industrial'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UKURAN METER</span>
                <span className="font-bold text-slate-800">1 Inches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LOKASI SAMBUNGAN</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{customer.lokasi || 'Kp. Cogreg Balaraja'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500">TANGGAL CETAK / BILL</span>
                <span className="font-bold text-slate-800">28/09/2026</span>
              </div>
            </div>
          </div>

          {/* PERINCIAN TAGIHAN TABLE */}
          <div className="space-y-2">
            <div className="bg-[#0055A5] text-white py-1.5 px-3 font-black text-xs uppercase tracking-wider rounded-t-lg">
              Perincian Tagihan Air Meter
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded-b-lg">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 text-[#003E78] uppercase font-bold border-b border-slate-300 text-[10px]">
                    <th className="p-2.5">Keterangan Meter</th>
                    <th className="p-2.5">Pencatatan Meter</th>
                    <th className="p-2.5 text-right">Total Pemakaian (m³)</th>
                    <th className="p-2.5 text-right">Tarif (Rp)</th>
                    <th className="p-2.5 text-right">Nilai (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-800">ELSTER/GKM WATER METER</div>
                      <div className="text-[10px] text-slate-500">No. Seri: GKM19C00078A</div>
                    </td>
                    <td className="p-2.5 text-slate-700">28/09/2026</td>
                    <td className="p-2.5 text-right font-bold">{vol.toLocaleString()}</td>
                    <td className="p-2.5 text-right">17.872</td>
                    <td className="p-2.5 text-right font-black text-[#0055A5]">
                      Rp {tagihanAir.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* KETERANGAN TAGIHAN SUMMARY */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="bg-slate-900 text-white py-1 px-3 font-bold text-xs uppercase tracking-wider rounded-md mb-2">
              Keterangan Tagihan &amp; Rincian Finansial
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">BIAYA PEMAKAIAN AIR</span>
                <span className="font-bold">Rp. {tagihanAir.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">ABONEMEN / BIAYA TETAP</span>
                <span className="font-bold">Rp. {abonemen.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">DENDA KETERLAMBATAN BULAN LALU</span>
                <span className="font-bold">Rp. 0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">DASAR PENGENAAN PAJAK (DPP)</span>
                <span className="font-bold">Rp. {dpp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">PPN (12% Sesuai PMK No. 131 Tahun 2024)</span>
                <span className="font-bold">Rp. {ppn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-sans text-slate-700 font-medium">METERAI ELEKTRONIK (Tagihan &gt; Rp 5 Juta)</span>
                <span className="font-bold">Rp. {materai.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-500 text-[11px]">
                <span className="font-sans">DISKON / KELEBIHAN PEMBAYARAN BULAN LALU</span>
                <span>Rp. 0</span>
              </div>

              {/* TOTAL TAGIHAN KESELURUHAN */}
              <div className="flex justify-between items-center bg-[#0055A5] text-white p-3 rounded-xl mt-3 text-sm">
                <span className="font-black font-sans uppercase">TOTAL TAGIHAN KESELURUHAN</span>
                <span className="font-black text-base font-mono">Rp. {totalTagihan.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center italic font-sans font-bold text-slate-700 py-1 bg-blue-50 rounded-lg text-xs">
              {terbilangStr}
            </div>
          </div>

          {/* FOOTER LEGAL & PAYMENT CHANNELS */}
          <div className="text-[10px] text-slate-500 space-y-2 pt-2 border-t border-slate-200">
            <p>
              <strong>TOTAL TAGIHAN PERIODE SEBELUMNYA YANG BELUM DIBAYARKAN: Rp 0</strong>
              <br />
              Mohon abaikan jika sudah melakukan pembayaran. Untuk mengetahui perincian tagihan hubungi Kantor Pelayanan Pelanggan atau Contact Centre Aetra.
            </p>
            <p className="text-[9px] text-slate-400">
              (1) PPN DIBEBASKAN SESUAI PP NOMOR 40 TAHUN 2015 SEBAGAIMANA TELAH BEBERAPA KALI DIUBAH TERAKHIR DENGAN PP NOMOR 58 TAHUN 2021.<br />
              Dokumen ini adalah tagihan yang berfungsi sebagai faktur pajak sesuai dengan Peraturan Dirjen Pajak No. PER-16/PJ/2021 tanggal 01 Agustus 2021.<br />
              <strong>PT AETRA AIR TANGERANG</strong> · Jl. STPI Curug No. 27 RT. 003 RW. 003 Pos Bitung, Kadu Jaya, Curug, Kab. Tangerang · NPWP: 0028391423451000
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-between items-center shrink-0 print:hidden">
          <span className="text-[11px] text-slate-500 font-mono">
            Pelanggan Yth. Efektif 1 Januari 2025 PPN menjadi 12% sesuai PMK No. 131 Tahun 2024.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
