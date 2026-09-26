import { z } from 'zod';
import type { Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import {
  API_KEY_SCOPES,
  DEFAULT_API_KEY_SCOPES,
  MAX_API_KEYS_PER_USER,
  type ApiKeyScope,
} from '../constants/limits';
import * as apiKeyQueries from '../db/queries/api-keys';
import { findUserById } from '../db/queries/users';
import { sha256Hex } from '../utils/hash';
import { createApiKeyId, createApiKeySecret } from '../utils/id';
import { writeAuditLog } from './audit.service';

const ScopeSchema = z.enum([
  'blobs:read',
  'blobs:write',
  'vaults:read',
  'vaults:write',
  'users:read',
]);

export const CreateApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(ScopeSchema).min(1).max(API_KEY_SCOPES.length).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

function parseScopes(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function toPublicKey(row: apiKeyQueries.ApiKeyRow) {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: parseScopes(row.scopes),
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function createApiKey(
  env: Env,
  userId: string,
  input: CreateApiKeyInput,
  ipAddress?: string | null,
) {
  const count = await apiKeyQueries.countApiKeysForUser(env.DB, userId);
  if (count >= MAX_API_KEYS_PER_USER) {
    throw new AppError(
      ERROR_CODES.QUOTA_EXCEEDED,
      402,
      `API key limit reached (${MAX_API_KEYS_PER_USER} active keys). Revoke an unused key first.`,
    );
  }

  const scopes = (input.scopes?.length ? input.scopes : DEFAULT_API_KEY_SCOPES) as ApiKeyScope[];
  const rawKey = createApiKeySecret(env.ENVIRONMENT);
  const keyHash = await sha256Hex(rawKey);
  const id = createApiKeyId();
  const createdAt = new Date().toISOString();
  const keyPrefix = rawKey.slice(0, 12);

  await apiKeyQueries.insertApiKey(env.DB, {
    id,
    userId,
    name: input.name,
    keyPrefix,
    keyHash,
    scopes,
    expiresAt: input.expiresAt ?? null,
    createdAt,
  });

  await writeAuditLog(env, {
    userId,
    action: 'api_key.create',
    resourceType: 'api_key',
    resourceId: id,
    metadata: { name: input.name, scopes },
    ipAddress,
  });

  return {
    ...toPublicKey({
      id,
      user_id: userId,
      name: input.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: JSON.stringify(scopes),
      last_used_at: null,
      expires_at: input.expiresAt ?? null,
      created_at: createdAt,
      revoked_at: null,
    }),
    key: rawKey,
  };
}

export async function listApiKeys(env: Env, userId: string) {
  const rows = await apiKeyQueries.listApiKeysForUser(env.DB, userId);
  return rows.map(toPublicKey);
}

export async function revokeApiKey(
  env: Env,
  userId: string,
  keyId: string,
  ipAddress?: string | null,
): Promise<void> {
  const revoked = await apiKeyQueries.revokeApiKey(
    env.DB,
    keyId,
    userId,
    new Date().toISOString(),
  );
  if (!revoked) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'API key not found.');
  }

  await writeAuditLog(env, {
    userId,
    action: 'api_key.revoke',
    resourceType: 'api_key',
    resourceId: keyId,
    ipAddress,
  });
}

export async function resolveApiKeyAuth(
  env: Env,
  rawKey: string,
): Promise<{
  userId: string;
  email: string;
  plan: string;
  scopes: string[];
  apiKeyId: string;
} | null> {
  if (!rawKey.startsWith('jv_')) return null;

  const keyHash = await sha256Hex(rawKey);
  const row = await apiKeyQueries.findApiKeyByHash(env.DB, keyHash);
  if (!row) return null;

  const user = await findUserById(env.DB, row.user_id);
  if (!user || user.deleted_at) return null;

  void apiKeyQueries.touchApiKeyLastUsed(env.DB, row.id, new Date().toISOString());

  return {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    scopes: parseScopes(row.scopes),
    apiKeyId: row.id,
  };
}
