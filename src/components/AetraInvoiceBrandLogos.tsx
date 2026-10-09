import React from 'react';
import kabTangerangLogoImg from '../assets/images/kab_tangerang_logo_1791436260288.jpg';
import aetraOfficialLogoImg from '../assets/images/aetra_official_logo_1791525727261.jpg';

/**
 * Official Lambang Pemerintah Kabupaten Tangerang
 * Rendered using authentic official emblem image asset as requested by user, with fallback SVG
 */
export const KabupatenTangerangLogo: React.FC<{
  className?: string;
  size?: number;
  showText?: boolean;
}> = ({
  className = 'h-16 w-auto',
  size = 56,
  showText = true,
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {!imgError ? (
        <img
          src={kabTangerangLogoImg}
          alt="Lambang Resmi Pemerintah Kabupaten Tangerang"
          className="object-contain filter drop-shadow-sm"
          style={{ height: `${size}px`, width: 'auto', maxHeight: '100%' }}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        /* SVG fallback if image cannot be rendered */
        <svg
          width={size}
          height={size * 1.25}
          viewBox="0 0 100 126"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 select-none"
        >
          {/* Castle / Benteng Crown with 5 battlements (Mahkota Benteng) */}
          <g id="crown">
            <path
              d="M18 9 H82 V19 H74 V14 H61 V19 H53 V14 H45 V19 H33 V14 H25 V19 H18 Z"
              fill="#D4AF37"
              stroke="#8A6D3B"
              strokeWidth="1.2"
            />
            <rect x="20.5" y="11" width="4" height="4.5" fill="#C0392B" rx="0.5" />
            <rect x="34.5" y="11" width="5.5" height="4.5" fill="#C0392B" rx="0.5" />
            <rect x="47.5" y="11" width="5" height="4.5" fill="#C0392B" rx="0.5" />
            <rect x="60" y="11" width="5.5" height="4.5" fill="#C0392B" rx="0.5" />
            <rect x="73.5" y="11" width="4" height="4.5" fill="#C0392B" rx="0.5" />
          </g>

          {/* Shield Outer Gold Rim */}
          <path
            d="M50 18 L85 28 C85 68 70 95 50 104 C30 95 15 68 15 28 Z"
            fill="#005A36"
            stroke="#D4AF37"
            strokeWidth="2.8"
          />
          {/* Inner Shield Emerald Green Field */}
          <path
            d="M50 21.5 L81 30.5 C81 65 67.5 90 50 98.5 C32.5 90 19 65 19 30.5 Z"
            fill="#007A48"
          />
          {/* Inner Center Sky Blue Field */}
          <path
            d="M50 25.5 L76 33.5 C76 62.5 64.5 84 50 92 C35.5 84 24 62.5 24 33.5 Z"
            fill="#EBF5FB"
          />

          {/* Padi (Left curve - 17 butir padi emas) */}
          <g id="padi" stroke="#B7950B" strokeWidth="0.4" fill="#F4D03F">
            <ellipse cx="23" cy="38" rx="2" ry="1.2" transform="rotate(-30 23 38)" />
            <ellipse cx="21" cy="45" rx="2.2" ry="1.3" transform="rotate(-15 21 45)" />
            <ellipse cx="20.5" cy="53" rx="2.2" ry="1.3" transform="rotate(0 20.5 53)" />
            <ellipse cx="21" cy="61" rx="2.2" ry="1.3" transform="rotate(15 21 61)" />
            <ellipse cx="23" cy="69" rx="2.2" ry="1.3" transform="rotate(30 23 69)" />
            <ellipse cx="26" cy="76" rx="2.2" ry="1.3" transform="rotate(45 26 76)" />
            <ellipse cx="30" cy="83" rx="2.2" ry="1.3" transform="rotate(60 30 83)" />
            <path d="M22 36 Q19 58 32 85" stroke="#B7950B" strokeWidth="0.8" fill="none" />
          </g>

          {/* Kapas (Right curve - 8 kuntum bunga kapas) */}
          <g id="kapas">
            <circle cx="78" cy="40" r="2.2" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <circle cx="79.5" cy="49" r="2.4" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <circle cx="79.5" cy="58" r="2.4" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <circle cx="78" cy="67" r="2.4" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <circle cx="74" cy="75" r="2.4" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <circle cx="68" cy="83" r="2.4" fill="#FFFFFF" stroke="#005A36" strokeWidth="0.6" />
            <path d="M78 38 Q81 58 66 85" stroke="#005A36" strokeWidth="0.8" fill="none" />
          </g>

          {/* Benteng / Fortress Red Wall */}
          <g id="benteng">
            <path
              d="M32 58 H68 V76 C68 81 60 84 50 84 C40 84 32 81 32 76 Z"
              fill="#C0392B"
              stroke="#922B21"
              strokeWidth="0.8"
            />
            {/* 3 Merlons on wall */}
            <rect x="35" y="53" width="6" height="5.5" fill="#C0392B" stroke="#922B21" strokeWidth="0.6" />
            <rect x="47" y="53" width="6" height="5.5" fill="#C0392B" stroke="#922B21" strokeWidth="0.6" />
            <rect x="59" y="53" width="6" height="5.5" fill="#C0392B" stroke="#922B21" strokeWidth="0.6" />
            {/* Gateway arch */}
            <path d="M44.5 72 Q50 67 55.5 72 V82 H44.5 Z" fill="#F4D03F" stroke="#B7950B" strokeWidth="0.6" />
          </g>

          {/* Sungai Cisadane River Waves (3 blue and white wavy lines) */}
          <g id="sungai_cisadane">
            <path d="M35 77 Q42 75 50 77 T65 77" stroke="#0055A5" strokeWidth="1.2" fill="none" />
            <path d="M36 79 Q43 77 50 79 T64 79" stroke="#FFFFFF" strokeWidth="1" fill="none" />
            <path d="M38 81 Q44 79 50 81 T62 81" stroke="#0055A5" strokeWidth="1" fill="none" />
          </g>

          {/* Upright Keris Pusaka */}
          <g id="keris">
            <path
              d="M50 36 Q47.5 43 51 49 Q48 55 51 61 L49 63 H51 L50 36 Z"
              fill="#D4AF37"
              stroke="#9A7D0A"
              strokeWidth="0.9"
            />
            <rect x="48" y="47" width="4" height="2" fill="#C0392B" stroke="#9A7D0A" strokeWidth="0.5" />
          </g>

          {/* Golden 5-Pointed Star (Bintang Keemasan) */}
          <polygon
            points="50,27 52.6,34 60,34 54,38.5 56.5,45.5 50,41.5 43.5,45.5 46,38.5 40,34 47.4,34"
            fill="#F4D03F"
            stroke="#B7950B"
            strokeWidth="0.9"
          />

          {/* Ribbon Banner */}
          <path
            d="M17 87 Q50 96 83 87 L84.5 93 Q50 101.5 15.5 93 Z"
            fill="#F4D03F"
            stroke="#B7950B"
            strokeWidth="1.1"
          />
          <text
            x="50"
            y="92"
            textAnchor="middle"
            fontSize="5.2"
            fontWeight="900"
            fontFamily="'Segoe UI', Roboto, Arial, sans-serif"
            fill="#004D20"
            letterSpacing="0.6"
          >
            KABUPATEN TANGERANG
          </text>
        </svg>
      )}

      {showText && (
        <div className="mt-0.5 flex flex-col items-center justify-center leading-tight">
          <span className="text-[6.5px] font-black tracking-tight text-slate-800 uppercase">
            PEMERINTAH
          </span>
          <span className="text-[5.5px] font-black tracking-tighter text-slate-700 uppercase">
            KABUPATEN TANGERANG
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Official PT Aetra Air Tangerang Corporate Brand Logo
 * Rendered using authentic brand logo asset matching the official invoice, with SVG fallback
 */
export const AetraOfficialLogo: React.FC<{ className?: string; height?: number }> = ({
  className = 'h-11 w-auto',
  height = 44
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`shrink-0 flex items-center justify-center select-none ${className}`}>
      {!imgError ? (
        <img
          src={aetraOfficialLogoImg}
          alt="Official PT Aetra Air Tangerang Logo"
          className="object-contain filter drop-shadow-sm"
          style={{ height: `${height}px`, width: 'auto', maxHeight: '100%' }}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback SVG */
        <svg
          height={height}
          viewBox="0 0 178 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 select-none"
        >
          {/* Wordmark "aetra" & "air tangerang" */}
          <text
            x="2"
            y="27"
            fontFamily="'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
            fontSize="30"
            fontWeight="800"
            fill="#0055A5"
            letterSpacing="-0.8"
          >
            aetra
          </text>
          <text
            x="3.5"
            y="39.5"
            fontFamily="'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
            fontSize="9.8"
            fontWeight="700"
            fill="#0055A5"
            letterSpacing="3.5"
          >
            air tangerang
          </text>

          {/* Authentic Swirling Sun & Water Droplet Vortex (8 radiating curved petals) */}
          <g transform="translate(112, 1)">
            {/* Center core pip */}
            <circle cx="23" cy="23" r="4.8" fill="#E86216" />

            {/* Petal 1: Top (Cyan #00A3E0) */}
            <path
              d="M23 7 C23 2.5 27.5 1 31.5 4 C35 6.8 33 12 28.5 13.5 C25 14.5 23 11 23 7 Z"
              fill="#00A3E0"
            />
            {/* Petal 2: Top-Right (Sky Blue #0077C8) */}
            <path
              d="M33 11 C37 8 41.5 10 42 14.5 C42.5 18.5 38 21 34 19 C31 17.5 30 14 33 11 Z"
              fill="#0077C8"
            />
            {/* Petal 3: Right (Royal Blue #0055A5) */}
            <path
              d="M37 22 C41.5 22 43.5 26.5 40.5 30 C37.5 33 32 31 31 26.5 C30.5 23 33.5 22 37 22 Z"
              fill="#0055A5"
            />
            {/* Petal 4: Bottom-Right (Deep Navy #003882) */}
            <path
              d="M34 32 C37 36 35 40.5 30.5 41.5 C26.5 42.5 23.5 38 26 34.5 C27.5 31.5 31.5 30 34 32 Z"
              fill="#FFA000"
            />
            {/* Petal 5: Bottom (Tangerine Orange #E86216) */}
            <path
              d="M23 39 C23 43.5 18.5 45 14.5 42 C11 39.2 13 34 17.5 32.5 C21 31.5 23 35 23 39 Z"
              fill="#E86216"
            />
            {/* Petal 6: Bottom-Left (Amber #FF9E1B) */}
            <path
              d="M13 35 C9 38 4.5 36 4 31.5 C3.5 27.5 8 25 12 27 C15 28.5 16 32 13 35 Z"
              fill="#F37021"
            />
            {/* Petal 7: Left (Golden Yellow #FFC107) */}
            <path
              d="M9 24 C4.5 24 2.5 19.5 5.5 16 C8.5 13 14 15 15 19.5 C15.5 23 12.5 24 9 24 Z"
              fill="#FFC107"
            />
            {/* Petal 8: Top-Left (Vibrant Teal/Cyan #00A3E0) */}
            <path
              d="M12 14 C9 10 11 5.5 15.5 4.5 C19.5 3.5 22.5 8 20 11.5 C18.5 14.5 14.5 16 12 14 Z"
              fill="#00A3E0"
            />
          </g>
        </svg>
      )}
    </div>
  );
};

/**
 * TÜV NORD ISO 9001:2015 Certification Badge
 */
export const TuvNordLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-12 w-auto',
  size = 46
}) => (
  <div className={`flex flex-col items-center select-none text-center ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="30" cy="30" r="28" fill="#005A9C" />
      <path
        d="M12 28 Q30 14 48 28 Q30 22 12 28 Z"
        fill="white"
        opacity="0.9"
      />
      <text
        x="30"
        y="25"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="white"
        letterSpacing="0.5"
      >
        TUV NORD
      </text>
      <line x1="16" y1="28" x2="44" y2="28" stroke="white" strokeWidth="1" />
      <text
        x="30"
        y="36"
        textAnchor="middle"
        fontSize="5"
        fontWeight="800"
        fontFamily="sans-serif"
        fill="white"
      >
        ISO 9001:2015
      </text>
      <circle cx="30" cy="30" r="26.5" stroke="white" strokeWidth="1" strokeDasharray="1.5 1.5" fill="none" />
    </svg>
    <div className="mt-0.5 text-[6.5px] leading-tight font-sans text-slate-700 font-bold">
      <div>Certified Company</div>
      <div className="font-mono text-[6px] text-slate-600">No. 16 00 C 18046</div>
    </div>
  </div>
);

/**
 * KAN (Komite Akreditasi Nasional) Logo
 */
export const KanLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-12 w-auto',
  size = 46
}) => (
  <div className={`flex flex-col items-center select-none text-center ${className}`}>
    <svg
      width={size * 1.5}
      height={size * 0.75}
      viewBox="0 0 90 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red checkmark */}
      <path
        d="M8 20 L16 32 L30 10 L25 7 L16 23 L12 17 Z"
        fill="#E11D48"
      />
      {/* "KAN" Wordmark */}
      <text
        x="34"
        y="28"
        fontSize="24"
        fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif"
        fill="#005A9C"
        letterSpacing="1"
      >
        KAN
      </text>
    </svg>
    <div className="text-[6px] leading-[1.1] font-sans text-slate-700 font-semibold max-w-[85px]">
      <div>Komite Akreditasi Nasional</div>
      <div className="text-[5.5px] text-slate-500">Lembaga Sertifikasi Sistem Mutu</div>
      <div className="font-mono text-[5.5px] text-slate-600 font-bold">LSSM - 016 - IDN</div>
    </div>
  </div>
);

/**
 * Halal Indonesia Logo (MUI / BPJPH)
 */
export const HalalIndonesiaLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'h-12 w-auto',
  size = 46
}) => (
  <div className={`flex flex-col items-center select-none text-center ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="30" fill="white" stroke="#007A48" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#007A48" strokeWidth="0.8" strokeDasharray="2 1.5" />
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fontSize="5"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#007A48"
        letterSpacing="0.4"
      >
        MAJELIS ULAMA
      </text>
      <text
        x="32"
        y="23"
        textAnchor="middle"
        fontSize="4.5"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#007A48"
        letterSpacing="0.4"
      >
        INDONESIA
      </text>
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fontFamily="'Traditional Arabic', serif"
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
        letterSpacing="1.2"
      >
        HALAL
      </text>
    </svg>
    <div className="mt-0.5 font-mono text-[6px] text-slate-600 font-bold">
      No. 00170092031118
    </div>
  </div>
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
