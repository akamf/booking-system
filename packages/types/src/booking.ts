import { z } from 'zod';

export const BookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  resource_id: z.string().uuid(),
  activity_id: z.string().uuid(),
  booked_by_user_id: z.string().uuid(),
  on_behalf_of_user_id: z.string().uuid().nullable(),

  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),

  status: BookingStatusSchema,
  notes: z.string().max(240).nullable(),

  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),

  cancelled_at: z.string().datetime({ offset: true }).nullable(),
  cancelled_by_user_id: z.string().uuid().nullable(),
  cancelled_reason: z.string().max(240).nullable(),

  override_reason: z.string().max(240).nullable(),
});

export type Booking = z.infer<typeof BookingSchema>;

/**
 * Input payload for the book_resource RPC.
 */
export const BookResourceInputSchema = z
  .object({
    resource_id: z.string().uuid(),
    activity_id: z.string().uuid(),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }),
    on_behalf_of_user_id: z.string().uuid().nullable().optional(),
    notes: z.string().max(240).nullable().optional(),
  })
  .refine((d) => new Date(d.starts_at) < new Date(d.ends_at), {
    message: 'starts_at must precede ends_at',
    path: ['ends_at'],
  });

export type BookResourceInput = z.infer<typeof BookResourceInputSchema>;

/**
 * Typed RPC error codes (the `hint` field on a Postgrest error).
 * Mirrors the HINTs raised in supabase/migrations/0010,0011.
 */
export const BookingErrorCodeSchema = z.enum([
  'NOT_AUTHENTICATED',
  'NOT_AUTHORIZED',
  'RESOURCE_NOT_FOUND',
  'ACTIVITY_NOT_FOUND',
  'INVALID_TIME_RANGE',
  'PAST_BOOKING',
  'ACTIVITY_NOT_ALLOWED_ON_RESOURCE',
  'DURATION_OUT_OF_BOUNDS',
  'AGE_RESTRICTION',
  'GUARDIAN_REQUIRED',
  'CROSS_DAY',
  'OUTSIDE_OPENING_HOURS',
  'BLOCKED_TIME',
  'RESOURCE_UNAVAILABLE',
  'BOOKING_NOT_FOUND',
  'ALREADY_CANCELLED',
  'CANNOT_CANCEL_FINALIZED',
  'CANCELLATION_CUTOFF',
  'OVERRIDE_REASON_REQUIRED',
]);
export type BookingErrorCode = z.infer<typeof BookingErrorCodeSchema>;
