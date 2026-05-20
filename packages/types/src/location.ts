import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const LocationSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  timezone: z.string().min(3).max(60),
  address: z.string().max(500).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  archived_at: z.string().datetime({ offset: true }).nullable(),
});
export type Location = z.infer<typeof LocationSchema>;

export const WeekdaySchema = z.number().int().min(0).max(6);
export type Weekday = z.infer<typeof WeekdaySchema>;

export const OpeningHoursSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  weekday: WeekdaySchema,
  opens_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  closes_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

export const BlockedTimeSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  resource_id: z.string().uuid().nullable(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  reason: z.string().max(240).nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type BlockedTime = z.infer<typeof BlockedTimeSchema>;
