# Folder Structure

```
EgyMotelz-Production-v1.3/
├── frontend/                  Next.js 14 application
│   ├── src/app/                 App Router pages — one folder per screen (home, listings, owners, booking, admin, finance, calc, contractor, about, financial-partner)
│   ├── src/components/          Shared UI (TabBar, Navbar, Footer)
│   ├── src/lib/                 apiClient, AuthContext, LocaleContext
│   ├── public/                  Static assets (extracted logo, etc.)
│   └── Dockerfile
│
├── backend/                   Express + TypeScript API
│   ├── src/routes/               HTTP route definitions
│   ├── src/controllers/          Request parsing + response shaping
│   ├── src/services/             Business logic, state machines
│   ├── src/validators/           Zod schemas
│   ├── src/middleware/           tenantResolver, auth, csrf, security, errorHandler
│   ├── src/lib/                  prisma client, tenant context, redis, adapters (email/sms/storage)
│   ├── src/jobs/                 Scheduled jobs (expired-hold release)
│   ├── src/tests/                Jest test suite
│   ├── prisma/                   schema.prisma (functional copy Prisma's CLI reads), seed scripts
│   └── Dockerfile
│
├── database/                  Database deliverable (see docs/02-database-schema.md)
│   ├── schema.prisma             Reference copy of the schema (functional copy lives in backend/prisma/)
│   ├── migrations/                Populated by `prisma migrate dev/deploy` once run against a real database
│   ├── seed-tenant.ts             Creates the default tenant + root domains
│   └── seed-roles.ts              Creates the 7 RBAC roles
│
├── docs/                      All documentation (see docs/ARCHITECTURE.md for a reading order)
│
├── scripts/                   Setup/utility shell scripts
│
├── deployment/                Deployment entrypoints
│   ├── docker-compose.yml        Postgres + Redis + backend + frontend
│   └── .github/workflows/ci.yml  Lint/test/build pipeline
│
└── assets/                    Brand assets (logo)
```

## Why `schema.prisma` appears in two places

`backend/prisma/schema.prisma` is the **functional** copy — this is the path Prisma's CLI (`prisma generate`, `prisma migrate`) actually reads, and it must stay inside `backend/` for those commands to work when run from that directory. `database/schema.prisma` is a **reference** copy, present because the packaging brief asked for the database schema to be surfaced as its own top-level deliverable independent of the backend's internal structure. They are kept identical; if you edit one, copy the change to the other (or symlink them in your own fork).

## Why `migrations/` is empty

No migration has been generated yet in this environment (no database connection was available to run `prisma migrate dev` against — see the root `docs/` phase notes for why). Running `npx prisma migrate dev --name init` from `backend/` against a real Postgres instance will populate `backend/prisma/migrations/`; copy that folder into `database/migrations/` to keep this directory meaningful, or treat `backend/prisma/migrations/` as the source of truth and remove the placeholder here.
