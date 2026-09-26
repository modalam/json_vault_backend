export type UserUsageStats = {
  blobCount: number;
  storageBytes: number;
};

export async function getUserUsageStats(
  db: D1Database,
  userId: string,
): Promise<UserUsageStats> {
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS blob_count,
         COALESCE(SUM(b.size_bytes), 0) AS storage_bytes
       FROM blobs b
       LEFT JOIN vaults v ON b.vault_id = v.id
       WHERE b.deleted_at IS NULL
         AND (
           b.created_by = ?
           OR (v.id IS NOT NULL AND v.owner_id = ? AND v.deleted_at IS NULL)
         )`,
    )
    .bind(userId, userId)
    .first<{ blob_count: number; storage_bytes: number }>();

  return {
    blobCount: Number(row?.blob_count ?? 0),
    storageBytes: Number(row?.storage_bytes ?? 0),
  };
}

export async function softDeleteExpiredAnonymousBlobs(
  db: D1Database,
  deletedAt: string,
  limit = 500,
): Promise<number> {
  // D1/SQLite: select then update in batch for predictable limits
  const rows = await db
    .prepare(
      `SELECT id FROM blobs
       WHERE deleted_at IS NULL
         AND expires_at IS NOT NULL
         AND expires_at < datetime('now')
         AND created_by IS NULL
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: string }>();

  const ids = rows.results ?? [];
  if (ids.length === 0) return 0;

  let changed = 0;
  for (const row of ids) {
    const result = await db
      .prepare(
        `UPDATE blobs SET deleted_at = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(deletedAt, deletedAt, row.id)
      .run();
    changed += result.meta.changes ?? 0;
  }
  return changed;
}
