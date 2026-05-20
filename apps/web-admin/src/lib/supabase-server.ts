import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@booking/api';
import { serverEnv } from './env';

/**
 * Per-request Supabase server client. Construct once per Server
 * Component / Route Handler / middleware tick.
 *
 * createServerClient is called directly here (not via @booking/api's
 * factory) so the Database generic remains visible to TypeScript on
 * downstream `.from()` calls — wrapping it in a thin factory across
 * a package boundary tends to make TS forget the table types.
 */
export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          for (const cookie of cookiesToSet) {
            try {
              if (cookie.options) {
                store.set(cookie.name, cookie.value, cookie.options);
              } else {
                store.set(cookie.name, cookie.value);
              }
            } catch {
              // setAll is unsupported in some render contexts.
            }
          }
        },
      },
    },
  );
}
