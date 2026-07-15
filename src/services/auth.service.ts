import type { Env } from '../types/env';
import type { AuthUser, UserRow } from '../types/auth';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import * as userQueries from '../db/queries/users';
import * as vaultQueries from '../db/queries/vaults';
import * as refreshQueries from '../db/queries/refresh-tokens';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import { hashPassword, verifyPassword } from '../utils/password';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from '../utils/jwt';
import { createRefreshToken, createUserId, createVaultId } from '../utils/id';
import { sha256Hex } from '../utils/hash';
import { nowIso } from '../utils/json';
import { REFRESH_TOKEN_TTL_DAYS } from '../constants/limits';

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    plan: row.plan,
    createdAt: row.created_at,
  };
}

async function issueTokens(env: Env, user: UserRow) {
  const accessToken = await signAccessToken(env, {
    sub: user.id,
    email: user.email,
    plan: user.plan,
  });

  const refreshToken = createRefreshToken();
  const refreshTokenHash = await sha256Hex(refreshToken);
  const timestamp = nowIso();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  ).toISOString();

  await refreshQueries.insertRefreshToken(env.DB, {
    id: `rft_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt,
    createdAt: timestamp,
  });

  return {
    user: toAuthUser(user),
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

async function createDefaultVault(env: Env, userId: string, timestamp: string): Promise<string> {
  const vaultId = createVaultId();
  await vaultQueries.insertVault(env.DB, {
    id: vaultId,
    ownerId: userId,
    name: 'Personal',
    slug: 'personal',
    description: null,
    type: 'personal',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return vaultId;
}

export async function register(env: Env, input: RegisterInput) {
  const existing = await userQueries.findUserByEmail(env.DB, input.email);
  if (existing) {
    throw new AppError(
      ERROR_CODES.EMAIL_ALREADY_EXISTS,
      409,
      'An account with this email already exists.',
    );
  }

  const timestamp = nowIso();
  const userId = createUserId();
  const passwordHash = await hashPassword(input.password);
  const displayName = input.displayName?.trim() || input.email.split('@')[0] || 'User';

  await userQueries.insertUser(env.DB, {
    id: userId,
    email: input.email,
    passwordHash,
    displayName,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await createDefaultVault(env, userId, timestamp);

  const user = await userQueries.findUserById(env.DB, userId);
  if (!user) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to create user.');
  }

  return await issueTokens(env, user);
}

export async function login(env: Env, input: LoginInput) {
  const user = await userQueries.findUserByEmail(env.DB, input.email);
  if (!user || !user.password_hash) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 401, 'Invalid email or password.');
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 401, 'Invalid email or password.');
  }

  return await issueTokens(env, user);
}

export async function refresh(env: Env, refreshToken: string) {
  const tokenHash = await sha256Hex(refreshToken);
  const row = await refreshQueries.findRefreshTokenByHash(env.DB, tokenHash);
  if (!row) {
    throw new AppError(ERROR_CODES.INVALID_REFRESH_TOKEN, 401, 'Refresh token is invalid.');
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new AppError(ERROR_CODES.REFRESH_TOKEN_EXPIRED, 401, 'Refresh token has expired.');
  }

  await refreshQueries.revokeRefreshToken(env.DB, row.id, nowIso());

  const user = await userQueries.findUserById(env.DB, row.user_id);
  if (!user) {
    throw new AppError(ERROR_CODES.INVALID_REFRESH_TOKEN, 401, 'Refresh token is invalid.');
  }

  return await issueTokens(env, user);
}

export async function logout(env: Env, refreshToken: string): Promise<void> {
  const tokenHash = await sha256Hex(refreshToken);
  const row = await refreshQueries.findRefreshTokenByHash(env.DB, tokenHash);
  if (row) {
    await refreshQueries.revokeRefreshToken(env.DB, row.id, nowIso());
  }
}

export async function getMe(env: Env, userId: string): Promise<AuthUser> {
  const user = await userQueries.findUserById(env.DB, userId);
  if (!user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 401, 'Authentication required.');
  }
  return toAuthUser(user);
}

export async function getDefaultVaultId(env: Env, userId: string): Promise<string | null> {
  const vaults = await vaultQueries.listVaultsByOwner(env.DB, userId);
  const personal = vaults.find((v) => v.slug === 'personal') ?? vaults[0];
  return personal?.id ?? null;
}
