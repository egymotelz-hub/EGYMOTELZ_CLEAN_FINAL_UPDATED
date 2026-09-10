# Project Architecture Overview

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind (installed but visual identity comes from a verbatim-ported stylesheet, not Tailwind utilities — see `docs/06-frontend-integration.md`)
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (cache-aside pattern, fails open if unavailable)
- **Auth**: JWT access tokens (Bearer header) + refresh tokens (httpOnly cookie) with rotation and CSRF protection on the cookie-authenticated endpoints
- **Storage**: Cloudinary/S3-compatible via a swappable `StorageAdapter` interface (dev stub ships by default)
- **Notifications**: Email/SMS via swappable adapter interfaces (console-logging dev stubs ship by default)

## Multi-tenancy

This is a white-label-capable SaaS platform. Every business table carries a `tenantId`. Tenant resolution happens once per request, before any database access, based on the request's hostname:

1. Root domain (`egymotelz.com`) → default tenant
2. Subdomain (`brand.egymotelz.com`) → tenant looked up by slug
3. Custom domain (future) → `TenantDomain` table lookup

A Prisma Client Extension automatically injects the resolved `tenantId` into every query/write for tenant-owned tables, sourced from an `AsyncLocalStorage` request context — application code never passes `tenantId` manually, and querying without a resolved tenant throws immediately rather than risking a cross-tenant data leak.

Full detail: `docs/03a-tenant-resolution.md`.

## Layered backend architecture

```
routes/        HTTP verbs + paths only, wraps controllers in auth/role middleware
controllers/    Parses/validates requests, calls services, shapes HTTP responses
services/       Business logic, state machines, transactions
validators/     Zod schemas — one per endpoint payload
lib/            Cross-cutting: Prisma client, tenant context, Redis, adapters, date/pagination helpers
```

## Key domain state machines
- **Owner Application**: `SUBMITTED → UNDER_REVIEW → DOCS_REQUESTED ⇄ UNDER_REVIEW → APPROVED | REJECTED`. Approval provisions `Property` + draft `Units`.
- **Booking**: `PENDING → CONTACTED → CONFIRMED → CHECKED_IN → CHECKED_OUT` (or `DECLINED`/`CANCELLED`). Double-booking is prevented by a serializable transaction plus a database-level unique constraint on `(unitId, date)`.
- **Contractor Project**: `DESIGN → CONSTRUCTION → FURNISHING → INSPECTION → COMPLETE`, strictly linear; backward moves require an explicit, reason-required revert action.

Full detail: `docs/04-business-logic.md`.

## Security posture
- RBAC via 7 roles (`guest`, `owner`, `contractor`, `financial_partner`, `finance_staff`, `admin`, `super_admin`), enforced at the router level per domain.
- Finance module requires `finance_staff` or `super_admin` specifically — a bare `admin` role does not satisfy it, per the product requirement that Finance stay invisible to non-finance staff.
- Every admin/finance/contractor mutation writes an `AuditLog` row (actor, action, entity, before/after snapshot).
- Full detail: `docs/07-security.md`.

## Performance
- Redis cache-aside for expensive aggregate reads (platform stats), tenant-keyed.
- Response compression, short public cache headers on read-heavy public endpoints.
- Full detail: `docs/08-09-performance-and-testing.md`.

## What to read first
If you're new to this codebase, read in this order: this file → `docs/02-database-schema.md` → `docs/05-api-design.md` → `docs/06-frontend-integration.md`. The numbered `0X-*.md` files are the original phase-by-phase build log and go deeper on *why* each decision was made, not just *what* exists.
