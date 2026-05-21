import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Resource } from '@booking/types';
import { archiveResource } from '@/features/resources/actions';

export default async function ResourcesPage() {
  const supabase = await getServerSupabase();
  const res = await supabase
    .from('resources')
    .select('*')
    .is('archived_at', null)
    .order('name');
  const resources = (res.data ?? []) as Resource[];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Resources</h1>
        <Link href="/resources/new" className="btn-primary">New resource</Link>
      </header>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {resources.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No resources yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <Th>Name</Th><Th>Capacity</Th><Th>Description</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{r.capacity}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{r.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/resources/${r.id}`} className="text-brand-600 hover:underline mr-3">Edit</Link>
                    <form action={archiveResource.bind(null, r.id)} className="inline">
                      <button type="submit" className="text-danger hover:underline">Archive</button>
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
