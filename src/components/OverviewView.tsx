import React, { useState, useMemo } from 'react';
import {
  IndustryCustomer,
  UserProfile,
  MeterReader,
  CycleSchedule,
  WorkflowStatus
} from '../types';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Zap,
  CheckSquare,
  Square,
  Users,
  CheckCircle2,
  Filter,
  X,
  Building,
  RotateCcw,
  Sparkles,
  Receipt,
  Search,
  Trash2
} from 'lucide-react';
import { CycleProgressChart } from './CycleProgressChart';
import { MeterReaderProgressSection } from './MeterReaderProgressSection';
import { ImportCycleScheduleModal } from './ImportCycleScheduleModal';
import { OfficialAetraInvoiceModal } from './OfficialAetraInvoiceModal';
import { showColorfulAlert } from '../utils/notificationSystem';

interface OverviewViewProps {
  customers: IndustryCustomer[];
  allCustomers?: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  selectedCycle: string;
  workflowFilter: string;
  onWorkflowFilterChange: (status: string) => void;
  onSelectCycle: (cycle: string) => void;
  onOpenDetail: (customer: IndustryCustomer) => void;
  onOpenPrintReport?: () => void;
  onExportCSV: () => void;
  onImportCycleSchedules: (schedules: CycleSchedule[]) => void;
  onBatchUpdateStatus: (ids: string[], newStatus: WorkflowStatus, note?: string) => void;
  onDeleteCustomer?: (id: string) => void;
  onDeleteBatchCustomers?: (ids: string[]) => void;
  currentUser: UserProfile;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  customers,
  allCustomers,
  meterReaders,
  cycleSchedules,
  selectedCycle,
  workflowFilter,
  onWorkflowFilterChange,
  onSelectCycle,
  onOpenDetail,
  onOpenPrintReport,
  onExportCSV,
  onImportCycleSchedules,
  onBatchUpdateStatus,
  onDeleteCustomer,
  onDeleteBatchCustomers,
  currentUser
}) => {
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState<boolean>(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState<string>('');

  // Full dataset access for cycle-wide operations
  const fullDataset = allCustomers || customers;

  // Batch cycle selection state
  const [batchTargetCycle, setBatchTargetCycle] = useState<string>(
    selectedCycle !== 'ALL' ? selectedCycle : 'Cycle 1'
  );
  const [batchReaderScope, setBatchReaderScope] = useState<'ALL' | 'Kontraktor' | 'Key Account'>('ALL');
  const [batchCustomNote, setBatchCustomNote] = useState<string>('');
  const [batchFeedback, setBatchFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Row selection state for table batch actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'batch' | 'single';
    id?: string;
    name?: string;
    count?: number;
  } | null>(null);

  // Confirmation modal state for 1-click cycle batch
  const [confirmBatchModal, setConfirmBatchModal] = useState<{
    isOpen: boolean;
    cycle: string;
    targetStatus: WorkflowStatus;
    customerIds: string[];
    affectedNames: string[];
    scopeLabel?: string;
  } | null>(null);

  const [selectedInvoiceCustomer, setSelectedInvoiceCustomer] = useState<IndustryCustomer | null>(null);

  // Synchronize batchTargetCycle when selectedCycle changes from props
  React.useEffect(() => {
    setBatchTargetCycle(selectedCycle);
  }, [selectedCycle]);

  // Handler to synchronously update both batchTargetCycle and table cycle filter
  const handleSelectBatchCycle = (newCycle: string) => {
    setBatchTargetCycle(newCycle);
    onSelectCycle(newCycle);
  };

  // Filtered rows for the table including industry progress search
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Workflow filter
      if (workflowFilter !== 'ALL' && c.status !== workflowFilter) return false;
      
      // 2. Automatically sync with batchReaderScope if selected
      if (batchReaderScope === 'Kontraktor') {
        const isContractor =
          c.kategoriPetugas === 'Kontraktor' ||
          c.kategoriPetugas?.toLowerCase().includes('kontraktor') ||
          (!c.kategoriPetugas && c.kelas !== 'Premium');
        if (!isContractor) return false;
      } else if (batchReaderScope === 'Key Account') {
        const isKA =
          c.kategoriPetugas === 'Key Account' ||
          (!c.kategoriPetugas && c.kelas === 'Premium');
        if (!isKA) return false;
      }

      // 3. Search query filter for industry progress
      if (industrySearchQuery.trim()) {
        const q = industrySearchQuery.toLowerCase().trim();
        const matchQ =
          c.nama.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.petugasBaca && c.petugasBaca.toLowerCase().includes(q)) ||
          c.cycle.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          (c.lokasi && c.lokasi.toLowerCase().includes(q));
        if (!matchQ) return false;
      }

      return true;
    });
  }, [customers, workflowFilter, batchReaderScope, industrySearchQuery]);

  // Raw customers in the target cycle (all readers)
  const batchCycleAllCustomers = useMemo(() => {
    return fullDataset.filter((c) => c.cycle.toLowerCase() === batchTargetCycle.toLowerCase());
  }, [fullDataset, batchTargetCycle]);

  // Reader info for target cycle
  const batchCycleDualReaders = useMemo(() => {
    const contractorReader = meterReaders.find(
      (m) => m.kategori !== 'Key Account' && m.assignedCycles.includes(batchTargetCycle)
    ) || meterReaders.find((m) => m.kategori !== 'Key Account');

    const keyAccountReader = meterReaders.find(
      (m) => m.kategori === 'Key Account' && m.assignedCycles.includes(batchTargetCycle)
    ) || meterReaders.find((m) => m.kategori === 'Key Account');

    return {
      contractor: contractorReader?.nama || 'Belum Ditugaskan',
      contractorCompany: contractorReader?.perusahaan || 'Kontraktor',
      keyAccount: keyAccountReader?.nama || 'Belum Ditugaskan',
      keyAccountCompany: keyAccountReader?.perusahaan || 'Key Account'
    };
  }, [meterReaders, batchTargetCycle]);

  // Filtered target customers depending on scope
  const batchCycleCustomers = useMemo(() => {
    if (batchReaderScope === 'Kontraktor') {
      return batchCycleAllCustomers.filter(
        (c) => (c.kategoriPetugas && c.kategoriPetugas !== 'Key Account') || (!c.kategoriPetugas && c.kelas !== 'Premium')
      );
    } else if (batchReaderScope === 'Key Account') {
      return batchCycleAllCustomers.filter(
        (c) => c.kategoriPetugas === 'Key Account' || (!c.kategoriPetugas && c.kelas === 'Premium')
      );
    }
    return batchCycleAllCustomers;
  }, [batchCycleAllCustomers, batchReaderScope]);

  const batchCycleSchedule = useMemo(() => {
    return cycleSchedules.find(
      (s) => s.cycle.toLowerCase() === batchTargetCycle.toLowerCase()
    );
  }, [cycleSchedules, batchTargetCycle]);

  const batchCycleCounts = useMemo(() => {
    const belumDibaca = batchCycleCustomers.filter((c) => c.status === 'Belum Dibaca').length;
    const pending = batchCycleCustomers.filter((c) => c.status === 'Pending Verification').length;
    const verified = batchCycleCustomers.filter((c) => c.status === 'Verified').length;
    const invoiced = batchCycleCustomers.filter((c) => c.status === 'Invoiced').length;
    return {
      total: batchCycleCustomers.length,
      belumDibaca,
      pending,
      verified,
      invoiced,
      actionableForVerified: belumDibaca + pending,
      actionableForPending: belumDibaca + verified
    };
  }, [batchCycleCustomers]);

  // Info for batch cycle
  const batchCyclePicInfo = useMemo(() => {
    const schedule = batchCycleSchedule;
    const picName = schedule?.petugasUtama || 'Belum Ditugaskan';
    const reader = meterReaders.find((m) => m.nama.toLowerCase() === picName.toLowerCase());
    return {
      name: picName,
      company: reader?.perusahaan || schedule?.kategoriPetugas || 'Petugas Lapangan',
      isAssigned: picName !== 'Belum Ditugaskan'
    };
  }, [batchCycleSchedule, meterReaders]);

  // Check if current user has meter reading verification authority
  const canVerifyReading =
    currentUser.adminType === 'meter_reading' ||
    ['solihin', 'kabul', 'tri_kartono'].includes(currentUser.role);

  // Handle 1-Click Batch Update for the Target Cycle
  const triggerCycleBatchUpdate = (targetStatus: WorkflowStatus) => {
    if (targetStatus === 'Verified' && !canVerifyReading) {
      showColorfulAlert({
        title: 'Akses Dibatasi ⚠️',
        subtitle: 'Otoritas Khusus Admin Meter Reading',
        message: `Akun Anda (${currentUser.name}) tidak memiliki hak untuk memverifikasi stand meter. Wewenang verifikasi stand meter lapangan hanya dimiliki oleh Admin Meter Reading (Akhmad Solihin, Kabul Nugroho, Tri Kartono).`,
        type: 'warning',
        badge: 'HAK AKSES KHUSUS'
      });
      return;
    }

    let targetList: IndustryCustomer[] = [];
    if (targetStatus === 'Verified') {
      // Update those that are not yet invoiced or verified
      targetList = batchCycleCustomers.filter(
        (c) => c.status === 'Belum Dibaca' || c.status === 'Pending Verification'
      );
    } else if (targetStatus === 'Pending Verification') {
      // Update those that are Belum Dibaca or Verified
      targetList = batchCycleCustomers.filter(
        (c) => c.status === 'Belum Dibaca' || c.status === 'Verified'
      );
    }

    if (targetList.length === 0) {
      setBatchFeedback({
        type: 'info',
        message: `Tidak ada pelanggan di ${batchTargetCycle} yang perlu diperbarui ke status '${targetStatus}'.`
      });
      setTimeout(() => setBatchFeedback(null), 4000);
      return;
    }

    setConfirmBatchModal({
      isOpen: true,
      cycle: batchTargetCycle,
      targetStatus,
      customerIds: targetList.map((c) => c.id),
      affectedNames: targetList.map((c) => c.nama)
    });
  };

  const executeConfirmBatchUpdate = () => {
    if (!confirmBatchModal) return;

    const defaultNote =
      batchCustomNote.trim() ||
      (confirmBatchModal.targetStatus === 'Verified'
        ? `Verifikasi massal ${confirmBatchModal.cycle} selesai`
        : `Pending verifikasi massal ${confirmBatchModal.cycle}`);

    onBatchUpdateStatus(confirmBatchModal.customerIds, confirmBatchModal.targetStatus, defaultNote);

    setBatchFeedback({
      type: 'success',
      message: `✓ Berhasil memperbarui ${confirmBatchModal.customerIds.length} industri di ${confirmBatchModal.cycle} menjadi '${confirmBatchModal.targetStatus}'.`
    });

    setConfirmBatchModal(null);
    setBatchCustomNote('');
    setSelectedRowIds([]);
    setTimeout(() => setBatchFeedback(null), 5000);
  };

  // Table selection handlers
  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredCustomers.map((c) => c.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRowSelection = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteSelectedRowBatch = (targetStatus: WorkflowStatus) => {
    if (selectedRowIds.length === 0) return;

    if (targetStatus === 'Verified' && !canVerifyReading) {
      showColorfulAlert({
        title: 'Akses Dibatasi ⚠️',
        subtitle: 'Otoritas Khusus Admin Meter Reading',
        message: `Akun Anda (${currentUser.name}) tidak memiliki hak untuk memverifikasi stand meter. Wewenang verifikasi stand meter lapangan hanya dimiliki oleh Admin Meter Reading (Akhmad Solihin, Kabul Nugroho, Tri Kartono).`,
        type: 'warning',
        badge: 'HAK AKSES KHUSUS'
      });
      return;
    }

    const note =
      batchCustomNote.trim() ||
      `Pembaruan status checklist massal menjadi ${targetStatus} oleh ${currentUser.name}`;

    onBatchUpdateStatus(selectedRowIds, targetStatus, note);

    setBatchFeedback({
      type: 'success',
      message: `✓ Berhasil memperbarui ${selectedRowIds.length} industri terpilih menjadi '${targetStatus}'.`
    });

    setSelectedRowIds([]);
    setBatchCustomNote('');
    setTimeout(() => setBatchFeedback(null), 5000);
  };

  const executeConfirmedDelete = () => {
    if (!deleteConfirmModal) return;

    if (deleteConfirmModal.type === 'batch') {
      const count = selectedRowIds.length;
      if (onDeleteBatchCustomers) {
        onDeleteBatchCustomers(selectedRowIds);
      }
      setSelectedRowIds([]);
      setBatchFeedback({
        type: 'success',
        message: `✓ Berhasil menghapus ${count} industri terpilih dari daftar.`
      });
    } else if (deleteConfirmModal.type === 'single' && deleteConfirmModal.id) {
      if (onDeleteCustomer) {
        onDeleteCustomer(deleteConfirmModal.id);
      }
      setBatchFeedback({
        type: 'success',
        message: `✓ Berhasil menghapus industri ${deleteConfirmModal.name || deleteConfirmModal.id} dari daftar.`
      });
    }

    setDeleteConfirmModal(null);
    setTimeout(() => setBatchFeedback(null), 5000);
  };

  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedRowIds.includes(c.id));

  // Quick cycle numbers (1 to 15)
  const allCycleNames = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);
  }, []);

  return (
    <div className="space-y-6">
      {/* Feedback Toast Banner */}
      {batchFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            batchFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {batchFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-bold">{batchFeedback.message}</p>
          </div>
          <button
            onClick={() => setBatchFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KETIKA WORKFLOW ALL (MONITORING UTAMA): MATRIKS PLOTTING JADWAL CYCLE DITARUH DI PALING ATAS */}
      {workflowFilter === 'ALL' && (
        <>
          {/* Matriks plotting jadwal cycle & progress pembacaan meter lapangan ditaruh paling atas agar mudah diklik */}
          <MeterReaderProgressSection
            customers={customers}
            meterReaders={meterReaders}
            cycleSchedules={cycleSchedules}
            onSelectCycle={onSelectCycle}
            onOpenImportSchedule={() => setIsImportScheduleOpen(true)}
          />

          {/* Tingkat Keterbacaan Meter per Cycle */}
          <CycleProgressChart
            customers={customers}
            meterReaders={meterReaders}
            cycleSchedules={cycleSchedules}
            onSelectCycle={onSelectCycle}
          />
        </>
      )}

      {/* KONDISIONAL: VERIFIKASI READING (workflowFilter === 'Pending Verification') */}
      {workflowFilter === 'Pending Verification' && (
        <div className="bg-gradient-to-r from-amber-900 to-[#E86216] text-white rounded-2xl p-5 shadow-sm border border-amber-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Clock className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Verifikasi Hasil Pembacaan Meter</h2>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Otoritas Meter Reading
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Daftar pelanggan industri berstatus <strong>'Pending Verification'</strong> atau <strong>'Belum Dibaca'</strong> yang membutuhkan validasi fisik dan BPM lapangan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KONDISIONAL: SECTION BILLING & INVOICING (workflowFilter === 'Verified') - TANPA MATRIKS CYCLE LAPANGAN */}
      {workflowFilter === 'Verified' && (
        <div className="bg-gradient-to-r from-emerald-900 via-[#0055A5] to-[#003E78] text-white rounded-2xl p-5 shadow-sm border border-emerald-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Receipt className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">Modul Billing &amp; Invoicing Unit Industri</h2>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Otoritas Pak Yaya
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                Menampilkan seluruh pelanggan industri berstatus <strong>'Verified'</strong> yang telah selesai dibaca dan divalidasi, siap untuk diterbitkan faktur / invoice resmi dan cetak rekap tagihan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-700/80 text-white font-bold text-xs hover:bg-emerald-600 transition border border-emerald-500/40 shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* REQUESTED FEATURE: BATCH STATUS UPDATE UNTUK KONTRAKTOR & KEY ACCOUNT BERDASARKAN CYCLE */}
      <div className="bg-gradient-to-r from-blue-900 via-[#0055A5] to-[#003E78] text-white rounded-2xl p-5 shadow-md border border-blue-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-blue-700/60 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Zap className="w-5 h-5 text-[#E86216]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-white tracking-wide">
                  Pembaruan Status Massal per Cycle
                </h3>
                <span className="bg-[#E86216] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Batch Update
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                Tandai seluruh pelanggan industri di siklus terpilih menjadi{' '}
                <span className="font-bold text-emerald-300">'Verified' (Siap Billing)</span> atau{' '}
                <span className="font-bold text-amber-300">'Pending'</span> sekaligus dalam 1 kali klik.
              </p>
            </div>
          </div>

          {/* Controls: Target Cycle & Target Scope */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Target Reader Scope Selector */}
            <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center text-xs">
              <button
                onClick={() => setBatchReaderScope('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  batchReaderScope === 'ALL'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Semua Industri
              </button>
              <button
                onClick={() => setBatchReaderScope('Kontraktor')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  batchReaderScope === 'Kontraktor'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Reguler / Kontraktor
              </button>
              <button
                onClick={() => setBatchReaderScope('Key Account')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  batchReaderScope === 'Key Account'
                    ? 'bg-indigo-300 text-indigo-950 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Key Account
              </button>
            </div>

            {/* Target Cycle Selector */}
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider pl-1">
                Cycle:
              </span>
              <select
                value={batchTargetCycle}
                onChange={(e) => handleSelectBatchCycle(e.target.value)}
                className="bg-white text-slate-800 font-bold text-xs px-3 py-1 rounded-lg border-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E86216]"
              >
                {allCycleNames.map((cName) => (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cycle Metrics & Action Panel */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Cycle Info Box with Reader Assignment */}
          <div className="md:col-span-4 bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-white">{batchTargetCycle}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white">
                {batchReaderScope === 'ALL'
                  ? 'Semua Industri'
                  : batchReaderScope === 'Key Account'
                  ? 'Khusus Key Account'
                  : 'Reguler / Kontraktor'}
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-100 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] bg-white/5 p-1 rounded-md">
                <span className="text-amber-200 flex items-center gap-1 font-semibold">
                  <Users className="w-3 h-3" /> Petugas Kontraktor:
                </span>
                <span className="font-bold text-white">{batchCycleDualReaders.contractor}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] bg-white/5 p-1 rounded-md">
                <span className="text-indigo-200 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Key Account:
                </span>
                <span className="font-bold text-white">{batchCycleDualReaders.keyAccount}</span>
              </div>
              <p className="flex justify-between text-[11px]">
                <span className="text-blue-200">Plotting Jadwal:</span>
                <span className="font-mono text-white font-bold">
                  Hari H: Tanggal {batchCycleSchedule?.hariH || 7} (Siklus Bulanan)
                </span>
              </p>
              <div className="pt-2 border-t border-white/15 grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                <div className="bg-white/10 rounded p-1">
                  <div className="text-white font-bold">{batchCycleCounts.total}</div>
                  <div className="text-blue-200 text-[9px]">Target</div>
                </div>
                <div className="bg-amber-500/20 rounded p-1 border border-amber-400/30">
                  <div className="text-amber-300 font-bold">{batchCycleCounts.pending + batchCycleCounts.belumDibaca}</div>
                  <div className="text-amber-200 text-[9px]">Pending</div>
                </div>
                <div className="bg-emerald-500/20 rounded p-1 border border-emerald-400/30">
                  <div className="text-emerald-300 font-bold">{batchCycleCounts.verified}</div>
                  <div className="text-emerald-200 text-[9px]">Verified</div>
                </div>
                <div className="bg-blue-500/20 rounded p-1">
                  <div className="text-blue-200 font-bold">{batchCycleCounts.invoiced}</div>
                  <div className="text-blue-300 text-[9px]">Invoiced</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => triggerCycleBatchUpdate('Verified')}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition" />
              <div className="text-left">
                <div className="leading-tight">
                  1-Klik Tandai {batchReaderScope === 'ALL' ? 'Semua' : batchReaderScope === 'Key Account' ? 'Key Account' : 'Kontraktor'} sbg 'Verified'
                </div>
                <div className="text-[10px] font-normal text-emerald-100">
                  {batchCycleCounts.actionableForVerified} pelanggan di {batchTargetCycle} siap billing
                </div>
              </div>
            </button>

            <button
              onClick={() => triggerCycleBatchUpdate('Pending Verification')}
              className="flex-1 bg-[#E86216] hover:bg-orange-600 active:scale-95 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Clock className="w-4 h-4 text-orange-100 group-hover:scale-110 transition" />
              <div className="text-left">
                <div className="leading-tight">
                  1-Klik Tandai {batchReaderScope === 'ALL' ? 'Semua' : batchReaderScope === 'Key Account' ? 'Key Account' : 'Kontraktor'} sbg 'Pending'
                </div>
                <div className="text-[10px] font-normal text-orange-100">
                  Menunggu verifikasi lapangan {batchTargetCycle}
                </div>
              </div>
            </button>

            <div
              className="bg-white/10 text-white font-bold text-xs py-3 px-3.5 rounded-xl border border-white/20 flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
              title="Filter tabel otomatis tersinkronisasi langsung saat Anda memilih cycle atau pembaca di panel ini"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <div className="text-left">
                <div className="leading-tight text-[11px] text-white">Tersinkronisasi</div>
                <div className="text-[9px] text-blue-200 font-normal">Tabel Terhubung Otomatis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Cycle Chips for Fast Switching across all 15 cycles */}
        <div className="mt-4 pt-3 border-t border-blue-700/60 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-blue-200 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-300" /> Pilih Siklus (Cycle 1 - 15):
          </span>
          {allCycleNames.map((cName) => (
            <button
              key={cName}
              onClick={() => handleSelectBatchCycle(cName)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                batchTargetCycle === cName
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {cName.replace('Cycle ', 'C')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Section with Batch Multi-Select Capability */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/80 dark:bg-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-sm">
                Tabel Monitoring Pembacaan Meter Industri
              </h2>
              {selectedCycle !== 'ALL' && (
                <span className="bg-blue-100 dark:bg-blue-900/60 text-[#0055A5] dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {selectedCycle}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Centang checkbox di bawah untuk update status massal atau gunakan tombol cepat per cycle di atas
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Search bar progress tiap industri */}
            <div className="relative flex-1 sm:w-64 min-w-[180px]">
              <input
                type="text"
                value={industrySearchQuery}
                onChange={(e) => setIndustrySearchQuery(e.target.value)}
                placeholder="Cari industri (ID / Nama / Petugas)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {industrySearchQuery && (
                <button
                  onClick={() => setIndustrySearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={workflowFilter}
              onChange={(e) => onWorkflowFilterChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none shadow-xs"
            >
              <option value="ALL">Semua Status Workflow</option>
              <option value="Belum Dibaca">Belum Dibaca</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Verified">Verified (Ready Billing)</option>
              <option value="Invoiced">Invoiced</option>
            </select>

            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 text-xs font-bold bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Floating/Docked Selection Toolbar when Rows are Selected */}
        {selectedRowIds.length > 0 && (
          <div className="bg-blue-50 dark:bg-slate-700/80 px-4 py-2.5 border-b border-blue-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="bg-[#0055A5] text-white font-mono font-bold px-2 py-0.5 rounded-full text-[11px]">
                {selectedRowIds.length}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Industri terpilih untuk tindakan massal
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleExecuteSelectedRowBatch('Verified')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Terpilih sbg 'Verified'</span>
              </button>

              <button
                onClick={() => handleExecuteSelectedRowBatch('Pending Verification')}
                className="px-3 py-1 bg-[#E86216] hover:bg-orange-600 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tandai Terpilih sbg 'Pending'</span>
              </button>

              {onDeleteBatchCustomers && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmModal({
                      isOpen: true,
                      type: 'batch',
                      count: selectedRowIds.length
                    });
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedRowIds.length})</span>
                </button>
              )}

              <button
                onClick={() => setSelectedRowIds([])}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50 text-[#003E78] dark:text-slate-200 uppercase font-extrabold border-b border-slate-200 dark:border-slate-700 text-[10px] tracking-wider">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleSelectAllRows}
                    title="Pilih / Batalkan semua baris tabel"
                    aria-label="Pilih semua baris tabel"
                    className="w-4 h-4 rounded text-[#0055A5] focus:ring-[#0055A5] cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Pelanggan Industri</th>
                <th className="p-3.5">Cycle</th>
                <th className="p-3.5 text-right">Stand Lalu (m³)</th>
                <th className="p-3.5 text-right">Stand Skrg (m³)</th>
                <th className="p-3.5 text-right">Volume (m³)</th>
                <th className="p-3.5 text-right">Tagihan Air (Rp)</th>
                <th className="p-3.5 text-right">Bea Materai (Rp)</th>
                <th className="p-3.5 text-right">Total Tagihan (Rp)</th>
                <th className="p-3.5">Status Alur Kerja &amp; Catatan</th>
                <th className="p-3.5 text-center">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Tidak ada data industri yang sesuai dengan kriteria filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item) => {
                  const isSelected = selectedRowIds.includes(item.id);
                  const isUnread = item.status === 'Belum Dibaca';
                  const vol = isUnread || !item.skrg || item.skrg === 0 ? 0 : Math.max(0, item.skrg - item.lalu);
                  const tagihanAir = vol * 17872;
                  // UU Bea Meterai: Dokumen tagihan > 5 Juta otomatis dikenakan Bea Materai Rp 10.000
                  const isMaterai = tagihanAir > 5000000;
                  const materai = isMaterai ? 10000 : 0;
                  const totalTagihan = tagihanAir + materai;

                  let badgeColor =
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
                  if (item.status === 'Pending Verification') {
                    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                  } else if (item.status === 'Verified') {
                    badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                  } else if (item.status === 'Invoiced') {
                    badgeColor =
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                  }

                  // Anomaly flag if spike > 50%
                  const prevVol =
                    item.history && item.history.length >= 2
                      ? item.history[item.history.length - 1] - item.history[item.history.length - 2]
                      : 0;
                  const isAnomaly = prevVol > 0 && vol > prevVol * 1.5;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRowSelection(item.id)}
                          aria-label={`Pilih industri ${item.nama}`}
                          className="w-4 h-4 rounded text-[#0055A5] focus:ring-[#0055A5] cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-start gap-1.5">
                          {isAnomaly && (
                            <span title="Peringatan Lonjakan Pemakaian Air!">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {item.nama}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.id} · <span className="font-sans font-medium text-slate-500">{item.kelas}</span> · {item.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-[#0055A5] dark:text-blue-400">
                        {item.cycle}
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {item.lalu.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {isUnread || !item.skrg || item.skrg === 0 ? (
                          <span className="text-slate-400 font-normal italic">—</span>
                        ) : (
                          item.skrg.toLocaleString()
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-right font-black text-[#E86216] tabular-nums">
                        {isUnread || !item.skrg || item.skrg === 0 ? (
                          <span className="text-slate-400 font-normal italic">—</span>
                        ) : (
                          vol.toLocaleString()
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-right font-black text-[#0055A5] dark:text-blue-400 tabular-nums">
                        Rp {tagihanAir.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-right tabular-nums text-slate-600 dark:text-slate-300">
                        <div>Rp {materai.toLocaleString()}</div>
                        {isMaterai && (
                          <span className="inline-block text-[8px] font-black text-indigo-600 dark:text-indigo-400 font-sans uppercase bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.2 rounded mt-0.5">
                            e-Materai (&gt;5Jt)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        Rp {totalTagihan.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${badgeColor}`}
                          >
                            {item.status}
                          </span>
                          {item.status === 'Belum Dibaca' || !item.fotoMeter ? (
                            <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              📷 Foto &amp; BPM: Menunggu Petugas
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              ✓ Foto &amp; BPM Terlampir
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs truncate">
                          {item.catatan || '-'}
                        </p>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDetail(item)}
                            className="px-2.5 py-1 bg-[#E6F0FA] dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 hover:bg-[#0055A5] hover:text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
                          >
                            🔍 Detail
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceCustomer(item)}
                            className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1"
                            title="Cetak Invoice PDF Sesuai Template Resmi PT Aetra"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                          {item.status !== 'Verified' && item.status !== 'Invoiced' && (
                            <button
                              onClick={() =>
                                onBatchUpdateStatus(
                                  [item.id],
                                  'Verified',
                                  `Verifikasi meter individual ${item.nama}`
                                )
                              }
                              title="Tandai Verified"
                              className="p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmModal({
                                  isOpen: true,
                                  type: 'single',
                                  id: item.id,
                                  name: item.nama
                                });
                              }}
                              title="Hapus Data Industri"
                              className="p-1 text-rose-500 hover:text-white hover:bg-rose-600 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for 1-Click Cycle Batch Update */}
      {confirmBatchModal && confirmBatchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    confirmBatchModal.targetStatus === 'Verified'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                    Konfirmasi Pembaruan Massal Cycle
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {confirmBatchModal.cycle} · {batchCyclePicInfo.name} ({batchCyclePicInfo.company})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmBatchModal(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Anda akan mengubah status{' '}
                <strong className="text-slate-900 dark:text-white">
                  {confirmBatchModal.customerIds.length} pelanggan industri
                </strong>{' '}
                di <strong className="text-[#0055A5] dark:text-blue-400">{confirmBatchModal.cycle}</strong>{' '}
                menjadi:
              </p>

              <div
                className={`p-3 rounded-xl border text-center font-bold text-sm ${
                  confirmBatchModal.targetStatus === 'Verified'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                }`}
              >
                {confirmBatchModal.targetStatus === 'Verified' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Status: Verified (Siap Masuk Billing Pak Yaya)
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4" /> Status: Pending Verification (Perlu Pengecekan Lapangan)
                  </span>
                )}
              </div>

              {/* List of Affected Customers */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Daftar Industri yang Diperbarui:
                </p>
                <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  {confirmBatchModal.affectedNames.map((nama, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0055A5] shrink-0" />
                      <span className="truncate">{nama}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Catatan Operasional (Opsional):
                </label>
                <input
                  type="text"
                  placeholder={`Contoh: Verifikasi fisik meter oleh ${batchCyclePicInfo.name} (${batchCyclePicInfo.company})`}
                  value={batchCustomNote}
                  onChange={(e) => setBatchCustomNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0055A5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setConfirmBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={executeConfirmBatchUpdate}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 ${
                  confirmBatchModal.targetStatus === 'Verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#E86216] hover:bg-orange-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi &amp; Terapkan ({confirmBatchModal.customerIds.length} Industri)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for importing cycle schedule */}
      {isImportScheduleOpen && (
        <ImportCycleScheduleModal
          isOpen={true}
          onClose={() => setIsImportScheduleOpen(false)}
          onImport={(schedules) => {
            onImportCycleSchedules(schedules);
            setBatchFeedback({
              type: 'success',
              message: `Berhasil mengimpor tanggal pembacaan untuk ${schedules.length} cycle via Excel!`
            });
            setTimeout(() => setBatchFeedback(null), 5000);
          }}
        />
      )}

      {/* IN-APP CONFIRMATION MODAL DIALOG FOR DELETION (Non-blocking in iframes) */}
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
                    {deleteConfirmModal.count} industri terpilih
                  </span>{' '}
                  dari daftar monitoring &amp; alur kerja?
                </p>
              ) : (
                <p>
                  Apakah Anda yakin ingin menghapus data industri{' '}
                  <span className="font-black text-slate-900 dark:text-white">
                    {deleteConfirmModal.name}
                  </span>{' '}
                  (ID: {deleteConfirmModal.id}) dari sistem?
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

      {selectedInvoiceCustomer && (
        <OfficialAetraInvoiceModal
          customer={selectedInvoiceCustomer}
          onClose={() => setSelectedInvoiceCustomer(null)}
        />
      )}
    </div>
  );
};
