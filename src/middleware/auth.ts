import type { Context, Next } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import * as apiKeyService from '../services/api-key.service';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function authMiddleware(c: AppContext, next: Next) {
  c.set('auth', null);

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next();
  }

  if (token.startsWith('jv_')) {
    try {
      const resolved = await apiKeyService.resolveApiKeyAuth(c.env, token);
      if (resolved) {
        c.set('auth', {
          userId: resolved.userId,
          email: resolved.email,
          plan: resolved.plan,
          authType: 'api_key',
          scopes: resolved.scopes,
          apiKeyId: resolved.apiKeyId,
        });
      }
    } catch {
      // Leave auth null; protected routes reject.
    }
    return next();
  }

  try {
    const payload = await verifyAccessToken(c.env, token);
    c.set('auth', {
      userId: payload.sub,
      email: payload.email,
      plan: payload.plan,
      authType: 'jwt',
    });
  } catch {
    // Invalid token — leave auth null; protected routes will reject.
  }

  return next();
}

export function requireAuth(c: AppContext): NonNullable<AppVariables['auth']> {
  const auth = c.get('auth');
  if (!auth) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 401, 'Authentication required.');
  }
  return auth;
}

/** API key management and sensitive account actions require a browser JWT session. */
export function requireJwtAuth(c: AppContext): NonNullable<AppVariables['auth']> {
  const auth = requireAuth(c);
  if (auth.authType !== 'jwt') {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      401,
      'This action requires a user session (JWT), not an API key.',
    );
  }
  return auth;
}

/** Enforce scope when the caller authenticated with an API key. JWT sessions bypass. */
export function requireScope(
  c: AppContext,
  scope: string,
): NonNullable<AppVariables['auth']> {
  const auth = requireAuth(c);
  if (auth.authType === 'jwt') return auth;
  if (!auth.scopes?.includes(scope)) {
    throw new AppError(
      ERROR_CODES.BLOB_ACCESS_DENIED,
      403,
      `API key is missing required scope: ${scope}.`,
      { requiredScope: scope, scopes: auth.scopes ?? [] },
    );
  }
  return auth;
}

/** If an API key is present, require scope; anonymous / JWT without key is unchanged. */
export function assertApiKeyScope(c: AppContext, scope: string): void {
  const auth = c.get('auth');
  if (!auth || auth.authType !== 'api_key') return;
  if (!auth.scopes?.includes(scope)) {
    throw new AppError(
      ERROR_CODES.BLOB_ACCESS_DENIED,
      403,
      `API key is missing required scope: ${scope}.`,
      { requiredScope: scope, scopes: auth.scopes ?? [] },
    );
  }
}
