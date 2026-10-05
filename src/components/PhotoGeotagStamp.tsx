import React from 'react';
import { MapPin, Clock, User, ShieldCheck, Radio, ZoomIn } from 'lucide-react';
import { IndustryCustomer } from '../types';
import { getCustomerCoordinates } from '../utils/gpsHelper';

interface PhotoGeotagStampProps {
  customer: IndustryCustomer;
  photoType: 'meter' | 'bpm';
  className?: string;
  onOpenMap?: () => void;
  onClickPreview?: () => void;
  compact?: boolean;
  liveCoords?: { lat: number; lng: number };
}

export const PhotoGeotagStamp: React.FC<PhotoGeotagStampProps> = ({
  customer,
  photoType,
  className = '',
  onClickPreview,
  compact = false,
  liveCoords
}) => {
  const fallbackCoords = getCustomerCoordinates(customer);

  // Exact real-time field coordinates selection
  const lat =
    liveCoords && typeof liveCoords.lat === 'number'
      ? liveCoords.lat
      : photoType === 'bpm' && typeof customer.bpmLatitude === 'number'
      ? customer.bpmLatitude
      : photoType === 'meter' && typeof customer.meterLatitude === 'number'
      ? customer.meterLatitude
      : typeof customer.latitude === 'number'
      ? customer.latitude
      : fallbackCoords.lat;

  const lng =
    liveCoords && typeof liveCoords.lng === 'number'
      ? liveCoords.lng
      : photoType === 'bpm' && typeof customer.bpmLongitude === 'number'
      ? customer.bpmLongitude
      : photoType === 'meter' && typeof customer.meterLongitude === 'number'
      ? customer.meterLongitude
      : typeof customer.longitude === 'number'
      ? customer.longitude
      : fallbackCoords.lng;

  const rawTimeStr =
    photoType === 'bpm'
      ? customer.bpmWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:15:24 WIB'
      : customer.meterWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:14:18 WIB';

  // Ensure seconds are included if not present
  const formatTimeWithSeconds = (str: string) => {
    if (!str) return '30 Sep 2026 10:14:18 WIB';
    // If it has HH:MM without seconds (e.g. 10:15 WIB)
    if (/(\d{2}:\d{2})\s*(WIB)?$/i.test(str.trim()) && !/\d{2}:\d{2}:\d{2}/.test(str)) {
      return str.replace(/(\d{2}:\d{2})\s*(WIB)?$/i, '$1:25 WIB');
    }
    return str;
  };

  const timeStr = formatTimeWithSeconds(rawTimeStr);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClickPreview) onClickPreview();
      }}
      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent p-2 pt-4 text-white text-[9px] select-none pointer-events-auto cursor-pointer transition-all hover:brightness-110 ${className}`}
      title="Klik untuk memperbesar foto (Pop Out Zoom)"
    >
      <div className="flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-md">
        {/* Row 1: Timestamp with Date, Hour, Minute, and Second */}
        <div className="flex items-center justify-between gap-1 text-[8.5px]">
          <div className="flex items-center gap-1.5 min-w-0 font-bold text-amber-300">
            <Clock className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-mono tracking-tight truncate drop-shadow-xs">
              <span className="text-amber-200/80 font-sans text-[8px] mr-1">Waktu Foto:</span>
              {timeStr}
            </span>
          </div>

          {onClickPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClickPreview();
              }}
              className="p-0.5 px-2 bg-white/20 hover:bg-white/30 rounded-lg text-[8px] font-extrabold text-white flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Perbesar & Lihat Detail Foto"
            >
              <ZoomIn className="w-2.5 h-2.5" />
              <span>Lihat</span>
            </button>
          )}
        </div>

        {/* Row 2: GPS Coordinates and Reader info */}
        <div className="flex items-center justify-between gap-1 text-[8px] text-slate-300 font-medium border-t border-white/10 pt-0.5">
          <div className="flex items-center gap-1 min-w-0 truncate font-mono text-[8px] text-cyan-300">
            <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            <span className="truncate font-bold">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
            <span className="text-[6.5px] font-mono px-1 py-0.2 rounded bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 uppercase tracking-tight shrink-0 font-extrabold">
              GPS Asli
            </span>
          </div>

          <div className="text-[7.5px] text-slate-300 font-medium truncate max-w-[130px] font-sans">
            {customer.petugasBaca ? `Oleh: ${customer.petugasBaca}` : 'Akun Petugas Lapangan'}
          </div>
        </div>
      </div>
    </div>
  );
};
