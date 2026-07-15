import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';
import { createRequestId } from '../utils/id';

export const requestIdMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const incoming = c.req.header('X-Request-Id');
  const requestId = incoming && incoming.length > 0 ? incoming : createRequestId();
  c.set('requestId', requestId);
  await next();
  c.header('X-Request-Id', requestId);
});
