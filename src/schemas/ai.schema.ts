import { z } from 'zod';

const DiffEntrySchema = z.object({
  path: z.string().min(1).max(500),
  kind: z.enum(['added', 'removed', 'changed']),
  left: z.unknown().optional(),
  right: z.unknown().optional(),
});

export const ExplainDiffSchema = z.object({
  entries: z.array(DiffEntrySchema).max(80),
});

export type ExplainDiffInput = z.infer<typeof ExplainDiffSchema>;

/** Max serialized JSON size accepted for AI explain (keeps prompt/neuron cost bounded). */
export const EXPLAIN_JSON_MAX_CHARS = 120_000;

export const ExplainJsonSchema = z
  .object({
    json: z.unknown(),
    name: z.string().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    let serialized: string;
    try {
      serialized = JSON.stringify(value.json) ?? '';
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'json must be JSON-serializable',
        path: ['json'],
      });
      return;
    }
    if (serialized.length > EXPLAIN_JSON_MAX_CHARS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `json exceeds ${EXPLAIN_JSON_MAX_CHARS} characters when serialized`,
        path: ['json'],
      });
    }
  });

export type ExplainJsonInput = z.infer<typeof ExplainJsonSchema>;
