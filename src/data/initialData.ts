import { IndustryCustomer, AuditLog, UserProfile } from '../types';
import meterGaugeImg from '../assets/images/meter_industrial_gauge_1790243358407.jpg';
import bpmDocImg from '../assets/images/meter_bpm_document_1790243369057.jpg';

export const USER_PROFILES: Record<string, UserProfile> = {
  yaya: {
    role: 'yaya',
    name: 'Pak Yaya',
    title: 'Tim Billing & Invoicing',
    avatar: 'PY',
    division: 'Commercial & Billing Dept'
  },
  solihin: {
    role: 'solihin',
    name: 'Pak Solihin',
    title: 'Tim Meter Reading',
    avatar: 'PS',
    division: 'Field Operations & Meter Reading'
  },
  kabul: {
    role: 'kabul',
    name: 'Pak Kabul',
    title: 'Tim Meter Reading',
    avatar: 'PK',
    division: 'Field Operations & Meter Reading'
  }
};

export const INITIAL_CUSTOMERS: IndustryCustomer[] = [
  {
    id: 'IND-1001',
    nama: 'PT Krakatau Steel Industry',
    email: 'billing@krakatau.co.id',
    cycle: 'Cycle 1',
    kelas: 'Gold',
    lalu: 12500,
    skrg: 13200,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Pembacaan normal sesuai jadwal. Verifikasi fisik telah selesai.',
    history: [11800, 12100, 12300, 12500, 13200],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Kawasan Industri Manis, Jl. Manis Raya No. 12',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1002',
    nama: 'PT Indah Kiat Pulp & Paper',
    email: 'finance@indahkiat.co.id',
    cycle: 'Cycle 1',
    kelas: 'Premium',
    lalu: 45000,
    skrg: 47500,
    status: 'Invoiced',
    bulan: 'September 2026',
    catatan: 'Invoice telah dikirim ke finance@indahkiat.co.id via Outlook.',
    history: [41000, 42500, 43800, 45000, 47500],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Jl. Raya Serang Km. 18, Cikupa',
    diameterPipa: '150 mm (6 inch)'
  },
  {
    id: 'IND-1003',
    nama: 'PT Gajah Tunggal Tbk',
    email: 'acc@gajahtunggal.co.id',
    cycle: 'Cycle 2',
    kelas: 'Platinum',
    lalu: 21000,
    skrg: 21800,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Menunggu konfirmasi visual lapangan dan tandatangan BPM.',
    history: [19500, 20000, 20500, 21000, 21800],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Kawasan Industri Jatake, Blok A No. 3',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1004',
    nama: 'PT Torabika Eka Semesta (Mayora Group)',
    email: 'utility.finance@mayora.co.id',
    cycle: 'Cycle 2',
    kelas: 'Premium',
    lalu: 38200,
    skrg: 41200,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Fluktuasi konsumsi produksi minuman kopi dingin.',
    history: [35000, 36200, 37100, 38200, 41200],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Jl. Raya Serang Km 12.5, Bitung',
    diameterPipa: '150 mm (6 inch)'
  },
  {
    id: 'IND-1005',
    nama: 'PT Ching Luh Indonesia',
    email: 'tax.billing@chingluh.co.id',
    cycle: 'Cycle 3',
    kelas: 'Gold',
    lalu: 18400,
    skrg: 19150,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Stand meter telah dicatat oleh Pak Solihin.',
    history: [16900, 17400, 17900, 18400, 19150],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Jl. Raya Serang Km 16, Pasar Kemis',
    diameterPipa: '80 mm (3 inch)'
  },
  {
    id: 'IND-1006',
    nama: 'PT Surya Toto Indonesia Tbk',
    email: 'finance.utility@toto.co.id',
    cycle: 'Cycle 3',
    kelas: 'Silver',
    lalu: 9400,
    skrg: 9850,
    status: 'Invoiced',
    bulan: 'September 2026',
    catatan: 'Lunas verifikasi dan invoice terbit.',
    history: [8500, 8800, 9100, 9400, 9850],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Kawasan Industri Pasar Kemis Blok B',
    diameterPipa: '50 mm (2 inch)'
  },
  {
    id: 'IND-1007',
    nama: 'PT Charoen Pokphand Indonesia',
    email: 'ap.water@cp.co.id',
    cycle: 'Cycle 4',
    kelas: 'Platinum',
    lalu: 28900,
    skrg: 28900,
    status: 'Belum Dibaca',
    bulan: 'September 2026',
    catatan: 'Jadwal pembacaan hari ini untuk Cycle 4.',
    history: [26000, 27100, 28000, 28900],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Kawasan Industri Balaraja Industrial Estate',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1008',
    nama: 'PT Astra Otoparts Tbk - Divisi Winteq',
    email: 'purchasing@winteq-astra.co.id',
    cycle: 'Cycle 4',
    kelas: 'Gold',
    lalu: 15300,
    skrg: 15300,
    status: 'Belum Dibaca',
    bulan: 'September 2026',
    catatan: 'Menunggu petugas meter reading menuju lokasi.',
    history: [13800, 14200, 14750, 15300],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Jl. Raya Jakarta-Serang Km. 28, Balaraja',
    diameterPipa: '80 mm (3 inch)'
  },
  {
    id: 'IND-1009',
    nama: 'PT Multi Bintang Indonesia Tbk',
    email: 'accounting@multibintang.co.id',
    cycle: 'Cycle 5',
    kelas: 'Premium',
    lalu: 52000,
    skrg: 56300,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Lonjakan pemakaian terdeteksi (>4.000 m³), cek anomali pompa.',
    history: [46000, 48000, 50100, 52000, 56300],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Jl. Daan Mogot Km. 19, Tangerang',
    diameterPipa: '200 mm (8 inch)'
  },
  {
    id: 'IND-1010',
    nama: 'PT Japfa Comfeed Indonesia Tbk',
    email: 'finance@japfacomfeed.co.id',
    cycle: 'Cycle 5',
    kelas: 'Bronze',
    lalu: 6400,
    skrg: 6720,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Pembacaan terverifikasi.',
    history: [5800, 6000, 6200, 6400, 6720],
    fotoMeter: meterGaugeImg,
    fotoBPM: bpmDocImg,
    lokasi: 'Kawasan Industri Cikupa Mas Blok C',
    diameterPipa: '50 mm (2 inch)'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    time: '24 Sep 2026 08:30:12',
    user: 'Pak Yaya',
    role: 'Tim Billing & Invoicing',
    desc: 'Sistem SIMBA-IN diinisialisasi untuk periode Cycle September 2026.',
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
  }
];
