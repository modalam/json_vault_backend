import type { Env } from '../types/env';
import { softDeleteExpiredAnonymousBlobs } from '../db/queries/usage';
import { writeAuditLog } from './audit.service';

export async function expireAnonymousBlobs(env: Env): Promise<{ expired: number }> {
  const deletedAt = new Date().toISOString();
  const expired = await softDeleteExpiredAnonymousBlobs(env.DB, deletedAt, 500);

  if (expired > 0) {
    await writeAuditLog(env, {
      userId: null,
      action: 'blob.expire_anonymous',
      resourceType: 'blob',
      metadata: { expired },
    });
  }

  return { expired };
}
