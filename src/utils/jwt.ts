import { SignJWT, jwtVerify } from 'jose';
import type { Env } from '../types/env';
import type { JwtPayload } from '../types/auth';

const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes

function secretKey(env: Env): Uint8Array {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(env: Env, payload: JwtPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    plan: payload.plan,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey(env));
}

export async function verifyAccessToken(env: Env, token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secretKey(env), {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid token subject.');
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    plan: typeof payload.plan === 'string' ? payload.plan : 'free',
  };
}

export { ACCESS_TOKEN_TTL_SECONDS };
