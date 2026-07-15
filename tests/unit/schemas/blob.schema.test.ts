import { describe, expect, it } from 'vitest';
import { CreateBlobSchema } from '../../../src/schemas/blob.schema';

describe('CreateBlobSchema', () => {
  it('should accept valid create payloads', () => {
    const parsed = CreateBlobSchema.parse({
      content: { a: 1 },
      visibility: 'public',
      tags: ['fixture'],
    });
    expect(parsed.content).toEqual({ a: 1 });
    expect(parsed.visibility).toBe('public');
  });

  it('should default visibility and tags', () => {
    const parsed = CreateBlobSchema.parse({ content: [] });
    expect(parsed.visibility).toBe('public');
    expect(parsed.tags).toEqual([]);
  });

  it('should reject invalid visibility', () => {
    const result = CreateBlobSchema.safeParse({
      content: {},
      visibility: 'secret',
    });
    expect(result.success).toBe(false);
  });
});
