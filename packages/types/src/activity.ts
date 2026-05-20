import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/);

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  slug,
  description: z.string().max(1000).nullable(),
  color: hexColor.nullable(),
  min_age: z.number().int().min(0).max(120).nullable(),
  max_age: z.number().int().min(0).max(120).nullable(),
  default_duration_minutes: z.number().int().min(5).max(1440),
  min_duration_minutes: z.number().int().min(5).max(1440),
  max_duration_minutes: z.number().int().min(5).max(1440),
  cancellation_cutoff_minutes: z.number().int().min(0).max(10080),
  self_book_min_age: z.number().int().min(0).max(120),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  archived_at: z.string().datetime({ offset: true }).nullable(),
});

export type Activity = z.infer<typeof ActivitySchema>;

export const ActivityInputSchema = ActivitySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
}).superRefine((data, ctx) => {
  if (data.min_duration_minutes > data.default_duration_minutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'min_duration_minutes must be ≤ default_duration_minutes',
      path: ['min_duration_minutes'],
    });
  }
  if (data.default_duration_minutes > data.max_duration_minutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'default_duration_minutes must be ≤ max_duration_minutes',
      path: ['default_duration_minutes'],
    });
  }
  if (data.min_age != null && data.max_age != null && data.min_age > data.max_age) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'min_age must be ≤ max_age',
      path: ['min_age'],
    });
  }
});

export type ActivityInput = z.infer<typeof ActivityInputSchema>;
