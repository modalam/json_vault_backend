import { describe, expect, it } from 'vitest';
import { contentKey } from '../../../src/storage/keys';
import { resolveInlineThreshold } from '../../../src/services/storage.service';

describe('storage helpers', () => {
  it('should build R2 content keys', () => {
    expect(contentKey('abc123')).toBe('blobs/abc123/content.json');
  });

  it('should fall back to default inline threshold', () => {
    expect(resolveInlineThreshold(undefined)).toBe(262_144);
    expect(resolveInlineThreshold('1000')).toBe(1000);
  });
});
