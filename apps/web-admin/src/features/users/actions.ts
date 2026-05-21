'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/supabase-server';
import { deleteWhere, insertRow, type Insert } from '@/lib/typed-table';

const RoleSchema = z.object({
  user_id: z.string().uuid(),
  role_key: z.enum(['admin', 'staff', 'member', 'guardian', 'youth']),
});

export async function grantRole(formData: FormData) {
  const parsed = RoleSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  const row: Insert<'user_roles'> = parsed;
  await insertRow(supabase, 'user_roles', row);
  revalidatePath(`/users/${parsed.user_id}`);
}

export async function revokeRole(formData: FormData) {
  const parsed = RoleSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await deleteWhere(supabase, 'user_roles', {
    user_id: parsed.user_id,
    role_key: parsed.role_key,
  });
  revalidatePath(`/users/${parsed.user_id}`);
}

const GuardianSchema = z.object({
  guardian_user_id: z.string().uuid(),
  minor_user_id: z.string().uuid(),
});

export async function linkGuardian(formData: FormData) {
  const parsed = GuardianSchema.parse(Object.fromEntries(formData));
  if (parsed.guardian_user_id === parsed.minor_user_id) {
    throw new Error('Guardian and minor must differ');
  }
  const supabase = await getServerSupabase();
  const row: Insert<'guardian_links'> = {
    ...parsed,
    verified_at: new Date().toISOString(),
  };
  await insertRow(supabase, 'guardian_links', row);
  revalidatePath(`/users/${parsed.minor_user_id}`);
}

export async function unlinkGuardian(formData: FormData) {
  const parsed = GuardianSchema.parse(Object.fromEntries(formData));
  const supabase = await getServerSupabase();
  await deleteWhere(supabase, 'guardian_links', parsed);
  revalidatePath(`/users/${parsed.minor_user_id}`);
}
