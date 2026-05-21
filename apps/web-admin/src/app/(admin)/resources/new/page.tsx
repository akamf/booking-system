import { getServerSupabase } from '@/lib/supabase-server';
import type { Location, ResourceType } from '@booking/types';
import { ResourceForm } from '@/features/resources/resource-form';
import { createResource } from '@/features/resources/actions';

export default async function NewResourcePage() {
  const supabase = await getServerSupabase();
  const [locRes, typeRes] = await Promise.all([
    supabase.from('locations').select('*').order('name'),
    supabase.from('resource_types').select('*').order('label'),
  ]);
  const locations = (locRes.data ?? []) as Location[];
  const resourceTypes = (typeRes.data ?? []) as ResourceType[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">New resource</h1>
      <ResourceForm locations={locations} resourceTypes={resourceTypes} action={createResource} />
    </div>
  );
}
