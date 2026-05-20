import { z } from 'zod';

export const AuditActionSchema = z.enum(['insert', 'update', 'delete']);
export type AuditAction = z.infer<typeof AuditActionSchema>;

const Json: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(Json), z.record(Json)]),
);

export const AuditLogSchema = z.object({
  id: z.number().int(),
  table_name: z.string(),
  row_id: z.string(),
  action: AuditActionSchema,
  actor_user_id: z.string().uuid().nullable(),
  before_data: Json.nullable(),
  after_data: Json.nullable(),
  occurred_at: z.string().datetime({ offset: true }),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
