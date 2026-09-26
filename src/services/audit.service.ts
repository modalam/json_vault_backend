import type { Env } from '../types/env';
import { insertAuditLog } from '../db/queries/audit-logs';
import { createAuditId } from '../utils/id';

export type AuditEvent = {
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
};

/** Best-effort audit write — never fails the primary request. */
export async function writeAuditLog(env: Env, event: AuditEvent): Promise<void> {
  try {
    await insertAuditLog(env.DB, {
      id: createAuditId(),
      userId: event.userId ?? null,
      action: event.action,
      resourceType: event.resourceType ?? null,
      resourceId: event.resourceId ?? null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      ipAddress: event.ipAddress ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'warn',
        message: 'Failed to write audit log',
        action: event.action,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}
