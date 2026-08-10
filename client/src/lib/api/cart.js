import { supabase } from '../supabaseClient';

/**
 * Returns the current user's cart, joined with coffee details —
 * shape matches what Cart.jsx expects: item.quantity, item.Coffee.{name,price,image}
 */
export async function getCart(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, quantity, coffee:coffee_id (id, name, price, image, category)')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  // Reshape coffee -> Coffee to match the old API's casing, so components
  // don't need touching beyond the fetch call itself.
  return data.map((row) => ({ id: row.id, quantity: row.quantity, Coffee: row.coffee }));
}

/**
 * Adds an item to the cart, or increments quantity if it's already there.
 * Delegates to the add_to_cart() RPC (security definer, atomic upsert on
 * (user_id, coffee_id)) instead of the old read-then-write pattern.
 * userId is unused here (the RPC scopes to auth.uid() server-side) but
 * kept in the signature so existing callers don't need to change.
 */
export async function addToCart(userId, coffeeId, quantity = 1) {
  const { data, error } = await supabase.rpc('add_to_cart', {
    p_coffee_id: coffeeId,
    p_quantity: quantity,
  });

  if (error) throw new Error(error.message);

  // RPC returns the bare cart_items row; re-fetch with the coffee join
  // so the return shape matches the rest of this module.
  const { data: full, error: fetchError } = await supabase
    .from('cart_items')
    .select('id, quantity, coffee:coffee_id (id, name, price, image, category)')
    .eq('id', data.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  return { id: full.id, quantity: full.quantity, Coffee: full.coffee };
}

/**
 * Sets quantity directly. quantity < 1 deletes the row (matches old API behavior).
 */
export async function updateCartItem(id, quantity) {
  if (quantity < 1) {
    await removeCartItem(id);
    return null;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .select('id, quantity, coffee:coffee_id (id, name, price, image, category)')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, quantity: data.quantity, Coffee: data.coffee };
}

export async function removeCartItem(id) {
  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
