# Changelog

## v1.1 — Final Production Verification & Certification pass

No new features were added, per this phase's explicit scope (verification/certification only). Changes made:

### Fixed (confirmed dead code, removed)
- `backend/src/lib/dateUtils.ts` — removed `nightCount()`, a helper confirmed unused anywhere in the codebase (verified via a whole-repo reference scan, not assumption). `enumerateNights(...).length` is used directly everywhere this would have applied.
- `backend/src/validators/auth.validators.ts` — removed `refreshSchema`, leftover from before the v1.0 Phase 7 refactor moved refresh tokens from the request body to an httpOnly cookie. Confirmed zero references anywhere.

### Fixed (real gap, not just cleanup)
- `backend/src/middleware/security.ts` / `backend/src/routes/owner-applications.routes.ts` — `requestSizeKey()` was scaffolded in v1.0 but never wired to an actual limiter, leaving the document-upload endpoint (which also has no auth gate — a known, documented limitation) protected only by the general 300-requests/15-minute limit. Added `uploadRateLimit` (10/15min, keyed per-user-or-IP) and applied it to `POST /owner-applications/:id/documents`. This is a genuine security hardening fix discovered during the unused-export scan, not scope creep — it directly reduces the blast radius of the already-documented upload-auth gap.

### Verified, not modified (see full Phase 1-11 results in the certification report)
- All 60 backend `.ts` files: syntax-checked individually, zero errors.
- Full backend + frontend TypeScript compile attempted (`tsc --noEmit`) against both apps; every resulting error was individually categorized and confirmed attributable to missing `node_modules` (no network access to install them), not to actual code defects.
- Every package imported in code cross-checked against `package.json` declarations — zero undeclared dependencies in either app.
- Prisma schema: brace balance, duplicate-model, and dangling-type-reference checks — all clean (not a substitute for `prisma validate`, which requires the CLI).
- Full-repo secret scan — no hardcoded credentials or key-shaped strings found outside `.env.example` placeholders and dev-only Docker Compose defaults.
- All static assets referenced in the frontend confirmed present in `public/`.

See the full certification report (delivered in the conversation that produced this package) for exact pass/fail status per verification phase, including what could **not** be executed in this environment and why.

## v1.2 — Form Validation & Booking Workflow Fixes

No UI redesign, no Design System changes, no backend API changes, no routing changes — confirmed via the same static verification methodology used in the v1.1 certification pass (syntax/type-check every changed file, filter only expected missing-`node_modules` noise, re-verify all imports resolve).

### Disclosure
The fix brief assumed React Hook Form was already the frontend's form architecture. It wasn't — the original Phase 6 port used plain `useState`. RHF + Zod was introduced now because it's the correct, standard fix for the validation-synchronization bugs reported, not a stylistic refactor.

### Root causes found and fixed
- **"Validation fails despite everything filled in"**: the password field gave no client-side indication of the backend's complexity rule (8+ chars, 1 uppercase, 1 digit); a comma-formatted money value (`"250,000"`) silently became `NaN` → `null` in the submitted JSON.
- **Missing phone/national-ID validation**: previously free-text with no format enforcement.
- **Conditional logic**: the funding-amount field was never disabled/cleared/re-enabled based on the financing-needed toggle — confirmed absent, not just buggy.
- **Money-in-thousands**: fixed via a new reusable `MoneyInput` component (digit-filtering as typed, thousand-separator display, raw full numeric value stored/submitted).
- **"Choose Unit" not working**: root cause was a silently-swallowed fetch error (`.catch(() => {})`) with no loading/empty/error UI — any failure looked identical to "broken." Also fixed: a unit deep-linked from Listings outside the default 50-result page would never appear as selectable.
- **Missing nationality list**: added the 26-country list (Arabic + English) as specified.
- **Date validation**: added `min` constraints and a client-side cross-field check (checkout after check-in, check-in not in the past) mirroring the backend's existing rule.

### Files added
`frontend/src/lib/validation/{shared,ownerApplication.schema,booking.schema}.ts`, `frontend/src/lib/constants/nationalities.ts`, `frontend/src/components/MoneyInput.tsx`

### Files rewritten
`frontend/src/app/owners/page.tsx`, `frontend/src/app/booking/page.tsx`

### Files modified
`frontend/package.json` (added `react-hook-form`, `@hookform/resolvers`, `zod`)

### Backend / database changes
None. Every client-side schema mirrors an existing backend validator exactly.

### Audited, left unchanged
Admin and Financial-Partner login forms — reviewed per the full-form-audit requirement, found to have none of the reported bug patterns; migrating them to RHF would be refactoring for preference, not a fix, so they were left as-is.

### Still not executed
No browser/npm install available in this environment (same constraint as every prior phase). All verification was static (TypeScript compilation with missing-dependency noise filtered out, import-resolution checks). Run `scripts/verify-build.sh` and manually test the full booking + wizard flow before shipping.

## v1.3 — Major Feature Expansion (Items 1-18 from the implementation audit)

This is a substantial release: new database entities, three new registration flows, a real units-browsing/filtering/payment experience, a working admin panel, and a role-aware navigation system. It also fixed several genuine regressions that static analysis and manual code-reading caught along the way — these are called out explicitly below because they were real, would have affected real users, and are worth knowing about even though they predate this specific release.

### Database schema changes
- `PropertyType` gained `APARTMENT`.
- Replaced the single `condition`/`furnishingLevel` choice with a real multi-select model: `ReadinessOption[]`, `FinishingType[]`, `FurnishingItem[]` on both `OwnerApplication` and `Property`.
- Replaced the 3-city `EgyptianCity` enum with real relational `City`/`District` models, seeded with every city and district from the spec (real Egyptian geography, not placeholders) via `prisma/seed-geo.ts`.
- New entities: `ContractorApplication` (expanding `Contractor` with the full requested field set), `HotelManagementCompany` + `HotelManagementCompanyApplication` (with the 3-outcome Approve/Reject/Request-More-Info review workflow), `PropertyTypeManaged` enum.
- `Unit` gained `bathrooms`, `areaSqm`, `floorNumber`, `avgRating`; `Property` gained `latitude`/`longitude`; `Booking` gained `paymentStatus`/`paymentReference`/`paymentMethod` + new `PaymentStatus` enum.
- New `internationalPhone`/`whatsappNumber` validators (E.164 format) replacing the Egypt-only phone validation across owner, booking, contractor, and hotel-company forms.
- Two new roles: `employee`, `manager`.

### New features
- **Owner Dashboard** (`/owner/dashboard`): document upload after login (the actual new flow — submit → account created → sign in → upload), plus the relocated and extended Investment Calculator (Finishing Cost, Expected Investment, ROI — additive to the original formula, nothing existing changed).
- **Contractor registration** (`/contractor/register`) and **Hotel Management Company registration** (`/hotel-management-companies/register`) — full forms, backend submission + admin review workflow, account created immediately per the established convention.
- **Units browsing** (`/listings`, rebuilt): full filter set (price, city, district, bedrooms, bathrooms, area, availability, property type, readiness status), all 4 requested sort modes including "Nearest" (in-app Haversine distance, since Postgres needs a spatial extension for that natively), external map links where coordinates exist.
- **Payment** (Item 6): modular `PaymentAdapter` interface with a mock implementation (matches the existing Email/SMS/Storage adapter pattern) wired into a real 3-step booking flow (Details → Payment → Confirmation). A failed charge releases held inventory rather than leaving an unpaid hold.
- **Admin panel**: real tab-switching for Applications/Bookings/Users (previously the sidebar had non-functional decorative links for most sections); role gate expanded to Admin/Super Admin/Employee/Manager, matching the spec exactly.
- **Role-aware navigation**: Administration and Finance tabs now hidden until a logged-in user actually holds the matching role; every internal page's frontend role-check cross-verified against its backend `requireRole` call.

### Real regressions found and fixed (not just new-feature work)
- **Critical**: `RefreshToken` was incorrectly included in the tenant-auto-scoping model set despite having no `tenantId` column — this would have thrown a Prisma runtime error on **every login, token refresh, and logout**. Found via an exhaustive bidirectional consistency check between the schema and the scoping list; two more instances of the same bug (`UnitImage`, `ContractorTask`) found and fixed in the same pass.
- **The city/district relational-model change (this same release) broke rendering in four separate places** that were fixed incrementally as each was found: the Listings page, the Booking page's unit dropdown, the Admin owner-applications queue, and the Contractor dashboard — all were reading `property.city` as a plain string when it had become a `{nameAr, nameEn}` relation object. Each was paired with a matching backend fix, since the *services* also weren't including the nested relation, so even a fixed frontend would have received `undefined`.
- The units-listing filter had a key-collision bug (filtering by both `cityId` and `districtId` simultaneously would have silently dropped one) — caught before shipping via re-verification, not by a user report.

### Verified before packaging
Full backend (70 files) and frontend (30 files) re-checked clean: syntax, whole-tree TypeScript compilation, import resolution, dependency declarations, Prisma schema structural integrity, and the tenant-isolation consistency check specifically (given what it caught last time). All 11 navigation links resolve. Every internal page's role gate cross-checked against its backend route.

### Still not done (carried forward honestly, not silently dropped)
- Document upload for contractor/hotel-company applications has no dashboard UI yet (only owners have one) — both success screens direct users to log in later, but there's nowhere to actually upload yet.
- Admin panel's "Properties" and "Documents" tabs remain non-functional stubs — only Applications/Bookings/Users were wired up.
- No real payment gateway is connected (mock adapter only, by design — no credentials exist in this environment).
- As always: nothing in this release has been executed in a real browser/Node environment. All verification is static analysis, which is rigorous but not a substitute for actually running `scripts/verify-build.sh` in a real environment before deploying.

## 2026-09-09 — Batch 1 integration reconciliation

- Added `backend/scripts/migration/production-migration.ts` with mandatory source/target separation, verified backup, explicit confirmation, clean-schema generation, optional data migration, and post-migration validation.
- Added `backend/scripts/migration/validate-migration.ts` for schema/object validation against the authoritative Prisma schema.
- Added `backend/scripts/migration/rollback-production.ts` with explicit destructive-operation confirmation.
- Added `backend/scripts/migration/PRODUCTION-MIGRATION-GUIDE.md` documenting the safe Strategy C workflow and its external blockers.
- Added package scripts: `migration:production`, `migration:validate`, `migration:rollback`.
- Updated the upload rate-limit documentation to reflect the existing authenticated owner-document upload path.
- Added `PRODUCTION_READINESS.md` separating locally implemented controls from items that still require Paymob credentials and production data.

No production database was accessed or modified. The active Prisma migration chain was not rewritten in this reconciliation; the production helper generates the clean target schema directly from `backend/prisma/schema.prisma`.
