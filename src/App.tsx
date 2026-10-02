import React, { useState, useEffect, useMemo } from 'react';
import { IndustryCustomer, AuditLog, UserProfile, MeterReader, CycleSchedule, WorkflowStatus, ReaderCategory } from './types';
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
import { FieldReaderApp } from './components/FieldReaderApp';
import { SectionNavBar } from './components/SectionNavBar';
import { MobileBottomNavigation } from './components/MobileBottomNavigation';
import { ColorfulNotificationModal } from './components/ColorfulNotificationModal';
import { ColorfulToastContainer } from './components/ColorfulToastContainer';
import { showColorfulAlert, showToast } from './utils/notificationSystem';
import {
  getAssignedCyclesForReader,
  getReaderCategory,
  getReaderCompany
} from './utils/readerAssignmentHelper';
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
import { fetchCloudState, pushCloudState } from './services/cloudSyncService';

export default function App() {
  // Always show login page first upon opening the application
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);

  const [customers, setCustomers] = useState<IndustryCustomer[]>(() => {
    const saved = localStorage.getItem('aetra_industri_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => {
            const isUnread = c.status === 'Belum Dibaca';
            const cleanCatatan = c.catatan
              ? c.catatan
                  .replace(/Diimpor dari file Excel.*$/i, '')
                  .replace(/Ahmad Fauzi|Bambang Sutrisno|Rudi Hartono|Dani Permana|Budi Santoso|Dewi Lestari|PT Hideco|Kontraktor \(PT Hideco\)/gi, '')
                  .trim()
              : '';
            return {
              ...c,
              // Stand kini tidak terisi jika berstatus Belum Dibaca
              skrg: isUnread && c.skrg === c.lalu ? 0 : c.skrg,
              catatan: cleanCatatan
            };
          });
        }
      } catch {}
    }
    return [];
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
    const saved = localStorage.getItem('aetra_meter_readers_official') || localStorage.getItem('aetra_meter_readers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 7) {
          // Normalize and verify categories strictly: 1 person = 1 role
          return parsed.map((r: MeterReader) => {
            const role = getReaderCategory(r.nama);
            const company = getReaderCompany(r.nama);
            return {
              ...r,
              kategori: role,
              perusahaan: company
            };
          });
        }
      } catch {}
    }
    return INITIAL_METER_READERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aetra_meter_readers_official', JSON.stringify(meterReaders));
      localStorage.setItem('aetra_meter_readers', JSON.stringify(meterReaders));
    } catch {}
  }, [meterReaders]);

  // Automatically sync meter readers' assigned cycles and roles with inputted customer data (ZERO OVERLAP & 1 PERSON = 1 ROLE)
  useEffect(() => {
    setMeterReaders((prev) => {
      let changed = false;
      const updated = prev.map((r) => {
        const freshCycles = getAssignedCyclesForReader(r, customers);
        const role = getReaderCategory(r.nama);
        const company = getReaderCompany(r.nama);
        const isSame =
          r.kategori === role &&
          r.perusahaan === company &&
          r.assignedCycles &&
          r.assignedCycles.length === freshCycles.length &&
          r.assignedCycles.every((c, i) => c === freshCycles[i]);
        if (!isSame) {
          changed = true;
          return {
            ...r,
            kategori: role,
            perusahaan: company,
            assignedCycles: freshCycles
          };
        }
        return r;
      });
      return changed ? updated : prev;
    });
  }, [customers]);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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

  // Cloud Backend & Supabase Initial Load & Realtime Sync across devices
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let pollInterval: any = null;

    const initCloudSync = async () => {
      // 1. Fetch from cloud backend (/api/sync-state)
      try {
        const cloud = await fetchCloudState();
        if (cloud) {
          if (cloud.customers && cloud.customers.length > 0) setCustomers(cloud.customers);
          if (cloud.meterReaders && cloud.meterReaders.length > 0) setMeterReaders(cloud.meterReaders);
          if (cloud.cycleSchedules && cloud.cycleSchedules.length > 0) setCycleSchedules(cloud.cycleSchedules);
          if (cloud.auditLogs && cloud.auditLogs.length > 0) setAuditLogs(cloud.auditLogs);
        }
      } catch {}

      // 2. Supabase if configured with valid HTTP/HTTPS URL and tables are ready
      try {
        const config = getSupabaseConfig();
        if (config.isConfigured) {
          const test = await testSupabaseConnection();
          if (test.success && test.tablesReady) {
            setIsSupabaseConnected(true);
            const remoteCusts = await fetchSupabaseCustomers();
            if (remoteCusts && remoteCusts.length > 0) setCustomers(remoteCusts);
            const remoteReaders = await fetchSupabaseMeterReaders();
            if (remoteReaders && remoteReaders.length > 0) setMeterReaders(remoteReaders);
            const remoteSchedules = await fetchSupabaseCycleSchedules();
            if (remoteSchedules && remoteSchedules.length > 0) setCycleSchedules(remoteSchedules);

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
        } else {
          setIsSupabaseConnected(false);
        }
      } catch (e) {
        console.warn('Supabase initialization bypassed:', e);
        setIsSupabaseConnected(false);
      }

      // 3. Fast background polling for cross-device realtime sync (every 2.5 seconds)
      pollInterval = setInterval(async () => {
        try {
          const cloud = await fetchCloudState();
          if (cloud && cloud.customers && cloud.customers.length > 0) {
            setCustomers((prev) => {
              // Deep compare length and key properties to avoid unnecessary re-renders
              if (prev.length !== cloud.customers.length) {
                return cloud.customers;
              }
              const hasChange = cloud.customers.some((c, i) => {
                const p = prev[i];
                return !p || p.id !== c.id || p.skrg !== c.skrg || p.status !== c.status || p.catatan !== c.catatan;
              });
              if (hasChange) {
                return cloud.customers;
              }
              return prev;
            });
          }
          if (cloud && cloud.meterReaders && cloud.meterReaders.length > 0) {
            setMeterReaders((prev) => {
              if (prev.length !== cloud.meterReaders.length) {
                return cloud.meterReaders;
              }
              return prev;
            });
          }
          if (cloud && cloud.cycleSchedules && cloud.cycleSchedules.length > 0) {
            setCycleSchedules((prev) => {
              if (prev.length !== cloud.cycleSchedules.length) {
                return cloud.cycleSchedules;
              }
              return prev;
            });
          }
        } catch {}
      }, 2500);
    };

    initCloudSync();

    return () => {
      if (unsubscribe) unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Auto push state to cloud backend on change for cross-device sync
  useEffect(() => {
    if (customers.length === 0) return;
    const timer = setTimeout(() => {
      pushCloudState({
        customers,
        meterReaders,
        cycleSchedules,
        auditLogs
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [customers, meterReaders, cycleSchedules, auditLogs]);

  // Persist customers & audit logs safely with try/catch quota protection
  useEffect(() => {
    try {
      localStorage.setItem('aetra_industri_data', JSON.stringify(customers));
    } catch (err) {
      console.warn('LocalStorage quota exceeded for customers:', err);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('aetra_audit_logs', JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('aetra_current_user', JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('aetra_meter_readers', JSON.stringify(meterReaders));
    } catch {}
  }, [meterReaders]);

  useEffect(() => {
    try {
      localStorage.setItem('aetra_cycle_schedules', JSON.stringify(cycleSchedules));
    } catch {}
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
      user: currentUser ? currentUser.name : 'Sistem Otomasi',
      role: currentUser ? currentUser.title : 'System Operation',
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
    setCurrentUser(null);
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
    let nextCusts: IndustryCustomer[] = [];
    setCustomers((prev) => {
      nextCusts = prev.map((c) => (c.id === updated.id ? updated : c));
      try {
        localStorage.setItem('aetra_industri_data', JSON.stringify(nextCusts));
        localStorage.setItem('aetra_customers_official', JSON.stringify(nextCusts));
      } catch {}
      return nextCusts;
    });

    // Instant cloud push
    pushCloudState({ customers: nextCusts, updatedAt: new Date().toISOString() }).catch(() => {});
    upsertSupabaseCustomer(updated).catch(() => {});

    // Instant multi-tab broadcast
    try {
      const bc = new BroadcastChannel('aetra_simba_online_sync');
      bc.postMessage({
        type: 'STATE_UPDATE',
        action: 'READING_SAVED',
        customer: updated,
        customers: nextCusts
      });
      bc.close();
    } catch {}

    logActivity(
      `Pencatat meter ${updated.petugasBaca || currentUser?.name || 'Petugas'} mengirim hasil pembacaan stand ${updated.nama} (${updated.id}) ke angka ${updated.skrg.toLocaleString()} m³`,
      'update'
    );
    setSelectedCustomerForDetail(null);
  };

  const handleProcessInvoice = (updated: IndustryCustomer) => {
    const invoicedCust = { ...updated, status: 'Invoiced' as WorkflowStatus };
    let nextCusts: IndustryCustomer[] = [];
    setCustomers((prev) => {
      nextCusts = prev.map((c) => (c.id === updated.id ? invoicedCust : c));
      try {
        localStorage.setItem('aetra_industri_data', JSON.stringify(nextCusts));
        localStorage.setItem('aetra_customers_official', JSON.stringify(nextCusts));
      } catch {}
      return nextCusts;
    });

    pushCloudState({ customers: nextCusts, updatedAt: new Date().toISOString() }).catch(() => {});
    upsertSupabaseCustomer(invoicedCust).catch(() => {});

    try {
      const bc = new BroadcastChannel('aetra_simba_online_sync');
      bc.postMessage({
        type: 'STATE_UPDATE',
        action: 'INVOICED',
        customer: invoicedCust,
        customers: nextCusts
      });
      bc.close();
    } catch {}

    logActivity(
      `Menerbitkan faktur tagihan & email untuk ${updated.nama} (${updated.id})`,
      'invoice'
    );
    setSelectedCustomerForDetail(invoicedCust);
  };

  const handleAddCustomer = (newCustomer: IndustryCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    upsertSupabaseCustomer(newCustomer).catch(() => {});
    logActivity(`Menambahkan akun industri baru: ${newCustomer.nama} (${newCustomer.id}) pada ${newCustomer.cycle}`, 'update');
  };

  const handleImportCustomers = (importedList: IndustryCustomer[]) => {
    const combinedCustomers = [...importedList, ...customers];
    setCustomers(combinedCustomers);
    importedList.forEach((c) => upsertSupabaseCustomer(c).catch(() => {}));

    // Auto-sync meter readers and cycle assignments strictly from combined customers (ZERO OVERLAP)
    setMeterReaders((prevReaders) => {
      const updatedReaders = [...prevReaders];

      importedList.forEach((cust) => {
        const readerName = cust.petugasBaca?.trim();
        if (!readerName) return;

        const existingIdx = updatedReaders.findIndex(
          (r) => r.nama.toLowerCase() === readerName.toLowerCase()
        );

        const category: ReaderCategory = getReaderCategory(readerName);
        const company = getReaderCompany(readerName);
        const isKeyAccount = category === 'Key Account';

        if (existingIdx === -1) {
          const newId = `RDR-${String(updatedReaders.length + 1).padStart(3, '0')}`;
          updatedReaders.push({
            id: newId,
            nama: readerName,
            nip: `AET-${isKeyAccount ? 'KEY' : 'KONT'}-2026-${String(updatedReaders.length + 1).padStart(3, '0')}`,
            noHp: '0812-88' + Math.floor(10 + Math.random() * 89) + '-' + Math.floor(1000 + Math.random() * 9000),
            email: `${readerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@aetra-tangerang.co.id`,
            kategori: category,
            perusahaan: company,
            assignedCycles: [],
            status: 'Aktif',
            joinDate: '2026-01-15'
          });
        }
      });

      // Recalculate assignedCycles for EVERY reader strictly based on their assigned customers (ZERO OVERLAP)
      return updatedReaders.map((reader) => ({
        ...reader,
        assignedCycles: getAssignedCyclesForReader(reader, combinedCustomers)
      }));
    });

    logActivity(
      `Mengimpor ${importedList.length} data industri via Excel & otomatis sinkronisasi penugasan pembaca meter lapangan tanpa overlap.`,
      'import'
    );
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

  // Real-time cross-device & cross-tab online synchronization effect
  useEffect(() => {
    const channelName = 'aetra_simba_online_sync';
    let broadcast: BroadcastChannel | null = null;
    try {
      broadcast = new BroadcastChannel(channelName);
      broadcast.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
          if (event.data.customers) setCustomers(event.data.customers);
          if (event.data.meterReaders) setMeterReaders(event.data.meterReaders);
          if (event.data.cycleSchedules) setCycleSchedules(event.data.cycleSchedules);

          if (event.data.action === 'READING_SAVED' && event.data.customer) {
            showToast({
              title: '📥 Data Stand Masuk dari Lapangan! 🛰️',
              message: `${event.data.customer.petugasBaca || 'Petugas'} telah mencatat ${event.data.customer.nama} (Stand: ${event.data.customer.skrg.toLocaleString()} m³).`,
              type: 'info'
            });
          } else if (event.data.action === 'INVOICED' && event.data.customer) {
            showToast({
              title: '🧾 Faktur Tagihan Diterbitkan!',
              message: `Tagihan untuk ${event.data.customer.nama} berhasil diterbitkan.`,
              type: 'success'
            });
          }
        }
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'aetra_industri_data' || e.key === 'aetra_customers_official') && e.newValue) {
        try {
          setCustomers(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (broadcast) broadcast.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSyncNow = async () => {
    try {
      // 1. Always sync with SIMBA Cloud Server first
      const cloud = await fetchCloudState();
      if (cloud && cloud.customers && cloud.customers.length > 0) {
        setCustomers(cloud.customers);
        if (cloud.meterReaders?.length) setMeterReaders(cloud.meterReaders);
        if (cloud.cycleSchedules?.length) setCycleSchedules(cloud.cycleSchedules);
        if (cloud.auditLogs?.length) setAuditLogs(cloud.auditLogs);
      }

      // 2. Also sync with Supabase if configured and tables exist
      const config = getSupabaseConfig();
      if (config.isConfigured) {
        try {
          const test = await testSupabaseConnection();
          if (test.success && test.tablesReady) {
            const [remoteCusts, remoteReaders, remoteSchedules] = await Promise.all([
              fetchSupabaseCustomers(),
              fetchSupabaseMeterReaders(),
              fetchSupabaseCycleSchedules()
            ]);

            if (remoteCusts && remoteCusts.length > 0) setCustomers(remoteCusts);
            if (remoteReaders && remoteReaders.length > 0) setMeterReaders(remoteReaders);
            if (remoteSchedules && remoteSchedules.length > 0) setCycleSchedules(remoteSchedules);
            setIsSupabaseConnected(true);
          }
        } catch {}
      }

      // 3. Broadcast to other open tabs
      try {
        const bc = new BroadcastChannel('aetra_simba_online_sync');
        bc.postMessage({ type: 'STATE_UPDATE', customers, meterReaders, cycleSchedules });
        bc.close();
      } catch {}

      showColorfulAlert({
        title: 'Sinkronisasi Otomatis Berhasil! 🔄',
        message: 'Data pembacaan meter, penugasan petugas, dan tagihan industri telah disinkronkan secara real-time ke cloud.',
        type: 'success',
        badge: 'AUTO-SYNC'
      });
    } catch (err: any) {
      showColorfulAlert({
        title: 'Sinkronisasi Selesai',
        message: 'Data SIMBA telah tersinkronisasi lintas perangkat.',
        type: 'success',
        badge: 'SYNC'
      });
    }
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

  // If user is not logged in yet, show Login Screen immediately!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans antialiased p-4">
        <ModalLogin
          isOpen={true}
          onLogin={handleLogin}
          meterReaders={meterReaders}
        />
        <ColorfulNotificationModal />
        <ColorfulToastContainer />
      </div>
    );
  }

  // Field Reader standalone full app experience
  if (currentUser.role === 'field_reader') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        <FieldReaderApp
          currentUser={currentUser}
          customers={customers}
          meterReaders={meterReaders}
          cycleSchedules={cycleSchedules}
          onSaveReading={handleSaveReading}
          onLogout={handleLogout}
          onSyncNow={handleSyncNow}
          onSwitchToAdmin={() => {
            const adminUser = USER_PROFILES.yaya;
            setCurrentUser(adminUser);
            logActivity(`Beralih dari mode pembaca meter ke Dashboard Admin (${adminUser.name})`);
          }}
        />
        {isLoginModalOpen && (
          <ModalLogin
            isOpen={true}
            onLogin={handleLogin}
            meterReaders={meterReaders}
          />
        )}
        <ColorfulNotificationModal />
        <ColorfulToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Interactive Colorful Notification & Toast System */}
      <ColorfulNotificationModal />
      <ColorfulToastContainer />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <ModalLogin
          isOpen={true}
          onLogin={handleLogin}
          meterReaders={meterReaders}
        />
      )}

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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onSwitchToFieldReader={() => {
            const firstReader = meterReaders[0];
            const fieldUser: UserProfile = {
              role: 'field_reader',
              name: firstReader?.nama || 'Anjarini Sukamto',
              title: `Pembaca Meter (${firstReader?.kategori || 'Kontraktor (PT Hideco)'})`,
              avatar: (firstReader?.nama || 'AS').substring(0, 2).toUpperCase(),
              division: firstReader?.perusahaan || 'PT Hideco',
              readerId: firstReader?.id || 'RDR-001',
              kategori: firstReader?.kategori || 'Kontraktor (PT Hideco)',
              perusahaan: firstReader?.perusahaan || 'PT Hideco'
            };
            setCurrentUser(fieldUser);
            logActivity(`Beralih ke Aplikasi Pembaca Meter Lapangan (${fieldUser.name})`);
          }}
        />

        {/* Responsive Section Bar for 1-Click Navigation on Any Screen Size */}
        <SectionNavBar
          activeTab={activeTab}
          workflowFilter={workflowFilter}
          onSelectTab={handleSelectTab}
          customers={customers}
          currentUser={currentUser}
        />

        {/* Tab View Contents */}
        <main className="p-3.5 sm:p-6 space-y-6 flex-1 pb-28 md:pb-6">
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
              onDeleteCustomer={handleDeleteCustomer}
              onDeleteBatchCustomers={handleDeleteBatchCustomers}
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
              currentUser={currentUser}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} onClearLogs={handleClearLogs} customers={customers} />
          )}
        </main>

        {/* Ergonomic 1-Hand Mobile Bottom Navigation */}
        <MobileBottomNavigation
          activeTab={activeTab}
          workflowFilter={workflowFilter}
          onSelectTab={handleSelectTab}
          customers={customers}
          currentUser={currentUser}
          onSwitchToFieldReader={() => {
            const firstReader = meterReaders[0];
            const fieldUser: UserProfile = {
              role: 'field_reader',
              name: firstReader?.nama || 'Anjarini Sukamto',
              title: `Pembaca Meter (${firstReader?.kategori || 'Kontraktor (PT Hideco)'})`,
              avatar: (firstReader?.nama || 'AS').substring(0, 2).toUpperCase(),
              division: firstReader?.perusahaan || 'PT Hideco',
              readerId: firstReader?.id || 'RDR-001',
              kategori: firstReader?.kategori || 'Kontraktor (PT Hideco)',
              perusahaan: firstReader?.perusahaan || 'PT Hideco'
            };
            setCurrentUser(fieldUser);
            logActivity(`Beralih ke Aplikasi Pembaca Meter Lapangan (${fieldUser.name})`);
          }}
        />
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

      {/* Global Interactive Notification System */}
      <ColorfulNotificationModal />
      <ColorfulToastContainer />
    </div>
  );
}
