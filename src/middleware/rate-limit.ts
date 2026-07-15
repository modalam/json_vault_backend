import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import {
  ANONYMOUS_CREATE_LIMIT,
  ANONYMOUS_CREATE_WINDOW_SECONDS,
  ANONYMOUS_READ_LIMIT,
  ANONYMOUS_READ_WINDOW_SECONDS,
} from '../constants/limits';

type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
  keyPrefix: string;
};

async function consumeRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig,
): Promise<{ remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / config.windowSeconds);
  const kvKey = `ratelimit:${config.keyPrefix}:${key}:${windowId}`;
  const reset = (windowId + 1) * config.windowSeconds;

  const currentRaw = await kv.get(kvKey);
  const current = currentRaw ? Number(currentRaw) : 0;
  const next = current + 1;

  if (next > config.limit) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      429,
      `Too many requests. Please try again in ${Math.max(reset - now, 1)} seconds.`,
    );
  }

  await kv.put(kvKey, String(next), { expirationTtl: config.windowSeconds + 5 });

  return {
    remaining: Math.max(config.limit - next, 0),
    reset,
  };
}

export function createRateLimitMiddleware(kind: 'create' | 'read') {
  const config: RateLimitConfig =
    kind === 'create'
      ? {
          limit: ANONYMOUS_CREATE_LIMIT,
          windowSeconds: ANONYMOUS_CREATE_WINDOW_SECONDS,
          keyPrefix: 'ip:create:day',
        }
      : {
          limit: ANONYMOUS_READ_LIMIT,
          windowSeconds: ANONYMOUS_READ_WINDOW_SECONDS,
          keyPrefix: 'ip:read:min',
        };

  return createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
    const ip = c.get('clientIp') || 'unknown';
    try {
      const result = await consumeRateLimit(c.env.KV, ip, config);
      c.header('X-RateLimit-Limit', String(config.limit));
      c.header('X-RateLimit-Remaining', String(result.remaining));
      c.header('X-RateLimit-Reset', String(result.reset));
    } catch (error) {
      if (error instanceof AppError && error.code === ERROR_CODES.RATE_LIMITED) {
        const now = Math.floor(Date.now() / 1000);
        const windowId = Math.floor(now / config.windowSeconds);
        const reset = (windowId + 1) * config.windowSeconds;
        c.header('X-RateLimit-Limit', String(config.limit));
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', String(reset));
        c.header('Retry-After', String(Math.max(reset - now, 1)));
      }
      throw error;
    }
    await next();
  });
}
