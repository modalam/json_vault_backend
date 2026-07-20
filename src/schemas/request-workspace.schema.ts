import { z } from 'zod';

const KeyValueRowSchema = z.object({
  id: z.string().min(1).max(80),
  enabled: z.boolean(),
  key: z.string().max(500),
  value: z.string().max(50_000),
});

const SavedRequestSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().max(10_000),
  headers: z.array(KeyValueRowSchema).max(200),
  queryParams: z.array(KeyValueRowSchema).max(200),
  body: z.string().max(2_000_000),
  bodyMode: z.enum(['none', 'raw']),
  rawLanguage: z.enum(['JSON', 'Text']),
});

const CollectionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  requests: z.array(SavedRequestSchema).max(500),
});

const EnvironmentSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  variables: z.array(KeyValueRowSchema).max(500),
});

const WorkspaceSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  collections: z.array(CollectionSchema).max(200),
  environments: z.array(EnvironmentSchema).max(100),
});

export const RequestWorkspaceStateSchema = z.object({
  workspaces: z.array(WorkspaceSchema).min(1).max(50),
  activeWorkspaceId: z.string().min(1).max(80),
  activeEnvironmentId: z.string().min(1).max(80).nullable(),
  activeRequestId: z.string().min(1).max(80).nullable(),
});

export type RequestWorkspaceStateInput = z.infer<typeof RequestWorkspaceStateSchema>;

export const PutRequestWorkspaceSchema = z.object({
  state: RequestWorkspaceStateSchema,
});
