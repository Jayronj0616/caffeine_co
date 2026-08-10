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
 * NOTE: this is read-then-write, not atomic. Fine for a low-traffic cart;
 * if two tabs add the same item at the exact same instant, one increment
 * could be lost. Not worth an RPC function for this app's scale.
 */
export async function addToCart(userId, coffeeId, quantity = 1) {
  const { data: existing, error: findError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('coffee_id', coffeeId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing) {
    return updateCartItem(existing.id, existing.quantity + quantity);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, coffee_id: coffeeId, quantity })
    .select('id, quantity, coffee:coffee_id (id, name, price, image, category)')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, quantity: data.quantity, Coffee: data.coffee };
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
