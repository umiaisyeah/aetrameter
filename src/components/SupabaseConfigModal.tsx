import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Download,
  Code2,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../services/supabaseClient';
import {
  testSupabaseConnection,
  pushAllDataToSupabase,
  fetchSupabaseCustomers,
  fetchSupabaseMeterReaders,
  fetchSupabaseCycleSchedules,
  fetchSupabaseAuditLogs
} from '../services/supabaseService';
import { IndustryCustomer, MeterReader, CycleSchedule, AuditLog } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  auditLogs: AuditLog[];
  onDataLoadedFromSupabase?: (data: {
    customers: IndustryCustomer[];
    meterReaders: MeterReader[];
    cycleSchedules: CycleSchedule[];
    auditLogs: AuditLog[];
  }) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  customers,
  meterReaders,
  cycleSchedules,
  auditLogs,
  onDataLoadedFromSupabase
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'field_api' | 'sql'>('config');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tables?: any;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setTestResult(null);
      setSyncFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Mohon isi Supabase URL dan Anon Key terlebih dahulu.');
      return;
    }

    saveSupabaseConfig(url.trim(), anonKey.trim());
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(result);
  };

  const handleTestOnly = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(result);
  };

  const handleClear = () => {
    if (confirm('Yakin ingin memutuskan koneksi Supabase dan kembali ke penyimpanan lokal?')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      setSyncFeedback('Koneksi Supabase direset. Dashboard berjalan dengan penyimpanan data lokal.');
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await pushAllDataToSupabase(customers, meterReaders, cycleSchedules, auditLogs);
    setIsSyncing(false);
    setSyncFeedback(result.message);
    if (result.success) {
      handleTestOnly();
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const [fetchedCusts, fetchedReaders, fetchedSchedules, fetchedLogs] = await Promise.all([
        fetchSupabaseCustomers(),
        fetchSupabaseMeterReaders(),
        fetchSupabaseCycleSchedules(),
        fetchSupabaseAuditLogs()
      ]);

      if (fetchedCusts && onDataLoadedFromSupabase) {
        onDataLoadedFromSupabase({
          customers: fetchedCusts,
          meterReaders: fetchedReaders || meterReaders,
          cycleSchedules: fetchedSchedules || cycleSchedules,
          auditLogs: fetchedLogs || auditLogs
        });
        setSyncFeedback(`Berhasil memuat ${fetchedCusts.length} industri dan data terbaru langsung dari Supabase!`);
      } else {
        setSyncFeedback('Gagal mengambil data dari Supabase. Pastikan tabel sudah dibuat via schema.sql.');
      }
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const currentConfig = getSupabaseConfig();

  // Field reader cURL API snippet
  const sampleCurlSnippet = `curl -X PATCH "${url || 'https://xyzcompany.supabase.co'}/rest/v1/industry_customers?id=eq.IND-1001" \\
  -H "apikey: ${anonKey || 'YOUR_SUPABASE_ANON_KEY'}" \\
  -H "Authorization: Bearer ${anonKey || 'YOUR_SUPABASE_ANON_KEY'}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=minimal" \\
  -d '{
    "skrg": 13450,
    "status": "Pending Verification",
    "catatan": "Stand meter dicatat via aplikasi mobile petugas lapangan",
    "foto_meter": "https://storage.supabase.co/meter-photos/IND-1001-2026.jpg",
    "foto_bpm": "https://storage.supabase.co/bpm-docs/BPM-1001.jpg",
    "petugas_baca": "Nama Petugas Lapangan",
    "kategori_petugas": "Kontraktor"
  }'`;

  const sampleJsSnippet = `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${url || 'https://xyzcompany.supabase.co'}',
  '${anonKey || 'YOUR_SUPABASE_ANON_KEY'}'
);

// Petugas Lapangan Submit Stand Meter & Foto
export async function submitMeterReading(customerId, standSkrg, fotoUrl, fotoBpmUrl, readerName) {
  const { data, error } = await supabase
    .from('industry_customers')
    .update({
      skrg: standSkrg,
      status: 'Pending Verification',
      foto_meter: fotoUrl,
      foto_bpm: fotoBpmUrl,
      petugas_baca: readerName,
      catatan: \`Stand meter \${standSkrg} m³ dibaca oleh \${readerName}\`
    })
    .eq('id', customerId);

  return { data, error };
}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100 my-auto">
        {/* Header */}
        <div className="bg-[#003E78] dark:bg-slate-950 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Integrasi Backend Supabase</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Realtime
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Pusat data PostgreSQL cloud untuk menerima inputan langsung dari Petugas Lapangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 pt-2 text-xs font-bold gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-[#0055A5] text-[#0055A5] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Koneksi &amp; Status</span>
          </button>
          <button
            onClick={() => setActiveTab('field_api')}
            className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'field_api'
                ? 'border-[#0055A5] text-[#0055A5] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API Petugas Lapangan</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#0055A5] text-[#0055A5] dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Schema Supabase</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: KONEKSI & STATUS */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Connection Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 ${
                  currentConfig.isConfigured
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {currentConfig.isConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-xs">
                      {currentConfig.isConfigured
                        ? 'Supabase Backend Terhubung'
                        : 'Mode Standalone (Local Storage)'}
                    </h4>
                    <p className="text-[11px] opacity-90">
                      {currentConfig.isConfigured
                        ? `Host: ${currentConfig.url} (Realtime Active)`
                        : 'Masukkan Supabase Project URL dan Anon Key untuk menghubungkan live database cloud.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleTestOnly}
                    disabled={isTesting || !currentConfig.isConfigured}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-bold shadow-xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Tes Koneksi</span>
                  </button>
                  {currentConfig.isConfigured && (
                    <button
                      onClick={handleClear}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-100 rounded-lg font-semibold transition"
                    >
                      Putuskan
                    </button>
                  )}
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    testResult.success
                      ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <p>{testResult.message}</p>
                  {testResult.tables && (
                    <div className="grid grid-cols-4 gap-2 mt-2 font-mono text-[10px] text-center">
                      <div className="bg-white/60 dark:bg-black/30 p-1.5 rounded">
                        <div className="font-bold">{testResult.tables.customers}</div>
                        <div className="text-slate-500">Industri</div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/30 p-1.5 rounded">
                        <div className="font-bold">{testResult.tables.readers}</div>
                        <div className="text-slate-500">Pembaca</div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/30 p-1.5 rounded">
                        <div className="font-bold">{testResult.tables.schedules}</div>
                        <div className="text-slate-500">Jadwal</div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/30 p-1.5 rounded">
                        <div className="font-bold">{testResult.tables.logs}</div>
                        <div className="text-slate-500">Audit Log</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Input Credentials */}
              <form onSubmit={handleSave} className="space-y-3.5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dapat dilihat di Dashboard Supabase &rarr; Project Settings &rarr; API &rarr; Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kunci aman tingkat anonim publik (Project Settings &rarr; API &rarr; Project API keys &rarr; anon / public)
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-[#0055A5] hover:bg-[#003E78] text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <SaveIcon className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Menyimpan & Mengetes...' : 'Simpan & Hubungkan'}</span>
                  </button>
                </div>
              </form>

              {/* Data Sync Actions */}
              {currentConfig.isConfigured && (
                <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-3 bg-white dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sinkronisasi Data Dua Arah</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Unggah data awal SIMBA-IN ke Supabase atau tarik data terbaru yang diinput petugas.
                      </p>
                    </div>
                  </div>

                  {syncFeedback && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg text-[11px] font-semibold text-[#0055A5] dark:text-blue-300">
                      {syncFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={handlePushToSupabase}
                      disabled={isSyncing}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer text-left"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="leading-tight">Push Data Lokal ke Supabase</div>
                        <div className="text-[10px] font-normal text-emerald-100">
                          Unggah {customers.length} industri, {meterReaders.length} pembaca &amp; jadwal
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handlePullFromSupabase}
                      disabled={isSyncing}
                      className="p-3 bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer text-left"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="leading-tight">Tarik Data dari Supabase</div>
                        <div className="text-[10px] font-normal text-blue-100">
                          Ambil pembacaan terbaru dari petugas lapangan
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: API PETUGAS LAPANGAN */}
          {activeTab === 'field_api' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-300">
                <p className="font-bold text-[#0055A5] dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Petugas Lapangan &rarr; Supabase &rarr; Admin SIMBA-IN Realtime</span>
                </p>
                <p className="text-[11px] mt-1 leading-relaxed">
                  Petugas pembaca meter lapangan (Kontraktor Mitra &amp; Key Account) dapat menggunakan aplikasi mobile, Android, PWA, atau form web untuk mengirimkan stand meter langsung ke Supabase. Dashboard Admin ini akan menerima perubahannya secara instan melalui <strong>Supabase Realtime Channel</strong> tanpa perlu refresh halaman.
                </p>
              </div>

              {/* cURL Example */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-amber-500" />
                    <span>REST API Endpoint (cURL / HTTP)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleCurlSnippet, 'curl')}
                    className="text-[11px] text-[#0055A5] dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'curl' ? 'Tersalin!' : 'Salin cURL'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-700">
                  {sampleCurlSnippet}
                </pre>
              </div>

              {/* JS / TS Example */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>JavaScript / TypeScript / React Native Code</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleJsSnippet, 'js')}
                    className="text-[11px] text-[#0055A5] dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'js' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'js' ? 'Tersalin!' : 'Salin JS'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-700">
                  {sampleJsSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                    Skema Database PostgreSQL Supabase
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> pada dashboard proyek Supabase Anda.
                  </p>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1 text-[11px] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Supabase</span>
                </a>
              </div>

              <div className="relative">
                <button
                  onClick={() => copyToClipboard(SQL_SCHEMA_STRING, 'sql')}
                  className="absolute top-2.5 right-2.5 px-3 py-1 bg-[#0055A5] hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 text-[10px] transition cursor-pointer z-10"
                >
                  {copiedCode === 'sql' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'sql' ? 'SQL Tersalin!' : 'Salin Seluruh SQL'}</span>
                </button>
                <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[360px] overflow-y-auto leading-relaxed border border-slate-700 select-all">
                  {SQL_SCHEMA_STRING}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            File SQL dan panduan tersedia di folder <code>/supabase/schema.sql</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

const SQL_SCHEMA_STRING = `-- ==============================================================================
-- SIMBA-IN: Supabase PostgreSQL DDL
-- Jalankan di: Supabase Console -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: meter_readers
CREATE TABLE IF NOT EXISTS public.meter_readers (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    nip TEXT NOT NULL,
    no_hp TEXT,
    kategori TEXT NOT NULL CHECK (kategori IN ('Kontraktor', 'Key Account', 'Lainnya')),
    perusahaan TEXT NOT NULL,
    assigned_cycles TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cuti', 'Nonaktif')),
    email TEXT,
    wilayah TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: cycle_schedules
CREATE TABLE IF NOT EXISTS public.cycle_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle TEXT NOT NULL,
    bulan TEXT NOT NULL,
    hari_h INTEGER NOT NULL CHECK (hari_h BETWEEN 1 AND 31),
    tgl_pra_baca INTEGER,
    tgl_verifikasi INTEGER,
    tgl_billing INTEGER,
    tanggal_mulai TEXT,
    tanggal_selesai TEXT,
    petugas_utama TEXT,
    kategori_petugas TEXT,
    catatan TEXT,
    target_pelanggan INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cycle_bulan_unique UNIQUE (cycle, bulan)
);

-- 3. Table: industry_customers
CREATE TABLE IF NOT EXISTS public.industry_customers (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    cycle TEXT NOT NULL,
    kelas TEXT NOT NULL DEFAULT 'Gold',
    lalu NUMERIC NOT NULL DEFAULT 0,
    skrg NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Belum Dibaca' CHECK (status IN ('Belum Dibaca', 'Pending Verification', 'Verified', 'Invoiced')),
    bulan TEXT NOT NULL DEFAULT 'September 2026',
    catatan TEXT,
    history NUMERIC[] DEFAULT '{}',
    foto_meter TEXT DEFAULT '',
    foto_bpm TEXT DEFAULT '',
    lokasi TEXT,
    diameter_pipa TEXT,
    petugas_baca TEXT,
    kategori_petugas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    "user" TEXT NOT NULL,
    role TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security
ALTER TABLE public.industry_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access" ON public.industry_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access" ON public.meter_readers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access" ON public.cycle_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.industry_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meter_readers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cycle_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
`;
