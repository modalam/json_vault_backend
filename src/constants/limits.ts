/** Max blob size for free/anonymous (50 MB). */
export const DEFAULT_MAX_BLOB_SIZE_BYTES = 52_428_800;

/** Store inline in D1 when at or below this size. */
export const DEFAULT_INLINE_STORAGE_THRESHOLD = 262_144; // 256 KB

/** Anonymous blob create limit per IP. */
export const ANONYMOUS_CREATE_LIMIT = 5;
export const ANONYMOUS_CREATE_WINDOW_SECONDS = 86_400; // 24 hours

/** Anonymous read limit per IP. */
export const ANONYMOUS_READ_LIMIT = 60;
export const ANONYMOUS_READ_WINDOW_SECONDS = 60;

/** Max JSON nesting depth. */
export const MAX_JSON_DEPTH = 100;

/** Max object/array keys counted recursively. */
export const MAX_JSON_KEYS = 10_000;

export const BLOB_ID_LENGTH = 16;
export const EDIT_TOKEN_BYTES = 32;

export const USER_ID_PREFIX = 'usr_';
export const VAULT_ID_PREFIX = 'vlt_';
export const API_KEY_ID_PREFIX = 'key_';
export const AUDIT_ID_PREFIX = 'aud_';
export const REFRESH_TOKEN_TTL_DAYS = 30;

export const API_KEY_SCOPES = [
  'blobs:read',
  'blobs:write',
  'vaults:read',
  'vaults:write',
  'users:read',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = ['blobs:read', 'blobs:write'];

export const MAX_API_KEYS_PER_USER = 20;

/** Plan quotas (Phase 4). */
export const PLAN_LIMITS = {
  free: {
    maxBlobs: 50,
    maxStorageBytes: 10 * 1024 * 1024, // 10 MB
    requestsPerMinute: 100,
  },
  pro: {
    maxBlobs: 500,
    maxStorageBytes: 100 * 1024 * 1024, // 100 MB
    requestsPerMinute: 1000,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;
