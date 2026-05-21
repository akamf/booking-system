'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { insertRow, updateRow, type Insert } from '@/lib/typed-table';

const InputSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
  description: z.string().max(1000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  min_age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  max_age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  default_duration_minutes: z.coerce.number().int().min(5).max(1440),
  min_duration_minutes: z.coerce.number().int().min(5).max(1440),
  max_duration_minutes: z.coerce.number().int().min(5).max(1440),
  cancellation_cutoff_minutes: z.coerce.number().int().min(0).max(10080),
  self_book_min_age: z.coerce.number().int().min(0).max(120),
});

function shape(parsed: z.infer<typeof InputSchema>): Insert<'activities'> {
  return {
    organization_id: parsed.organization_id,
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description ?? null,
    color: parsed.color ?? null,
    min_age: parsed.min_age ?? null,
    max_age: parsed.max_age ?? null,
    default_duration_minutes: parsed.default_duration_minutes,
    min_duration_minutes: parsed.min_duration_minutes,
    max_duration_minutes: parsed.max_duration_minutes,
    cancellation_cutoff_minutes: parsed.cancellation_cutoff_minutes,
    self_book_min_age: parsed.self_book_min_age,
  };
}

export async function createActivity(formData: FormData) {
  const parsed = InputSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await insertRow(supabase, 'activities', shape(parsed));
  revalidatePath('/activities');
  redirect('/activities');
}

export async function updateActivity(id: string, formData: FormData) {
  const parsed = InputSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await updateRow(supabase, 'activities', id, shape(parsed));
  revalidatePath('/activities');
  redirect('/activities');
}

export async function archiveActivity(id: string) {
  const supabase = await getServerSupabase();
  await updateRow(supabase, 'activities', id, { archived_at: new Date().toISOString() });
  revalidatePath('/activities');
}
