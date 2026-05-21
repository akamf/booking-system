import Constants from 'expo-constants';

interface Env {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Mobile env comes from Expo's `extra` config (app.json or app.config.ts)
 * or from EXPO_PUBLIC_* envs at build time. We read from process.env.EXPO_PUBLIC_*
 * for parity with how Expo handles client-side env.
 */
export function env(): Env {
  const fromExtra = (Constants.expoConfig?.extra ?? {}) as Partial<{
    supabaseUrl: string;
    supabaseAnonKey: string;
  }>;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? fromExtra.supabaseUrl;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? fromExtra.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { supabaseUrl, supabaseAnonKey };
}
