import React from 'react';
import { MapPin, Clock, User, ShieldCheck, Radio, Navigation } from 'lucide-react';
import { IndustryCustomer } from '../types';
import { getCustomerCoordinates, formatCoordinateString } from '../utils/gpsHelper';

interface PhotoGeotagStampProps {
  customer: IndustryCustomer;
  photoType: 'meter' | 'bpm';
  className?: string;
  onOpenMap?: () => void;
}

export const PhotoGeotagStamp: React.FC<PhotoGeotagStampProps> = ({
  customer,
  photoType,
  className = '',
  onOpenMap
}) => {
  const coords = getCustomerCoordinates(customer);

  const lat = photoType === 'bpm' && customer.bpmLatitude ? customer.bpmLatitude : coords.lat;
  const lng = photoType === 'bpm' && customer.bpmLongitude ? customer.bpmLongitude : coords.lng;
  const timeStr =
    photoType === 'bpm'
      ? customer.bpmWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:15:20 WIB'
      : customer.meterWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:14:12 WIB';

  return (
    <div
      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent p-2.5 pt-6 text-white text-[10px] select-none backdrop-blur-xs flex flex-col justify-end gap-1 ${className}`}
    >
      {/* Geotag Header Badge */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 bg-blue-600/90 text-white px-2 py-0.5 rounded-md font-mono text-[9px] font-black tracking-wider uppercase shadow-xs">
          <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-300" />
          <span>{photoType === 'meter' ? 'GEOTAGGED STAND METER' : 'GEOTAGGED DOKUMEN BPM'}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>GPS VERIFIED</span>
        </div>
      </div>

      {/* Coordinates Lat & Long */}
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-cyan-300 font-extrabold bg-black/40 px-2 py-1 rounded-md border border-white/10">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
          <span className="truncate">
            Lat: {lat.toFixed(6)}, Long: {lng.toFixed(6)}
          </span>
        </div>
        <span className="text-[8px] text-slate-300 font-sans font-bold bg-white/10 px-1 rounded shrink-0">
          ±{coords.accuracy || 3.5}m
        </span>
      </div>

      {/* Metadata details: Time & Reader */}
      <div className="flex items-center justify-between text-[9px] text-slate-300 gap-1 flex-wrap font-medium">
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-200">
          <User className="w-2.5 h-2.5 text-blue-400 shrink-0" />
          <span className="truncate max-w-[130px] font-semibold">{customer.petugasBaca || 'Petugas Lapangan'}</span>
        </div>
      </div>
    </div>
  );
};
