import { z } from 'zod';

/**
 * Placeholder profile schema. Full shape (with role assignments,
 * guardian email handling, etc.) lands in T23 after the DB schema
 * is generated.
 */
export const ProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(60),
  birthYear: z.number().int().gte(1900).lte(2100).nullable(),
  locale: z.string().min(2).max(10),
  createdAt: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;
