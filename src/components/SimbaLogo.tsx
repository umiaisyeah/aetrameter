import React from 'react';

interface SimbaLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  darkTheme?: boolean;
  animated?: boolean;
  size?: number;
}

export const SimbaLogo: React.FC<SimbaLogoProps> = ({
  className = 'h-10',
  variant = 'full',
  darkTheme = false,
  animated = false,
  size
}) => {
  // Vector Emblem: Fusion of Water Wave, Precision Meter Gauge, and Integrated Billing Spark
  const Emblem = ({ size = 38 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm select-none ${animated ? 'animate-logo-wobble drop-shadow-md' : ''}`}
    >
      <defs>
        {/* Blue Gradient for Water / Metering */}
        <linearGradient id="simbaWaterGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00A3E0" />
          <stop offset="50%" stopColor="#0055A5" />
          <stop offset="100%" stopColor="#002855" />
        </linearGradient>

        {/* Orange Gradient for Billing / Invoicing */}
        <linearGradient id="simbaBillingGrad" x1="16" y1="12" x2="46" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="60%" stopColor="#E86216" />
          <stop offset="100%" stopColor="#C44800" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="simbaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0055A5" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Soft Base Hexagon / Shield */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill="url(#simbaWaterGrad)"
        filter="url(#simbaGlow)"
      />

      {/* Glossy top-left highlight */}
      <path
        d="M5 14C5 8.47715 9.47715 4 15 4H33C38.5228 4 43 8.47715 43 14V17C29 15 14 18 5 28V14Z"
        fill="white"
        fillOpacity="0.15"
      />

      {/* Water Droplet Curve Outer Arc */}
      <path
        d="M24 8C24 8 34 19 34 26C34 31.5228 29.5228 36 24 36C18.4772 36 14 31.5228 14 26C14 19 24 8 24 8Z"
        fill="white"
        fillOpacity="0.12"
        className={animated ? 'animate-wave-breathe' : ''}
      />

      {/* Meter Reading Circular Gauge Arc */}
      <circle
        cx="24"
        cy="24"
        r="13"
        stroke="white"
        strokeWidth="2.5"
        strokeDasharray="4 2.5"
        strokeOpacity="0.5"
        className={animated ? 'animate-spin-dashed' : ''}
      />

      {/* Inner Speedometer Gauge Arc (Cyan) */}
      <path
        d="M15 27C14.3 25.5 14 23.8 14 22C14 16.4772 18.4772 12 24 12C29.5228 12 34 16.4772 34 22C34 24.2 33.3 26.2 32.1 27.8"
        stroke="#7EE7FC"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Animated Dial Needle Indicator pointing to measured volume */}
      <g className={animated ? 'animate-needle-gauge' : ''}>
        <path
          d="M24 24L29 17"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="3" fill="white" />
        <circle cx="24" cy="24" r="1.5" fill="#0055A5" />
      </g>

      {/* Integrated Billing Checkmark & Receipt Emblem (Vibrant Orange Shield Accent) */}
      <g transform="translate(18, 18)" className={animated ? 'animate-pulse' : ''}>
        <circle cx="16" cy="16" r="10" fill="url(#simbaBillingGrad)" />
        <circle cx="16" cy="16" r="9.2" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        {/* Receipt Document / Check lines */}
        <path
          d="M12.5 16L15 18.5L20 13"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`} title="SIMBA - Sistem Integrasi Metering & Billing Aetra Air Tangerang">
        <Emblem size={size || 34} />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`} title="SIMBA - Sistem Integrasi Metering & Billing Aetra Air Tangerang">
        <Emblem size={32} />
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-base tracking-wider bg-gradient-to-r from-[#0055A5] via-[#0077CC] to-[#E86216] bg-clip-text text-transparent dark:from-blue-400 dark:to-orange-400">
              SIMBA
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">
            AETRA TANGERANG
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-800/80 shadow-xs">
        <Emblem size={28} />
        <div className="text-left leading-none">
          <span className="font-black text-sm tracking-wider bg-gradient-to-r from-[#0055A5] to-[#E86216] bg-clip-text text-transparent">
            SIMBA
          </span>
          <span className="block text-[8px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-0.5">
            Metering &amp; Billing
          </span>
        </div>
      </div>
    );
  }

  // Default 'full' variant
  return (
    <div className={`flex items-center gap-3.5 select-none py-1 px-1.5 ${className}`} title="SIMBA - Sistem Integrasi Metering & Billing Aetra Air Tangerang">
      <Emblem size={42} />
      <div className="flex flex-col text-left justify-center min-w-0">
        {/* Wordmark & Pill */}
        <div className="flex items-center gap-2">
          <span className="font-black text-lg sm:text-xl tracking-wide bg-gradient-to-r from-[#0055A5] via-[#0284c7] to-[#E86216] bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-300 dark:to-orange-400 leading-none">
            SIMBA
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E86216] to-amber-500 text-white text-[8px] font-black tracking-widest uppercase shadow-2xs leading-none">
            AETRA
          </span>
        </div>
        {/* Expansion Acronym */}
        <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 tracking-tight mt-1 leading-tight">
          SISTEM INTEGRASI METERING &amp; BILLING
        </span>
        <span className="text-[8.5px] font-black text-[#0055A5] dark:text-cyan-400 tracking-wider uppercase mt-0.5 leading-tight">
          PT AETRA AIR TANGERANG
        </span>
      </div>
    </div>
  );
};
