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
