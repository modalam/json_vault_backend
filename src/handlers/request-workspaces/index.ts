import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { PutRequestWorkspaceSchema } from '../../schemas/request-workspace.schema';
import * as requestWorkspaceService from '../../services/request-workspace.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { requireAuth } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function getRequestWorkspaceHandler(c: AppContext) {
  const auth = requireAuth(c);
  const state = await requestWorkspaceService.getRequestWorkspaceState(c.env, auth.userId);
  return c.json({ data: state });
}

export async function putRequestWorkspaceHandler(c: AppContext) {
  const auth = requireAuth(c);

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

  const parsed = PutRequestWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await requestWorkspaceService.saveRequestWorkspaceState(
    c.env,
    auth.userId,
    parsed.data.state,
  );

  return c.json({ data: { updatedAt: result.updatedAt } });
}
