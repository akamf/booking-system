import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { BookingSchema, type Booking } from '@booking/types';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from './keys';

const ListSchema = z.array(BookingSchema);

/**
 * Bookings visible to the current authenticated user — RLS filters to
 * (booker | on-behalf-of | guardian | staff).
 */
export function useMyBookings(
  client: SupabaseClient<Database>,
  userId: string,
  options?: Partial<UseQueryOptions<Booking[]>>,
) {
  return useQuery({
    queryKey: queryKeys.bookingsForUser(userId),
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return ListSchema.parse(data);
    },
    staleTime: 15_000,
    ...options,
  });
}

/**
 * Bookings for a specific resource on a specific calendar date — used
 * by the availability view to merge against opening hours and blocks.
 */
export function useBookingsForResource(
  client: SupabaseClient<Database>,
  resourceId: string,
  /** ISO date range start (inclusive) in UTC */
  startsAt: string,
  /** ISO date range end (exclusive) in UTC */
  endsAt: string,
) {
  return useQuery({
    queryKey: queryKeys.bookingsForResource(resourceId, `${startsAt}_${endsAt}`),
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .eq('resource_id', resourceId)
        .in('status', ['pending', 'confirmed'])
        .gte('starts_at', startsAt)
        .lt('starts_at', endsAt)
        .order('starts_at');
      if (error) throw error;
      return ListSchema.parse(data);
    },
    staleTime: 5_000,
  });
}
