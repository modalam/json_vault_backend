import type { Env } from '../types/env';

/** Lightweight Sentry hook — no-ops unless SENTRY_DSN is configured. */
export async function captureException(
  env: Env,
  error: unknown,
  extra?: Record<string, unknown>,
): Promise<void> {
  const dsn = env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    // Placeholder: wire @sentry/cloudflare when DSN is provisioned.
    console.error(
      JSON.stringify({
        level: 'error',
        sentry: true,
        message,
        stack,
        environment: env.ENVIRONMENT,
        ...extra,
      }),
    );
  } catch {
    // Never throw from error reporting.
  }
}
