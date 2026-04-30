#!/usr/bin/env bash
# tools/build-www-bundles.sh — esbuild-bundle www-track JS modules.
#
# The `www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/` directory
# ships as TypeScript source that the v1.49.581 spec said "builds with the
# existing Vite pipeline" — but no Vite build was wired up. As a result every
# SPICE viewer HTML across ELC + MUS + NASA since v1.49.581 was importing a
# 404 module and silently failing.
#
# This script bundles the renderer in-place (single ESM artifact, no external
# deps, browser-runnable). Idempotent: re-running produces the same bundle.
#
# Exit codes:
#   0  all bundles built
#   1  esbuild failed
#   2  source missing (inventory drift)
#
# Usage:
#   bash tools/build-www-bundles.sh
#   npm run build:www-bundles
#
# Authored 2026-04-29 in v1.49.587 (closes lesson learned from the v1.49.586
# follow-up: SPICE viewer broken on tibsfox.com since v1.49.581).

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[build-www-bundles] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

QUIET="${BUILD_WWW_BUNDLES_QUIET:-0}"

log() {
  if [ "$QUIET" != "1" ]; then
    echo "$@"
  fi
}

# ----- Bundle 1: NASA spice-renderer -----
SPICE_SRC="www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/index.ts"
SPICE_OUT="www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/index.js"

if [ ! -f "$SPICE_SRC" ]; then
  echo "[build-www-bundles] FATAL: spice-renderer source missing at $SPICE_SRC" >&2
  exit 2
fi

log "[build-www-bundles] step 1/1: bundling spice-renderer (esbuild)"
if ! npx --no-install esbuild --bundle --format=esm --target=es2022 \
    --external:vitest --external:node:fs --external:node:path \
    --outfile="$SPICE_OUT" "$SPICE_SRC" >/dev/null 2>&1; then
  echo "[build-www-bundles] FAIL: esbuild on spice-renderer exited non-zero" >&2
  echo "[build-www-bundles] Re-run without redirection to see the error:" >&2
  echo "[build-www-bundles]   npx esbuild --bundle --format=esm --target=es2022 \\" >&2
  echo "[build-www-bundles]     --external:vitest --external:node:fs --external:node:path \\" >&2
  echo "[build-www-bundles]     --outfile=\"$SPICE_OUT\" \"$SPICE_SRC\"" >&2
  exit 1
fi
SPICE_SIZE=$(stat -c '%s' "$SPICE_OUT")
log "[build-www-bundles] step 1/1: PASS ($(printf "%'d" "$SPICE_SIZE") bytes)"

log "[build-www-bundles] all bundles built — safe to FTP-sync"
exit 0
