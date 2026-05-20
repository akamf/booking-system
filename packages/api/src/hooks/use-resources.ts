import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { ResourceSchema, type Resource } from '@booking/types';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db';
import { queryKeys } from './keys';

const ListSchema = z.array(ResourceSchema);

export function useResources(
  client: SupabaseClient<Database>,
  options?: Partial<UseQueryOptions<Resource[]>>,
) {
  return useQuery({
    queryKey: queryKeys.resources(),
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await client
        .from('resources')
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

const CompatibilityRowSchema = z.object({
  activity_id: z.string().uuid(),
  resource_id: z.string().uuid(),
});

export function useResourceCompatibility(
  client: SupabaseClient<Database>,
  resourceId: string,
) {
  return useQuery({
    queryKey: queryKeys.resourceCompatibility(resourceId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await client
        .from('activity_resource_compatibility')
        .select('activity_id, resource_id')
        .eq('resource_id', resourceId);
      if (error) throw error;
      return z.array(CompatibilityRowSchema).parse(data).map((row) => row.activity_id);
    },
    staleTime: 60_000,
  });
}
