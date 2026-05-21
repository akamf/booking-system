'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { deleteWhere, insertRow, updateRow, type Insert } from '@/lib/typed-table';

const InputSchema = z.object({
  location_id: z.string().uuid(),
  type_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(200),
});

function shape(parsed: z.infer<typeof InputSchema>): Insert<'resources'> {
  return {
    location_id: parsed.location_id,
    type_id: parsed.type_id,
    name: parsed.name,
    description: parsed.description ?? null,
    capacity: parsed.capacity,
  };
}

export async function createResource(formData: FormData) {
  const parsed = InputSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await insertRow(supabase, 'resources', shape(parsed));
  revalidatePath('/resources');
  redirect('/resources');
}

export async function updateResource(id: string, formData: FormData) {
  const parsed = InputSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await updateRow(supabase, 'resources', id, shape(parsed));
  revalidatePath('/resources');
  redirect(`/resources/${id}`);
}

export async function archiveResource(id: string) {
  const supabase = await getServerSupabase();
  await updateRow(supabase, 'resources', id, { archived_at: new Date().toISOString() });
  revalidatePath('/resources');
}

export async function setCompatibility(resourceId: string, formData: FormData) {
  const supabase = await getServerSupabase();
  const selected = formData.getAll('activity_ids').map(String);

  const currentRes = await supabase
    .from('activity_resource_compatibility')
    .select('activity_id')
    .eq('resource_id', resourceId);
  const currentRows = (currentRes.data ?? []) as { activity_id: string }[];
  const current = new Set(currentRows.map((r) => r.activity_id));
  const desired = new Set(selected);

  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  if (toAdd.length > 0) {
    const rows: Insert<'activity_resource_compatibility'>[] = toAdd.map((activity_id) => ({
      activity_id,
      resource_id: resourceId,
    }));
    await insertRow(supabase, 'activity_resource_compatibility', rows);
  }

  for (const activity_id of toRemove) {
    await deleteWhere(supabase, 'activity_resource_compatibility', {
      resource_id: resourceId,
      activity_id,
    });
  }

  revalidatePath(`/resources/${resourceId}`);
}
