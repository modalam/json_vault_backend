import type { Env } from '../types/env';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants/error-codes';
import type { ExplainDiffInput } from '../schemas/ai.schema';

/** Active Workers AI variant; plain `llama-3.1-8b-instruct` was deprecated 2026-05-30. */
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const MAX_ENTRIES_FOR_PROMPT = 40;
const MAX_VALUE_CHARS = 120;
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

async function assertAiQuota(env: Env, userId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `ai:diff-explain:${userId}:${day}`;
  const current = Number((await env.KV.get(key)) ?? '0');
  if (Number.isFinite(current) && current >= DAILY_LIMIT) {
    throw new AppError(
      ERROR_CODES.RATE_LIMITED,
      429,
      `Daily AI explain limit reached (${DAILY_LIMIT}/day on the free tier). Try again tomorrow.`,
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

export async function explainDiffWithWorkersAi(
  env: Env,
  userId: string,
  input: ExplainDiffInput,
): Promise<{ explanation: string; model: string }> {
  if (!env.AI) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      500,
      'Workers AI is not configured on this API. Add an [ai] binding in wrangler.toml and redeploy.',
    );
  }

  await assertAiQuota(env, userId);

  const prompt = buildDiffPrompt(input.entries);

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You are a precise technical writer for JSON Vault. Explain semantic JSON diffs clearly.',
        },
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
