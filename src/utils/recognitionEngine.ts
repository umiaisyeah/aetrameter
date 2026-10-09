import { IndustryCustomer, ReconciliationStatus, CcnbStatus } from '../types';

export interface RecognitionResult {
  meterStandOcr: number;
  bpmStandOcr: number;
  accuracy: number;
  status: ReconciliationStatus;
  isMatched: boolean;
  message: string;
  meterConfidence: number;
  bpmConfidence: number;
  timestamp: string;
}

/**
 * Simulasi OCR Engine untuk mengekstrak angka dari Foto Stand Meter dan Foto Dokumen BPM (Baris Angka Bulan Ini).
 * Menguji apakah kedua foto menghasilkan angka yang sama persis (100% matched) sebagai syarat verifikasi.
 */
export const runRecognitionAndReconciliation = (
  customer: IndustryCustomer,
  forcedStand?: number,
  forceMismatch: boolean = false
): RecognitionResult => {
  const baseStand = forcedStand !== undefined && forcedStand > 0 
    ? forcedStand 
    : customer.skrg > 0 
    ? customer.skrg 
    : customer.lalu + 450;

  let meterDetected: number;
  let bpmDetected: number;

  if (forceMismatch) {
    // Simulasi kasus tidak cocok (anomali foto/dokumen beda angka)
    meterDetected = baseStand;
    bpmDetected = baseStand + Math.floor(10 + Math.random() * 40); // Selisih puluhan m3
  } else if (customer.reconciliationStatus === 'Mismatch' && !forcedStand) {
    // Pertahankan mismatch jika data sebelumnya memang mismatch dan belum dikoreksi
    meterDetected = customer.meterStandOcr || baseStand;
    bpmDetected = customer.bpmStandOcr || (baseStand + 25);
  } else {
    // Normal / Matched: Keduanya sama persis
    meterDetected = baseStand;
    bpmDetected = baseStand;
  }

  const isMatched = meterDetected === bpmDetected;
  const status: ReconciliationStatus = isMatched ? 'Matched' : 'Mismatch';
  const meterConfidence = Math.floor(96 + Math.random() * 4);
  const bpmConfidence = Math.floor(95 + Math.random() * 5);
  const accuracy = Number(((meterConfidence + bpmConfidence) / 2).toFixed(1));

  const now = new Date();
  const timestamp = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

  const message = isMatched
    ? `✓ REKONSILIASI VALID: Angka pada Foto Stand Meter (${meterDetected.toLocaleString('id-ID')} m³) SAMA PERSIS dengan Angka Meter Bulan Ini di Foto BPM (${bpmDetected.toLocaleString('id-ID')} m³). Syarat verifikasi terpenuhi.`
    : `⚠️ REKONSILIASI GAGAL: Angka Foto Stand Meter (${meterDetected.toLocaleString('id-ID')} m³) BERBEDA dengan Angka Bulan Ini di Foto Dokumen BPM (${bpmDetected.toLocaleString('id-ID')} m³). Kedua angka wajib sama persis sebelum dapat diverifikasi!`;

  return {
    meterStandOcr: meterDetected,
    bpmStandOcr: bpmDetected,
    accuracy,
    status,
    isMatched,
    message,
    meterConfidence,
    bpmConfidence,
    timestamp
  };
};

/**
 * Format nomor batch CCnB resmi Aetra Tangerang
 */
export const generateCcnbBatchNumber = (customSeq?: number): string => {
  const seq = customSeq || Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const year = now.getFullYear();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const month = monthNames[now.getMonth()];
  return `CCNB-${year}-${month}-${seq}`;
};

/**
 * Format ID Akun CCnB Pelanggan
 */
export const generateCcnbAccountId = (customerId: string): string => {
  const cleanId = customerId.replace(/[^A-Za-z0-9]/g, '');
  return `CCNB-ACC-${cleanId}`;
};

/**
 * Format timestamp saat input ke sistem CCnB
 */
export const getFormattedCcnbTime = (): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
  return `${dateStr} ${timeStr}`;
};

/**
 * Aturan Bisnis: Pelanggan HANYA masuk ke section Billing & Invoicing
 * JIKA sudah diverifikasi oleh Meter Reading DAN sudah diinput ke CCnB (isInputCCnB === true atau status Invoiced)!
 */
export const isCustomerReadyForBilling = (customer: IndustryCustomer): boolean => {
  if (customer.status === 'Invoiced') return true;
  return customer.status === 'Verified' && Boolean(customer.isInputCCnB);
};

/**
 * Memeriksa apakah pelanggan adalah Verified tapi masih tertahan di antrean input CCnB
 */
export const isPendingCcnbInput = (customer: IndustryCustomer): boolean => {
  return customer.status === 'Verified' && !customer.isInputCCnB;
};
