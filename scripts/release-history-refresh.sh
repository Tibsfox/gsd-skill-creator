#!/bin/bash
# release-history-refresh.sh — loads env, runs the release-history pipeline.
#
# Idempotent. Safe to re-run. Called by:
#   - scripts/publish-release.sh (at end of every release)
#   - manual catch-up: ./scripts/release-history-refresh.sh
#
# Env resolution order:
#   1. Already-exported vars (CI friendly)
#   2. ./.env                     (this project)
#   3. Anthropic ID cached at /media/foxy/ai/GSD/dev-tools/artemis-ii/.env (fallback)
#
# Flags passed through to refresh.mjs:
#   --fast         skip expensive extract-metrics rescan
#   --no-classify  skip LLM-based classifier (useful when LLM work in-flight)
#   --publish      also run publisher dry-run
#   --quiet        suppress per-step output

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Parse an .env file SAFELY — dotenv-shape (KEY=VALUE per line) only, no shell
# evaluation. Necessary because our .env files contain passwords with shell
# metacharacters (`$`, `'`, `*`, etc.) and anonymous password lists at the
# bottom that are NOT valid shell syntax.
#
# Only the exact keys we care about are exported. Everything else ignored.
load_dotenv_safely() {
  local env_file="$1"
  [ -f "$env_file" ] || return 0
  local key value
  for key in PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PG_HOST PG_PORT PG_USER PG_DB PG_PASSWORD RH_POSTGRES_URL; do
    # Already set by real environment? Don't override.
    if [ -n "${!key:-}" ]; then continue; fi
    # Match `KEY=VALUE` at the very start of a line, no whitespace before `=`.
    # The password MAY be quoted with single or double quotes; strip one layer.
    value=$(grep -E "^${key}=" "$env_file" 2>/dev/null | head -1 | sed -E "s/^${key}=//; s/^'//; s/'$//; s/^\"//; s/\"$//")
    if [ -n "$value" ]; then
      export "$key=$value"
    fi
  done
}

load_dotenv_safely "${REPO_ROOT}/.env"
load_dotenv_safely "/media/foxy/ai/GSD/dev-tools/artemis-ii/.env"

# Normalize PG_* (artemis naming) to PG* (standard libpq naming).
: "${PGHOST:=${PG_HOST:-}}"
: "${PGPORT:=${PG_PORT:-}}"
: "${PGUSER:=${PG_USER:-}}"
: "${PGDATABASE:=${PG_DB:-}}"
: "${PGPASSWORD:=${PG_PASSWORD:-}}"
export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD

# Compose RH_POSTGRES_URL from PG* if not already set.
if [ -z "${RH_POSTGRES_URL:-}" ] && [ -n "${PGHOST:-}" ] && [ -n "${PGUSER:-}" ] && [ -n "${PGPASSWORD:-}" ] && [ -n "${PGDATABASE:-}" ]; then
  ENCODED_PW=$(node -e 'process.stdout.write(encodeURIComponent(process.env.PGPASSWORD))')
  PORT="${PGPORT:-5432}"
  export RH_POSTGRES_URL="postgresql://${PGUSER}:${ENCODED_PW}@${PGHOST}:${PORT}/${PGDATABASE}"
fi

if [ -z "${RH_POSTGRES_URL:-}" ]; then
  echo "release-history-refresh: RH_POSTGRES_URL not resolvable (no .env creds found)" >&2
  echo "  tried: \$RH_POSTGRES_URL, ${REPO_ROOT}/.env, ${FALLBACK_ENV}" >&2
  exit 1
fi

echo "release-history-refresh: running pipeline (this takes ~2 min)..."

node tools/release-history/refresh.mjs "$@"
RET=$?

# Always publish the chapter files (chapter.mjs writes to .planning/roadmap/
# which is a staging area; publish.mjs copies the allowlisted chapters to
# docs/release-notes/<v>/chapter/ — the tracked tree regen-history-md reads
# when deciding whether to render retro/lessons as `[✓]` vs `✓ _(no file)_`).
# Without this step, flat-layout releases stay at "no file".
if [ $RET -eq 0 ] || [ $RET -eq 1 ]; then
  echo "release-history-refresh: publishing chapter files to docs/release-notes/..."
  # publish.mjs exits non-zero when any leak-scan violations BLOCK files, but
  # that's a per-file filter not an overall failure. We want chapter files
  # that DID publish to land. Exit 1 = "some BLOCKED but others published".
  # Only treat exit 2+ as real failure.
  node tools/release-history/publish.mjs --execute > /tmp/publish-output.log 2>&1
  PUB_RET=$?
  if [ $PUB_RET -gt 1 ]; then
    echo "  WARN: publish step failed (exit $PUB_RET) — retro/lessons links may still show '_(no file)_'"
    tail -5 /tmp/publish-output.log >&2
  elif [ $PUB_RET -eq 1 ]; then
    BLOCKED=$(grep -o '[0-9]\+ BLOCKED' /tmp/publish-output.log | head -1 || echo "0 BLOCKED")
    echo "  note: publish completed with $BLOCKED (non-blocking)"
  fi
  # Regenerate the index AGAIN so the newly-published chapter files turn into
  # checkmarks and lesson counts rather than "no file" notes.
  node tools/release-history/regen-history-md.mjs > /dev/null 2>&1 || true
fi

# Exit code interpretation:
#   0 = full success
#   1 = drift-check warned (quality-drift-watcher; advisory, not a blocker)
#   2+ = genuine failure
# We treat 1 as success for the release pipeline because drift warnings shouldn't
# block a release that otherwise shipped cleanly.
if [ $RET -eq 0 ] || [ $RET -eq 1 ]; then
  if [ $RET -eq 1 ]; then
    echo "release-history-refresh: completed with drift warnings (non-blocking)"
  else
    echo "release-history-refresh: completed cleanly"
  fi
  exit 0
fi

echo "release-history-refresh: pipeline failed (exit $RET)" >&2
exit $RET
