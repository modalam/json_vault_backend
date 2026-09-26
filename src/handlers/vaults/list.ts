import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import * as vaultService from '../../services/vault.service';
import { requireScope } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function listVaultsHandler(c: AppContext) {
  const auth = requireScope(c, 'vaults:read');
  const vaults = await vaultService.listVaultsForUser(c.env, auth.userId);
  return c.json({ data: vaults });
}
