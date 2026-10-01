import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates if a string is a valid HTTP or HTTPS URL
 */
export const isValidHttpUrl = (urlString?: string | null): boolean => {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Retrieve credentials from environment variables or custom localStorage config
export const getSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let storedUrl = '';
  let storedKey = '';

  if (typeof window !== 'undefined') {
    try {
      storedUrl = (localStorage.getItem('aetra_supabase_url') || '').trim();
      storedKey = (localStorage.getItem('aetra_supabase_anon_key') || '').trim();
    } catch {
      // Ignore localStorage access errors in restricted iframe
    }
  }

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const validUrl = isValidHttpUrl(url) && !url.includes('your-project-id.supabase.co');
  const validKey = Boolean(anonKey && anonKey !== 'your-supabase-anon-key' && anonKey.length > 10);

  const isConfigured = Boolean(validUrl && validKey);

  return {
    url,
    anonKey,
    isConfigured,
    source: storedUrl ? ('localStorage' as const) : ('env' as const)
  };
};

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured || !isValidHttpUrl(url)) {
    supabaseInstance = null;
    return null;
  }

  // Re-instantiate if config changed
  if (!supabaseInstance || currentUrl !== url || currentKey !== anonKey) {
    try {
      currentUrl = url;
      currentKey = anonKey;
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    } catch (error) {
      console.warn('Gagal menginisialisasi Supabase client (URL/Key invalid):', error);
      supabaseInstance = null;
      return null;
    }
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    try {
      const cleanUrl = url.trim();
      const cleanKey = anonKey.trim();
      if (cleanUrl) {
        localStorage.setItem('aetra_supabase_url', cleanUrl);
      } else {
        localStorage.removeItem('aetra_supabase_url');
      }
      if (cleanKey) {
        localStorage.setItem('aetra_supabase_anon_key', cleanKey);
      } else {
        localStorage.removeItem('aetra_supabase_anon_key');
      }
    } catch {}
    // Invalidate client
    supabaseInstance = null;
    currentUrl = '';
    currentKey = '';
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('aetra_supabase_url');
      localStorage.removeItem('aetra_supabase_anon_key');
    } catch {}
    supabaseInstance = null;
    currentUrl = '';
    currentKey = '';
  }
};
