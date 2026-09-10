#!/usr/bin/env bash
# Local development setup — starts infra, installs deps, migrates, seeds.
# Run from the repository root: ./scripts/setup.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Starting Postgres + Redis"
(cd "$ROOT_DIR/deployment" && docker compose up -d postgres redis)

echo "==> Installing backend dependencies"
(cd "$ROOT_DIR/backend" && npm install)

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  echo "==> Creating backend/.env from .env.example — EDIT THIS BEFORE PRODUCTION USE"
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
fi

echo "==> Generating Prisma client"
(cd "$ROOT_DIR/backend" && npx prisma generate)

echo "==> Running migrations"
(cd "$ROOT_DIR/backend" && npx prisma migrate dev --name init)

echo "==> Seeding roles, default tenant, and geo (cities/districts)"
(cd "$ROOT_DIR/backend" && npx ts-node prisma/seed-roles.ts)
(cd "$ROOT_DIR/backend" && npm run prisma:seed)
(cd "$ROOT_DIR/backend" && npm run prisma:seed:geo)

echo "==> Installing frontend dependencies"
(cd "$ROOT_DIR/frontend" && npm install)

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > "$ROOT_DIR/frontend/.env.local"
fi

echo ""
echo "==> Setup complete."
echo "    Start the backend:  cd backend && npm run dev"
echo "    Start the frontend: cd frontend && npm run dev"
