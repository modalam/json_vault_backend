import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { listVaultsHandler } from '../handlers/vaults/list';

export const vaultRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

vaultRoutes.get('/', listVaultsHandler);
