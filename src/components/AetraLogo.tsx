import React, { useState, useEffect } from 'react';
import defaultLogoImg from '../assets/images/aetra_logo_1790675722882.jpg';
import { showColorfulAlert } from '../utils/notificationSystem';

interface AetraLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
}

export const AetraLogo: React.FC<AetraLogoProps> = ({ className = 'h-8', variant = 'full' }) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return localStorage.getItem('custom_aetra_logo') || defaultLogoImg;
  });

  useEffect(() => {
    const handleStorage = () => {
      const custom = localStorage.getItem('custom_aetra_logo');
      if (custom) setLogoSrc(custom);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          localStorage.setItem('custom_aetra_logo', result);
          setLogoSrc(result);
          window.dispatchEvent(new Event('storage'));
          showColorfulAlert({
            title: 'Logo Resmi Diperbarui! ✨',
            message: 'Logo resmi PT Aetra Air Tangerang berhasil diperbarui dan diterapkan secara langsung ke seluruh dokumen, sidebar, cetak invoice, dan antarmuka aplikasi!',
            type: 'success',
            badge: 'BRANDING RESMI'
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (variant === 'icon') {
    return (
      <label className="relative cursor-pointer group block" title="Klik untuk mengganti logo resmi">
        <img
          src={logoSrc}
          alt="Aetra Tangerang Logo"
          className={`object-contain rounded-lg ${className}`}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none relative group ${className}`}>
      <label className="cursor-pointer block relative" title="Klik untuk unggah logo resmi (PNG/JPG)">
        <img
          src={logoSrc}
          alt="Aetra Tangerang Logo"
          className="h-10 w-auto object-contain rounded-lg shadow-xs hover:opacity-90 transition"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-[9px] text-white font-bold text-center p-0.5">
          Ganti Logo
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    </div>
  );
};



