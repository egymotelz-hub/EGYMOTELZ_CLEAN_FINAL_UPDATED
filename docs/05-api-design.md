# EGYMOTELZ — Phase 5: API Design (complete)

Wires every Phase 4 service to real HTTP endpoints. All mounted in `app.ts` under `/api/*`.

## Full endpoint surface

| Method | Path | Auth | Screen(s) it backs |
|---|---|---|---|
| POST | `/api/auth/login` | public | (all logins) |
| POST | `/api/auth/refresh` | public | token rotation |
| POST | `/api/auth/logout` | public | — |
| POST | `/api/auth/password-reset/request` | public | — |
| POST | `/api/auth/password-reset/confirm` | public | — |
| GET | `/api/auth/me` | any authenticated | header/session state |
| GET | `/api/units` | public | Listings (§1.3) |
| GET | `/api/units/:id` | public | Listings detail |
| GET | `/api/public/platform-stats` | public | Home (§1.2) |
| POST | `/api/owner-applications` | public | Owner Wizard steps 0-5 (§1.4) |
| POST | `/api/owner-applications/:id/documents` | public (see caveat below) | Wizard step 4 |
| GET | `/api/owner-applications/:id` | owner-of-record or admin | Wizard step 5 / owner dashboard |
| POST | `/api/bookings` | public | Booking Request (§1.5) |
| PATCH | `/api/bookings/:id/transition` | admin/super_admin | ops booking management |
| GET | `/api/admin/metrics` | admin/super_admin | Admin dashboard KPIs (§1.6) |
| GET | `/api/admin/owner-applications` | admin/super_admin | Admin queue table |
| GET/PATCH | `/api/admin/owner-applications/:id`, `.../review` | admin/super_admin | Admin review modal |
| GET/PATCH | `/api/admin/bookings`, `.../:id` | admin/super_admin | Admin bookings tab |
| GET/PATCH | `/api/admin/documents`, `.../:id/verify` | admin/super_admin | Admin documents tab |
| GET | `/api/admin/users` | admin/super_admin | Admin users tab |
| GET/POST | `/api/finance/summary`, `/transactions` | **finance_staff/super_admin only** | Finance Portal (§1.7) |
| GET | `/api/contractor/projects` | contractor/admin/super_admin | Contractor Portal (§1.9) |
| PATCH | `/api/contractor/projects/:id/advance`, `.../revert` | contractor/admin/super_admin | stage tracker |
| POST/PATCH | `.../tasks`, `/api/contractor/tasks/:taskId` | contractor/admin/super_admin | task list |
| GET | `/api/financial-partner/me`, `/transactions` | **financial_partner only** | new external portal (per your answer #3) |

`/api/docs` (Swagger UI) documents this same surface with request/response shapes.

## Cross-cutting patterns applied everywhere

- **Pagination**: every list endpoint accepts `?page=&pageSize=` via `lib/pagination.ts`, capped at 100/page, returned as `{ items, pagination: { page, pageSize, total, totalPages } }`.
- **Sorting**: `?sort=field:asc|desc`, restricted to an explicit allow-list per resource (e.g. units only sort by `pricePerNight`, `createdAt`, `bedrooms`) — prevents sorting by arbitrary/sensitive columns.
- **Filtering**: query params are Zod-validated and whitelisted before hitting Prisma (`listUnitsQuerySchema`, admin list filters) — no raw query passthrough.
- **Validation**: every POST/PATCH body goes through a Zod schema; failures surface as `422` with per-field messages via the Phase 3 `errorHandler`.
- **Authorization**: `requireAuth` + `requireRole(...)` at the router level for whole domains (finance, contractor, financial-partner, admin), plus one resource-level ownership check (an owner can only fetch *their own* application unless they're admin — `owner-applications.controller.ts`).
- **Errors**: `ApiError(status, message)` thrown from anywhere in the service/controller layer is caught by the one central `errorHandler` — no per-route try/catch boilerplate (`asyncHandler` wrapper handles that).

## Document upload flow

`POST /owner-applications/:id/documents` uses `multer` (in-memory, 10MB limit) + a `StorageAdapter` interface (`lib/adapters/storage.adapter.ts`). The shipped `LocalDevStorageAdapter` fabricates a URL rather than actually persisting bytes — swap in a real `CloudinaryStorageAdapter` (or S3) once you have credentials; nothing else in the stack needs to change since callers only depend on the interface.

**Known follow-up, flagged rather than silently shipped**: this endpoint currently has no auth gate, matching the prototype's flow of uploading documents mid-wizard before any login exists. Because application IDs are UUIDs (not guessable), this is a soft protection, not a real one. Recommended hardening for Phase 5.1: have `submit()` return a short-lived, single-use upload token alongside the application ID, and require it on the upload call. Tell me if you want that now or want to defer it.

## Auth flow specifics

- `POST /auth/login` always returns the same error for "no such user" and "wrong password" (prevents account enumeration).
- `POST /auth/password-reset/request` always returns the same success message regardless of whether the email exists, for the same reason — the actual reset token is only emailed if the account is real.
- Refresh tokens rotate on every use (old one revoked, new one issued) — a stolen-then-reused old refresh token fails immediately.
- Every protected route ultimately depends on `requireAuth`, which (per Phase 3) rejects a token whose `tenantId` claim doesn't match the resolved tenant — so this entire API surface inherits that isolation guarantee for free.

## Known duplication (intentional)

`PATCH /bookings/:id/transition` (admin/super_admin gated, generic) and `PATCH /admin/bookings/:id` both call `bookingsService.transition` — kept as two routes because the Admin dashboard's booking tab (§1.6) and a potential separate ops-tool integration are different callers; both are equally locked down, so this isn't a security gap, just a minor surface duplication you could collapse into one if you'd rather.

## Next

**Phase 6 — Connect the UI**: port the 10-screen static prototype to Next.js 14, wiring every form/table/dashboard in this doc to its real endpoint, replacing all mock data. Want me to continue there, or would you rather I first fill in the remaining Phase 5 gaps (e.g. the upload-token hardening above, or role/permission management endpoints for `RolePermission`)?
