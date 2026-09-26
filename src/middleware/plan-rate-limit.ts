import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import { resolvePlanLimits } from '../services/quota.service';

/**
 * Per-user request rate limit for authenticated callers (JWT or API key).
 * Anonymous traffic keeps using the existing IP-based middleware on select routes.
 */
export const planRateLimitMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const auth = c.get('auth');
  if (!auth) {
    return next();
  }

  const limits = resolvePlanLimits(auth.plan);
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = 60;
  const windowId = Math.floor(now / windowSeconds);
  const kvKey = `ratelimit:user:min:${auth.userId}:${windowId}`;
  const reset = (windowId + 1) * windowSeconds;

  const currentRaw = await c.env.KV.get(kvKey);
  const current = currentRaw ? Number(currentRaw) : 0;
  const nextCount = current + 1;

  if (nextCount > limits.requestsPerMinute) {
    c.header('X-RateLimit-Limit', String(limits.requestsPerMinute));
    c.header('X-RateLimit-Remaining', '0');
    c.header('X-RateLimit-Reset', String(reset));
    c.header('Retry-After', String(Math.max(reset - now, 1)));
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      429,
      `Plan rate limit exceeded (${limits.requestsPerMinute} req/min on ${limits.plan}).`,
    );
  }

  await c.env.KV.put(kvKey, String(nextCount), { expirationTtl: windowSeconds + 5 });
  c.header('X-RateLimit-Limit', String(limits.requestsPerMinute));
  c.header('X-RateLimit-Remaining', String(Math.max(limits.requestsPerMinute - nextCount, 0)));
  c.header('X-RateLimit-Reset', String(reset));

  await next();
});
