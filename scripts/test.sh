#!/usr/bin/env bash
# Runs the backend test suite. Run from the repository root: ./scripts/test.sh
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
(cd "$ROOT_DIR/backend" && npm test)
