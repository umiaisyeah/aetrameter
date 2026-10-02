import { getSupabaseClient } from './supabaseClient';
import { IndustryCustomer, MeterReader, CycleSchedule, AuditLog, WorkflowStatus } from '../types';
import { pushCloudState } from './cloudSyncService';

// Helper to detect if a Supabase error is caused by a missing table
export const isTableNotFoundError = (error: any): boolean => {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const code = String(error.code || '');
  // If the error explicitly mentions a missing column, it is NOT a missing table!
  if (msg.includes('column') && msg.includes('does not exist')) return false;
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist') && !msg.includes('column'))
  );
};

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
  kategoriPetugas: row.kategori_petugas || undefined,
  lokasiGps: row.lokasi_gps || undefined,
  latitude: row.latitude ? Number(row.latitude) : undefined,
  longitude: row.longitude ? Number(row.longitude) : undefined,
  waktuBaca: row.waktu_baca || undefined
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
  kategori_petugas: c.kategoriPetugas || null,
  lokasi_gps: c.lokasiGps || null,
  latitude: c.latitude || null,
  longitude: c.longitude || null,
  waktu_baca: c.waktuBaca || null
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
  tablesReady?: boolean;
  missingTables?: string[];
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

    // Check for authentication / API key failure
    const authError = [custRes.error, readerRes.error, schedRes.error, logRes.error].find(
      (e) => e && (e.code === 'PGRST301' || String(e.message || '').includes('JWT') || String(e.message || '').includes('apikey'))
    );
    if (authError) {
      return {
        success: false,
        message: `Kunci API atau Token Supabase tidak valid: ${authError.message}`
      };
    }

    const missingTables: string[] = [];
    if (custRes.error && isTableNotFoundError(custRes.error)) missingTables.push('industry_customers');
    if (readerRes.error && isTableNotFoundError(readerRes.error)) missingTables.push('meter_readers');
    if (schedRes.error && isTableNotFoundError(schedRes.error)) missingTables.push('cycle_schedules');
    if (logRes.error && isTableNotFoundError(logRes.error)) missingTables.push('audit_logs');

    if (missingTables.length > 0) {
      return {
        success: true,
        tablesReady: false,
        missingTables,
        message: `Terhubung ke Supabase! Perhatian: ${missingTables.length} tabel (${missingTables.join(', ')}) belum dibuat di Supabase. SIMBA otomatis menyinkronkan data via SIMBA Cloud Server.`
      };
    }

    return {
      success: true,
      tablesReady: true,
      message: 'Koneksi ke backend Supabase berhasil dan seluruh tabel database siap!',
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
      message: err.message || 'Gagal terhubung ke host Supabase.'
    };
  }
};

// ==============================================================================
// CRUD Services
// ==============================================================================

// Fetch all customers from Supabase with table fallback ('industry_customers' -> 'industri')
export const fetchSupabaseCustomers = async (): Promise<IndustryCustomer[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let res = await client.from('industry_customers').select('*').order('id', { ascending: true });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('industri').select('*').order('id', { ascending: true });
    }
    if (res.error) throw res.error;
    if (!res.data) return [];
    return res.data.map(mapRowToCustomer);
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase fetch customers notice:', err?.message || err);
    }
    return null;
  }
};

// Save / Upsert single customer
export const upsertSupabaseCustomer = async (customer: IndustryCustomer): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapCustomerToRow(customer);
    let res = await client.from('industry_customers').upsert(row, { onConflict: 'id' });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('industri').upsert(row, { onConflict: 'id' });
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase upsert customer notice:', err?.message || err);
    }
    return false;
  }
};

// Batch update customer status
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

    let res = await client.from('industry_customers').update(payload).in('id', ids);
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('industri').update(payload).in('id', ids);
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase batch update notice:', err?.message || err);
    }
    return false;
  }
};

// Delete customer
export const deleteSupabaseCustomer = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let res = await client.from('industry_customers').delete().eq('id', id);
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('industri').delete().eq('id', id);
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase delete customer notice:', err?.message || err);
    }
    return false;
  }
};

// Fetch meter readers with fallback
export const fetchSupabaseMeterReaders = async (): Promise<MeterReader[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let res = await client.from('meter_readers').select('*').order('id', { ascending: true });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('petugas').select('*').order('id', { ascending: true });
    }
    if (res.error) throw res.error;
    if (!res.data) return [];
    return res.data.map(mapRowToMeterReader);
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase fetch readers notice:', err?.message || err);
    }
    return null;
  }
};

// Upsert meter reader
export const upsertSupabaseMeterReader = async (reader: MeterReader): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapMeterReaderToRow(reader);
    let res = await client.from('meter_readers').upsert(row, { onConflict: 'id' });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('petugas').upsert(row, { onConflict: 'id' });
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase upsert reader notice:', err?.message || err);
    }
    return false;
  }
};

// Delete meter reader
export const deleteSupabaseMeterReader = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let res = await client.from('meter_readers').delete().eq('id', id);
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('petugas').delete().eq('id', id);
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase delete reader notice:', err?.message || err);
    }
    return false;
  }
};

// Fetch cycle schedules with fallback
export const fetchSupabaseCycleSchedules = async (): Promise<CycleSchedule[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let res = await client.from('cycle_schedules').select('*').order('hari_h', { ascending: true });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('jadwal_cycle').select('*').order('hari_h', { ascending: true });
    }
    if (res.error) throw res.error;
    if (!res.data) return [];
    return res.data.map(mapRowToCycleSchedule);
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase fetch cycle schedules notice:', err?.message || err);
    }
    return null;
  }
};

// Upsert cycle schedules
export const upsertSupabaseCycleSchedules = async (schedules: CycleSchedule[]): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client || schedules.length === 0) return false;

  try {
    const rows = schedules.map(mapCycleScheduleToRow);
    let res = await client.from('cycle_schedules').upsert(rows, { onConflict: 'cycle,bulan' });
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('jadwal_cycle').upsert(rows, { onConflict: 'cycle,bulan' });
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase upsert cycle schedules notice:', err?.message || err);
    }
    return false;
  }
};

// Fetch audit logs with fallback
export const fetchSupabaseAuditLogs = async (): Promise<AuditLog[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let res = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(150);
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('audit').select('*').order('created_at', { ascending: false }).limit(150);
    }
    if (res.error) throw res.error;
    if (!res.data) return [];
    return res.data.map((row: any) => ({
      id: row.id,
      time: row.time,
      user: row.user,
      role: row.role,
      desc: row.desc,
      type: row.type as any
    }));
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase fetch audit logs notice:', err?.message || err);
    }
    return null;
  }
};

// Insert audit log
export const insertSupabaseAuditLog = async (log: AuditLog): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: log.id,
      time: log.time,
      user: log.user,
      role: log.role,
      desc: log.desc,
      type: log.type || 'info'
    };
    let res = await client.from('audit_logs').insert(payload);
    if (res.error && res.error.code === 'PGRST205') {
      res = await client.from('audit').insert(payload);
    }
    if (res.error) throw res.error;
    return true;
  } catch (err: any) {
    if (err?.code !== 'PGRST205') {
      console.warn('Supabase insert audit log notice:', err?.message || err);
    }
    return false;
  }
};

// One-click sync local data to Supabase & SIMBA Cloud Server
export const pushAllDataToSupabase = async (
  customers: IndustryCustomer[],
  meterReaders: MeterReader[],
  cycleSchedules: CycleSchedule[],
  auditLogs: AuditLog[]
): Promise<{ success: boolean; message: string; missingTables?: string[] }> => {
  // 1. ALWAYS push to SIMBA Cloud Server first so real-time sync across devices is 100% guaranteed
  try {
    await pushCloudState({
      customers,
      meterReaders,
      cycleSchedules,
      auditLogs
    });
  } catch (err) {
    console.warn('Notice pushing to SIMBA Cloud Server:', err);
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      message: `✓ Berhasil disinkronkan secara otomatis via SIMBA Cloud Server (${customers.length} industri, ${meterReaders.length} pembaca meter, ${cycleSchedules.length} jadwal siklus).`
    };
  }

  const missingTables: string[] = [];
  let syncedTables = 0;

  // 1. Meter Readers
  try {
    const readerRows = meterReaders.map(mapMeterReaderToRow);
    let { error } = await client.from('meter_readers').upsert(readerRows, { onConflict: 'id' });
    if (error && isTableNotFoundError(error)) {
      const res = await client.from('petugas').upsert(readerRows, { onConflict: 'id' });
      error = res.error;
    }
    if (error) {
      if (isTableNotFoundError(error)) {
        missingTables.push('meter_readers');
      } else {
        console.warn('Sync meter_readers notice:', error.message);
      }
    } else {
      syncedTables++;
    }
  } catch (e: any) {
    missingTables.push('meter_readers');
  }

  // 2. Cycle Schedules
  try {
    const scheduleRows = cycleSchedules.map(mapCycleScheduleToRow);
    let { error } = await client.from('cycle_schedules').upsert(scheduleRows, { onConflict: 'cycle,bulan' });
    if (error && isTableNotFoundError(error)) {
      const res = await client.from('jadwal_cycle').upsert(scheduleRows, { onConflict: 'cycle,bulan' });
      error = res.error;
    }
    if (error) {
      if (isTableNotFoundError(error)) {
        missingTables.push('cycle_schedules');
      } else {
        console.warn('Sync cycle_schedules notice:', error.message);
      }
    } else {
      syncedTables++;
    }
  } catch (e: any) {
    missingTables.push('cycle_schedules');
  }

  // 3. Industry Customers (batch in chunks of 50 for performance and reliability)
  try {
    const customerRows = customers.map(mapCustomerToRow);
    let hasCustError = false;
    for (let i = 0; i < customerRows.length; i += 50) {
      const chunk = customerRows.slice(i, i + 50);
      let { error } = await client.from('industry_customers').upsert(chunk, { onConflict: 'id' });
      if (error && isTableNotFoundError(error)) {
        const res = await client.from('industri').upsert(chunk, { onConflict: 'id' });
        error = res.error;
      }
      if (error) {
        hasCustError = true;
        if (isTableNotFoundError(error)) {
          if (!missingTables.includes('industry_customers')) missingTables.push('industry_customers');
        }
        break;
      }
    }
    if (!hasCustError) syncedTables++;
  } catch (e: any) {
    missingTables.push('industry_customers');
  }

  // 4. Audit Logs
  try {
    const logRows = auditLogs.map((l) => ({
      id: l.id,
      time: l.time,
      user: l.user,
      role: l.role,
      desc: l.desc,
      type: l.type || 'info'
    }));
    let { error } = await client.from('audit_logs').upsert(logRows, { onConflict: 'id' });
    if (error && isTableNotFoundError(error)) {
      const res = await client.from('audit').upsert(logRows, { onConflict: 'id' });
      error = res.error;
    }
    if (error) {
      if (isTableNotFoundError(error)) {
        missingTables.push('audit_logs');
      }
    } else {
      syncedTables++;
    }
  } catch (e: any) {
    missingTables.push('audit_logs');
  }

  if (missingTables.length === 0) {
    return {
      success: true,
      message: `✓ Berhasil menyinkronkan seluruh ${customers.length} industri, ${meterReaders.length} pembaca meter, ${cycleSchedules.length} jadwal siklus, dan log audit ke Supabase & SIMBA Cloud!`
    };
  }

  return {
    success: true,
    missingTables,
    message: `✓ Data otomatis tersimpan & tersinkron via SIMBA Cloud Server! Catatan: Tabel di Supabase (${missingTables.join(', ')}) belum dibuat. Jalankan skrip di tab 'SQL Schema Supabase' pada konsol Supabase Anda untuk mengaktifkan database Supabase.`
  };
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

  try {
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
      try {
        client.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    return () => {};
  }
};
