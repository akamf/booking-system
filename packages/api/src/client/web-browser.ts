import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../db';

export interface WebClientEnv {
  url: string;
  anonKey: string;
}

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser-side Supabase client for Next.js client components.
 * Memoized so the same instance is reused across renders.
 */
export function createWebBrowserClient(env: WebClientEnv) {
  if (cached) return cached;
  cached = createBrowserClient<Database>(env.url, env.anonKey);
  return cached;
}

export type WebBrowserClient = ReturnType<typeof createWebBrowserClient>;
