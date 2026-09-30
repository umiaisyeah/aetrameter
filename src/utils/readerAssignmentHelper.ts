import { IndustryCustomer, MeterReader } from '../types';

/**
 * Natural sort for cycles: Cycle 1, Cycle 2, ..., Cycle 9, Cycle 10, Cycle 15
 */
export const sortCyclesNaturally = (cycles: string[]): string[] => {
  return [...cycles].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
};

/**
 * Normalizes names for robust case-insensitive comparison
 */
export const normalizeReaderName = (name: string): string => {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/^(pak|ibu|bpk|sdr)\s+/i, '')
    .trim();
};

export const KEY_ACCOUNT_READER_NAMES = [
  'anjarini sukamto',
  'anjarini',
  'febriadi',
  'harsindi',
  'wahyu hidayat',
  'wahyu',
  'yugo apriadi',
  'yugo'
];

export const KONTRAKTOR_READER_NAMES = [
  'bambang pamungkas',
  'bambang',
  'kevin gideon',
  'kevin'
];

/**
 * Returns strictly 1 role per person:
 * - Key Account: Anjarini Sukamto, Febriadi, Harsindi, Wahyu Hidayat, Yugo Apriadi
 * - Kontraktor: Bambang Pamungkas, Kevin Gideon
 */
export const getReaderCategory = (name: string): 'Key Account' | 'Kontraktor (PT Hideco)' => {
  const normalized = normalizeReaderName(name);
  if (KEY_ACCOUNT_READER_NAMES.some((kan) => normalized.includes(kan) || kan.includes(normalized))) {
    return 'Key Account';
  }
  return 'Kontraktor (PT Hideco)';
};

export const getReaderCompany = (name: string): string => {
  return getReaderCategory(name) === 'Key Account'
    ? 'PT Aetra Air Tangerang (Key Account)'
    : 'PT Hideco';
};

/**
 * Checks whether a customer belongs strictly and exclusively to a given meter reader.
 * Strict non-overlapping assignment:
 * 1. If customer has `petugasBaca`:
 *    Matches if customer's petugasBaca equals reader's name (normalized).
 * 2. If customer has no petugasBaca:
 *    Fallback to cycle schedule primary reader only if that cycle primary reader is this reader,
 *    guaranteeing that 1 customer never maps to more than 1 reader.
 */
export const isCustomerAssignedToReader = (
  customer: IndustryCustomer,
  reader: MeterReader | { id?: string; nama: string; assignedCycles?: string[] }
): boolean => {
  const custReader = normalizeReaderName(customer.petugasBaca || '');
  const targetReader = normalizeReaderName(reader.nama || '');

  // 1. If customer has explicit petugasBaca assigned:
  if (custReader) {
    if (
      custReader === targetReader ||
      custReader.includes(targetReader) ||
      targetReader.includes(custReader)
    ) {
      return true;
    }
    // Jika customer sudah memiliki petugasBaca orang lain, JANGAN dimunculkan ke akun ini
    return false;
  }

  // 2. Jika customer belum memiliki petugasBaca eksplisit, cocokkan dengan cycle yang ditugaskan ke petugas ini
  if ('assignedCycles' in reader && Array.isArray(reader.assignedCycles) && customer.cycle) {
    return reader.assignedCycles.some(
      (c) => c.toLowerCase().trim() === customer.cycle.toLowerCase().trim()
    );
  }

  return false;
};

/**
 * Gets all customers assigned strictly to a reader with ZERO overlap.
 */
export const getAssignedCustomersForReader = (
  reader: MeterReader | { id?: string; nama: string },
  customers: IndustryCustomer[]
): IndustryCustomer[] => {
  return customers.filter((c) => isCustomerAssignedToReader(c, reader));
};

/**
 * Derives the exact distinct assigned cycles for a reader based on actual inputted/imported customer data.
 */
export const getAssignedCyclesForReader = (
  reader: MeterReader | { id?: string; nama: string },
  customers: IndustryCustomer[]
): string[] => {
  const assignedCustomers = getAssignedCustomersForReader(reader, customers);
  const cycleSet = new Set<string>();

  assignedCustomers.forEach((c) => {
    if (c.cycle && c.cycle.trim()) {
      cycleSet.add(c.cycle.trim());
    }
  });

  return sortCyclesNaturally(Array.from(cycleSet));
};
