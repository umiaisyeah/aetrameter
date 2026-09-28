import React, { useState, useEffect, useMemo } from 'react';
import { IndustryCustomer, AuditLog, UserProfile, MeterReader, CycleSchedule, WorkflowStatus } from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_AUDIT_LOGS,
  USER_PROFILES,
  INITIAL_METER_READERS,
  INITIAL_CYCLE_SCHEDULES
} from './data/initialData';
import { ModalLogin } from './components/ModalLogin';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { DatabaseView } from './components/DatabaseView';
import { AuditView } from './components/AuditView';
import { DetailModal } from './components/DetailModal';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { ImportCycleScheduleModal } from './components/ImportCycleScheduleModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { getSupabaseConfig } from './services/supabaseClient';
import {
  testSupabaseConnection,
  fetchSupabaseCustomers,
  fetchSupabaseMeterReaders,
  fetchSupabaseCycleSchedules,
  upsertSupabaseCustomer,
  batchUpdateSupabaseStatus,
  insertSupabaseAuditLog,
  subscribeToFieldReaderUpdates
} from './services/supabaseService';

export default function App() {
  // Load state from localStorage or initial fallback
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aetra_current_user');
    return saved ? JSON.parse(saved) : USER_PROFILES.yaya;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [customers, setCustomers] = useState<IndustryCustomer[]>(() => {
    const saved = localStorage.getItem('aetra_industri_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            ...c,
            petugasBaca: undefined,
            kategoriPetugas: undefined,
            catatan: c.catatan
              ? c.catatan
                  .replace(/Ahmad Fauzi|Bambang Sutrisno|Rudi Hartono|Dani Permana|Budi Santoso|Dewi Lestari|PT Hideco|Kontraktor \(PT Hideco\)/gi, '')
                  .trim()
              : ''
          }));
        }
      } catch {}
    }
    return INITIAL_CUSTOMERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('aetra_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          const hasKabul = parsed.some((l: AuditLog) => l.user && l.user.toLowerCase().includes('kabul'));
          if (!hasKabul) {
            return [...INITIAL_AUDIT_LOGS.filter(l => l.user.toLowerCase().includes('kabul')), ...parsed];
          }
          return parsed;
        }
      } catch {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [meterReaders, setMeterReaders] = useState<MeterReader[]>(() => {
    const saved = localStorage.getItem('aetra_meter_readers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Discard old mock names or PT Hideco if present
          const hasMock = parsed.some((r: any) =>
            ['ahmad fauzi', 'bambang sutrisno', 'rudi hartono', 'dani permana', 'budi santoso', 'dewi lestari'].includes(
              (r.nama || '').toLowerCase()
            ) || (r.perusahaan || '').toLowerCase().includes('hideco')
          );
          if (!hasMock) {
            return parsed;
          }
        }
      } catch {}
    }
    return INITIAL_METER_READERS; // []
  });

  const [cycleSchedules, setCycleSchedules] = useState<CycleSchedule[]>(() => {
    const saved = localStorage.getItem('aetra_cycle_schedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: CycleSchedule) => {
            const isMockName = ['ahmad fauzi', 'bambang sutrisno', 'rudi hartono', 'dani permana', 'budi santoso', 'dewi lestari'].includes(
              (s.petugasUtama || '').toLowerCase()
            );
            return {
              ...s,
              petugasUtama: isMockName ? 'Belum Ditugaskan' : (s.petugasUtama || 'Belum Ditugaskan'),
              kategoriPetugas: undefined,
              catatan: s.catatan
                ? s.catatan.replace(/PT Hideco|Kontraktor \(PT Hideco\)/gi, '').trim()
                : ''
            };
          });
        }
      } catch {}
    }
    return INITIAL_CYCLE_SCHEDULES;
  });

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<string>('monitoring');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<string>('ALL');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('aetra_theme') === 'dark';
  });

  // Modals
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<IndustryCustomer | null>(null);
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState<IndustryCustomer | null>(null);
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      localStorage.setItem('aetra_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('dark');
      localStorage.setItem('aetra_theme', 'light');
    }
  }, [isDarkMode]);

  // Supabase Initial Load & Realtime Subscription for Field Readers
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initSupabase = async () => {
      const config = getSupabaseConfig();
      if (!config.isConfigured) {
        setIsSupabaseConnected(false);
        return;
      }

      const test = await testSupabaseConnection();
      if (test.success) {
        setIsSupabaseConnected(true);

        // Fetch live customers from Supabase
        const remoteCusts = await fetchSupabaseCustomers();
        if (remoteCusts && remoteCusts.length > 0) {
          setCustomers(remoteCusts);
        }

        // Fetch live readers
        const remoteReaders = await fetchSupabaseMeterReaders();
        if (remoteReaders && remoteReaders.length > 0) {
          setMeterReaders(remoteReaders);
        }

        // Fetch live schedules
        const remoteSchedules = await fetchSupabaseCycleSchedules();
        if (remoteSchedules && remoteSchedules.length > 0) {
          setCycleSchedules(remoteSchedules);
        }

        // Realtime subscription: live updates when field meter readers input readings!
        unsubscribe = subscribeToFieldReaderUpdates(
          (updatedCust) => {
            setCustomers((prev) => {
              const exists = prev.some((c) => c.id === updatedCust.id);
              if (exists) {
                return prev.map((c) => (c.id === updatedCust.id ? updatedCust : c));
              }
              return [updatedCust, ...prev];
            });
          },
          (deletedId) => {
            setCustomers((prev) => prev.filter((c) => c.id !== deletedId));
          },
          (newLog) => {
            setAuditLogs((prev) => [newLog, ...prev]);
          }
        );
      } else {
        setIsSupabaseConnected(false);
      }
    };

    initSupabase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persist customers & audit logs
  useEffect(() => {
    localStorage.setItem('aetra_industri_data', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('aetra_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('aetra_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aetra_meter_readers', JSON.stringify(meterReaders));
  }, [meterReaders]);

  useEffect(() => {
    localStorage.setItem('aetra_cycle_schedules', JSON.stringify(cycleSchedules));
  }, [cycleSchedules]);

  // Logging function
  const logActivity = (desc: string, type: AuditLog['type'] = 'info') => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: timeStr,
      user: currentUser.name,
      role: currentUser.title,
      desc,
      type
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    insertSupabaseAuditLog(newLog).catch(() => {});
  };

  // Auth handlers
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    logActivity(`Masuk ke dashboard sebagai ${user.name} (${user.title})`);
  };

  const handleLogout = () => {
    logActivity(`Keluar dari sistem.`);
    setIsLoginModalOpen(true);
  };

  // Tab navigation
  const handleSelectTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter) {
      setWorkflowFilter(filter);
    } else {
      setWorkflowFilter('ALL');
    }
  };

  // Customer modifications
  const handleSaveReading = (updated: IndustryCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    upsertSupabaseCustomer(updated).catch(() => {});
    logActivity(
      `Memperbarui stand meter ${updated.nama} (${updated.id}) ke angka ${updated.skrg.toLocaleString()} m³`,
      'update'
    );
    setSelectedCustomerForDetail(null);
  };

  const handleProcessInvoice = (updated: IndustryCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    upsertSupabaseCustomer({ ...updated, status: 'Invoiced' }).catch(() => {});
    logActivity(
      `Menerbitkan faktur tagihan & email untuk ${updated.nama} (${updated.id})`,
      'invoice'
    );
    setSelectedCustomerForDetail(updated);
  };

  const handleAddCustomer = (newCustomer: IndustryCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    upsertSupabaseCustomer(newCustomer).catch(() => {});
    logActivity(`Menambahkan akun industri baru: ${newCustomer.nama} (${newCustomer.id}) pada ${newCustomer.cycle}`, 'update');
  };

  const handleImportCustomers = (importedList: IndustryCustomer[]) => {
    setCustomers((prev) => [...importedList, ...prev]);
    importedList.forEach((c) => upsertSupabaseCustomer(c).catch(() => {}));
    logActivity(`Mengimpor ${importedList.length} data industri via file Excel.`, 'import');
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logActivity(`Menghapus data industri ID ${id} (${target?.nama || 'Unknown'})`, 'delete');
  };

  const handleDeleteBatchCustomers = (ids: string[]) => {
    setCustomers((prev) => prev.filter((c) => !ids.includes(c.id)));
    logActivity(`Menghapus ${ids.length} data industri secara massal via checklist.`, 'delete');
  };

  const handleBatchUpdateStatus = (
    ids: string[],
    newStatus: WorkflowStatus,
    note?: string
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          return {
            ...c,
            status: newStatus,
            catatan: note || `Status diperbarui massal menjadi ${newStatus}.`
          };
        }
        return c;
      })
    );
    batchUpdateSupabaseStatus(ids, newStatus, note).catch(() => {});
    logActivity(
      `Memperbarui status ${ids.length} industri menjadi '${newStatus}'`,
      'update'
    );
  };

  // Meter Reader handlers
  const handleAddMeterReader = (newReader: MeterReader) => {
    setMeterReaders((prev) => [...prev, newReader]);
    logActivity(`Menambahkan petugas pembaca meter baru: ${newReader.nama} (${newReader.nip})`, 'update');
  };

  const handleUpdateMeterReader = (updatedReader: MeterReader) => {
    setMeterReaders((prev) => prev.map((r) => (r.id === updatedReader.id ? updatedReader : r)));
    logActivity(`Memperbarui data dan penugasan cycle petugas: ${updatedReader.nama}`, 'update');
  };

  const handleDeleteMeterReader = (id: string) => {
    const target = meterReaders.find((r) => r.id === id);
    setMeterReaders((prev) => prev.filter((r) => r.id !== id));
    logActivity(`Menghapus petugas pembaca meter: ${target?.nama || id}`, 'delete');
  };

  // Cycle Schedule handlers
  const handleUpdateCycleSchedule = (updatedSchedule: CycleSchedule) => {
    setCycleSchedules((prev) => {
      const exists = prev.some((s) => s.cycle.toLowerCase() === updatedSchedule.cycle.toLowerCase());
      if (exists) {
        return prev.map((s) =>
          s.cycle.toLowerCase() === updatedSchedule.cycle.toLowerCase() ? updatedSchedule : s
        );
      }
      return [...prev, updatedSchedule];
    });
    logActivity(
      `Memperbarui jadwal ${updatedSchedule.cycle} menjadi ${updatedSchedule.tanggalMulai} - ${updatedSchedule.tanggalSelesai} (PIC: ${updatedSchedule.petugasUtama})`,
      'update'
    );
  };

  const handleImportCycleSchedules = (importedSchedules: CycleSchedule[]) => {
    // 1. Update cycle schedules
    setCycleSchedules((prev) => {
      const updatedMap = new Map<string, CycleSchedule>();
      // Keep existing
      prev.forEach((s) => updatedMap.set(s.cycle.toLowerCase(), s));
      // Overwrite/Add imported
      importedSchedules.forEach((s) => updatedMap.set(s.cycle.toLowerCase(), s));
      return Array.from(updatedMap.values());
    });

    // 2. Automatically synchronize meter reader names and cycle assignments from imported Excel
    setMeterReaders((prevReaders) => {
      const readersList = [...prevReaders];
      const readerNameMap = new Map<string, MeterReader>();
      readersList.forEach((r) => readerNameMap.set(r.nama.toLowerCase().trim(), r));

      importedSchedules.forEach((sch) => {
        const rawName = sch.petugasUtama?.trim();
        if (!rawName || rawName.toLowerCase() === 'petugas lapangan') return;

        const isKeyAccount =
          sch.kategoriPetugas === 'Key Account' ||
          rawName.toLowerCase().includes('budi') ||
          rawName.toLowerCase().includes('dewi');

        const key = rawName.toLowerCase();
        if (readerNameMap.has(key)) {
          // Reader exists: update assignedCycles if missing
          const existing = readerNameMap.get(key)!;
          if (sch.cycle && !existing.assignedCycles.includes(sch.cycle)) {
            existing.assignedCycles = [...existing.assignedCycles, sch.cycle];
          }
        } else {
          // New reader found in Excel: create new record
          const idNum = Math.floor(10 + Math.random() * 90);
          const newReader: MeterReader = {
            id: isKeyAccount ? `KA-IMP-${idNum}` : `RDR-IMP-${idNum}`,
            nama: rawName,
            nip: isKeyAccount ? `AET-KA-2026-${idNum}` : `RDR-2026-${idNum}`,
            noHp: `0812-77${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`,
            kategori: isKeyAccount ? 'Key Account' : 'Kontraktor',
            perusahaan: isKeyAccount ? 'PT Aetra Air Tangerang (Key Account)' : 'Mitra Kontraktor',
            assignedCycles: sch.cycle ? [sch.cycle] : [],
            status: 'Aktif',
            email: `${rawName.toLowerCase().replace(/\s+/g, '.')}@${isKeyAccount ? 'aetratangerang.co.id' : 'mitra-meter.id'}`,
            wilayah: `Penugasan Lapangan ${sch.cycle || ''}`
          };
          readerNameMap.set(key, newReader);
          readersList.push(newReader);
        }
      });

      return readersList;
    });

    logActivity(
      `Mengimpor jadwal tanggal pembacaan untuk ${importedSchedules.length} cycle via Excel & otomatis menyinkronkan daftar petugas pembaca meter.`,
      'import'
    );
  };

  const handleClearLogs = () => {
    setAuditLogs([]);
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,ID Pelanggan,Nama Perusahaan,Cycle,Kelas,Stand Lalu,Stand Sekarang,Volume (m3),Bea Materai,Total Tagihan,Status Workflow,Catatan\n';
    customers.forEach((row) => {
      const vol = Math.max(0, row.skrg - row.lalu);
      const estTagihan = vol * 12500;
      const materai = vol > 1000 ? 10000 : 0;
      const total = estTagihan + materai;
      const rowData = [
        row.id,
        `"${row.nama.replace(/"/g, '""')}"`,
        row.cycle,
        row.kelas,
        row.lalu,
        row.skrg,
        vol,
        materai,
        total,
        row.status,
        `"${(row.catatan || '').replace(/"/g, '""')}"`
      ];
      csvContent += rowData.join(',') + '\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_industri_simba_in_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logActivity('Mengekspor data monitoring pembacaan meter ke format CSV.');
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Filtered dataset for main view
  const filteredCustomers = useMemo(() => {
    return customers
      .map((item) => {
        // If a specific month is selected (e.g. Januari 2026), reflect that active month on the customer record
        if (selectedBulan !== 'ALL' && item.bulan !== selectedBulan) {
          return {
            ...item,
            bulan: selectedBulan
          };
        }
        return item;
      })
      .filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
          !query ||
          item.nama.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query);

        const matchCycle = selectedCycle === 'ALL' || item.cycle === selectedCycle;
        const matchKelas = selectedKelas === 'ALL' || item.kelas === selectedKelas;
        const matchBulan = selectedBulan === 'ALL' || item.bulan === selectedBulan;

        return matchSearch && matchCycle && matchKelas && matchBulan;
      });
  }, [customers, searchQuery, selectedCycle, selectedKelas, selectedBulan]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Login Modal */}
      {isLoginModalOpen && <ModalLogin isOpen={true} onLogin={handleLogin} />}

      {/* Detail & Inspection Modal */}
      {selectedCustomerForDetail && (
        <DetailModal
          isOpen={true}
          customer={selectedCustomerForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedCustomerForDetail(null)}
          onSaveReading={handleSaveReading}
          onProcessInvoice={handleProcessInvoice}
          onOpenPrintInvoice={(cust) => {
            setSelectedCustomerForDetail(null);
            setSelectedCustomerForInvoice(cust);
          }}
        />
      )}

      {/* Formal Printable Invoice Modal */}
      {selectedCustomerForInvoice && (
        <PrintInvoiceModal
          isOpen={true}
          customer={selectedCustomerForInvoice}
          onClose={() => setSelectedCustomerForInvoice(null)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        workflowFilter={workflowFilter}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCycle={selectedCycle}
          onCycleChange={setSelectedCycle}
          selectedKelas={selectedKelas}
          onKelasChange={setSelectedKelas}
          selectedBulan={selectedBulan}
          onBulanChange={setSelectedBulan}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          currentUser={currentUser}
          onLogout={handleLogout}
          cycleSchedules={cycleSchedules}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          isSupabaseConnected={isSupabaseConnected}
        />

        {/* Tab View Contents */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {(activeTab === 'monitoring' || activeTab === 'overview') && (
            <OverviewView
              customers={filteredCustomers}
              allCustomers={customers}
              meterReaders={meterReaders}
              cycleSchedules={cycleSchedules}
              selectedCycle={selectedCycle}
              workflowFilter={workflowFilter}
              onWorkflowFilterChange={setWorkflowFilter}
              onSelectCycle={(cycle) => setSelectedCycle(cycle)}
              onOpenDetail={(cust) => setSelectedCustomerForDetail(cust)}
              onOpenPrintReport={handlePrintReport}
              onExportCSV={handleExportCSV}
              onImportCycleSchedules={handleImportCycleSchedules}
              onBatchUpdateStatus={handleBatchUpdateStatus}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseView
              customers={customers}
              meterReaders={meterReaders}
              cycleSchedules={cycleSchedules}
              onAddCustomer={handleAddCustomer}
              onImportCustomers={handleImportCustomers}
              onDeleteCustomer={handleDeleteCustomer}
              onDeleteBatchCustomers={handleDeleteBatchCustomers}
              onAddMeterReader={handleAddMeterReader}
              onUpdateMeterReader={handleUpdateMeterReader}
              onDeleteMeterReader={handleDeleteMeterReader}
              onImportCycleSchedules={handleImportCycleSchedules}
              onUpdateCycleSchedule={handleUpdateCycleSchedule}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} onClearLogs={handleClearLogs} />
          )}
        </main>
      </div>

      {/* Global Import Cycle Schedule Modal */}
      {isImportScheduleOpen && (
        <ImportCycleScheduleModal
          isOpen={isImportScheduleOpen}
          onClose={() => setIsImportScheduleOpen(false)}
          onImport={(schedules) => {
            handleImportCycleSchedules(schedules);
            setIsImportScheduleOpen(false);
          }}
        />
      )}

      {/* Supabase Backend Live Config & Field Reader API Modal */}
      {isSupabaseModalOpen && (
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => {
            setIsSupabaseModalOpen(false);
            const config = getSupabaseConfig();
            setIsSupabaseConnected(config.isConfigured);
          }}
          customers={customers}
          meterReaders={meterReaders}
          cycleSchedules={cycleSchedules}
          auditLogs={auditLogs}
          onDataLoadedFromSupabase={(data) => {
            setCustomers(data.customers);
            setMeterReaders(data.meterReaders);
            setCycleSchedules(data.cycleSchedules);
            setAuditLogs(data.auditLogs);
            setIsSupabaseConnected(true);
          }}
        />
      )}
    </div>
  );
}
