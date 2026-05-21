import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Activity, Booking, Resource } from '@booking/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  cancelled: 'bg-neutral-200 text-neutral-600',
  completed: 'bg-brand-100 text-brand-700',
  no_show: 'bg-danger/15 text-danger',
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; resource?: string }>;
}) {
  const { status, resource } = await searchParams;
  const supabase = await getServerSupabase();

  let query = supabase
    .from('bookings')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  if (resource) query = query.eq('resource_id', resource);

  const [bookingsRes, resRes, actRes] = await Promise.all([
    query,
    supabase.from('resources').select('*').is('archived_at', null).order('name'),
    supabase.from('activities').select('*').is('archived_at', null).order('name'),
  ]);
  const bookings = (bookingsRes.data ?? []) as Booking[];
  const resources = (resRes.data ?? []) as Resource[];
  const activities = (actRes.data ?? []) as Activity[];
  const byResource = new Map(resources.map((r) => [r.id, r.name]));
  const byActivity = new Map(activities.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Bookings</h1>
      </header>

      <form className="flex gap-3 items-end">
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">Status</span>
          <select name="status" defaultValue={status ?? ''} className="input">
            <option value="">All</option>
            {['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">Resource</span>
          <select name="resource" defaultValue={resource ?? ''} className="input">
            <option value="">Any</option>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No bookings.</div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <Th>When</Th><Th>Resource</Th><Th>Activity</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {bookings.map((b) => {
                const activity = byActivity.get(b.activity_id);
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-sm">
                      <div>{new Date(b.starts_at).toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">
                        to {new Date(b.ends_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{byResource.get(b.resource_id) ?? b.resource_id}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activity?.color ?? '#a1a1aa' }} />
                        {activity?.name ?? b.activity_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/bookings/${b.id}`} className="text-brand-600 hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{children}</th>;
}
