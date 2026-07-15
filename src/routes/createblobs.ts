import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { createBlobHandler } from '../handlers/blobs/create';
import { createRateLimitMiddleware } from '../middleware/rate-limit';

/** POST /api/v1/createblobs */
export const createBlobsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

createBlobsRoutes.post('/', createRateLimitMiddleware('create'), createBlobHandler);
