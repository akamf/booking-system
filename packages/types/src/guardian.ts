import { z } from 'zod';

export const GuardianLinkSchema = z.object({
  guardian_user_id: z.string().uuid(),
  minor_user_id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  verified_at: z.string().datetime({ offset: true }).nullable(),
  created_by: z.string().uuid().nullable(),
});

export type GuardianLink = z.infer<typeof GuardianLinkSchema>;
