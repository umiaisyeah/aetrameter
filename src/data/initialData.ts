import { IndustryCustomer, AuditLog, UserProfile, MeterReader, CycleSchedule } from '../types';
import meterGaugeImg from '../assets/images/meter_industrial_gauge_1790243358407.jpg';
import bpmDocImg from '../assets/images/meter_bpm_document_1790243369057.jpg';

export const USER_PROFILES: Record<string, UserProfile> = {
  solihin: {
    role: 'solihin',
    name: 'Akhmad Solihin',
    title: 'Tim Meter Reading',
    avatar: 'AS',
    division: 'Commercial & Meter Reading Division',
    adminType: 'meter_reading'
  },
  kabul: {
    role: 'kabul',
    name: 'Kabul Nugroho',
    title: 'Tim Meter Reading',
    avatar: 'KN',
    division: 'Commercial & Meter Reading Division',
    adminType: 'meter_reading'
  },
  tri_kartono: {
    role: 'tri_kartono',
    name: 'Tri Kartono',
    title: 'Tim Meter Reading',
    avatar: 'TK',
    division: 'Commercial & Meter Reading Division',
    adminType: 'meter_reading'
  },
  bayu_pramono: {
    role: 'bayu_pramono',
    name: 'Bayu Pramono',
    title: 'Admin Key Account',
    avatar: 'BP',
    division: 'Key Account Industrial Division',
    adminType: 'key_account'
  },
  yaya: {
    role: 'yaya',
    name: 'Yaya Sunarya',
    title: 'Tim Billing & Invoicing',
    avatar: 'YS',
    division: 'Commercial & Billing Dept',
    adminType: 'billing'
  },
  melva_sinaga: {
    role: 'melva_sinaga',
    name: 'Melva Sinaga',
    title: 'Tim Billing & Invoicing',
    avatar: 'MS',
    division: 'Commercial & Billing Dept',
    adminType: 'billing'
  }
};

export const INITIAL_CUSTOMERS: IndustryCustomer[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    time: '24 Sep 2026 08:30:12',
    user: 'Pak Yaya',
    role: 'Tim Billing & Invoicing',
    desc: 'Sistem SIMBA (Sistem Integrasi Metering & Billing) diinisialisasi untuk periode Cycle September 2026.',
    type: 'info'
  },
  {
    id: 'log-2',
    time: '24 Sep 2026 09:14:05',
    user: 'Pak Solihin',
    role: 'Tim Meter Reading',
    desc: 'Verifikasi pembacaan fisik meteran PT Krakatau Steel (IND-1001) Stand 13.200 m³.',
    type: 'update'
  },
  {
    id: 'log-3',
    time: '24 Sep 2026 10:02:40',
    user: 'Pak Yaya',
    role: 'Tim Billing & Invoicing',
    desc: 'Invoice terbit & email terkirim untuk PT Indah Kiat Pulp & Paper (IND-1002).',
    type: 'invoice'
  },
  {
    id: 'log-4',
    time: '24 Sep 2026 11:15:20',
    user: 'Pak Kabul',
    role: 'Tim Meter Reading',
    desc: 'Memvalidasi plotting jadwal cycle 1–15 dan rute pembacaan meter industri.',
    type: 'info'
  },
  {
    id: 'log-5',
    time: '24 Sep 2026 14:30:10',
    user: 'Pak Kabul',
    role: 'Tim Meter Reading',
    desc: 'Rekapitulasi stand meter industri kawasan Cikupa dan koordinasi pembacaan lapangan.',
    type: 'update'
  },
  {
    id: 'log-6',
    time: '25 Sep 2026 08:20:45',
    user: 'Pak Kabul',
    role: 'Tim Meter Reading',
    desc: 'Sinkronisasi hasil pembacaan lapangan Cycle 1 dan Cycle 2 bersama Pak Solihin.',
    type: 'update'
  },
  {
    id: 'log-7',
    time: '25 Sep 2026 09:45:00',
    user: 'Pak Kabul',
    role: 'Tim Meter Reading',
    desc: 'Audit investigasi anomali volume industri pada akun PT Multi Bintang.',
    type: 'info'
  }
];

export const INITIAL_METER_READERS: MeterReader[] = [
  // 5 Petugas Key Account (PT Aetra Air Tangerang)
  {
    id: 'KA-001',
    nama: 'Anjarini Sukamto',
    password: 'ANJAR123',
    nip: 'AET-KA-2026-101',
    noHp: '0812-8821-4401',
    kategori: 'Key Account',
    perusahaan: 'PT Aetra Air Tangerang (Key Account)',
    assignedCycles: ['Cycle 1', 'Cycle 2', 'Cycle 3'],
    status: 'Aktif',
    email: 'anjarini.sukamto@aetratangerang.co.id',
    wilayah: 'Pelanggan Key Account & Kawasan Manis'
  },
  {
    id: 'KA-002',
    nama: 'Febriadi',
    password: 'FEBRI123',
    nip: 'AET-KA-2026-102',
    noHp: '0813-9932-5502',
    kategori: 'Key Account',
    perusahaan: 'PT Aetra Air Tangerang (Key Account)',
    assignedCycles: ['Cycle 4', 'Cycle 5', 'Cycle 6'],
    status: 'Aktif',
    email: 'febriadi@aetratangerang.co.id',
    wilayah: 'Pelanggan Key Account & Kawasan Jatake'
  },
  {
    id: 'KA-003',
    nama: 'Harsindi',
    password: 'SINDI123',
    nip: 'AET-KA-2026-103',
    noHp: '0857-1122-3344',
    kategori: 'Key Account',
    perusahaan: 'PT Aetra Air Tangerang (Key Account)',
    assignedCycles: ['Cycle 7', 'Cycle 8', 'Cycle 9'],
    status: 'Aktif',
    email: 'harsindi@aetratangerang.co.id',
    wilayah: 'Pelanggan Key Account & Pasar Kemis'
  },
  {
    id: 'KA-004',
    nama: 'Wahyu Hidayat',
    password: 'WAHYU123',
    nip: 'AET-KA-2026-104',
    noHp: '0811-9876-5432',
    kategori: 'Key Account',
    perusahaan: 'PT Aetra Air Tangerang (Key Account)',
    assignedCycles: ['Cycle 10', 'Cycle 11', 'Cycle 12'],
    status: 'Aktif',
    email: 'wahyu.hidayat@aetratangerang.co.id',
    wilayah: 'Pelanggan Strategis & Industri Premium'
  },
  {
    id: 'KA-005',
    nama: 'Yugo Apriadi',
    password: 'YUGO123',
    nip: 'AET-KA-2026-105',
    noHp: '0812-3456-7890',
    kategori: 'Key Account',
    perusahaan: 'PT Aetra Air Tangerang (Key Account)',
    assignedCycles: ['Cycle 13', 'Cycle 14', 'Cycle 15'],
    status: 'Aktif',
    email: 'yugo.apriadi@aetratangerang.co.id',
    wilayah: 'Pelanggan Prioritas & Industri Platinum'
  },

  // 2 Petugas Kontraktor (PT Hideco)
  {
    id: 'KONT-001',
    nama: 'Bambang Pamungkas',
    password: 'BAMBANG123',
    nip: 'AET-KONT-2026-001',
    noHp: '0812-7711-2233',
    kategori: 'Kontraktor (PT Hideco)',
    perusahaan: 'PT Hideco',
    assignedCycles: ['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4'],
    status: 'Aktif',
    email: 'bambang.pamungkas@hideco.co.id',
    wilayah: 'Kawasan Industri Manis & Balaraja'
  },
  {
    id: 'KONT-002',
    nama: 'Kevin Gideon',
    password: 'KEVIN123',
    nip: 'AET-KONT-2026-002',
    noHp: '0813-6644-5566',
    kategori: 'Kontraktor (PT Hideco)',
    perusahaan: 'PT Hideco',
    assignedCycles: ['Cycle 5', 'Cycle 6', 'Cycle 7', 'Cycle 8'],
    status: 'Aktif',
    email: 'kevin.gideon@hideco.co.id',
    wilayah: 'Kawasan Industri Bitung & Cikupa Mas'
  }
];

export const INITIAL_CYCLE_SCHEDULES: CycleSchedule[] = [
  {
    cycle: 'Cycle 1',
    bulan: 'September 2026',
    hariH: 7,
    tglPraBaca: 5,
    tglVerifikasi: 8,
    tglBilling: 9,
    tanggalMulai: '07 Sep 2026',
    tanggalSelesai: '08 Sep 2026',
    petugasUtama: 'Anjarini Sukamto',
    catatan: 'Kawasan Manis & Bitung'
  },
  {
    cycle: 'Cycle 2',
    bulan: 'September 2026',
    hariH: 8,
    tglPraBaca: 7,
    tglVerifikasi: 9,
    tglBilling: 10,
    tanggalMulai: '08 Sep 2026',
    tanggalSelesai: '09 Sep 2026',
    petugasUtama: 'Anjarini Sukamto',
    catatan: 'Kawasan Jatake & Jl. Serang'
  },
  {
    cycle: 'Cycle 3',
    bulan: 'September 2026',
    hariH: 9,
    tglPraBaca: 8,
    tglVerifikasi: 10,
    tglBilling: 11,
    tanggalMulai: '09 Sep 2026',
    tanggalSelesai: '10 Sep 2026',
    petugasUtama: 'Anjarini Sukamto',
    catatan: 'Kawasan Pasar Kemis Raya',
    adaPergeseran: true,
    hariHOriginal: 8,
    selisihHariPergeseran: 1,
    alasanPergeseran: 'Target Volume Industri',
    targetVolumeTambahanM3: 4500,
    keteranganPergeseran: 'Pergeseran H+1 hari untuk mengakomodasi akumulasi jam kerja shift pabrik demi pemenuhan target volume bulanan.'
  },
  {
    cycle: 'Cycle 4',
    bulan: 'September 2026',
    hariH: 10,
    tglPraBaca: 9,
    tglVerifikasi: 11,
    tglBilling: 12,
    tanggalMulai: '10 Sep 2026',
    tanggalSelesai: '11 Sep 2026',
    petugasUtama: 'Febriadi',
    catatan: 'Kawasan Balaraja & Pasar Kemis'
  },
  {
    cycle: 'Cycle 5',
    bulan: 'September 2026',
    hariH: 11,
    tglPraBaca: 10,
    tglVerifikasi: 12,
    tglBilling: 13,
    tanggalMulai: '11 Sep 2026',
    tanggalSelesai: '12 Sep 2026',
    petugasUtama: 'Febriadi',
    catatan: 'Kawasan Daan Mogot & Cikupa Mas'
  },
  {
    cycle: 'Cycle 6',
    bulan: 'September 2026',
    hariH: 14,
    tglPraBaca: 12,
    tglVerifikasi: 15,
    tglBilling: 16,
    tanggalMulai: '14 Sep 2026',
    tanggalSelesai: '15 Sep 2026',
    petugasUtama: 'Febriadi',
    catatan: 'Kawasan Jatake & Manis'
  },
  {
    cycle: 'Cycle 7',
    bulan: 'September 2026',
    hariH: 15,
    tglPraBaca: 14,
    tglVerifikasi: 16,
    tglBilling: 17,
    tanggalMulai: '15 Sep 2026',
    tanggalSelesai: '16 Sep 2026',
    petugasUtama: 'Harsindi',
    catatan: 'Kawasan Bitung & Serang'
  },
  {
    cycle: 'Cycle 8',
    bulan: 'September 2026',
    hariH: 18,
    tglPraBaca: 16,
    tglVerifikasi: 19,
    tglBilling: 20,
    tanggalMulai: '18 Sep 2026',
    tanggalSelesai: '19 Sep 2026',
    petugasUtama: 'Harsindi',
    catatan: 'Kawasan Jatake & Serang',
    adaPergeseran: true,
    hariHOriginal: 16,
    selisihHariPergeseran: 2,
    alasanPergeseran: 'Target Volume Industri',
    targetVolumeTambahanM3: 8200,
    keteranganPergeseran: 'Pergeseran H+2 hari untuk memaksimalkan capture meteran proses boiler kimia & utilitas demi pencapaian target volume kuartal.'
  },
  {
    cycle: 'Cycle 9',
    bulan: 'September 2026',
    hariH: 17,
    tglPraBaca: 16,
    tglVerifikasi: 18,
    tglBilling: 19,
    tanggalMulai: '17 Sep 2026',
    tanggalSelesai: '18 Sep 2026',
    petugasUtama: 'Harsindi',
    catatan: 'Kawasan Balaraja & Serang'
  },
  {
    cycle: 'Cycle 10',
    bulan: 'September 2026',
    hariH: 18,
    tglPraBaca: 17,
    tglVerifikasi: 19,
    tglBilling: 20,
    tanggalMulai: '18 Sep 2026',
    tanggalSelesai: '19 Sep 2026',
    petugasUtama: 'Wahyu Hidayat',
    catatan: 'Kawasan Daan Mogot & Manis'
  },
  {
    cycle: 'Cycle 11',
    bulan: 'September 2026',
    hariH: 21,
    tglPraBaca: 19,
    tglVerifikasi: 22,
    tglBilling: 23,
    tanggalMulai: '21 Sep 2026',
    tanggalSelesai: '22 Sep 2026',
    petugasUtama: 'Wahyu Hidayat',
    catatan: 'Kawasan Jatake & Cikupa Mas'
  },
  {
    cycle: 'Cycle 12',
    bulan: 'September 2026',
    hariH: 22,
    tglPraBaca: 21,
    tglVerifikasi: 23,
    tglBilling: 24,
    tanggalMulai: '22 Sep 2026',
    tanggalSelesai: '23 Sep 2026',
    petugasUtama: 'Wahyu Hidayat',
    catatan: 'Kawasan Serang & Jatake'
  },
  {
    cycle: 'Cycle 13',
    bulan: 'September 2026',
    hariH: 23,
    tglPraBaca: 22,
    tglVerifikasi: 24,
    tglBilling: 25,
    tanggalMulai: '23 Sep 2026',
    tanggalSelesai: '24 Sep 2026',
    petugasUtama: 'Yugo Apriadi',
    catatan: 'Kawasan Manis Pusat'
  },
  {
    cycle: 'Cycle 14',
    bulan: 'September 2026',
    hariH: 24,
    tglPraBaca: 23,
    tglVerifikasi: 25,
    tglBilling: 26,
    tanggalMulai: '24 Sep 2026',
    tanggalSelesai: '25 Sep 2026',
    petugasUtama: 'Yugo Apriadi',
    catatan: 'Kawasan MM2100 & Serang'
  },
  {
    cycle: 'Cycle 15',
    bulan: 'September 2026',
    hariH: 25,
    tglPraBaca: 24,
    tglVerifikasi: 26,
    tglBilling: 27,
    tanggalMulai: '25 Sep 2026',
    tanggalSelesai: '26 Sep 2026',
    petugasUtama: 'Yugo Apriadi',
    catatan: 'Kawasan Bandara Mas & Dadap'
  }
];
