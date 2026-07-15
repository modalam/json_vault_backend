import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import * as blobQueries from '../../db/queries/blobs';
import { requireAuth } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export async function listBlobsHandler(c: AppContext) {
  const auth = requireAuth(c);
  const vaultId = c.req.query('vaultId') ?? undefined;
  const limit = Number(c.req.query('limit') ?? '20');

  const rows = await blobQueries.listBlobsForUser(c.env.DB, auth.userId, {
    vaultId,
    limit: Number.isFinite(limit) ? limit : 20,
  });

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      name: row.name,
      visibility: row.visibility,
      sizeBytes: row.size_bytes,
      tags: parseTags(row.tags),
      vaultId: row.vault_id,
      updatedAt: row.updated_at,
    })),
    pagination: {
      cursor: null,
      hasMore: false,
      total: rows.length,
    },
  });
}
