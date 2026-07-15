import type { BlobRow, StorageType, Visibility } from '../../types/blob';

export type InsertBlobParams = {
  id: string;
  vaultId: string | null;
  createdBy: string | null;
  name: string | null;
  description: string | null;
  visibility: Visibility;
  storageType: StorageType;
  content: string | null;
  r2Key: string | null;
  sizeBytes: number;
  editTokenHash: string | null;
  tags: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function insertBlob(db: D1Database, params: InsertBlobParams): Promise<void> {
  await db
    .prepare(
      `INSERT INTO blobs (
        id, vault_id, created_by, name, description, visibility, storage_type,
        content, r2_key, size_bytes, edit_token_hash, tags, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      params.id,
      params.vaultId,
      params.createdBy,
      params.name,
      params.description,
      params.visibility,
      params.storageType,
      params.content,
      params.r2Key,
      params.sizeBytes,
      params.editTokenHash,
      params.tags,
      params.expiresAt,
      params.createdAt,
      params.updatedAt,
    )
    .run();
}

export async function findBlobById(db: D1Database, id: string): Promise<BlobRow | null> {
  return db
    .prepare(`SELECT * FROM blobs WHERE id = ? AND deleted_at IS NULL`)
    .bind(id)
    .first<BlobRow>();
}

export type UpdateBlobParams = {
  id: string;
  name: string | null;
  description: string | null;
  visibility: Visibility;
  storageType: StorageType;
  content: string | null;
  r2Key: string | null;
  sizeBytes: number;
  tags: string | null;
  updatedAt: string;
};

export async function updateBlob(db: D1Database, params: UpdateBlobParams): Promise<void> {
  await db
    .prepare(
      `UPDATE blobs SET
        name = ?,
        description = ?,
        visibility = ?,
        storage_type = ?,
        content = ?,
        r2_key = ?,
        size_bytes = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(
      params.name,
      params.description,
      params.visibility,
      params.storageType,
      params.content,
      params.r2Key,
      params.sizeBytes,
      params.tags,
      params.updatedAt,
      params.id,
    )
    .run();
}

export async function softDeleteBlob(
  db: D1Database,
  id: string,
  deletedAt: string,
): Promise<void> {
  await db
    .prepare(`UPDATE blobs SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(deletedAt, deletedAt, id)
    .run();
}

export async function touchLastAccessed(
  db: D1Database,
  id: string,
  accessedAt: string,
): Promise<void> {
  await db
    .prepare(`UPDATE blobs SET last_accessed_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(accessedAt, id)
    .run();
}

export type BlobListItem = {
  id: string;
  name: string | null;
  visibility: string;
  size_bytes: number;
  tags: string | null;
  vault_id: string | null;
  updated_at: string;
};

export async function listBlobsForUser(
  db: D1Database,
  userId: string,
  options: { vaultId?: string; limit: number },
): Promise<BlobListItem[]> {
  const limit = Math.min(Math.max(options.limit, 1), 100);

  if (options.vaultId) {
    const result = await db
      .prepare(
        `SELECT b.id, b.name, b.visibility, b.size_bytes, b.tags, b.vault_id, b.updated_at
         FROM blobs b
         INNER JOIN vaults v ON b.vault_id = v.id
         WHERE b.deleted_at IS NULL
           AND v.deleted_at IS NULL
           AND v.owner_id = ?
           AND b.vault_id = ?
         ORDER BY b.updated_at DESC
         LIMIT ?`,
      )
      .bind(userId, options.vaultId, limit)
      .all<BlobListItem>();
    return result.results ?? [];
  }

  const result = await db
    .prepare(
      `SELECT b.id, b.name, b.visibility, b.size_bytes, b.tags, b.vault_id, b.updated_at
       FROM blobs b
       LEFT JOIN vaults v ON b.vault_id = v.id
       WHERE b.deleted_at IS NULL
         AND (
           b.created_by = ?
           OR (v.id IS NOT NULL AND v.owner_id = ? AND v.deleted_at IS NULL)
         )
       ORDER BY b.updated_at DESC
       LIMIT ?`,
    )
    .bind(userId, userId, limit)
    .all<BlobListItem>();
  return result.results ?? [];
}
