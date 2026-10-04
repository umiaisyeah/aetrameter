import React from 'react';
import {
  Sparkles,
  Calendar,
  Smartphone,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Droplets
} from 'lucide-react';
import { SimbaLogo } from './SimbaLogo';

interface SimbaWelcomeScreenProps {
  onEnter: (targetPortal?: 'admin' | 'field_reader') => void;
}

export const SimbaWelcomeScreen: React.FC<SimbaWelcomeScreenProps> = ({ onEnter }) => {
  const features = [
    {
      id: 'cycle',
      title: 'Siklus Pembacaan Cycle 1–15',
      badge: 'SIKLUS',
      color: 'blue',
      icon: Calendar,
      desc: 'Penjadwalan dan monitoring progres pembacaan meter industri.'
    },
    {
      id: 'mobile',
      title: 'Mobile App Petugas Lapangan',
      badge: 'KAMERA & GPS',
      color: 'orange',
      icon: Smartphone,
      desc: 'Pencatatan stand meter dengan foto watermark dan geotagging GPS.'
    },
    {
      id: 'verification',
      title: 'Verifikasi Reading & Validasi BPM',
      badge: 'VERIFIKASI',
      color: 'emerald',
      icon: ShieldCheck,
      desc: 'Pemeriksaan kesesuaian fisik stand meter dan lembar dokumen BPM.'
    },
    {
      id: 'billing',
      title: 'Modul Billing & Faktur Tagihan Air',
      badge: 'e-FAKTUR',
      color: 'cyan',
      icon: Receipt,
      desc: 'Perhitungan tarif otomatis volume air dan penerbitan faktur resmi.'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#020b18] via-[#071933] via-[#0a254a] to-[#030e20] text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-y-auto font-sans select-none">
      {/* Dynamic Animated Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-cyan-500/15 via-[#0055A5]/25 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-[#E86216]/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      <div className="absolute top-12 left-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Showcase Presentation Body */}
      <main className="relative z-10 max-w-5xl w-full mx-auto my-auto py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Animated Moving Logo Showcase (Enlarged) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
          {/* Animated Logo Container with Dynamic Moving Elements */}
          <div className="relative flex items-center justify-center p-4 sm:p-6 group">
            {/* Concentric Water Ripple Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ripple-ring pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-blue-400/40 animate-ripple-ring pointer-events-none" style={{ animationDelay: '1.2s' }} />
            <div className="absolute inset-6 rounded-full border border-orange-400/25 animate-ripple-ring pointer-events-none" style={{ animationDelay: '2.4s' }} />

            {/* Rotating Energy Ring with Orbiting Marker */}
            <div className="absolute inset-2 rounded-full border border-dashed border-white/25 animate-rotate-orbit pointer-events-none">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee]" />
            </div>

            {/* Glowing Backdrop Circle with Shimmer Sweep - Enlarged */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-[#002244] via-[#004b93] via-[#0284c7] to-[#E86216] p-2 animate-pulse-glow flex items-center justify-center transition-all duration-500 group-hover:scale-105 relative overflow-hidden shadow-2xl">
              {/* Glossy Sheen Sweep across the circular badge */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-shimmer-sweep" />

              <div className="w-full h-full rounded-full bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border border-white/30 relative overflow-hidden">
                {/* Dynamically Animated Moving Logo (Active Needle & Spin - Big & Prominent) */}
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <SimbaLogo variant="icon" animated={true} size={150} className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 drop-shadow-[0_8px_30px_rgba(0,163,224,0.7)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: SIMBA Concise Description & Portal Selector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Title Banner */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>SISTEM INTEGRASI METERING &amp; BILLING</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Selamat Datang di{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-orange-400">
                SIMBA
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              Platform operasional PT Aetra Air Tangerang untuk pembacaan meter industri, verifikasi berkas BPM fisik, dan penerbitan faktur tagihan air.
            </p>
          </div>

          {/* Concise Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="p-2.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#003E78] to-[#0055A5] text-white shrink-0 shadow-xs">
                      <Icon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-xs text-white truncate">
                          {feat.title}
                        </h3>
                        <span className="text-[7.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/15 text-cyan-200 shrink-0">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Differentiated Portal Entrance Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Pilih Laman Masuk Sesuai Peran:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Admin Portal */}
              <button
                type="button"
                onClick={() => onEnter('admin')}
                className="group p-4 rounded-2xl bg-gradient-to-br from-[#003E78] via-[#0055A5] to-[#0074D9] hover:from-[#00305e] hover:to-[#005ea6] active:scale-98 transition shadow-lg shadow-blue-900/40 border border-blue-400/40 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shrink-0">
                    <ShieldCheck className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-cyan-200 text-[9px] font-mono font-black uppercase tracking-wider mb-0.5">
                      KANTOR PUSAT
                    </span>
                    <h3 className="text-sm font-black text-white leading-tight">
                      Masuk sebagai Admin
                    </h3>
                    <p className="text-[10px] text-blue-100/80 leading-tight mt-0.5">
                      Dashboard Monitoring, Validasi &amp; Billing
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Option 2: Field Reader Portal */}
              <button
                type="button"
                onClick={() => onEnter('field_reader')}
                className="group p-4 rounded-2xl bg-gradient-to-br from-[#9c3400] via-[#C44800] to-[#E86216] hover:from-[#822b00] hover:to-[#c44800] active:scale-98 transition shadow-lg shadow-orange-950/40 border border-orange-400/40 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white shrink-0">
                    <Smartphone className="w-6 h-6 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-amber-200 text-[9px] font-mono font-black uppercase tracking-wider mb-0.5">
                      PETUGAS LAPANGAN
                    </span>
                    <h3 className="text-sm font-black text-white leading-tight">
                      Masuk Petugas Lapangan
                    </h3>
                    <p className="text-[10px] text-orange-100/80 leading-tight mt-0.5">
                      Input Stand Meter, Kamera &amp; GPS
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-300 shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-medium">
        <p>© 2026 PT Aetra Air Tangerang. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="flex items-center gap-1.5">
          <Droplets className="w-3 h-3 text-cyan-400" />
          <span>Sistem Integrasi Metering &amp; Billing (SIMBA) — Unit Industri</span>
        </p>
      </footer>
    </div>
  );
};
