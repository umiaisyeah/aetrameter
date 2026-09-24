import React, { useState, useEffect, useMemo } from 'react';
import { IndustryCustomer, AuditLog, UserProfile } from './types';
import { INITIAL_CUSTOMERS, INITIAL_AUDIT_LOGS, USER_PROFILES } from './data/initialData';
import { ModalLogin } from './components/ModalLogin';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { DatabaseView } from './components/DatabaseView';
import { AuditView } from './components/AuditView';
import { DetailModal } from './components/DetailModal';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';

export default function App() {
  // Load state from localStorage or initial fallback
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aetra_current_user');
    return saved ? JSON.parse(saved) : USER_PROFILES.yaya;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const [customers, setCustomers] = useState<IndustryCustomer[]>(() => {
    const saved = localStorage.getItem('aetra_industri_data');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('aetra_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<string>('overview');
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
    logActivity(
      `Memperbarui stand meter ${updated.nama} (${updated.id}) ke angka ${updated.skrg.toLocaleString()} m³`,
      'update'
    );
    setSelectedCustomerForDetail(null);
  };

  const handleProcessInvoice = (updated: IndustryCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logActivity(
      `Menerbitkan faktur tagihan & email untuk ${updated.nama} (${updated.id})`,
      'invoice'
    );
    setSelectedCustomerForDetail(updated);
  };

  const handleAddCustomer = (newCustomer: IndustryCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    logActivity(`Menambahkan akun industri baru: ${newCustomer.nama} (${newCustomer.id}) pada ${newCustomer.cycle}`, 'update');
  };

  const handleImportCustomers = (importedList: IndustryCustomer[]) => {
    setCustomers((prev) => [...importedList, ...prev]);
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
    return customers.filter((item) => {
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
        />

        {/* Tab View Contents */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {activeTab === 'overview' && (
            <OverviewView
              customers={filteredCustomers}
              selectedCycle={selectedCycle}
              workflowFilter={workflowFilter}
              onWorkflowFilterChange={setWorkflowFilter}
              onOpenDetail={(cust) => setSelectedCustomerForDetail(cust)}
              onOpenPrintReport={handlePrintReport}
              onExportCSV={handleExportCSV}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseView
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onImportCustomers={handleImportCustomers}
              onDeleteCustomer={handleDeleteCustomer}
              onDeleteBatchCustomers={handleDeleteBatchCustomers}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} onClearLogs={handleClearLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
