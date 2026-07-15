import { describe, expect, it } from 'vitest';
import { createBlobId, createEditToken, createRequestId } from '../../../src/utils/id';

describe('id utils', () => {
  it('should create URL-safe blob ids of expected length', () => {
    const id = createBlobId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });

  it('should create edit tokens with et_ prefix', () => {
    const token = createEditToken();
    expect(token).toMatch(/^et_[a-f0-9]{64}$/);
  });

  it('should create request ids with req_ prefix', () => {
    const id = createRequestId();
    expect(id).toMatch(/^req_[a-f0-9]{16}$/);
  });
});
