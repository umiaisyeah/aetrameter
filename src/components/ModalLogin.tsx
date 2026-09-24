import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { USER_PROFILES } from '../data/initialData';
import { AetraLogo } from './AetraLogo';
import { ShieldCheck, User, ArrowRight } from 'lucide-react';

interface ModalLoginProps {
  isOpen: boolean;
  onLogin: (user: UserProfile) => void;
}

export const ModalLogin: React.FC<ModalLoginProps> = ({ isOpen, onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('yaya');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USER_PROFILES[selectedRole] || USER_PROFILES.yaya;
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600 inline-flex shadow-sm">
              <AetraLogo className="h-9" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#0055A5] dark:text-blue-400">Masuk SIMBA-IN</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sistem Informasi Monitoring Billing Air Industri
          </p>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">PT Aetra Air Tangerang</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Pilih Pengguna / Peran Staf
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full pl-3.5 pr-9 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#0055A5] bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white transition"
              >
                <option value="yaya">Pak Yaya (Tim Billing & Invoicing)</option>
                <option value="solihin">Pak Solihin (Tim Meter Reading)</option>
                <option value="kabul">Pak Kabul (Tim Meter Reading)</option>
              </select>
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#0055A5] dark:text-blue-300">
                {selectedRole === 'yaya' ? 'Otoritas Tim Billing:' : 'Otoritas Tim Meter Reading:'}
              </p>
              <p className="mt-0.5">
                {selectedRole === 'yaya'
                  ? 'Verifikasi billing akhir, penerbitan invoice resmi, cetak PDF, dan pengiriman invoice via Outlook/Email.'
                  : 'Pencatatan stand meter lapangan, verifikasi visual meter & BPM, konfirmasi pergeseran hari baca.'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0055A5] hover:bg-[#003E78] text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
