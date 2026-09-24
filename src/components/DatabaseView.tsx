import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { IndustryCustomer, CustomerClass } from '../types';
import { Upload, Plus, Trash2, CheckSquare, Square, Building, BarChart2 } from 'lucide-react';
import meterGaugeImg from '../assets/images/meter_industrial_gauge_1790243358407.jpg';
import bpmDocImg from '../assets/images/meter_bpm_document_1790243369057.jpg';

interface DatabaseViewProps {
  customers: IndustryCustomer[];
  onAddCustomer: (customer: IndustryCustomer) => void;
  onImportCustomers: (newCustomers: IndustryCustomer[]) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteBatchCustomers: (ids: string[]) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  customers,
  onAddCustomer,
  onImportCustomers,
  onDeleteCustomer,
  onDeleteBatchCustomers
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          alert('File Excel kosong atau tidak memiliki data pada sheet pertama.');
          return;
        }

        const imported: IndustryCustomer[] = rows.map((item, index) => {
          const idPel =
            getExcelValue(item, ['idPelanggan', 'id_pelanggan', 'id', 'id pelanggan', 'nomor pelanggan', 'nopol']) ||
            `IND-${1100 + index}`;

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

          const mail =
            getExcelValue(item, ['emailIndustri', 'email', 'surel', 'email perusahaan']) ||
            'finance@industri.co.id';

          const cycVal = getExcelValue(item, ['pilihCycle', 'cycle', 'siklus', 'c', 'jadwal']);
          const cyc = cycVal
            ? String(cycVal).toLowerCase().includes('cycle')
              ? String(cycVal)
              : `Cycle ${cycVal}`
            : 'Cycle 1';

          const klsVal = getExcelValue(item, ['kelasPelanggan', 'kelas', 'class', 'kategori']);
          const rawKls = klsVal ? String(klsVal).replace(/kelas\s*/gi, '').trim() : 'Gold';
          const kls: CustomerClass = ['Premium', 'Platinum', 'Gold', 'Silver', 'Bronze'].includes(rawKls)
            ? (rawKls as CustomerClass)
            : 'Gold';

          const laluVal =
            Number(getExcelValue(item, ['standLalu', 'stand_lalu', 'lalu', 'meter lalu', 'stand bulan lalu'])) ||
            10000;

          return {
            id: String(idPel),
            nama: String(nmPerusahaan),
            email: String(mail),
            cycle: String(cyc),
            kelas: kls,
            lalu: laluVal,
            skrg: laluVal,
            status: 'Belum Dibaca' as const,
            bulan: 'September 2026',
            catatan: 'Diimpor dari file Excel (Belum dibaca).',
            history: [Math.max(0, laluVal - 600), Math.max(0, laluVal - 300), laluVal],
            fotoMeter: meterGaugeImg,
            fotoBPM: bpmDocImg
          };
        });

        onImportCustomers(imported);
        alert(`Berhasil mengimpor ${imported.length} data industri dari file Excel dengan status Belum Dibaca!`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .xls valid.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      alert('Mohon isi ID Pelanggan dan Nama Perusahaan terlebih dahulu!');
      return;
    }

    const standLaluNum = Number(newStandLalu) || 10000;

    const newCustomer: IndustryCustomer = {
      id: newId.trim().toUpperCase(),
      nama: newName.trim(),
      email: newEmail.trim() || 'finance@industri.co.id',
      cycle: newCycle,
      kelas: newKelas,
      lalu: standLaluNum,
      skrg: standLaluNum,
      status: 'Belum Dibaca',
      bulan: 'September 2026',
      catatan: 'Didaftarkan manual ke siklus pembacaan (Belum dibaca).',
      history: [Math.max(0, standLaluNum - 500), Math.max(0, standLaluNum - 200), standLaluNum],
      fotoMeter: meterGaugeImg,
      fotoBPM: bpmDocImg
    };

    onAddCustomer(newCustomer);
    setNewId('');
    setNewName('');
    setNewEmail('');
    setNewStandLalu('10000');
    alert('Data industri berhasil ditambahkan dengan status Belum Dibaca!');
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
      alert('Pilih setidaknya satu industri menggunakan checklist untuk dihapus.');
      return;
    }
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} data industri yang dipilih?`)) {
      onDeleteBatchCustomers(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Form Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base flex items-center gap-2">
              <Building className="w-5 h-5" />
              <span>Manajemen & Master Data List Industri per Cycle</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tambahkan akun industri baru ke dalam database pencatatan meter atau impor secara massal dari Excel.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleExcelImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Excel (.xlsx, .xls)</span>
            </button>
          </div>
        </div>

        {/* Manual registration form */}
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
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
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#E86216] hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
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
                    onClick={handleDeleteSelected}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 uppercase font-extrabold text-[10px] sticky top-0 z-10">
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Pilih Semua"
                    >
                      {selectedIds.length === filteredList.length && filteredList.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0055A5] dark:text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">ID Pelanggan</th>
                  <th className="p-3">Nama Perusahaan Industri</th>
                  <th className="p-3">Cycle</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Status Workflow</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
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
                          isChecked ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRow(item.id)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#0055A5] dark:text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
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
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus industri ${item.nama} (${item.id})?`)) {
                                onDeleteCustomer(item.id);
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 font-semibold text-xs transition"
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
  );
};
