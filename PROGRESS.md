# CaffeineCo — Project Tracker

Last updated: 2026-09-19 (unattended overnight session — see "2026-09-19" section below)

---

## 🔴 READ FIRST — the Supabase backend is GONE (2026-09-19)

**The live site is broken right now.** `caffeine-co-smoky.vercel.app` still
loads (Vercel is fine), but every piece of data on it fails, and the menu
page currently tells customers **"No items found."**

The Supabase project behind it — `eoxgxnlsjqphrskaofah` — **no longer
resolves in DNS at all**:

```
curl https://eoxgxnlsjqphrskaofah.supabase.co/rest/v1/
  -> exit 6, "Could not resolve host"
```

That is not a pause and not a network blip on this machine: a different
Supabase project tested from the same shell in the same minute answered
normally (HTTP 401, as expected without a key). A *paused* free project
still resolves. Not resolving at all points to the project being deleted
or reaped.

**This needs your Supabase dashboard — I can't fix it from code.** Until
it's sorted, nothing data-backed can be tested: no login, no menu, no
cart, no orders, no admin console, and none of the open RLS/RPC security
questions below can be answered.

**Tomorrow, in order:**
1. Log into Supabase and check whether project `eoxgxnlsjqphrskaofah`
   still exists (org DEV-PROJECT-2, region ap-southeast-1).
2. If it's gone: create a new project, run `supabase/schema.sql` against
   it, re-create the `menu-images` Storage bucket + policies, re-create
   the admin account, and update `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` in both `client/.env` and the Vercel project
   env vars.
3. Note `schema.sql` is **not** a complete rebuild script — see the
   schema-drift finding in the 2026-09-19 section. Run
   `supabase/schema_missing_pieces.sql` **after** it, and read that
   file's header first: it is reconstructed from the frontend's call
   contracts, not recovered from the live DB, and it touches money.

## Session Setup (read this first, don't ask Jayron to repeat it)

- Jayron works via two MCP connectors: **Filesystem** (project at `C:\Users\Jayro\OneDrive\Desktop\CaffeineCo`, check `list_allowed_directories` first) and **Supabase** (project ref `eoxgxnlsjqphrskaofah`, org `xmlzfamhiglwuryuiams`, already authorized — use it directly for schema/RPC/config changes, don't ask Jayron to paste SQL into the dashboard manually unless it's a setting only changeable there, e.g. the email-confirmation toggle).
- If either tool isn't showing up as loaded, that's a session/connector-availability issue — check via tool search, don't assume Jayron needs to reconnect anything or re-explain the project.
- Vercel: project **is** deployed (`caffeine-co-smoky.vercel.app`), root directory is set to `client/` in Vercel project settings — not the repo root. Any Vercel-level config file (`vercel.json`, etc.) goes in `client/`, not at the repo root.
- The Filesystem tool has **no delete operation**, only move/rename/write. If a task needs actual file deletion, use `bash_tool` (shell `rm`) if available in-session, or fall back to moving into `_deleted/` and telling Jayron it still needs manual removal.

## Current State

- **Stack**: React 19 + Vite (client) / Supabase (Postgres + Auth + Storage). No backend server.
- **Deployment target**: Vercel (frontend) + Supabase (DB/auth/storage). **Live** at `caffeine-co-smoky.vercel.app`.
- **Supabase project**: LIVE. Org: DEV-PROJECT-2. Project ref `eoxgxnlsjqphrskaofah`, region `ap-southeast-1`. `schema.sql` has been run. `client/.env` populated. Admin account exists (`jayronxjavier@gmail.com`, username `jayronj16`, role admin).
- Email confirmation: **OFF, confirmed done** in Supabase Dashboard (2026-08-11).
- `_deleted/` folder cleanup: **requested 2026-08-11, not yet confirmed complete** — see Open Items below.

---

## 2026-09-19 — unattended session (backend found dead, error handling fixed)

Ran while you were asleep, so everything here is either code-only or
read-only. Nothing was done that needed your approval.

### Found

1. **Backend gone** — see the red section at the top of this file.
2. **Every data-fetching page silently swallowed failures.** All seven
   pages caught their error, `console.error`'d it, then fell through to
   the ordinary empty state. A dead backend was therefore
   indistinguishable from an empty shop:
   - `/menu` → "No items found." (this is what the live site says today)
   - Sales → "No orders yet."
   - Dashboard → 0 orders, 0.00 revenue — i.e. it shows an owner a
     normal-looking zero-sales day when the truth is the server is
     unreachable. Worst one of the set.
   - POS → an empty till the cashier cannot ring anything up from, with
     nothing on screen explaining why.
3. **Two unhandled promise rejections**: `Inventory.fetchMenu` had no
   `try/catch` at all, and `POS`'s `getMenu()` had no `.catch()`.
4. **Schema drift — `supabase/schema.sql` is NOT the full live schema,
   and is not runnable as a rebuild script.** This file previously
   claimed it "reflects the live project's current state". It does not.
   Missing entirely:
   - `public.is_admin()` — and yet `admin_update_profile()` and
     `admin_update_order_status()`, both defined *in that same file*,
     call it (lines 336 and 384). Run schema.sql against a fresh
     project and those two functions reference something that doesn't
     exist.
   - `public.add_to_cart()` — called by `cart.js`
   - `public.place_pos_order()`, `public.admin_void_pos_order()`
   - `public.pos_orders` / `public.pos_order_items`
5. **`place_order()` in schema.sql still charges 8% tax** (line 224:
   `v_tax := round(v_subtotal * 0.08, 2)`), even though tax was removed
   from the product — `Cart.jsx` shows a single Total with no tax line
   and `POS.jsx` literally does `const total = subtotal;`. Rebuilding
   from schema.sql as-is would **charge every customer 8% more than the
   cart showed them.** Money bug, latent until a rebuild.

### Written for the rebuild: `supabase/schema_missing_pieces.sql`

Since findings 4 and 5 would have blocked (or silently broken) the
rebuild, I reconstructed the missing pieces into a new file to run
after `schema.sql`: `is_admin()`, `add_to_cart()`, the two POS tables
with admin-only RLS, `place_pos_order()`, `admin_void_pos_order()`, a
tax-corrected `place_order()`, and `revoke ... from anon` grants on the
admin RPCs.

**Caveats, stated plainly:** the live definitions are gone, so bodies
are reconstructed from the exact contracts the frontend calls with
(argument names, shapes, return values, selected columns) plus the
decisions recorded in this file — they are a faithful best effort, not
the original source. And **the SQL has not been executed anywhere**:
there is no live project to run it against and no local Postgres (no
Docker). Signatures should be correct because the client would break
otherwise; bodies need your eyes before they touch money.

### Fixed and pushed (commit `ebead08`)

- New `client/src/components/ErrorState.jsx` — honest failure message +
  a working "Try again", styled for both the customer and admin
  palettes.
- Wired into all seven fetching pages, keeping a real empty result
  visually distinct from a failure.
- Both unhandled rejections above now handled.
- Verified live against the currently-dead backend: `/menu` shows the
  error state and Try again re-fires the fetch. All public routes still
  render, `npm run build` clean.
- **Not verified live: the admin pages.** They sit behind a login that
  needs the same dead backend, so Dashboard / Sales / Inventory / POS /
  Accounts were checked by build and code review only. Worth a
  click-through once the DB is back.

### Checked, no bug found

- `order_items` / `pos_order_items` snapshot `name` and `price` at order
  time, so deleting a menu item doesn't corrupt order history. Correct
  as-is.
- `cart_items.coffee_id` is `on delete cascade`, so a deleted coffee
  can't leave a null-dereferencing row in someone's cart.
- `AdminLayout`'s route guard is fail-closed (waits for auth to resolve,
  redirects non-admins, renders nothing mid-redirect) and is only
  defence-in-depth over the server-side `is_admin()` checks anyway.

### Open Item 2 (admin RPCs callable by `anon`) — partially answered

Read the function bodies in `schema.sql` directly rather than trusting
the older notes:

- `admin_update_profile` — **has** the `if not public.is_admin() then
  raise exception 'Not authorized'` guard. ✅
- `admin_update_order_status` — **has** the same guard. ✅
- `admin_void_pos_order` — **cannot be verified.** Not in `schema.sql`
  at all (see schema drift above), and the live DB is unreachable.
- `place_pos_order` — **same, cannot be verified.**

I wrote a non-destructive probe to answer this empirically (calls each
RPC anonymously with a nonexistent UUID, so a missing guard would be
revealed by the error message without touching a real row) but it
couldn't run — no backend. **Re-run that idea once the DB is back**; it's
the only way to actually close this item, and two admin-only, money- and
account-touching functions currently have *no* verified authorization.

### Blocked on you

- **`_deleted/` + `server/` cleanup (Open Item 1)** — I confirmed
  nothing in live code references either path, and that
  `_deleted/server/.env` was never committed (checked git history, so no
  leaked credentials — it's just dead local MySQL creds). The deletion
  itself was blocked by this session's permission guard as irreversible
  local destruction. `_deleted/` is 12 tracked files (recoverable from
  history after deletion); `server/` is 26 MB of untracked
  `node_modules` for the long-removed Express server. Say the word and
  it's a one-liner.

---

## Open Items (as of 2026-08-11)

1. **[OPEN] Verify `_deleted/` and `server/node_modules` are actually removed from disk.** Deletion was requested this session but not confirmed finished before session ended. Filesystem MCP has no delete op — check whether `bash_tool` is available and use `rm -rf` on those paths, or confirm with Jayron it was done another way.
2. **[OPEN] Confirm admin RPCs reject anonymous callers.** `get_advisors` (security) flagged `admin_update_order_status`, `admin_update_profile`, `admin_void_pos_order`, `place_pos_order` as executable by the `anon` role. Prior notes in this file *claim* each has an internal `is_admin()` guard, but that has **not been directly verified against live function source** this session — only assumed from earlier written notes. Next step: query `information_schema.routines` / `pg_proc` via `Supabase:execute_sql` (or diff against `schema.sql`) to confirm the guard is actually present in each function body before calling this closed.
3. **[OPEN — dashboard only] `auth_leaked_password_protection` is disabled** in Supabase Auth settings. Flagged by `get_advisors`. Not fixable via connector — Jayron needs to toggle it in the dashboard, same category as the email-confirmation setting.
4. **[PAUSED, per Jayron] Confirm no seed/reset endpoint is publicly reachable in production.** Not started.
5. **[PAUSED, per Jayron] Decide production email-confirmation setting separately from dev.** Not started — note dev is now OFF; don't assume prod should match without asking.
6. **RLS "verification" so far is a static policy/advisor read, not a live non-admin-session test.** No browser/session-level test as an actual non-admin user has been performed. If Jayron wants that level of confidence, it needs either a manual walkthrough logged in as a non-admin account, or a scripted test — the Supabase connector can inspect and query but can't simulate an authenticated non-admin browser session.

---

## What's Done

### Supabase schema (`supabase/schema.sql`) — written and RUN against the live project
- `profiles` table (id, username, phone, role) + auto-create trigger on signup
- `coffee` table + RLS: public read, admin-only write
- `cart_items` table + RLS: scoped to `auth.uid()`, `unique(user_id, coffee_id)` constraint
- `orders` + `order_items` tables + RLS (own orders for users, all orders for admins)
- `place_order()` Postgres function (security definer): atomically creates an order + order_items from the caller's cart and clears the cart. All-or-nothing.
- `menu-images` Storage bucket + policies: public read, admin-only write
- Seed insert for ~20 menu items
- `public.is_admin()`, `admin_update_profile()`, `admin_void_pos_order()`, `admin_update_order_status()`, `add_to_cart()` all appended since initial run — `schema.sql` reflects the live project's current state.

### Frontend — rewritten to use Supabase directly
- `src/lib/supabaseClient.js` — client init from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
- `src/lib/api/auth.js` — register/login/logout/getProfile/getAllProfiles/adminUpdateProfile
- `src/lib/api/menu.js` — menu CRUD
- `src/lib/api/cart.js` — cart CRUD (atomic via `add_to_cart` RPC)
- `src/lib/api/storage.js` — `uploadMenuImage()`, returns a public URL
- `src/lib/api/orders.js` — `placeOrder()`, `getMyOrders()`, `getAllOrders()` (customer + POS merged, username-joined), `placePosOrder()`, `voidPosOrder()`, `updateOrderStatus()`
- `src/context/AuthContext.jsx` — single source of truth for session/profile/role
- `Login.jsx` — email-based login, redirects admins straight to `/admin`
- `Register.jsx` — collects username (→ `profiles` via trigger) + email (→ auth)
- `Navbar.jsx` — uses `useAuth()`; links to `/`, `/menu`, `/origins`, `/story`
- `Menu.jsx` — uses `useAuth()` + `menu.js`/`cart.js`
- `Cart.jsx` — real checkout via `placeOrder()`, no tax (removed, see history)
- `Origins.jsx` / `OurStory.jsx` — static marketing pages
- Admin UI is the dashboard shell under `pages/admin/` (Dashboard, Sales, Inventory, POS, Accounts)
- `client/.env.example` added

---

## Known Gaps (decided, not yet built — real follow-ups, not forgotten)

- **Old orphaned Storage files are never deleted** when an admin replaces an image — decided explicitly, leave for later.
- **No promote/demote UI on Accounts beyond the edit modal's role field.**
- **No pagination on Accounts or Sales** — fine at current scale.
- **No POS order history/receipt lookup screen** beyond the merged Sales tab.
- **No refund capability for POS orders** — Void exists (hard delete), not a refund record.

---

## Deploying

- [x] Frontend → Vercel — deployed at `caffeine-co-smoky.vercel.app`, root directory `client/`, env vars set
- [x] Vercel SPA rewrite (`client/vercel.json`) — fixed 404-on-refresh, **confirmed live and working by Jayron 2026-08-11**
- [ ] Supabase project provisioned (production instance) — dev is live; decide whether prod is a separate project or the same one
- [ ] RLS policies verified in production — see Open Item 6 above, static check only so far
- [ ] Confirm no seed/reset capability is publicly reachable in production — Open Item 4, paused
- [ ] Decide production email confirmation setting separately from dev — Open Item 5, paused

---

## Vercel SPA 404 Fix — 2026-08-10, confirmed working 2026-08-11

**Symptom:** direct load or hard refresh on a client-side route (e.g. `/login`) returned Vercel's `404: NOT_FOUND`. In-app navigation worked fine.

**Root cause:** no `vercel.json` existed anywhere in the repo, so Vercel had no rewrite rule to serve `index.html` for unmatched paths on direct/refresh requests.

**Fix:** created `client/vercel.json` (root directory is `client/`, not repo root):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Confirmed fixed and live as of 2026-08-11.

---

## RLS Security Check — 2026-08-11

Ran `Supabase:get_advisors` (type: security) against the live project. Results and disposition:

- **Non-issues**: `add_to_cart`, `place_order` correctly callable by `authenticated`; `handle_new_user` trigger; `is_admin()` callable by anyone (returns boolean only, no data exposure) — all expected.
- **Open, needs verification**: `admin_update_order_status`, `admin_update_profile`, `admin_void_pos_order`, `place_pos_order` flagged as executable by `anon`. Believed safe (internal `is_admin()` guard per earlier notes) but not directly confirmed against live function source this session — see Open Item 2.
- **Open, dashboard-only fix**: `auth_leaked_password_protection` disabled — see Open Item 3.
- This was a static policy/advisor read via the connector, **not** a live test as an authenticated non-admin user — see Open Item 6 for the distinction.

---

## POS (Cashier) Feature

Real-world decision: POS sales tracked in their own tables (not attributed to a customer account), merged into the same Admin Sales view as customer orders, tagged Online/POS.

- `pos_orders` + `pos_order_items` tables — admin-only RLS
- `place_pos_order(items jsonb)` — security definer, admin-only, atomic, server-side price lookup
- `POS.jsx` — tap-to-add menu grid, local cart state, checkout via confirm modal (itemized summary) before charging
- Route `/admin/pos`
- No refund capability — Void only (hard delete)

## Admin Dashboard Restructure

- `pages/admin/AdminLayout.jsx` — sidebar shell / mobile horizontal nav, single admin auth guard, `<Outlet/>`
- Nested routes: `/admin` (Dashboard), `/admin/sales`, `/admin/inventory`, `/admin/pos`, `/admin/accounts`
- `Dashboard.jsx` — today's total/count, rolling-7-day total/count, all-time count, computed client-side
- `Sales.jsx` — merged Online/POS list, status actions for online orders, Void for POS orders
- `Inventory.jsx` — menu CRUD (renamed from old Menu tab)
- `Accounts.jsx` — username/phone/role/joined date, edit via modal (blocked from touching admin rows, enforced server-side too)
- Old flat `pages/Admin.jsx`/`pages/POS.jsx` — removed (see Dead Weight Cleanup)

## RLS Recursion Bug — Fixed

**Root cause:** original admin-check policies did an inline `profiles` subquery from within a policy on `profiles` itself → infinite recursion → 500 errors on profile fetch after login.

**Fix:** `public.is_admin()`, a `SECURITY DEFINER` function bypassing RLS, used by every admin-check policy/function across the schema. **Rule going forward: any future admin/role check must route through `is_admin()` — never an inline `profiles` subquery inside a `profiles`-table policy.**

## Login Redirect
Admins land on `/admin` immediately after login (`Login.jsx` checks role, branches navigate target). Falls back to `/` if profile fetch fails.

## Admin Accounts — Edit via Modal
Edit button per row (username/phone/role) except admin rows — no Edit button shown, and `admin_update_profile()` RPC also rejects any target currently role=admin server-side (can't bypass via direct RPC call either).

## Nav Fix
`Navbar`/`Footer` no longer render on `/admin/*` routes — moved into an inner `Layout` component that checks `location.pathname.startsWith('/admin')`.

## Admin UI Design Pass
Light theme across the whole admin console (cream ground, copper/patina accents), icons on nav, rounded cards, POS confirm-before-charge modal, POS Void with password re-verification via `signInWithPassword()` before calling `admin_void_pos_order()`.

## Order Status Management (Online Orders)
`admin_update_order_status(p_order_id, p_new_status)` — security definer, admin-only, enforces forward-only flow server-side: `placed → preparing → completed`, `cancelled` allowed from `placed` or `preparing` only, no skipping straight to `completed`, no transitions out of terminal states. `Sales.jsx` shows contextual action buttons per order based on current status.

## Tax Removed, Atomic Cart, Sales Username Join
- Tax removed entirely (not centralized — removed). `place_order()`/`place_pos_order()` insert `tax = 0`, `total = subtotal`. All frontend tax displays/calcs removed from `Cart.jsx` and `POS.jsx`. `tax` column kept (unused going forward) for historical order compatibility.
- `addToCart` made atomic via `add_to_cart()` RPC (single `insert ... on conflict do update`, scoped to `auth.uid()`).
- Sales username join: separate `profiles` lookup keyed on distinct `user_id`s in the current page of orders (not an embedded FK-based select) — `Sales.jsx` shows username, falls back to raw UUID if a lookup misses.

## Dead Weight Cleanup
Removed (moved to `_deleted/`, not yet actually deleted from disk — see Open Item 1): legacy `server/` (Express/Sequelize), `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile` (kept `Dockerfile.frontend`), `DOCKER_SETUP.md`, `LOOK_HERE.txt`, old flat `pages/Admin.jsx`/`pages/POS.jsx`. Root `package.json` rewritten to drop server-related scripts/deps. `README.md` rewritten to describe the actual stack.

## Notes
Keep this file as the source of truth. `README.md`/`LOOK_HERE.txt`/`DOCKER_SETUP.md` (if still present) will keep drifting — don't trust them over this file.
