import type { Location, Resource, ResourceType } from '@booking/types';

interface Props {
  locations: Location[];
  resourceTypes: ResourceType[];
  resource?: Resource | null;
  action: (formData: FormData) => Promise<void>;
}

export function ResourceForm({ locations, resourceTypes, resource, action }: Props) {
  return (
    <form action={action} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-6 max-w-2xl">
      <Field label="Location">
        <select name="location_id" defaultValue={resource?.location_id ?? locations[0]?.id} required className="input">
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Type">
        <select name="type_id" defaultValue={resource?.type_id ?? resourceTypes[0]?.id} required className="input">
          {resourceTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </Field>
      <Field label="Name">
        <input name="name" defaultValue={resource?.name} required maxLength={80} className="input" />
      </Field>
      <Field label="Description">
        <textarea name="description" defaultValue={resource?.description ?? ''} maxLength={500} className="input min-h-20" />
      </Field>
      <Field label="Capacity">
        <input name="capacity" type="number" required defaultValue={resource?.capacity ?? 1} min={1} max={200} className="input" />
      </Field>
      <div className="pt-2 flex gap-3">
        <button type="submit" className="btn-primary">{resource ? 'Save changes' : 'Create resource'}</button>
        <a href="/resources" className="btn-secondary">Cancel</a>
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
