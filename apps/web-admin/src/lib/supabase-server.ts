import { cookies } from 'next/headers';
import { createWebServerClient } from '@booking/api';
import { serverEnv } from './env';

/**
 * Per-request Supabase server client. Construct once per Server
 * Component / Route Handler / middleware tick.
 */
export async function getServerSupabase() {
  const store = await cookies();
  return createWebServerClient({
    url: serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookies: {
      getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })),
      setAll: (cookiesToSet) => {
        for (const cookie of cookiesToSet) {
          if (cookie.options) {
            store.set(cookie.name, cookie.value, cookie.options);
          } else {
            store.set(cookie.name, cookie.value);
          }
        }
      },
    },
  });
}
