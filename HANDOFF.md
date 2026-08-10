# CaffeineCo — Session Handoff Prompt

Paste this into a new Claude chat to resume work on CaffeineCo.

---

I'm continuing work on **CaffeineCo**, a coffee shop web app.
Project path: `C:\Users\Jayro\OneDrive\Desktop\CaffeineCo` (accessible via the Filesystem MCP tool — check `list_allowed_directories` first).

**Before doing anything else, read `PROGRESS.md` in the project root.** It has the current state, what's done, what's blocking, and every decision made so far. Don't ask me questions that are already answered in there.

## Quick context (so you don't have to re-derive it)

- Stack: React 19 + Vite (client) on Supabase (Postgres + Auth + Storage). Migrated off Express/Sequelize/MySQL. `server/` is dead code, not yet deleted.
- Supabase project is **live and provisioned**: schema run, `.env` populated, `npm install` done, admin account exists. Not a "pending setup" project anymore.
- Beyond the original customer-facing app (menu, cart, real checkout via an atomic `place_order()` RPC), the following has since been built:
  - A full **POS (cashier) feature** — walk-in orders, separate tables, merged into one Sales view with an Online/POS badge
  - Admin restructured from a single tabbed page into a proper **dashboard shell** (`pages/admin/`) — Dashboard, Sales, Inventory, POS, Accounts, sidebar nav. Old flat `pages/Admin.jsx`/`pages/POS.jsx` are unreferenced dead code.
  - An **RLS infinite-recursion bug** in the admin-check policies was found and fixed via a `public.is_admin()` SECURITY DEFINER function — route any future admin/role check through that, never an inline `profiles` subquery inside a `profiles` policy.
  - Admin login now redirects straight to `/admin`
  - Admin Accounts page got edit-via-modal (username/phone/role), server-side blocked from touching admin rows
  - POS orders can be **voided** (password-reverify + hard delete via RPC); online orders are not voidable
- **Only real blocker left**: turning off email confirmation in the Supabase Dashboard (Authentication → Providers → Email → "Confirm email" toggle) — this is a dashboard setting, not code, so I have to do it myself.

## Known gaps — decided, not bugs to "fix" unless I ask

- Admin Sales tab shows raw `user_id` (UUID), not username, for online orders — needs a join to `profiles`, deliberately skipped
- No status management for online orders (placed/preparing/completed) — view-only was the ask; POS Void is a separate, unrelated capability (delete, not status)
- `addToCart` in `cart.js` is read-then-write, not atomic — low stakes, left as-is on purpose
- Tax rate (8%) is duplicated in four places (`place_order()` SQL, `Cart.jsx`, `place_pos_order()` SQL, `POS.jsx`) — no shared source of truth yet, all four currently agree
- No pagination on Accounts or Sales — fine at current scale
- Orphaned Storage files on image replace are left alone, not cleaned up

## How I want you to work

- Ask for context and the specific relevant code before doing anything — don't assume.
- No sugarcoating. If something's wrong or a bad idea, say so plainly.
- Don't send code inline unless I ask — explain or plan first, then write directly to the files via the Filesystem tool once we agree on approach.
- Update `PROGRESS.md` whenever the state of the project changes — that file is the source of truth, not `README.md`/`LOOK_HERE.txt`/`DOCKER_SETUP.md` (those drift and are known to be partly wrong).

Start by asking me what I want to work on this session — there's no longer a fixed "next step" from a blocker list; the project is in a working, deployed-locally state and future work is feature-driven.
