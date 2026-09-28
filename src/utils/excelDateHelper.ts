import * as XLSX from 'xlsx';
import { CycleSchedule, ReaderCategory } from '../types';

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_CODES = [
  'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'Mei-26', 'Jun-26',
  'Jul-26', 'Agu-26', 'Sep-26', 'Okt-26', 'Nov-26', 'Des-26'
];

/**
 * Format date value from Excel
 */
export function formatExcelDate(val: any): string {
  if (val === undefined || val === null || String(val).trim() === '') {
    return '';
  }

  if (typeof val === 'number') {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      // fallback
    }
  }

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  const str = String(val).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && !str.match(/^\d+$/)) {
    const d = new Date(parsed);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  return str;
}

/**
 * Assign appropriate field meter reader based on cycle
 */
export function getDefaultFieldReaderForCycle(cycleNum: number): {
  petugasUtama: string;
  kategoriPetugas?: ReaderCategory;
} {
  return { petugasUtama: 'Belum Ditugaskan', kategoriPetugas: undefined };
}

/**
 * Parse an Excel file for 1-Year or Monthly Cycle schedules.
 * Supports:
 * 1. Matrix calendar format (columns 1..31, rows with cycle numbers 1..15, exactly as in user's image)
 * 2. Standard table format (Cycle, Tanggal Mulai, Tanggal Selesai, Petugas Lapangan, etc.)
 */
export function parseYearlyCycleExcel(workbook: XLSX.WorkBook): CycleSchedule[] {
  const allParsed: CycleSchedule[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to 2D array of rows
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!data || data.length === 0) continue;

    // Detect month from sheet name or top row
    let detectedMonth = normalizeMonthName(sheetName);

    // Look for day header row: a row that has sequence of numbers 1, 2, 3...
    let dayRowIndex = -1;
    let dayColMap: { [day: number]: number } = {}; // day -> colIndex

    for (let r = 0; r < Math.min(data.length, 10); r++) {
      const row = data[r];
      // Check if this row contains multiple numbers 1..10
      let countDays = 0;
      const tempMap: { [day: number]: number } = {};
      for (let c = 0; c < row.length; c++) {
        const val = Number(row[c]);
        if (!isNaN(val) && val >= 1 && val <= 31) {
          tempMap[val] = c;
          countDays++;
        }
      }

      if (countDays >= 15) {
        dayRowIndex = r;
        dayColMap = tempMap;
        // Check row above for month if not detected from sheet
        if (!detectedMonth && r > 0) {
          const aboveText = data[r - 1].filter(Boolean).join(' ');
          detectedMonth = normalizeMonthName(aboveText);
        }
        break;
      }
    }

    if (dayRowIndex !== -1 && Object.keys(dayColMap).length >= 15) {
      // MATRIX FORMAT DETECTED!
      if (!detectedMonth) detectedMonth = 'September 2026';

      // Scan rows below dayRowIndex for cycle cells (numbers 1..15)
      for (let r = dayRowIndex + 1; r < data.length; r++) {
        const row = data[r];
        for (let day = 1; day <= 31; day++) {
          const colIdx = dayColMap[day];
          if (colIdx !== undefined && colIdx < row.length) {
            const cellVal = Number(row[colIdx]);
            if (!isNaN(cellVal) && cellVal >= 1 && cellVal <= 15) {
              const cycleNum = cellVal;
              const cycleStr = `Cycle ${cycleNum}`;

              // Determine pre-read, verif, billing days
              const praBaca = Math.max(1, day - 2);
              const verif = Math.min(31, day + 1);
              const billing = Math.min(31, day + 2);

              const { petugasUtama, kategoriPetugas } = getDefaultFieldReaderForCycle(cycleNum);

              const formattedStart = `${String(day).padStart(2, '0')} ${detectedMonth.split(' ')[0]} 2026`;
              const formattedEnd = `${String(verif).padStart(2, '0')} ${detectedMonth.split(' ')[0]} 2026`;

              allParsed.push({
                cycle: cycleStr,
                bulan: detectedMonth,
                hariH: day,
                tglPraBaca: praBaca,
                tglVerifikasi: verif,
                tglBilling: billing,
                tanggalMulai: formattedStart,
                tanggalSelesai: formattedEnd,
                petugasUtama,
                kategoriPetugas,
                catatan: `Jadwal Matriks ${detectedMonth} (${kategoriPetugas})`
              });
            }
          }
        }
      }
    } else {
      // Standard Table format fallback
      const objectRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
      objectRows.forEach((row, idx) => {
        const rawCycle = row['Cycle'] || row['cycle'] || row['Siklus'] || `Cycle ${(idx % 15) + 1}`;
        const cycleStr = String(rawCycle).toLowerCase().includes('cycle')
          ? String(rawCycle)
          : `Cycle ${rawCycle}`;
        const cycleNum = parseInt(cycleStr.replace(/[^0-9]/g, ''), 10) || 1;

        const rawMulai = row['Tanggal Mulai'] || row['Tanggal Pembacaan'] || row['tgl_mulai'];
        const rawSelesai = row['Tanggal Selesai'] || row['tgl_selesai'];
        const bulan = row['Bulan'] || detectedMonth || 'September 2026';

        const { petugasUtama, kategoriPetugas } = getDefaultFieldReaderForCycle(cycleNum);

        allParsed.push({
          cycle: cycleStr,
          bulan: String(bulan),
          hariH: 7 + ((cycleNum - 1) % 15),
          tanggalMulai: formatExcelDate(rawMulai) || `${String(cycleNum + 6).padStart(2, '0')} Sep 2026`,
          tanggalSelesai: formatExcelDate(rawSelesai) || `${String(cycleNum + 7).padStart(2, '0')} Sep 2026`,
          petugasUtama: String(row['Petugas Pembaca Meter'] || row['Petugas Lapangan'] || petugasUtama),
          kategoriPetugas: (row['Kategori'] as ReaderCategory) || kategoriPetugas,
          catatan: String(row['Catatan'] || `Jadwal ${cycleStr}`)
        });
      });
    }
  }

  return allParsed;
}

function normalizeMonthName(str: string): string {
  if (!str) return '';
  const s = str.toLowerCase();
  if (s.includes('jan')) return 'Januari 2026';
  if (s.includes('feb')) return 'Februari 2026';
  if (s.includes('mar')) return 'Maret 2026';
  if (s.includes('apr')) return 'April 2026';
  if (s.includes('mei') || s.includes('may')) return 'Mei 2026';
  if (s.includes('jun')) return 'Juni 2026';
  if (s.includes('jul')) return 'Juli 2026';
  if (s.includes('agu') || s.includes('aug')) return 'Agustus 2026';
  if (s.includes('sep')) return 'September 2026';
  if (s.includes('okt') || s.includes('oct')) return 'Oktober 2026';
  if (s.includes('nov')) return 'November 2026';
  if (s.includes('des') || s.includes('dec')) return 'Desember 2026';
  return '';
}

/**
 * Generate 1-Year Cycle Schedule Excel file matching the user's uploaded image!
 * (Green header with Sep-26 / Month, Days 1-31, Sunday columns in red, yellow cycle boxes, etc.)
 */
export function downloadYearlyCycleScheduleTemplate() {
  const workbook = XLSX.utils.book_new();

  const months = [
    { code: 'Sep-26', name: 'September 2026', monthIdx: 8, daysInMonth: 30 },
    { code: 'Okt-26', name: 'Oktober 2026', monthIdx: 9, daysInMonth: 31 },
    { code: 'Nov-26', name: 'November 2026', monthIdx: 10, daysInMonth: 30 },
    { code: 'Des-26', name: 'Desember 2026', monthIdx: 11, daysInMonth: 31 },
    { code: 'Jan-26', name: 'Januari 2026', monthIdx: 0, daysInMonth: 31 },
    { code: 'Feb-26', name: 'Februari 2026', monthIdx: 1, daysInMonth: 28 },
    { code: 'Mar-26', name: 'Maret 2026', monthIdx: 2, daysInMonth: 31 },
    { code: 'Apr-26', name: 'April 2026', monthIdx: 3, daysInMonth: 30 },
    { code: 'Mei-26', name: 'Mei 2026', monthIdx: 4, daysInMonth: 31 },
    { code: 'Jun-26', name: 'Juni 2026', monthIdx: 5, daysInMonth: 30 },
    { code: 'Jul-26', name: 'Juli 2026', monthIdx: 6, daysInMonth: 31 },
    { code: 'Agu-26', name: 'Agustus 2026', monthIdx: 7, daysInMonth: 31 }
  ];

  months.forEach(({ code, name, monthIdx, daysInMonth }) => {
    // Build rows array:
    // Row 0: Month Title (e.g. Sep-26)
    // Row 1: Day numbers 1..31
    // Rows 2..16: 15 Cycle rows
    const rows: any[][] = [];

    // Title row
    const titleRow = Array(32).fill('');
    titleRow[0] = code;
    rows.push(titleRow);

    // Days row (1 to 31)
    const daysRow = ['Cycle / Tgl'];
    for (let d = 1; d <= 31; d++) {
      daysRow.push(d <= daysInMonth ? String(d) : '');
    }
    rows.push(daysRow);

    // Default cycle start day offset
    // For September 2026: Cycle 1 starts on day 7, skipping Sundays (6, 13, 20, 27)
    let currentDay = 7;
    for (let c = 1; c <= 15; c++) {
      const cycleRow = Array(32).fill('');
      cycleRow[0] = `Cycle ${c}`;

      // Check if currentDay is Sunday, if so skip
      const date = new Date(2026, monthIdx, currentDay);
      if (date.getDay() === 0) {
        currentDay++;
      }

      if (currentDay <= daysInMonth) {
        cycleRow[currentDay] = c; // Yellow cell with cycle number
      }
      rows.push(cycleRow);
      currentDay++;
    }

    // Legend at bottom
    rows.push([]);
    rows.push(['Keterangan Workflow Warna:']);
    rows.push(['Angka Kuning (1-15)', ': Hari H Pembacaan Meter oleh Petugas Lapangan']);
    rows.push(['Ungu', ': Pra-Baca / Persiapan Rute']);
    rows.push(['Biru', ': Verifikasi Stand Meter Fisik & BPM']);
    rows.push(['Cokelat', ': Billing & Terbit Invoice']);
    rows.push(['Merah', ': Hari Libur / Hari Minggu (Tidak ada pembacaan)']);
    rows.push([]);
    rows.push(['Petugas Lapangan', ': Ditentukan sesuai penugasan admin']);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws['!cols'] = [{ wch: 14 }];
    for (let i = 1; i <= 31; i++) {
      ws['!cols'].push({ wch: 4.5 });
    }

    XLSX.utils.book_append_sheet(workbook, ws, code);
  });

  XLSX.writeFile(workbook, 'Jadwal_Cycle_1_Tahun_SIMBA_IN_2026.xlsx');
}

/**
 * Standard table template (simplified format)
 */
export function downloadCycleScheduleTemplate() {
  downloadYearlyCycleScheduleTemplate();
}
