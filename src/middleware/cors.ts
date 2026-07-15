import { cors } from 'hono/cors';
import type { Env } from '../types/env';

export function createCorsMiddleware(env: Env) {
  const origins = env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return cors({
    origin: (origin) => {
      if (!origin) {
        return origins[0] ?? '*';
      }
      return origins.includes(origin) ? origin : origins[0] ?? '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'X-Edit-Token', 'X-Request-Id'],
    exposeHeaders: [
      'Location',
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    maxAge: 86_400,
    credentials: true,
  });
}
