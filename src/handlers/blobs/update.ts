import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { BlobIdParamSchema, UpdateBlobSchema } from '../../schemas/blob.schema';
import * as blobService from '../../services/blob.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { SUCCESS_CODES } from '../../constants/success-codes';
import { assertApiKeyScope } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

/** POST /api/v1/updateblobs — id in JSON body. */
export async function updateBlobHandler(c: AppContext) {
  const contentType = c.req.header('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      415,
      'Content-Type must be application/json.',
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Request body is not valid JSON.');
  }

  const parsed = UpdateBlobSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  assertApiKeyScope(c, 'blobs:write');

  const { id, ...updateInput } = parsed.data;
  await blobService.updateBlob(c.env, id, updateInput, c.get('editToken'));

  return c.json({
    success: SUCCESS_CODES.BLOB_UPDATED,
    message: 'Successfully updated the blob',
  });
}

/** Compat: POST /api/jsonBlob/:id — id in path. */
export async function updateBlobCompatHandler(c: AppContext) {
  const params = BlobIdParamSchema.safeParse({ id: c.req.param('id') });
  if (!params.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid blob id.');
  }

  const contentType = c.req.header('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      415,
      'Content-Type must be application/json.',
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Request body is not valid JSON.');
  }

  const candidate =
    body !== null && typeof body === 'object' && !Array.isArray(body) && 'content' in body
      ? { ...(body as Record<string, unknown>), id: params.data.id }
      : { id: params.data.id, content: body };

  const parsed = UpdateBlobSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { id, ...updateInput } = parsed.data;
  await blobService.updateBlob(c.env, id, updateInput, c.get('editToken'));

  return c.json({
    success: SUCCESS_CODES.BLOB_UPDATED,
    message: 'Successfully updated the blob',
  });
}
