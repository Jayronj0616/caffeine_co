import { supabase } from '../supabaseClient';

/**
 * Places an order from the caller's current cart via the place_order()
 * Postgres function — atomic: creates order + order_items, clears cart,
 * all-or-nothing. Throws if the cart is empty (function raises an
 * exception in that case).
 */
export async function placeOrder() {
  const { data, error } = await supabase.rpc('place_order');
  if (error) throw new Error(error.message);
  return data; // new order id
}

/**
 * Current user's own order history, most recent first, with line items.
 */
export async function getMyOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, subtotal, tax, total, created_at, order_items (id, name, price, quantity)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * All customer orders, most recent first, tagged as 'online'. Used
 * internally by getAllOrders() — call that instead unless you
 * specifically need customer orders only.
 */
async function getAllCustomerOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, subtotal, tax, total, created_at, user_id, order_items (id, name, price, quantity)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Separate lookup rather than an embedded profiles(username) select —
  // doesn't depend on PostgREST recognizing a FK from orders.user_id to
  // profiles.id, which may not be declared even though the values line up.
  const userIds = [...new Set(data.map((o) => o.user_id))];
  let usernameById = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    if (profilesError) throw new Error(profilesError.message);
    usernameById = Object.fromEntries(profiles.map((p) => [p.id, p.username]));
  }

  return data.map((o) => ({
    ...o,
    source: 'online',
    items: o.order_items,
    username: usernameById[o.user_id] || null,
  }));
}

/**
 * All POS (walk-in) orders, most recent first, tagged as 'pos'. Used
 * internally by getAllOrders() — call that instead unless you
 * specifically need POS orders only.
 */
async function getAllPosOrders() {
  const { data, error } = await supabase
    .from('pos_orders')
    .select('id, subtotal, tax, total, created_at, cashier_id, pos_order_items (id, name, price, quantity)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map((o) => ({ ...o, source: 'pos', items: o.pos_order_items }));
}

/**
 * All orders (customer + POS combined), for the Admin dashboard, merged
 * and sorted by created_at descending. Each order carries a `source`
 * field ('online' | 'pos') and a normalized `items` array so the UI
 * doesn't need to branch on shape. RLS restricts both underlying tables
 * to admins only — a non-admin calling this gets empty results, not an
 * error, since the select policies just filter rows.
 */
export async function getAllOrders() {
  const [customerOrders, posOrders] = await Promise.all([
    getAllCustomerOrders(),
    getAllPosOrders(),
  ]);

  return [...customerOrders, ...posOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * Places a walk-in POS order via the place_pos_order() Postgres function —
 * admin-only (enforced server-side), atomic, prices looked up server-side
 * from the coffee table. items: [{ coffee_id, quantity }, ...]
 */
export async function placePosOrder(items) {
  const { data, error } = await supabase.rpc('place_pos_order', { items });
  if (error) throw new Error(error.message);
  return data; // new pos_order id
}

/**
 * Voids (hard-deletes) a POS order via admin_void_pos_order() — admin-only,
 * enforced server-side. Online orders are never deletable this way; there
 * is no equivalent RPC for the orders/order_items tables on purpose.
 */
export async function voidPosOrder(orderId) {
  const { error } = await supabase.rpc('admin_void_pos_order', { order_id: orderId });
  if (error) throw new Error(error.message);
}

/**
 * Advances an online order's status via admin_update_order_status() —
 * admin-only, enforced server-side. Only valid forward transitions are
 * accepted (placed -> preparing -> completed, cancel from placed or
 * preparing); the server rejects anything else even if the UI only ever
 * sends valid ones.
 */
export async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabase.rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  });
  if (error) throw new Error(error.message);
}
