import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { createBlobHandler } from '../handlers/blobs/create';
import { getBlobContentHandler } from '../handlers/blobs/get';
import { updateBlobCompatHandler } from '../handlers/blobs/update';
import { deleteBlobCompatHandler } from '../handlers/blobs/delete';
import { createRateLimitMiddleware } from '../middleware/rate-limit';

/**
 * jsonblob-style paths with POST-only mutations.
 * POST /api/jsonBlob
 * GET  /api/jsonBlob/:id
 * POST /api/jsonBlob/:id          (update)
 * POST /api/jsonBlob/:id/delete   (delete)
 */
export const jsonBlobCompatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

jsonBlobCompatRoutes.post('/', createRateLimitMiddleware('create'), createBlobHandler);
jsonBlobCompatRoutes.get('/:id', createRateLimitMiddleware('read'), getBlobContentHandler);
jsonBlobCompatRoutes.post('/:id/delete', deleteBlobCompatHandler);
jsonBlobCompatRoutes.post('/:id', updateBlobCompatHandler);
