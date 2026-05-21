import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Activity, Organization } from '@booking/types';
import { ActivityForm } from '@/features/activities/activity-form';
import { updateActivity } from '@/features/activities/actions';

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const [actRes, orgRes] = await Promise.all([
    supabase.from('activities').select('*').eq('id', id).single(),
    supabase.from('organizations').select('*').order('name'),
  ]);
  const activity = actRes.data as Activity | null;
  if (!activity) notFound();
  const organizations = (orgRes.data ?? []) as Organization[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Edit activity</h1>
      <ActivityForm
        organizations={organizations}
        activity={activity}
        action={updateActivity.bind(null, id)}
      />
    </div>
  );
}
