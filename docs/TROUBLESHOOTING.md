# Troubleshooting Guide

## Backend won't start: "Missing required environment variable: JWT_ACCESS_SECRET"
You haven't copied `.env.example` to `.env` (or haven't filled in the secret). `config/env.ts` fails fast on purpose rather than starting with an undefined secret.

## Every API request returns 404 "No tenant could be resolved for this host"
The default tenant hasn't been seeded. Run `npm run prisma:seed` (which runs `prisma/seed-tenant.ts`) from `backend/`. In local dev, requests to `localhost` fall back to the default tenant automatically — this error means that fallback tenant doesn't exist yet either, i.e. seeding hasn't run.

## City dropdown shows "تعذر تحميل قائمة المدن" (owner/contractor/hotel-management-company registration, listings)
This message fires whenever `GET /api/public/cities` fails or throws — the frontend doesn't distinguish the cause. Two independent things can trigger it locally:
1. **CORS**: if your frontend origin's hostname isn't `localhost`/`127.0.0.1` and doesn't match `ROOT_DOMAINS`, the browser blocks the response before your code sees it. (Fixed for local dev as of this version — `localhost`/`127.0.0.1` are now allowed automatically outside production/staging.)
2. **Unseeded geo data**: `City`/`District` are populated by `prisma/seed-geo.ts`, which is separate from `prisma:seed` (tenant) and `seed-roles.ts` (roles). Run `npm run prisma:seed:geo` from `backend/` if you haven't. (An empty, successfully-fetched city list won't show this specific error — it'll just render an empty dropdown — but it's still worth seeding.)

## Login fails with "Owner role is not seeded" or similar
Run `npx ts-node prisma/seed-roles.ts` from `backend/` — the 7 RBAC roles must exist before any account creation/role-assignment works.

## `GET /api/units` always returns an empty list
This is expected until at least one owner application has been submitted **and approved** (which creates `Property`+`Unit` rows) **and** a unit has been manually set to `status: PUBLISHED, isActive: true` (draft units created on approval start as `NOT_READY`/inactive — see `docs/04-business-logic.md`). Use Prisma Studio (`npx prisma studio`) to flip a unit to published for testing.

## Booking creation returns 409 "Some of the selected dates are no longer available"
This is the availability-lock guard working as designed — either those unit-nights are genuinely already held/booked, or (if you're testing rapidly) a previous test booking's hold hasn't expired yet. Either wait for `BOOKING_HOLD_MINUTES` to pass (the cron job releases it automatically), or manually delete the relevant `AvailabilityCalendar` rows via Prisma Studio during testing.

## Frontend shows "Failed to fetch" on every page
`NEXT_PUBLIC_API_URL` isn't set, or doesn't match where the backend is actually running. Check `frontend/.env.local`.

## Admin/Finance/Contractor/Financial-Partner pages show a "no permission" message even after logging in
The logged-in user doesn't have the corresponding role assigned in `UserRole`. See the "Creating your first admin account" section in `docs/INSTALLATION.md`.

## `POST /auth/refresh` or `/auth/logout` returns 403 "CSRF token missing or invalid"
The frontend must have received and stored the `egymotelz_csrf` cookie from a prior `/auth/login` call, and the browser must send cookies (`credentials: 'include'`) on the request. If you're testing with `curl`/Postman directly rather than through the shipped frontend, you'll need to manually capture the `egymotelz_csrf` cookie value from the login response and echo it back as an `X-CSRF-Token` header.

## Redis connection errors in the logs (`redis_connect_failed`)
The app is designed to degrade gracefully here — caching just no-ops and every request recomputes from Postgres. Fix by confirming `REDIS_URL` points at a running Redis instance, but this is not a hard outage.

## `npx prisma migrate dev` fails with a connection error
Confirm Postgres is actually running (`docker compose ps` from `deployment/`) and that `DATABASE_URL` in `backend/.env` matches the container's exposed port/credentials.

## TypeScript build errors after `npm install`
Run `npx prisma generate` before building — the Prisma Client's generated types (`@prisma/client`) don't exist until this runs, and several files import types from it.

## Still stuck?
Check the relevant phase document in `docs/01-...` through `docs/10-...` — each one documents the specific reasoning behind the piece of the system you're looking at, which is often more useful than a generic troubleshooting step for anything not covered above.
