import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { createBlobsRoutes } from './createblobs';
import { getBlobsRoutes } from './getblobs';
import { updateBlobsRoutes } from './updateblobs';
import { deleteBlobsRoutes } from './deleteblobs';
import { healthRoutes } from './health';
import { jsonBlobCompatRoutes } from './jsonblob';
import { authRoutes } from './auth';
import { vaultRoutes } from './vaults';
import { blobListRoutes } from './blobs';

export const apiRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

apiRoutes.route('/v1/auth', authRoutes);
apiRoutes.route('/v1/vaults', vaultRoutes);
apiRoutes.route('/v1/blobs', blobListRoutes);
apiRoutes.route('/v1/createblobs', createBlobsRoutes);
apiRoutes.route('/v1/getblobs', getBlobsRoutes);
apiRoutes.route('/v1/updateblobs', updateBlobsRoutes);
apiRoutes.route('/v1/deleteblobs', deleteBlobsRoutes);
apiRoutes.route('/v1/health', healthRoutes);
apiRoutes.route('/jsonBlob', jsonBlobCompatRoutes);
