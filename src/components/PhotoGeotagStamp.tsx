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
}

export const PhotoGeotagStamp: React.FC<PhotoGeotagStampProps> = ({
  customer,
  photoType,
  className = '',
  onClickPreview,
  compact = false
}) => {
  const coords = getCustomerCoordinates(customer);

  const lat = photoType === 'bpm' && customer.bpmLatitude ? customer.bpmLatitude : coords.lat;
  const lng = photoType === 'bpm' && customer.bpmLongitude ? customer.bpmLongitude : coords.lng;
  const timeStr =
    photoType === 'bpm'
      ? customer.bpmWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:15 WIB'
      : customer.meterWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:14 WIB';

  return (
    <div
      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent p-2 pt-3 text-white text-[9px] select-none pointer-events-auto transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/15 shadow-sm">
        {/* Left: GPS Lat Long in Mono */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="p-0.5 rounded bg-rose-500/20 text-rose-400 shrink-0">
            <MapPin className="w-2.5 h-2.5" />
          </div>
          <div className="min-w-0 truncate font-mono text-[8.5px] text-cyan-300 font-extrabold">
            <span className="truncate">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Right: Timestamp & Click Hint */}
        <div className="flex items-center gap-1 shrink-0 text-[8px] text-slate-300 font-medium">
          <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline truncate max-w-[100px]">{timeStr.split(' ')[0]}</span>
          {onClickPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClickPreview();
              }}
              className="ml-1 p-0.5 px-1.5 bg-white/15 hover:bg-white/25 rounded text-[8px] font-bold text-white flex items-center gap-0.5 transition cursor-pointer"
              title="Perbesar & Lihat Detail Foto"
            >
              <ZoomIn className="w-2.5 h-2.5" />
              <span>Lihat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
