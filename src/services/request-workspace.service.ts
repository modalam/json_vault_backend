import type { Env } from '../types/env';
import * as requestWorkspaceQueries from '../db/queries/request-workspaces';
import type { RequestWorkspaceStateInput } from '../schemas/request-workspace.schema';
import { nowIso } from '../utils/json';

export async function getRequestWorkspaceState(
  env: Env,
  userId: string,
): Promise<RequestWorkspaceStateInput | null> {
  const row = await requestWorkspaceQueries.findRequestWorkspaceState(env.DB, userId);
  if (!row) return null;

  try {
    return JSON.parse(row.content) as RequestWorkspaceStateInput;
  } catch {
    return null;
  }
}

export async function saveRequestWorkspaceState(
  env: Env,
  userId: string,
  state: RequestWorkspaceStateInput,
): Promise<{ updatedAt: string }> {
  const updatedAt = nowIso();
  await requestWorkspaceQueries.upsertRequestWorkspaceState(env.DB, {
    userId,
    content: JSON.stringify(state),
    updatedAt,
  });
  return { updatedAt };
}
