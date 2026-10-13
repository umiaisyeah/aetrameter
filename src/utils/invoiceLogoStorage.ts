import { useState, useEffect, useCallback } from 'react';

export interface InvoiceLogoConfig {
  kabTangerangLogoUrl: string | null; // Data URL or image URL. null = use authentic default asset
  kabTangerangSize: number; // in pixels (default: 52)
  showKabTangerangText: boolean; // whether to show PEMERINTAH KABUPATEN TANGERANG text
  aetraLogoUrl: string | null; // Data URL or image URL. null = use authentic default asset
  aetraHeight: number; // in pixels (default: 46)
}

export const DEFAULT_INVOICE_LOGO_CONFIG: InvoiceLogoConfig = {
  kabTangerangLogoUrl: null,
  kabTangerangSize: 52,
  showKabTangerangText: true,
  aetraLogoUrl: null,
  aetraHeight: 46,
};

const STORAGE_KEY = 'aetra_invoice_logo_config_v1';
const CHANGE_EVENT = 'aetra-invoice-logo-changed';

export function getInvoiceLogoConfig(): InvoiceLogoConfig {
  if (typeof window === 'undefined') return DEFAULT_INVOICE_LOGO_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_LOGO_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      kabTangerangLogoUrl: parsed.kabTangerangLogoUrl ?? null,
      kabTangerangSize: typeof parsed.kabTangerangSize === 'number' ? parsed.kabTangerangSize : 52,
      showKabTangerangText: typeof parsed.showKabTangerangText === 'boolean' ? parsed.showKabTangerangText : true,
      aetraLogoUrl: parsed.aetraLogoUrl ?? null,
      aetraHeight: typeof parsed.aetraHeight === 'number' ? parsed.aetraHeight : 46,
    };
  } catch (e) {
    console.error('Failed to parse invoice logo config from localStorage:', e);
    return DEFAULT_INVOICE_LOGO_CONFIG;
  }
}

export function saveInvoiceLogoConfig(updates: Partial<InvoiceLogoConfig>): InvoiceLogoConfig {
  if (typeof window === 'undefined') return DEFAULT_INVOICE_LOGO_CONFIG;
  try {
    const current = getInvoiceLogoConfig();
    const next: InvoiceLogoConfig = {
      ...current,
      ...updates,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
    return next;
  } catch (e) {
    console.error('Failed to save invoice logo config to localStorage:', e);
    return getInvoiceLogoConfig();
  }
}

export function resetSingleLogo(target: 'kabTangerang' | 'aetra'): InvoiceLogoConfig {
  if (target === 'kabTangerang') {
    return saveInvoiceLogoConfig({
      kabTangerangLogoUrl: null,
      kabTangerangSize: 52,
      showKabTangerangText: true,
    });
  } else {
    return saveInvoiceLogoConfig({
      aetraLogoUrl: null,
      aetraHeight: 46,
    });
  }
}

export function resetAllInvoiceLogos(): InvoiceLogoConfig {
  if (typeof window === 'undefined') return DEFAULT_INVOICE_LOGO_CONFIG;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: DEFAULT_INVOICE_LOGO_CONFIG }));
    return DEFAULT_INVOICE_LOGO_CONFIG;
  } catch (e) {
    console.error('Failed to reset invoice logo config in localStorage:', e);
    return DEFAULT_INVOICE_LOGO_CONFIG;
  }
}

export function useInvoiceLogoConfig() {
  const [config, setConfig] = useState<InvoiceLogoConfig>(getInvoiceLogoConfig);

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<InvoiceLogoConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getInvoiceLogoConfig());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setConfig(getInvoiceLogoConfig());
      }
    };

    window.addEventListener(CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateConfig = useCallback((updates: Partial<InvoiceLogoConfig>) => {
    const updated = saveInvoiceLogoConfig(updates);
    setConfig(updated);
  }, []);

  const resetLogo = useCallback((target: 'kabTangerang' | 'aetra') => {
    const updated = resetSingleLogo(target);
    setConfig(updated);
  }, []);

  const resetAll = useCallback(() => {
    const updated = resetAllInvoiceLogos();
    setConfig(updated);
  }, []);

  return {
    config,
    updateConfig,
    resetLogo,
    resetAll,
  };
}
