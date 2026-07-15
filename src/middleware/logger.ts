import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';

export const loggerMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const started = Date.now();
  await next();
  const durationMs = Date.now() - started;
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'request',
      requestId: c.get('requestId'),
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      durationMs,
      timestamp: new Date().toISOString(),
    }),
  );
});
