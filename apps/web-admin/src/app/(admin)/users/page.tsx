import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Profile } from '@booking/types';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  let users: Profile[] = [];
  if (q && q.trim().length >= 2) {
    const supabase = await getServerSupabase();
    const res = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', `%${q.trim()}%`)
      .is('deleted_at', null)
      .order('display_name')
      .limit(50);
    users = (res.data ?? []) as Profile[];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
      <p className="text-sm text-neutral-500 max-w-prose">
        Search by display name. We do not list users by default — privacy posture
        favors deliberate lookup over browsing (see ADR-0005 / ARCHITECTURE §5).
      </p>

      <form className="flex gap-3 items-end">
        <label className="block flex-1 max-w-md">
          <span className="block text-xs uppercase text-neutral-500">Search (≥2 chars)</span>
          <input name="q" defaultValue={q ?? ''} className="input" placeholder="display name" />
        </label>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {!q ? (
          <div className="p-6 text-sm text-neutral-500">Enter a query to find users.</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No matches.</div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {users.map((u) => (
              <li key={u.user_id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900">{u.display_name}</div>
                  <div className="text-xs text-neutral-500">
                    Born {u.birth_year ?? '—'} · {u.locale}
                  </div>
                </div>
                <Link href={`/users/${u.user_id}`} className="text-brand-600 hover:underline text-sm">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
