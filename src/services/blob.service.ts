import type { Env } from '../types/env';
import type { BlobResponse, BlobRow } from '../types/blob';
import type { CreateBlobInput, UpdateBlobInput } from '../schemas/blob.schema';
import * as blobQueries from '../db/queries/blobs';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import { createBlobId, createEditToken } from '../utils/id';
import { sha256Hex, timingSafeEqual } from '../utils/hash';
import { nowIso, parseJsonString, validateJsonContent } from '../utils/json';
import {
  DEFAULT_MAX_BLOB_SIZE_BYTES,
} from '../constants/limits';
import {
  loadPayload,
  removePayload,
  resolveInlineThreshold,
  storePayload,
} from './storage.service';

function maxBlobSize(env: Env): number {
  const parsed = Number(env.MAX_BLOB_SIZE_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BLOB_SIZE_BYTES;
}

function parseTags(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function toResponse(
  env: Env,
  row: BlobRow,
  content?: unknown,
  editToken?: string,
): BlobResponse {
  const response: BlobResponse = {
    id: row.id,
    url: `${env.FRONTEND_URL}/b/${row.id}`,
    apiUrl: `${env.API_URL}/api/v1/blobs/${row.id}/content`,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    tags: parseTags(row.tags),
    sizeBytes: row.size_bytes,
    vaultId: row.vault_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (content !== undefined) {
    response.content = content;
  }
  if (editToken) {
    response.editToken = editToken;
  }
  return response;
}

async function assertCanMutate(row: BlobRow, editToken: string | null): Promise<void> {
  if (!editToken || !row.edit_token_hash) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      401,
      'Edit token required to modify this blob.',
    );
  }
  const hash = await sha256Hex(editToken);
  if (!timingSafeEqual(hash, row.edit_token_hash)) {
    throw new AppError(ERROR_CODES.INVALID_EDIT_TOKEN, 401, 'Edit token is invalid.');
  }
}

/** Private blobs without a valid edit token look like missing resources (IDOR-safe). */
async function assertCanAccessPrivate(
  row: BlobRow,
  editToken: string | null,
): Promise<void> {
  if (row.visibility !== 'private') {
    return;
  }
  if (!editToken || !row.edit_token_hash) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }
  const hash = await sha256Hex(editToken);
  if (!timingSafeEqual(hash, row.edit_token_hash)) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }
}

export async function createBlob(
  env: Env,
  input: CreateBlobInput,
  options?: { userId?: string | null; vaultId?: string | null },
): Promise<BlobResponse> {
  const validated = validateJsonContent(input.content, maxBlobSize(env));
  const id = createBlobId();
  const editToken = createEditToken();
  const editTokenHash = await sha256Hex(editToken);
  const timestamp = nowIso();
  const inlineThreshold = resolveInlineThreshold(env.INLINE_STORAGE_THRESHOLD);
  const stored = await storePayload(
    env.BUCKET,
    id,
    validated.serialized,
    validated.sizeBytes,
    inlineThreshold,
  );

  const userId = options?.userId ?? null;
  const vaultId = options?.vaultId ?? input.vaultId ?? null;
  const expiresAt = userId
    ? null
    : new Date(
        Date.now() + (Number(env.ANONYMOUS_BLOB_TTL_DAYS) || 90) * 86_400_000,
      ).toISOString();

  await blobQueries.insertBlob(env.DB, {
    id,
    vaultId,
    createdBy: userId,
    name: input.name ?? null,
    description: input.description ?? null,
    visibility: input.visibility,
    storageType: stored.storageType,
    content: stored.content,
    r2Key: stored.r2Key,
    sizeBytes: validated.sizeBytes,
    editTokenHash,
    tags: JSON.stringify(input.tags ?? []),
    expiresAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const row = await blobQueries.findBlobById(env.DB, id);
  if (!row) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to create blob.');
  }

  return toResponse(env, row, validated.value, editToken);
}

export async function getBlobMetadata(env: Env, id: string, editToken: string | null) {
  const row = await blobQueries.findBlobById(env.DB, id);
  if (!row) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }

  await assertCanAccessPrivate(row, editToken);
  return toResponse(env, row);
}

export async function getBlobContent(
  env: Env,
  id: string,
  editToken: string | null,
): Promise<unknown> {
  const row = await blobQueries.findBlobById(env.DB, id);
  if (!row) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }

  await assertCanAccessPrivate(row, editToken);
  await blobQueries.touchLastAccessed(env.DB, id, nowIso());

  const raw = await loadPayload(env.BUCKET, row.storage_type, row.content, row.r2_key);
  return parseJsonString(raw);
}

export async function updateBlob(
  env: Env,
  id: string,
  input: Omit<UpdateBlobInput, 'id'>,
  editToken: string | null,
): Promise<BlobResponse> {
  const row = await blobQueries.findBlobById(env.DB, id);
  if (!row) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }

  await assertCanMutate(row, editToken);

  const validated = validateJsonContent(input.content, maxBlobSize(env));
  const inlineThreshold = resolveInlineThreshold(env.INLINE_STORAGE_THRESHOLD);
  const stored = await storePayload(
    env.BUCKET,
    id,
    validated.serialized,
    validated.sizeBytes,
    inlineThreshold,
    row.r2_key,
  );

  const updatedAt = nowIso();
  await blobQueries.updateBlob(env.DB, {
    id,
    name: input.name !== undefined ? input.name : row.name,
    description: input.description !== undefined ? input.description : row.description,
    visibility: input.visibility ?? row.visibility,
    storageType: stored.storageType,
    content: stored.content,
    r2Key: stored.r2Key,
    sizeBytes: validated.sizeBytes,
    tags: input.tags !== undefined ? JSON.stringify(input.tags) : row.tags,
    updatedAt,
  });

  const updated = await blobQueries.findBlobById(env.DB, id);
  if (!updated) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to update blob.');
  }

  return toResponse(env, updated, validated.value);
}

export async function deleteBlob(
  env: Env,
  id: string,
  editToken: string | null,
): Promise<void> {
  const row = await blobQueries.findBlobById(env.DB, id);
  if (!row) {
    throw new AppError(ERROR_CODES.BLOB_NOT_FOUND, 404, 'No blob exists with the given ID.');
  }

  await assertCanMutate(row, editToken);
  await blobQueries.softDeleteBlob(env.DB, id, nowIso());
  await removePayload(env.BUCKET, row.storage_type, row.r2_key);
}
