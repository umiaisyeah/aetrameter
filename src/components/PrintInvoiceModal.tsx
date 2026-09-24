import React from 'react';
import { IndustryCustomer } from '../types';
import { AetraLogo } from './AetraLogo';
import { Printer, Download, X, CheckCircle } from 'lucide-react';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: IndustryCustomer | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  if (!isOpen || !customer) return null;

  const vol = Math.max(0, customer.skrg - customer.lalu);
  const tarifPerM3 = 12500;
  const biayaAir = vol * tarifPerM3;
  const biayaBebanPipa = 75000;
  const materai = vol > 1000 ? 10000 : 0;
  const subtotal = biayaAir + biayaBebanPipa;
  const totalTagihan = subtotal + materai;

  const invoiceNumber = `INV/AETRA/${customer.cycle.replace(' ', '')}/${customer.id}/${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-100 p-3.5 border-b border-slate-200 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-700">
              Pratinjau Lembar Tagihan Resmi (Faktur Air Industri)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Invoice Sheet */}
        <div id="printableInvoice" className="p-8 space-y-6 text-slate-800 overflow-y-auto bg-white font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#0055A5] pb-4">
            <div className="flex items-center gap-3">
              <AetraLogo className="h-10" />
              <div>
                <h1 className="text-base font-black text-[#0055A5] uppercase tracking-tight">
                  PT AETRA AIR TANGERANG
                </h1>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Pelayanan Air Bersih Pelanggan Industri & Komersial
                </p>
                <p className="text-[9px] text-slate-400">
                  Jl. Raya Serang Km 14, Cikupa, Kabupaten Tangerang, Banten 15710
                </p>
                <p className="text-[9px] text-slate-400">
                  NPWP: 02.822.415.7-418.000 · Call Center: (021) 596-8888
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-[#E6F0FA] text-[#0055A5] rounded-md font-black text-xs uppercase tracking-wider mb-1">
                FAKTUR REKENING AIR
              </div>
              <p className="font-mono text-[11px] font-bold text-slate-700">{invoiceNumber}</p>
              <p className="text-[10px] text-slate-500">
                Tanggal Terbit: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Technical Profile */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Kepada Yth. Pelanggan Industri:
              </p>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">{customer.nama}</h3>
              <p className="font-mono text-[11px] font-bold text-[#E86216]">ID: {customer.id}</p>
              <p className="text-slate-600 mt-0.5">{customer.lokasi || 'Kawasan Industri Kab. Tangerang'}</p>
              <p className="text-slate-500">Email: {customer.email}</p>
            </div>

            <div className="space-y-1 text-right sm:text-left sm:pl-8">
              <div className="flex justify-between">
                <span className="text-slate-500">Siklus Pembacaan:</span>
                <span className="font-bold text-[#0055A5]">{customer.cycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Golongan / Kelas:</span>
                <span className="font-bold">{customer.kelas} Industri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ukuran Pipa:</span>
                <span className="font-mono font-medium">{customer.diameterPipa || '100 mm (4")'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Periode Tagihan:</span>
                <span className="font-semibold">{customer.bulan}</span>
              </div>
            </div>
          </div>

          {/* Meter Reading Summary Table */}
          <div>
            <h4 className="text-xs font-extrabold text-[#0055A5] uppercase tracking-wider mb-2">
              Rincian Pembacaan Meter Air
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Stand Lalu (m³)</th>
                    <th className="p-2.5">Stand Sekarang (m³)</th>
                    <th className="p-2.5 text-right">Volume Pemakaian (m³)</th>
                    <th className="p-2.5 text-right">Tarif Dasar / m³</th>
                    <th className="p-2.5 text-right">Jumlah Biaya Air</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="p-2.5">{customer.lalu.toLocaleString()}</td>
                    <td className="p-2.5 font-bold">{customer.skrg.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-black text-[#E86216]">
                      {vol.toLocaleString()} m³
                    </td>
                    <td className="p-2.5 text-right">Rp {tarifPerM3.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      Rp {biayaAir.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                <span>Biaya Konsumsi Air:</span>
                <span className="font-mono font-bold">Rp {biayaAir.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                <span>Biaya Pemeliharaan Meter:</span>
                <span className="font-mono font-bold">Rp {biayaBebanPipa.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                <span>Bea Materai (Lunas):</span>
                <span className="font-mono font-bold">Rp {materai.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#0055A5] pt-1 border-t-2 border-[#0055A5]">
                <span>TOTAL PEMBAYARAN:</span>
                <span className="font-mono">Rp {totalTagihan.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions & Official Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-[#0055A5] text-[11px] mb-1">Rekening Pembayaran Resmi:</p>
              <p className="text-[10px] text-slate-700">Bank Mandiri Cabang Tangerang</p>
              <p className="font-mono font-bold text-xs text-slate-900">118-00-9988776-5</p>
              <p className="text-[10px] text-slate-600">a/n PT Aetra Air Tangerang</p>
              <p className="text-[9px] text-slate-400 mt-1">
                *Cantumkan ID Pelanggan ({customer.id}) pada berita transfer.
              </p>
            </div>

            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] text-slate-400">Tangerang, {new Date().toLocaleDateString('id-ID')}</p>
                <div className="w-24 h-16 my-1 border-b border-slate-300 relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center opacity-85 rotate-[-8deg] pointer-events-none">
                    <div className="border-2 border-[#0055A5] px-2 py-1 rounded text-[10px] font-black text-[#0055A5] uppercase">
                      LUNAS TERVERIFIKASI
                    </div>
                  </div>
                </div>
                <p className="font-bold text-[11px] text-slate-800">Pak Yaya</p>
                <p className="text-[9px] text-slate-400">Supervisor Billing & Invoicing</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[9px] text-slate-400 text-center pt-2">
            Dokumen ini merupakan bukti tagihan sah yang diterbitkan melalui Sistem SIMBA-IN PT Aetra Air Tangerang.
          </div>
        </div>
      </div>
    </div>
  );
};
