import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { decrypt, encrypt, parseKey } from '../src/crypto';

const key = randomBytes(32);

describe('crypto', () => {
  it('round-trips text, including unicode', () => {
    const text = 'Slow morning ☀️ — cleared the desk.';
    expect(decrypt(encrypt(text, key, 'u:2026-01-01'), key, 'u:2026-01-01')).toBe(text);
  });

  it('does not contain the plaintext and differs each time', () => {
    const a = encrypt('private thought', key, 'x');
    const b = encrypt('private thought', key, 'x');
    expect(a).not.toContain('private');
    expect(a).not.toBe(b);
  });

  it('fails when moved to another row (different aad)', () => {
    const sealed = encrypt('hello', key, 'user-a:2026-01-01');
    expect(() => decrypt(sealed, key, 'user-b:2026-01-01')).toThrow();
  });

  it('fails with the wrong key or tampered data', () => {
    const sealed = encrypt('hello', key, 'x');
    expect(() => decrypt(sealed, randomBytes(32), 'x')).toThrow();
    const [v, iv, tag, body] = sealed.split('.');
    const flipped = Buffer.from(body, 'base64');
    flipped[0] ^= 1;
    expect(() => decrypt([v, iv, tag, flipped.toString('base64')].join('.'), key, 'x')).toThrow();
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => parseKey(Buffer.from('short').toString('base64'))).toThrow();
  });
});
