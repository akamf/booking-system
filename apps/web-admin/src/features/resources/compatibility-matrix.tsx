import type { Activity } from '@booking/types';
import { setCompatibility } from './actions';

interface Props {
  resourceId: string;
  activities: Activity[];
  enabled: ReadonlySet<string>;
}

export function CompatibilityMatrix({ resourceId, activities, enabled }: Props) {
  return (
    <form action={setCompatibility.bind(null, resourceId)} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-6 max-w-2xl">
      <h2 className="text-sm font-medium text-neutral-700">Allowed activities</h2>
      <p className="text-xs text-neutral-500">
        Bookings will only be permitted when an activity is allowed on this resource (enforced server-side).
      </p>
      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activity_ids"
              value={a.id}
              defaultChecked={enabled.has(a.id)}
              id={`compat-${a.id}`}
              className="rounded border-neutral-300"
            />
            <label htmlFor={`compat-${a.id}`} className="text-sm text-neutral-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: a.color ?? '#a1a1aa' }} />
              {a.name}
            </label>
          </li>
        ))}
      </ul>
      <button type="submit" className="btn-primary">Save compatibility</button>
    </form>
  );
}
