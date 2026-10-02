import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Layers,
  FileCheck,
  Camera
} from 'lucide-react';
import { IndustryCustomer } from '../types';
import { getCustomerCoordinates, formatCoordinateString } from '../utils/gpsHelper';
import { showToast } from '../utils/notificationSystem';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: IndustryCustomer | null;
  photoType: 'meter' | 'bpm';
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  customer,
  photoType
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  if (!isOpen || !customer) return null;

  const imageUrl = photoType === 'meter' ? customer.fotoMeter : customer.fotoBPM;
  const isMeter = photoType === 'meter';
  const coords = getCustomerCoordinates(customer);

  const lat = photoType === 'bpm' && customer.bpmLatitude ? customer.bpmLatitude : coords.lat;
  const lng = photoType === 'bpm' && customer.bpmLongitude ? customer.bpmLongitude : coords.lng;
  const timeStr =
    photoType === 'bpm'
      ? customer.bpmWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:15 WIB'
      : customer.meterWaktuFoto || customer.waktuBaca || '30 Sep 2026 10:14 WIB';

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCopyCoordinates = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    showToast({
      title: 'Koordinat GPS Disalin!',
      message: `${text} berhasil disalin.`,
      type: 'success'
    });
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 px-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl text-white shadow-sm ${
                isMeter ? 'bg-[#0055A5]' : 'bg-[#E86216]'
              }`}
            >
              {isMeter ? <Camera className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white truncate">
                  {isMeter ? 'Foto Fisik Stand Meter Lapangan' : 'Foto Lembar Bukti Pembacaan Meter (BPM)'}
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  GPS Terkunci
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {customer.nama} · ID: {customer.id} · {customer.cycle}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image View Area */}
        <div className="flex-1 bg-black/60 relative overflow-auto flex items-center justify-center p-4 min-h-[320px] max-h-[60vh]">
          {imageUrl ? (
            <div
              className="transition-transform duration-200 cursor-grab active:cursor-grabbing max-w-full max-h-full flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={imageUrl}
                alt={isMeter ? `Stand Meter ${customer.nama}` : `BPM ${customer.nama}`}
                className="max-w-full max-h-[56vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-sm">Belum Ada Foto Terunggah</p>
              <p className="text-xs text-slate-500 mt-1">Status: {customer.status}</p>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Geotag Details Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-sans">
          {/* Geotag Coordinates */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Koordinat GPS</span>
              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[9px]">{copiedCoords ? 'Tersalin' : 'Salin'}</span>
              </button>
            </span>
            <div className="font-mono text-cyan-300 font-extrabold text-[11px] mt-1">
              Lat: {lat.toFixed(6)}<br />
              Long: {lng.toFixed(6)}
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Akurasi: ±{coords.accuracy || 3.5}m</span>
          </div>

          {/* Reading Timestamp */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Tanggal &amp; Waktu Baca
            </span>
            <div className="font-semibold text-white text-[11px] mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{timeStr}</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Siklus: {customer.cycle}</span>
          </div>

          {/* Stand Meter / Volume */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Stand Terbaca &amp; Volume
            </span>
            <div className="font-mono font-black text-emerald-400 text-[11px] mt-1">
              Stand: {customer.skrg > 0 ? `${customer.skrg.toLocaleString()} m³` : 'Belum Dibaca'}
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Konsumsi: {customer.skrg > 0 ? `${Math.max(0, customer.skrg - customer.lalu).toLocaleString()} m³` : '—'}
            </span>
          </div>

          {/* Meter Reader PIC */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Petugas Pembaca Meter
            </span>
            <div className="font-bold text-white text-[11px] mt-1 flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{customer.petugasBaca || 'Petugas Lapangan'}</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5 truncate">
              {customer.kategoriPetugas || 'Kontraktor'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
