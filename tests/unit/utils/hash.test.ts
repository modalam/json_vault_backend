import { describe, expect, it } from 'vitest';
import { sha256Hex, timingSafeEqual } from '../../../src/utils/hash';

describe('hash utils', () => {
  it('should hash consistently', async () => {
    const a = await sha256Hex('hello');
    const b = await sha256Hex('hello');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('should compare equal strings safely', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'ab')).toBe(false);
  });
});
