import { getServerSupabase } from '@/lib/supabase-server';

interface AuditEntry {
  id: number;
  table_name: string;
  action: string;
  occurred_at: string;
}

export default async function DashboardPage() {
  const supabase = await getServerSupabase();

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const todayCountRes = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', dayStart)
    .lt('starts_at', dayEnd);

  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
  const weekCountRes = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', dayStart)
    .lt('starts_at', weekEnd);

  const auditRes = await supabase
    .from('audit_log')
    .select('id, table_name, action, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(10);
  const auditRows = (auditRes.data ?? []) as AuditEntry[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Bookings today" value={todayCountRes.count ?? 0} />
        <StatCard label="Bookings this week" value={weekCountRes.count ?? 0} />
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 mb-3">
          Recent activity
        </h2>
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          {auditRows.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">No recent activity.</div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {auditRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium capitalize">{row.action}</span>{' '}
                    <span className="text-neutral-600">on {row.table_name}</span>
                  </div>
                  <time className="text-neutral-500 text-xs" dateTime={row.occurred_at}>
                    {new Date(row.occurred_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-3xl font-semibold text-neutral-900 mt-1">{value}</div>
    </div>
  );
}
