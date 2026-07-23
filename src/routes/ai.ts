import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { explainDiffHandler } from '../handlers/ai/diff-explain';
import { explainJsonHandler } from '../handlers/ai/json-explain';

export const aiRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

aiRoutes.post('/diff/explain', explainDiffHandler);
aiRoutes.post('/json/explain', explainJsonHandler);
