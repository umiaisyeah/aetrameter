import { CycleSchedule } from '../types';
import { MONTH_NAMES_ID, MONTH_CODES } from './excelDateHelper';

export const INDONESIAN_DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export interface PlottedCycleInfo {
  cycleName: string;
  cycleNum: number;
  monthName: string;
  monthCode: string;
  monthIndex: number;
  year: number;
  daysInMonth: number;
  originalHariH: number;
  currentHariH: number;
  hasShift: boolean;
  selisih: number;
  formattedOriginalDate: string; // YYYY-MM-DD
  formattedCurrentDate: string;  // YYYY-MM-DD
  origDayName: string;
  currDayName: string;
  isSundayOriginal: boolean;
  isSundayCurrent: boolean;
  alasanPergeseran?: string;
  keteranganPergeseran?: string;
  shiftedCustomerIds?: string[];
  fullDisplayOriginal: string; // e.g. "Kamis, 08 Oktober 2026"
  fullDisplayCurrent: string;  // e.g. "Jumat, 09 Oktober 2026"
}

/**
 * Mendapatkan jadwal Hari H plotting resmi kalender untuk suatu cycle pada bulan tertentu.
 * Menghitung hari kerja kalender matriks resmi (Senin-Jumat dimulai dari tanggal 6).
 */
export function getPlottedCycleSchedule(
  cycleName: string,
  monthNameOrCode: string,
  cycleSchedules: CycleSchedule[] = [],
  customYear: number = 2026
): PlottedCycleInfo {
  // 1. Ekstrak cycle number (1..15)
  const cycleMatch = cycleName.match(/\d+/);
  const cycleNum = cycleMatch ? Math.max(1, Math.min(15, parseInt(cycleMatch[0], 10))) : 1;
  const cycleIdx = cycleNum - 1; // 0-indexed

  // 2. Ekstrak tahun jika terdapat di string (contoh: "Oktober 2026")
  let year = customYear;
  const yearMatch = monthNameOrCode.match(/\b(202\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // 3. Ekstrak bulan index (0..11)
  let monthIndex = 9; // Default: Oktober (bulan index 9)
  const cleanMonthStr = monthNameOrCode.toLowerCase();
  const nameIdx = MONTH_NAMES_ID.findIndex((m) => cleanMonthStr.includes(m.toLowerCase()));
  if (nameIdx !== -1) {
    monthIndex = nameIdx;
  } else {
    const codeIdx = MONTH_CODES.findIndex((c) => cleanMonthStr.includes(c.toLowerCase()));
    if (codeIdx !== -1) {
      monthIndex = codeIdx;
    }
  }

  const monthName = MONTH_NAMES_ID[monthIndex];
  const monthCode = MONTH_CODES[monthIndex];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // 4. Hitung Hari H default plotting kalender matriks (hari kerja operasional dari tanggal 6)
  const workingDaysFrom6: number[] = [];
  for (let d = 6; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDaysFrom6.push(d);
    }
  }

  let defaultPlottedDay: number;
  if (workingDaysFrom6.length >= 15) {
    defaultPlottedDay = workingDaysFrom6[cycleIdx] || (6 + cycleIdx);
  } else {
    // Fallback jika hari kerja < 15: mulai tgl 6, lompat hari Minggu
    let cur = 6;
    for (let step = 0; step < cycleIdx; step++) {
      cur++;
      const dCheck = new Date(year, monthIndex, cur);
      if (dCheck.getDay() === 0) cur++;
    }
    defaultPlottedDay = Math.min(daysInMonth, cur);
  }

  // 5. Cek apakah ada jadwal yang tersimpan di cycleSchedules
  const found = cycleSchedules.find(
    (s) =>
      s.cycle.toLowerCase() === `cycle ${cycleNum}` &&
      (!s.bulan ||
        s.bulan?.toLowerCase().includes(monthName.toLowerCase()) ||
        s.bulan?.toLowerCase().includes(monthCode.toLowerCase()))
  );

  const hasShift = !!(found && found.adaPergeseran);
  const originalHariH = found?.hariHOriginal || (hasShift ? (found?.hariHOriginal || defaultPlottedDay) : (found?.hariH || defaultPlottedDay));
  const currentHariH = found?.hariH || defaultPlottedDay;
  const selisih = hasShift
    ? (found?.selisihHariPergeseran ?? (currentHariH - originalHariH))
    : (currentHariH - originalHariH);

  // 6. Format tanggal YYYY-MM-DD untuk input HTML type="date"
  const formattedOriginalDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
    originalHariH
  ).padStart(2, '0')}`;
  const formattedCurrentDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
    currentHariH
  ).padStart(2, '0')}`;

  const origDateObj = new Date(year, monthIndex, originalHariH);
  const currDateObj = new Date(year, monthIndex, currentHariH);

  const origDayName = INDONESIAN_DAY_NAMES[origDateObj.getDay()];
  const currDayName = INDONESIAN_DAY_NAMES[currDateObj.getDay()];

  return {
    cycleName: `Cycle ${cycleNum}`,
    cycleNum,
    monthName,
    monthCode,
    monthIndex,
    year,
    daysInMonth,
    originalHariH,
    currentHariH,
    hasShift,
    selisih,
    formattedOriginalDate,
    formattedCurrentDate,
    origDayName,
    currDayName,
    isSundayOriginal: origDateObj.getDay() === 0,
    isSundayCurrent: currDateObj.getDay() === 0,
    alasanPergeseran: found?.alasanPergeseran,
    keteranganPergeseran: found?.keteranganPergeseran,
    shiftedCustomerIds: found?.shiftedCustomerIds,
    fullDisplayOriginal: `${origDayName}, ${String(originalHariH).padStart(2, '0')} ${monthName} ${year}`,
    fullDisplayCurrent: `${currDayName}, ${String(currentHariH).padStart(2, '0')} ${monthName} ${year}`
  };
}

/**
 * Format tanggal dari string YYYY-MM-DD ke teks bahasa Indonesia
 */
export function formatIndonesianDateFromISO(isoDateStr: string): {
  day: number;
  monthIndex: number;
  year: number;
  monthName: string;
  dayName: string;
  fullDisplay: string;
  isSunday: boolean;
} | null {
  if (!isoDateStr) return null;
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const monthIndex = month - 1;
  const dObj = new Date(year, monthIndex, day);
  const dayName = INDONESIAN_DAY_NAMES[dObj.getDay()];
  const monthName = MONTH_NAMES_ID[monthIndex] || '';

  return {
    day,
    monthIndex,
    year,
    monthName,
    dayName,
    fullDisplay: `${dayName}, ${String(day).padStart(2, '0')} ${monthName} ${year}`,
    isSunday: dObj.getDay() === 0
  };
}
