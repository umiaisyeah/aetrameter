import React from 'react';

interface AetraLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
}

export const AetraLogo: React.FC<AetraLogoProps> = ({ className = 'h-8', variant = 'full' }) => {
  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0055A5" />
        {/* Wave and Droplet Symbol */}
        <path
          d="M50 20C50 20 32 44 32 58C32 67.9411 40.0589 76 50 76C59.9411 76 68 67.9411 68 58C68 44 50 20 50 20Z"
          fill="#FFFFFF"
        />
        <path
          d="M50 40C46 50 42 58 42 63C42 67.4183 45.5817 71 50 71C54.4183 71 58 67.4183 58 63C58 58 54 50 50 40Z"
          fill="#E86216"
        />
        <path
          d="M26 62C30 52 42 46 56 47C62 47.5 68 50 72 54"
          stroke="#FFF2EA"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
          {/* Main water drop motif */}
          <rect width="44" height="44" rx="10" fill="#0055A5" />
          <path
            d="M22 10C22 10 13 22 13 28C13 32.9706 17.0294 37 22 37C26.9706 37 31 32.9706 31 28C31 22 22 10 22 10Z"
            fill="#FFFFFF"
          />
          <path
            d="M22 21C20 25 18 29 18 31.5C18 33.7091 19.7909 35.5 22 35.5C24.2091 35.5 26 33.7091 26 31.5C26 29 24 25 22 21Z"
            fill="#E86216"
          />
          <path
            d="M10 26C13 23 18 22 23 23"
            stroke="#FFF2EA"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-baseline">
          <span className="font-extrabold text-xl tracking-tight text-[#0055A5] dark:text-blue-400">
            aetra
          </span>
        </div>
        <span className="text-[9px] font-bold tracking-widest text-[#E86216] uppercase mt-0.5">
          AIR TANGERANG
        </span>
      </div>
    </div>
  );
};
