import type { Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import type { ExplainDiffInput, ExplainJsonInput } from '../schemas/ai.schema';

/** Active Workers AI variant; plain `llama-3.1-8b-instruct` was deprecated 2026-05-30. */
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const MAX_ENTRIES_FOR_PROMPT = 40;
const MAX_VALUE_CHARS = 120;
const MAX_JSON_PROMPT_CHARS = 6_000;
const MAX_PATHS_FOR_PROMPT = 50;
const DAILY_LIMIT = 40;

function shortJson(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    if (!text) return 'undefined';
    if (text.length <= MAX_VALUE_CHARS) return text;
    return `${text.slice(0, MAX_VALUE_CHARS - 1)}…`;
  } catch {
    return String(value);
  }
}

function typeLabel(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function collectPaths(
  value: unknown,
  path: string,
  out: string[],
  depth: number,
): void {
  if (out.length >= MAX_PATHS_FOR_PROMPT || depth > 8) return;

  if (value === null || typeof value !== 'object') {
    out.push(`${path || '(root)'}: ${typeLabel(value)} = ${shortJson(value)}`);
    return;
  }

  if (Array.isArray(value)) {
    out.push(`${path || '(root)'}: array(${value.length})`);
    if (value.length > 0) {
      collectPaths(value[0], `${path}[0]`, out, depth + 1);
    }
    return;
  }

  const keys = Object.keys(value as Record<string, unknown>);
  if (!path) {
    out.push(`(root): object keys=[${keys.slice(0, 40).join(', ')}${keys.length > 40 ? ', …' : ''}]`);
  } else {
    out.push(`${path}: object(${keys.length} keys)`);
  }

  for (const key of keys.slice(0, 30)) {
    if (out.length >= MAX_PATHS_FOR_PROMPT) break;
    const childPath = path ? `${path}.${key}` : key;
    const child = (value as Record<string, unknown>)[key];
    if (child !== null && typeof child === 'object') {
      collectPaths(child, childPath, out, depth + 1);
    } else {
      out.push(`${childPath}: ${typeLabel(child)} = ${shortJson(child)}`);
    }
  }
}

function buildDiffPrompt(entries: ExplainDiffInput['entries']): string {
  if (entries.length === 0) {
    return 'The two JSON documents are semantically equal (object key order ignored). Write one short sentence confirming that.';
  }

  const slice = entries.slice(0, MAX_ENTRIES_FOR_PROMPT);
  const lines = slice.map((entry) => {
    if (entry.kind === 'added') {
      return `- ADDED at ${entry.path}: ${shortJson(entry.right)}`;
    }
    if (entry.kind === 'removed') {
      return `- REMOVED at ${entry.path}: ${shortJson(entry.left)}`;
    }
    return `- CHANGED at ${entry.path}: ${shortJson(entry.left)} → ${shortJson(entry.right)}`;
  });

  const more =
    entries.length > MAX_ENTRIES_FOR_PROMPT
      ? `\n(…and ${entries.length - MAX_ENTRIES_FOR_PROMPT} more differences not listed)`
      : '';

  return `You explain JSON semantic diffs for developers.
Write a clear, concise explanation in plain English (3–8 short paragraphs or bullet groups).
Do not invent paths that are not listed. Do not output JSON. Do not mention being an AI.

Differences (object key order does not matter):
${lines.join('\n')}${more}`;
}

function buildJsonExplainPrompt(input: ExplainJsonInput): string {
  const paths: string[] = [];
  collectPaths(input.json, '', paths, 0);

  let sample = '';
  try {
    sample = JSON.stringify(input.json, null, 2) ?? '';
  } catch {
    sample = String(input.json);
  }
  if (sample.length > MAX_JSON_PROMPT_CHARS) {
    sample = `${sample.slice(0, MAX_JSON_PROMPT_CHARS - 1)}…`;
  }

  const nameLine = input.name?.trim() ? `Blob name (may be empty/untitled): ${input.name.trim()}\n` : '';

  return `You summarize JSON documents for developers using JSON Vault.
Write a clear, concise explanation in plain English:
1) One short paragraph: what this JSON appears to represent (domain / purpose).
2) A short bullet list of important top-level fields and nested paths (use only paths that appear below).
3) Note array shapes / repeating records if present.
4) Call out anything that looks like IDs, timestamps, money, or PII — without inventing values.

Do not invent paths or fields that are not listed. Do not output JSON. Do not mention being an AI.

${nameLine}Structure / key paths:
${paths.join('\n')}

JSON sample (may be truncated):
${sample}`;
}

async function assertAiQuota(env: Env, userId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `ai:daily:${userId}:${day}`;
  const current = Number((await env.KV.get(key)) ?? '0');
  if (Number.isFinite(current) && current >= DAILY_LIMIT) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      429,
      `Daily AI limit reached (${DAILY_LIMIT}/day on the free tier). Try again tomorrow.`,
    );
  }
  await env.KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 48 });
}

function extractResponseText(result: unknown): string {
  if (typeof result === 'string') return result.trim();
  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>;
    if (typeof record.response === 'string') return record.response.trim();
    if (typeof record.text === 'string') return record.text.trim();
  }
  return '';
}

async function runChatPrompt(
  env: Env,
  userId: string,
  system: string,
  prompt: string,
): Promise<{ explanation: string; model: string }> {
  if (!env.AI) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      500,
      'Workers AI is not configured on this API. Add an [ai] binding in wrangler.toml and redeploy.',
    );
  }

  await assertAiQuota(env, userId);

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.2,
    });

    const explanation = extractResponseText(result);
    if (!explanation) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        500,
        'Workers AI returned an empty explanation.',
      );
    }

    return { explanation, model: MODEL };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : 'Workers AI request failed.';
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, message);
  }
}

export async function explainDiffWithWorkersAi(
  env: Env,
  userId: string,
  input: ExplainDiffInput,
): Promise<{ explanation: string; model: string }> {
  return runChatPrompt(
    env,
    userId,
    'You are a precise technical writer for JSON Vault. Explain semantic JSON diffs clearly.',
    buildDiffPrompt(input.entries),
  );
}

export async function explainJsonWithWorkersAi(
  env: Env,
  userId: string,
  input: ExplainJsonInput,
): Promise<{ explanation: string; model: string }> {
  return runChatPrompt(
    env,
    userId,
    'You are a precise technical writer for JSON Vault. Summarize JSON documents clearly for developers.',
    buildJsonExplainPrompt(input),
  );
}
