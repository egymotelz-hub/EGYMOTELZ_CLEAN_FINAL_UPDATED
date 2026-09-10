# Installation & Local Development Guide

## Prerequisites
- Node.js 20+
- Docker + Docker Compose (for Postgres/Redis, or install both natively if you prefer)
- npm (ships with Node)

## 1. Start the database and cache

```bash
cd deployment
docker compose up -d postgres redis
```

This starts PostgreSQL on `:5432` and Redis on `:6379` with the credentials already wired into `backend/.env.example`.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in real values — at minimum:
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: generate two different random 32+ character strings (e.g. `openssl rand -hex 32`)
- `DATABASE_URL`: leave as-is if using the Docker Compose Postgres above
- Leave `CLOUDINARY_*` / `SMTP_*` / `SMS_*` blank for local dev — the app falls back to dev-safe stubs (console-logged emails/SMS, fabricated upload URLs) automatically. See `docs/07-security.md` and `docs/04-business-logic.md` for what that means in practice.

Then:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed              # seeds the default EGYMOTELZ tenant + root domains
npx ts-node prisma/seed-roles.ts  # seeds the 7 RBAC roles (guest, owner, contractor, financial_partner, finance_staff, admin, super_admin)
npm run prisma:seed:geo          # seeds the City/District catalog — required before any city dropdown (owner/contractor/hotel-management-company registration, listings) will show data
npm run dev                      # API now running on http://localhost:4000
```

Verify it's up: `curl http://localhost:4000/health` should return `{"status":"ok"}`.

## 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev
```

Visit `http://localhost:3000`. The root route is the language-selection screen (matching the original prototype's default view).

## 4. Creating your first admin/finance/contractor accounts

There is currently no seeded admin user (deliberately — no default credentials ship in a production package). To create one:

1. Submit the Owner Wizard once via the UI (or `POST /api/owner-applications`) to create a `User` row.
2. Use Prisma Studio (`npx prisma studio` from `backend/`) or a direct SQL statement to add an `admin`/`super_admin`/`finance_staff`/`contractor`/`financial_partner` row to that user's `UserRole` table (the `Role` table is already seeded with all 7 role keys from step 2 above).
3. Log in from `/admin`, `/finance`, `/contractor`, or `/financial-partner` respectively.

## 5. Running tests

```bash
cd backend
npm test
```

See `docs/08-09-performance-and-testing.md` for what is and isn't covered.

## Troubleshooting

See `docs/TROUBLESHOOTING.md` for common setup issues.
