'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';

const CancelSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(240).optional(),
});

export async function cancelBooking(formData: FormData) {
  const { id, reason } = CancelSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  const args: Record<string, string> = { p_booking_id: id };
  if (reason) args.p_reason = reason;
  const { error } = await (supabase as unknown as {
    rpc: (fn: string, params: Record<string, string>) => Promise<{ error: { message: string } | null }>;
  }).rpc('cancel_booking', args);
  if (error) throw new Error(error.message);
  revalidatePath('/bookings');
  revalidatePath(`/bookings/${id}`);
}
