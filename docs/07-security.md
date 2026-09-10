# EGYMOTELZ — Phase 7: Security Hardening (complete)

Everything in the mission's Phase 7 checklist was already partially covered by Phases 3–5; this pass closes the two real gaps and documents the rest.

## Gap 1: Audit logging existed as a schema, not a behavior

`AuditLog` was in the Phase 2 schema and mentioned in every phase's notes as "every admin mutation is audit-logged" — but nothing actually wrote to it. Fixed:

- New `services/audit.service.ts` — a thin, deliberate wrapper (`recordAudit`) around a direct write, not routed through the tenant-scoping Prisma extension's auto-inject, because `AuditLog.tenantId` is nullable by design (a `super_admin` cross-tenant action legitimately has no single tenant) and forcing a tenant would break that.
- Wired into every real mutation: owner application review (`owner-applications.service.ts`), booking status transitions (`bookings.service.ts`), document verify/reject (`documents.service.ts`), **manual finance transactions** (`finance.service.ts` — flagged in-code as the single highest-risk write in the system, so the note is stored verbatim in the audit row for one-lookup review), and contractor stage advance/revert (`contractor.service.ts`).
- Each entry captures actor, action, entity type/id, and a before/after snapshot — enough to answer "who changed what, from what, to what" without re-deriving it from surrounding rows.

## Gap 2: Refresh tokens were in the response body, not secure HTTP-only cookies

The original architecture spec (Phase 2) explicitly called for "JWT + Refresh Tokens + Secure HTTP-only Cookies" — Phase 5 shipped refresh tokens in the JSON body instead (flagged as a rough edge in the Phase 6 notes). Fixed properly now:

- `POST /auth/login` sets the refresh token as an `httpOnly`, `Secure` (in production), `SameSite=Strict` cookie scoped to `/api/auth`, and returns only the access token + user in the JSON body.
- `POST /auth/refresh` and `POST /auth/logout` read the refresh token from that cookie instead of a request body.
- **CSRF protection was added specifically because of this change** — a cookie-authenticated endpoint is exactly the case classic CSRF attacks target. `middleware/csrf.ts` implements the standard double-submit pattern: a second, *readable* (non-httpOnly) cookie carries a random token; the frontend reads it via `document.cookie` and echoes it back as an `X-CSRF-Token` header; the server rejects the request if they don't match. This is deliberately scoped to only `/auth/refresh` and `/auth/logout` — every other endpoint authenticates via the `Authorization: Bearer` header, which a cross-site form cannot forge, so CSRF doesn't apply to them and adding the check there would be security theater, not protection.
- Frontend (`AuthContext.tsx`, `apiClient.ts`) updated to match: `credentials: "include"` on every request, a silent-refresh-on-load flow that relies on the browser sending the httpOnly cookie automatically, and `authApi.refresh()`/`authApi.logout()` helpers that attach the CSRF header read from the readable cookie. No more refresh token in `localStorage`.
- New test: `tests/csrf.test.ts` covers the missing-cookie, mismatched-header, and matching-header cases directly against the middleware function.

## Everything else in the mission's Phase 7 list — status

| Requirement | Status | Where |
|---|---|---|
| JWT Authentication | ✅ | Phase 3 `middleware/auth.ts` |
| Refresh Token Rotation | ✅ | `auth.service.ts` — old token revoked on every use |
| Password Hashing (bcrypt) | ✅ | `auth.service.ts`, 12 rounds |
| RBAC | ✅ | `requireRole()`, per-domain role gates (Phase 5) |
| Ownership Validation | ✅ | e.g. owner-application self-view check, financial-partner self-scoped transactions |
| Rate Limiting | ✅ | Phase 3 `security.ts` — general + stricter auth-endpoint limiter |
| Helmet | ✅ | Phase 3, with an explicit CSP (not just defaults) |
| CORS | ✅ | Tenant-aware origin check, `credentials: true` for the new cookie flow |
| SQL Injection Prevention | ✅ inherent | Prisma parameterizes every query; no raw SQL anywhere in the codebase |
| XSS Prevention | ✅ | React's JSX auto-escaping (frontend) **+ new**: `lib/sanitize.ts` strips tag syntax from free-text fields (`notes`) at the validator layer, as defense in depth for contexts outside React (exports, future email templates) |
| Input Validation | ✅ | Zod on every mutating endpoint (Phase 5) |
| Secure Cookies | ✅ (this phase) | see Gap 2 above |
| Environment Variable Management | ✅ | `.env.example`, `config/env.ts` fails fast on missing secrets |
| Audit Logging | ✅ (this phase) | see Gap 1 above |
| Error Logging | ✅ | Phase 3 Winston + centralized `errorHandler` |

## One thing worth deciding before deployment

Cookies are currently host-scoped (no explicit `domain` attribute), which is correct and simplest if the frontend and API are served from the same hostname per tenant (e.g. both behind one reverse-proxy path routing `/api/*` to the backend). If you instead plan to run the API on a separate subdomain from the frontend (e.g. `api.egymotelz.com` serving `brand.egymotelz.com`'s requests), the refresh cookie will need `domain: ".egymotelz.com"` added in `auth.controller.ts`/`csrf.ts` so it's shared across subdomains — happy to add that once you know the final topology.

## Next

**Phase 8 — Performance**: query/index review, the Redis caching layer Phase 3 already provisioned but hasn't wired up yet, image optimization, and bundle checks on the frontend. Continuing there next.
