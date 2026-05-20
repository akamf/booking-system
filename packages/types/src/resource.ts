import { z } from 'zod';

export const ResourceTypeSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^[a-z_]+$/),
  label: z.string(),
  description: z.string().nullable(),
});

export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const ResourceSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  type_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).nullable(),
  capacity: z.number().int().min(1).max(200),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  archived_at: z.string().datetime({ offset: true }).nullable(),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const ResourceInputSchema = ResourceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
});
export type ResourceInput = z.infer<typeof ResourceInputSchema>;
