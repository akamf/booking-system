import { getServerSupabase } from "@/lib/supabase-server";
import { Filter } from "lucide-react";

interface AuditRow {
  id: number;
  table_name: string;
  row_id: string;
  action: "insert" | "update" | "delete";
  actor_user_id: string | null;
  before_data: unknown;
  after_data: unknown;
  occurred_at: string;
}

const TABLES = [
  "bookings",
  "profiles",
  "guardian_links",
  "user_roles",
  "blocked_times",
  "opening_hours",
  "activities",
  "resources",
] as const;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; from?: string; to?: string }>;
}) {
  const { table, from, to } = await searchParams;
  const supabase = await getServerSupabase();

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (table) query = query.eq("table_name", table);
  if (from) query = query.gte("occurred_at", from);
  if (to) query = query.lt("occurred_at", to);

  const res = await query;
  const rows = (res.data ?? []) as AuditRow[];

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Governance</p>
        <h1 className="page-title">Audit log</h1>
        <p className="page-description">
          Inspect staff and system changes across bookings, users, resources,
          and schedule rules.
        </p>
      </header>

      <form className="surface flex flex-wrap items-end gap-3 p-4">
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">
            Table
          </span>
          <select name="table" defaultValue={table ?? ""} className="input">
            <option value="">All</option>
            {TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">From</span>
          <input
            type="datetime-local"
            name="from"
            defaultValue={from ?? ""}
            className="input"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">To</span>
          <input
            type="datetime-local"
            name="to"
            defaultValue={to ?? ""}
            className="input"
          />
        </label>
        <button type="submit" className="btn-secondary">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filter
        </button>
      </form>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-neutral-500">
            No entries.
          </div>
        ) : (
          rows.map((r) => (
            <details key={r.id} className="surface">
              <summary className="px-4 py-3 cursor-pointer text-sm flex justify-between">
                <span>
                  <span className="font-medium capitalize">{r.action}</span>
                  <span className="text-neutral-500"> on </span>
                  <span className="font-mono text-neutral-700">
                    {r.table_name}
                  </span>
                  <span className="text-neutral-400">
                    {" "}
                    ({r.row_id.slice(0, 8)}…)
                  </span>
                </span>
                <time
                  className="text-xs text-neutral-500"
                  dateTime={r.occurred_at}
                >
                  {new Date(r.occurred_at).toLocaleString()}
                </time>
              </summary>
              <div className="px-4 py-3 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-neutral-500 mb-1">Before</div>
                  <pre className="bg-neutral-50 rounded p-2 overflow-auto max-h-72">
                    {r.before_data
                      ? JSON.stringify(r.before_data, null, 2)
                      : "—"}
                  </pre>
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">After</div>
                  <pre className="bg-neutral-50 rounded p-2 overflow-auto max-h-72">
                    {r.after_data ? JSON.stringify(r.after_data, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
