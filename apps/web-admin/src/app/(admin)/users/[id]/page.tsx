import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Profile, RoleKey } from '@booking/types';
import { grantRole, linkGuardian, revokeRole, unlinkGuardian } from '@/features/users/actions';

const ALL_ROLES: RoleKey[] = ['admin', 'staff', 'member', 'guardian', 'youth'];

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const profileRes = await supabase.from('profiles').select('*').eq('user_id', id).single();
  const profile = profileRes.data as Profile | null;
  if (!profile) notFound();

  const [roleRes, guardiansRes, minorsRes] = await Promise.all([
    supabase.from('user_roles').select('role_key').eq('user_id', id),
    supabase.from('guardian_links').select('guardian_user_id, verified_at').eq('minor_user_id', id),
    supabase.from('guardian_links').select('minor_user_id, verified_at').eq('guardian_user_id', id),
  ]);

  const roles = new Set((roleRes.data ?? []).map((r) => (r as { role_key: string }).role_key));
  const guardianRows = (guardiansRes.data ?? []) as { guardian_user_id: string; verified_at: string | null }[];
  const minorRows = (minorsRes.data ?? []) as { minor_user_id: string; verified_at: string | null }[];

  const relatedIds = [...new Set([...guardianRows.map((r) => r.guardian_user_id), ...minorRows.map((r) => r.minor_user_id)])];
  const relatedRes = relatedIds.length > 0
    ? await supabase.from('profiles').select('user_id, display_name').in('user_id', relatedIds)
    : { data: [] };
  const relatedRows = (relatedRes.data ?? []) as { user_id: string; display_name: string }[];
  const nameOf = new Map(relatedRows.map((r) => [r.user_id, r.display_name]));

  return (
    <div className="space-y-8 max-w-3xl">
      <Link href="/users" className="text-sm text-brand-600 hover:underline">← Users</Link>
      <h1 className="text-2xl font-semibold text-neutral-900">{profile.display_name}</h1>

      <dl className="bg-white border border-neutral-200 rounded-lg p-6 grid grid-cols-2 gap-y-3 text-sm">
        <Row label="User ID" value={profile.user_id} />
        <Row label="Birth year" value={profile.birth_year?.toString() ?? '—'} />
        <Row label="Guardian email" value={profile.guardian_email ?? '—'} />
        <Row label="Locale" value={profile.locale} />
        <Row label="Created" value={new Date(profile.created_at).toLocaleString()} />
      </dl>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">Roles</h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
          {ALL_ROLES.map((role) => {
            const has = roles.has(role);
            const action = has ? revokeRole : grantRole;
            return (
              <form action={action} key={role} className="flex items-center justify-between">
                <input type="hidden" name="user_id" value={id} />
                <input type="hidden" name="role_key" value={role} />
                <span className="text-sm capitalize">{role}</span>
                <button type="submit" className={has ? 'text-danger hover:underline text-sm' : 'btn-secondary'}>
                  {has ? 'Revoke' : 'Grant'}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">Guardians of this user</h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
          {guardianRows.length === 0 ? (
            <p className="text-sm text-neutral-500">No guardians linked.</p>
          ) : (
            <ul className="space-y-2">
              {guardianRows.map((g) => (
                <li key={g.guardian_user_id} className="flex items-center justify-between text-sm">
                  <Link href={`/users/${g.guardian_user_id}`} className="text-brand-600 hover:underline">
                    {nameOf.get(g.guardian_user_id) ?? g.guardian_user_id}
                  </Link>
                  <form action={unlinkGuardian}>
                    <input type="hidden" name="guardian_user_id" value={g.guardian_user_id} />
                    <input type="hidden" name="minor_user_id" value={id} />
                    <button type="submit" className="text-danger hover:underline">Unlink</button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={linkGuardian} className="flex gap-2 pt-2 border-t border-neutral-100">
            <input type="hidden" name="minor_user_id" value={id} />
            <input name="guardian_user_id" placeholder="Guardian user ID" className="input" />
            <button type="submit" className="btn-primary">Link guardian</button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">Minors of this user</h2>
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          {minorRows.length === 0 ? (
            <p className="text-sm text-neutral-500">No linked minors.</p>
          ) : (
            <ul className="space-y-2">
              {minorRows.map((m) => (
                <li key={m.minor_user_id} className="text-sm">
                  <Link href={`/users/${m.minor_user_id}`} className="text-brand-600 hover:underline">
                    {nameOf.get(m.minor_user_id) ?? m.minor_user_id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900 break-all">{value}</dd>
    </>
  );
}
