import { z } from 'zod';

export const VisibilitySchema = z.enum(['public', 'private']);

const JsonContentSchema = z.custom<unknown>(
  (value) => value !== undefined,
  { message: 'content is required' },
);

export const CreateBlobSchema = z.object({
  content: JsonContentSchema,
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  visibility: VisibilitySchema.default('public'),
  tags: z.array(z.string().min(1).max(50)).max(10).optional().default([]),
  vaultId: z.string().min(10).max(40).optional().nullable(),
});

export type CreateBlobInput = z.infer<typeof CreateBlobSchema>;

export const UpdateBlobSchema = z.object({
  id: z
    .string()
    .min(10)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid blob id'),
  content: JsonContentSchema,
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  visibility: VisibilitySchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export type UpdateBlobInput = z.infer<typeof UpdateBlobSchema>;

export const BlobIdParamSchema = z.object({
  id: z
    .string()
    .min(10)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid blob id'),
});

export const GetBlobSchema = z.object({
  id: z
    .string()
    .min(10)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid blob id'),
});

export type GetBlobInput = z.infer<typeof GetBlobSchema>;
