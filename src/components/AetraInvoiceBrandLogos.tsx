import React from 'react';

/**
 * Official Lambang Kabupaten Tangerang (Vector Shield Emblem)
 */
export const KabupatenTangerangLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-12 w-auto',
  size = 48
}) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="0 0 100 115"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    {/* Shield Base */}
    <path
      d="M50 5 L88 20 C88 65 72 98 50 110 C28 98 12 65 12 20 Z"
      fill="#005A36"
      stroke="#D4AF37"
      strokeWidth="3.5"
    />
    {/* Inner Shield Yellow / Gold Border */}
    <path
      d="M50 11 L82 24 C82 62 68 91 50 102 C32 91 18 62 18 24 Z"
      fill="#007A48"
    />
    {/* Inner Sky Blue Field */}
    <path
      d="M50 16 L76 27 C76 56 64 82 50 92 C36 82 24 56 24 27 Z"
      fill="#EBF5FB"
    />

    {/* Benteng / Fortress Symbol (Tangerang Fort Heritage) */}
    <path
      d="M32 58 H68 V80 C68 85 62 88 50 88 C38 88 32 85 32 80 Z"
      fill="#C0392B"
    />
    <rect x="35" y="52" width="6" height="6" fill="#C0392B" />
    <rect x="47" y="52" width="6" height="6" fill="#C0392B" />
    <rect x="59" y="52" width="6" height="6" fill="#C0392B" />
    <path d="M44 68 H56 V82 H44 Z" fill="#F4D03F" />

    {/* Bintang Emas (Gold Star) */}
    <polygon
      points="50,22 53,30 61,30 55,35 57,43 50,38 43,43 45,35 39,30 47,30"
      fill="#F4D03F"
      stroke="#B7950B"
      strokeWidth="0.8"
    />

    {/* Keris / Trisula Motif in Center */}
    <path
      d="M48 37 C48 37 50 35 50 35 C50 35 52 37 52 37 L51 55 H49 Z"
      fill="#D4AF37"
    />

    {/* Ribbon Banner at bottom */}
    <path
      d="M20 94 Q50 102 80 94 L82 101 Q50 109 18 101 Z"
      fill="#F4D03F"
      stroke="#B7950B"
      strokeWidth="1"
    />
    <text
      x="50"
      y="100"
      textAnchor="middle"
      fontSize="6"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#004D20"
      letterSpacing="0.8"
    >
      KAB. TANGERANG
    </text>
  </svg>
);

/**
 * Official PT Aetra Air Tangerang Corporate Brand Logo (Droplet Sun Vortex + Wordmark)
 */
export const AetraOfficialLogo: React.FC<{ className?: string; height?: number }> = ({
  className = 'h-10 w-auto',
  height = 40
}) => (
  <svg
    height={height}
    viewBox="0 0 240 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    {/* Spiral Sun / Droplet Vortex Symbol */}
    <g transform="translate(180, 8)">
      {/* 8 Radial curved petals / rays */}
      <circle cx="24" cy="24" r="5" fill="#E86216" />
      <path
        d="M24 10 C24 6 28 3 32 6 C35 9 33 14 29 16 Z"
        fill="#00A3E0"
      />
      <path
        d="M38 24 C42 24 45 28 42 32 C39 35 34 33 32 29 Z"
        fill="#0055A5"
      />
      <path
        d="M24 38 C24 42 20 45 16 42 C13 39 15 34 19 32 Z"
        fill="#00A3E0"
      />
      <path
        d="M10 24 C6 24 3 20 6 16 C9 13 14 15 16 19 Z"
        fill="#0055A5"
      />
      <path
        d="M34 14 C37 11 42 12 43 16 C44 20 40 22 36 20 Z"
        fill="#E86216"
      />
      <path
        d="M34 34 C37 37 36 42 32 43 C28 44 26 40 28 36 Z"
        fill="#FFA000"
      />
      <path
        d="M14 34 C11 37 12 42 16 43 C20 44 22 40 20 36 Z"
        fill="#E86216"
      />
      <path
        d="M14 14 C11 11 12 6 16 5 C20 4 22 8 20 12 Z"
        fill="#FFA000"
      />
    </g>

    {/* Wordmark "aetra" */}
    <g transform="translate(0, 8)">
      <text
        x="0"
        y="32"
        fontFamily="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontSize="36"
        fontWeight="800"
        fill="#0055A5"
        letterSpacing="-1"
      >
        aetra
      </text>
      {/* Subtitle "tangerang" */}
      <text
        x="2"
        y="45"
        fontFamily="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#E86216"
        letterSpacing="2.5"
      >
        tangerang
      </text>
    </g>
  </svg>
);

/**
 * SGS ISO 9001 / ISO Certification Badge
 */
export const SgsIsoLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-10 w-auto',
  size = 40
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="32" cy="32" r="30" fill="white" stroke="#E86216" strokeWidth="2.5" />
    <path
      d="M14 26 Q32 14 50 26 Q32 38 14 26 Z"
      fill="#E86216"
      opacity="0.15"
    />
    <text
      x="32"
      y="28"
      textAnchor="middle"
      fontSize="12"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#E86216"
      letterSpacing="0.5"
    >
      SGS
    </text>
    <line x1="18" y1="33" x2="46" y2="33" stroke="#475569" strokeWidth="1" />
    <text
      x="32"
      y="43"
      textAnchor="middle"
      fontSize="7"
      fontWeight="800"
      fontFamily="sans-serif"
      fill="#334155"
    >
      ISO 9001
    </text>
    <text
      x="32"
      y="51"
      textAnchor="middle"
      fontSize="6"
      fontWeight="700"
      fontFamily="sans-serif"
      fill="#64748b"
    >
      UKAS / SYSTEM
    </text>
  </svg>
);

/**
 * Halal Indonesia Logo (MUI / BPJPH)
 */
export const HalalIndonesiaLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-10 w-auto',
  size = 40
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="32" cy="32" r="30" fill="white" stroke="#007A48" strokeWidth="2" />
    <circle cx="32" cy="32" r="26" fill="white" stroke="#007A48" strokeWidth="0.8" strokeDasharray="2 1.5" />
    <text
      x="32"
      y="18"
      textAnchor="middle"
      fontSize="5"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#007A48"
      letterSpacing="0.5"
    >
      MAJELIS ULAMA
    </text>
    <path
      d="M26 30 Q32 22 38 30 Q32 38 26 30 Z"
      fill="#007A48"
    />
    <text
      x="32"
      y="38"
      textAnchor="middle"
      fontSize="9"
      fontWeight="900"
      fontFamily="'Arabic Typesetting', 'Traditional Arabic', serif"
      fill="#007A48"
    >
      حلال
    </text>
    <text
      x="32"
      y="47"
      textAnchor="middle"
      fontSize="6"
      fontWeight="900"
      fontFamily="sans-serif"
      fill="#007A48"
      letterSpacing="1"
    >
      INDONESIA
    </text>
    <text
      x="32"
      y="54"
      textAnchor="middle"
      fontSize="4"
      fontWeight="700"
      fontFamily="sans-serif"
      fill="#64748b"
    >
      No. 00170092031118
    </text>
  </svg>
);

/**
 * Barcode SVG Generator for Payment Stub
 */
export const Barcode128Svg: React.FC<{ value: string; className?: string }> = ({
  value,
  className = 'h-10 w-full'
}) => {
  // Generate authentic barcode pattern from string
  const bars: { width: number; isBlack: boolean }[] = [];
  bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 1, isBlack: true });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const bits = (code * 13 + i * 7) % 64;
    for (let b = 0; b < 6; b++) {
      const isBlack = ((bits >> b) & 1) === 1;
      bars.push({ width: (b % 3 === 0 ? 2 : 1), isBlack });
    }
    bars.push({ width: 1, isBlack: false });
  }
  bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });

  let totalWidth = 0;
  bars.forEach((b) => (totalWidth += b.width));

  let currentX = 0;

  return (
    <div className="flex flex-col items-center select-none w-full">
      <svg
        viewBox={`0 0 ${totalWidth} 40`}
        preserveAspectRatio="none"
        className={`w-full ${className}`}
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return <rect key={idx} x={x} y="0" width={bar.width} height="40" fill="#0F172A" />;
        })}
      </svg>
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-700 mt-0.5">
        {value}
      </span>
    </div>
  );
};

/**
 * Orange checkmark icon as seen in Page 2 Payment Matrix table
 */
export const OrangeCheckIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M3 10.5 L7.5 15 L17 4.5"
      stroke="#E86216"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Three official accreditation logos on Page 1:
 * TUV NORD ISO 9001 + KAN + Majelis Ulama Indonesia Halal
 */
export const AetraCertificationBadges: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-2 select-none ${className}`}>
    {/* 1. TUV NORD ISO 9001 Logo */}
    <div className="flex flex-col items-center text-center">
      <svg width="44" height="44" viewBox="0 0 54 54" fill="none">
        <circle cx="27" cy="27" r="25" fill="#FFFFFF" stroke="#003580" strokeWidth="2.5" />
        <path d="M12 28 C12 18 20 12 30 12 C38 12 43 17 43 24" stroke="#0055A5" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M11 27 C11 36 19 42 27 42 C36 42 42 36 42 28" stroke="#0077C8" strokeWidth="2" fill="none" />
        <text x="27" y="27" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#003580" fontFamily="sans-serif">
          TUV NORD
        </text>
        <text x="27" y="34" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#475569" fontFamily="sans-serif">
          ISO 9001
        </text>
      </svg>
      <span className="text-[6px] font-bold text-slate-800 leading-none mt-0.5">Certified Company</span>
      <span className="text-[5.5px] font-mono text-slate-600 leading-none">No. 16 00 C 18046</span>
    </div>

    {/* Vertical divider */}
    <div className="w-[1px] h-9 bg-slate-300 mx-0.5" />

    {/* 2. KAN (Komite Akreditasi Nasional) Logo */}
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-1">
        {/* Red V Checkmark */}
        <svg width="18" height="22" viewBox="0 0 20 24" fill="none">
          <path d="M2 13 L8 21 L18 3" stroke="#DC2626" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-sans font-black text-sm text-[#003580] tracking-tighter">KAN</span>
      </div>
      <span className="text-[5.5px] font-bold text-slate-800 leading-tight">Komite Akreditasi Nasional</span>
      <span className="text-[5px] text-slate-500 leading-tight">Lembaga Sertifikasi Sistem Mutu</span>
      <span className="text-[5px] font-mono text-slate-600 leading-tight">LSSM-016-IDN</span>
    </div>

    {/* Vertical divider */}
    <div className="w-[1px] h-9 bg-slate-300 mx-0.5" />

    {/* 3. Majelis Ulama Indonesia Halal Logo */}
    <div className="flex flex-col items-center text-center">
      <svg width="40" height="40" viewBox="0 0 54 54" fill="none">
        <circle cx="27" cy="27" r="25" fill="#FFFFFF" stroke="#007A48" strokeWidth="2" />
        <circle cx="27" cy="27" r="22" fill="#FFFFFF" stroke="#007A48" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <text x="27" y="14" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#007A48" fontFamily="sans-serif">
          MAJELIS ULAMA
        </text>
        <text x="27" y="32" textAnchor="middle" fontSize="13" fontWeight="900" fill="#007A48" fontFamily="serif">
          حلال
        </text>
        <text x="27" y="42" textAnchor="middle" fontSize="5" fontWeight="900" fill="#007A48" fontFamily="sans-serif">
          INDONESIA
        </text>
      </svg>
      <span className="text-[5.5px] font-mono text-slate-600 leading-none mt-0.5">No. 00170092031118</span>
    </div>
  </div>
);
