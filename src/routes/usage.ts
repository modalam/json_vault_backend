import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { getUsageHandler } from '../handlers/usage';

export const usageRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

usageRoutes.get('/', getUsageHandler);
