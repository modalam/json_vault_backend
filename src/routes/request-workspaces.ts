import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import {
  getRequestWorkspaceHandler,
  putRequestWorkspaceHandler,
} from '../handlers/request-workspaces';

export const requestWorkspaceRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

requestWorkspaceRoutes.get('/', getRequestWorkspaceHandler);
requestWorkspaceRoutes.put('/', putRequestWorkspaceHandler);
