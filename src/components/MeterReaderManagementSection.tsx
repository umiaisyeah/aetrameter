import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MeterReader, IndustryCustomer, ReaderCategory } from '../types';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Check,
  Trash2,
  Edit2,
  Shield,
  Building2,
  Briefcase,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react';

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
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Form states
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [perusahaanInput, setPerusahaanInput] = useState('');
  const [kategori, setKategori] = useState<ReaderCategory>('Kontraktor');
  const [status, setStatus] = useState<'Aktif' | 'Cuti' | 'Nonaktif'>('Aktif');
  const [assignedCycles, setAssignedCycles] = useState<string[]>([]);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Petugas': 'Contoh Petugas',
        'NIP': 'MR-2026-001',
        'No HP': '0812-0000-0000',
        'Kategori': 'Kontraktor',
        'Perusahaan': 'Nama Perusahaan Kontraktor',
        'Penugasan Cycle': 'Cycle 1, Cycle 2',
        'Wilayah': 'Wilayah Operasional Industri',
        'Email': 'petugas@perusahaan.com',
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
          alert('File Excel kosong atau tidak memiliki data.');
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
          const kategoriVal: ReaderCategory = isKeyAccount ? 'Key Account' : (row['Kategori'] || 'Kontraktor');
          const perusahaanVal = String(row['Perusahaan'] || row['perusahaan'] || row['Mitra'] || (isKeyAccount ? 'PT Aetra Air Tangerang (Key Account)' : 'Mitra Kontraktor')).trim();

          // Parse cycle assignment (e.g. "Cycle 1, Cycle 2" or "1, 2, 3")
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
            cyclesList = ['Cycle 1'];
          }

          const rawWilayah = row['Wilayah'] || row['wilayah'] || 'Wilayah Industri Tangerang';
          const rawEmail = row['Email'] || row['email'] || `${readerName.toLowerCase().replace(/[^a-z]/g, '')}@${isKeyAccount ? 'aetratangerang.co.id' : 'hideco-meter.com'}`;
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
              wilayah: String(rawWilayah),
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
              email: String(rawEmail),
              wilayah: String(rawWilayah)
            };
            onAddMeterReader(newR);
            createdCount++;
          }
        });

        alert(`Sinkronisasi Excel Berhasil!\n- ${createdCount} petugas baru ditambahkan\n- ${updatedCount} petugas berhasil diperbarui & disinkronkan siklus penugasannya.`);
      } catch (err) {
        console.error(err);
        alert('Gagal mengimpor file Excel petugas. Pastikan format .xlsx atau .xls valid.');
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
      alert('Mohon isi Nama Petugas Pembaca Meter!');
      return;
    }

    const perusahaan =
      perusahaanInput.trim() ||
      (kategori === 'Key Account'
        ? 'Key Account'
        : 'Kontraktor');

    const newReader: MeterReader = {
      id: `${kategori === 'Key Account' ? 'KA' : 'MR'}-${Date.now().toString().slice(-4)}`,
      nama: nama.trim(),
      nip: nip.trim() || `MR-${Date.now().toString().slice(-4)}`,
      noHp: noHp.trim() || '0812-0000-0000',
      email: email.trim(),
      wilayah: wilayah.trim() || 'Wilayah Industri Tangerang',
      kategori,
      perusahaan,
      status,
      assignedCycles: assignedCycles.length > 0 ? assignedCycles : ['Cycle 1']
    };

    onAddMeterReader(newReader);
    // Reset
    setNama('');
    setNip('');
    setNoHp('');
    setEmail('');
    setWilayah('');
    setPerusahaanInput('');
    setKategori('Kontraktor');
    setAssignedCycles([]);
    setShowAddForm(false);
    alert(`Petugas lapangan ${newReader.nama} berhasil ditambahkan!`);
  };

  const handleSaveEditReader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReader) return;

    onUpdateMeterReader(editingReader);
    setEditingReader(null);
    alert(`Data petugas ${editingReader.nama} berhasil diperbarui!`);
  };

  const filteredReaders = meterReaders.filter((r) => {
    if (filterCategory === 'ALL') return true;
    return r.kategori === filterCategory;
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
          <strong>Catatan Pembagian Tugas:</strong> <em>Pak Solihin</em> &amp; <em>Pak Kabul</em> bertindak sebagai <strong>Admin Meter Reading</strong> di kantor yang bertugas menginput cycle dan mengelola list industri. Pembaca meter fisik di lapangan dilakukan oleh petugas lapangan yang didaftarkan pada halaman ini.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
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
            Kontraktor / Mitra ({meterReaders.filter((r) => r.kategori === 'Kontraktor').length})
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

      {/* Add Form Accordion */}
      {showAddForm && (
        <form
          onSubmit={handleSaveNewReader}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            Form Pendaftaran Petugas Pembaca Meter Lapangan Baru
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Kategori Petugas *
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as ReaderCategory)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
              >
                <option value="Kontraktor">Kontraktor / Vendor Eksternal</option>
                <option value="Key Account">Tim Key Account Internal</option>
                <option value="Lainnya">Lainnya</option>
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
                placeholder="Contoh: Nama Petugas"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nama Perusahaan / Kontraktor / Instansi
              </label>
              <input
                type="text"
                value={perusahaanInput}
                onChange={(e) => setPerusahaanInput(e.target.value)}
                placeholder="Contoh: PT Nama Perusahaan"
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
                placeholder="MR-2026-001"
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
                Wilayah Tugas Operasional
              </label>
              <input
                type="text"
                value={wilayah}
                onChange={(e) => setWilayah(e.target.value)}
                placeholder="Kawasan Industri Tangerang"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
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
          const assignedCusts = customers.filter((c) =>
            reader.assignedCycles.some((ac) => ac.toLowerCase() === c.cycle.toLowerCase())
          );
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

                {/* Contact and Wilayah */}
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
                  {reader.wilayah && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-medium text-slate-500 dark:text-slate-400">{reader.wilayah}</span>
                    </div>
                  )}
                </div>

                {/* Cycle Assignment Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Penugasan Cycle ({reader.assignedCycles.length}):
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {completedCount} / {assignedCusts.length} Selesai Dibaca
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {reader.assignedCycles.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#0055A5] dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
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
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus petugas pembaca meter ${reader.nama}?`)) {
                      onDeleteMeterReader(reader.id);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
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
                      kategori: e.target.value as ReaderCategory
                    })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                >
                  <option value="Kontraktor">Kontraktor / Vendor Eksternal</option>
                  <option value="Key Account">Tim Key Account Internal</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nama Petugas
                </label>
                <input
                  type="text"
                  value={editingReader.nama}
                  onChange={(e) => setEditingReader({ ...editingReader, nama: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nama Perusahaan / Instansi
                </label>
                <input
                  type="text"
                  value={editingReader.perusahaan}
                  onChange={(e) => setEditingReader({ ...editingReader, perusahaan: e.target.value })}
                  placeholder="Nama Perusahaan / Instansi"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditReader}
                className="px-5 py-2 text-xs font-bold bg-[#0055A5] hover:bg-blue-800 text-white rounded-xl shadow-xs transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
