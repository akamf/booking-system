import { getServerSupabase } from "@/lib/supabase-server";
import type { Location, OpeningHours } from "@booking/types";
import {
  addOpeningHours,
  deleteOpeningHours,
} from "@/features/schedule/actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export default async function OpeningHoursPage() {
  const supabase = await getServerSupabase();
  const [hoursRes, locRes] = await Promise.all([
    supabase
      .from("opening_hours")
      .select("*")
      .order("weekday")
      .order("opens_at"),
    supabase.from("locations").select("*").order("name"),
  ]);
  const hours = (hoursRes.data ?? []) as OpeningHours[];
  const locations = (locRes.data ?? []) as Location[];

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Schedule rules</p>
        <h1 className="page-title">Opening hours</h1>
        <p className="page-description">
          Define the windows where bookings can be placed for each location.
        </p>
      </header>

      <form
        action={addOpeningHours}
        className="surface max-w-3xl space-y-4 p-6"
      >
        <h2 className="text-sm font-semibold text-neutral-950">
          Add opening window
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Location">
            <select
              name="location_id"
              required
              defaultValue={locations[0]?.id}
              className="input"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Day">
            <select name="weekday" required defaultValue="1" className="input">
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Opens">
            <input name="opens_at" type="time" required className="input" />
          </Field>
          <Field label="Closes">
            <input name="closes_at" type="time" required className="input" />
          </Field>
        </div>
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>

      <div className="surface max-w-3xl overflow-hidden">
        {hours.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">
            No opening hours configured.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {hours.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{DAYS[h.weekday]}</span>
                  <span className="text-neutral-500 ml-3">
                    {h.opens_at} – {h.closes_at}
                  </span>
                </span>
                <form
                  action={deleteOpeningHours.bind(null, h.id)}
                  className="inline"
                >
                  <button type="submit" className="text-danger hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
