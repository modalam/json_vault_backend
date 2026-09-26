import { customAlphabet } from 'nanoid';
import {
  API_KEY_ID_PREFIX,
  AUDIT_ID_PREFIX,
  BLOB_ID_LENGTH,
  EDIT_TOKEN_BYTES,
  USER_ID_PREFIX,
  VAULT_ID_PREFIX,
} from '../constants/limits';

const urlAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const generateBlobId = customAlphabet(urlAlphabet, BLOB_ID_LENGTH);
const generateEntityId = customAlphabet(urlAlphabet, 12);
const generateApiKeySecret = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  32,
);

export function createBlobId(): string {
  return generateBlobId();
}

export function createUserId(): string {
  return `${USER_ID_PREFIX}${generateEntityId()}`;
}

export function createVaultId(): string {
  return `${VAULT_ID_PREFIX}${generateEntityId()}`;
}

export function createApiKeyId(): string {
  return `${API_KEY_ID_PREFIX}${generateEntityId()}`;
}

export function createAuditId(): string {
  return `${AUDIT_ID_PREFIX}${generateEntityId()}`;
}

export function createEditToken(): string {
  const bytes = new Uint8Array(EDIT_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `et_${hex}`;
}

export function createRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `rt_${hex}`;
}

export function createRequestId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `req_${hex}`;
}

/** Format: jv_{env}_{32 random chars} */
export function createApiKeySecret(environment: string): string {
  const env =
    environment === 'production' ? 'live' : environment === 'staging' ? 'test' : 'dev';
  return `jv_${env}_${generateApiKeySecret()}`;
}
