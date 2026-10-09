import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MeterReader, IndustryCustomer, ReaderCategory } from '../types';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Check,
  Trash2,
  Edit2,
  Shield,
  Building2,
  Building,
  Briefcase,
  FileSpreadsheet,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { showColorfulAlert, showToast } from '../utils/notificationSystem';
import {
  getAssignedCustomersForReader,
  getAssignedCyclesForReader,
  sortCyclesNaturally,
  getReaderCategory,
  getReaderCompany
} from '../utils/readerAssignmentHelper';

interface MeterReaderManagementSectionProps {
  meterReaders: MeterReader[];
  customers: IndustryCustomer[];
  onAddMeterReader: (reader: MeterReader) => void;
  onUpdateMeterReader: (reader: MeterReader) => void;
  onDeleteMeterReader: (id: string) => void;
}

export const MeterReaderManagementSection: React.FC<MeterReaderManagementSectionProps> = ({
  meterReaders,
  customers,
  onAddMeterReader,
  onUpdateMeterReader,
  onDeleteMeterReader
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingReader, setEditingReader] = useState<MeterReader | null>(null);
  const [deletingReader, setDeletingReader] = useState<MeterReader | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterCycle, setFilterCycle] = useState<string>('ALL');
  const [expandedReaders, setExpandedReaders] = useState<Record<string, boolean>>({});

  const toggleExpandReader = (readerId: string) => {
    setExpandedReaders((prev) => ({
      ...prev,
      [readerId]: !prev[readerId]
    }));
  };

  // Form states (perusahaan & wilayah removed as requested)
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [nip, setNip] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [kategori, setKategori] = useState<ReaderCategory>('Kontraktor (PT Hideco)');
  const [status, setStatus] = useState<'Aktif' | 'Cuti' | 'Nonaktif'>('Aktif');
  const [assignedCycles, setAssignedCycles] = useState<string[]>([]);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  const sortCycles = (cycles: string[]): string[] => {
    return [...cycles].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Petugas': 'Pak Joko Widodo',
        'NIP': 'AET-KONT-2026-001',
        'No HP': '0812-8821-4401',
        'Kategori': 'Kontraktor (PT Hideco)',
        'Penugasan Cycle': 'Cycle 1, Cycle 2, Cycle 3',
        'Email': 'joko.meter@hideco.co.id',
        'Status': 'Aktif'
      },
      {
        'Nama Petugas': 'Pak Dani Permana',
        'NIP': 'AET-KA-2026-101',
        'No HP': '0811-9876-5432',
        'Kategori': 'Key Account',
        'Penugasan Cycle': 'Cycle 1, Cycle 2, Cycle 3, Cycle 4, Cycle 5',
        'Email': 'dani.permana@aetratangerang.co.id',
        'Status': 'Aktif'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PetugasPembacaMeter');
    XLSX.writeFile(wb, 'Template_Petugas_Pembaca_Meter_Aetra.xlsx');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName]);

        if (!rows || rows.length === 0) {
          showColorfulAlert({
            title: 'File Excel Kosong',
            message: 'File Excel yang dipilih tidak memiliki baris data petugas pembaca meter.',
            type: 'warning',
            badge: 'FILE KOSONG'
          });
          return;
        }

        let updatedCount = 0;
        let createdCount = 0;

        rows.forEach((row, idx) => {
          const rawName = row['Nama Petugas'] || row['Nama'] || row['nama'] || row['Petugas'] || row['nama_petugas'];
          if (!rawName || String(rawName).trim() === '') return;

          const readerName = String(rawName).trim();
          const rawNip = row['NIP'] || row['nip'] || row['ID'] || `RDR-MR-${100 + idx}`;
          const rawHp = row['No HP'] || row['noHp'] || row['Telepon'] || row['hp'] || '0812-0000-0000';
          const rawKat = String(row['Kategori'] || row['kategori'] || '').toLowerCase();
          const isKeyAccount = rawKat.includes('key') || rawKat.includes('aetra');
          const kategoriVal: ReaderCategory = isKeyAccount ? 'Key Account' : 'Kontraktor (PT Hideco)';
          const perusahaanVal = isKeyAccount ? 'PT Aetra Air Tangerang (Key Account)' : 'PT Hideco';

          // Parse cycle assignment
          const rawCycles = String(row['Penugasan Cycle'] || row['Cycle'] || row['assignedCycles'] || row['siklus'] || '');
          let cyclesList: string[] = [];
          if (rawCycles.trim()) {
            cyclesList = rawCycles
              .split(/[,;\n]+/)
              .map((c) => c.trim())
              .filter((c) => c.length > 0)
              .map((c) => (c.toLowerCase().startsWith('cycle') ? c : `Cycle ${c.replace(/\D/g, '')}`));
          }
          if (cyclesList.length === 0) {
            cyclesList = [];
          }

          const rawEmail = row['Email'] || row['email'] || `${readerName.toLowerCase().replace(/[^a-z]/g, '')}@${isKeyAccount ? 'aetratangerang.co.id' : 'hideco.co.id'}`;
          const rawStatus = (row['Status'] || row['status'] || 'Aktif') as 'Aktif' | 'Cuti' | 'Nonaktif';

          // Check if reader already exists
          const existing = meterReaders.find(
            (r) => r.nama.toLowerCase().trim() === readerName.toLowerCase() || r.nip.toLowerCase().trim() === String(rawNip).toLowerCase().trim()
          );

          if (existing) {
            // Merge cycles
            const mergedCycles = Array.from(new Set([...existing.assignedCycles, ...cyclesList]));
            onUpdateMeterReader({
              ...existing,
              nip: String(rawNip),
              noHp: String(rawHp),
              email: String(rawEmail),
              kategori: kategoriVal,
              perusahaan: perusahaanVal,
              status: rawStatus,
              assignedCycles: mergedCycles
            });
            updatedCount++;
          } else {
            const newR: MeterReader = {
              id: `${isKeyAccount ? 'KA' : 'HDC'}-${Date.now().toString().slice(-4)}${idx}`,
              nama: readerName,
              nip: String(rawNip),
              noHp: String(rawHp),
              kategori: kategoriVal,
              perusahaan: perusahaanVal,
              assignedCycles: cyclesList,
              status: rawStatus,
              email: String(rawEmail)
            };
            onAddMeterReader(newR);
            createdCount++;
          }
        });

        showColorfulAlert({
          title: 'Sinkronisasi Petugas Selesai! 🎉',
          subtitle: 'Impor & Pembaruan Data Petugas Pembaca Meter',
          message: `Sinkronisasi Excel petugas pembaca meter berhasil dilakukan. Sebanyak ${createdCount} petugas baru berhasil didaftarkan dan ${updatedCount} petugas berhasil diperbarui data & siklus penugasannya.`,
          type: 'success',
          badge: 'PETUGAS TERSINKRON',
          count: createdCount + updatedCount,
          details: [
            `${createdCount} petugas baru berhasil ditambahkan`,
            `${updatedCount} data petugas berhasil diperbarui`,
            'Otomatis terhubung ke jadwal rute catat meter'
          ],
          confirmText: 'Lihat Daftar Petugas'
        });
      } catch (err) {
        console.error(err);
        showColorfulAlert({
          title: 'Gagal Mengimpor File Excel',
          message: 'Pastikan format file .xlsx atau .xls valid dan tidak terkunci/rusak.',
          type: 'error',
          badge: 'IMPORT GAGAL'
        });
      }
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleToggleCycle = (cycle: string) => {
    setAssignedCycles((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  };

  const handleToggleAllCycles = () => {
    if (assignedCycles.length === allCycles.length) {
      setAssignedCycles([]);
    } else {
      setAssignedCycles([...allCycles]);
    }
  };

  const handleSaveNewReader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      showColorfulAlert({
        title: 'Data Belum Lengkap',
        message: 'Mohon isi Nama Petugas Pembaca Meter sebelum menyimpan!',
        type: 'warning',
        badge: 'INPUT WAJIB'
      });
      return;
    }

    const perusahaan =
      kategori === 'Key Account'
        ? 'PT Aetra Air Tangerang (Key Account)'
        : 'PT Hideco';

    const defaultPass = `${nama.trim().split(' ')[0].toUpperCase()}123`;
    const newReader: MeterReader = {
      id: `${kategori === 'Key Account' ? 'KA' : 'HDC'}-${Date.now().toString().slice(-4)}`,
      nama: nama.trim(),
      password: password.trim().toUpperCase() || defaultPass,
      nip: nip.trim() || `MR-${Date.now().toString().slice(-4)}`,
      noHp: noHp.trim() || '0812-0000-0000',
      email: email.trim() || `${nama.toLowerCase().replace(/[^a-z0-9]/g, '')}@${kategori === 'Key Account' ? 'aetratangerang.co.id' : 'hideco.co.id'}`,
      kategori,
      perusahaan,
      status,
      assignedCycles: assignedCycles
    };

    onAddMeterReader(newReader);
    // Reset
    setNama('');
    setPassword('');
    setNip('');
    setNoHp('');
    setEmail('');
    setKategori('Kontraktor (PT Hideco)');
    setAssignedCycles([]);
    setShowAddForm(false);
    showColorfulAlert({
      title: 'Petugas Berhasil Didaftarkan! 👤',
      message: `Petugas lapangan ${newReader.nama} (${newReader.kategori}) berhasil didaftarkan ke sistem SIMBA dengan ID ${newReader.id}.`,
      type: 'success',
      badge: 'REGISTRASI BERHASIL'
    });
  };

  const handleSaveEditReader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReader) return;

    const autoPerusahaan =
      editingReader.kategori === 'Key Account'
        ? 'PT Aetra Air Tangerang (Key Account)'
        : 'PT Hideco';

    onUpdateMeterReader({
      ...editingReader,
      perusahaan: autoPerusahaan
    });
    setEditingReader(null);
    showToast({
      title: 'Data Petugas Diperbarui',
      message: `Data petugas ${editingReader.nama} berhasil diperbarui!`,
      type: 'success'
    });
  };

  const filteredReaders = meterReaders.filter((r) => {
    // 1. Category filter strictly: 1 person = 1 role
    let matchCategory = true;
    if (filterCategory === 'Kontraktor') {
      matchCategory = getReaderCategory(r.nama) === 'Kontraktor (PT Hideco)';
    } else if (filterCategory === 'Key Account') {
      matchCategory = getReaderCategory(r.nama) === 'Key Account';
    }

    if (!matchCategory) return false;

    // 2. Cycle assignment filter (Strictly based on inputted data with zero overlap)
    if (filterCycle !== 'ALL') {
      const assignedCyclesForR = getAssignedCyclesForReader(r, customers);
      const hasCycle = assignedCyclesForR.some((c) => c.toLowerCase() === filterCycle.toLowerCase());
      if (!hasCycle) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#E86216]">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base">
                Manajemen Petugas Pembaca Meter Lapangan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola data petugas pembaca meter lapangan, penugasan perusahaan/instansi, serta wilayah operasi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={excelFileInputRef}
            onChange={handleExcelImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => excelFileInputRef.current?.click()}
            className="bg-[#0055A5] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Sinkronisasi otomatis daftar nama petugas pembaca meter & siklus via Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor Petugas Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Unduh format template Excel untuk impor data petugas"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template</span>
          </button>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-[#E86216] hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Tutup Form' : 'Tambah Petugas'}</span>
          </button>
        </div>
      </div>

      {/* Role Notice */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
        <Briefcase className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0 mt-0.5" />
        <p>
          <strong>Catatan Pembagian Tugas:</strong> <em>Pak Solihin</em> &amp; <em>Pak Kabul</em> bertindak sebagai <strong>Tim Meter Reading</strong> di kantor yang bertugas menginput cycle dan mengelola list industri. Pembaca meter fisik di lapangan dilakukan oleh petugas lapangan yang didaftarkan pada halaman ini.
        </p>
      </div>

      {/* Filter Section: Category & Cycle */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300">Filter Kategori:</span>
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterCategory === 'ALL'
                ? 'bg-[#0055A5] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua ({meterReaders.length})
          </button>
          <button
            onClick={() => setFilterCategory('Kontraktor')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              filterCategory === 'Kontraktor'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>
              Kontraktor (PT Hideco) ({meterReaders.filter((r) => r.kategori === 'Kontraktor (PT Hideco)' || r.kategori === 'Kontraktor' || r.kategori.toLowerCase().includes('hideco')).length})
            </span>
          </button>
          <button
            onClick={() => setFilterCategory('Key Account')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              filterCategory === 'Key Account'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              Key Account ({meterReaders.filter((r) => r.kategori === 'Key Account').length})
            </span>
          </button>
        </div>

        {/* Cycle Assignment Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 pr-2 font-bold text-slate-600 dark:text-slate-300 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
            <span>Filter Penugasan Cycle:</span>
          </div>
          <button
            onClick={() => setFilterCycle('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filterCycle === 'ALL'
                ? 'bg-[#0055A5] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua Cycle
          </button>
          {allCycles.map((c) => {
            const isSelected = filterCycle === c;
            const countPetugas = meterReaders.filter((r) => {
              const assignedCyclesForR = getAssignedCyclesForReader(r, customers);
              return assignedCyclesForR.some((ac) => ac.toLowerCase() === c.toLowerCase());
            }).length;
            return (
              <button
                key={c}
                onClick={() => setFilterCycle(c)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#E86216] border-[#E86216] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <span>{c}</span>
                {countPetugas > 0 && (
                  <span className={`px-1 py-0.2 rounded-full text-[9px] ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/60 text-[#0055A5] dark:text-blue-300'}`}>
                    {countPetugas}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Form Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleSaveNewReader}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            Form Pendaftaran Petugas Pembaca Meter Lapangan Baru
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Kategori Petugas *
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as ReaderCategory)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
              >
                <option value="Kontraktor (PT Hideco)">Kontraktor (PT Hideco)</option>
                <option value="Key Account">Key Account (PT Aetra Air Tangerang)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nama Petugas Lapangan *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Pak Joko Widodo"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                NIP / ID Petugas Lapangan
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="AET-KONT-2026-001"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nomor WhatsApp / HP Lapangan
              </label>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0812-XXXX-XXXX"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Email Operasional (Opsional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petugas@hideco.co.id"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Password Login Akun *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contoh: ANJAR123"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Status Operasional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold"
              >
                <option value="Aktif">Aktif Bertugas</option>
                <option value="Cuti">Cuti / Standby</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Cycle assignments */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                Pilih Penugasan Cycle Lapangan (1-15):
              </label>
              <button
                type="button"
                onClick={handleToggleAllCycles}
                className="text-[11px] text-[#0055A5] dark:text-blue-400 font-bold hover:underline"
              >
                {assignedCycles.length === allCycles.length ? 'Hapus Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {allCycles.map((c) => {
                const isSelected = assignedCycles.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCycle(c)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      isSelected
                        ? 'bg-[#0055A5] border-[#0055A5] text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#0055A5] hover:bg-blue-800 text-white rounded-xl shadow-xs transition"
            >
              Simpan Petugas Lapangan
            </button>
          </div>
        </form>
      )}

      {/* Reader Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReaders.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              Belum Ada Data Petugas Lapangan
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Data petugas lapangan dan perusahaannya belum diinput. Klik tombol <strong>+ Tambah Petugas</strong> di atas atau impor file Excel untuk mendaftarkan petugas.
            </p>
          </div>
        ) : (
          filteredReaders.map((reader) => {
          // Penugasan cycle dan industri strictly berdasarkan data industri yang diinput (ZERO OVERLAP)
          const sortedAssignedCycles = getAssignedCyclesForReader(reader, customers);
          const assignedCusts = getAssignedCustomersForReader(reader, customers);
          const completedCount = assignedCusts.filter(
            (c) => c.status === 'Verified' || c.status === 'Invoiced'
          ).length;

          return (
            <div
              key={reader.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center text-white shadow-xs ${
                        reader.kategori === 'Key Account'
                          ? 'bg-gradient-to-tr from-purple-700 to-indigo-500'
                          : 'bg-gradient-to-tr from-[#0055A5] to-blue-500'
                      }`}
                    >
                      {reader.nama.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                          {reader.nama}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reader.kategori === 'Key Account'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {reader.kategori}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        NIP: {reader.nip} {reader.perusahaan ? `· ${reader.perusahaan}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      reader.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {reader.status}
                  </span>
                </div>

                {/* Contact */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#E86216]" />
                    <span className="font-medium">{reader.noHp}</span>
                  </div>
                  {reader.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-slate-500 dark:text-slate-400">{reader.email}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Cycle Assignment Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Penugasan Cycle ({sortedAssignedCycles.length} Cycle):
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {completedCount} / {assignedCusts.length} Industri Selesai (
                      {assignedCusts.length > 0
                        ? (() => {
                            const raw = (completedCount / assignedCusts.length) * 100;
                            return raw === 0 ? '0' : raw < 1 ? raw.toFixed(1) : (raw % 1 === 0 ? raw.toFixed(0) : raw.toFixed(1));
                          })()
                        : '0'}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        completedCount === assignedCusts.length && assignedCusts.length > 0
                          ? 'bg-emerald-500'
                          : 'bg-[#0055A5] dark:bg-blue-500'
                      }`}
                      style={{
                        width: `${assignedCusts.length > 0 ? (completedCount / assignedCusts.length) * 100 : 0}%`
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sortedAssignedCycles.length > 0 ? (
                      sortedAssignedCycles.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#0055A5] dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum ada cycle yang ditugaskan</span>
                    )}
                  </div>
                </div>

                {/* Expandable Industry & Cycle List */}
                <div className="mt-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpandReader(reader.id)}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0055A5] dark:text-blue-300 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
                      <span>Rincian Industri &amp; Status Baca ({assignedCusts.length} Pelanggan)</span>
                    </div>
                    {expandedReaders[reader.id] ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedReaders[reader.id] && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto space-y-2 animate-in fade-in duration-150">
                      {assignedCusts.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-2 italic">
                          Belum ada industri dalam cycle yang ditugaskan kepada petugas ini.
                        </p>
                      ) : (
                        assignedCusts.map((cust) => {
                          const isDone = cust.status === 'Verified' || cust.status === 'Invoiced';
                          const isPending = cust.status === 'Pending Verification';
                          return (
                            <div
                              key={cust.id}
                              className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 dark:text-white truncate">
                                    {cust.nama}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300">
                                    {cust.cycle}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  ID: {cust.id} · Stand: {cust.lalu} → {cust.skrg || '-'} m³
                                </p>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {cust.status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setEditingReader(reader)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0055A5] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingReader(reader)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Edit Reader Modal */}
      {editingReader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-5 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
              Ubah Data Petugas Lapangan: {editingReader.nama}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Kategori Petugas
                </label>
                <select
                  value={editingReader.kategori}
                  onChange={(e) =>
                    setEditingReader({
                      ...editingReader,
                      kategori: e.target.value as ReaderCategory,
                      perusahaan: e.target.value === 'Key Account' ? 'PT Aetra Air Tangerang (Key Account)' : 'PT Hideco'
                    })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                >
                  <option value="Kontraktor (PT Hideco)">Kontraktor (PT Hideco)</option>
                  <option value="Key Account">Key Account (PT Aetra Air Tangerang)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nama Petugas Lapangan
                </label>
                <input
                  type="text"
                  value={editingReader.nama}
                  onChange={(e) => setEditingReader({ ...editingReader, nama: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nomor WhatsApp / HP Lapangan
                </label>
                <input
                  type="text"
                  value={editingReader.noHp}
                  onChange={(e) => setEditingReader({ ...editingReader, noHp: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Email Operasional
                </label>
                <input
                  type="email"
                  value={editingReader.email || ''}
                  onChange={(e) => setEditingReader({ ...editingReader, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Password Login Akun
                </label>
                <input
                  type="text"
                  value={editingReader.password || ''}
                  onChange={(e) =>
                    setEditingReader({
                      ...editingReader,
                      password: e.target.value.toUpperCase()
                    })
                  }
                  placeholder="ANJAR123"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Status Operasional
                </label>
                <select
                  value={editingReader.status}
                  onChange={(e) =>
                    setEditingReader({ ...editingReader, status: e.target.value as any })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold"
                >
                  <option value="Aktif">Aktif Bertugas</option>
                  <option value="Cuti">Cuti / Standby</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Penugasan Cycle:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  {allCycles.map((c) => {
                    const isChecked = editingReader.assignedCycles.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? editingReader.assignedCycles.filter((item) => item !== c)
                            : [...editingReader.assignedCycles, c];
                          setEditingReader({ ...editingReader, assignedCycles: updated });
                        }}
                        className={`p-1.5 text-[11px] font-bold rounded-lg border transition ${
                          isChecked
                            ? 'bg-[#0055A5] border-[#0055A5] text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditingReader(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditReader}
                className="px-5 py-2 text-xs font-bold bg-[#0055A5] hover:bg-blue-800 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reader Confirmation Modal */}
      {deletingReader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Hapus Petugas Pembaca Meter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini akan menghapus akun petugas dari daftar
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
              <p>
                Apakah Anda yakin ingin menghapus data petugas pembaca meter{' '}
                <span className="font-black text-slate-900 dark:text-white">{deletingReader.nama}</span>{' '}
                ({deletingReader.kategori})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReader(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetName = deletingReader.nama;
                  const targetCategory = deletingReader.kategori;
                  onDeleteMeterReader(deletingReader.id);
                  setDeletingReader(null);
                  showColorfulAlert({
                    title: 'Petugas Berhasil Dihapus! 🗑️',
                    subtitle: 'Penghapusan Akun Petugas Pembaca Meter',
                    message: `Akun petugas pembaca meter ${targetName} (${targetCategory}) telah berhasil dihapus dari sistem SIMBA.`,
                    type: 'success',
                    badge: 'PETUGAS TERHAPUS',
                    details: [
                      `Nama: ${targetName}`,
                      `Kategori: ${targetCategory}`,
                      'Data petugas telah dihapus dari master data'
                    ],
                    confirmText: 'Selesai'
                  });
                  showToast({
                    title: 'Petugas Dihapus',
                    message: `✓ Akun petugas ${targetName} berhasil dihapus.`,
                    type: 'success'
                  });
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Petugas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
