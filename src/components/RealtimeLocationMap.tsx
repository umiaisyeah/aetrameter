import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Layers,
  Crosshair,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Compass,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { IndustryCustomer } from '../types';
import { getCustomerCoordinates, formatCoordinateString, calculateDistanceMeters, Coordinates } from '../utils/gpsHelper';
import { showToast } from '../utils/notificationSystem';

// Fix Leaflet's default icon paths in bundled SPA
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

interface RealtimeLocationMapProps {
  customer: IndustryCustomer;
  height?: string;
  showLiveReaderPosition?: boolean;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  customCoords?: { lat: number; lng: number };
  liveReaderCoords?: { lat: number; lng: number };
  interactive?: boolean;
}

export const RealtimeLocationMap: React.FC<RealtimeLocationMapProps> = ({
  customer,
  height = 'h-72',
  showLiveReaderPosition = true,
  onCoordinatesChange,
  className = '',
  customCoords,
  liveReaderCoords,
  interactive = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [distanceToMeter, setDistanceToMeter] = useState<number | null>(null);

  // Compute active target coordinates: prioritize customCoords, then customer.latitude, then helper fallback
  const fallbackCoords = getCustomerCoordinates(customer);
  const targetLat =
    customCoords && typeof customCoords.lat === 'number' && !isNaN(customCoords.lat)
      ? customCoords.lat
      : typeof customer.latitude === 'number' && !isNaN(customer.latitude)
      ? customer.latitude
      : fallbackCoords.lat;

  const targetLng =
    customCoords && typeof customCoords.lng === 'number' && !isNaN(customCoords.lng)
      ? customCoords.lng
      : typeof customer.longitude === 'number' && !isNaN(customer.longitude)
      ? customer.longitude
      : fallbackCoords.lng;

  const customerCoords = {
    lat: targetLat,
    lng: targetLng,
    accuracy: customer.gpsAkurasiMeter || 3.5,
    altitude: customer.altitudeMeter || 26.0,
    source: fallbackCoords.source
  };

  // Sync live reader coordinates from prop if provided
  useEffect(() => {
    if (
      liveReaderCoords &&
      typeof liveReaderCoords.lat === 'number' &&
      typeof liveReaderCoords.lng === 'number' &&
      !isNaN(liveReaderCoords.lat) &&
      !isNaN(liveReaderCoords.lng)
    ) {
      setUserLocation({
        lat: liveReaderCoords.lat,
        lng: liveReaderCoords.lng,
        accuracy: 3.5,
        source: 'device_gps'
      });
      const dist = calculateDistanceMeters(
        liveReaderCoords.lat,
        liveReaderCoords.lng,
        customerCoords.lat,
        customerCoords.lng
      );
      setDistanceToMeter(dist);
    }
  }, [liveReaderCoords?.lat, liveReaderCoords?.lng, customerCoords.lat, customerCoords.lng]);

  // Meter Reading Location Custom Icon
  const createCustomIcon = (type: 'meter' | 'bpm' | 'user') => {
    let bgColor = '#0055A5';
    let label = 'MTR';
    let ringColor = '#00A3E0';

    if (type === 'bpm') {
      bgColor = '#E86216';
      label = 'BPM';
      ringColor = '#FFA000';
    } else if (type === 'user') {
      bgColor = '#10B981';
      label = 'YOU';
      ringColor = '#34D399';
    }

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: ${ringColor}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, ${ringColor}, ${bgColor}); border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 9px; font-family: sans-serif; letter-spacing: -0.5px;">
            ${label}
          </div>
          <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid ${bgColor};"></div>
        </div>
      `,
      iconSize: [28, 34],
      iconAnchor: [14, 34],
      popupAnchor: [0, -32]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [customerCoords.lat, customerCoords.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      // Layer 1: OpenStreetMap Standard
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });

      // Layer 2: Esri World Imagery (Satellite)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );

      if (mapType === 'streets') {
        osmLayer.addTo(map);
      } else {
        satelliteLayer.addTo(map);
      }

      // Add custom zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layers when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapType === 'streets') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
    }
  }, [mapType]);

  // Update Markers & Radius on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Meter Physical Location Marker (Draggable when interactive or onCoordinatesChange provided)
    const isDraggable = Boolean(interactive || onCoordinatesChange);
    const meterMarker = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: createCustomIcon('meter'),
      draggable: isDraggable
    });

    if (isDraggable) {
      meterMarker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        const lat = Number(pos.lat.toFixed(6));
        const lng = Number(pos.lng.toFixed(6));
        onCoordinatesChange?.({ lat, lng });
        showToast({
          title: 'Titik Meter Disesuaikan 📍',
          message: `Koordinat diperbarui ke: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          type: 'info'
        });
      });
    }

    const meterPopupContent = `
      <div style="font-family: sans-serif; padding: 2px; min-width: 190px;">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
          <span style="background: #0055A5; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">TITIK STAND METER</span>
          <span style="font-size: 10px; font-weight: 700; color: #475569;">${customer.id}</span>
        </div>
        <div style="font-weight: 800; font-size: 12px; color: #0f172a; line-height: 1.2; margin-bottom: 4px;">${customer.nama}</div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">${customer.lokasi || 'Kawasan Industri Tangerang'}</div>
        <div style="background: #F1F5F9; padding: 6px; border-radius: 6px; font-size: 10px; font-family: monospace;">
          <div><strong>Lat:</strong> ${customerCoords.lat.toFixed(6)}</div>
          <div><strong>Long:</strong> ${customerCoords.lng.toFixed(6)}</div>
          <div><strong>Akurasi GPS:</strong> ±${customerCoords.accuracy || 3.5} m</div>
        </div>
        ${isDraggable ? '<div style="margin-top: 4px; font-size: 9px; color: #0055A5; font-weight: bold;">💡 Tip: Anda dapat menggeser pin ini atau klik peta untuk menyesuaikan titik riil di lapangan.</div>' : ''}
      </div>
    `;

    meterMarker.bindPopup(meterPopupContent);
    markersGroup.addLayer(meterMarker);

    // Click on map to place pin
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDraggable) return;
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      onCoordinatesChange?.({ lat, lng });
      showToast({
        title: 'Titik Meter Dipindahkan 📍',
        message: `Koordinat diubah ke: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        type: 'info'
      });
    };

    if (isDraggable) {
      map.on('click', handleMapClick);
    }

    // Accuracy Circle
    const accuracyCircle = L.circle([customerCoords.lat, customerCoords.lng], {
      radius: (customerCoords.accuracy || 4) * 2,
      color: '#0055A5',
      fillColor: '#00A3E0',
      fillOpacity: 0.15,
      weight: 1.5,
      dashArray: '3, 4'
    });
    markersGroup.addLayer(accuracyCircle);

    // 2. Dokumen BPM Marker (slightly offset if distinct coords exist)
    const bpmLat = customer.bpmLatitude || customerCoords.lat + 0.00012;
    const bpmLng = customer.bpmLongitude || customerCoords.lng + 0.00015;

    if (customer.status !== 'Belum Dibaca') {
      const bpmMarker = L.marker([bpmLat, bpmLng], {
        icon: createCustomIcon('bpm')
      });

      const bpmPopupContent = `
        <div style="font-family: sans-serif; padding: 2px; min-width: 180px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="background: #E86216; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">DOKUMEN BPM FISIK</span>
          </div>
          <div style="font-weight: 800; font-size: 11px; color: #0f172a; margin-bottom: 4px;">Tanda Tangan Lapangan</div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">Petugas: ${customer.petugasBaca || 'Petugas'}</div>
          <div style="background: #FFF7ED; border: 1px solid #FFEDD5; padding: 6px; border-radius: 6px; font-size: 10px; font-family: monospace;">
            <div><strong>Lat:</strong> ${bpmLat.toFixed(6)}</div>
            <div><strong>Long:</strong> ${bpmLng.toFixed(6)}</div>
            <div><strong>Waktu:</strong> ${customer.bpmWaktuFoto || customer.waktuBaca || '30 Sep 2026'}</div>
          </div>
        </div>
      `;

      bpmMarker.bindPopup(bpmPopupContent);
      markersGroup.addLayer(bpmMarker);
    }

    // 3. Live User GPS position (if fetched or provided)
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: createCustomIcon('user')
      });

      userMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <strong style="color: #059669; font-size: 11px;">📍 Posisi Anda Saat Ini (Live GPS)</strong>
          <div style="font-size: 10px; font-family: monospace; margin-top: 4px;">
            Lat: ${userLocation.lat.toFixed(6)}<br/>
            Long: ${userLocation.lng.toFixed(6)}
          </div>
          ${isDraggable ? '<div style="margin-top: 4px; font-size: 9px; color: #059669;">Gunakan tombol "Kunci ke GPS Saya" untuk menyamakan titik meter ke sini.</div>' : ''}
        </div>
      `);
      markersGroup.addLayer(userMarker);

      // Connecting polyline from user to meter site
      const polyline = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [customerCoords.lat, customerCoords.lng]
        ],
        {
          color: '#10B981',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.8
        }
      );
      markersGroup.addLayer(polyline);

      // Fit bounds to show both user and meter if separated
      const dist = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        customerCoords.lat,
        customerCoords.lng
      );
      if (dist > 15) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [customerCoords.lat, customerCoords.lng]
        ]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      } else {
        map.setView([customerCoords.lat, customerCoords.lng], 17);
      }
    } else {
      map.setView([customerCoords.lat, customerCoords.lng], 16);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (isDraggable) {
        map.off('click', handleMapClick);
      }
    };
  }, [customer, customerCoords.lat, customerCoords.lng, userLocation, interactive, onCoordinatesChange]);

  // Handle live device location trigger
  const handleFetchCurrentDeviceLocation = (applyToMeter = false) => {
    if (!navigator.geolocation) {
      showToast({
        title: 'GPS Tidak Didukung',
        message: 'Browser/perangkat Anda tidak mendukung deteksi lokasi otomatis.',
        type: 'warning'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const dist = calculateDistanceMeters(lat, lng, customerCoords.lat, customerCoords.lng);

        setUserLocation({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude || undefined,
          source: 'device_gps'
        });
        setDistanceToMeter(applyToMeter ? 0 : dist);
        setIsLocating(false);

        if (applyToMeter) {
          onCoordinatesChange?.({ lat, lng });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 17);
          }
          showToast({
            title: 'Titik Meter Terkunci ke GPS Anda! 🛰️',
            message: `Koordinat meter disesuaikan dengan posisi riil Anda: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            type: 'success'
          });
        } else {
          showToast({
            title: 'Lokasi Real-Time Terkunci! 🛰️',
            message: `Koordinat Anda: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Jarak ke meteran: ${dist} m)`,
            type: 'success'
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        showToast({
          title: 'Gagal Mengakses GPS',
          message: 'Pastikan izin akses lokasi/GPS telah diaktifkan di peramban Anda.',
          type: 'warning'
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Copy coordinates string
  const handleCopyCoords = () => {
    const text = `${customerCoords.lat.toFixed(6)}, ${customerCoords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast({
      title: 'Koordinat Disalin! 📋',
      message: `${text} berhasil disalin ke papan klip.`,
      type: 'success'
    });
    setTimeout(() => setCopied(false), 2500);
  };

  // Recenter to meter location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([customerCoords.lat, customerCoords.lng], 17);
      mapInstanceRef.current.invalidateSize();
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col relative transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      } ${className}`}
    >
      {/* Map Control Toolbar Header */}
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 dark:text-white">
                Peta Realtime Lokasi Fisik Meter &amp; BPM
              </span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>GPS Live</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {formatCoordinateString(customerCoords.lat, customerCoords.lng)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Layer switch */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-700 p-0.5 rounded-xl text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMapType('streets')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                mapType === 'streets'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Jalan
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Satelit
            </button>
          </div>

          {/* Lock Meter Pin directly to reader GPS */}
          {(interactive || onCoordinatesChange) && (
            <button
              type="button"
              onClick={() => handleFetchCurrentDeviceLocation(true)}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Kunci titik meter tepat pada posisi GPS lapangan Anda saat ini"
            >
              <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Kunci Pin ke GPS Saya</span>
            </button>
          )}

          {/* Real-time locate reader marker */}
          {showLiveReaderPosition && !interactive && !onCoordinatesChange && (
            <button
              type="button"
              onClick={() => handleFetchCurrentDeviceLocation(false)}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Tampilkan Posisi Anda Saat Ini (Live GPS Pin)"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Lokasi Saya</span>
            </button>
          )}

          {/* Direct Google Maps Navigation Link */}
          <a
            href={`https://www.google.com/maps?q=${customerCoords.lat},${customerCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-blue-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-600 transition cursor-pointer shadow-2xs flex items-center gap-1 text-[10px] font-bold"
            title="Buka titik koordinat asli ini di Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Maps</span>
          </a>

          {/* Copy Coordinates */}
          <button
            type="button"
            onClick={handleCopyCoords}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition cursor-pointer shadow-2xs"
            title="Salin Koordinat Latitude & Longitude"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition cursor-pointer shadow-2xs"
            title="Pusatkan Ulang ke Titik Meteran"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 250);
            }}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className={`w-full relative ${isFullscreen ? 'flex-1' : height}`}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Realtime Telemetry HUD Overlay */}
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-md text-[10px] space-y-1 max-w-[260px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-bold">Latitude:</span>
            <span className="font-mono font-extrabold text-[#0055A5] dark:text-cyan-400">
              {customerCoords.lat.toFixed(6)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-bold">Longitude:</span>
            <span className="font-mono font-extrabold text-[#0055A5] dark:text-cyan-400">
              {customerCoords.lng.toFixed(6)}
            </span>
          </div>
          {distanceToMeter !== null && (
            <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold">
              <span>Jarak ke Meteran:</span>
              <span className="font-mono bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                {distanceToMeter > 1000 ? `${(distanceToMeter / 1000).toFixed(2)} km` : `${distanceToMeter} m`}
              </span>
            </div>
          )}
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-md flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00A3E0]" />
            <span>Titik Stand Meter</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#E86216]" />
            <span>Dokumen BPM</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Posisi Anda</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
