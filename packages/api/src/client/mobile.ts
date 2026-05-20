import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db';

export interface MobileClientEnv {
  url: string;
  anonKey: string;
  /**
   * Storage adapter for persisting auth tokens. Pass an instance of
   * `expo-secure-store` (preferred) or `AsyncStorage`.
   */
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
}

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Mobile-side Supabase client. Persists session tokens via the supplied
 * storage adapter; the consuming app decides whether to use
 * expo-secure-store (encrypted) or AsyncStorage (faster).
 *
 * Memoized — Expo apps are single-process and a single client is
 * always correct.
 */
export function createMobileClient(env: MobileClientEnv) {
  if (cached) return cached;
  cached = createClient<Database>(env.url, env.anonKey, {
    auth: {
      storage: env.storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

export type MobileClient = ReturnType<typeof createMobileClient>;
