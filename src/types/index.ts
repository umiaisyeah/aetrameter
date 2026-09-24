export type UserRole = 'yaya' | 'solihin' | 'kabul';

export interface UserProfile {
  role: UserRole;
  name: string;
  title: string;
  avatar: string;
  division: string;
}

export type CustomerClass = 'Premium' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export type WorkflowStatus = 'Belum Dibaca' | 'Pending Verification' | 'Verified' | 'Invoiced';

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
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  role: string;
  desc: string;
  type?: 'info' | 'update' | 'invoice' | 'delete' | 'import';
}
