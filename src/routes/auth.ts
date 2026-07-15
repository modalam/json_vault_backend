import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from '../handlers/auth';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/refresh', refreshHandler);
authRoutes.post('/logout', logoutHandler);
authRoutes.get('/me', meHandler);
