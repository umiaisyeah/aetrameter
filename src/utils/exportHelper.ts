import * as XLSX from 'xlsx';
import { IndustryCustomer } from '../types';

export type ExportSection = 'verification' | 'billing' | 'monitoring' | 'all';

// Helper to format timestamps with seconds
const formatTimeSeconds = (cust: IndustryCustomer): string => {
  if (cust.status === 'Belum Dibaca') return 'Belum Dicatat';
  if (cust.waktuBacaTimestamp) {
    const d = new Date(cust.waktuBacaTimestamp);
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} WIB`;
    return `${dateStr} ${timeStr}`;
  }
  return cust.waktuBaca || cust.meterWaktuFoto || '30 Sep 2026 10:14:18 WIB';
};

// Export to Excel (.xlsx) using SheetJS
export const exportCustomersToExcel = (
  customers: IndustryCustomer[],
  section: ExportSection = 'all',
  customFileName?: string
) => {
  let rows: any[] = [];
  const timestamp = new Date().toISOString().slice(0, 10);

  if (section === 'verification') {
    // Verifikasi Reading specific columns (Fisik stand, tanggal baca dengan detik, petugas, volume)
    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      return {
        No: idx + 1,
        'ID Pelanggan': c.id,
        'Nama Industri': c.nama,
        'Tanggal & Waktu Baca (Detik)': formatTimeSeconds(c),
        'Petugas Pencatat Meter': c.petugasBaca || 'Akun Petugas Lapangan',
        'Siklus (Cycle)': c.cycle,
        'Golongan / Kelas': c.kelas,
        'Stand Lalu (m³)': c.lalu,
        'Stand Sekarang (m³)': c.status === 'Belum Dibaca' || !c.skrg ? 'Belum Dicatat' : c.skrg,
        'Volume Konsumsi (m³)': vol,
        'Status Alur Kerja': c.status,
        'Koordinat GPS': c.lokasiGps || `Lat: ${c.latitude || -6.187214}, Long: ${c.longitude || 106.541290}`,
        'Catatan Lapangan': c.catatan || ''
      };
    });
  } else if (section === 'billing') {
    // Billing & Invoicing specific columns (Faktur, Volume, Tagihan Air, Bea Materai, Total Tagihan)
    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      const tagihanAir = vol * 17872;
      const isMaterai = tagihanAir > 5000000;
      const materai = isMaterai ? 10000 : 0;
      const totalTagihan = tagihanAir + materai;

      return {
        No: idx + 1,
        'ID Pelanggan': c.id,
        'Nama Industri': c.nama,
        Email: c.email,
        'Siklus (Cycle)': c.cycle,
        'Golongan / Kelas': c.kelas,
        'Stand Lalu (m³)': c.lalu,
        'Stand Sekarang (m³)': c.status === 'Belum Dibaca' || !c.skrg ? 0 : c.skrg,
        'Volume Pemakaian (m³)': vol,
        'Tarif per m³ (Rp)': 17872,
        'Tagihan Air (Rp)': tagihanAir,
        'Bea Materai (Rp)': materai,
        'Total Tagihan Keseluruhan (Rp)': totalTagihan,
        'Status Faktur': c.status === 'Invoiced' ? 'Invoiced (Faktur Terbit)' : 'Siap Penerbitan Faktur',
        'Petugas Penerbit Invoice': c.invoicedBy || 'Tim Billing & Invoicing (Pak Yaya)',
        'Tanggal Penerbitan Faktur': c.invoicedAt || '-'
      };
    });
  } else {
    // Full Monitoring / Overview Columns
    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      const tagihanAir = vol * 17872;
      const isMaterai = tagihanAir > 5000000;
      const materai = isMaterai ? 10000 : 0;
      const totalTagihan = tagihanAir + materai;

      return {
        No: idx + 1,
        'ID Pelanggan': c.id,
        'Nama Industri': c.nama,
        Email: c.email,
        'Siklus (Cycle)': c.cycle,
        'Golongan / Kelas': c.kelas,
        'Tanggal & Waktu Baca (Detik)': formatTimeSeconds(c),
        'Petugas Pencatat Meter': c.petugasBaca || 'Akun Petugas Lapangan',
        'Stand Lalu (m³)': c.lalu,
        'Stand Sekarang (m³)': c.status === 'Belum Dibaca' || !c.skrg ? 'Belum Dicatat' : c.skrg,
        'Volume Konsumsi (m³)': vol,
        'Tagihan Air (Rp)': tagihanAir,
        'Bea Materai (Rp)': materai,
        'Total Tagihan (Rp)': totalTagihan,
        'Status Alur Kerja': c.status,
        'Catatan Lapangan': c.catatan || ''
      };
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  if (rows.length > 0) {
    const colKeys = Object.keys(rows[0]);
    worksheet['!cols'] = colKeys.map((key) => {
      let maxLen = key.length;
      rows.forEach((r) => {
        const val = r[key] != null ? String(r[key]) : '';
        if (val.length > maxLen) maxLen = Math.min(val.length, 45);
      });
      return { wch: Math.max(maxLen + 3, 10) };
    });
  }

  const workbook = XLSX.utils.book_new();
  const sheetName =
    section === 'verification'
      ? 'Verifikasi Reading'
      : section === 'billing'
      ? 'Billing & Invoicing'
      : 'Monitoring Meter';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const defaultFileName =
    section === 'verification'
      ? `Rekap_Verifikasi_Reading_Aetra_${timestamp}.xlsx`
      : section === 'billing'
      ? `Rekap_Billing_Invoicing_Aetra_${timestamp}.xlsx`
      : `Rekap_Monitoring_Meter_Aetra_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, customFileName || defaultFileName);
};

// Export to CSV format with UTF-8 BOM
export const exportCustomersToCsv = (
  customers: IndustryCustomer[],
  section: ExportSection = 'all',
  customFileName?: string
) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  let headers: string[] = [];
  let rows: string[][] = [];

  if (section === 'verification') {
    headers = [
      'No',
      'ID Pelanggan',
      'Nama Industri',
      'Tanggal & Waktu Baca (Detik)',
      'Petugas Pencatat Meter',
      'Siklus (Cycle)',
      'Golongan / Kelas',
      'Stand Lalu (m3)',
      'Stand Sekarang (m3)',
      'Volume Konsumsi (m3)',
      'Status Alur Kerja',
      'Koordinat GPS',
      'Catatan Lapangan'
    ];

    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      return [
        String(idx + 1),
        c.id,
        c.nama,
        formatTimeSeconds(c),
        c.petugasBaca || 'Akun Petugas Lapangan',
        c.cycle,
        c.kelas,
        String(c.lalu),
        c.status === 'Belum Dibaca' || !c.skrg ? 'Belum Dicatat' : String(c.skrg),
        String(vol),
        c.status,
        c.lokasiGps || `Lat: ${c.latitude || -6.187214}, Long: ${c.longitude || 106.541290}`,
        c.catatan || ''
      ];
    });
  } else if (section === 'billing') {
    headers = [
      'No',
      'ID Pelanggan',
      'Nama Industri',
      'Email',
      'Siklus (Cycle)',
      'Golongan / Kelas',
      'Stand Lalu (m3)',
      'Stand Sekarang (m3)',
      'Volume Pemakaian (m3)',
      'Tarif per m3 (Rp)',
      'Tagihan Air (Rp)',
      'Bea Materai (Rp)',
      'Total Tagihan Keseluruhan (Rp)',
      'Status Faktur',
      'Petugas Penerbit Invoice',
      'Tanggal Penerbitan Faktur'
    ];

    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      const tagihanAir = vol * 17872;
      const isMaterai = tagihanAir > 5000000;
      const materai = isMaterai ? 10000 : 0;
      const totalTagihan = tagihanAir + materai;

      return [
        String(idx + 1),
        c.id,
        c.nama,
        c.email,
        c.cycle,
        c.kelas,
        String(c.lalu),
        String(c.status === 'Belum Dibaca' || !c.skrg ? 0 : c.skrg),
        String(vol),
        '17872',
        String(tagihanAir),
        String(materai),
        String(totalTagihan),
        c.status === 'Invoiced' ? 'Invoiced (Faktur Terbit)' : 'Siap Penerbitan Faktur',
        c.invoicedBy || 'Tim Billing & Invoicing (Pak Yaya)',
        c.invoicedAt || '-'
      ];
    });
  } else {
    headers = [
      'No',
      'ID Pelanggan',
      'Nama Industri',
      'Email',
      'Siklus (Cycle)',
      'Golongan / Kelas',
      'Tanggal & Waktu Baca (Detik)',
      'Petugas Pencatat Meter',
      'Stand Lalu (m3)',
      'Stand Sekarang (m3)',
      'Volume Konsumsi (m3)',
      'Tagihan Air (Rp)',
      'Bea Materai (Rp)',
      'Total Tagihan (Rp)',
      'Status Alur Kerja',
      'Catatan Lapangan'
    ];

    rows = customers.map((c, idx) => {
      const vol = c.status === 'Belum Dibaca' || !c.skrg ? 0 : Math.max(0, c.skrg - c.lalu);
      const tagihanAir = vol * 17872;
      const isMaterai = tagihanAir > 5000000;
      const materai = isMaterai ? 10000 : 0;
      const totalTagihan = tagihanAir + materai;

      return [
        String(idx + 1),
        c.id,
        c.nama,
        c.email,
        c.cycle,
        c.kelas,
        formatTimeSeconds(c),
        c.petugasBaca || 'Akun Petugas Lapangan',
        String(c.lalu),
        c.status === 'Belum Dibaca' || !c.skrg ? 'Belum Dicatat' : String(c.skrg),
        String(vol),
        String(tagihanAir),
        String(materai),
        String(totalTagihan),
        c.status,
        c.catatan || ''
      ];
    });
  }

  const csvContent =
    '\uFEFF' +
    [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const defaultFileName =
    section === 'verification'
      ? `Rekap_Verifikasi_Reading_Aetra_${timestamp}.csv`
      : section === 'billing'
      ? `Rekap_Billing_Invoicing_Aetra_${timestamp}.csv`
      : `Rekap_Monitoring_Meter_Aetra_${timestamp}.csv`;

  link.setAttribute('download', customFileName || defaultFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
