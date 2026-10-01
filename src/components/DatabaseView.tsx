import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { IndustryCustomer, CustomerClass, MeterReader, CycleSchedule, UserProfile } from '../types';
import {
  Upload,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Building,
  BarChart2,
  Users,
  Calendar,
  Layers,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import meterGaugeImg from '../assets/images/meter_industrial_gauge_1790243358407.jpg';
import bpmDocImg from '../assets/images/meter_bpm_document_1790243369057.jpg';
import { MeterReaderManagementSection } from './MeterReaderManagementSection';
import { CycleScheduleSection } from './CycleScheduleSection';
import { ImportCycleScheduleModal } from './ImportCycleScheduleModal';
import { showColorfulAlert, showToast } from '../utils/notificationSystem';
import { getReaderCategory } from '../utils/readerAssignmentHelper';

interface DatabaseViewProps {
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  onAddCustomer: (customer: IndustryCustomer) => void;
  onImportCustomers: (newCustomers: IndustryCustomer[]) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteBatchCustomers: (ids: string[]) => void;
  onAddMeterReader: (reader: MeterReader) => void;
  onUpdateMeterReader: (reader: MeterReader) => void;
  onDeleteMeterReader: (id: string) => void;
  onImportCycleSchedules: (schedules: CycleSchedule[]) => void;
  onUpdateCycleSchedule: (schedule: CycleSchedule) => void;
  currentUser?: UserProfile;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  customers,
  meterReaders,
  cycleSchedules,
  onAddCustomer,
  onImportCustomers,
  onDeleteCustomer,
  onDeleteBatchCustomers,
  onAddMeterReader,
  onUpdateMeterReader,
  onDeleteMeterReader,
  onImportCycleSchedules,
  onUpdateCycleSchedule,
  currentUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'readers' | 'schedules'>('customers');
  const [isImportScheduleModalOpen, setIsImportScheduleModalOpen] = useState<boolean>(false);

  // Check RBAC: Only Tim Meter Reading and Admin Key Account can import database & cycle schedules
  const canImportDatabase =
    !currentUser ||
    currentUser.adminType === 'meter_reading' ||
    currentUser.adminType === 'key_account' ||
    ['solihin', 'kabul', 'tri_kartono', 'bayu_pramono'].includes(currentUser.role);

  const handleTriggerExcelImport = () => {
    if (!canImportDatabase) {
      showColorfulAlert({
        title: 'Akses Dibatasi ⚠️',
        subtitle: 'Otoritas Khusus Tim Meter Reading & Key Account',
        message: `Akun Anda (${currentUser?.name || 'Tim Billing'}) hanya berwenang untuk mengelola Billing & Invoicing. Hak impor database industri dan jadwal cycle hanya dimiliki oleh Tim Meter Reading dan Admin Key Account.`,
        type: 'warning',
        badge: 'HAK AKSES KHUSUS'
      });
      return;
    }
    fileInputRef.current?.click();
  };

  // Form states
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCycle, setNewCycle] = useState('Cycle 1');
  const [newKelas, setNewKelas] = useState<CustomerClass>('Gold');
  const [newStandLalu, setNewStandLalu] = useState('10000');

  // Filter states
  const [filterCycle, setFilterCycle] = useState('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'batch' | 'single';
    id?: string;
    name?: string;
    count?: number;
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const cycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  // Helper for flexible Excel column mapping
  const getExcelValue = (item: Record<string, any>, possibleKeys: string[]) => {
    const keys = Object.keys(item);
    for (const pk of possibleKeys) {
      const normalizedPk = pk.toLowerCase().replace(/[\s_]+/g, '');
      const foundKey = keys.find((k) => k.toLowerCase().replace(/[\s_]+/g, '') === normalizedPk);
      if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null && String(item[foundKey]).trim() !== '') {
        return item[foundKey];
      }
    }
    return null;
  };

  const downloadUnifiedExcelTemplate = () => {
    const templateData = [
      {
        'ID Pelanggan': 'IND-2001',
        'Nama Perusahaan Industri': 'PT Astra Honda Motor Plant Cikupa',
        'Cycle': 'Cycle 1',
        'Kelas': 'Premium',
        'Stand Lalu (m³)': 45000,
        'Pembaca Meter': 'Anjarini Sukamto'
      },
      {
        'ID Pelanggan': 'IND-2002',
        'Nama Perusahaan Industri': 'PT Mayora Indah Divisi Wafer',
        'Cycle': 'Cycle 2',
        'Kelas': 'Platinum',
        'Stand Lalu (m³)': 38200,
        'Pembaca Meter': 'Anjarini Sukamto'
      },
      {
        'ID Pelanggan': 'IND-2003',
        'Nama Perusahaan Industri': 'PT Torabika Eka Semesta',
        'Cycle': 'Cycle 3',
        'Kelas': 'Gold',
        'Stand Lalu (m³)': 18400,
        'Pembaca Meter': 'Anjarini Sukamto'
      },
      {
        'ID Pelanggan': 'IND-2004',
        'Nama Perusahaan Industri': 'PT Unilever Oleochemical Balaraja',
        'Cycle': 'Cycle 4',
        'Kelas': 'Premium',
        'Stand Lalu (m³)': 28900,
        'Pembaca Meter': 'Febriadi'
      },
      {
        'ID Pelanggan': 'IND-2005',
        'Nama Perusahaan Industri': 'PT Gajah Tunggal Tbk Plant 2',
        'Cycle': 'Cycle 5',
        'Kelas': 'Silver',
        'Stand Lalu (m³)': 12500,
        'Pembaca Meter': 'Febriadi'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Industri & Cycle');
    XLSX.writeFile(wb, 'Format_Import_Industri_Cycle_SIMBA.xlsx');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        if (!rows || rows.length === 0) {
          showColorfulAlert({
            title: 'File Excel Kosong',
            message: 'File Excel yang dipilih tidak memiliki baris data pada sheet pertama.',
            type: 'warning',
            badge: 'FILE KOSONG'
          });
          return;
        }

        const imported: IndustryCustomer[] = rows.map((item, index) => {
          // 1. ID Pelanggan
          const idPel =
            getExcelValue(item, ['idPelanggan', 'id_pelanggan', 'id', 'id pelanggan', 'nomor pelanggan', 'nopol', 'customer id']) ||
            `IND-${1100 + index}`;

          // 2. Nama Perusahaan Industri
          const nmPerusahaan =
            getExcelValue(item, [
              'nama_perusahaan_industri',
              'nama perusahaan industri',
              'namaperusahaanindustri',
              'nama_industri',
              'nama industri',
              'nama_perusahaan',
              'nama perusahaan',
              'perusahaan',
              'company',
              'nama'
            ]) || `Industri ${idPel}`;

          // 3. Cycle
          const cycVal = getExcelValue(item, ['pilihCycle', 'cycle', 'siklus', 'c', 'jadwal']);
          const cyc = cycVal
            ? String(cycVal).toLowerCase().includes('cycle')
              ? String(cycVal)
              : `Cycle ${cycVal}`
            : 'Cycle 1';

          // 4. Kelas
          const klsVal = getExcelValue(item, ['kelasPelanggan', 'kelas', 'class', 'kategori']);
          const rawKls = klsVal ? String(klsVal).replace(/kelas\s*/gi, '').trim() : 'Gold';
          const kls: CustomerClass = ['Premium', 'Platinum', 'Gold', 'Silver', 'Bronze'].includes(rawKls)
            ? (rawKls as CustomerClass)
            : 'Gold';

          // 5. Pembaca Meter
          const readerVal =
            getExcelValue(item, [
              'pembaca_meter',
              'pembaca meter',
              'pembacameter',
              'petugas_baca',
              'petugas baca',
              'nama_petugas',
              'nama petugas',
              'nama_pembaca',
              'nama pembaca',
              'petugas',
              'reader',
              'pic'
            ]) || '';

          const defaultReaderForCycle =
            readerVal ||
            (meterReaders.find((r) => r.assignedCycles?.some((ac) => ac.toLowerCase() === String(cyc).toLowerCase()))?.nama) ||
            'Anjarini Sukamto';

          const finalReader = readerVal || defaultReaderForCycle;

          const mail =
            getExcelValue(item, ['emailIndustri', 'email', 'surel', 'email perusahaan']) ||
            `billing@${String(nmPerusahaan).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'industri'}.co.id`;

          const laluVal =
            Number(getExcelValue(item, ['standLalu', 'stand_lalu', 'lalu', 'meter lalu', 'stand bulan lalu'])) ||
            10000;

          const isKA = getReaderCategory(finalReader) === 'Key Account';

          return {
            id: String(idPel).trim().toUpperCase(),
            nama: String(nmPerusahaan).trim(),
            email: String(mail).trim(),
            cycle: String(cyc).trim(),
            kelas: kls,
            petugasBaca: String(finalReader).trim(),
            kategoriPetugas: isKA ? 'Key Account' : 'Kontraktor',
            lalu: laluVal,
            skrg: 0,
            status: 'Belum Dibaca' as const,
            bulan: 'September 2026',
            catatan: '',
            history: [Math.max(0, laluVal - 600), Math.max(0, laluVal - 300), laluVal],
            fotoMeter: '',
            fotoBPM: ''
          };
        });

        onImportCustomers(imported);
        showColorfulAlert({
          title: 'Import Data Industri Berhasil! 🎉',
          subtitle: 'Sinkronisasi Database Industri & Penugasan Petugas Lapangan',
          message: `Berhasil mengimpor ${imported.length} data industri gabungan (ID Pelanggan, Nama Perusahaan Industri, Cycle, Kelas, Pembaca Meter) ke dalam sistem SIMBA. Status alur kerja diatur ke Belum Dibaca (siap dicatat petugas lapangan).`,
          type: 'success',
          badge: 'EXCEL IMPORT SUKSES',
          count: imported.length,
          tags: ['ID Pelanggan', 'Nama Perusahaan', 'Cycle 1 - 15', 'Kelas Pelanggan', 'Petugas Baca'],
          details: [
            `${imported.length} data industri berhasil diintegrasikan ke basis data`,
            'Otomatis terhubung ke jadwal pergeseran cycle dan pembaca meter lapangan',
            'Semua data siap diverifikasi dalam siklus pembacaan berjalan'
          ],
          confirmText: 'Lihat Daftar Industri',
          autoCloseMs: 8000
        });
      } catch (err) {
        console.error(err);
        showColorfulAlert({
          title: 'Gagal Membaca File Excel',
          message: 'Pastikan format file .xlsx atau .xls valid dan tidak dalam kondisi terproteksi / korup.',
          type: 'error',
          badge: 'IMPORT GAGAL'
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      showColorfulAlert({
        title: 'Data Belum Lengkap',
        message: 'Mohon isi ID Pelanggan dan Nama Perusahaan terlebih dahulu sebelum menyimpan data industri baru.',
        type: 'warning',
        badge: 'INPUT WAJIB'
      });
      return;
    }

    const standLaluNum = Number(newStandLalu) || 10000;

    const assignedReaderForCycle =
      meterReaders.find((r) =>
        r.assignedCycles?.some((ac) => ac.toLowerCase() === newCycle.toLowerCase())
      )?.nama || 'Anjarini Sukamto';

    const isKA = getReaderCategory(assignedReaderForCycle) === 'Key Account';

    const newCustomer: IndustryCustomer = {
      id: newId.trim().toUpperCase(),
      nama: newName.trim(),
      email: newEmail.trim() || 'finance@industri.co.id',
      cycle: newCycle,
      kelas: newKelas,
      petugasBaca: assignedReaderForCycle,
      kategoriPetugas: isKA ? 'Key Account' : 'Kontraktor',
      lalu: standLaluNum,
      skrg: 0,
      status: 'Belum Dibaca',
      bulan: 'September 2026',
      catatan: '',
      history: [Math.max(0, standLaluNum - 500), Math.max(0, standLaluNum - 200), standLaluNum],
      fotoMeter: '',
      fotoBPM: ''
    };

    onAddCustomer(newCustomer);
    setNewId('');
    setNewName('');
    setNewEmail('');
    setNewStandLalu('10000');
    showColorfulAlert({
      title: 'Industri Berhasil Didaftarkan! ✨',
      message: `Akun industri ${newCustomer.nama} (${newCustomer.id}) telah berhasil disimpan ke database ${newCustomer.cycle} dengan status Belum Dibaca.`,
      type: 'success',
      badge: 'REGISTRASI BERHASIL'
    });
  };

  // Filtered master data
  const filteredList = customers.filter((c) => {
    const matchCycle = filterCycle === 'ALL' || c.cycle === filterCycle;
    const matchKelas = filterKelas === 'ALL' || c.kelas === filterKelas;
    return matchCycle && matchKelas;
  });

  // Cycle distribution count
  const cycleDistribution: Record<string, number> = {};
  for (let i = 1; i <= 15; i++) {
    cycleDistribution[`Cycle ${i}`] = 0;
  }
  customers.forEach((c) => {
    if (cycleDistribution[c.cycle] !== undefined) {
      cycleDistribution[c.cycle]++;
    } else {
      cycleDistribution[c.cycle] = 1;
    }
  });

  const maxDistributionCount = Math.max(1, ...Object.values(cycleDistribution));

  // Checkbox handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((c) => c.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      setActionFeedback({
        type: 'warning',
        message: '⚠️ Pilih setidaknya satu industri menggunakan kotak centang (checklist) untuk dihapus.'
      });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }
    setDeleteConfirmModal({
      isOpen: true,
      type: 'batch',
      count: selectedIds.length
    });
  };

  const handleOpenSingleDelete = (id: string, name: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      type: 'single',
      id,
      name
    });
  };

  const executeConfirmedDelete = () => {
    if (!deleteConfirmModal) return;

    if (deleteConfirmModal.type === 'batch') {
      const count = selectedIds.length;
      onDeleteBatchCustomers(selectedIds);
      setSelectedIds([]);
      setActionFeedback({
        type: 'success',
        message: `✓ Berhasil menghapus ${count} data industri terpilih dari database.`
      });
      showColorfulAlert({
        title: 'Data Industri Berhasil Dihapus! 🗑️',
        subtitle: 'Penghapusan Data dari Database SIMBA',
        message: `Sebanyak ${count} data industri yang dipilih telah berhasil dihapus dari database sistem secara permanen.`,
        type: 'success',
        badge: 'DATA TERHAPUS',
        count: count,
        details: [
          `${count} akun industri telah dihapus`,
          'Daftar database telah diperbarui otomatis',
          'Siklus catat meter telah disesuaikan'
        ],
        confirmText: 'Selesai'
      });
      showToast({
        title: 'Data Dihapus',
        message: `✓ ${count} data industri berhasil dihapus dari database.`,
        type: 'success'
      });
    } else if (deleteConfirmModal.type === 'single' && deleteConfirmModal.id) {
      const targetName = deleteConfirmModal.name || deleteConfirmModal.id;
      onDeleteCustomer(deleteConfirmModal.id);
      setActionFeedback({
        type: 'success',
        message: `✓ Berhasil menghapus industri ${targetName} dari database.`
      });
      showColorfulAlert({
        title: 'Data Industri Berhasil Dihapus! 🗑️',
        subtitle: 'Penghapusan Akun Industri',
        message: `Data industri ${targetName} (ID: ${deleteConfirmModal.id}) telah berhasil dihapus dari database sistem SIMBA.`,
        type: 'success',
        badge: 'DATA TERHAPUS',
        details: [
          `Nama: ${targetName}`,
          `ID: ${deleteConfirmModal.id}`,
          'Data berhasil dibersihkan dari daftar'
        ],
        confirmText: 'Selesai'
      });
      showToast({
        title: 'Industri Dihapus',
        message: `✓ Akun industri ${targetName} berhasil dihapus.`,
        type: 'success'
      });
    }

    setDeleteConfirmModal(null);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'customers'
              ? 'bg-white dark:bg-slate-900 text-[#0055A5] dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Daftar Pelanggan Industri ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('readers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'readers'
              ? 'bg-white dark:bg-slate-900 text-[#E86216] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Section Pembaca Meter ({meterReaders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'schedules'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal &amp; Tanggal Cycle (15 Cycle)</span>
        </button>
      </div>

      {/* Sub-tab 1: Customers Database */}
      {activeSubTab === 'customers' && (
        <div className="space-y-6">
          {/* Top Banner / Form Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span>Manajemen &amp; Master Data List Industri per Cycle</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tambahkan akun industri baru ke dalam database pencatatan meter atau impor secara massal dari Excel.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={downloadUnifiedExcelTemplate}
                  className="bg-[#0055A5] hover:bg-[#003E78] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                  title="Unduh Format Excel 5 Kolom: ID Pelanggan, Nama Perusahaan Industri, Cycle, Kelas, Pembaca Meter"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Format Excel Gabungan</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <button
                  type="button"
                  onClick={handleTriggerExcelImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Impor Excel (.xlsx, .xls)</span>
                </button>
              </div>
            </div>

            {/* Manual registration form */}
            <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  ID Pelanggan
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="Contoh: IND-1011"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nama Perusahaan Industri
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="PT Contoh Industri Tbk"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Email Industri
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="finance@contoh.co.id"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Pilih Cycle (1-15)
                </label>
                <select
                  value={newCycle}
                  onChange={(e) => setNewCycle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 font-semibold text-[#0055A5] dark:text-blue-400"
                >
                  {cycles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Stand Bulan Lalu (m³)
                </label>
                <input
                  type="number"
                  value={newStandLalu}
                  onChange={(e) => setNewStandLalu(e.target.value)}
                  placeholder="10000"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Kelas Pelanggan
                </label>
                <select
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value as CustomerClass)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="Premium">Premium</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>
              <div className="md:col-span-3 lg:col-span-6 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#E86216] hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan ke Database Cycle</span>
                </button>
              </div>
            </form>
          </div>

          {/* Distribution Chart and Master Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cycle distribution bar visualizer */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#0055A5] dark:text-blue-400" />
                  <span>Distribusi Target per Cycle</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Kepadatan target pelanggan industri yang tersebar pada Cycle 1 hingga 15.
                </p>

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {Object.entries(cycleDistribution).map(([cName, count]) => {
                    const barWidth = Math.max(8, Math.round((count / maxDistributionCount) * 100));
                    return (
                      <div key={cName} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                          {cName}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-md h-4 overflow-hidden relative">
                          <div
                            className="bg-[#0055A5] h-full rounded-md transition-all duration-500"
                            style={{ width: `${count > 0 ? barWidth : 0}%` }}
                          ></div>
                        </div>
                        <span className="w-6 text-right font-mono font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Master industry table with checklist */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Daftar Kesiapan Pencatatan Meter per Cycle
                    </h3>
                    <p className="text-xs text-slate-400">
                      Daftar industri yang tergabung dalam jadwal pembacaan operasional.
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">
                    Total Terdaftar:{' '}
                    <span className="text-[#0055A5] dark:text-blue-400 font-bold font-mono">
                      {filteredList.length}
                    </span>
                  </div>
                </div>

                {/* Filter and bulk action toolbar */}
                <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Filter Tampilan:</span>
                  <select
                    value={filterCycle}
                    onChange={(e) => setFilterCycle(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border rounded-lg text-slate-700 dark:text-slate-100"
                  >
                    <option value="ALL">Semua Cycle</option>
                    {cycles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border rounded-lg text-slate-700 dark:text-slate-100"
                  >
                    <option value="ALL">Semua Kelas</option>
                    <option value="Premium">Premium</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>

                  <div className="ml-auto flex items-center gap-2">
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-in fade-in"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Terpilih ({selectedIds.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 uppercase font-extrabold text-[10px] sticky top-0 z-10">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                          onChange={handleToggleSelectAll}
                          title="Pilih / Batalkan semua baris tabel"
                          aria-label="Pilih semua baris tabel"
                          className="w-4 h-4 rounded text-[#0055A5] focus:ring-[#0055A5] cursor-pointer"
                        />
                      </th>
                      <th className="p-3">ID Pelanggan</th>
                      <th className="p-3">Nama Perusahaan Industri</th>
                      <th className="p-3">Cycle</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Stand Bulan Lalu</th>
                      <th className="p-3">Pembaca Meter</th>
                      <th className="p-3">Status Workflow</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          Tidak ada data industri yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => {
                        const isChecked = selectedIds.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                              isChecked ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRow(item.id)}
                                aria-label={`Pilih industri ${item.nama}`}
                                className="w-4 h-4 rounded text-[#0055A5] focus:ring-[#0055A5] cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-[#E86216]">{item.id}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                              {item.nama}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {item.email}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-[#0055A5] dark:text-blue-400">
                              {item.cycle}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{item.kelas}</td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {Number(item.lalu || 0).toLocaleString('id-ID')} m³
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.petugasBaca || 'Belum Ditugaskan'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleOpenSingleDelete(item.id, item.nama)}
                                className="text-rose-500 hover:text-white hover:bg-rose-600 p-1.5 rounded-lg font-semibold text-xs transition cursor-pointer"
                                title="Hapus Industri"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Section Pembaca Meter */}
      {activeSubTab === 'readers' && (
        <MeterReaderManagementSection
          meterReaders={meterReaders}
          customers={customers}
          onAddMeterReader={onAddMeterReader}
          onUpdateMeterReader={onUpdateMeterReader}
          onDeleteMeterReader={onDeleteMeterReader}
        />
      )}

      {/* Sub-tab 3: Jadwal & Tanggal Cycle */}
      {activeSubTab === 'schedules' && (
        <CycleScheduleSection
          cycleSchedules={cycleSchedules}
          customers={customers}
          meterReaders={meterReaders}
          onOpenImportModal={() => {
            if (!canImportDatabase) {
              showColorfulAlert({
                title: 'Akses Dibatasi ⚠️',
                subtitle: 'Otoritas Khusus Tim Meter Reading & Key Account',
                message: `Akun Anda (${currentUser?.name || 'Tim Billing'}) hanya berwenang untuk mengelola Billing & Invoicing. Hak impor jadwal 15 cycle hanya dimiliki oleh Tim Meter Reading dan Admin Key Account.`,
                type: 'warning',
                badge: 'HAK AKSES KHUSUS'
              });
              return;
            }
            setIsImportScheduleModalOpen(true);
          }}
          onUpdateSchedule={onUpdateCycleSchedule}
          onUpdateCustomersBatch={onImportCustomers}
        />
      )}

      {/* Import Cycle Schedule Modal */}
      {isImportScheduleModalOpen && (
        <ImportCycleScheduleModal
          isOpen={true}
          onClose={() => setIsImportScheduleModalOpen(false)}
          onImport={(schedules) => {
            onImportCycleSchedules(schedules);
          }}
        />
      )}

      {/* IN-APP CONFIRMATION MODAL DIALOG (Non-blocking in iframes) */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Konfirmasi Penghapusan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
              {deleteConfirmModal.type === 'batch' ? (
                <p>
                  Apakah Anda yakin ingin menghapus{' '}
                  <span className="font-black text-rose-600 dark:text-rose-400">
                    {deleteConfirmModal.count} data industri
                  </span>{' '}
                  yang dipilih dari database sistem?
                </p>
              ) : (
                <p>
                  Apakah Anda yakin ingin menghapus data industri{' '}
                  <span className="font-black text-slate-900 dark:text-white">
                    {deleteConfirmModal.name}
                  </span>{' '}
                  (ID: {deleteConfirmModal.id}) dari database sistem?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
