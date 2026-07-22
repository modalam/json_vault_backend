import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { explainDiffHandler } from '../handlers/ai/diff-explain';

export const aiRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

aiRoutes.post('/diff/explain', explainDiffHandler);
