# Young Achievers

Parents showcase a young player's achievements on a shareable page. Next.js 14 (App Router) + TypeScript + Supabase (auth, Postgres with RLS, storage).

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_init.sql` in the SQL editor. It creates the tables, RLS policies, the guard trigger and the private `photos` bucket.
3. Copy `.env.example` to `.env.local` and fill in the URL, anon key and **service role key**.
4. `npm install`
5. Create the owner account (once): `npm run create-admin -- <username> <password-10+chars>`
6. `npm run dev`, log in at `/login`. The admin lands on `/admin`.

## How it works

- **Admin** (`/admin`): sees every player, previews any profile (even unpublished), creates parent logins (username + password, which also creates that child's empty page and its slug), resets passwords, takes pages down or restores them. Restoring leaves the page as a draft; the parent must press Publish again.
- **Parent** (`/parent`): no signup. Logs in with the credentials the admin gave them, edits only their own child's page, and presses **Publish** to go live immediately (no approval). Can unpublish.
- **Public** (`/achievers/<slug>`): no login. `noindex` via metadata, an `X-Robots-Tag` header, and `robots.txt`. The home page lists no children.
- Payment appears nowhere in the code or UI.

## Security model

- Parent accounts are created server-side only, with the service-role key (`src/lib/supabase/admin.ts`, marked `server-only` so a client import fails the build). Every admin action calls `requireAdmin()` first.
- Usernames map to a synthetic email (`<username>@AUTH_EMAIL_DOMAIN`). No email is ever sent.
- RLS, not just app code, enforces access:
  - Anonymous users can read only achievers that are `published and not taken_down`.
  - A parent can read/update only the row where `owner_id = auth.uid()`; child tables (ratings, results, photos) follow the same rule.
  - A DB trigger stops parents changing `owner_id`, `slug` or `taken_down`, and forces `published = false` on a taken-down page.
  - Profiles can't be written from the client at all.
- Photos live in a **private** bucket and are served with short-lived signed URLs that only work while the page is visible, so a take-down also cuts off the photos. Uploads are re-encoded server-side (strips EXIF/GPS, fixes orientation, caps size).
- No contact details, address, school or ID document fields exist anywhere in the schema or UI. Public pages carry a note that details are parent-submitted and unverified, and link the FIDE ID to FIDE's own profile page.

## Known limits / next steps

- Not yet tested against a live Supabase project; run through the flow once (create admin → create parent → log in as parent → publish → open link logged out → take down).
- Public pages are dynamic (not cached) so take-downs are instant.
- Rate-limit `/login` (Supabase has built-in auth rate limits; consider adding Cloudflare/Vercel protection).
- Saving child rows is delete-then-insert, not one transaction. A Postgres function (RPC) would make it atomic.
- Parent photos are not moderated. Since they are photos of children, consider an admin review habit via the preview page.

Deploys automatically to Vercel from the `main` branch.
