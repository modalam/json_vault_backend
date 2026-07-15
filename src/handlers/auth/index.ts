import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import { RegisterSchema, LoginSchema, RefreshSchema, LogoutSchema } from '../../schemas/auth.schema';
import * as authService from '../../services/auth.service';
import { AppError } from '../../utils/errors';
import { ERROR_CODES } from '../../constants/error-codes';
import { requireAuth } from '../../middleware/auth';

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

export async function registerHandler(c: AppContext) {
  const body = await parseJsonBody(c);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await authService.register(c.env, parsed.data);
  return c.json({ data: result }, 201);
}

export async function loginHandler(c: AppContext) {
  const body = await parseJsonBody(c);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await authService.login(c.env, parsed.data);
  return c.json({ data: result });
}

export async function refreshHandler(c: AppContext) {
  const body = await parseJsonBody(c);
  const parsed = RefreshSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await authService.refresh(c.env, parsed.data.refreshToken);
  return c.json({ data: result });
}

export async function logoutHandler(c: AppContext) {
  requireAuth(c);
  const body = await parseJsonBody(c);
  const parsed = LogoutSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Request body is invalid.', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  await authService.logout(c.env, parsed.data.refreshToken);
  return c.body(null, 204);
}

export async function meHandler(c: AppContext) {
  const auth = requireAuth(c);
  const user = await authService.getMe(c.env, auth.userId);
  return c.json({ data: user });
}
