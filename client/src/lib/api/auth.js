import { supabase } from '../supabaseClient';

/**
 * Registers a new user. username/phone are passed as auth metadata;
 * the DB trigger (handle_new_user) copies them into public.profiles.
 */
export async function register({ username, email, phone, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, phone },
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Supabase Auth is email-based. The old system logged in with username;
 * this app logs in with email instead (simpler than denormalizing email
 * onto profiles or adding an RPC lookup — decided over the alternatives).
 */
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Fetches the profile row (username, role, phone) for a given auth user id.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, phone, role')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * All registered users, for the Admin Accounts page. No email
 * (not denormalized onto profiles). RLS restricts this to admins
 * only via is_admin(); a non-admin gets an empty result.
 */
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, phone, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin-only edit of another user's username/phone/role, via the
 * admin_update_profile() RPC (security definer). The RPC itself
 * refuses to touch any row whose current role is 'admin' — enforced
 * server-side, not just hidden in the UI.
 */
export async function adminUpdateProfile({ id, username, phone, role }) {
  const { error } = await supabase.rpc('admin_update_profile', {
    target_id: id,
    new_username: username,
    new_phone: phone,
    new_role: role,
  });

  if (error) throw new Error(error.message);
}
