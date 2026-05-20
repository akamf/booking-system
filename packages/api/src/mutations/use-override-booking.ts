import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingSchema, type Booking } from '@booking/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from '../hooks/keys';
import { fromPostgrestError } from './errors';

export interface OverrideBookingInput {
  resource_id: string;
  activity_id: string;
  starts_at: string;
  ends_at: string;
  on_behalf_of_user_id: string | null;
  override_reason: string;
  notes?: string | null;
}

type OverrideArgs = Database['public']['Functions']['override_book_resource']['Args'];

export function useOverrideBookResource(client: SupabaseClient<Database>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OverrideBookingInput): Promise<Booking> => {
      const args: OverrideArgs = {
        p_resource_id: input.resource_id,
        p_activity_id: input.activity_id,
        p_starts_at: input.starts_at,
        p_ends_at: input.ends_at,
        p_override_reason: input.override_reason,
      };
      if (input.on_behalf_of_user_id != null) args.p_on_behalf_of_user_id = input.on_behalf_of_user_id;
      if (input.notes != null) args.p_notes = input.notes;
      const { data, error } = await client.rpc('override_book_resource', args);
      if (error) throw fromPostgrestError(error);
      return BookingSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings() });
    },
  });
}
