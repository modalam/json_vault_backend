import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { getBlobsHandler } from '../handlers/blobs/get';
import { createRateLimitMiddleware } from '../middleware/rate-limit';

/** POST /api/v1/getblobs — body: { "id": "..." } */
export const getBlobsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

getBlobsRoutes.post('/', createRateLimitMiddleware('read'), getBlobsHandler);
