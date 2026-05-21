import { getServerSupabase } from '@/lib/supabase-server';
import type { BlockedTime, Location, Resource } from '@booking/types';
import { addBlockedTime, deleteBlockedTime } from '@/features/schedule/actions';

export default async function BlockedTimesPage() {
  const supabase = await getServerSupabase();
  const [blockRes, locRes, resRes] = await Promise.all([
    supabase.from('blocked_times').select('*').order('starts_at', { ascending: false }).limit(100),
    supabase.from('locations').select('*').order('name'),
    supabase.from('resources').select('*').is('archived_at', null).order('name'),
  ]);
  const blocks = (blockRes.data ?? []) as BlockedTime[];
  const locations = (locRes.data ?? []) as Location[];
  const resources = (resRes.data ?? []) as Resource[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Blocked times</h1>

      <form action={addBlockedTime} className="bg-white border border-neutral-200 rounded-lg p-6 max-w-2xl space-y-4">
        <h2 className="text-sm font-medium text-neutral-700">Add block</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <select name="location_id" required defaultValue={locations[0]?.id} className="input">
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Resource (optional)">
            <select name="resource_id" defaultValue="" className="input">
              <option value="">Entire location</option>
              {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Starts at (UTC)">
            <input name="starts_at" type="datetime-local" required step="60" className="input" />
          </Field>
          <Field label="Ends at (UTC)">
            <input name="ends_at" type="datetime-local" required step="60" className="input" />
          </Field>
        </div>
        <Field label="Reason">
          <input name="reason" maxLength={240} className="input" placeholder="Maintenance / Holiday / …" />
        </Field>
        <button type="submit" className="btn-primary">Add block</button>
      </form>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {blocks.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No blocked times.</div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <Th>From</Th><Th>To</Th><Th>Scope</Th><Th>Reason</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-sm">{new Date(b.starts_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(b.ends_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {b.resource_id
                      ? resources.find((r) => r.id === b.resource_id)?.name ?? 'Resource'
                      : 'Entire location'}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{b.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <form action={deleteBlockedTime.bind(null, b.id)} className="inline">
                      <button type="submit" className="text-danger hover:underline">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
