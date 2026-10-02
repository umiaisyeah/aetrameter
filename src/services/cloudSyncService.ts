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

/**
 * High-speed single reading sync for immediate propagation across devices
 */
export const pushCustomerReading = async (
  customer: IndustryCustomer,
  auditLog?: AuditLog
): Promise<boolean> => {
  try {
    const res = await fetch('/api/sync-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, auditLog })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('Cloud sync reading notice:', err);
    return false;
  }
};

/**
 * High-speed batch status update (e.g. Invoicing, Verification)
 */
export const pushStatusUpdate = async (
  ids: string[],
  status: string,
  note?: string,
  auditLog?: AuditLog
): Promise<boolean> => {
  try {
    const res = await fetch('/api/sync-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status, note, auditLog })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('Cloud sync status notice:', err);
    return false;
  }
};

/**
 * Subscribe to real-time Server-Sent Events (SSE) for sub-50ms live automatic synchronization
 */
export const subscribeToCloudEvents = (onEvent: (event: any) => void): (() => void) => {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource('/api/sync-stream');

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onEvent(data);
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconnect after 3 seconds if disconnected
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch {}
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};
