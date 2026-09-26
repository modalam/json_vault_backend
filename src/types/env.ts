export type Env = {
  DB: D1Database;
  BUCKET?: R2Bucket;
  KV: KVNamespace;
  /** Cloudflare Workers AI binding (optional until [ai] is configured). */
  AI?: Ai;
  ENVIRONMENT: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
  MAX_BLOB_SIZE_BYTES: string;
  INLINE_STORAGE_THRESHOLD: string;
  ANONYMOUS_BLOB_TTL_DAYS: string;
  FRONTEND_URL: string;
  API_URL: string;
  /** Optional Sentry DSN for backend error reporting. */
  SENTRY_DSN?: string;
};

export type AuthContext = {
  userId: string;
  email: string;
  plan: string;
  authType: 'jwt' | 'api_key';
  scopes?: string[];
  apiKeyId?: string;
};

export type AppVariables = {
  requestId: string;
  editToken: string | null;
  clientIp: string;
  auth: AuthContext | null;
};
