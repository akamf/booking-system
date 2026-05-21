import { getServerSupabase } from '@/lib/supabase-server';
import type { Organization } from '@booking/types';
import { ActivityForm } from '@/features/activities/activity-form';
import { createActivity } from '@/features/activities/actions';

export default async function NewActivityPage() {
  const supabase = await getServerSupabase();
  const res = await supabase.from('organizations').select('*').order('name');
  const organizations = (res.data ?? []) as Organization[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">New activity</h1>
      <ActivityForm organizations={organizations} action={createActivity} />
    </div>
  );
}
