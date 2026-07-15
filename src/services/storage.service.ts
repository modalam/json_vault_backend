import type { StorageType } from '../types/blob';
import { DEFAULT_INLINE_STORAGE_THRESHOLD } from '../constants/limits';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import * as r2 from '../storage/r2.client';

export type StoredPayload = {
  storageType: StorageType;
  content: string | null;
  r2Key: string | null;
};

export function resolveInlineThreshold(envValue: string | undefined): number {
  const parsed = Number(envValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INLINE_STORAGE_THRESHOLD;
}

function requireBucket(bucket: R2Bucket | undefined): R2Bucket {
  if (!bucket) {
    throw new AppError(
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      413,
      'Payload exceeds inline D1 limit and R2 is not configured. Enable R2 and bind BUCKET, or send a smaller JSON body.',
    );
  }
  return bucket;
}

export async function storePayload(
  bucket: R2Bucket | undefined,
  blobId: string,
  serialized: string,
  sizeBytes: number,
  inlineThreshold: number,
  previousR2Key?: string | null,
): Promise<StoredPayload> {
  if (sizeBytes <= inlineThreshold) {
    if (previousR2Key && bucket) {
      await r2.deleteBlobContent(bucket, previousR2Key);
    }
    return {
      storageType: 'inline',
      content: serialized,
      r2Key: null,
    };
  }

  const r2Bucket = requireBucket(bucket);
  const r2Key = await r2.putBlobContent(r2Bucket, blobId, serialized);
  return {
    storageType: 'r2',
    content: null,
    r2Key,
  };
}

export async function loadPayload(
  bucket: R2Bucket | undefined,
  storageType: StorageType,
  content: string | null,
  r2Key: string | null,
): Promise<string> {
  if (storageType === 'inline') {
    if (content === null) {
      throw new Error('Inline blob missing content');
    }
    return content;
  }

  if (!r2Key) {
    throw new Error('R2 blob missing key');
  }

  const remote = await r2.getBlobContent(requireBucket(bucket), r2Key);
  if (remote === null) {
    throw new Error('R2 object not found');
  }
  return remote;
}

export async function removePayload(
  bucket: R2Bucket | undefined,
  storageType: StorageType,
  r2Key: string | null,
): Promise<void> {
  if (storageType === 'r2' && r2Key && bucket) {
    await r2.deleteBlobContent(bucket, r2Key);
  }
}
