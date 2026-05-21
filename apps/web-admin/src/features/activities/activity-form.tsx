import type { Activity, Organization } from '@booking/types';

interface Props {
  organizations: Organization[];
  activity?: Activity | null;
  action: (formData: FormData) => Promise<void>;
}

export function ActivityForm({ organizations, activity, action }: Props) {
  return (
    <form action={action} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-6 max-w-2xl">
      <Field label="Organization">
        <select name="organization_id" defaultValue={activity?.organization_id ?? organizations[0]?.id} required className="input">
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Field>
      <Field label="Name">
        <input name="name" defaultValue={activity?.name} required maxLength={80} className="input" />
      </Field>
      <Field label="Slug (URL-safe identifier)">
        <input name="slug" defaultValue={activity?.slug} required pattern="^[a-z0-9][a-z0-9-]{0,62}$" className="input" />
      </Field>
      <Field label="Description">
        <textarea name="description" defaultValue={activity?.description ?? ''} maxLength={1000} className="input min-h-20" />
      </Field>
      <Field label="Color (hex)">
        <input name="color" defaultValue={activity?.color ?? ''} placeholder="#2f7aff" className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min age"><input name="min_age" type="number" defaultValue={activity?.min_age ?? ''} className="input" /></Field>
        <Field label="Max age"><input name="max_age" type="number" defaultValue={activity?.max_age ?? ''} className="input" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Min duration (min)"><input name="min_duration_minutes" type="number" required defaultValue={activity?.min_duration_minutes ?? 30} className="input" /></Field>
        <Field label="Default duration (min)"><input name="default_duration_minutes" type="number" required defaultValue={activity?.default_duration_minutes ?? 60} className="input" /></Field>
        <Field label="Max duration (min)"><input name="max_duration_minutes" type="number" required defaultValue={activity?.max_duration_minutes ?? 180} className="input" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cancellation cutoff (min)"><input name="cancellation_cutoff_minutes" type="number" required defaultValue={activity?.cancellation_cutoff_minutes ?? 120} className="input" /></Field>
        <Field label="Self-book min age"><input name="self_book_min_age" type="number" required defaultValue={activity?.self_book_min_age ?? 13} className="input" /></Field>
      </div>
      <div className="pt-2 flex gap-3">
        <button type="submit" className="btn-primary">{activity ? 'Save changes' : 'Create activity'}</button>
        <a href="/activities" className="btn-secondary">Cancel</a>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
