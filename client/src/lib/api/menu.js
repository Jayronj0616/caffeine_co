import { supabase } from '../supabaseClient';

export async function getMenu() {
  const { data, error } = await supabase
    .from('coffee')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createMenuItem(item) {
  const { data, error } = await supabase
    .from('coffee')
    .insert(item)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMenuItem(id, item) {
  const { data, error } = await supabase
    .from('coffee')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('coffee').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
