export type Visibility = 'public' | 'private';
export type StorageType = 'inline' | 'r2';

export type BlobRow = {
  id: string;
  vault_id: string | null;
  created_by: string | null;
  name: string | null;
  description: string | null;
  visibility: Visibility;
  storage_type: StorageType;
  content: string | null;
  r2_key: string | null;
  size_bytes: number;
  edit_token_hash: string | null;
  tags: string | null;
  last_accessed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BlobResponse = {
  id: string;
  url: string;
  apiUrl: string;
  name: string | null;
  description: string | null;
  visibility: Visibility;
  tags: string[];
  sizeBytes: number;
  content?: unknown;
  editToken?: string;
  vaultId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};
