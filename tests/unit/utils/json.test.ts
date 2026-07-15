import { describe, expect, it } from 'vitest';
import { validateJsonContent } from '../../../src/utils/json';
import { AppError } from '../../../src/utils/errors';
import { ERROR_CODES } from '../../../src/constants/error-codes';

describe('validateJsonContent', () => {
  it('should accept valid JSON objects', () => {
    const result = validateJsonContent({ hello: 'world' }, 1024);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(JSON.parse(result.serialized)).toEqual({ hello: 'world' });
  });

  it('should reject oversize payloads', () => {
    try {
      validateJsonContent({ data: 'x'.repeat(100) }, 10);
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ERROR_CODES.PAYLOAD_TOO_LARGE);
    }
  });

  it('should reject excessive nesting', () => {
    let nested: Record<string, unknown> = { v: 1 };
    for (let i = 0; i < 110; i++) {
      nested = { child: nested };
    }
    try {
      validateJsonContent(nested, 1_000_000);
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ERROR_CODES.VALIDATION_ERROR);
    }
  });
});
