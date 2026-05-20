import { z } from 'zod';

export const RoleKeySchema = z.enum(['admin', 'staff', 'member', 'guardian', 'youth']);
export type RoleKey = z.infer<typeof RoleKeySchema>;

export const RoleSchema = z.object({
  key: RoleKeySchema,
  label: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

export const UserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_key: RoleKeySchema,
  granted_at: z.string().datetime({ offset: true }),
  granted_by: z.string().uuid().nullable(),
});
export type UserRole = z.infer<typeof UserRoleSchema>;
