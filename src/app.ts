import { Hono } from 'hono';
import type { AppVariables, Env } from './types/env';
import { requestIdMiddleware } from './middleware/request-id';
import { loggerMiddleware } from './middleware/logger';
import { secureHeadersMiddleware } from './middleware/secure-headers';
import { createCorsMiddleware } from './middleware/cors';
import { editTokenMiddleware } from './middleware/edit-token';
import { authMiddleware } from './middleware/auth';
import { planRateLimitMiddleware } from './middleware/plan-rate-limit';
import { apiRoutes } from './routes';
import { healthRoutes } from './routes/health';
import { AppError } from './utils/errors';
import { ERROR_CODES } from './constants/error-codes';
import { captureException } from './utils/sentry';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', requestIdMiddleware);
  app.use('*', loggerMiddleware);
  app.use('*', secureHeadersMiddleware);
  app.use('*', async (c, next) => {
    const corsMw = createCorsMiddleware(c.env);
    return corsMw(c, next);
  });
  app.use('*', editTokenMiddleware);
  app.use('*', authMiddleware);
  app.use('/api/v1/*', planRateLimitMiddleware);

  app.route('/health', healthRoutes);
  app.route('/api', apiRoutes);

  app.notFound((c) =>
    c.json(
      {
        error: {
          code: 'BLOB_NOT_FOUND',
          message: 'Resource not found.',
          requestId: c.get('requestId'),
        },
      },
      404,
    ),
  );

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            requestId: c.get('requestId'),
            details: err.details ?? {},
          },
        },
        err.statusCode as 400 | 401 | 402 | 403 | 404 | 409 | 413 | 415 | 429 | 500,
      );
    }

    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Unhandled error',
        requestId: c.get('requestId'),
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      }),
    );

    void captureException(c.env, err, { requestId: c.get('requestId') });

    return c.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred.',
          requestId: c.get('requestId'),
        },
      },
      500,
    );
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
