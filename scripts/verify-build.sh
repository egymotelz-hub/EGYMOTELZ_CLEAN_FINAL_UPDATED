#!/usr/bin/env bash
# Build-verification pass: lint, typecheck, test, and build both apps.
# Run from the repository root: ./scripts/verify-build.sh
# Exits non-zero on the first failure so CI/manual runs fail loudly.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Backend: install"
(cd "$ROOT_DIR/backend" && npm ci)

echo "==> Backend: lint"
(cd "$ROOT_DIR/backend" && npm run lint)

echo "==> Backend: prisma generate"
(cd "$ROOT_DIR/backend" && npx prisma generate)

echo "==> Backend: test"
(cd "$ROOT_DIR/backend" && npm test)

echo "==> Backend: build (also catches TypeScript errors)"
(cd "$ROOT_DIR/backend" && npm run build)

echo "==> Frontend: install"
(cd "$ROOT_DIR/frontend" && npm ci)

echo "==> Frontend: lint"
(cd "$ROOT_DIR/frontend" && npm run lint)

echo "==> Frontend: build (also catches TypeScript errors)"
(cd "$ROOT_DIR/frontend" && npm run build)

echo ""
echo "==> All checks passed."
