import { IndustryCustomer, MeterReader, CycleSchedule, AuditLog } from '../types';

export interface CloudState {
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  auditLogs: AuditLog[];
  updatedAt?: string;
}

export const fetchCloudState = async (): Promise<CloudState | null> => {
  try {
    const res = await fetch('/api/sync-state');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('Cloud sync fetch notice:', err);
  }
  return null;
};

export const pushCloudState = async (state: Partial<CloudState>): Promise<boolean> => {
  try {
    const res = await fetch('/api/sync-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('Cloud sync push notice:', err);
    return false;
  }
};
