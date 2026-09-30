import React from 'react';
import { Gauge, ReceiptText } from 'lucide-react';

interface AetraLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
}

export const AetraLogo: React.FC<AetraLogoProps> = ({ className = 'h-10', variant = 'full' }) => {
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`} title="Catat Meter & Billing Industri">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0055A5] to-[#E86216] flex items-center justify-center text-white shadow-xs shrink-0">
          <Gauge className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} title="Catat Meter & Billing Industri">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#0055A5] flex items-center justify-center text-white shadow-xs" title="Catat Meter">
          <Gauge className="w-4 h-4 text-cyan-300" />
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#E86216] flex items-center justify-center text-white shadow-xs" title="Billing">
          <ReceiptText className="w-4 h-4 text-amber-100" />
        </div>
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className="font-black text-xs text-[#0055A5] dark:text-blue-400 tracking-tight">
          CATAT METER
        </span>
        <span className="text-[9px] font-bold text-[#E86216] dark:text-orange-400 tracking-wider uppercase mt-0.5">
          &amp; BILLING
        </span>
      </div>
    </div>
  );
};
