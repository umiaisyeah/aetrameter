import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or custom localStorage config
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('aetra_supabase_url') || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('aetra_supabase_anon_key') || '' : '';

  const url = storedUrl.trim() || envUrl.trim();
  const anonKey = storedKey.trim() || envKey.trim();

  const isConfigured = Boolean(
    url &&
    url !== 'https://your-project-id.supabase.co' &&
    anonKey &&
    anonKey !== 'your-supabase-anon-key'
  );

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

  if (!isConfigured) {
    return null;
  }

  // Re-instantiate if config changed
  if (!supabaseInstance || currentUrl !== url || currentKey !== anonKey) {
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
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aetra_supabase_url', url.trim());
    localStorage.setItem('aetra_supabase_anon_key', anonKey.trim());
    // Invalidate client
    supabaseInstance = null;
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('aetra_supabase_url');
    localStorage.removeItem('aetra_supabase_anon_key');
    supabaseInstance = null;
  }
};
