# EGYMOTELZ — Phase 6: Connect the UI (complete)

Ports all 10 prototype screens to Next.js 14 + TypeScript, wired to the real API from Phases 4/5. No mock data remains except the two things explicitly flagged below.

## Fidelity approach

- **`globals.css` is a verbatim port** of the prototype's `<style>` block — every class name, color variable, spacing value copied exactly. No Tailwind utility classes were used for visual styling (Tailwind is installed per the mission's stack requirement, but the "don't redesign" Primary Rule wins where the two would conflict).
- **The embedded base64 logo was extracted to a real file** (`public/logo.jpg`, 1254×1254 JPEG) instead of staying inline — this is the one deliberate performance change the mission explicitly allows ("Add loading states... Improve performance"), and it cuts ~400KB of duplicated base64 out of every page's HTML.
- **Navigation changed mechanism, not appearance**: the prototype's `show(id)` JS function swapped `.screen.active` classes on a single page; the Next.js port uses real routes (`/home`, `/listings`, etc.) so each screen is independently linkable and server-renderable, but `TabBar.tsx` renders the exact same `.tabs`/`.tab` markup and highlights the active tab the same way. Visually identical; someone clicking through would not notice a difference.
- **The ROI calculator's formula is copied exactly** (comment in `calc/page.tsx` says so explicitly) — same variable names, same rounding, same order of operations as the original `calcU()`.

## Deliberate, flagged deviations from "don't touch the UI"

1. **Booking form gained a unit-selector dropdown.** Per your decision to build a real availability-locking engine (Phase 3/4/5), a booking must reference a specific `unitId`. The original form only asked for a preferred city. This is a functional field addition, not a redesign — same form card, same field styling, one more `<select>`.
2. **The ROI Calculator now sits behind owner login**, per its own on-screen label in the prototype ("owner dashboard-only, not public") — it was a public tab in the static mockup, which was already a mismatch between its copy and its access level. Phase 1 flagged this as a legitimate technical fix, not a redesign.
3. **A new Financial Partner portal exists** (`/financial-partner`) that has no equivalent screen in the prototype, because your answer to the open question in Phase 1 required one (external investor/lender, own login). It is deliberately **not added to `TabBar`** — the mission says don't change navigation, so this new screen is reachable only by direct URL for the audience that needs it (a partner would be sent the link directly, not discover it via the public tab bar).

## What's real vs. what's still a stub

**Real, live-wired:**
- Home stats panel → `GET /public/platform-stats`
- Listings grid (with city filter) → `GET /units`
- Owner wizard (all 6 steps) → `POST /owner-applications` + `POST /owner-applications/:id/documents`
- Booking form (with unit picker) → `POST /bookings`, surfaces the 409 "dates unavailable" conflict cleanly
- Admin dashboard (login + metrics + queue + review actions) → `/admin/*`
- Finance portal (login-gated to `finance_staff`/`super_admin`) → `/finance/*`
- Contractor portal (login-gated, stage-advance button) → `/contractor/*`
- Financial Partner portal (new, login-gated) → `/financial-partner/*`
- ROI Calculator (client-side math, login-gated)

**Still a stub, by design (per Phase 5 notes, unchanged here):**
- Document uploads go through the dev `LocalDevStorageAdapter` (fabricated URLs) until real Cloudinary/S3 credentials are wired in — nothing on the frontend needs to change when that happens.
- Email/SMS notifications log to console server-side.

## Known rough edges to fix before shipping

- Auth is a simple `AuthContext` with `localStorage`-persisted refresh tokens — fine for this stack (a real deployed app, not an in-browser Artifact), but you may want httpOnly-cookie-based refresh storage instead for stronger XSS resistance; that's a backend + frontend change together (Phase 3's `auth.ts` currently expects the refresh token in the request body, not a cookie).
- `listings/page.tsx`'s city filter buttons re-fetch on every click with no debounce/loading skeleton — fine functionally, a polish item.

## Execution caveat (same as every prior phase)

This sandbox still has no network access, so none of this has been run with `npm install`/`next dev`. To verify:
```
cd frontend && npm install
# with backend already running on :4000 (see Phase 3/5 notes)
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```
Then visit `http://localhost:3000` — the language screen is the root route, matching the prototype's default active tab.

## Next

Per the mission's own phase list, everything through Phase 6 ("Connect the UI") is now done. Remaining: **Phase 7 (Security hardening pass)**, **Phase 8 (Performance)**, **Phase 9 (Testing)** — expand beyond the Phase 4 unit tests into integration/E2E — and **Phase 10 (Deployment prep)**, most of which Phase 3 already scaffolded (Docker Compose, health checks). Want me to continue through those, or pause here so you can actually run what's been built so far?
