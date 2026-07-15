import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';

export const healthRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

healthRoutes.get('/', (c) =>
  c.json({
    status: 'healthy',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  }),
);
