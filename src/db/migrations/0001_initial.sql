-- Phase 1: users + vaults (for FK integrity) + blobs core table
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'personal',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vaults_owner_slug
  ON vaults(owner_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vaults_owner_id ON vaults(owner_id);

CREATE TABLE IF NOT EXISTS blobs (
  id TEXT PRIMARY KEY NOT NULL,
  vault_id TEXT,
  created_by TEXT,
  name TEXT,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  storage_type TEXT NOT NULL DEFAULT 'inline',
  content TEXT,
  r2_key TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  edit_token_hash TEXT,
  tags TEXT,
  last_accessed_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (visibility IN ('public', 'private')),
  CHECK (storage_type IN ('inline', 'r2')),
  CHECK (NOT (storage_type = 'inline' AND content IS NULL)),
  CHECK (NOT (storage_type = 'r2' AND r2_key IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_blobs_vault_id
  ON blobs(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blobs_created_by
  ON blobs(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blobs_visibility
  ON blobs(visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blobs_expires_at
  ON blobs(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blobs_last_accessed
  ON blobs(last_accessed_at) WHERE deleted_at IS NULL;
