import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { ActivitySchema, type Activity } from '@booking/types';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from './keys';

const ListSchema = z.array(ActivitySchema);

export function useActivities(
  client: SupabaseClient<Database>,
  options?: Partial<UseQueryOptions<Activity[]>>,
) {
  return useQuery({
    queryKey: queryKeys.activities(),
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await client
        .from('activities')
        .select('*')
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return ListSchema.parse(data);
    },
    staleTime: 60_000,
    ...options,
  });
}
