import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, MeterReader } from '../types';
import { USER_PROFILES, INITIAL_METER_READERS } from '../data/initialData';
import { getReaderCategory, getReaderCompany } from '../utils/readerAssignmentHelper';
import { AetraLogo } from './AetraLogo';
import {
  ShieldCheck,
  User,
  ArrowRight,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Waves,
  Zap
} from 'lucide-react';

interface ModalLoginProps {
  isOpen: boolean;
  onLogin: (user: UserProfile) => void;
  meterReaders?: MeterReader[];
}

export const ModalLogin: React.FC<ModalLoginProps> = ({ isOpen, onLogin, meterReaders = [] }) => {
  // Check URL query param or hash to separate entrance link
  const getInitialPortal = (): 'admin' | 'field_reader' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal') || params.get('mode');
      if (portal === 'reader' || portal === 'field' || window.location.hash === '#reader') {
        return 'field_reader';
      }
    }
    return 'admin';
  };

  const [loginType, setLoginType] = useState<'admin' | 'field_reader'>(getInitialPortal);
  const [selectedAdminRole, setSelectedAdminRole] = useState<UserRole>('solihin');

  // Available list of readers (fallback to INITIAL_METER_READERS if empty)
  const availableReaders = meterReaders.length > 0 ? meterReaders : INITIAL_METER_READERS;

  const [selectedReaderId, setSelectedReaderId] = useState<string>(availableReaders[0]?.id || 'KA-001');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync selectedReaderId if readers list changes
  useEffect(() => {
    if (availableReaders.length > 0 && !availableReaders.some((r) => r.id === selectedReaderId)) {
      setSelectedReaderId(availableReaders[0].id);
    }
  }, [availableReaders, selectedReaderId]);

  // Update URL params when portal switcher is clicked
  const handleSwitchPortal = (type: 'admin' | 'field_reader') => {
    setLoginType(type);
    setAuthError(null);
    if (type === 'field_reader') {
      setPasswordInput('');
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', type === 'field_reader' ? 'reader' : 'admin');
      window.history.replaceState({}, '', url.toString());
    }
  };

  if (!isOpen) return null;

  const selectedReader = availableReaders.find((r) => r.id === selectedReaderId) || availableReaders[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (loginType === 'admin') {
      const user = USER_PROFILES[selectedAdminRole] || USER_PROFILES.solihin;
      onLogin(user);
    } else {
      // Field Reader login with password validation
      if (!selectedReader) {
        setAuthError('Silakan pilih akun petugas pembaca meter.');
        return;
      }

      if (!passwordInput.trim()) {
        setAuthError('Silakan ketikkan password akun pembaca meter.');
        return;
      }

      const expectedPassword = selectedReader.password || 'ANJAR123';
      if (passwordInput.trim().toUpperCase() !== expectedPassword.toUpperCase()) {
        setAuthError('Password tidak sesuai. Silakan periksa kembali password Anda atau hubungi Tim Meter Reading.');
        return;
      }

      const category = getReaderCategory(selectedReader.nama);
      const company = getReaderCompany(selectedReader.nama);

      const fieldUserProfile: UserProfile = {
        role: 'field_reader',
        name: selectedReader.nama,
        title: `Pembaca Meter (${category})`,
        avatar: selectedReader.nama.substring(0, 2).toUpperCase(),
        division: company,
        readerId: selectedReader.id,
        kategori: category,
        perusahaan: company
      };

      onLogin(fieldUserProfile);
    }
  };

  // Group readers by category strictly (1 person = 1 role)
  const keyAccountReaders = availableReaders.filter(
    (r) => getReaderCategory(r.nama) === 'Key Account'
  );
  const kontraktorReaders = availableReaders.filter(
    (r) => getReaderCategory(r.nama) !== 'Key Account'
  );

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3.5">
            <div className="bg-slate-50 dark:bg-slate-700/50 py-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-600 inline-flex shadow-sm items-center justify-center">
              <AetraLogo />
            </div>
          </div>
          <h2 className="text-xl font-black text-[#0055A5] dark:text-blue-400">
            {loginType === 'field_reader' ? 'Laman Masuk Pencatat Meter' : 'Laman Masuk Dashboard Admin'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {loginType === 'field_reader'
              ? 'Portal Khusus Petugas Pembacaan Meter Lapangan'
              : 'SIMBA — Sistem Integrasi Metering & Billing Aetra Air Tangerang'}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              loginType === 'field_reader'
                ? 'bg-orange-100 text-[#E86216] dark:bg-orange-950/80 dark:text-orange-300'
                : 'bg-blue-100 text-[#0055A5] dark:bg-blue-950/80 dark:text-blue-300'
            }`}>
              {loginType === 'field_reader' ? '📱 PORTAL PETUGAS LAPANGAN' : '🛡️ PORTAL ADMIN KANTOR'}
            </span>
          </div>
        </div>

        {/* Animated SIMBA Interactive Overview Banner */}
        <div className="relative overflow-hidden rounded-2xl p-4 mb-4 bg-gradient-to-br from-[#003E78] via-[#0055A5] to-[#E86216] text-white shadow-lg border border-white/20 select-none">
          {/* Animated Background Highlights & Pulsing Water Glow */}
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none animate-pulse" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-400/25 rounded-full blur-xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-white/20 text-amber-300 animate-spin" style={{ animationDuration: '6s' }}>
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="font-black text-xs tracking-wider uppercase drop-shadow-xs flex items-center gap-1">
                  <span>Tentang SIMBA</span>
                  <Waves className="w-3.5 h-3.5 text-cyan-200 animate-bounce" />
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/20 border border-white/25 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE 2026</span>
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-blue-50 font-medium">
              <strong className="text-white font-extrabold">SIMBA</strong> (Sistem Integrasi Metering &amp; Billing Aetra Air Tangerang) adalah ekosistem terpadu operasional pembacaan meter industri: integrasi jadwal <strong>Cycle 1–15</strong>, pencatatan stand &amp; bukti geotagging BPM di lapangan, hingga verifikasi reading dan penerbitan faktur tagihan air resmi.
            </p>

            {/* Micro Animated Features Marquee Strip */}
            <div className="pt-1 flex items-center gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1.5 animate-marquee whitespace-nowrap text-[9px] font-extrabold text-blue-100">
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-300" /> Live Sync Lapangan
                </span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/15">
                  📸 Kamera Watermark &amp; OCR
                </span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/15">
                  📍 GPS Geotagging Presisi
                </span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/15">
                  📑 Faktur &amp; e-Materai Resmi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distinct Portal Entrance Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSwitchPortal('admin')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'admin'
                ? 'bg-[#0055A5] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Kantor</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPortal('field_reader')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'field_reader'
                ? 'bg-[#E86216] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pembaca Meter</span>
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === 'admin' ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Pilih Akun Staf Admin
              </label>
              <div className="relative">
                <select
                  value={selectedAdminRole}
                  onChange={(e) => setSelectedAdminRole(e.target.value as UserRole)}
                  className="w-full pl-3.5 pr-9 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white transition cursor-pointer"
                >
                  <optgroup label="📋 Tim Meter Reading (Akses Impor Database &amp; Verifikasi)">
                    <option value="solihin">Akhmad Solihin (Meter Reading)</option>
                    <option value="kabul">Kabul Nugroho (Meter Reading)</option>
                    <option value="tri_kartono">Tri Kartono (Meter Reading)</option>
                  </optgroup>
                  <optgroup label="🌟 Admin Key Account (Akses Impor Database)">
                    <option value="bayu_pramono">Bayu Pramono (Key Account)</option>
                  </optgroup>
                  <optgroup label="💳 Admin Billing (Akses Billing &amp; Invoicing)">
                    <option value="yaya">Yaya Sunarya (Billing)</option>
                    <option value="melva_sinaga">Melva Sinaga (Billing)</option>
                  </optgroup>
                </select>
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* DROPDOWN PEMBACA METER (SESUAI MASTER DATA PEMBACA METER) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Nama Pembaca Meter</span>
                  <span className="text-[10px] text-slate-400">Total: {availableReaders.length} Petugas</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedReaderId}
                    onChange={(e) => {
                      setSelectedReaderId(e.target.value);
                      setPasswordInput('');
                      setAuthError(null);
                    }}
                    className="w-full px-3.5 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#E86216] bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition appearance-none cursor-pointer pr-10"
                  >
                    {keyAccountReaders.length > 0 && (
                      <optgroup label="🌟 Key Account (PT Aetra Air Tangerang)">
                        {keyAccountReaders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nama} — (Key Account)
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {kontraktorReaders.length > 0 && (
                      <optgroup label="🏢 Kontraktor (PT Hideco)">
                        {kontraktorReaders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nama} — (Kontraktor PT Hideco)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Password Input (User types password themselves) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Ketik Password Akun *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder={`Ketik password akun ${selectedReader?.nama || ''}...`}
                    required
                    autoFocus
                    className="w-full pl-9 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#E86216] bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition uppercase font-mono tracking-wider"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  *Ketikkan password resmi akun pembaca meter di kolom ini.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 text-white cursor-pointer ${
              loginType === 'admin'
                ? 'bg-[#0055A5] hover:bg-[#003E78]'
                : 'bg-[#E86216] hover:bg-orange-600'
            }`}
          >
            <span>Masuk ke {loginType === 'admin' ? 'Dashboard Admin' : 'Aplikasi Pembaca Meter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
