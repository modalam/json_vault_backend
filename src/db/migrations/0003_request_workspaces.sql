PRAGMA foreign_keys = ON;

-- One JSON document per user for Postman-like request workspaces
-- (collections, environments, active selection).
CREATE TABLE IF NOT EXISTS request_workspace_state (
  user_id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
