import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { BlobIdParamSchema, GetBlobSchema } from '../../schemas/blob.schema';
import * as blobService from '../../services/blob.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { SUCCESS_CODES } from '../../constants/success-codes';
import { assertApiKeyScope } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

/** POST /api/v1/getblobs — id in JSON body. */
export async function getBlobsHandler(c: AppContext) {
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

  const parsed = GetBlobSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  assertApiKeyScope(c, 'blobs:read');

  const content = await blobService.getBlobContent(
    c.env,
    parsed.data.id,
    c.get('editToken'),
  );

  return c.json({
    success: SUCCESS_CODES.BLOB_FETCHED,
    message: 'Successfully fetched the blob',
    content,
  });
}

/** Compat: GET /api/jsonBlob/:id — id still in path for legacy clients. */
export async function getBlobContentHandler(c: AppContext) {
  const params = BlobIdParamSchema.safeParse({ id: c.req.param('id') });
  if (!params.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid blob id.');
  }

  const content = await blobService.getBlobContent(c.env, params.data.id, c.get('editToken'));
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(content);
}
