'use client';
import { createWebBrowserClient } from '@booking/api';
import { clientEnv } from './env';

export function getBrowserSupabase() {
  const env = clientEnv();
  return createWebBrowserClient({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
