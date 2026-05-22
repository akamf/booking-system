import { getServerSupabase } from "@/lib/supabase-server";
import type { Activity, Booking, Resource } from "@booking/types";
import {
  Activity as ActivityIcon,
  CalendarCheck,
  Clock3,
  MapPinned,
  TrendingUp,
} from "lucide-react";

interface AuditEntry {
  id: number;
  table_name: string;
  action: string;
  occurred_at: string;
}

export default async function DashboardPage() {
  const supabase = await getServerSupabase();

  const now = new Date();
  const dayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const dayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).toISOString();

  const todayCountRes = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", dayStart)
    .lt("starts_at", dayEnd);

  const weekEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
  ).toISOString();
  const weekCountRes = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", dayStart)
    .lt("starts_at", weekEnd);

  const [auditRes, resourcesRes, activitiesRes, upcomingRes] =
    await Promise.all([
      supabase
        .from("audit_log")
        .select("id, table_name, action, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(10),
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
      supabase
        .from("bookings")
        .select("*")
        .in("status", ["pending", "confirmed"])
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
    ]);
  const auditRows = (auditRes.data ?? []) as AuditEntry[];
  const resources = (resourcesRes.data ?? []) as Resource[];
  const activities = (activitiesRes.data ?? []) as Activity[];
  const upcoming = (upcomingRes.data ?? []) as Booking[];
  const byResource = new Map(resources.map((r) => [r.id, r.name]));
  const byActivity = new Map(activities.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Track current demand, upcoming sessions, and recent operational
            changes.
          </p>
        </div>
        <div className="surface px-4 py-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-950">
            {now.toLocaleDateString()}
          </span>
          <span className="mx-2 text-neutral-300">/</span>
          {resources.length} bookable resources
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Bookings today"
          value={todayCountRes.count ?? 0}
          detail="Pending and confirmed"
        />
        <StatCard
          icon={TrendingUp}
          label="Next 7 days"
          value={weekCountRes.count ?? 0}
          detail="Visible workload"
        />
        <StatCard
          icon={MapPinned}
          label="Resources"
          value={resources.length}
          detail="Open for scheduling"
        />
        <StatCard
          icon={ActivityIcon}
          label="Activities"
          value={activities.length}
          detail="Available programs"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="surface overflow-hidden">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-950">
              Upcoming bookings
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              The next sessions that need staff attention.
            </p>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              No upcoming confirmed or pending bookings.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {upcoming.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-950">
                      {byActivity.get(booking.activity_id) ?? "Activity"} at{" "}
                      {byResource.get(booking.resource_id) ?? "resource"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(booking.starts_at).toLocaleString()} -{" "}
                      {new Date(booking.ends_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">
                    {booking.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface overflow-hidden">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-950">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Latest audit events across the venue.
            </p>
          </div>
          {auditRows.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              No recent activity.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {auditRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium capitalize">{row.action}</span>{" "}
                    <span className="text-neutral-600">
                      on {row.table_name}
                    </span>
                  </div>
                  <time
                    className="text-neutral-500 text-xs"
                    dateTime={row.occurred_at}
                  >
                    {new Date(row.occurred_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-500">{label}</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
        {value}
      </div>
      <div className="mt-1 text-xs text-neutral-500">{detail}</div>
    </div>
  );
}
