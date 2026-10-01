import { IndustryCustomer } from '../types';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: string;
  source?: 'device_gps' | 'customer_master' | 'geocoded';
}

/**
 * Base Tangerang Industrial Zone coordinates
 */
const TANGERANG_INDUSTRIAL_BASE = {
  lat: -6.187214,
  lng: 106.541290
};

// Known industrial cluster centers in Tangerang Regency & City
const INDUSTRIAL_ZONES: Record<string, { lat: number; lng: number }> = {
  'cikupa': { lat: -6.223450, lng: 106.524310 },
  'pasar kemis': { lat: -6.168920, lng: 106.567840 },
  'balaraja': { lat: -6.195610, lng: 106.452390 },
  'jatiuwung': { lat: -6.198760, lng: 106.589120 },
  'curug': { lat: -6.265430, lng: 106.554210 },
  'batuceper': { lat: -6.154320, lng: 106.665430 },
  'tigaraksa': { lat: -6.278910, lng: 106.489120 },
  'cisauk': { lat: -6.345670, lng: 106.634560 },
  'manis': { lat: -6.204510, lng: 106.578920 },
  'millenium': { lat: -6.289120, lng: 106.467810 }
};

/**
 * Extract or generate realistic coordinates for a customer
 */
export function getCustomerCoordinates(customer: IndustryCustomer): Coordinates {
  // 1. Check explicit latitude & longitude
  if (typeof customer.latitude === 'number' && typeof customer.longitude === 'number' && !isNaN(customer.latitude) && !isNaN(customer.longitude)) {
    return {
      lat: customer.latitude,
      lng: customer.longitude,
      accuracy: customer.gpsAkurasiMeter || 4.2,
      altitude: customer.altitudeMeter || 28.5,
      timestamp: customer.waktuBaca || '30 Sep 2026',
      source: 'device_gps'
    };
  }

  // 2. Parse from lokasiGps string ("Lat: -6.187214, Long: 106.541290" or "-6.187214, 106.541290")
  if (customer.lokasiGps) {
    const latMatch = customer.lokasiGps.match(/Lat:\s*([-\d.]+)/i) || customer.lokasiGps.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
    const lngMatch = customer.lokasiGps.match(/Long:\s*([-\d.]+)/i) || (latMatch && latMatch[2] ? [null, latMatch[2]] : null);

    if (latMatch && lngMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return {
          lat,
          lng,
          accuracy: customer.gpsAkurasiMeter || 5.0,
          altitude: customer.altitudeMeter || 30.0,
          timestamp: customer.waktuBaca || '30 Sep 2026',
          source: 'device_gps'
        };
      }
    }
  }

  // 3. Fallback: derive deterministically from customer ID & location name
  const locLower = (customer.lokasi || '').toLowerCase();
  let base = TANGERANG_INDUSTRIAL_BASE;

  for (const [zoneKey, zoneCoords] of Object.entries(INDUSTRIAL_ZONES)) {
    if (locLower.includes(zoneKey) || customer.nama.toLowerCase().includes(zoneKey)) {
      base = zoneCoords;
      break;
    }
  }

  // Generate deterministic jitter based on customer ID hash
  let hash = 0;
  const str = customer.id + customer.nama;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = ((Math.abs(hash) % 1000) - 500) / 40000;
  const lngOffset = ((Math.abs(hash >> 3) % 1000) - 500) / 40000;

  return {
    lat: Number((base.lat + latOffset).toFixed(6)),
    lng: Number((base.lng + lngOffset).toFixed(6)),
    accuracy: 3.8,
    altitude: 24.0 + (Math.abs(hash) % 15),
    timestamp: customer.waktuBaca || '30 Sep 2026 10:15:00 WIB',
    source: 'customer_master'
  };
}

/**
 * Format decimal coordinates to user-friendly DMS string
 */
export function formatCoordinateString(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

/**
 * Calculate distance in meters between two points using Haversine formula
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
