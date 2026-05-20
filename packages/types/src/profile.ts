import { z } from 'zod';

export const ProfileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1).max(60),
  birth_year: z.number().int().gte(1900).lte(2100).nullable(),
  guardian_email: z.string().email().max(254).nullable(),
  locale: z.string().min(2).max(10),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).nullable(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateSchema = ProfileSchema.pick({
  display_name: true,
  birth_year: true,
  guardian_email: true,
  locale: true,
}).partial();

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
