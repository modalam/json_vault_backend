export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
};

export type InsertRefreshTokenParams = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export async function insertRefreshToken(
  db: D1Database,
  params: InsertRefreshTokenParams,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(params.id, params.userId, params.tokenHash, params.expiresAt, params.createdAt)
    .run();
}

export async function findRefreshTokenByHash(
  db: D1Database,
  tokenHash: string,
): Promise<RefreshTokenRow | null> {
  return db
    .prepare(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now')`,
    )
    .bind(tokenHash)
    .first<RefreshTokenRow>();
}

export async function revokeRefreshToken(db: D1Database, id: string, revokedAt: string): Promise<void> {
  await db
    .prepare(`UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?`)
    .bind(revokedAt, id)
    .run();
}
