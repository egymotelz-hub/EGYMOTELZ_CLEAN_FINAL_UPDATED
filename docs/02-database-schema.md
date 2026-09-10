# EGYMOTELZ — Phase 2 Notes: Database Schema

Companion to `schema.prisma`. Explains how each confirmed answer shaped the design, plus what still needs seeding before Phase 3/5 (architecture + API spec) can build on top of this.

## How each answer maps into the schema

1. **Owner account at submission** → `OwnerApplication` no longer blocks on approval; `User` + `Owner` are created immediately when the wizard is submitted (`passwordHash` set at step 0 or via a verification-link flow — either way, `User.status = PENDING_VERIFICATION` until email/phone confirmed). `Owner.verificationStatus` is separate from `User.status` — a user can log in and see "pending" state before the business itself verifies them.
2. **Tenant = guest post-booking** → No separate `Tenant` table. `Booking.status` includes `CHECKED_IN` / `CHECKED_OUT`, and the comment on `BookingStatus` notes that this is the point colloquially called "tenant."
3. **Financial Partner = external role** → New `FinancialPartner` model, its own `User` + login, distinct from internal finance staff (who are just `User`s with the `finance_staff` or `admin` role — no dedicated profile table needed since they're EGYMOTELZ employees, not external accounts). `FinancialTransaction.financialPartnerId` is nullable and separate from `ownerId`, since a transaction can be owner-facing, partner-facing, or purely internal/manual.
4. **Real booking engine** → `AvailabilityCalendar` has a `@@unique([unitId, date])` constraint — this is the actual double-booking guard at the database level, not just application logic. `Booking.unitId` is now required (not nullable), and `holdExpiresAt` supports a "hold this unit for N minutes while the guest completes the form" pattern common in booking engines.
5. **Multi-tenant SaaS** → Every business table carries `tenantId`. A few tables are intentionally **not** tenant-scoped because they're shared catalogs or platform-level: `Amenity` (shared amenity catalog), `Role`/`Permission` (RBAC definitions), `Translation` (i18n strings), and `SystemSetting`/`AuditLog` support a nullable `tenantId` for platform-wide (super_admin) settings/actions that span tenants.

## Role → Table relationship (for Phase 5 RBAC middleware)

| Role key | Backing table | Notes |
|---|---|---|
| `guest` | `Guest` (+ optional linked `User`) | Can book without an account |
| `owner` | `Owner` | 1:1 with `User` |
| `contractor` | `Contractor` | 1:1 with `User`, internal-only portal |
| `financial_partner` | `FinancialPartner` | 1:1 with `User`, **new external portal** (flagged in Phase 1 as a scoped addition, not a redesign) |
| `finance_staff` | none (just a `User` + role) | Internal EGYMOTELZ employees — highest-sensitivity scope |
| `admin` / `super_admin` | none (just a `User` + role) | `super_admin` is the only role allowed to act across tenants |

## Still needs your input before Phase 3 (architecture) locks in)
- **Tenant resolution strategy**: subdomain-per-brand (`brandx.egymotelz.com`), custom domain mapping (`Tenant.domain`), or a header/JWT-claim based approach for the API? This affects the Next.js middleware and Express auth layer design in Phase 3.
- **Booking hold duration**: how many minutes should a unit be held once a guest starts checkout, before the hold expires and the dates release back to available?
- **Commission rate**: per-owner (on `Contract`) as I've modeled it, or could it ever be per-property or per-unit? I defaulted to per-`Contract` (which already links to owner + optional property) since that matches the mission's "Financial Requests"/"Contracts" language.

## Seed data required at deploy time
- `Role` + `Permission` + `RolePermission` rows (RBAC matrix — Phase 5 will enumerate exact permission keys per endpoint).
- `Amenity` catalog (WiFi, breakfast, Nile view, parking, gym, etc. — pull from the listing cards already in the UI: "٢ غرفة", "واي فاي", "إفطار", "نيل ڤيو", "خدمة", "موقف سيارة", "جيم").
- A default `Tenant` row for EGYMOTELZ itself (the first white-label "brand").
- `SystemSetting` defaults: `owner_application.sla_hours = 48`, `booking.sla_hours = 24`, `booking.hold_minutes` (pending your answer above).

## Next
**Phase 3 — System Architecture** (Next.js/Express project structure, tenant-resolution middleware, auth flow, folder layout, Docker Compose topology) once the three questions above are answered — or I can default them and flag the defaults, same as before, your call.
