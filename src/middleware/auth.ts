import type { Context, Next } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function authMiddleware(c: AppContext, next: Next) {
  c.set('auth', null);

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7).trim();
  if (!token || token.startsWith('jv_')) {
    return next();
  }

  try {
    const payload = await verifyAccessToken(c.env, token);
    c.set('auth', {
      userId: payload.sub,
      email: payload.email,
      plan: payload.plan,
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
