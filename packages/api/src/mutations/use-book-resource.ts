import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookingSchema,
  BookResourceInputSchema,
  type Booking,
  type BookResourceInput,
} from '@booking/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from '../hooks/keys';
import { fromPostgrestError } from './errors';

type BookResourceRpcArgs = Database['public']['Functions']['book_resource']['Args'];

function buildArgs(parsed: BookResourceInput): BookResourceRpcArgs {
  const args: BookResourceRpcArgs = {
    p_resource_id: parsed.resource_id,
    p_activity_id: parsed.activity_id,
    p_starts_at: parsed.starts_at,
    p_ends_at: parsed.ends_at,
  };
  if (parsed.on_behalf_of_user_id != null) args.p_on_behalf_of_user_id = parsed.on_behalf_of_user_id;
  if (parsed.notes != null) args.p_notes = parsed.notes;
  return args;
}

export function useBookResource(client: SupabaseClient<Database>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookResourceInput): Promise<Booking> => {
      const parsed = BookResourceInputSchema.parse(input);
      const { data, error } = await client.rpc('book_resource', buildArgs(parsed));
      if (error) throw fromPostgrestError(error);
      return BookingSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings() });
      void qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
