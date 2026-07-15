import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { listBlobsHandler } from '../handlers/blobs/list';

export const blobListRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

blobListRoutes.get('/', listBlobsHandler);
