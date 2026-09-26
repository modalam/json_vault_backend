import type { ApiKeyScope } from '../../constants/limits';

export type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type InsertApiKeyParams = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: ApiKeyScope[];
  expiresAt: string | null;
  createdAt: string;
};

export async function insertApiKey(db: D1Database, params: InsertApiKeyParams): Promise<void> {
  await db
    .prepare(
      `INSERT INTO api_keys (
        id, user_id, name, key_prefix, key_hash, scopes, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      params.id,
      params.userId,
      params.name,
      params.keyPrefix,
      params.keyHash,
      JSON.stringify(params.scopes),
      params.expiresAt,
      params.createdAt,
    )
    .run();
}

export async function findApiKeyByHash(
  db: D1Database,
  keyHash: string,
): Promise<ApiKeyRow | null> {
  return db
    .prepare(
      `SELECT * FROM api_keys
       WHERE key_hash = ?
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    )
    .bind(keyHash)
    .first<ApiKeyRow>();
}

export async function listApiKeysForUser(db: D1Database, userId: string): Promise<ApiKeyRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM api_keys
       WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY created_at DESC`,
    )
    .bind(userId)
    .all<ApiKeyRow>();
  return result.results ?? [];
}

export async function countApiKeysForUser(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM api_keys
       WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .bind(userId)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function findApiKeyByIdForUser(
  db: D1Database,
  id: string,
  userId: string,
): Promise<ApiKeyRow | null> {
  return db
    .prepare(
      `SELECT * FROM api_keys
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .bind(id, userId)
    .first<ApiKeyRow>();
}

export async function revokeApiKey(
  db: D1Database,
  id: string,
  userId: string,
  revokedAt: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE api_keys SET revoked_at = ?
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .bind(revokedAt, id, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function touchApiKeyLastUsed(
  db: D1Database,
  id: string,
  usedAt: string,
): Promise<void> {
  await db
    .prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`)
    .bind(usedAt, id)
    .run();
}
