import type { Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import { PLAN_LIMITS, type PlanName } from '../constants/limits';
import { getUserUsageStats } from '../db/queries/usage';

export function resolvePlanLimits(plan: string) {
  const key = (plan in PLAN_LIMITS ? plan : 'free') as PlanName;
  return { plan: key, ...PLAN_LIMITS[key] };
}

export async function getUsageReport(env: Env, userId: string, plan: string) {
  const stats = await getUserUsageStats(env.DB, userId);
  const limits = resolvePlanLimits(plan);
  return {
    plan: limits.plan,
    blobs: {
      used: stats.blobCount,
      limit: limits.maxBlobs,
    },
    storage: {
      usedBytes: stats.storageBytes,
      limitBytes: limits.maxStorageBytes,
    },
    rateLimit: {
      requestsPerMinute: limits.requestsPerMinute,
    },
  };
}

export async function assertCanCreateBlob(
  env: Env,
  userId: string,
  plan: string,
  additionalBytes: number,
): Promise<void> {
  const report = await getUsageReport(env, userId, plan);
  if (report.blobs.used >= report.blobs.limit) {
    throw new AppError(
      ERROR_CODES.QUOTA_EXCEEDED,
      402,
      `Blob quota exceeded (${report.blobs.used}/${report.blobs.limit} on the ${report.plan} plan). Upgrade to create more blobs.`,
      { plan: report.plan, used: report.blobs.used, limit: report.blobs.limit },
    );
  }
  if (report.storage.usedBytes + additionalBytes > report.storage.limitBytes) {
    throw new AppError(
      ERROR_CODES.QUOTA_EXCEEDED,
      402,
      `Storage quota exceeded on the ${report.plan} plan. Upgrade or delete blobs to free space.`,
      {
        plan: report.plan,
        usedBytes: report.storage.usedBytes,
        limitBytes: report.storage.limitBytes,
      },
    );
  }
}
