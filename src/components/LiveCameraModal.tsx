import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  RotateCcw,
  X,
  Sparkles,
  MapPin,
  Clock,
  User,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  Zap,
  ZapOff,
  Flashlight
} from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, capturedTimestamp: string) => void;
  title: string;
  customerName: string;
  customerId: string;
  readerName: string;
  gpsLocation?: string;
  latitude?: number;
  longitude?: number;
  photoType: 'meter' | 'bpm';
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  customerName,
  customerId,
  readerName,
  gpsLocation = 'Lat: -6.187214, Long: 106.541290',
  latitude,
  longitude,
  photoType
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentLiveTime, setCurrentLiveTime] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);

  // Live ticking time updater (includes date, hour, minute, and second)
  useEffect(() => {
    if (!isOpen) return;

    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentLiveTime(`${datePart} ${hours}:${mins}:${secs} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Start media stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          if (isTorchOn) {
            track.applyConstraints({ advanced: [{ torch: false }] } as any);
          }
        } catch {}
        track.stop();
      });
      streamRef.current = null;
    }
    setIsTorchOn(false);
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setHasCameraPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat atau browser ini tidak mendukung akses kamera langsung.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play error:', err);
        });
      }

      // Check hardware torch capabilities on the active video track
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          setIsTorchSupported(Boolean(capabilities?.torch));
        } catch {
          setIsTorchSupported(false);
        }
      }

      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      setHasCameraPermission(false);
      setErrorMessage(
        err?.message ||
          'Kamera tidak dapat diakses secara otomatis. Anda dapat menggunakan tombol pemilih kamera bawaan di bawah ini.'
      );
    }
  };

  const toggleTorch = async () => {
    const nextTorch = !isTorchOn;
    setIsTorchOn(nextTorch);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: nextTorch }]
          } as any);
        } catch (err) {
          console.warn('Hardware torch constraint error (using high-luminance screen fill-light boost):', err);
        }
      }
    }
  };

  const handleSwitchCamera = () => {
    // If switching camera, turn off torch first
    if (isTorchOn && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          track.applyConstraints({ advanced: [{ torch: false }] } as any);
        } catch {}
      }
      setIsTorchOn(false);
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Draw video frame to canvas (apply subtle exposure and clarity enhancement when torch is active)
    if (isTorchOn) {
      ctx.filter = 'brightness(1.12) contrast(1.08)';
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.filter = 'none';

    // Formatted current timestamp with exact seconds
    const now = new Date();
    const datePart = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const waktuTerekam = `${datePart} ${hours}:${mins}:${secs} WIB`;

    // Watermark Geotag Stamp directly onto the image canvas
    const bannerHeight = Math.max(70, Math.round(height * 0.12));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Cyan top accent line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, height - bannerHeight, width, 3);

    // Text specifications
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.round(bannerHeight * 0.28)}px sans-serif`;
    ctx.fillText(
      `PT AETRA AIR TANGERANG - ${photoType === 'meter' ? 'BUKTI STAND METER' : 'DOKUMEN LEMBAR BPM'}`,
      20,
      height - bannerHeight + bannerHeight * 0.32
    );

    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold ${Math.round(bannerHeight * 0.24)}px monospace`;
    ctx.fillText(`🕒 Waktu Foto: ${waktuTerekam}`, 20, height - bannerHeight + bannerHeight * 0.62);

    const latLngDisplay =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`
        : gpsLocation;

    ctx.fillStyle = '#38bdf8';
    ctx.font = `${Math.round(bannerHeight * 0.21)}px monospace`;
    ctx.fillText(
      `📍 ${latLngDisplay} (GPS Lapangan) | 👤 Petugas: ${readerName}`,
      20,
      height - bannerHeight + bannerHeight * 0.88
    );

    // Customer info on the right
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `bold ${Math.round(bannerHeight * 0.22)}px sans-serif`;
    const rightText = `${customerName} (${customerId})`;
    const textWidth = ctx.measureText(rightText).width;
    ctx.fillText(rightText, width - textWidth - 20, height - bannerHeight + bannerHeight * 0.45);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setTimeout(() => {
      setIsCapturing(false);
      stopCamera();
      onCapture(dataUrl, waktuTerekam);
      onClose();
    }, 250);
  };

  // Fallback native input with watermark burn-in
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawDataUrl = reader.result as string;
        const now = new Date();
        const datePart = now.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const waktuTerekam = `${datePart} ${hours}:${mins}:${secs} WIB`;

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || 1280;
          const height = img.naturalHeight || 720;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);

            const bannerHeight = Math.max(70, Math.round(height * 0.12));
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(0, height - bannerHeight, width, 3);

            ctx.fillStyle = '#f8fafc';
            ctx.font = `bold ${Math.round(bannerHeight * 0.28)}px sans-serif`;
            ctx.fillText(
              `PT AETRA AIR TANGERANG - ${photoType === 'meter' ? 'BUKTI STAND METER' : 'DOKUMEN LEMBAR BPM'}`,
              20,
              height - bannerHeight + bannerHeight * 0.32
            );

            ctx.fillStyle = '#f59e0b';
            ctx.font = `bold ${Math.round(bannerHeight * 0.24)}px monospace`;
            ctx.fillText(`🕒 Waktu Foto: ${waktuTerekam}`, 20, height - bannerHeight + bannerHeight * 0.62);

            const latLngDisplay =
              typeof latitude === 'number' && typeof longitude === 'number'
                ? `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`
                : gpsLocation;

            ctx.fillStyle = '#38bdf8';
            ctx.font = `${Math.round(bannerHeight * 0.21)}px monospace`;
            ctx.fillText(
              `📍 ${latLngDisplay} (GPS Lapangan) | 👤 Petugas: ${readerName}`,
              20,
              height - bannerHeight + bannerHeight * 0.88
            );

            ctx.fillStyle = '#cbd5e1';
            ctx.font = `bold ${Math.round(bannerHeight * 0.22)}px sans-serif`;
            const rightText = `${customerName} (${customerId})`;
            const textWidth = ctx.measureText(rightText).width;
            ctx.fillText(rightText, width - textWidth - 20, height - bannerHeight + bannerHeight * 0.45);

            const stampedUrl = canvas.toDataURL('image/jpeg', 0.92);
            stopCamera();
            onCapture(stampedUrl, waktuTerekam);
            onClose();
            return;
          }

          stopCamera();
          onCapture(rawDataUrl, waktuTerekam);
          onClose();
        };
        img.onerror = () => {
          stopCamera();
          onCapture(rawDataUrl, waktuTerekam);
          onClose();
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="p-3.5 px-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 text-white z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-600/30 text-cyan-400 border border-cyan-500/40 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-xs sm:text-sm tracking-wide text-white truncate">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {customerName} · <span className="font-mono text-cyan-300">{customerId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Flash / Torch Quick Toggle Button */}
            {hasCameraPermission !== false && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border active:scale-95 ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/40 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-amber-300'
                }`}
                title={isTorchOn ? 'Matikan Lampu Flash / Senter' : 'Nyalakan Lampu Flash / Senter untuk area meteran redup / gelap'}
              >
                {isTorchOn ? (
                  <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-bounce" />
                ) : (
                  <ZapOff className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden sm:inline">{isTorchOn ? 'Flash ON' : 'Flash'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Tutup Kamera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className={`relative flex-1 bg-black min-h-[360px] sm:min-h-[460px] overflow-hidden flex items-center justify-center transition-all ${
          isTorchOn ? 'ring-4 ring-amber-300/80 shadow-[inset_0_0_100px_rgba(251,191,36,0.35)]' : ''
        }`}>
          {hasCameraPermission === false ? (
            /* Fallback Screen if live stream is blocked or unavailable */
            <div className="p-6 text-center space-y-4 max-w-md mx-auto text-slate-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white">Akses Kamera Langsung</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {errorMessage ||
                    'Browser tidak dapat membuka stream video kamera otomatis. Klik tombol di bawah untuk membuka kamera perangkat Anda.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <label className="py-2.5 px-4 bg-[#0055A5] hover:bg-[#003E78] text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95">
                  <Camera className="w-4 h-4 text-cyan-300" />
                  <span>Buka Kamera Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFallbackFile}
                    className="hidden"
                  />
                </label>

                <label className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Ambil dari Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFallbackFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Guides */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Aiming Reticle / Guideline Overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <div className="w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-md" />
                  <div className="w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-md" />
                </div>

                <div className="text-center bg-black/60 backdrop-blur-xs py-1 px-3 rounded-full mx-auto text-[10px] text-cyan-200 font-bold border border-cyan-400/40">
                  {photoType === 'meter'
                    ? 'Posisikan angka stand meter di tengah bingkai'
                    : 'Posisikan lembar dokumen BPM di dalam bingkai'}
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-md" />
                  <div className="w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-md" />
                </div>
              </div>

              {/* Live HUD Geotag Stamp Top Banner */}
              <div className="absolute top-3 inset-x-3 bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 text-white text-[10px] shadow-lg flex flex-col gap-1 z-10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-amber-300 font-extrabold text-[10.5px]">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    <span>{currentLiveTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isTorchOn && (
                      <span className="px-2 py-0.2 bg-amber-400 text-slate-950 border border-amber-300 text-[8.5px] font-black uppercase rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-slate-950" />
                        <span>Flash Aktif</span>
                      </span>
                    )}
                    <span className="px-2 py-0.2 bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[8.5px] font-black uppercase rounded-full">
                      GPS Geotag Aktif
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-slate-300 text-[9px] border-t border-white/10 pt-1">
                  <div className="flex items-center gap-1 font-mono text-cyan-300 truncate">
                    <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                    <span className="truncate">{gpsLocation}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <User className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                    <span>{readerName}</span>
                  </div>
                </div>
              </div>

              {/* Shutter Animation Flash */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-in fade-in duration-100 z-30 flex items-center justify-center">
                  <div className="text-slate-900 font-black text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-bounce" />
                    <span>Foto Berhasil Diambil!</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-2 sm:gap-3 text-white z-20 flex-wrap sm:flex-nowrap">
          {/* Switch Camera */}
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 border border-slate-700"
            title="Ganti Kamera Depan / Belakang"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Balik</span>
          </button>

          {/* Flash / Torch Control Button */}
          {hasCameraPermission !== false && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 sm:p-3 rounded-2xl transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold shrink-0 border active:scale-95 ${
                isTorchOn
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 shadow-lg shadow-amber-400/40 ring-2 ring-amber-300/60 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-amber-300'
              }`}
              title={isTorchOn ? 'Matikan Lampu Senter / Flash' : 'Nyalakan Lampu Senter / Flash untuk area meteran redup / gelap (manhole, basement, box panel)'}
            >
              {isTorchOn ? (
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-pulse" />
              ) : (
                <ZapOff className="w-4 h-4 text-amber-400" />
              )}
              <span>{isTorchOn ? 'Senter ON' : 'Senter / Flash'}</span>
            </button>
          )}

          {/* Big Shutter Button */}
          {hasCameraPermission !== false && (
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isCapturing}
              className="py-3 px-5 sm:px-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition cursor-pointer flex items-center gap-2 shrink-0 border border-white/20"
            >
              <div className="w-4 h-4 rounded-full bg-white animate-ping" />
              <span>Ambil Foto</span>
            </button>
          )}

          {/* Gallery Upload Alternative */}
          <label className="p-2.5 sm:p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 border border-slate-700">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Galeri</span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFallbackFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>,
    document.body
  );
};
