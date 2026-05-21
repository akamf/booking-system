import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileClient } from '@booking/api';
import { env } from './env';

let client: ReturnType<typeof createMobileClient> | null = null;

/**
 * Lazily initialized Supabase client for the mobile app.
 *
 * We use AsyncStorage rather than expo-secure-store for the session
 * because (a) the tokens are short-lived JWTs already protected by
 * the server, (b) AsyncStorage is faster on cold starts, and (c)
 * expo-secure-store has a 2KB-per-key cap that Supabase's session
 * blob can exceed. If we ever store anything more sensitive (e.g.,
 * a refresh secret for sensitive flows), we'll migrate to secure-store.
 */
export function getSupabase() {
  if (client) return client;
  const { supabaseUrl, supabaseAnonKey } = env();
  client = createMobileClient({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    storage: AsyncStorage,
  });
  return client;
}
