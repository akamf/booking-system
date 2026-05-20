import { z } from 'zod';

const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const ClientEnvSchema = ServerEnvSchema;

/** Server-side env. Throws at import time if anything is missing. */
export const serverEnv = ServerEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Client env factory — pass the inlined NEXT_PUBLIC_* values from a
 * client component. Next inlines NEXT_PUBLIC_ vars at build time, so
 * reading process.env in the browser works but feels invisible; this
 * indirection makes the runtime contract explicit.
 */
export function clientEnv(): z.infer<typeof ClientEnvSchema> {
  return ClientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
