import { supabase } from '../supabaseClient';

const BUCKET = 'menu-images';

/**
 * Uploads a menu item image and returns its public URL.
 * Filenames are prefixed with a timestamp to avoid collisions —
 * old files are NOT deleted on replace (decided: leave orphans,
 * clean up later rather than risk deleting a file still referenced
 * elsewhere).
 */
export async function uploadMenuImage(file) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
