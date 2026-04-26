#!/usr/bin/env bash
#
# verify-mathlib-pin.sh — JP-001 lake-build verification automation.
#
# Reads the pinned Mathlib SHA from src/mathematical-foundations/lean-toolchain.md
# (parsed dynamically; never hardcoded), clones or updates Mathlib4 at a
# configurable path, checks out the pinned commit, and runs `lake exe cache get`
# followed by `lake build` for the four load-bearing namespaces from JP-001:
#
#   - Mathlib.Probability.Kernel.Disintegration.Basic
#   - Mathlib.InformationTheory.KullbackLeibler.Basic
#   - Mathlib.Probability.Distributions.Gaussian
#   - Mathlib.Probability.IdentDistrib
#
# This script does NOT install Lean for the user — it gates and reports.
# Disk + time costs (typical, RTX-class workstation): 5–8 GB total
# (elan ~1.5 GB, Mathlib ~1.2 GB, oleans ~3–5 GB); ~5–15 min on cache hit,
# ~1–3 hr on cache miss.
#
# Usage:
#   tools/verify-mathlib-pin.sh [--mathlib-dir PATH] [--no-build]
#
# Environment:
#   MATHLIB_DIR    — override checkout path (default: ./.mathlib-verify-checkout)
#   LAKE_OFFLINE   — if set non-empty, skip `lake exe cache get`
#
# Exit codes:
#   0 — all four namespaces compiled (or --no-build path: parse + clone OK)
#   1 — elan/Lean missing → install instructions printed
#   2 — mathlib clone or checkout failed
#   3 — lake cache get failed
#   4 — at least one namespace failed to build
#   5 — could not parse SHA from lean-toolchain.md

set -euo pipefail

# ─── Defaults + argument parsing ─────────────────────────────────────────────

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLCHAIN_DOC="$REPO_ROOT/src/mathematical-foundations/lean-toolchain.md"
MATHLIB_DIR="${MATHLIB_DIR:-$REPO_ROOT/.mathlib-verify-checkout}"
DO_BUILD=1

while [ $# -gt 0 ]; do
  case "$1" in
    --mathlib-dir)
      MATHLIB_DIR="$2"
      shift 2
      ;;
    --no-build)
      DO_BUILD=0
      shift
      ;;
    -h|--help)
      sed -n '3,33p' "$0"
      exit 0
      ;;
    *)
      echo "verify-mathlib-pin.sh: unknown argument: $1" >&2
      echo "Usage: tools/verify-mathlib-pin.sh [--mathlib-dir PATH] [--no-build]" >&2
      exit 1
      ;;
  esac
done

# Four namespaces from JP-001 lean-toolchain.md.
NAMESPACES=(
  "Mathlib.Probability.Kernel.Disintegration.Basic"
  "Mathlib.InformationTheory.KullbackLeibler.Basic"
  "Mathlib.Probability.Distributions.Gaussian"
  "Mathlib.Probability.IdentDistrib"
)

# ─── Helpers ─────────────────────────────────────────────────────────────────

log()  { printf '[verify-mathlib-pin] %s\n' "$*"; }
fail() { printf '[verify-mathlib-pin] ERROR: %s\n' "$*" >&2; }

# Extract the 40-char hex SHA from the "Pinned Mathlib Commit Hash" section.
# Robust to surrounding doc churn: looks for the section header, then the
# next fenced code block, and matches the first 40-char hex string in it.
parse_pinned_sha() {
  local doc="$1"
  if [ ! -f "$doc" ]; then
    fail "lean-toolchain.md not found at $doc"
    return 1
  fi
  # awk:
  #  - track whether we're past the section header
  #  - inside that section, capture the first 40-char hex string seen on a
  #    line of its own (the fenced code block contents)
  awk '
    /^## Pinned Mathlib Commit Hash/ { in_section = 1; next }
    /^## / && in_section            { exit }
    in_section && match($0, /[0-9a-f]{40}/) {
      print substr($0, RSTART, RLENGTH)
      exit
    }
  ' "$doc"
}

check_lean_installed() {
  if ! command -v elan >/dev/null 2>&1; then
    cat >&2 <<'EOF'
[verify-mathlib-pin] ERROR: elan (Lean toolchain manager) not found on PATH.

Install elan:
  curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh
  source "$HOME/.elan/env"

Then install Lean 4.15.0:
  elan install leanprover/lean4:v4.15.0

Re-run this script after installation.
EOF
    return 1
  fi
  if ! command -v lake >/dev/null 2>&1; then
    cat >&2 <<'EOF'
[verify-mathlib-pin] ERROR: lake (Lean build tool) not found on PATH.

elan is installed but the active toolchain does not include lake. Try:
  elan default leanprover/lean4:v4.15.0
EOF
    return 1
  fi
  return 0
}

# ─── Step 1 — Parse SHA ──────────────────────────────────────────────────────

log "parsing pinned SHA from $TOOLCHAIN_DOC"
SHA="$(parse_pinned_sha "$TOOLCHAIN_DOC")" || exit 5
if [ -z "$SHA" ] || ! echo "$SHA" | grep -qE '^[0-9a-f]{40}$'; then
  fail "could not parse a 40-char hex SHA from $TOOLCHAIN_DOC §'Pinned Mathlib Commit Hash'"
  exit 5
fi
log "pinned SHA: $SHA"

# Early exit for --no-build path — useful for CI smoke tests that just want
# to confirm the script + SHA-parse logic work.
if [ "$DO_BUILD" -eq 0 ] && [ ! -d "$MATHLIB_DIR" ]; then
  log "--no-build supplied and Mathlib checkout absent — exiting 0 (parse OK)"
  exit 0
fi

# ─── Step 2 — Lean install check ─────────────────────────────────────────────

log "checking for elan + lake on PATH"
if ! check_lean_installed; then
  exit 1
fi

# ─── Step 3 — Mathlib clone / update + checkout ──────────────────────────────

if [ -d "$MATHLIB_DIR/.git" ]; then
  log "Mathlib checkout exists at $MATHLIB_DIR — fetching"
  if ! git -C "$MATHLIB_DIR" fetch --quiet origin; then
    fail "git fetch failed"
    exit 2
  fi
else
  log "cloning Mathlib4 into $MATHLIB_DIR (this may take a few minutes)"
  if ! git clone --quiet https://github.com/leanprover-community/mathlib4 "$MATHLIB_DIR"; then
    fail "git clone failed"
    exit 2
  fi
fi

log "checking out $SHA"
if ! git -C "$MATHLIB_DIR" -c advice.detachedHead=false checkout --quiet "$SHA"; then
  fail "git checkout $SHA failed"
  exit 2
fi

if [ "$DO_BUILD" -eq 0 ]; then
  log "--no-build supplied — exiting 0 (parse + clone + checkout OK)"
  exit 0
fi

# ─── Step 4 — lake exe cache get (skippable via LAKE_OFFLINE) ────────────────

if [ -n "${LAKE_OFFLINE:-}" ]; then
  log "LAKE_OFFLINE set — skipping 'lake exe cache get'"
else
  log "fetching pre-built oleans via 'lake exe cache get' (this is the long step)"
  if ! ( cd "$MATHLIB_DIR" && lake exe cache get ); then
    fail "lake exe cache get failed"
    exit 3
  fi
fi

# ─── Step 5 — lake build per namespace ──────────────────────────────────────

log "building ${#NAMESPACES[@]} namespaces"
FAILURES=0
for ns in "${NAMESPACES[@]}"; do
  log "  building $ns ..."
  if ( cd "$MATHLIB_DIR" && lake build "$ns" ); then
    log "  PASS  $ns"
  else
    log "  FAIL  $ns"
    FAILURES=$((FAILURES + 1))
  fi
done

# ─── Summary ─────────────────────────────────────────────────────────────────

if [ "$FAILURES" -eq 0 ]; then
  log "all ${#NAMESPACES[@]} namespaces compiled successfully against pinned commit $SHA"
  exit 0
else
  fail "$FAILURES of ${#NAMESPACES[@]} namespaces failed to build"
  exit 4
fi
