import { contentKey } from './keys';

export async function putBlobContent(
  bucket: R2Bucket,
  blobId: string,
  serialized: string,
): Promise<string> {
  const key = contentKey(blobId);
  await bucket.put(key, serialized, {
    httpMetadata: { contentType: 'application/json' },
  });
  return key;
}

export async function getBlobContent(bucket: R2Bucket, key: string): Promise<string | null> {
  const object = await bucket.get(key);
  if (!object) {
    return null;
  }
  return object.text();
}

export async function deleteBlobContent(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
