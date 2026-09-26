import { createApp } from './app';
import type { Env } from './types/env';
import { expireAnonymousBlobs } from './services/cleanup.service';

const app = createApp();

export default {
  fetch: app.fetch,

  /** Daily cleanup of expired anonymous blobs (Phase 4.7). */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(
      expireAnonymousBlobs(env).then((result) => {
        console.log(
          JSON.stringify({
            level: 'info',
            message: 'Anonymous blob expiration cron finished',
            expired: result.expired,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  },
};
