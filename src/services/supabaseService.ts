import { getSupabaseClient } from './supabaseClient';
import { IndustryCustomer, MeterReader, CycleSchedule, AuditLog, WorkflowStatus } from '../types';

// Convert database snake_case row to IndustryCustomer
export const mapRowToCustomer = (row: any): IndustryCustomer => ({
  id: row.id,
  nama: row.nama,
  email: row.email,
  cycle: row.cycle,
  kelas: row.kelas,
  lalu: Number(row.lalu) || 0,
  skrg: Number(row.skrg) || 0,
  status: row.status as WorkflowStatus,
  bulan: row.bulan || 'September 2026',
  catatan: row.catatan || '',
  history: Array.isArray(row.history) ? row.history.map(Number) : [],
  fotoMeter: row.foto_meter || '',
  fotoBPM: row.foto_bpm || '',
  lokasi: row.lokasi || undefined,
  diameterPipa: row.diameter_pipa || undefined,
  petugasBaca: row.petugas_baca || undefined,
  kategoriPetugas: row.kategori_petugas || undefined
});

// Convert IndustryCustomer to database snake_case row
export const mapCustomerToRow = (c: IndustryCustomer) => ({
  id: c.id,
  nama: c.nama,
  email: c.email,
  cycle: c.cycle,
  kelas: c.kelas,
  lalu: c.lalu,
  skrg: c.skrg,
  status: c.status,
  bulan: c.bulan,
  catatan: c.catatan,
  history: c.history || [],
  foto_meter: c.fotoMeter || '',
  foto_bpm: c.fotoBPM || '',
  lokasi: c.lokasi || null,
  diameter_pipa: c.diameterPipa || null,
  petugas_baca: c.petugasBaca || null,
  kategori_petugas: c.kategoriPetugas || null
});

// Convert database row to MeterReader
export const mapRowToMeterReader = (row: any): MeterReader => ({
  id: row.id,
  nama: row.nama,
  nip: row.nip,
  noHp: row.no_hp || '',
  kategori: row.kategori,
  perusahaan: row.perusahaan,
  assignedCycles: Array.isArray(row.assigned_cycles) ? row.assigned_cycles : [],
  status: row.status || 'Aktif',
  email: row.email || undefined,
  wilayah: row.wilayah || undefined
});

// Convert MeterReader to database row
export const mapMeterReaderToRow = (r: MeterReader) => ({
  id: r.id,
  nama: r.nama,
  nip: r.nip,
  no_hp: r.noHp,
  kategori: r.kategori,
  perusahaan: r.perusahaan,
  assigned_cycles: r.assignedCycles,
  status: r.status,
  email: r.email || null,
  wilayah: r.wilayah || null
});

// Convert database row to CycleSchedule
export const mapRowToCycleSchedule = (row: any): CycleSchedule => ({
  cycle: row.cycle,
  bulan: row.bulan,
  hariH: Number(row.hari_h) || 7,
  tglPraBaca: row.tgl_pra_baca ? Number(row.tgl_pra_baca) : undefined,
  tglVerifikasi: row.tgl_verifikasi ? Number(row.tgl_verifikasi) : undefined,
  tglBilling: row.tgl_billing ? Number(row.tgl_billing) : undefined,
  tanggalMulai: row.tanggal_mulai || `07 ${row.bulan}`,
  tanggalSelesai: row.tanggal_selesai || `08 ${row.bulan}`,
  petugasUtama: row.petugas_utama || 'Petugas Lapangan',
  kategoriPetugas: row.kategori_petugas || undefined,
  catatan: row.catatan || '',
  targetPelanggan: row.target_pelanggan ? Number(row.target_pelanggan) : undefined
});

export const mapCycleScheduleToRow = (s: CycleSchedule) => ({
  cycle: s.cycle,
  bulan: s.bulan,
  hari_h: s.hariH,
  tgl_pra_baca: s.tglPraBaca || null,
  tgl_verifikasi: s.tglVerifikasi || null,
  tgl_billing: s.tglBilling || null,
  tanggal_mulai: s.tanggalMulai,
  tanggal_selesai: s.tanggalSelesai,
  petugas_utama: s.petugasUtama,
  kategori_petugas: s.kategoriPetugas || null,
  catatan: s.catatan || '',
  target_pelanggan: s.targetPelanggan || 0
});

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  tables?: { customers: number; readers: number; schedules: number; logs: number };
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL atau Anon Key belum dikonfigurasi.'
    };
  }

  try {
    const [custRes, readerRes, schedRes, logRes] = await Promise.all([
      client.from('industry_customers').select('id', { count: 'exact', head: true }),
      client.from('meter_readers').select('id', { count: 'exact', head: true }),
      client.from('cycle_schedules').select('id', { count: 'exact', head: true }),
      client.from('audit_logs').select('id', { count: 'exact', head: true })
    ]);

    if (custRes.error) throw new Error(`Tabel industry_customers: ${custRes.error.message}`);

    return {
      success: true,
      message: 'Koneksi ke backend Supabase berhasil!',
      tables: {
        customers: custRes.count || 0,
        readers: readerRes.count || 0,
        schedules: schedRes.count || 0,
        logs: logRes.count || 0
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke database Supabase.'
    };
  }
};

// ==============================================================================
// CRUD Services
// ==============================================================================

// Fetch all customers from Supabase
export const fetchSupabaseCustomers = async (): Promise<IndustryCustomer[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('industry_customers')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRowToCustomer);
  } catch (err) {
    console.error('Error fetching customers from Supabase:', err);
    return null;
  }
};

// Save / Upsert single customer
export const upsertSupabaseCustomer = async (customer: IndustryCustomer): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapCustomerToRow(customer);
    const { error } = await client.from('industry_customers').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving customer to Supabase:', err);
    return false;
  }
};

// Batch update customer status (e.g. from 1-Click Cycle Batch)
export const batchUpdateSupabaseStatus = async (
  ids: string[],
  status: WorkflowStatus,
  note?: string
): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client || ids.length === 0) return false;

  try {
    const payload: any = { status };
    if (note) payload.catatan = note;

    const { error } = await client
      .from('industry_customers')
      .update(payload)
      .in('id', ids);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error batch updating Supabase status:', err);
    return false;
  }
};

// Delete customer
export const deleteSupabaseCustomer = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('industry_customers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting customer from Supabase:', err);
    return false;
  }
};

// Fetch meter readers
export const fetchSupabaseMeterReaders = async (): Promise<MeterReader[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('meter_readers')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRowToMeterReader);
  } catch (err) {
    console.error('Error fetching meter readers from Supabase:', err);
    return null;
  }
};

// Upsert meter reader
export const upsertSupabaseMeterReader = async (reader: MeterReader): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapMeterReaderToRow(reader);
    const { error } = await client.from('meter_readers').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving meter reader to Supabase:', err);
    return false;
  }
};

// Delete meter reader
export const deleteSupabaseMeterReader = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('meter_readers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting meter reader from Supabase:', err);
    return false;
  }
};

// Fetch cycle schedules
export const fetchSupabaseCycleSchedules = async (): Promise<CycleSchedule[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('cycle_schedules')
      .select('*')
      .order('hari_h', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRowToCycleSchedule);
  } catch (err) {
    console.error('Error fetching cycle schedules from Supabase:', err);
    return null;
  }
};

// Upsert cycle schedules
export const upsertSupabaseCycleSchedules = async (schedules: CycleSchedule[]): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client || schedules.length === 0) return false;

  try {
    const rows = schedules.map(mapCycleScheduleToRow);
    const { error } = await client
      .from('cycle_schedules')
      .upsert(rows, { onConflict: 'cycle,bulan' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving cycle schedules to Supabase:', err);
    return false;
  }
};

// Fetch audit logs
export const fetchSupabaseAuditLogs = async (): Promise<AuditLog[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) throw error;
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      time: row.time,
      user: row.user,
      role: row.role,
      desc: row.desc,
      type: row.type as any
    }));
  } catch (err) {
    console.error('Error fetching audit logs from Supabase:', err);
    return null;
  }
};

// Insert audit log
export const insertSupabaseAuditLog = async (log: AuditLog): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('audit_logs').insert({
      id: log.id,
      time: log.time,
      user: log.user,
      role: log.role,
      desc: log.desc,
      type: log.type || 'info'
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error inserting audit log to Supabase:', err);
    return false;
  }
};

// One-click sync local data to Supabase
export const pushAllDataToSupabase = async (
  customers: IndustryCustomer[],
  meterReaders: MeterReader[],
  cycleSchedules: CycleSchedule[],
  auditLogs: AuditLog[]
): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client belum aktif.' };
  }

  try {
    // 1. Meter Readers
    const readerRows = meterReaders.map(mapMeterReaderToRow);
    const { error: readerErr } = await client.from('meter_readers').upsert(readerRows, { onConflict: 'id' });
    if (readerErr) throw new Error(`Gagal sync meter_readers: ${readerErr.message}`);

    // 2. Cycle Schedules
    const scheduleRows = cycleSchedules.map(mapCycleScheduleToRow);
    const { error: schedErr } = await client.from('cycle_schedules').upsert(scheduleRows, { onConflict: 'cycle,bulan' });
    if (schedErr) throw new Error(`Gagal sync cycle_schedules: ${schedErr.message}`);

    // 3. Industry Customers
    const customerRows = customers.map(mapCustomerToRow);
    const { error: custErr } = await client.from('industry_customers').upsert(customerRows, { onConflict: 'id' });
    if (custErr) throw new Error(`Gagal sync industry_customers: ${custErr.message}`);

    // 4. Audit Logs
    const logRows = auditLogs.map((l) => ({
      id: l.id,
      time: l.time,
      user: l.user,
      role: l.role,
      desc: l.desc,
      type: l.type || 'info'
    }));
    const { error: logErr } = await client.from('audit_logs').upsert(logRows, { onConflict: 'id' });
    if (logErr) throw new Error(`Gagal sync audit_logs: ${logErr.message}`);

    return {
      success: true,
      message: `Berhasil menyinkronkan ${customers.length} industri, ${meterReaders.length} pembaca meter, ${cycleSchedules.length} jadwal siklus, dan ${auditLogs.length} rekaman audit ke Supabase!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat sinkronisasi ke Supabase.'
    };
  }
};

// ==============================================================================
// Realtime Subscription Helper
// Petugas lapangan inputs readings on site -> Admin dashboard updates live!
// ==============================================================================
export const subscribeToFieldReaderUpdates = (
  onCustomerUpsert: (customer: IndustryCustomer) => void,
  onCustomerDelete: (id: string) => void,
  onNewAuditLog?: (log: AuditLog) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('simba-in-realtime-field')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'industry_customers' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const mapped = mapRowToCustomer(payload.new);
          onCustomerUpsert(mapped);
        } else if (payload.eventType === 'DELETE') {
          onCustomerDelete(payload.old.id);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      (payload) => {
        if (onNewAuditLog && payload.new) {
          onNewAuditLog({
            id: payload.new.id,
            time: payload.new.time,
            user: payload.new.user,
            role: payload.new.role,
            desc: payload.new.desc,
            type: payload.new.type
          });
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};
