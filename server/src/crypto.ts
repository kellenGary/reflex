import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Output: "v1.<iv>.<tag>.<ciphertext>" (base64 parts). The version prefix leaves room for key rotation.
// `aad` binds a ciphertext to its row (user + date), so a value copied onto another row fails to decrypt.

export function parseKey(base64: string): Buffer {
  const key = Buffer.from(base64, 'base64');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes');
  return key;
}

export function encrypt(plain: string, key: Buffer, aad: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aad));
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join('.');
}

export function decrypt(payload: string, key: Buffer, aad: string): string {
  const [version, iv, tag, body] = payload.split('.');
  if (version !== 'v1' || !iv || !tag || !body) throw new Error('Unrecognised ciphertext format');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
}
