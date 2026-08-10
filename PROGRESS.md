# CaffeineCo — Project Tracker

Last updated: 2026-08-10

## Current State

- **Stack**: React 19 + Vite (client) / Supabase (Postgres + Auth + Storage). No backend server — `server/` and all backend Docker files have been removed from the project (quarantined in `_deleted/`, which still needs manual deletion from disk — see Dead Weight Cleanup entry below).
- **Deployment target**: Vercel (frontend) + Supabase (DB/auth/storage). Not deployed yet.
- **Supabase project**: LIVE. Org: DEV-PROJECT-2 (separate org created since the original org, VALCERE IT SOLUTIONS, had used up its 2 free-tier project slots — free tier allows 2 active projects per org, not per account). Project ref `eoxgxnlsjqphrskaofah`, region `ap-southeast-1`. `schema.sql` has been run. `client/.env` is populated with the real URL + anon key. `npm install` done in `client/`. Admin account exists (`jayronxjavier@gmail.com`, username `jayronj16`, role promoted to admin).
- `README.md` rewritten to describe the actual Supabase-only stack. `DOCKER_SETUP.md`/`LOOK_HERE.txt` (stale, described a dead MySQL/MongoDB/Docker setup) are quarantined, not deleted from disk yet.

---

## What's Done

### Supabase schema (`supabase/schema.sql`) — written and RUN against the live project
- `profiles` table (id, username, phone, role) + auto-create trigger on signup
- `coffee` table + RLS: public read, admin-only write
- `cart_items` table + RLS: scoped to `auth.uid()`, `unique(user_id, coffee_id)` constraint
- `orders` + `order_items` tables + RLS (own orders for users, all orders for admins)
- `place_order()` Postgres function (security definer): atomically creates an order + order_items from the caller's cart and clears the cart. All-or-nothing — chose this over sequential client-side calls specifically because a partial failure on checkout (order created, no line items, or cart cleared with no order) is a real money/trust problem, not a cosmetic bug.
- `menu-images` Storage bucket + policies: public read, admin-only write
- Seed insert for the same ~20 menu items as the old Sequelize seeder (still pointing at old `/images/*.jpg` static paths — will get overwritten as items are edited with real uploads)
- Note at the bottom for promoting your own account to admin after first signup
- Since run: `public.is_admin()` fix, `admin_update_profile()`, and `admin_void_pos_order()` have all been appended (see their entries below) — `schema.sql` reflects the live project's current state.

### Frontend — rewritten to use Supabase directly
- `src/lib/supabaseClient.js` — client init from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
- `src/lib/api/auth.js` — register/login/logout/getProfile/getAllProfiles/adminUpdateProfile
- `src/lib/api/menu.js` — menu CRUD
- `src/lib/api/cart.js` — cart CRUD
- `src/lib/api/storage.js` — `uploadMenuImage()`, returns a public URL
- `src/lib/api/orders.js` — `placeOrder()` (calls the RPC), `getMyOrders()`, `getAllOrders()` (customer + POS merged), `placePosOrder()`, `voidPosOrder()`
- `src/context/AuthContext.jsx` — single source of truth for session/profile/role
- `App.jsx` — wrapped in `AuthProvider`
- `Login.jsx` — email-based login (Supabase Auth is email-only; decided against denormalizing email onto `profiles`); redirects admins straight to `/admin` (see Login Redirect entry below)
- `Register.jsx` — collects username (→ `profiles` via trigger) + email (→ auth)
- `Navbar.jsx` — uses `useAuth()` instead of localStorage; links to `/`, `/menu`, `/origins`, `/story`
- `Menu.jsx` — uses `useAuth()` + `menu.js`/`cart.js`. Public "Seed Menu Data" button removed (was an unauthenticated reset endpoint — bad pattern; seeding is now a one-time SQL script)
- `Cart.jsx` — **real checkout**: calls `placeOrder()`, clears cart on success, shows error dialog on failure (e.g. empty cart) instead of always succeeding
- `Origins.jsx` / `OurStory.jsx` — static marketing pages (`/origins`, `/story`), linked from `Navbar.jsx`. No data fetching, no Supabase involvement — content only.
- Admin UI is now the dashboard shell under `pages/admin/` (see Admin Dashboard Restructure below) — the old flat `pages/Admin.jsx` and `pages/POS.jsx` are unreferenced dead code, same status as `server/`.
- `client/.env.example` added
- `client/package.json` — added `@supabase/supabase-js`, removed unused `axios`/`jwt-decode`

---

## NOT Done Yet — Blocking End-to-End

- [ ] **Email confirmation: decided OFF for now.** Turn it off in Supabase Dashboard → Authentication → Providers → Email → "Confirm email" toggle. Not done automatically — that's a dashboard setting, not something in code.

Everything else in this section (project creation, schema run, `.env`, `npm install`, admin account, storage bucket) is done — see Current State above.

## Known Gaps (decided, not yet built — real follow-ups, not forgotten)

- **Admin Sales tab shows raw `user_id` (UUID), not a username** for online orders. Needs a join to `profiles` in `getAllOrders()` — small follow-up, not done in this pass since it wasn't asked for explicitly.
- **No order status management for online orders.** Orders always show `status: 'placed'`; no UI to mark preparing/completed/cancelled. You asked for "view orders," not "manage orders" — this is the line I stopped at. (POS orders now have Void — see entry below — but that's not status management, it's delete.)
- **Old orphaned Storage files are never deleted** when an admin replaces an image — decided explicitly: leave orphans, clean up later, rather than risk deleting a file still referenced somewhere.
- **`addToCart` in `cart.js` is read-then-write, not atomic** (small race window on rapid double-add of the same item in two tabs). Not yet fixed — planned in the small-bugs pass.
- **Tax rate (8%) is duplicated in four places**: `place_order()` SQL, `Cart.jsx`'s display calc, `place_pos_order()` SQL, `POS.jsx`'s display calc. All four currently agree at 8%. No shared source of truth — planned in the small-bugs pass.
- **No promote/demote UI on Accounts beyond the edit modal's role field** — see Admin Accounts entry below for what the modal does and doesn't allow.
- **No pagination on Accounts or Sales** — fine at current scale, will need it once order/user volume grows.
- **No POS order history/receipt lookup screen** beyond what shows in the merged Sales tab.

---

## Migration Checklist (Backend)

- [x] Decide Supabase adoption scope — full (client SDK + Auth), no Sequelize/JWT
- [x] Decide `server/` fate — removed from the data path (not yet deleted from disk)
- [x] Decide role storage — `profiles` table
- [x] Decide login identifier — email (not username)
- [x] Decide image handling — real upload via Supabase Storage
- [x] Decide email confirmation — off for now
- [x] Decide checkout — real, persisted, atomic via RPC
- [x] Decide admin order visibility — yes, Sales tab
- [x] Decide orphaned image cleanup — not for now
- [x] Create Supabase project, get URL + anon key
- [x] Run `supabase/schema.sql` in the Supabase SQL editor
- [ ] Turn off email confirmation in the dashboard
- [x] Delete `server/` from the active project — real source files quarantined to `_deleted/`; `server/node_modules` and the `_deleted/` folder itself still need manual removal from disk (no delete tool available, only move)
- [x] Delete or rewrite `DOCKER_SETUP.md` — quarantined, same caveat as above
- [x] Update `README.md` to describe the Supabase-only architecture
- [x] Decide fate of Docker Compose setup — dropped entirely (`docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile` all quarantined; `Dockerfile.frontend` kept, doesn't depend on `server/`)
- [x] Delete unreferenced dead code: `pages/Admin.jsx`, `pages/POS.jsx` — quarantined

---

## Deploying

- [ ] Frontend → Vercel (connect repo, set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Supabase project provisioned (production instance) — note dev is already live; decide whether prod is a separate project or the same one
- [ ] RLS policies verified in production — test as a non-admin user before going live, specifically: can't see other users' carts/orders, can't write to `coffee` or `menu-images`
- [ ] Confirm no seed/reset capability is publicly reachable in production
- [ ] Decide production email confirmation setting separately from dev (off-for-dev doesn't mean off-for-prod — worth reconsidering before going live)

---

## POS (Cashier) Feature — Added 2026-08-10

Real-world decision: POS sales are tracked in their own tables (not attributed to a customer account), but merged into the same Admin Sales view as customer orders so staff have one unified sales list, tagged with an Online/POS badge.

### Done
- `pos_orders` + `pos_order_items` tables — admin-only RLS (select only; all writes go through the RPC)
- `place_pos_order(items jsonb)` Postgres function (security definer): admin-only (checked server-side), atomic, prices looked up server-side from `coffee` — never trusts a client-submitted price. Same all-or-nothing pattern as `place_order()`.
- `client/src/lib/api/orders.js`: added `placePosOrder()`; `getAllOrders()` now fetches customer orders + POS orders in parallel and merges them sorted by `created_at`, each tagged with a `source` field (`'online'` | `'pos'`) and a normalized `items` array
- `client/src/pages/admin/POS.jsx` — admin-only page. Menu grid to tap-to-add, local cart state (not `cart_items` — that table is customer-only), quantity adjust/remove, checkout calls `place_pos_order()` via a confirm modal (see UI Design Pass entry below)
- Route `/admin/pos` (nested under `AdminLayout`)

### Not done
- No refund capability for POS orders (Void exists — see UI Design Pass entry below — but that's a hard delete, not a refund record)

## Admin Dashboard Restructure — Added 2026-08-10

Admin went from a single tabbed page (Menu/Orders) to a proper dashboard shell with sidebar nav, per real-world POS/admin conventions.

### Structure
- `client/src/pages/admin/AdminLayout.jsx` — sidebar shell (desktop) / horizontal scroll nav (mobile), holds the single admin auth guard (redirects non-admins to `/login`). All admin pages render inside its `<Outlet/>`.
- Nested routes in `App.jsx`: `/admin` (Dashboard), `/admin/sales`, `/admin/inventory`, `/admin/pos`, `/admin/accounts`
- `Dashboard.jsx` — sales summary only: today's total + order count, last-7-days rolling total + order count, all-time order count. Computed client-side from `getAllOrders()` (customer + POS merged). "Week" = rolling 7 days, not calendar week.
- `Sales.jsx` — the old Orders tab content, unchanged, just moved (merged Online/POS list with badge); now also has the Void button for POS orders (see UI Design Pass entry below)
- `Inventory.jsx` — the old Menu tab content, renamed only, same CRUD functionality
- `POS.jsx` (under `pages/admin/`) — same cashier POS as before, minus its own auth guard and "Back to Admin" link (redundant inside the shell)
- `Accounts.jsx` — lists username, phone, role, joined date via `getAllProfiles()` in `auth.js`. **No email shown** — email lives on `auth.users`, not `profiles`, and wasn't denormalized. Originally view-only; now has edit via modal (see Admin Accounts entry below).
- `pages/Admin.jsx` and `pages/POS.jsx` (the old flat versions) are unreferenced dead code, same pattern as `server/` — not deleted, just no longer imported anywhere.

## RLS Recursion Bug — Fixed 2026-08-10

**Root cause of "admin login still shows customer view":** the original `schema.sql`'s admin-check policies (`profiles_select_admin` and others) did `exists(select 1 from public.profiles where ... role = 'admin')` *from within a policy on `profiles` itself*. Postgres re-evaluates RLS on that inner query, which hits the same policy again — infinite recursion, surfaced as `500` / "infinite recursion detected in policy for relation profiles" on every profile fetch after login.

**Fix applied:** added `public.is_admin()`, a `SECURITY DEFINER` SQL function that checks the role bypassing RLS (runs as the function owner, not the calling user). Every admin-check policy across `profiles`, `coffee`, `orders`, `order_items`, `storage.objects`, `pos_orders`, `pos_order_items`, plus the inline check in `place_pos_order()`, now calls `public.is_admin()` instead of the recursive inline subquery. Confirmed fixed — admin login now resolves the role correctly.

**Note for later:** `place_order()` doesn't do an admin check (customers call it for themselves), so it wasn't affected. If any future policy or function needs an admin/role check, route it through `public.is_admin()` — never inline a `profiles` subquery inside a `profiles`-table policy again.

## Login Redirect — Added 2026-08-10

Admins now land on `/admin` (Dashboard) immediately after login instead of the customer homepage. `Login.jsx` fetches the profile right after `login()` succeeds and branches `navigate(isAdmin ? '/admin' : '/')`. If the profile fetch fails, it falls back to `/` (logged to console) rather than blocking login.

## Admin Accounts — Edit via Modal — Added 2026-08-10

Accounts page is no longer view-only. Edit button per row opens a modal (username, phone, role). Admin-role rows have no Edit button at all — enforced both in the UI and server-side: `admin_update_profile()` RPC (security definer) rejects any target whose current role is `admin`, so this can't be bypassed by calling the RPC directly either. Applied live to the Supabase project via the connector, and appended to `schema.sql` (with a note that `schema.sql` predates the `is_admin()` fix and would need it added if ever run fresh).

## Nav Fix — Admin Layout No Longer Shows Customer Navbar — Added 2026-08-10

`Navbar`/`Footer` were rendered globally in `App.jsx` outside `<Routes>`, so they showed on top of `AdminLayout`'s own sidebar on every `/admin/*` page. Fixed by moving the route tree into an inner `Layout` component (inside `<Router>`) that checks `location.pathname.startsWith('/admin')` and skips `Navbar`/`Footer` on admin routes.

## Admin UI Design Pass + POS Confirm Modal + Void Order — Added 2026-08-10

- **AdminLayout**: sidebar/mobile nav now has icons per section, rounded active-state pill instead of border-only. Top padding reduced (was compensating for the now-removed global navbar on admin routes).
- **Dashboard**: summary cards got icons + left accent bar per card.
- **Inventory**: list rows got rounded-xl cards, hover lift, bigger thumbnails.
- **POS**: "Charge & Place Order" no longer charges immediately — opens a confirm modal (itemized summary + subtotal/tax/total) first; charge only happens on explicit confirm.
- **Sales (POS void)**: POS orders (only — online orders are not voidable) now have a Void button. Clicking opens a modal requiring the admin to re-enter their own login password, verified via `supabase.auth.signInWithPassword()` before calling the new `admin_void_pos_order()` RPC (security definer, admin-only, hard-deletes the pos_order + its items). Applied live via the Supabase connector.

## Notes

- Keep this file as the source of truth. `README.md`/`LOOK_HERE.txt`/`DOCKER_SETUP.md` will keep drifting — don't trust them over this file.

## Admin Console Theme — Switched to Light — Added 2026-08-10

Admin console (`.admin-console` in `index.css`) was originally a dark "roastery" palette across every admin page including POS. Switched the whole console — sidebar, Dashboard, Sales, Inventory, POS, Accounts — to a light palette (cream ground, same copper/patina accent family, darkened slightly for contrast on white). Also fixed two spots that were hardcoded to the old dark hex values instead of the `--adm-*` variables and so didn't follow the switch: `AdminLayout.jsx`'s auth-loading screen, and the mobile nav's active-pill text color.

## Next Up — Planned, Not Started

Items 1 and 2 done — see entries below. Remaining, one at a time:

3. **Deploy** — connect the repo to Vercel, set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, verify RLS behaves correctly as a non-admin before calling it live.
4. **Fix the small bugs** — join `profiles` into `getAllOrders()` so Sales shows usernames instead of raw UUIDs; make `addToCart` atomic instead of read-then-write; centralize the 8% tax rate instead of four separate hardcoded copies.

## Order Status Management (Online Orders) — Added 2026-08-10

Biggest functional gap from the "Next Up" list, now done. `orders.status` already existed in the schema (`placed`/`preparing`/`completed`/`cancelled`) but there was no way to change it — `orders` has no insert/update/delete RLS policies by design, so even a raw `.update()` would've been silently rejected.

- **`admin_update_order_status(p_order_id, p_new_status)`** — new `security definer` RPC, admin-only via `is_admin()`. Enforces a restricted forward flow server-side (not just in the UI, so it can't be bypassed by calling the RPC directly): `placed → preparing`, `preparing → completed`, and `cancelled` allowed from either `placed` or `preparing`. No transition out of `completed`/`cancelled` (terminal states), and no skipping straight from `placed` to `completed`. Applied live to the Supabase project (`eoxgxnlsjqphrskaofah`) via the connector, appended to `schema.sql` as section 6c.
- **`orders.js`**: added `updateOrderStatus(orderId, newStatus)` wrapping the RPC.
- **`Sales.jsx`**: online orders (`source === 'online'`) now show contextual action buttons instead of a static status label — a `placed` order shows "Start Preparing"/"Cancel", a `preparing` order shows "Mark Completed"/"Cancel", terminal states show no actions. POS orders untouched — still Void only, no status concept.
- Note: earlier entries in this file describe applying changes "live via the connector" — that connector was not actually available for a stretch of this session and had to be reconnected/reauthorized partway through. If a future session can't see Supabase tools, that's a connector-availability issue on the user's end, not a sign the project itself changed.

## Dead Weight Cleanup — Added 2026-08-10

Removed the entire legacy Express/Sequelize/MySQL backend and its Docker infrastructure from the active project, plus unreferenced dead frontend files.

- **`server/`** (Express API, `index.js`, `check_db.js`, `.env`, `package.json`) — confirmed genuinely dead: was only referenced by root `package.json` scripts and the Docker files below, none of which touch the live Supabase app.
- **`docker-compose.yml`** (MySQL + phpMyAdmin + backend + frontend), **`docker-compose.dev.yml`** (MongoDB variant — inconsistent with the MySQL prod file, never a working pair, further evidence this was already stale), **`Dockerfile`** (built `server/`) — all removed. **`Dockerfile.frontend`** kept — only builds the Vite client, no `server/` dependency.
- **`DOCKER_SETUP.md`**, **`LOOK_HERE.txt`** — both described the dead stack, removed.
- **`pages/Admin.jsx`**, **`pages/POS.jsx`** (flat, pre-dashboard-restructure versions) — confirmed unimported anywhere in `App.jsx`, removed.
- **Root `package.json`** — rewritten: dropped `--prefix server` from `install-all`/`dev`, dropped the `start` script and the `concurrently` devDependency entirely (both existed only to run frontend+backend together).
- **`README.md`** — rewritten from scratch to describe the actual Supabase-only stack, setup steps, and point to `PROGRESS.md` as the source of truth instead of itself.

**Caveat: nothing above is actually deleted from disk.** The Filesystem tool available in this session has no delete operation, only move/rename. Everything was moved into a new `_deleted/` folder at the project root instead. `_deleted/` (and the now-empty `server/node_modules` shell left behind, since regenerable `node_modules` wasn't moved) still needs to be manually deleted from disk by the user — not done automatically, same category as the email-confirmation toggle.
