import type { VaultRow } from '../../types/auth';

export type InsertVaultParams = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export async function insertVault(db: D1Database, params: InsertVaultParams): Promise<void> {
  await db
    .prepare(
      `INSERT INTO vaults (id, owner_id, name, slug, description, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      params.id,
      params.ownerId,
      params.name,
      params.slug,
      params.description,
      params.type,
      params.createdAt,
      params.updatedAt,
    )
    .run();
}

export async function listVaultsByOwner(db: D1Database, ownerId: string): Promise<VaultRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM vaults WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    )
    .bind(ownerId)
    .all<VaultRow>();
  return result.results ?? [];
}

export async function findVaultById(
  db: D1Database,
  id: string,
  ownerId: string,
): Promise<VaultRow | null> {
  return db
    .prepare(`SELECT * FROM vaults WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`)
    .bind(id, ownerId)
    .first<VaultRow>();
}

export async function countBlobsInVault(db: D1Database, vaultId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) as count FROM blobs WHERE vault_id = ? AND deleted_at IS NULL`)
    .bind(vaultId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}
