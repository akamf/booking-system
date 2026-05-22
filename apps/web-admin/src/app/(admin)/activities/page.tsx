import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import type { Activity } from "@booking/types";
import { archiveActivity } from "@/features/activities/actions";
import { Plus } from "lucide-react";

export default async function ActivitiesPage() {
  const supabase = await getServerSupabase();
  const res = await supabase
    .from("activities")
    .select("*")
    .is("archived_at", null)
    .order("name");
  const activities = (res.data ?? []) as Activity[];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Programs</p>
          <h1 className="page-title">Activities</h1>
          <p className="page-description">
            Manage what families can book, including duration rules, age limits,
            and color coding.
          </p>
        </div>
        <Link href="/activities/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New activity
        </Link>
      </header>

      <div className="surface overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No activities yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="table-head">
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th>Duration</Th>
                <Th>Self-book age</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {activities.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: a.color ?? "#a1a1aa" }}
                    />
                    {a.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {a.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {a.min_duration_minutes}–{a.max_duration_minutes} min
                    (default {a.default_duration_minutes})
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {a.self_book_min_age}+
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/activities/${a.id}`}
                      className="text-brand-600 hover:underline mr-3"
                    >
                      Edit
                    </Link>
                    <form
                      action={archiveActivity.bind(null, a.id)}
                      className="inline"
                    >
                      <button
                        type="submit"
                        className="text-danger hover:underline"
                      >
                        Archive
                      </button>
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
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
      {children}
    </th>
  );
}
