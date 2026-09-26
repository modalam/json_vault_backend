import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { buildOpenApiDocument } from '../openapi/document';

export const openApiRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

openApiRoutes.get('/openapi.json', (c) => {
  return c.json(buildOpenApiDocument(c.env.API_URL));
});
