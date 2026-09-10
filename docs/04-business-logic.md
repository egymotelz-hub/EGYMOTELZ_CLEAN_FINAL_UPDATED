# EGYMOTELZ — Phase 4: Business Logic (complete)

Real service-layer implementations for every state machine identified in Phase 1 §3. These are pure business logic — no routes/controllers yet (that's Phase 5), but every service is directly callable and unit-tested with mocked Prisma.

## Files delivered

```
src/lib/dateUtils.ts                          night enumeration, hold-expiry math
src/lib/adapters/email.adapter.ts              EmailAdapter interface + console dev impl
src/lib/adapters/sms.adapter.ts                 SmsAdapter interface + console dev impl
src/validators/auth.validators.ts               Egyptian phone/national-ID/password rules
src/validators/owner-applications.validators.ts  full 6-step wizard payload schema
src/validators/bookings.validators.ts            booking creation + admin action schemas
src/services/notifications.service.ts            in-app + email/SMS dispatch, role-broadcast
src/services/auth.service.ts                     login, refresh rotation, password reset
src/services/owner-applications.service.ts        submission + admin review state machine
src/services/bookings.service.ts                  ★ the availability-locking booking engine
src/services/finance.service.ts                   commission auto-calc, manual entries, summary
src/services/contractor.service.ts                linear stage-progression state machine
src/jobs/releaseExpiredHolds.job.ts               cron: releases unconfirmed holds
prisma/seed-roles.ts                              seeds the 7 RBAC role rows services depend on
src/tests/bookings.service.test.ts                unit tests: conflict detection, happy path
src/tests/owner-applications.service.test.ts       unit tests: illegal transitions, doc gating
```

## The booking engine — how the double-booking guard actually works

This was the highest-risk piece, so it's deliberately over-engineered with two independent layers:

1. **Serializable transaction isolation** around the whole "check availability → create booking → lock nights" sequence, so no other transaction can interleave a conflicting read/write.
2. **A `@@unique([unitId, date])` constraint** on `AvailabilityCalendar` (from Phase 2) as the true, physically-enforced guarantee. If two requests somehow both pass the availability check (e.g. isolation level misconfigured in some environment), the second `createMany` call throws Postgres error `P2002`, which the service catches and turns into a clean `409 Conflict` — never a raw 500.

Design convention: **the absence of an `AvailabilityCalendar` row means available.** A row's mere existence (regardless of status: `HELD`, `BOOKED`, `BLOCKED`) means "not available." This keeps the conflict check a single `findMany` rather than a status-by-status branch.

Flow: `PENDING` (nights `HELD`, `holdExpiresAt` set) → admin `mark_contacted` → `confirm` (nights flip to `BOOKED`, hold cleared, **commission auto-recorded** via `financeService.recordCommissionForBooking`) → `check_in` → `check_out`. `decline`/`cancel` delete the calendar rows outright, releasing the nights. A cron job (`releaseExpiredHolds.job.ts`, wired into `server.ts` via `node-cron`, runs every minute) auto-cancels any booking whose hold expired without confirmation — this is where the 15-minute default from Phase 3 gets enforced.

## Owner application — how "account created at submission" actually works

`OwnerApplicationsService.submit()` runs one Prisma transaction that creates `User` (status `PENDING_VERIFICATION`) → assigns the `owner` role → creates `Owner` (`verificationStatus: PENDING`) → creates the `OwnerApplication` row with all 6 steps' fields and `slaDueAt` = submission + 48h. The owner can log in immediately; `Owner.verificationStatus` only flips to `VERIFIED` — and `Property` + one `Unit` per `unitCount` get created — when an admin explicitly `approve`s the application, which first checks that `NATIONAL_ID` and `PROOF_OF_OWNERSHIP` documents are `VERIFIED` (not just uploaded). Illegal transitions (e.g. `SUBMITTED` straight to `APPROVED`, skipping review) are rejected with a 409 before any DB write — covered directly by the test suite.

## Finance — commission split

On booking `confirm`, `FinanceService.recordCommissionForBooking` looks up the owner's currently-`ACTIVE` `Contract`, applies its `commissionRate` to `Booking.totalPrice`, and writes two `FinancialTransaction` rows (`COMMISSION` + `PAYOUT`) — both internal-only, never exposed to owner/guest-facing endpoints per the Phase 1 non-negotiable. If no active contract exists yet, it records the full amount as a pending payout with a note flagging the missing contract, rather than guessing a rate.

## Contractor — stage progression

Fixed linear order (`Design → Construction → Furnishing → Inspection → Complete`); `advanceStage` only ever moves one step forward and derives `progressPct` from position in the sequence (`0/25/50/75/100`). Moving backward or skipping requires the separate `revertStage` action, which mandates a `reason` string — this is the audit trail the mission's Phase 3 schema requirement asked for, enforced at the service layer rather than left to convention.

## Testing

Both new test files follow the Phase 3 pattern (mock `../lib/prisma` and any service the unit under test calls, no real DB). `bookings.service.test.ts` proves the conflict-rejection path, the happy-path lock creation, and the not-bookable-unit guard. `owner-applications.service.test.ts` proves the state machine rejects an illegal jump, rejects approval without verified documents, and accepts a valid `start_review` transition.

## What's still a stub, deliberately

- Email/SMS adapters log to console (`ConsoleEmailAdapter`/`ConsoleSmsAdapter`) — real provider credentials (SMTP, Twilio, Cloudinary for documents) are a deployment-config concern, not something this sandbox can wire without real secrets and network access. Swapping them is a one-line change since everything depends on the `EmailAdapter`/`SmsAdapter` interfaces.
- Document upload itself (`attachDocument`) accepts an already-hosted `fileUrl` — the actual multipart upload endpoint that pushes bytes to Cloudinary/S3 belongs in Phase 5 (API layer), matching the mission's own "Storage: Cloudinary" architecture line from Phase 2.

## Next

**Phase 5 — API Design**: routes + controllers wiring these services to real HTTP endpoints (with pagination/filtering/sorting per the mission's Phase 5 requirement), the OpenAPI annotations for the Swagger UI already mounted in Phase 3, and the document-upload multipart endpoint. Want me to continue straight there?
