import { AppError } from './errors';
import { ERROR_CODES } from '../constants/error-codes';
import { MAX_JSON_DEPTH, MAX_JSON_KEYS } from '../constants/limits';

export type ValidatedJson = {
  value: unknown;
  serialized: string;
  sizeBytes: number;
};

function countKeysAndDepth(
  value: unknown,
  depth: number,
  state: { keys: number },
): void {
  if (depth > MAX_JSON_DEPTH) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      400,
      `JSON nesting exceeds maximum depth of ${MAX_JSON_DEPTH}.`,
      { fields: { content: [`Maximum depth is ${MAX_JSON_DEPTH}.`] } },
    );
  }

  if (Array.isArray(value)) {
    state.keys += value.length;
    if (state.keys > MAX_JSON_KEYS) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        400,
        `JSON exceeds maximum of ${MAX_JSON_KEYS} keys/elements.`,
        { fields: { content: [`Maximum key/element count is ${MAX_JSON_KEYS}.`] } },
      );
    }
    for (const item of value) {
      countKeysAndDepth(item, depth + 1, state);
    }
    return;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    state.keys += entries.length;
    if (state.keys > MAX_JSON_KEYS) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        400,
        `JSON exceeds maximum of ${MAX_JSON_KEYS} keys/elements.`,
        { fields: { content: [`Maximum key/element count is ${MAX_JSON_KEYS}.`] } },
      );
    }
    for (const [, child] of entries) {
      countKeysAndDepth(child, depth + 1, state);
    }
  }
}

export function validateJsonContent(content: unknown, maxSizeBytes: number): ValidatedJson {
  if (content === undefined) {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Request body must include valid JSON content.');
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(content);
  } catch {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Content is not valid JSON.');
  }

  if (serialized === undefined) {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Content is not valid JSON.');
  }

  const sizeBytes = new TextEncoder().encode(serialized).byteLength;
  if (sizeBytes > maxSizeBytes) {
    throw new AppError(
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      413,
      `JSON payload exceeds maximum size of ${maxSizeBytes} bytes.`,
    );
  }

  countKeysAndDepth(content, 0, { keys: 0 });

  return { value: content, serialized, sizeBytes };
}

export function parseJsonString(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError(ERROR_CODES.INVALID_JSON, 400, 'Stored content is not valid JSON.');
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
