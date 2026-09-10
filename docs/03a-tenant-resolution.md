# EGYMOTELZ — Phase 3 (partial): Tenant Resolution Layer

Implements your subdomain/domain-based routing spec exactly as given. Files delivered (under `backend/src/`):

```
config/env.ts              root-domain list, dev-override flag, JWT config
lib/tenantContext.ts       AsyncLocalStorage request context (tenantId, userId)
lib/prisma.ts              Prisma extension auto-scoping every tenant table by tenantId
middleware/tenantResolver.ts   hostname -> tenant resolution (the core of this spec)
middleware/auth.ts         JWT verify + tenantId-claim cross-check + role gate
types/express.d.ts         req.tenant / req.user typings
app.ts                     shows middleware order
prisma/seed-tenant.ts       creates the default EGYMOTELZ tenant + root domains
prisma/schema.prisma        updated with TenantDomain model (future custom domains)
```

## Request flow (`tenantResolver`)
1. **Dev/internal override** — `X-Tenant-ID` header is honored **only** when `NODE_ENV` is `development` or `test`; this is hardcoded in `config/env.ts`, not driven by an env var, so a misconfigured production `.env` can't silently re-enable it.
2. **Exact hostname match** — checks `egymotelz.com` / `www.egymotelz.com` (or any future root you add to `ROOT_DOMAINS`) first, then falls through to a `TenantDomain` table lookup for any custom domain that's been onboarded (table exists now; the onboarding *flow* for adding a new custom domain is intentionally not built, per your instruction).
3. **Subdomain match** — `brand.egymotelz.com` → looked up by `Tenant.slug === "brand"`. This is what makes future brands work with zero business-logic changes: the same middleware, same routes, same everything — only the resolved `tenantId` differs.
4. **Fallback** (dev only) — bare hostnames like `localhost` resolve to the default tenant so local development doesn't require `/etc/hosts` edits.

## Isolation guarantees
- **JWT ↔ tenant cross-check** (`middleware/auth.ts`): a token's `tenantId` claim must equal `req.tenant.id` or the request is rejected with 401 — even if the signature is perfectly valid. This stops a token issued on one subdomain from being replayed against another.
- **Automatic query scoping** (`lib/prisma.ts`): a Prisma Client Extension injects `tenantId` into every `where`/`data` for the ~23 tenant-owned models, sourced only from the AsyncLocalStorage context — application code never passes `tenantId` manually, so there's no code path where a developer could forget it. Querying a tenant-scoped table with no context throws immediately (fail closed) rather than silently returning cross-tenant data.
- **Escape hatch, used deliberately**: `runWithoutTenantScope()` exists only for genuine cross-tenant `super_admin` operations (e.g. a platform-wide report) and must be called explicitly at each such call site — it's not a config flag, so it can't be turned on by accident.

## Assumptions defaulted (per your "decide later" / no answer given)
- **Booking hold duration:** defaulted to **15 minutes** (`BOOKING_HOLD_MINUTES` in `config/env.ts`, overridable via env var). Change the env var or tell me the real value and I'll update the seed default.
- **Commission rate placement:** kept **per-owner** via `Contract` (unchanged from Phase 2) since you didn't specify otherwise.

## What's still needed to run this for real
This sandbox has no network access, so I've written all of this to be installed/run in your own environment:
```
cd backend
npm install express helmet cors jsonwebtoken @prisma/client
npm install -D prisma typescript @types/express @types/jsonwebtoken ts-node
npx prisma migrate dev --name init
npx ts-node prisma/seed-tenant.ts
```
Once you've done that, hitting the API with `Host: egymotelz.com` (or any `Host: www.egymotelz.com`) should resolve to the seeded default tenant; `Host: anything.egymotelz.com` will 404 until a matching `Tenant.slug` exists.

## Next
Phase 3 also still owes: full Next.js/Express project layout, Docker Compose topology, and the rest of the architecture doc (this deliverable covered tenant resolution specifically since that's what you scoped). Want me to continue with the rest of Phase 3, or move straight to Phase 4 (business logic/workflows) and circle back?
