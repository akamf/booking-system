import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Activity, Booking, Profile, Resource } from '@booking/types';
import { cancelBooking } from '@/features/bookings/actions';

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const bookRes = await supabase.from('bookings').select('*').eq('id', id).single();
  const booking = bookRes.data as Booking | null;
  if (!booking) notFound();

  const [resRes, actRes, bookedByRes, onBehalfRes] = await Promise.all([
    supabase.from('resources').select('*').eq('id', booking.resource_id).single(),
    supabase.from('activities').select('*').eq('id', booking.activity_id).single(),
    supabase.from('profiles').select('*').eq('user_id', booking.booked_by_user_id).single(),
    booking.on_behalf_of_user_id
      ? supabase.from('profiles').select('*').eq('user_id', booking.on_behalf_of_user_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const resource = resRes.data as Resource | null;
  const activity = actRes.data as Activity | null;
  const bookedBy = bookedByRes.data as Profile | null;
  const onBehalfOf = onBehalfRes.data as Profile | null;

  const cancellable = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/bookings" className="text-sm text-brand-600 hover:underline">← Bookings</Link>
      <h1 className="text-2xl font-semibold text-neutral-900">Booking detail</h1>

      <dl className="bg-white border border-neutral-200 rounded-lg p-6 grid grid-cols-2 gap-y-3 text-sm">
        <Row label="Status" value={booking.status} />
        <Row label="Starts at" value={new Date(booking.starts_at).toLocaleString()} />
        <Row label="Ends at" value={new Date(booking.ends_at).toLocaleString()} />
        <Row label="Resource" value={resource?.name ?? '—'} />
        <Row label="Activity" value={activity?.name ?? '—'} />
        <Row label="Booked by" value={bookedBy?.display_name ?? '—'} />
        <Row label="On behalf of" value={onBehalfOf?.display_name ?? '—'} />
        <Row label="Notes" value={booking.notes ?? '—'} />
        <Row label="Override reason" value={booking.override_reason ?? '—'} />
        {booking.status === 'cancelled' ? (
          <>
            <Row label="Cancelled at" value={booking.cancelled_at ? new Date(booking.cancelled_at).toLocaleString() : '—'} />
            <Row label="Cancelled reason" value={booking.cancelled_reason ?? '—'} />
          </>
        ) : null}
      </dl>

      {cancellable ? (
        <form action={cancelBooking} className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-medium text-neutral-700">Cancel booking</h2>
          <input type="hidden" name="id" value={booking.id} />
          <input name="reason" placeholder="Reason (optional)" maxLength={240} className="input" />
          <button type="submit" className="btn-danger">Cancel booking</button>
        </form>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </>
  );
}
