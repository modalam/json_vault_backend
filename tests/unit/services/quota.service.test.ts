import { describe, expect, it } from 'vitest';
import { resolvePlanLimits } from '../../../src/services/quota.service';
import { CreateApiKeySchema } from '../../../src/services/api-key.service';

describe('resolvePlanLimits', () => {
  it('returns free limits by default', () => {
    const limits = resolvePlanLimits('free');
    expect(limits.maxBlobs).toBe(50);
    expect(limits.maxStorageBytes).toBe(10 * 1024 * 1024);
    expect(limits.requestsPerMinute).toBe(100);
  });

  it('returns pro limits', () => {
    const limits = resolvePlanLimits('pro');
    expect(limits.maxBlobs).toBe(500);
    expect(limits.requestsPerMinute).toBe(1000);
  });

  it('falls back to free for unknown plans', () => {
    expect(resolvePlanLimits('enterprise').plan).toBe('free');
  });
});

describe('CreateApiKeySchema', () => {
  it('accepts default-shaped payloads', () => {
    const parsed = CreateApiKeySchema.safeParse({ name: 'CI' });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty name', () => {
    const parsed = CreateApiKeySchema.safeParse({ name: '  ' });
    expect(parsed.success).toBe(false);
  });
});
