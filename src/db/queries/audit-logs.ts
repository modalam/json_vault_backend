export type InsertAuditLogParams = {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export async function insertAuditLog(
  db: D1Database,
  params: InsertAuditLogParams,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_logs (
        id, user_id, action, resource_type, resource_id, metadata, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      params.id,
      params.userId,
      params.action,
      params.resourceType,
      params.resourceId,
      params.metadata,
      params.ipAddress,
      params.createdAt,
    )
    .run();
}
