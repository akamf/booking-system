'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { deleteWhere, insertRow, type Insert } from '@/lib/typed-table';

const OpeningHoursSchema = z.object({
  location_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  opens_at: z.string().regex(/^\d{2}:\d{2}$/),
  closes_at: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function addOpeningHours(formData: FormData) {
  const parsed = OpeningHoursSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  const row: Insert<'opening_hours'> = parsed;
  await insertRow(supabase, 'opening_hours', row);
  revalidatePath('/opening-hours');
}

export async function deleteOpeningHours(id: string) {
  const supabase = await getServerSupabase();
  await deleteWhere(supabase, 'opening_hours', { id });
  revalidatePath('/opening-hours');
}

const BlockedTimeSchema = z.object({
  location_id: z.string().uuid(),
  resource_id: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  reason: z.string().max(240).optional().nullable(),
});

export async function addBlockedTime(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = BlockedTimeSchema.parse(raw);
  const supabase = await getServerSupabase();
  const row: Insert<'blocked_times'> = {
    location_id: parsed.location_id,
    resource_id: parsed.resource_id ?? null,
    starts_at: parsed.starts_at,
    ends_at: parsed.ends_at,
    reason: parsed.reason ?? null,
  };
  await insertRow(supabase, 'blocked_times', row);
  revalidatePath('/blocked-times');
}

export async function deleteBlockedTime(id: string) {
  const supabase = await getServerSupabase();
  await deleteWhere(supabase, 'blocked_times', { id });
  revalidatePath('/blocked-times');
}
