export type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: string;
  email_verified: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  createdAt: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  plan: string;
};

export type VaultRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
