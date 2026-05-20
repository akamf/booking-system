import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '../db';

export interface WebServerCookieAdapter {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => void;
}

export interface WebServerEnv {
  url: string;
  anonKey: string;
  cookies: WebServerCookieAdapter;
}

/**
 * Server-side Supabase client for Next.js Server Components, Route
 * Handlers, and proxy.ts. Uses the framework's cookie store to refresh
 * sessions on every request.
 *
 * NOT memoized — each request gets a fresh client bound to its own
 * cookie store.
 */
export function createWebServerClient(env: WebServerEnv) {
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => env.cookies.getAll(),
      setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          env.cookies.setAll(cookies);
        } catch {
          // setAll is unsupported in some Next.js render contexts.
          // The next request reads cookies fresh, so this is safe.
        }
      },
    },
  });
}

export type WebServerClient = ReturnType<typeof createWebServerClient>;
