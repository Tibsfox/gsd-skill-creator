#!/usr/bin/env bash
# =============================================================================
# create-multi-repo.sh -- Create 3 small repos for multi-repo merge testing
# =============================================================================
#
# Creates:
#   repo-alpha/ -- 10 commits, "Alpha Dev", 2025-01-01 to 2025-01-15
#   repo-beta/  -- 8 commits, "Beta One" + "Beta Two", 2025-01-05 to 2025-01-20
#   repo-gamma/ -- 5 commits, "Gamma Dev", 2025-01-10 to 2025-01-25
#
# Usage: create-multi-repo.sh [base-dir]
#   Default: /tmp/gource-multi-test
#
# Phase 402-01 -- Test Suite
# =============================================================================

set -euo pipefail

BASE_DIR="${1:-/tmp/gource-multi-test}"

# Clean slate
rm -rf "$BASE_DIR"
mkdir -p "$BASE_DIR"

# ---------------------------------------------------------------------------
# Helper: commit with deterministic date and author
# ---------------------------------------------------------------------------

make_commit() {
    local repo_dir="$1"
    local author_name="$2"
    local author_email="$3"
    local date_str="$4"
    local msg="$5"

    export GIT_AUTHOR_NAME="$author_name"
    export GIT_AUTHOR_EMAIL="$author_email"
    export GIT_COMMITTER_NAME="$author_name"
    export GIT_COMMITTER_EMAIL="$author_email"
    export GIT_AUTHOR_DATE="$date_str"
    export GIT_COMMITTER_DATE="$date_str"

    git -C "$repo_dir" add -A >/dev/null 2>&1
    git -C "$repo_dir" commit -m "$msg" --allow-empty >/dev/null 2>&1
}

# ---------------------------------------------------------------------------
# repo-alpha: 10 commits, Alpha Dev, src/ and docs/
# ---------------------------------------------------------------------------

ALPHA="$BASE_DIR/repo-alpha"
mkdir -p "$ALPHA/src" "$ALPHA/docs"
git -C "$ALPHA" init -b main >/dev/null 2>&1
git -C "$ALPHA" config user.name "Alpha Dev"
git -C "$ALPHA" config user.email "alpha@test.com"

echo "# Alpha project" > "$ALPHA/src/app.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-01T09:00:00" "feat: init alpha app"

echo "helper() { true; }" >> "$ALPHA/src/app.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-02T10:00:00" "feat: add helper"

echo "# Alpha docs" > "$ALPHA/docs/readme.md"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-03T11:00:00" "docs: add readme"

echo "run() { helper; }" >> "$ALPHA/src/app.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-04T12:00:00" "feat: wire run function"

echo "## Usage" >> "$ALPHA/docs/readme.md"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-06T09:00:00" "docs: add usage section"

echo "validate() { return 0; }" > "$ALPHA/src/validate.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-07T10:00:00" "feat: add validator"

echo "log() { echo info; }" >> "$ALPHA/src/app.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-09T11:00:00" "feat: add logging"

echo "## API" >> "$ALPHA/docs/readme.md"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-11T12:00:00" "docs: add API section"

echo "cleanup() { rm -f /tmp/alpha; }" >> "$ALPHA/src/app.sh"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-13T09:00:00" "feat: add cleanup"

echo "# v1.0" >> "$ALPHA/docs/readme.md"
make_commit "$ALPHA" "Alpha Dev" "alpha@test.com" "2025-01-15T10:00:00" "docs: mark v1.0"

# ---------------------------------------------------------------------------
# repo-beta: 8 commits, Beta One + Beta Two, lib/ and config/
# ---------------------------------------------------------------------------

BETA="$BASE_DIR/repo-beta"
mkdir -p "$BETA/lib" "$BETA/config"
git -C "$BETA" init -b main >/dev/null 2>&1
git -C "$BETA" config user.name "Beta One"
git -C "$BETA" config user.email "beta1@test.com"

echo "# Beta lib" > "$BETA/lib/core.sh"
make_commit "$BETA" "Beta One" "beta1@test.com" "2025-01-05T09:00:00" "feat: init beta core"

echo "parse() { echo ok; }" >> "$BETA/lib/core.sh"
make_commit "$BETA" "Beta One" "beta1@test.com" "2025-01-07T10:00:00" "feat: add parser"

echo "DB_HOST=localhost" > "$BETA/config/db.conf"
make_commit "$BETA" "Beta Two" "beta2@test.com" "2025-01-09T11:00:00" "feat: add db config"

echo "connect() { return 0; }" > "$BETA/lib/db.sh"
make_commit "$BETA" "Beta Two" "beta2@test.com" "2025-01-11T12:00:00" "feat: add db module"

echo "API_KEY=test" > "$BETA/config/api.conf"
make_commit "$BETA" "Beta One" "beta1@test.com" "2025-01-13T09:00:00" "feat: add api config"

echo "query() { connect; }" >> "$BETA/lib/db.sh"
make_commit "$BETA" "Beta Two" "beta2@test.com" "2025-01-15T10:00:00" "feat: add query method"

echo "cache() { true; }" >> "$BETA/lib/core.sh"
make_commit "$BETA" "Beta One" "beta1@test.com" "2025-01-18T11:00:00" "feat: add caching"

echo "CACHE_TTL=300" >> "$BETA/config/api.conf"
make_commit "$BETA" "Beta Two" "beta2@test.com" "2025-01-20T12:00:00" "feat: add cache TTL"

# ---------------------------------------------------------------------------
# repo-gamma: 5 commits, Gamma Dev, app/
# ---------------------------------------------------------------------------

GAMMA="$BASE_DIR/repo-gamma"
mkdir -p "$GAMMA/app"
git -C "$GAMMA" init -b main >/dev/null 2>&1
git -C "$GAMMA" config user.name "Gamma Dev"
git -C "$GAMMA" config user.email "gamma@test.com"

echo "# Gamma app" > "$GAMMA/app/index.sh"
make_commit "$GAMMA" "Gamma Dev" "gamma@test.com" "2025-01-10T09:00:00" "feat: init gamma app"

echo "boot() { echo starting; }" >> "$GAMMA/app/index.sh"
make_commit "$GAMMA" "Gamma Dev" "gamma@test.com" "2025-01-14T10:00:00" "feat: add boot sequence"

echo "render() { echo html; }" > "$GAMMA/app/view.sh"
make_commit "$GAMMA" "Gamma Dev" "gamma@test.com" "2025-01-18T11:00:00" "feat: add view renderer"

echo "route() { render; }" >> "$GAMMA/app/index.sh"
make_commit "$GAMMA" "Gamma Dev" "gamma@test.com" "2025-01-22T12:00:00" "feat: add routing"

echo "# Gamma v1.0" >> "$GAMMA/app/index.sh"
make_commit "$GAMMA" "Gamma Dev" "gamma@test.com" "2025-01-25T13:00:00" "feat: finalize v1.0"

# Clean up env
unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE

echo "[create-multi-repo] Created 3 test repos at $BASE_DIR"
echo "[create-multi-repo] repo-alpha: 10 commits, repo-beta: 8 commits, repo-gamma: 5 commits"

exit 0
