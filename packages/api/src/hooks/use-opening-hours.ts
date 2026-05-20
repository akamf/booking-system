import { useQuery } from '@tanstack/react-query';
import { BlockedTimeSchema, OpeningHoursSchema, type BlockedTime, type OpeningHours } from '@booking/types';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from './keys';

export function useOpeningHours(client: SupabaseClient<Database>, locationId: string) {
  return useQuery({
    queryKey: queryKeys.openingHours(locationId),
    queryFn: async (): Promise<OpeningHours[]> => {
      const { data, error } = await client
        .from('opening_hours')
        .select('*')
        .eq('location_id', locationId)
        .order('weekday')
        .order('opens_at');
      if (error) throw error;
      return z.array(OpeningHoursSchema).parse(data);
    },
    staleTime: 5 * 60_000,
  });
}

export function useBlockedTimes(
  client: SupabaseClient<Database>,
  locationId: string,
  startsAt: string,
  endsAt: string,
) {
  return useQuery({
    queryKey: queryKeys.blockedTimes(locationId),
    queryFn: async (): Promise<BlockedTime[]> => {
      const { data, error } = await client
        .from('blocked_times')
        .select('*')
        .eq('location_id', locationId)
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt);
      if (error) throw error;
      return z.array(BlockedTimeSchema).parse(data);
    },
    staleTime: 30_000,
  });
}
