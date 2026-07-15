import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { updateBlobHandler } from '../handlers/blobs/update';

/** POST /api/v1/updateblobs — body includes id + content */
export const updateBlobsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

updateBlobsRoutes.post('/', updateBlobHandler);
