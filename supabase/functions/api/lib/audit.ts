import { sql } from './db.ts';

export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate';

/**
 * Write an audit row. Best-effort: errors are logged but not re-thrown so
 * mutation failures don't propagate from the audit hook.
 *
 * Usage:
 *   audit(auth.userId, 'create', 'Project', projectId);
 *   audit(auth.userId, 'update', 'ScheduleTask', taskId, { name: ['old', 'new'] });
 */
export async function audit(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  diff?: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (${userId}, ${action}, ${entityType}, ${entityId})
    `;
    void diff; // diff field reserved for future schema extension
  } catch (err) {
    console.error('audit_failed', { userId, action, entityType, entityId, err });
  }
}
