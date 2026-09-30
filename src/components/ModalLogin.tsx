import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, MeterReader } from '../types';
import { USER_PROFILES, INITIAL_METER_READERS } from '../data/initialData';
import { getReaderCategory, getReaderCompany } from '../utils/readerAssignmentHelper';
import { AetraLogo } from './AetraLogo';
import { ShieldCheck, User, ArrowRight, Smartphone, Lock, Eye, EyeOff, KeyRound, AlertCircle, ChevronDown } from 'lucide-react';

interface ModalLoginProps {
  isOpen: boolean;
  onLogin: (user: UserProfile) => void;
  meterReaders?: MeterReader[];
}

export const ModalLogin: React.FC<ModalLoginProps> = ({ isOpen, onLogin, meterReaders = [] }) => {
  const [loginType, setLoginType] = useState<'admin' | 'field_reader'>('admin');
  const [selectedAdminRole, setSelectedAdminRole] = useState<UserRole>('yaya');
  
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

  if (!isOpen) return null;

  const selectedReader = availableReaders.find((r) => r.id === selectedReaderId) || availableReaders[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (loginType === 'admin') {
      const user = USER_PROFILES[selectedAdminRole] || USER_PROFILES.yaya;
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
        setAuthError('Password tidak sesuai. Silakan periksa kembali password Anda atau hubungi Admin Meter Reading.');
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
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-600 inline-flex shadow-sm">
              <AetraLogo className="h-8" />
            </div>
          </div>
          <h2 className="text-xl font-black text-[#0055A5] dark:text-blue-400">Masuk SIMBA-IN</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Sistem Informasi Monitoring Billing Air Industri
          </p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">PT Aetra Air Tangerang</p>
        </div>

        {/* Tab switcher: Admin Kantor vs Pembaca Meter Lapangan */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setAuthError(null);
            }}
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
            onClick={() => {
              setLoginType('field_reader');
              setAuthError(null);
              setPasswordInput('');
            }}
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
                  className="w-full pl-3.5 pr-9 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white transition"
                >
                  <option value="yaya">Pak Yaya (Tim Billing & Invoicing)</option>
                  <option value="solihin">Pak Solihin (Admin Meter Reading)</option>
                  <option value="kabul">Pak Kabul (Admin Meter Reading)</option>
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

          {/* Role Info Box */}
          <div
            className={`p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${
              loginType === 'admin'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-slate-700 dark:text-slate-300'
                : 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            {loginType === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <Smartphone className="w-4 h-4 text-[#E86216] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-extrabold text-[#0055A5] dark:text-blue-300">
                {loginType === 'admin'
                  ? selectedAdminRole === 'yaya'
                    ? 'Otoritas Pak Yaya (Billing & Invoicing):'
                    : 'Otoritas Admin Meter Reading (Pak Solihin / Pak Kabul):'
                  : `Petugas: ${selectedReader?.nama || 'Petugas'} (${selectedReader?.kategori || 'Key Account'})`}
              </p>
              <p className="mt-0.5 leading-relaxed text-[10px]">
                {loginType === 'admin'
                  ? selectedAdminRole === 'yaya'
                    ? 'Monitoring status Verified, approval invoice resmi, otomasi E-Materai (> 5 Juta), dan ekspor CSV.'
                    : 'Pengelolaan master data industri, plotting matriks jadwal 15 cycle, rekap verifikasi lapangan, dan audit log.'
                  : `Siklus penugasan: ${selectedReader?.assignedCycles.join(', ') || 'Cycle 1-3'}. Form input stand meter, foto meteran fisik, lembar BPM & GPS satelit.`}
              </p>
            </div>
          </div>

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
