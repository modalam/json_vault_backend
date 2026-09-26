import type { Context } from 'hono';
import type { AppVariables, Env } from '../../types/env';
import * as quotaService from '../../services/quota.service';
import { requireAuth, requireScope } from '../../middleware/auth';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function getUsageHandler(c: AppContext) {
  const auth = requireAuth(c);
  if (auth.authType === 'api_key') {
    requireScope(c, 'users:read');
  }

  const data = await quotaService.getUsageReport(c.env, auth.userId, auth.plan);
  return c.json({ data });
}
