import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { deleteBlobHandler } from '../handlers/blobs/delete';

/** POST /api/v1/deleteblobs — body: { "id": "..." } */
export const deleteBlobsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

deleteBlobsRoutes.post('/', deleteBlobHandler);
