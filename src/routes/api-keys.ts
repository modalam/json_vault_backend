import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import {
  createApiKeyHandler,
  listApiKeysHandler,
  revokeApiKeyHandler,
} from '../handlers/api-keys';

export const apiKeyRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

apiKeyRoutes.post('/', createApiKeyHandler);
apiKeyRoutes.get('/', listApiKeysHandler);
apiKeyRoutes.delete('/:id', revokeApiKeyHandler);
