import { redirect } from 'next/navigation';
import type { RoleKey } from '@booking/types';
import { getServerSupabase } from './supabase-server';

export interface AdminSession {
  userId: string;
  email: string;
  displayName: string;
  roles: ReadonlySet<RoleKey>;
}

interface ProfileRow {
  display_name: string;
}
interface UserRoleRow {
  role_key: string;
}

/**
 * Server-only: resolve the current session and the caller's roles.
 * Redirects to /sign-in if no session, /no-access if not staff/admin.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const profileRes = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single();
  const profile = profileRes.data as ProfileRow | null;

  const rolesRes = await supabase
    .from('user_roles')
    .select('role_key')
    .eq('user_id', user.id);
  const roleRows = (rolesRes.data ?? []) as UserRoleRow[];

  const roleSet = new Set<RoleKey>(roleRows.map((r) => r.role_key as RoleKey));
  const isStaff = roleSet.has('admin') || roleSet.has('staff');
  if (!isStaff) redirect('/no-access');

  return {
    userId: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? 'User',
    roles: roleSet,
  };
}
