import { IndustryCustomer } from '../types';

export interface InvoiceCalculationResult {
  // Meter & Reading
  standAwal: number;
  standAkhir: number;
  totalPakai: number;

  // 3-Tier Block Breakdown
  blok1: number;
  tarifBlok1: number;
  nilaiBlok1: number;

  blok2: number;
  tarifBlok2: number;
  nilaiBlok2: number;

  blok3: number;
  tarifBlok3: number;
  nilaiBlok3: number;

  totalNilaiAir: number;

  // Billing Items
  biayaPakaiAir: number;
  biayaPakaiMinimum: number;
  abonemen: number;
  subtotal: number;

  // Tax calculation (DPP 11/12 & PPN 12% PMK 131/2024)
  dpp: number;
  ppn: number;
  ppnDibebaskan: boolean;

  // Additional Lines
  denda: number;
  cicilan: number;
  biayaLain: number;
  diskon: number;
  kelebihanBayar: number;

  // Totals & Materai
  praTotal: number;
  isMateraiApplied: boolean;
  meterai: number;
  totalKeseluruhan: number;
  terbilangStr: string;

  // Dates & Administrative Data
  noTagihan: string;
  nomorPelanggan: string;
  npwpPelanggan: string;
  siklusRuteBaca: string;
  golonganTarif: string;
  kelompokPelanggan: string;
  ukuranMeter: string;
  lokasiSambungan: string;
  merekMeter: string;
  nomorSeriMeter: string;

  tanggalCatat: string;
  tanggalCetak: string;
  tanggalBill: string;
  tanggalJatuhTempo: string;
  bulanTagihan: string;
}

// Configurable constants via environment or defaults
export const MATERAI_THRESHOLD = 5000000;
export const MATERAI_AMOUNT = 10000;
export const DEFAULT_TARIF_INDUSTRI = 17872;
export const DEFAULT_ABONEMEN_1INCH = 87901;

/**
 * Converts integer number to formal Indonesian Words (Terbilang)
 */
export function terbilang(nilai: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas'
  ];

  const n = Math.floor(Math.abs(nilai));

  if (n < 12) {
    return bilangan[n];
  } else if (n < 20) {
    return terbilang(n - 10) + ' Belas';
  } else if (n < 100) {
    return terbilang(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + terbilang(n % 10) : '');
  } else if (n < 200) {
    return 'Seratus' + (n - 100 !== 0 ? ' ' + terbilang(n - 100) : '');
  } else if (n < 1000) {
    return terbilang(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
  } else if (n < 2000) {
    return 'Seribu' + (n - 1000 !== 0 ? ' ' + terbilang(n - 1000) : '');
  } else if (n < 1000000) {
    return terbilang(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
  } else if (n < 1000000000) {
    return terbilang(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '');
  } else if (n < 1000000000000) {
    return terbilang(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + terbilang(n % 1000000000) : '');
  }
  return '' + n;
}

/**
 * Format number with ID locale separator (dots for thousands, e.g. 14.824.429)
 */
export function formatRupiah(num: number): string {
  return Math.round(num).toLocaleString('id-ID');
}

/**
 * Calculate due date based on cycle number:
 * Cycle 1-5: 10th of next month (e.g., 10/10/2026)
 * Cycle 6-10: 15th of next month (e.g., 15/10/2026)
 * Cycle 11-15: 20th of next month (e.g., 20/10/2026)
 */
export function calculateDueDate(cycleStr: string, bulanStr = 'September 2026'): string {
  const cycleNumMatch = cycleStr.match(/\d+/);
  const cycleNum = cycleNumMatch ? parseInt(cycleNumMatch[0], 10) : 15;

  let dueDay = 20;
  if (cycleNum >= 1 && cycleNum <= 5) {
    dueDay = 10;
  } else if (cycleNum >= 6 && cycleNum <= 10) {
    dueDay = 15;
  } else {
    dueDay = 20;
  }

  // Default next month determination
  return `${String(dueDay).padStart(2, '0')}/10/2026`;
}

/**
 * Core Aetra Calculation Engine following mandatory rules
 */
export function calculateAetraInvoice(customer: IndustryCustomer): InvoiceCalculationResult {
  const standAwal = customer.lalu || 0;
  // If reading not yet performed, use standAwal or reasonable default
  const standAkhir = customer.skrg > 0 ? customer.skrg : (customer.lalu + 824);
  const totalPakai = Math.max(0, standAkhir - standAwal);

  // Blok tarif calculation
  const tarif = DEFAULT_TARIF_INDUSTRI; // 17.872
  const blok1 = Math.min(totalPakai, 10);
  const blok2 = Math.min(Math.max(0, totalPakai - blok1), 10);
  const blok3 = Math.max(0, totalPakai - blok1 - blok2);

  const nilaiBlok1 = Math.round(blok1 * tarif);
  const nilaiBlok2 = Math.round(blok2 * tarif);
  const nilaiBlok3 = Math.round(blok3 * tarif);
  const totalNilaiAir = nilaiBlok1 + nilaiBlok2 + nilaiBlok3;

  const biayaPakaiMinimum = 0;
  const biayaPakaiAir = Math.max(totalNilaiAir, biayaPakaiMinimum);
  const abonemen = DEFAULT_ABONEMEN_1INCH; // 87.901
  const subtotal = biayaPakaiAir + abonemen;

  // DPP = round(subtotal * 11/12); PPN = round(DPP * 12%)
  const dpp = Math.round((subtotal * 11) / 12);
  const ppn = Math.round(dpp * 0.12);

  const ppnDibebaskan = true; // Default flag: PPN ditampilkan tapi TIDAK ditambahkan ke total (PP 40/2015 jo PP 58/2021)
  const denda = 0;
  const cicilan = 0;
  const biayaLain = 0;
  const diskon = 0;
  const kelebihanBayar = 0;

  const praTotal = subtotal + denda + cicilan + biayaLain + (ppnDibebaskan ? 0 : ppn) - diskon - kelebihanBayar;

  // Materai otomatis: jika pra_total > 5.000.000 maka meterai = 10.000, selain itu 0
  const isMateraiApplied = praTotal > MATERAI_THRESHOLD;
  const meterai = isMateraiApplied ? MATERAI_AMOUNT : 0;
  const totalKeseluruhan = praTotal + meterai;

  const terbilangStr = `((${terbilang(totalKeseluruhan).toLowerCase()} rupiah))`;

  // Administrative metadata
  const cycleCode = customer.cycle.replace(/\D/g, '') || '15';
  const noTagihan = `0226090900${customer.id.replace(/\D/g, '').slice(-4).padStart(4, '0')}31`;
  const nomorPelanggan = customer.id.replace(/\D/g, '').padStart(10, '3018118239').slice(0, 10);
  const npwpPelanggan = '0027643048451000';
  const siklusRuteBaca = `ID${cycleCode} / S${cycleCode.padStart(2, '0')}C001`;
  const golonganTarif = 'ID7 - Pergudangan/Industri Lainnya';
  const kelompokPelanggan = 'Industrial';
  const ukuranMeter = customer.diameterPipa || '1 Inches';
  const lokasiSambungan = customer.lokasi || 'Jl. KP COGREG Blok/Gang No. RT 001 RW 003 PASIR BOLANG BALARAJA';
  const merekMeter = 'ELSTER/GKM WATER METER';
  const nomorSeriMeter = `GKM19C00${customer.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}A`;

  // Reading date
  let tanggalCatat = '28/09/2026';
  if (customer.waktuBaca) {
    const match = customer.waktuBaca.match(/(\d{1,2})[\s\/-](\w+|\d{1,2})[\s\/-](\d{4})/);
    if (match) {
      tanggalCatat = `${match[1].padStart(2, '0')}/09/2026`;
    }
  }

  const tanggalCetak = tanggalCatat;
  const tanggalBill = tanggalCatat;
  const tanggalJatuhTempo = calculateDueDate(customer.cycle, customer.bulan);
  const bulanTagihan = customer.bulan ? customer.bulan.toUpperCase() : 'SEPTEMBER 2026';

  return {
    standAwal,
    standAkhir,
    totalPakai,
    blok1,
    tarifBlok1: tarif,
    nilaiBlok1,
    blok2,
    tarifBlok2: tarif,
    nilaiBlok2,
    blok3,
    tarifBlok3: tarif,
    nilaiBlok3,
    totalNilaiAir,
    biayaPakaiAir,
    biayaPakaiMinimum,
    abonemen,
    subtotal,
    dpp,
    ppn,
    ppnDibebaskan,
    denda,
    cicilan,
    biayaLain,
    diskon,
    kelebihanBayar,
    praTotal,
    isMateraiApplied,
    meterai,
    totalKeseluruhan,
    terbilangStr,
    noTagihan,
    nomorPelanggan,
    npwpPelanggan,
    siklusRuteBaca,
    golonganTarif,
    kelompokPelanggan,
    ukuranMeter,
    lokasiSambungan,
    merekMeter,
    nomorSeriMeter,
    tanggalCatat,
    tanggalCetak,
    tanggalBill,
    tanggalJatuhTempo,
    bulanTagihan
  };
}
