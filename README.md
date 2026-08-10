# CaffeineCo

A coffee shop web app — customer ordering + an admin console (dashboard, POS, inventory, sales, accounts).

## Stack

- **Frontend**: React 19 + Vite (`client/`)
- **Backend**: Supabase (Postgres + Auth + Storage) — no separate server. All data access goes through the Supabase client SDK or Postgres RPCs (`supabase/schema.sql`).

## Project Structure

- `client/` — the React app. Pages, components, and `src/lib/api/*` (thin wrappers around Supabase calls).
- `supabase/schema.sql` — full schema: tables, RLS policies, RPC functions (checkout, POS orders, order status, admin account edits), Storage bucket/policies, seed data.
- `PROGRESS.md` — the source of truth for project state, decisions made, and what's done vs. not. Read this before making changes; it's kept current, this README is not guaranteed to be.

## Running Locally

1. Set up a Supabase project and run `supabase/schema.sql` against it in the SQL editor.
2. In the Supabase dashboard, turn off "Confirm email" under Authentication → Providers → Email (or leave it on if you want that flow).
3. Copy `client/.env.example` to `client/.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from your project settings.
4. Install and run:
   ```bash
   npm run install-all
   npm run dev
   ```
   Runs on http://localhost:5173.

## Admin Access

After registering an account through the app, promote it to admin — see the snippet at the bottom of `supabase/schema.sql`.
