#!/usr/bin/env bash
# scripts/generate-inventory-manifest.sh
#
# OOPS-GSD v1.49.576 — C6 / OGA-065 (inventory drift-control)
#
# Regenerates INVENTORY-MANIFEST.json at the repo root by walking the
# live .claude/ tree (the installed surface) plus the project-claude/
# source-of-truth tree. The manifest is the canonical answer to:
#
#   "What commands, agents, and hooks does this repo expose, and which
#    of them are vendored from gsd-build vs locally authored?"
#
# Usage:
#   scripts/generate-inventory-manifest.sh
#   scripts/generate-inventory-manifest.sh --check   # exit 1 if drift
#
# Origin classification:
#   - origin = "vendored:gsd-build@<version>" iff the file's frontmatter
#     contains a `gsd-build-source:` line OR the file's header comment
#     contains `gsd-hook-version:` (the legacy stamp from W2 hooks)
#   - origin = "local" otherwise

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$REPO_ROOT"

CHECK_MODE=0
if [ "${1:-}" = "--check" ]; then
  CHECK_MODE=1
fi

# Delegate the actual scan to a portable Python helper for reliable JSON emission.
python3 scripts/generate-inventory-manifest.py "$@"
