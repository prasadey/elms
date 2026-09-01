import { getDb } from "@/lib/db";

export function writeAudit(params: {
  entityType: string;
  entityId: number;
  actorId: number | null;
  actorRole: string | null;
  action: string;
  beforeState?: unknown;
  afterState?: unknown;
  comment?: string | null;
  ip?: string | null;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_log (entity_type, entity_id, actor_id, actor_role, action, before_state, after_state, comment, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    params.entityType,
    params.entityId,
    params.actorId,
    params.actorRole,
    params.action,
    params.beforeState !== undefined ? JSON.stringify(params.beforeState) : null,
    params.afterState !== undefined ? JSON.stringify(params.afterState) : null,
    params.comment ?? null,
    params.ip ?? null
  );
}
