import type { UserRow } from '../../types/auth';

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(`SELECT * FROM users WHERE lower(email) = lower(?) AND deleted_at IS NULL`)
    .bind(email)
    .first<UserRow>();
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(id)
    .first<UserRow>();
}

export type InsertUserParams = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function insertUser(db: D1Database, params: InsertUserParams): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, display_name, plan, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'free', 0, ?, ?)`,
    )
    .bind(
      params.id,
      params.email.toLowerCase(),
      params.passwordHash,
      params.displayName,
      params.createdAt,
      params.updatedAt,
    )
    .run();
}
