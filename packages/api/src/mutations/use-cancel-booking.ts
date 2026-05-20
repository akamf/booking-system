import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingSchema, type Booking } from '@booking/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from '../hooks/keys';
import { fromPostgrestError } from './errors';

export interface CancelBookingInput {
  bookingId: string;
  reason?: string | null;
}

type CancelArgs = Database['public']['Functions']['cancel_booking']['Args'];

export function useCancelBooking(client: SupabaseClient<Database>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: CancelBookingInput): Promise<Booking> => {
      const args: CancelArgs = { p_booking_id: bookingId };
      if (reason != null) args.p_reason = reason;
      const { data, error } = await client.rpc('cancel_booking', args);
      if (error) throw fromPostgrestError(error);
      return BookingSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings() });
      void qc.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
