# EGYMOTELZ — Phase 3: System Architecture (complete)

Builds on the tenant-resolution layer already delivered. This closes out the rest of Phase 3: project layout, layered architecture pattern, cross-cutting middleware, logging, docs, testing, and deployment topology.

## 1. Project layout (as scaffolded so far)

```
backend/
  .env.example
  Dockerfile
  jest.config.js
  package.json
  tsconfig.json
  prisma/
    schema.prisma          ← Phase 2, updated in Phase 3 with TenantDomain
    seed-tenant.ts
  src/
    app.ts                 ← Express app: middleware wiring, route mounting
    server.ts              ← entrypoint: listen + graceful shutdown
    config/
      env.ts                ← root domains, JWT config, dev-override flag
    lib/
      prisma.ts             ← tenant-scoping Prisma extension + platformPrisma
      tenantContext.ts       ← AsyncLocalStorage request context
    middleware/
      tenantResolver.ts      ← hostname → tenant (Phase 3, delivered)
      auth.ts                ← JWT verify + tenant cross-check + role gate
      security.ts             ← helmet/CORS/rate-limit/sanitize
      errorHandler.ts          ← centralized error + Zod formatting
    logger/
      index.ts                ← Winston, tenant/user-tagged log lines
    docs/
      openapi.ts               ← Swagger UI at /api/docs (Phase 5 fills in routes)
    routes/        controllers/        services/        validators/   jobs/
      (empty — populated per-domain in Phase 4/5: auth, units, owner-applications,
       bookings, admin, finance, contractor, financial-partner)
    types/
      express.d.ts             ← req.tenant / req.user typings
    tests/
      setup.ts
      health.test.ts            ← example Jest+Supertest test (Prisma mocked)

frontend/
  Dockerfile                    ← placeholder; Next.js app scaffolds in Phase 6

docker-compose.yml              ← postgres + redis + backend + frontend
```

## 2. Layered architecture (applies to every domain built in Phase 4/5)

```
routes/*.ts        → HTTP verbs + paths only; wraps controller in requireAuth/requireRole
controllers/*.ts    → parses/validates request (Zod), calls service, shapes HTTP response
services/*.ts       → business logic + workflows (state machines from Phase 1 §3)
validators/*.ts     → Zod schemas, one per endpoint payload, shared between controller and any background job that needs the same shape
prisma (lib/prisma) → data access; controllers/services never import @prisma/client directly, always the tenant-scoped `prisma` export
```

Each domain (e.g. `owner-applications`) gets one file per layer:
`routes/owner-applications.routes.ts`, `controllers/owner-applications.controller.ts`, `services/owner-applications.service.ts`, `validators/owner-applications.validators.ts`. This is what Phase 5 will populate — the folders exist now so the shape is agreed before code lands in them.

## 3. Cross-cutting middleware order (as wired in `app.ts`)

```
helmet → cors → json body parser → input sanitize → request logger
       → general rate limit → tenantResolver → [route-level: requireAuth → requireRole]
       → route handler → notFoundHandler (404 fallback) → errorHandler (final catch)
```

Rationale for the order: security headers and CORS must wrap everything (including error responses); sanitize/log before any business logic touches the payload; tenant resolution must complete before any DB-touching code, including auth (since auth cross-checks the token against the resolved tenant).

## 4. Logging

Winston, structured JSON in production / colorized text in development. Every log line is auto-tagged with `tenantId` (and `userId` once authenticated) by reading the same `AsyncLocalStorage` context the Prisma extension uses — so a production log aggregator (CloudWatch, Datadog, etc.) can filter by tenant with zero per-call-site work. `requestLogger` captures method/path/status/duration for every request; `errorHandler` logs unhandled errors with stack traces server-side while returning a generic message to the client (no internals leaked).

## 5. API documentation

`swagger-jsdoc` + `swagger-ui-express`, mounted at `/api/docs` (raw spec at `/api/docs.json`). Route files will carry `@openapi` JSDoc blocks above each handler in Phase 5 — the skeleton here just wires the mount point and global spec metadata (bearer-auth security scheme, since almost every endpoint beyond the four public ones needs it).

## 6. Testing setup

Jest + ts-jest + Supertest, per the mission's Phase 9 requirement. `src/tests/setup.ts` sets test env vars; `src/tests/health.test.ts` is a working example showing the pattern: mock `../lib/prisma` (both `prisma` and `platformPrisma`), build the app with `createApp()`, hit it with Supertest, assert on status/body — including a test that a token/host mismatch produces a 404/401 as designed. Phase 4/5 add one test file per service (unit tests with mocked Prisma) and per route (integration tests) following this same shape; true DB-backed integration tests should run against a disposable `docker-compose` Postgres instance in CI, not this mocked style.

## 7. Deployment topology (`docker-compose.yml`)

- `postgres` — primary datastore, health-checked before `backend` starts.
- `redis` — added in Phase 3 for: (a) distributed rate-limit counters once there's more than one backend instance, (b) caching the Phase 1 `/api/public/platform-stats` aggregate, (c) a fast expiry mechanism for booking holds (the `AvailabilityCalendar` row is still the source of truth/lock; Redis just makes "release this hold after N minutes" cheap without a cron scan).
- `backend` — built from `backend/Dockerfile` (multi-stage: build with devDependencies + Prisma generate, run with production deps only).
- `frontend` — placeholder Dockerfile; the actual Next.js app is scaffolded in Phase 6 ("Connect the UI") once the static prototype is ported page-by-page.
- **Wildcard subdomains in production**: needs a reverse proxy (nginx/Traefik/cloud LB) in front, with a wildcard DNS record (`*.egymotelz.com`) and wildcard TLS cert, forwarding the original `Host` header unchanged — `tenantResolver` reads `req.headers.host` directly, so no proxy-side rewriting is needed. This is documented as a comment directly in `docker-compose.yml`.

## 8. What's deliberately NOT in Phase 3

Actual business-logic code (owner-application workflow, booking creation/locking transaction, admin approve/reject) is Phase 4. Actual route/controller/service files and the OpenAPI content are Phase 5. The Next.js frontend port is Phase 6. This phase only had to make those phases have an agreed, consistent place to land.

## Reminder on execution

Same caveat as Phase 2/3-tenant-resolution: this sandbox can't `npm install`/run Docker, so none of this has been executed here. Recommended verification steps once you have it locally:
```
cd backend && npm install
docker compose up -d postgres redis
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev        # starts the API on :4000
npm test           # runs the example Jest suite
```

## Next
Phase 4 — Business Logic: the actual state-machine implementations (owner application review, property readiness, booking creation with the availability-lock transaction, contractor stage progression) as services, ready for Phase 5 to wire into routes/controllers.
