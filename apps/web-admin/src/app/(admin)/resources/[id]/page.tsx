import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Activity, Location, Resource, ResourceType } from '@booking/types';
import { ResourceForm } from '@/features/resources/resource-form';
import { CompatibilityMatrix } from '@/features/resources/compatibility-matrix';
import { updateResource } from '@/features/resources/actions';

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const [resourceRes, locRes, typeRes, actRes, compatRes] = await Promise.all([
    supabase.from('resources').select('*').eq('id', id).single(),
    supabase.from('locations').select('*').order('name'),
    supabase.from('resource_types').select('*').order('label'),
    supabase.from('activities').select('*').is('archived_at', null).order('name'),
    supabase.from('activity_resource_compatibility').select('activity_id').eq('resource_id', id),
  ]);

  const resource = resourceRes.data as Resource | null;
  if (!resource) notFound();
  const locations = (locRes.data ?? []) as Location[];
  const resourceTypes = (typeRes.data ?? []) as ResourceType[];
  const activities = (actRes.data ?? []) as Activity[];
  const compatRows = (compatRes.data ?? []) as { activity_id: string }[];
  const enabled = new Set(compatRows.map((c) => c.activity_id));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Edit resource</h1>
      <ResourceForm
        locations={locations}
        resourceTypes={resourceTypes}
        resource={resource}
        action={updateResource.bind(null, id)}
      />
      <CompatibilityMatrix resourceId={id} activities={activities} enabled={enabled} />
    </div>
  );
}
