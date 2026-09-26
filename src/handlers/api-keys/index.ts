import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { CreateApiKeySchema } from '../../services/api-key.service';
import * as apiKeyService from '../../services/api-key.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { requireJwtAuth } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

async function parseJsonBody(c: AppContext): Promise<unknown> {
  const contentType = c.req.header('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new AppError(
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      415,
      'Content-Type must be application/json.',
    );
  }
  try {
    return await c.req.json();
  } catch {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Request body is not valid JSON.');
  }
}

export async function createApiKeyHandler(c: AppContext) {
  const auth = requireJwtAuth(c);
  const body = await parseJsonBody(c);
  const parsed = CreateApiKeySchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await apiKeyService.createApiKey(
    c.env,
    auth.userId,
    parsed.data,
    c.get('clientIp'),
  );
  return c.json({ data: result }, 201);
}

export async function listApiKeysHandler(c: AppContext) {
  const auth = requireJwtAuth(c);
  const keys = await apiKeyService.listApiKeys(c.env, auth.userId);
  return c.json({ data: keys });
}

export async function revokeApiKeyHandler(c: AppContext) {
  const auth = requireJwtAuth(c);
  const id = c.req.param('id');
  if (!id) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'API key id is required.');
  }

  await apiKeyService.revokeApiKey(c.env, auth.userId, id, c.get('clientIp'));
  return c.body(null, 204);
}
