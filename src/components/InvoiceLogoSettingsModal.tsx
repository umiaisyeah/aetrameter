import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  useInvoiceLogoConfig,
  InvoiceLogoConfig,
  DEFAULT_INVOICE_LOGO_CONFIG
} from '../utils/invoiceLogoStorage';
import {
  KabupatenTangerangLogo,
  AetraOfficialLogo
} from './AetraInvoiceBrandLogos';
import { showToast } from '../utils/notificationSystem';

interface InvoiceLogoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'kabTangerang' | 'aetra' | 'preview';
}

export const InvoiceLogoSettingsModal: React.FC<InvoiceLogoSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'kabTangerang',
}) => {
  const { config, updateConfig, resetLogo, resetAll } = useInvoiceLogoConfig();
  const [activeTab, setActiveTab] = useState<'kabTangerang' | 'aetra' | 'preview'>(initialTab);

  // Draft state for unsaved adjustments before committing or immediate live update
  const [urlInputKab, setUrlInputKab] = useState<string>('');
  const [urlInputAetra, setUrlInputAetra] = useState<string>('');

  const kabFileInputRef = useRef<HTMLInputElement>(null);
  const aetraFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handler for uploading file and converting to Base64
  const handleFileUpload = (
    file: File,
    target: 'kabTangerang' | 'aetra'
  ) => {
    if (!file.type.startsWith('image/')) {
      showToast({
        title: 'Format File Tidak Didukung',
        message: 'Mohon unggah file gambar (PNG, JPG, JPEG, SVG, WebP).',
        type: 'warning',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: 'Ukuran Gambar Terlalu Besar',
        message: 'Maksimum ukuran gambar adalah 5 MB.',
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'kabTangerang') {
        updateConfig({ kabTangerangLogoUrl: result });
        showToast({
          title: 'Logo Pemda Kab. Tangerang Diganti! 🏛️',
          message: `Berhasil memuat berkas "${file.name}".`,
          type: 'success',
        });
      } else {
        updateConfig({ aetraLogoUrl: result });
        showToast({
          title: 'Logo PT Aetra Air Tangerang Diganti! 💧',
          message: `Berhasil memuat berkas "${file.name}".`,
          type: 'success',
        });
      }
    };
    reader.onerror = () => {
      showToast({
        title: 'Gagal Membaca Berkas',
        message: 'Terjadi kesalahan saat membaca file gambar.',
        type: 'error',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (target: 'kabTangerang' | 'aetra') => {
    const rawUrl = target === 'kabTangerang' ? urlInputKab.trim() : urlInputAetra.trim();
    if (!rawUrl) return;

    if (target === 'kabTangerang') {
      updateConfig({ kabTangerangLogoUrl: rawUrl });
      setUrlInputKab('');
      showToast({
        title: 'URL Logo Pemda Diterapkan',
        message: 'Logo kustom berhasil dihubungkan dari URL.',
        type: 'success',
      });
    } else {
      updateConfig({ aetraLogoUrl: rawUrl });
      setUrlInputAetra('');
      showToast({
        title: 'URL Logo Aetra Diterapkan',
        message: 'Logo kustom berhasil dihubungkan dari URL.',
        type: 'success',
      });
    }
  };

  const isKabCustom = Boolean(config.kabTangerangLogoUrl);
  const isAetraCustom = Boolean(config.aetraLogoUrl);

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto print:hidden">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#0055A5] via-[#004282] to-[#E86216] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-sm rounded-2xl shadow-inner border border-white/20">
              <ImageIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-wide text-white">
                  Pengaturan Logo Faktur Resmi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                  Manual Logo Switcher
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Ubah logo Pemerintah Kab. Tangerang atau logo PT Aetra Air Tangerang pada faktur cetak &amp; PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('kabTangerang')}
              className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'kabTangerang'
                  ? 'bg-white dark:bg-slate-900 text-[#0055A5] dark:text-blue-400 border-[#0055A5] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <span>🏛️ Logo Pemda Kab. Tangerang (Kiri)</span>
              {isKabCustom && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Kustom aktif" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('aetra')}
              className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'aetra'
                  ? 'bg-white dark:bg-slate-900 text-[#E86216] dark:text-orange-400 border-[#E86216] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <span>💧 Logo PT Aetra Tangerang (Kanan)</span>
              {isAetraCustom && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Kustom aktif" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Keduanya</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: LOGO PEMDA KABUPATEN TANGERANG */}
          {activeTab === 'kabTangerang' && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏛️</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      Logo Pemerintah Kabupaten Tangerang
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Ditampilkan di sudut kiri header faktur resmi dan dokumen penagihan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isKabCustom
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {isKabCustom ? 'Logo Manual (Kustom)' : 'Logo Resmi Default'}
                  </span>
                </div>
              </div>

              {/* Grid: Preview & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Live Preview Box */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 self-start flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    Pratinjau Nyata di Lembar Faktur
                  </span>
                  <div className="w-full bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center min-h-[170px] relative group">
                    <KabupatenTangerangLogo
                      size={config.kabTangerangSize}
                      showText={config.showKabTangerangText}
                      customSrc={config.kabTangerangLogoUrl}
                    />
                    <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ukuran: {config.kabTangerangSize}px
                    </div>
                  </div>

                  {isKabCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        resetLogo('kabTangerang');
                        showToast({
                          title: 'Logo Pemda Dikembalikan',
                          message: 'Kembali menggunakan lambang resmi asli Kabupaten Tangerang.',
                          type: 'info',
                        });
                      }}
                      className="mt-3 w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                      <span>Kembalikan ke Lambang Default</span>
                    </button>
                  )}
                </div>

                {/* Upload & Replacement Controls */}
                <div className="md:col-span-7 space-y-4">
                  {/* File Upload Box */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-blue-600" />
                        Unggah File Logo Baru
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">PNG, JPG, SVG, WebP</span>
                    </div>

                    <input
                      ref={kabFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'kabTangerang');
                      }}
                    />

                    <div
                      onClick={() => kabFileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-400/60 hover:border-blue-600 dark:border-blue-500/40 dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 p-4 rounded-xl text-center cursor-pointer transition hover:bg-blue-50/50 dark:hover:bg-blue-950/30 group"
                    >
                      <Upload className="w-6 h-6 text-blue-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk Pilih File Gambar dari Perangkat
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Gambar akan tersimpan otomatis dan langsung tampil di PDF/cetak
                      </p>
                    </div>
                  </div>

                  {/* URL Input Box */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                      Atau Tempel Tautan / URL Gambar
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://contoh.com/logo-kab-tangerang.png"
                        value={urlInputKab}
                        onChange={(e) => setUrlInputKab(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyUrl('kabTangerang')}
                        disabled={!urlInputKab.trim()}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>

                  {/* Size & Display Controls */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      Penyesuaian Dimensi &amp; Label
                    </span>

                    {/* Height Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>Tinggi Logo:</span>
                        <span className="font-mono font-bold text-blue-600">{config.kabTangerangSize} px</span>
                      </div>
                      <input
                        type="range"
                        min="32"
                        max="84"
                        value={config.kabTangerangSize}
                        onChange={(e) => updateConfig({ kabTangerangSize: Number(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>32px (Kecil)</span>
                        <span>52px (Standar)</span>
                        <span>84px (Besar)</span>
                      </div>
                    </div>

                    {/* Show Text Checkbox */}
                    <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.showKabTangerangText}
                        onChange={(e) => updateConfig({ showKabTangerangText: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Tampilkan teks <strong>PEMERINTAH KABUPATEN TANGERANG</strong> di bawah logo
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO PT AETRA AIR TANGERANG */}
          {activeTab === 'aetra' && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/40 p-3.5 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💧</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      Logo Resmi PT Aetra Air Tangerang
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Ditampilkan di sudut kanan header faktur resmi di samping rincian alamat perusahaan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isAetraCustom
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {isAetraCustom ? 'Logo Manual (Kustom)' : 'Logo Resmi Default'}
                  </span>
                </div>
              </div>

              {/* Grid: Preview & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Live Preview Box */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 self-start flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-orange-500" />
                    Pratinjau Nyata di Lembar Faktur
                  </span>
                  <div className="w-full bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center min-h-[170px] relative group">
                    <AetraOfficialLogo
                      height={config.aetraHeight}
                      customSrc={config.aetraLogoUrl}
                    />
                    <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tinggi: {config.aetraHeight}px
                    </div>
                  </div>

                  {isAetraCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        resetLogo('aetra');
                        showToast({
                          title: 'Logo Aetra Dikembalikan',
                          message: 'Kembali menggunakan logo resmi PT Aetra Air Tangerang.',
                          type: 'info',
                        });
                      }}
                      className="mt-3 w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                      <span>Kembalikan ke Logo Default</span>
                    </button>
                  )}
                </div>

                {/* Upload & Replacement Controls */}
                <div className="md:col-span-7 space-y-4">
                  {/* File Upload Box */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-orange-600" />
                        Unggah File Logo Baru
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">PNG, JPG, SVG, WebP</span>
                    </div>

                    <input
                      ref={aetraFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'aetra');
                      }}
                    />

                    <div
                      onClick={() => aetraFileInputRef.current?.click()}
                      className="border-2 border-dashed border-orange-400/60 hover:border-orange-600 dark:border-orange-500/40 dark:hover:border-orange-400 bg-white dark:bg-slate-900/60 p-4 rounded-xl text-center cursor-pointer transition hover:bg-orange-50/50 dark:hover:bg-orange-950/30 group"
                    >
                      <Upload className="w-6 h-6 text-orange-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Klik untuk Pilih File Gambar dari Perangkat
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Gambar akan tersimpan otomatis dan langsung tampil di PDF/cetak
                      </p>
                    </div>
                  </div>

                  {/* URL Input Box */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-orange-600" />
                      Atau Tempel Tautan / URL Gambar
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://contoh.com/logo-aetra.png"
                        value={urlInputAetra}
                        onChange={(e) => setUrlInputAetra(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyUrl('aetra')}
                        disabled={!urlInputAetra.trim()}
                        className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>

                  {/* Size & Display Controls */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-orange-600" />
                      Penyesuaian Dimensi
                    </span>

                    {/* Height Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>Tinggi Logo:</span>
                        <span className="font-mono font-bold text-orange-600">{config.aetraHeight} px</span>
                      </div>
                      <input
                        type="range"
                        min="28"
                        max="76"
                        value={config.aetraHeight}
                        onChange={(e) => updateConfig({ aetraHeight: Number(e.target.value) })}
                        className="w-full accent-orange-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>28px (Kecil)</span>
                        <span>46px (Standar)</span>
                        <span>76px (Besar)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE INVOICE HEADER PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    Simulasi Tampilan Header Faktur Air
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Berikut adalah pratinjau langsung bagaimana kedua logo berpadu di dalam kotak header faktur resmi
                  </p>
                </div>
              </div>

              {/* Exact Header Box simulation */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-md">
                <div className="border-2 border-[#0055A5] flex flex-row bg-white">
                  <div className="flex-1 p-3 flex items-center justify-between border-r-2 border-[#0055A5] gap-3">
                    {/* Left: Pemda Tangerang */}
                    <div className="shrink-0 flex items-center justify-center pl-1">
                      <KabupatenTangerangLogo
                        size={config.kabTangerangSize}
                        showText={config.showKabTangerangText}
                        customSrc={config.kabTangerangLogoUrl}
                      />
                    </div>

                    {/* Center: Company Name */}
                    <div className="text-center flex-1 px-2">
                      <h1 className="text-sm font-black text-[#0055A5] uppercase tracking-tight">
                        PT Aetra Air Tangerang
                      </h1>
                      <p className="text-[9px] text-slate-700 leading-tight mt-0.5 font-medium">
                        Jln. Raya STPI Curug No. 27, Kabupaten Tangerang 15810
                      </p>
                      <p className="text-[9px] text-slate-700 leading-tight font-medium">
                        Telp. 021 598 5474, Fax. 021 598 5479
                      </p>
                      <p className="text-[9.5px] text-[#0055A5] font-black leading-tight mt-0.5">
                        www.aat.co.id
                      </p>
                    </div>

                    {/* Right: Aetra Logo */}
                    <div className="shrink-0 flex items-center justify-center pr-1">
                      <AetraOfficialLogo
                        height={config.aetraHeight}
                        customSrc={config.aetraLogoUrl}
                      />
                    </div>
                  </div>

                  {/* Right Stub: Tagihan Info */}
                  <div className="w-52 shrink-0 flex flex-col bg-white">
                    <div className="bg-[#DCEBF8] text-[#0055A5] font-black text-[10px] text-center py-1.5 border-b border-[#0055A5]">
                      Informasi Tagihan Air
                    </div>
                    <div className="grid grid-cols-3 text-center bg-[#0055A5] text-white font-bold text-[7px] leading-tight">
                      <div className="py-1 px-0.5 border-r border-white/30">BULAN</div>
                      <div className="py-1 px-0.5 border-r border-white/30">NO. FAKTUR</div>
                      <div className="py-1 px-0.5">JATUH TEMPO</div>
                    </div>
                    <div className="grid grid-cols-3 text-center bg-white text-slate-900 font-bold text-[8px] flex-1 items-center border-t border-[#0055A5]">
                      <div className="py-2 px-0.5 border-r border-slate-300 font-black text-[#0055A5]">Oktober 2026</div>
                      <div className="py-2 px-0.5 border-r border-slate-300 font-mono">0326090001</div>
                      <div className="py-2 px-0.5 text-rose-700 font-black">20 Okt 2026</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>🏛️ Logo Kab. Tangerang:</span>
                    <span className={isKabCustom ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}>
                      {isKabCustom ? 'Kustom' : 'Default Asli'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tinggi: {config.kabTangerangSize}px · Label: {config.showKabTangerangText ? 'Aktif' : 'Nonaktif'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                    <span>💧 Logo PT Aetra:</span>
                    <span className={isAetraCustom ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}>
                      {isAetraCustom ? 'Kustom' : 'Default Asli'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tinggi: {config.aetraHeight}px
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Kembalikan semua logo faktur ke setelan awal default?')) {
                resetAll();
                showToast({
                  title: 'Semua Logo Telah Direset',
                  message: 'Kedua logo telah dikembalikan ke lambang resmi default.',
                  type: 'info',
                });
              }
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Reset Semua ke Default</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                showToast({
                  title: 'Setelan Logo Faktur Tersimpan! ✨',
                  message: 'Perubahan logo akan digunakan pada tampilan faktur, cetak, dan berkas PDF.',
                  type: 'success',
                });
                onClose();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan &amp; Terapkan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
