import { createRemoteJWKSet, jwtVerify } from 'jose';

/** Verifies a bearer token and returns the user's id, or throws. */
export type VerifyToken = (token: string) => Promise<{ userId: string }>;

/**
 * Verifies Supabase access tokens against the project's public signing keys (JWKS).
 * Needs a project using asymmetric JWT signing keys (the current default). A project still on the
 * legacy shared secret would need an HS256 verifier instead.
 */
export function createSupabaseVerifier(supabaseUrl: string): VerifyToken {
  const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  return async (token) => {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' });
    if (!payload.sub) throw new Error('Token has no subject');
    return { userId: payload.sub };
  };
}

/** Deletes the login itself (Supabase admin API). Called when a user deletes their account. */
export type DeleteAuthUser = (userId: string) => Promise<void>;

export function createSupabaseUserDeleter(supabaseUrl: string, serviceRoleKey: string): DeleteAuthUser {
  return async (userId) => {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      // New-style secret keys (sb_secret_...) are not JWTs and go in `apikey` only; legacy service_role keys are JWTs.
      headers: serviceRoleKey.startsWith('sb_secret_')
        ? { apikey: serviceRoleKey }
        : { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!res.ok && res.status !== 404) throw new Error(`Supabase user delete failed (${res.status})`);
  };
}
