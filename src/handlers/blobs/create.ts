import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { CreateBlobSchema } from '../../schemas/blob.schema';
import * as blobService from '../../services/blob.service';
import * as authService from '../../services/auth.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { SUCCESS_CODES } from '../../constants/success-codes';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function createBlobHandler(c: AppContext) {
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

  // Support raw JSON body (jsonblob-style) as content
  const candidate =
    body !== null && typeof body === 'object' && !Array.isArray(body) && 'content' in body
      ? body
      : { content: body };

  const parsed = CreateBlobSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const auth = c.get('auth');
  let vaultId: string | null = parsed.data.vaultId ?? null;
  if (auth && !vaultId) {
    vaultId = await authService.getDefaultVaultId(c.env, auth.userId);
  }

  const result = await blobService.createBlob(c.env, parsed.data, {
    userId: auth?.userId ?? null,
    vaultId,
  });
  c.header('Location', `${c.env.API_URL}/api/v1/blobs/${result.id}`);

  return c.json(
    {
      success: SUCCESS_CODES.BLOB_CREATED,
      message: 'Successfully created the blob',
      editToken: result.editToken ?? '',
      id: result.id,
    },
    201,
  );
}
