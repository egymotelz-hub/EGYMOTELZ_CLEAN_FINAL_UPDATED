# EgyMotelz v1.3 — Manual Migration Runbook

**Purpose:** close the 22-table migration gap identified in the Migration Audit, then apply the two pending migrations (`20260821000000_payment_commission_ledger`, `20260821000001_commission_rule_tiers`), safely, in staging first and production second.

**Scope of this document:** procedure only. No application code, `schema.prisma`, or migration files are touched by this document itself — everything below is a command reference for you to run manually.

---

## Pre-Migration Checklist

Before starting anything:

- [ ] Confirm you have a recent, verified-restorable backup of the production database (see Step 1).
- [ ] Confirm you have a staging database that is either a fresh copy of production or close enough to it to be representative.
- [ ] Confirm you have shell access to an environment with real network access (this work cannot be done from the sandbox that produced this codebase — that environment cannot reach `binaries.prisma.sh`).
- [ ] Confirm `DATABASE_URL` is under your control and you know exactly which database each value points to.
- [ ] Confirm no one else is actively running migrations or schema changes against the same database right now.
- [ ] Read the full runbook once before executing any command, especially Steps 4 and 12.
- [ ] Have a rollback plan ready (Step 13) before you begin, not after something breaks.

---

## Step 1 — Back Up the Database Safely

Do this against **production**, before touching anything, regardless of the fact that you're working in staging first.

```bash
# Postgres example — adjust host/user/db name to match your DATABASE_URL
pg_dump "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" \
  --format=custom \
  --file="egymotelz_prod_backup_$(date +%Y%m%d_%H%M%S).dump"
```

- Use `--format=custom` (not plain SQL) — it's compressed and restorable with `pg_restore`, including selective table restores if you ever need a partial recovery.
- If your database is hosted (RDS, Cloud SQL, Supabase, Neon, etc.), also trigger/verify that platform's own snapshot feature as a second, independent backup — don't rely solely on a manually-run `pg_dump` from your machine.
- **Verify the backup is restorable** before proceeding — restore it into a throwaway database and spot-check a few tables:

```bash
createdb egymotelz_backup_verify
pg_restore --dbname=egymotelz_backup_verify egymotelz_prod_backup_*.dump
psql egymotelz_backup_verify -c "SELECT count(*) FROM users;"
psql egymotelz_backup_verify -c "SELECT count(*) FROM bookings;"
dropdb egymotelz_backup_verify
```

A backup you haven't test-restored is not a backup you can trust.

---

## Step 2 — Create/Use a Staging Database

Never generate a new migration for the first time against production. Staging is where the catch-up migration gets generated and reviewed.

**Option A — fresh copy of production (preferred):**

```bash
createdb egymotelz_staging
pg_restore --dbname=egymotelz_staging egymotelz_prod_backup_*.dump
```

**Option B — clean empty staging database**, if you don't need production's actual data to validate this (acceptable since the 22 missing tables are additive — they don't touch existing data):

```bash
createdb egymotelz_staging
```

Either way, set a **separate** environment file for staging so you never point staging commands at production by accident:

```bash
# .env.staging
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/egymotelz_staging"
```

---

## Step 3 — Verify Prisma Is Pointed at Staging BEFORE Anything Destructive

This is the single most important safety check in this entire runbook. Do it before every command in Steps 4–7, not just once.

```bash
# Explicitly load the staging env file rather than relying on ambient DATABASE_URL
export $(grep -v '^#' .env.staging | xargs)

# Print (redacted) confirmation of which database you're about to touch
echo "$DATABASE_URL" | sed -E 's#(://[^:]+:)[^@]+(@)#\1****\2#'
```

Confirm the host and database name in that output say `egymotelz_staging` (or whatever you named it) — **not** your production host/database name — before running anything in Step 4.

If you use a `.env` file that Prisma auto-loads (the default `backend/.env`), the safest approach is to **temporarily rename it** so nothing accidentally falls back to it:

```bash
mv .env .env.production.bak
cp .env.staging .env
```

Remember to reverse this (Step 11) before ever touching production.

---

## Step 4 — Generate the Catch-Up Migration (Staging Only)

With `.env` confirmed pointed at staging:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name catch_up_missing_tables --create-only
```

- `--create-only` is important: it generates the migration file **without applying it**, so you get a chance to read it first (Step 5) before anything runs.
- This will diff `schema.prisma` against the existing migration history (`20260811120000_baseline_clean` through `20260821000001_commission_rule_tiers`) and produce a new migration folder, e.g. `prisma/migrations/<timestamp>_catch_up_missing_tables/migration.sql`, containing `CREATE TABLE`/`CREATE TYPE` statements for the 22 tables and their enums.
- If Prisma reports **drift** (the database doesn't match what migration history says it should) before it even gets to generating anything, **stop and read the message carefully** — this would mean Case B from the audit (something exists in the DB that isn't in migration history) after all. Do not proceed past a drift warning without understanding exactly what it's telling you; paste the exact output somewhere you can review it calmly rather than confirming a prompt reflexively.

---

## Step 5 — Inspect the Generated Migration SQL

Do not apply anything yet. Open the generated file and read it in full:

```bash
cat prisma/migrations/*_catch_up_missing_tables/migration.sql
```

Check specifically for:

- **Table count** — should create all 22 tables named in the audit (`partners`, `partner_users`, `partner_services`, `partner_referrals`, `partner_referral_events`, `commissions`, `commission_rules`, `maintenance_requests`, `maintenance_contracts`, `maintenance_contract_units`, `advertisements`, `advertisement_images`, `campaigns`, `governorates`, `user_identities`, `leads`, `lead_events`, `follow_ups`, `bids`, `project_opportunities`, `project_partner_invitations`, `interior_design_companies`).
- **Foreign key ordering** — tables should be created before anything that references them (e.g. `partners` before `partner_users`; `commission_rules` before `commissions`).
- **No `DROP TABLE` or `DROP COLUMN` statements** — a pure catch-up migration should be 100% additive. If you see any `DROP`, stop and investigate why Prisma thinks something needs removing before proceeding.
- **Enum values match exactly** what's in `schema.prisma` for each new enum (`PartnerType`, `PartnerVerificationStatus`, `CommissionStatus`, `CommissionRuleType`, `PartnerReferralDirection`, `PartnerReferralStatus`, etc.).
- **No unexpected changes to already-migrated tables** — this migration should not `ALTER` any of the 49 tables that already exist, only create new ones (aside from the two new FK columns already covered by your existing `20260821000000`/`20260821000001` migrations — those are separate files and should not appear inside the catch-up migration).

If anything here looks wrong, do not proceed to Step 6 — go back and reconsider before applying even to staging.

---

## Step 6 — Verify Dependency Ordering

Confirm the new migration folder's timestamp sorts correctly relative to the two pending ones:

```bash
ls prisma/migrations/ | sort
```

Expected order:

```
20260811120000_baseline_clean
<new_timestamp>_catch_up_missing_tables      <- must sort BEFORE the next two
20260819000000_partner_unit_submission
20260819010000_site_visit_gate
20260819020000_agreement_acceptance
20260819030000_maintenance_closed_status
20260821000000_payment_commission_ledger
20260821000001_commission_rule_tiers
```

Because `--create-only` timestamps the new migration with the current date/time, it will sort **after** `20260819...` and `20260821000000`, not before them — which is backwards from what's needed, since `20260819000000_partner_unit_submission` already contains a `REFERENCES "partners"` foreign key that requires `partners` to exist first.

**You must rename the generated folder** to give it an earlier timestamp than `20260819000000`, e.g.:

```bash
mv prisma/migrations/<new_timestamp>_catch_up_missing_tables \
   prisma/migrations/20260812000000_catch_up_missing_tables
```

Re-run `ls prisma/migrations/ | sort` and confirm the order now matches the expected list above exactly, with the catch-up migration positioned right after `20260811120000_baseline_clean`.

Do not rename or edit the *contents* of any other existing migration file — only the folder name of the newly generated one, and only before it has ever been applied anywhere.

---

## Step 7 — Apply Migrations in Staging

Still on staging, still with `.env` confirmed pointed at staging (re-check Step 3's echo command):

```bash
npx prisma migrate deploy
```

`migrate deploy` (not `migrate dev`) applies every migration in `prisma/migrations/` that hasn't been applied yet, in filename order, without prompting and without ever resetting anything. This is the correct command for both staging and production from this point forward — you only needed `migrate dev --create-only` once, in Step 4, to generate the new file.

---

## Step 8 — When to Run `prisma generate`

Run it immediately after `migrate deploy` succeeds, still in staging:

```bash
npx prisma generate
```

This regenerates the Prisma Client's TypeScript types to match the now-complete schema. Every "stale client" TypeScript error flagged throughout this project's development sessions should disappear after this step — that's the expected, confirming signal that everything lined up correctly.

---

## Step 9 — Verify with `migrate status`

```bash
npx prisma migrate status
```

Expected output: something to the effect of *"Database schema is up to date"* with all migrations, including the new catch-up one, listed as applied. If it reports any pending or failed migrations, stop and investigate before touching production.

---

## Step 10 — Test the Application After Migration (Staging)

With staging's `DATABASE_URL` still active:

```bash
cd backend
npm run build        # tsc — should now compile with zero errors related to Partner/Commission/Maintenance/Advertisement/Campaign models
npm run dev           # or your normal start command
```

Functional smoke tests to run against staging, covering the code built across this project that depends on the newly-created tables:

- [ ] Partner registration (`POST /partners`) — creates a `partners` row successfully.
- [ ] Admin partner approval flow — list, review, approve a partner.
- [ ] Partner unit registration (`POST /units` as an approved partner).
- [ ] Site visit gate transitions (require → record → approve).
- [ ] Partner referral capture on owner registration (`?partner=CODE`).
- [ ] Maintenance request creation, assignment, and transition.
- [ ] Marketing Manager: create an advertisement, create a campaign.
- [ ] A test booking through to payment initiation (`POST /payments/:bookingId/initiate`) — confirm it no longer errors on a missing table.
- [ ] Admin commission rule listing (`GET /finance/commission-rules`) — should return the 3 seeded rows (base 80/20, tier 1, tier 2) once the seed data from `20260821000001_commission_rule_tiers` has run.
- [ ] OAuth login (Google/Apple) — confirm `user_identities` writes succeed (this table was part of the gap).

Only proceed to production once every item above passes in staging.

---

## Step 11 — Restore Your Production `.env`

Before doing anything in Step 12:

```bash
mv .env.production.bak .env
```

Re-run the redacted `echo "$DATABASE_URL" | sed ...` check from Step 3 and confirm it now shows your **production** host/database name.

---

## Step 12 — Move the Exact Tested Migration Files to Production

Do **not** regenerate anything against production. Copy the exact files that were generated and tested in staging:

```bash
# From your staging checkout, confirm exactly what's new relative to production's current migrations folder:
diff -rq staging/backend/prisma/migrations production/backend/prisma/migrations

# Copy only the new migration folder(s) across — the catch-up plus the two
# already-pending ones, if production's repo doesn't already have them:
cp -r staging/backend/prisma/migrations/20260812000000_catch_up_missing_tables production/backend/prisma/migrations/
cp -r staging/backend/prisma/migrations/20260821000000_payment_commission_ledger production/backend/prisma/migrations/  # if not already present
cp -r staging/backend/prisma/migrations/20260821000001_commission_rule_tiers production/backend/prisma/migrations/     # if not already present
```

The goal is byte-for-byte identical migration files between what you tested in staging and what runs in production — never hand-edit a migration file between the two.

### Production Procedure

```bash
cd production/backend

# Re-confirm you're pointed at production (Step 3 check, again)
echo "$DATABASE_URL" | sed -E 's#(://[^:]+:)[^@]+(@)#\1****\2#'

# Apply — never `migrate dev`, never `db push`, on production
npx prisma migrate deploy

# Regenerate the client
npx prisma generate

# Verify
npx prisma migrate status
```

Schedule this for a low-traffic window. Even though the catch-up migration is purely additive (no `DROP`/`ALTER` of existing tables), `CREATE TYPE`/`CREATE TABLE` statements can briefly hold locks — on a large production database this is normally sub-second, but plan for it rather than assume it.

---

## Step 13 — Rollback / Recovery Strategy

**If `migrate deploy` fails partway through in production:**

Prisma wraps each migration file in a transaction where the database supports it (Postgres does). A failed migration should roll back automatically and `migrate status` will show it as failed, not partially applied. Confirm this:

```bash
npx prisma migrate status
```

If it shows a failed migration:

1. **Do not** run `migrate dev` or `db push` to "fix" it — this can make things worse on production.
2. Read the exact error. If it's a transient issue (connection drop, lock timeout), the fix is often just re-running `migrate deploy` once the underlying issue is resolved.
3. If the migration is genuinely broken (a real SQL error, not transient), mark it as rolled back so Prisma's history stays consistent, then fix the migration file in staging, re-test the whole staging flow from Step 4 onward, and re-copy to production:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
4. If you're unsure whether it partially applied despite the transaction wrapper (e.g. a non-transactional statement was involved), restore from the Step 1 backup rather than guessing:
   ```bash
   pg_restore --clean --dbname="$DATABASE_URL" egymotelz_prod_backup_*.dump
   ```
   `--clean` drops existing objects before recreating them from the backup — read `pg_restore`'s output carefully and expect this to take a maintenance window, not a quick fix.

**If the migration applies successfully but the application then misbehaves:**

That's an application-level issue, not a migration one — the backup lets you restore data if needed, but the fix is in code, tested in staging first, same as any other deploy.

---

## Post-Migration Checklist

- [ ] `npx prisma migrate status` shows "up to date" in production.
- [ ] `npx prisma generate` has been run in production's deployed environment (or as part of your build step).
- [ ] All Step 10 smoke tests re-run and pass against production.
- [ ] Application logs show no new errors referencing `partners`, `commissions`, `commission_rules`, `maintenance_requests`, `advertisements`, `campaigns`, `user_identities`, or the other 15 previously-missing tables.
- [ ] The Step 1 backup is retained and its location documented somewhere your team can find it later.
- [ ] `.env` / `.env.staging` / `.env.production.bak` are back in their normal, correct state (no leftover renamed files causing confusion for the next person).
- [ ] The 3 seeded commission rules (base 80/20, 1–5 units/6mo, 6–10 units/12mo) are visible via `GET /finance/commission-rules` in production.
- [ ] Confirm no other engineer/session runs `migrate dev` against production at any point going forward — `migrate deploy` is the only production-safe command from here on.

---

## Reference — Confirmed Commission Business Rule (for context, not acted on in this document)

Recorded as confirmed, to guide the *application code* (already implemented, unchanged by this runbook):

- At the moment a qualifying booking is financially finalized, the referring partner's **current** qualifying-unit count determines the tier.
- 1–5 qualifying referred apartments → 2% referral commission, 6-month protection period.
- 6–10 qualifying referred apartments → 2% referral commission, 12-month protection period.
- The applicable tier and resulting amounts are snapshotted onto that booking's Commission record at that moment.
- If a partner's qualifying count later crosses a tier boundary, only **future** qualifying bookings use the new tier — already-finalized bookings are never recalculated.
- No tier exists yet for >10 apartments, intentionally — admin can add one later via the Commission Rules table, whose schema already supports arbitrary additional tiers (`minReferredUnits`/`maxReferredUnits`/`durationMonths` are all open-ended, admin-managed fields, not hardcoded).

This matches what `backend/src/services/commission.service.ts` already implements — no code change was made as part of this runbook.
