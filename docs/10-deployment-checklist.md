# EGYMOTELZ — Production Build-Verification Checklist

Run through this before the first real deploy, and again before any deploy that touches auth, tenancy, or the database schema.

## 1. Environment & secrets
- [ ] `backend/.env` populated from `.env.example` — **not** the example values. Specifically: `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are real, random, ≥32 chars, and different from each other.
- [ ] `DATABASE_URL` points at the production Postgres instance, not localhost.
- [ ] `REDIS_URL` set (Phase 8 caching silently degrades to "no cache" without it — check logs for `redis_connect_failed` after deploy).
- [ ] `ROOT_DOMAINS` matches the real production domain(s) — this drives tenant resolution (Phase 3) and CORS (Phase 3/7).
- [ ] `NODE_ENV=production` — this is what disables the `X-Tenant-ID` dev override (Phase 3) and enables `Secure` cookies (Phase 7). Double-check it's actually set in the deployed environment, not just `.env.example`.
- [ ] Cloudinary/S3 credentials set if replacing the dev `LocalDevStorageAdapter` (Phase 5) — otherwise uploaded documents get fabricated URLs that go nowhere.
- [ ] SMTP/SMS provider credentials set if replacing the console `EmailAdapter`/`SmsAdapter` (Phase 4) — otherwise notifications only appear in server logs.

## 2. Database
- [ ] `npx prisma migrate deploy` run against production (not `migrate dev` — that's for local iteration only).
- [ ] `npx ts-node prisma/seed-roles.ts` run once — the 7 RBAC roles must exist before any signup/login works.
- [ ] `npx ts-node prisma/seed-tenant.ts` run once — creates the default EGYMOTELZ tenant + root-domain rows; without this, every request 404s at tenant resolution.
- [ ] Confirm `Tenant.isDefault = true` on exactly one row — Phase 3's root-domain fallback depends on this being unambiguous.
- [ ] Backup strategy in place (mission's Phase 10 line item) — at minimum, confirm your Postgres host's automated backup/PITR is enabled; this project doesn't include a custom backup script since managed Postgres providers handle this better than a hand-rolled cron job would.

## 3. Networking & TLS (per Phase 3's topology notes)
- [ ] Reverse proxy (nginx/Traefik/cloud LB) sits in front of both `backend` and `frontend`, forwarding the original `Host` header unchanged.
- [ ] Wildcard DNS record (`*.egymotelz.com`) resolves, if any brand subdomains are live yet.
- [ ] Wildcard TLS certificate covers `*.egymotelz.com` (or per-domain certs are issued for any onboarded custom domains via `TenantDomain`).
- [ ] Cookie `domain` attribute revisited (Phase 7 open item) if the API and frontend end up on different subdomains rather than one shared hostname per tenant.

## 4. Health & observability
- [ ] `GET /health` returns 200 through the full proxy chain, not just directly against the container.
- [ ] Winston logs (Phase 3) are actually being collected somewhere (CloudWatch/Datadog/file volume) — the current transport is console-only; add a second transport before you need to grep production logs during an incident.
- [ ] Confirm the `releaseExpiredHolds` cron (Phase 4, runs every minute) is actually running in production — check logs for `released_expired_holds` entries or their absence over a longer window if bookings seem to hang in `PENDING` past their hold window.

## 5. Security spot-check (Phase 7)
- [ ] Login from a real subdomain and confirm the refresh cookie is `httpOnly` + `Secure` in browser devtools (not just in code).
- [ ] Attempt `/auth/refresh` with a missing/wrong `X-CSRF-Token` header and confirm a 403, not a silent pass.
- [ ] Confirm `finance_staff`/`super_admin`-only routes actually 403 for a plain `admin` token — this is the one role boundary most likely to regress silently if RBAC seed data changes.

## 6. Smoke test the real user flows end-to-end
- [ ] Submit the owner wizard, confirm the account can log in immediately (per the confirmed Phase 1 decision), confirm the confirmation email arrives (or appears in logs, pre-SMTP-wiring).
- [ ] Submit a booking for a real published unit + date range, confirm nights lock, then attempt a second overlapping booking and confirm the 409.
- [ ] Approve an owner application end-to-end and confirm the `Property` + draft `Units` actually appear.
- [ ] Advance a contractor project through all 4 stages and confirm progress percentages match Phase 9's test expectations (25/50/75/100).

## 7. Rollback plan
- [ ] Confirm the previous Docker image tag is retained and redeployable in one command.
- [ ] Confirm `prisma migrate deploy` history is append-only in this environment (no destructive migration was just applied) before treating "roll back the app" as sufficient — a schema rollback is a separate, harder operation than an image rollback.
