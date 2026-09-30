import React from 'react';
import defaultLogoImg from '../assets/images/aetra_logo_1790675722882.jpg';

interface AetraLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
}

export const AetraLogo: React.FC<AetraLogoProps> = ({ className = 'h-10', variant = 'full' }) => {
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`} title="PT Aetra Air Tangerang">
        <img
          src={defaultLogoImg}
          alt="Aetra Tangerang Logo"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} title="PT Aetra Air Tangerang">
      <img
        src={defaultLogoImg}
        alt="Aetra Tangerang Logo"
        className="h-10 w-auto object-contain"
      />
    </div>
  );
};



