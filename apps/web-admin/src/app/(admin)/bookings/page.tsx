import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import type { Activity, Booking, Resource } from "@booking/types";
import { Filter, SlidersHorizontal } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-success/15 text-success",
  cancelled: "bg-neutral-200 text-neutral-600",
  completed: "bg-brand-100 text-brand-700",
  no_show: "bg-danger/15 text-danger",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; resource?: string }>;
}) {
  const { status, resource } = await searchParams;
  const supabase = await getServerSupabase();

  let query = supabase
    .from("bookings")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (resource) query = query.eq("resource_id", resource);

  const [bookingsRes, resRes, actRes] = await Promise.all([
    query,
    supabase
      .from("resources")
      .select("*")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("activities")
      .select("*")
      .is("archived_at", null)
      .order("name"),
  ]);
  const bookings = (bookingsRes.data ?? []) as Booking[];
  const resources = (resRes.data ?? []) as Resource[];
  const activities = (actRes.data ?? []) as Activity[];
  const byResource = new Map(resources.map((r) => [r.id, r.name]));
  const byActivity = new Map(activities.map((a) => [a.id, a]));
  const activeFilters = [status, resource].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Reservations</p>
          <h1 className="page-title">Bookings</h1>
          <p className="page-description">
            Review the latest reservations, spot pending requests, and open a
            booking for staff actions.
          </p>
        </div>
        <div className="surface flex items-center gap-4 px-4 py-3 text-sm">
          <div>
            <div className="font-semibold text-neutral-950">
              {bookings.length}
            </div>
            <div className="text-xs text-neutral-500">shown</div>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div>
            <div className="font-semibold text-neutral-950">
              {activeFilters}
            </div>
            <div className="text-xs text-neutral-500">filters</div>
          </div>
        </div>
      </header>

      <form className="surface flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="flex items-center gap-2 pb-1 text-sm font-semibold text-neutral-700 md:pr-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </div>
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">
            Status
          </span>
          <select name="status" defaultValue={status ?? ""} className="input">
            <option value="">All</option>
            {["pending", "confirmed", "cancelled", "completed", "no_show"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase text-neutral-500">
            Resource
          </span>
          <select
            name="resource"
            defaultValue={resource ?? ""}
            className="input"
          >
            <option value="">Any</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Apply
        </button>
      </form>

      <div className="surface overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No bookings.</div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="table-head">
              <tr>
                <Th>When</Th>
                <Th>Resource</Th>
                <Th>Activity</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {bookings.map((b) => {
                const activity = byActivity.get(b.activity_id);
                return (
                  <tr key={b.id} className="table-row">
                    <td className="px-4 py-3 text-sm">
                      <div>{new Date(b.starts_at).toLocaleString()}</div>
                      <div className="text-xs text-neutral-500">
                        to {new Date(b.ends_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {byResource.get(b.resource_id) ?? b.resource_id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: activity?.color ?? "#a1a1aa",
                          }}
                        />
                        {activity?.name ?? b.activity_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? ""}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        Open
                      </Link>
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
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
      {children}
    </th>
  );
}
