import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('SecureP@ss123');
    expect(hash.startsWith('pbkdf2$')).toBe(true);
    expect(await verifyPassword('SecureP@ss123', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
