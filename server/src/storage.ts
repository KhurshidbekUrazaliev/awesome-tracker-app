import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

const client =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

export function isStorageConfigured(): boolean {
  return client !== null;
}

/**
 * Uploads a file to the configured Supabase Storage bucket and returns its
 * public URL. The bucket must be public (or served through a CDN/proxy that
 * makes it so) — avatars and generic uploads are treated as publicly
 * viewable once a link exists, same as the old local-disk /uploads route.
 */
export async function uploadToStorage(objectPath: string, buffer: Buffer, contentType: string): Promise<string> {
  if (!client) {
    throw new Error(
      'File storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see server/.env.example).'
    );
  }

  const { error } = await client.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
