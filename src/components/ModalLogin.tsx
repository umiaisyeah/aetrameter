import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, MeterReader } from '../types';
import { USER_PROFILES, INITIAL_METER_READERS } from '../data/initialData';
import { getReaderCategory, getReaderCompany } from '../utils/readerAssignmentHelper';
import { AetraLogo } from './AetraLogo';
import {
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  X
} from 'lucide-react';

interface ModalLoginProps {
  isOpen: boolean;
  onLogin: (user: UserProfile) => void;
  meterReaders?: MeterReader[];
  initialPortal?: 'admin' | 'field_reader';
  onBackToWelcome?: () => void;
  onClose?: () => void;
}

export const ModalLogin: React.FC<ModalLoginProps> = ({
  isOpen,
  onLogin,
  meterReaders = [],
  initialPortal,
  onBackToWelcome,
  onClose
}) => {
  // Check URL query param or hash to separate entrance link
  const getInitialPortal = (): 'admin' | 'field_reader' => {
    if (initialPortal) return initialPortal;
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

  useEffect(() => {
    if (initialPortal) {
      setLoginType(initialPortal);
    }
  }, [initialPortal]);

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

  const isAdmin = loginType === 'admin';

  return (
    <div className={`fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-colors duration-300 ${
      isAdmin ? 'bg-slate-950/85' : 'bg-stone-950/85'
    }`}>
      <div className={`rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl transition-all duration-300 border-2 max-h-[92vh] overflow-y-auto relative ${
        isAdmin
          ? 'bg-white dark:bg-slate-900 border-[#0055A5]/40 shadow-[0_15px_50px_rgba(0,85,165,0.25)] text-slate-800 dark:text-slate-100'
          : 'bg-white dark:bg-stone-900 border-[#E86216]/40 shadow-[0_15px_50px_rgba(232,98,22,0.25)] text-slate-800 dark:text-slate-100'
      }`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Distinct Header per Portal */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <div className={`py-2.5 px-5 rounded-2xl border inline-flex shadow-sm items-center justify-center ${
              isAdmin
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/80'
                : 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-800/80'
            }`}>
              <AetraLogo className="h-7" />
            </div>
          </div>

          <div className="mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isAdmin
                ? 'bg-blue-100 text-[#0055A5] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-orange-100 text-[#E86216] dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
            }`}>
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PORTAL ADMINISTRATOR KANTOR</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>PORTAL PENCATAT METER LAPANGAN</span>
                </>
              )}
            </span>
          </div>

          <h2 className={`text-xl font-black ${isAdmin ? 'text-[#0055A5] dark:text-blue-400' : 'text-[#E86216] dark:text-orange-400'}`}>
            {isAdmin ? 'Laman Masuk Dashboard Admin' : 'Laman Masuk Pencatat Meter'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {isAdmin
              ? 'SIMBA — Kantor Pusat PT Aetra Air Tangerang'
              : 'Aplikasi Mobile Pembacaan Meter Industri'}
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin ? (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Pilih Akun Staf Admin
              </label>
              <div className="relative">
                <select
                  value={selectedAdminRole}
                  onChange={(e) => setSelectedAdminRole(e.target.value as UserRole)}
                  className="w-full pl-3.5 pr-9 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white transition cursor-pointer"
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
              {/* Petugas Reminder */}
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-[11px] text-orange-900 dark:text-orange-200 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#E86216] shrink-0" />
                <span>Gunakan akun resmi petugas untuk mencatat stand meter, foto watermark, &amp; dokumen BPM.</span>
              </div>

              {/* DROPDOWN PEMBACA METER */}
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
                    className="w-full px-3.5 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#E86216] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition appearance-none cursor-pointer pr-10"
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

              {/* Password Input */}
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
                    className="w-full pl-9 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#E86216] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition uppercase font-mono tracking-wider"
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
            className={`w-full py-3.5 rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 text-white cursor-pointer active:scale-98 ${
              isAdmin
                ? 'bg-gradient-to-r from-[#003E78] to-[#0055A5] hover:from-[#002f5a] hover:to-[#00478f]'
                : 'bg-gradient-to-r from-[#C44800] to-[#E86216] hover:from-[#a83c00] hover:to-[#d0520d]'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Dashboard Admin</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Masuk ke Aplikasi Pembaca Meter</span>
              </>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Differentiated Cross-Portal Switcher Card */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 text-center">
            {isAdmin ? (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  Petugas pembacaan meter di lapangan?
                </p>
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('field_reader')}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-[#E86216] dark:text-orange-300 font-bold text-xs border border-orange-200 dark:border-orange-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Beralih ke Laman Petugas Lapangan →</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  Staf manajemen kantor pusat atau billing?
                </p>
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('admin')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#0055A5] dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Beralih ke Laman Admin Kantor →</span>
                </button>
              </div>
            )}
          </div>

          {onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="w-full mt-2 py-2 text-center text-xs font-bold text-slate-500 hover:text-[#0055A5] dark:text-slate-400 dark:hover:text-blue-300 transition flex items-center justify-center gap-1.5 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Pengenalan SIMBA</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
