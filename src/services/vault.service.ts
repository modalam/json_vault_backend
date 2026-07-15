import type { Env } from '../types/env';
import * as vaultQueries from '../db/queries/vaults';

export async function listVaultsForUser(env: Env, userId: string) {
  const vaults = await vaultQueries.listVaultsByOwner(env.DB, userId);
  return Promise.all(
    vaults.map(async (vault) => ({
      id: vault.id,
      name: vault.name,
      slug: vault.slug,
      description: vault.description,
      type: vault.type,
      ownerId: vault.owner_id,
      role: 'owner' as const,
      blobCount: await vaultQueries.countBlobsInVault(env.DB, vault.id),
      createdAt: vault.created_at,
    })),
  );
}
