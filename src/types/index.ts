export type AdminType = 'meter_reading' | 'key_account' | 'billing' | 'field_reader';

export type UserRole =
  | 'solihin'
  | 'kabul'
  | 'tri_kartono'
  | 'bayu_pramono'
  | 'yaya'
  | 'melva_sinaga'
  | 'field_reader';

export interface UserProfile {
  role: UserRole;
  name: string;
  title: string;
  avatar: string;
  division: string;
  adminType?: AdminType;
  readerId?: string;
  kategori?: string;
  perusahaan?: string;
}

export type CustomerClass = 'Premium' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export type WorkflowStatus = 'Belum Dibaca' | 'Pending Verification' | 'Verified' | 'Invoiced';

export type ReaderCategory = 'Kontraktor (PT Hideco)' | 'Key Account' | 'Kontraktor' | string;

export interface MeterReader {
  id: string;
  nama: string;
  nip: string;
  noHp: string;
  kategori: ReaderCategory;
  perusahaan: string;
  assignedCycles: string[];
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
  email?: string;
  wilayah?: string;
  joinDate?: string;
  password?: string;
}

export interface CycleSchedule {
  cycle: string;
  bulan: string; // e.g. 'September 2026' or 'Sep-26'
  hariH: number; // Day of month (1-31), e.g. 7 for Cycle 1 in Sep-26
  tanggalMulai: string;
  tanggalSelesai: string;
  petugasUtama: string;
  kategoriPetugas?: ReaderCategory;
  tglPraBaca?: number; // Pre-reading day
  tglVerifikasi?: number; // Verification day
  tglBilling?: number; // Invoicing day
  targetPelanggan?: number;
  catatan?: string;
  // Pergeseran Hari Baca untuk Pemenuhan Target Volume
  adaPergeseran?: boolean;
  hariHOriginal?: number;
  selisihHariPergeseran?: number; // e.g. +1, +2, -1
  keteranganPergeseran?: string; // Penjelasan pergeseran untuk pemenuhan target volume
  targetVolumeTambahanM3?: number;
  tanggalPergeseranBaru?: string;
  alasanPergeseran?: 'Target Volume Industri' | 'Penyesuaian Hari Kerja/Libur' | 'Maintenance Jaringan Pipa' | 'Permintaan Khusus Pelanggan' | 'Lainnya';
}

export interface IndustryCustomer {
  id: string;
  nama: string;
  email: string;
  cycle: string;
  kelas: CustomerClass;
  lalu: number;
  skrg: number;
  status: WorkflowStatus;
  bulan: string;
  catatan: string;
  history: number[];
  fotoMeter: string;
  fotoBPM: string;
  lokasi?: string;
  diameterPipa?: string;
  petugasBaca?: string;
  kategoriPetugas?: ReaderCategory;
  lokasiGps?: string;
  waktuBaca?: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  role: string;
  desc: string;
  type?: 'info' | 'update' | 'invoice' | 'delete' | 'import';
}
