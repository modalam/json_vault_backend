import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';

export const editTokenMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const token = c.req.header('X-Edit-Token') ?? null;
  c.set('editToken', token);

  const ip =
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    '127.0.0.1';
  c.set('clientIp', ip);

  await next();
});
