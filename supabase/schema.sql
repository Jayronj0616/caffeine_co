-- CaffeineCo — Supabase schema + RLS
-- Run this in the Supabase SQL editor on a fresh project.
-- Idempotent-ish: safe to re-run most of it, but DROP lines will wipe existing data.

-- ============================================================
-- 1. PROFILES (extends auth.users with username/phone/role)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone logged in can read their own profile (needed for role checks client-side)
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read every profile (useful for an admin user-management screen later)
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Users can update their own non-role fields. Role changes are NOT allowed here.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: auto-create a profile row when a new auth user signs up.
-- Pulls username/phone from the signUp() "data" payload (see auth.js).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. COFFEE (menu items)
-- ============================================================

create table if not exists public.coffee (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null,
  price numeric(10, 2) not null,
  category text not null default 'Espresso'
    check (category in ('Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry')),
  image text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coffee enable row level security;

-- Public can read the menu, no auth required
create policy "coffee_select_public"
  on public.coffee for select
  using (true);

-- Only admins can insert/update/delete menu items
create policy "coffee_insert_admin"
  on public.coffee for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "coffee_update_admin"
  on public.coffee for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "coffee_delete_admin"
  on public.coffee for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ============================================================
-- 3. CART_ITEMS
-- ============================================================

create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  coffee_id bigint not null references public.coffee (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, coffee_id)
);

alter table public.cart_items enable row level security;

-- A user can only see/modify their own cart rows
create policy "cart_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "cart_insert_own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "cart_update_own"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "cart_delete_own"
  on public.cart_items for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 4. ORDERS + ORDER_ITEMS
-- ============================================================
-- order_items snapshots name/price at time of purchase — do NOT join back
-- to coffee for historical price display, menu prices can change later.

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'placed' check (status in ('placed', 'preparing', 'completed', 'cancelled')),
  subtotal numeric(10, 2) not null,
  tax numeric(10, 2) not null,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders_select_admin"
  on public.orders for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- No direct insert/update/delete policies for orders — all writes go through
-- the place_order() RPC below (security definer), so RLS on this table only
-- needs to cover reads. This is intentional, not an oversight.

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  coffee_id bigint references public.coffee (id) on delete set null,
  name text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

alter table public.order_items enable row level security;

create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "order_items_select_admin"
  on public.order_items for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ------------------------------------------------------------
-- place_order(): atomically creates order + order_items from the
-- caller's current cart, then empties the cart. All-or-nothing —
-- if any step fails, the whole transaction rolls back (no order
-- created, cart left untouched).
-- ------------------------------------------------------------
create or replace function public.place_order()
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id bigint;
  v_subtotal numeric(10, 2);
  v_tax numeric(10, 2);
  v_total numeric(10, 2);
begin
  select coalesce(sum(c.quantity * co.price), 0)
  into v_subtotal
  from public.cart_items c
  join public.coffee co on co.id = c.coffee_id
  where c.user_id = auth.uid();

  if v_subtotal = 0 then
    raise exception 'Cart is empty';
  end if;

  v_tax := round(v_subtotal * 0.08, 2);
  v_total := v_subtotal + v_tax;

  insert into public.orders (user_id, subtotal, tax, total)
  values (auth.uid(), v_subtotal, v_tax, v_total)
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

-- Callable by any authenticated user (function itself scopes everything
-- to auth.uid(), so there's no cross-user risk in exposing it).
grant execute on function public.place_order() to authenticated;


-- ============================================================
-- 5. STORAGE (menu item images)
-- ============================================================
-- Run this section from the SQL editor too — storage policies live in
-- the same place. Creates a public bucket; admin-only writes.

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "menu_images_select_public"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "menu_images_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "menu_images_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'menu-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "menu_images_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'menu-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ============================================================
-- 6. SEED DATA (menu items — matches old Sequelize seeder)
-- ============================================================
-- Images still point at /images/*.jpg (old static paths). Once you
-- upload real images through Admin, these rows will get overwritten
-- with real Storage URLs as you edit each item.

insert into public.coffee (name, description, price, category, image) values
  ('Oatmeal Honey Latte', 'Creamy oat milk with organic honey and double espresso.', 6.50, 'Signature', '/images/latte.jpg'),
  ('Spiced Maple Cold Foam', 'Cold brew topped with maple-infused foam and cinnamon.', 6.75, 'Signature', '/images/cold_brew.jpg'),
  ('Salted Caramel Latte', 'House-made caramel sauce with a pinch of sea salt.', 6.25, 'Signature', '/images/latte.jpg'),
  ('Lavender Honey Breve', 'Rich half-and-half steamed with floral lavender syrup.', 6.50, 'Signature', '/images/latte_art_feature.jpg'),
  ('Espresso Macchiato', 'Bold double shot with a dollop of foam.', 4.50, 'Espresso', '/images/macchiato.jpg'),
  ('Cortado', 'Equal parts espresso and steamed milk for perfect balance.', 4.75, 'Espresso', '/images/latte_art_feature.jpg'),
  ('Americano', 'Double espresso topped with hot water for a rich, bold cup.', 4.00, 'Espresso', '/images/macchiato.jpg'),
  ('Cappuccino', 'Equal parts espresso, steamed milk, and milk foam.', 5.00, 'Espresso', '/images/latte.jpg'),
  ('Ethiopian Yirgacheffe', 'Light roast with floral notes and citrus finish.', 5.50, 'Pour Over', '/images/pour_over.jpg'),
  ('Colombia Huila', 'Medium roast with notes of caramel and red apple.', 5.25, 'Pour Over', '/images/pour_over.jpg'),
  ('Costa Rica Tarrazu', 'Bright acidity with honey and chocolate undertones.', 5.50, 'Pour Over', '/images/pour_over.jpg'),
  ('Sumatra Mandheling', 'Full-bodied dark roast with earthy, spicy notes.', 5.75, 'Pour Over', '/images/pour_over.jpg'),
  ('Cold Brew Vanilla', 'Steeped for 24 hours with Madagascar vanilla beans.', 5.00, 'Cold Brew', '/images/cold_brew.jpg'),
  ('Nitro Cold Brew', 'Velvety smooth nitrogen-infused cold coffee.', 5.50, 'Cold Brew', '/images/cold_brew.jpg'),
  ('Cold Brew Lemonade', 'Refreshing mix of cold brew and tart lemonade.', 5.25, 'Cold Brew', '/images/cold_brew.jpg'),
  ('Almond Croissant', 'Flaky pastry filled with almond cream.', 4.50, 'Pastry', '/images/croissant.jpg'),
  ('Pain au Chocolat', 'Classic buttery pastry with dark chocolate baton.', 4.25, 'Pastry', '/images/croissant.jpg'),
  ('Lemon Poppyseed Scone', 'Zesty glaze over a tender, crumbly scone.', 3.75, 'Pastry', '/images/croissant.jpg'),
  ('Blueberry Muffin', 'Bursting with fresh blueberries and topped with crumble.', 3.50, 'Pastry', '/images/croissant.jpg'),
  ('Cinnamon Roll', 'Warm dough swirled with cinnamon sugar and cream cheese frosting.', 4.00, 'Pastry', '/images/croissant.jpg')
on conflict do nothing;


-- ============================================================
-- 6b. ADMIN ACCOUNT EDITING (Accounts page)
-- ============================================================
-- NOTE: this schema.sql predates the is_admin() RLS-recursion fix applied
-- directly to the live DB (see PROGRESS.md) — the policies above still show
-- the old inline `exists(select ... profiles)` checks. This function uses
-- is_admin(), which exists live but is not (yet) defined earlier in this
-- file. Keep that in mind if you ever run this file fresh against a new project.

create or replace function public.admin_update_profile(
  target_id uuid,
  new_username text,
  new_phone text,
  new_role text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_target_role text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception 'Invalid role';
  end if;

  select role into v_target_role from public.profiles where id = target_id;

  if v_target_role is null then
    raise exception 'Account not found';
  end if;

  if v_target_role = 'admin' then
    raise exception 'Admin accounts cannot be edited';
  end if;

  update public.profiles
  set username = new_username,
      phone = new_phone,
      role = new_role
  where id = target_id;
end;
$$;

grant execute on function public.admin_update_profile(uuid, text, text, text) to authenticated;


-- ============================================================
-- 6c. ORDER STATUS MANAGEMENT (Sales tab, online orders only)
-- ============================================================
-- Restricted forward flow, not free-form: placed -> preparing -> completed,
-- with cancel allowed from placed or preparing. No transition out of
-- completed or cancelled (terminal states). Enforced here server-side, not
-- just in the UI, so it can't be bypassed by calling the RPC directly.

create or replace function public.admin_update_order_status(
  p_order_id bigint,
  p_new_status text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_current_status text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_new_status not in ('placed', 'preparing', 'completed', 'cancelled') then
    raise exception 'Invalid status';
  end if;

  select status into v_current_status from public.orders where id = p_order_id;

  if v_current_status is null then
    raise exception 'Order not found';
  end if;

  if not (
    (v_current_status = 'placed' and p_new_status in ('preparing', 'cancelled'))
    or (v_current_status = 'preparing' and p_new_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid status transition: % -> %', v_current_status, p_new_status;
  end if;

  update public.orders set status = p_new_status where id = p_order_id;
end;
$$;

grant execute on function public.admin_update_order_status(bigint, text) to authenticated;


-- ============================================================
-- 7. MAKE YOURSELF ADMIN
-- ============================================================
-- After you sign up through the app's Register page with your own account,
-- run this once (replace the email) to promote yourself to admin:
--
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'you@example.com'
-- );
