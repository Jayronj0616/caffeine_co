-- ============================================================
-- schema_missing_pieces.sql
--
-- READ THIS BEFORE RUNNING. Written 2026-09-19.
--
-- WHY THIS FILE EXISTS
-- `schema.sql` cannot rebuild this project. It is missing pieces that
-- only ever existed in the live database, which is now unreachable
-- (see PROGRESS.md). Run against a fresh Supabase project, schema.sql
-- alone produces an app whose POS is entirely absent and whose admin
-- functions call a function that does not exist.
--
-- Concretely, schema.sql is missing:
--   * public.is_admin()            -- yet admin_update_profile() and
--                                     admin_update_order_status() both
--                                     call it (schema.sql:336, :384)
--   * public.add_to_cart()         -- called by client/src/lib/api/cart.js
--   * public.place_pos_order()     -- called by orders.js
--   * public.admin_void_pos_order()-- called by orders.js
--   * public.pos_orders / public.pos_order_items
-- and its place_order() is stale: it still charges 8% tax (schema.sql:224)
-- after tax was removed everywhere else.
--
-- HOW THIS FILE WAS PRODUCED — IT IS RECONSTRUCTED, NOT RECOVERED.
-- The live definitions are gone, so these are rebuilt from the exact
-- contracts the frontend calls with (argument names, argument shapes,
-- return values, selected column names) plus the behaviour documented
-- in PROGRESS.md. Signatures should be right because the client would
-- break otherwise. Bodies are a faithful best effort, not the original
-- source.
--
-- >>> REVIEW THIS BEFORE RUNNING IT. It touches money. <<<
--
-- Run order: schema.sql first, then this file.
-- ============================================================


-- ------------------------------------------------------------
-- 1. is_admin()
--
-- The fix for the RLS infinite-recursion bug (PROGRESS.md). Any
-- admin/role check must route through this, never an inline profiles
-- subquery inside a policy ON profiles, or the recursion comes back.
-- SECURITY DEFINER so it reads profiles without re-triggering RLS.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 2. add_to_cart()
--
-- Atomic upsert, replacing the old read-then-write. Scoped to
-- auth.uid() server-side — the userId the client passes is ignored on
-- purpose (see cart.js). Returns the row; cart.js reads .id off it.
-- Requires the unique (user_id, coffee_id) constraint from schema.sql.
-- ------------------------------------------------------------
create or replace function public.add_to_cart(
  p_coffee_id bigint,
  p_quantity integer default 1
)
returns public.cart_items
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.cart_items;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  insert into public.cart_items (user_id, coffee_id, quantity)
  values (auth.uid(), p_coffee_id, p_quantity)
  on conflict (user_id, coffee_id)
  do update set quantity = public.cart_items.quantity + excluded.quantity
  returning * into v_row;

  return v_row;
end;
$$;


-- ------------------------------------------------------------
-- 3. POS tables
--
-- Walk-in sales are deliberately NOT attributed to a customer account
-- (PROGRESS.md) — they carry a cashier_id instead and are merged into
-- the admin Sales view with an Online/POS tag.
--
-- Column list is fixed by what orders.js selects:
--   pos_orders:      id, subtotal, tax, total, created_at, cashier_id
--   pos_order_items: id, name, price, quantity  (+ the FK it nests on)
--
-- name/price are snapshotted at sale time, same as order_items, so
-- editing or deleting a menu item never rewrites sales history.
-- tax is kept and always 0 — retained for parity with orders so the
-- merged Sales view doesn't have to branch on shape.
-- ------------------------------------------------------------
create table if not exists public.pos_orders (
  id bigint generated always as identity primary key,
  -- nullable + on delete set null: deleting a staff account must not
  -- delete the shop's sales history
  cashier_id uuid references auth.users (id) on delete set null,
  subtotal numeric(10, 2) not null,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_order_items (
  id bigint generated always as identity primary key,
  pos_order_id bigint not null references public.pos_orders (id) on delete cascade,
  coffee_id bigint references public.coffee (id) on delete set null,
  name text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists pos_order_items_order_idx
  on public.pos_order_items (pos_order_id);

alter table public.pos_orders enable row level security;
alter table public.pos_order_items enable row level security;

-- Read: admins only. No insert/update/delete policies on purpose — every
-- write goes through the SECURITY DEFINER functions below, same pattern
-- schema.sql uses for orders/order_items.
create policy "pos_orders_select_admin"
  on public.pos_orders for select
  using (public.is_admin());

create policy "pos_order_items_select_admin"
  on public.pos_order_items for select
  using (public.is_admin());


-- ------------------------------------------------------------
-- 4. place_pos_order(items jsonb) -> new pos_order id
--
-- Argument is named `items` (not p_items) because that is what
-- orders.js sends. Shape: [{ "coffee_id": 1, "quantity": 2 }, ...]
--
-- Prices are looked up server-side from coffee and never taken from the
-- client — a cashier's browser must not be able to set its own price.
-- No tax: tax = 0, total = subtotal (PROGRESS.md "Tax Removed").
-- ------------------------------------------------------------
create or replace function public.place_pos_order(items jsonb)
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id bigint;
  v_subtotal numeric(10, 2);
  v_line_count integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'No items';
  end if;

  -- Join against coffee so unknown/deleted coffee_ids are dropped rather
  -- than trusted, then require that something actually survived.
  select coalesce(sum(co.price * i.quantity), 0), count(*)
  into v_subtotal, v_line_count
  from jsonb_to_recordset(items) as i(coffee_id bigint, quantity integer)
  join public.coffee co on co.id = i.coffee_id
  where i.quantity > 0;

  if v_line_count = 0 or v_subtotal <= 0 then
    raise exception 'No valid items';
  end if;

  insert into public.pos_orders (cashier_id, subtotal, tax, total)
  values (auth.uid(), v_subtotal, 0, v_subtotal)
  returning id into v_order_id;

  insert into public.pos_order_items (pos_order_id, coffee_id, name, price, quantity)
  select v_order_id, co.id, co.name, co.price, i.quantity
  from jsonb_to_recordset(items) as i(coffee_id bigint, quantity integer)
  join public.coffee co on co.id = i.coffee_id
  where i.quantity > 0;

  return v_order_id;
end;
$$;


-- ------------------------------------------------------------
-- 5. admin_void_pos_order(order_id)
--
-- Argument is named `order_id` (NOT p_order_id) because that is what
-- orders.js sends — note it is inconsistent with the p_-prefixed admin
-- functions in schema.sql. Don't "tidy" it without changing orders.js.
--
-- Hard delete, not a refund record (PROGRESS.md, deliberate). Items go
-- with it via the cascade. There is intentionally no equivalent for
-- online orders.
-- ------------------------------------------------------------
create or replace function public.admin_void_pos_order(order_id bigint)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  delete from public.pos_orders where id = order_id;
end;
$$;


-- ------------------------------------------------------------
-- 6. Execute grants
--
-- The security advisor previously flagged the admin RPCs as executable
-- by `anon` (Open Item 2). Each one guards itself with is_admin(), but
-- there is no reason to leave the door open as well: revoke from anon
-- and let only signed-in callers reach them. Defence in depth — the
-- is_admin() check inside each function is still what actually
-- authorizes.
-- ------------------------------------------------------------
revoke all on function public.place_pos_order(jsonb) from public, anon;
revoke all on function public.admin_void_pos_order(bigint) from public, anon;
revoke all on function public.is_admin() from anon;

grant execute on function public.place_pos_order(jsonb) to authenticated;
grant execute on function public.admin_void_pos_order(bigint) to authenticated;
grant execute on function public.add_to_cart(bigint, integer) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Same treatment for the two admin functions that DO live in schema.sql,
-- since they were flagged by the same advisor run:
revoke all on function public.admin_update_profile(uuid, text, text, text) from public, anon;
revoke all on function public.admin_update_order_status(bigint, text) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, text, text) to authenticated;
grant execute on function public.admin_update_order_status(bigint, text) to authenticated;


-- ------------------------------------------------------------
-- 7. place_order() — tax correction
--
-- schema.sql:202 still does `v_tax := round(v_subtotal * 0.08, 2)` and
-- charges subtotal + tax. Tax was removed from the product: Cart.jsx
-- shows a single "Total" with no tax line, and POS.jsx literally does
-- `const total = subtotal;`.
--
-- So rebuilding from schema.sql as-is would charge every customer 8%
-- MORE than the amount their cart showed them. This redefinition fixes
-- that. The tax column is kept (always 0) for historical compatibility.
-- ------------------------------------------------------------
create or replace function public.place_order()
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id bigint;
  v_subtotal numeric(10, 2);
begin
  select coalesce(sum(c.quantity * co.price), 0)
  into v_subtotal
  from public.cart_items c
  join public.coffee co on co.id = c.coffee_id
  where c.user_id = auth.uid();

  if v_subtotal = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (user_id, subtotal, tax, total)
  values (auth.uid(), v_subtotal, 0, v_subtotal)
  returning id into v_order_id;

  insert into public.order_items (order_id, coffee_id, name, price, quantity)
  select v_order_id, co.id, co.name, co.price, c.quantity
  from public.cart_items c
  join public.coffee co on co.id = c.coffee_id
  where c.user_id = auth.uid();

  delete from public.cart_items where user_id = auth.uid();

  return v_order_id;
end;
$$;
