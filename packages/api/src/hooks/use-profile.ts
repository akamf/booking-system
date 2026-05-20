import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { ProfileSchema, type Profile } from '@booking/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from './keys';

export function useProfile(
  client: SupabaseClient<Database>,
  userId: string,
  options?: Partial<UseQueryOptions<Profile>>,
) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return ProfileSchema.parse(data);
    },
    staleTime: 60_000,
    ...options,
  });
}
