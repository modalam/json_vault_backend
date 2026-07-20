export type RequestWorkspaceStateRow = {
  user_id: string;
  content: string;
  updated_at: string;
};

export async function findRequestWorkspaceState(
  db: D1Database,
  userId: string,
): Promise<RequestWorkspaceStateRow | null> {
  return db
    .prepare(`SELECT user_id, content, updated_at FROM request_workspace_state WHERE user_id = ?`)
    .bind(userId)
    .first<RequestWorkspaceStateRow>();
}

export async function upsertRequestWorkspaceState(
  db: D1Database,
  params: { userId: string; content: string; updatedAt: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO request_workspace_state (user_id, content, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         content = excluded.content,
         updated_at = excluded.updated_at`,
    )
    .bind(params.userId, params.content, params.updatedAt)
    .run();
}
