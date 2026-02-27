#!/usr/bin/env bash
# shellcheck disable=SC2129
# =============================================================================
# create-test-repo.sh -- Create a deterministic git repository for testing
# =============================================================================
#
# Creates a repo with:
#   - 25 commits across 30 days (2025-01-01 to 2025-01-30)
#   - 3 contributors: Alice (10), Bob (10), Charlie (5)
#   - 3 directories: src/, docs/, tests/
#   - 8 files spread across directories
#   - 3 annotated tags: v0.1 (commit ~5), v0.5 (commit ~15), v1.0 (HEAD)
#
# Usage: create-test-repo.sh [repo-dir]
#   Default: /tmp/gource-test-repo
#
# Phase 402-01 -- Test Suite
# =============================================================================

set -euo pipefail

REPO_DIR="${1:-/tmp/gource-test-repo}"

# Clean slate
rm -rf "$REPO_DIR"
mkdir -p "$REPO_DIR"

git -C "$REPO_DIR" init -b main >/dev/null 2>&1
git -C "$REPO_DIR" config user.name "Alice"
git -C "$REPO_DIR" config user.email "alice@test.com"

# ---------------------------------------------------------------------------
# Helper: commit with deterministic date and author
# ---------------------------------------------------------------------------

make_commit() {
    local author_name="$1"
    local author_email="$2"
    local date_str="$3"
    local msg="$4"

    export GIT_AUTHOR_NAME="$author_name"
    export GIT_AUTHOR_EMAIL="$author_email"
    export GIT_COMMITTER_NAME="$author_name"
    export GIT_COMMITTER_EMAIL="$author_email"
    export GIT_AUTHOR_DATE="$date_str"
    export GIT_COMMITTER_DATE="$date_str"

    git -C "$REPO_DIR" add -A >/dev/null 2>&1
    git -C "$REPO_DIR" commit -m "$msg" --allow-empty >/dev/null 2>&1
}

# ---------------------------------------------------------------------------
# Create directory structure
# ---------------------------------------------------------------------------

mkdir -p "$REPO_DIR/src" "$REPO_DIR/docs" "$REPO_DIR/tests"

# ---------------------------------------------------------------------------
# 25 commits with realistic file modifications
# ---------------------------------------------------------------------------

# Commit 1 -- Alice
echo "#!/usr/bin/env bash" > "$REPO_DIR/src/main.sh"
echo "echo hello" >> "$REPO_DIR/src/main.sh"
make_commit "Alice" "alice@test.com" "2025-01-01T10:00:00" "feat: initial main script"

# Commit 2 -- Alice
echo "# Utility functions" > "$REPO_DIR/src/utils.sh"
make_commit "Alice" "alice@test.com" "2025-01-02T11:00:00" "feat: add utility module"

# Commit 3 -- Bob
echo "# Configuration" > "$REPO_DIR/src/config.sh"
echo "VERSION=0.1" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-03T09:00:00" "feat: add configuration"

# Commit 4 -- Alice
echo "# README" > "$REPO_DIR/docs/README.md"
echo "Project documentation" >> "$REPO_DIR/docs/README.md"
make_commit "Alice" "alice@test.com" "2025-01-04T14:00:00" "docs: add README"

# Commit 5 -- Bob
echo "# Guide" > "$REPO_DIR/docs/guide.md"
echo "Getting started guide" >> "$REPO_DIR/docs/guide.md"
make_commit "Bob" "bob@test.com" "2025-01-05T10:00:00" "docs: add user guide"

# --- Tag v0.1 at commit 5 ---

# Commit 6 -- Charlie
echo "#!/usr/bin/env bash" > "$REPO_DIR/tests/test1.sh"
echo "echo test1" >> "$REPO_DIR/tests/test1.sh"
make_commit "Charlie" "charlie@test.com" "2025-01-06T15:00:00" "test: add first test"

# Commit 7 -- Alice
echo "parse_args() { echo parsing; }" >> "$REPO_DIR/src/utils.sh"
make_commit "Alice" "alice@test.com" "2025-01-07T10:00:00" "feat: add arg parser to utils"

# Commit 8 -- Bob
echo "LOG_LEVEL=info" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-08T11:00:00" "feat: add log level config"

# Commit 9 -- Alice
echo "## Architecture" >> "$REPO_DIR/docs/README.md"
echo "Three-layer design" >> "$REPO_DIR/docs/README.md"
make_commit "Alice" "alice@test.com" "2025-01-09T13:00:00" "docs: describe architecture"

# Commit 10 -- Charlie
echo "#!/usr/bin/env bash" > "$REPO_DIR/tests/test2.sh"
echo "echo test2" >> "$REPO_DIR/tests/test2.sh"
make_commit "Charlie" "charlie@test.com" "2025-01-10T16:00:00" "test: add second test"

# Commit 11 -- Bob
echo "validate() { return 0; }" >> "$REPO_DIR/src/utils.sh"
make_commit "Bob" "bob@test.com" "2025-01-11T09:00:00" "feat: add input validation"

# Commit 12 -- Alice
echo "main() {" >> "$REPO_DIR/src/main.sh"
echo "  parse_args" >> "$REPO_DIR/src/main.sh"
echo "}" >> "$REPO_DIR/src/main.sh"
make_commit "Alice" "alice@test.com" "2025-01-12T10:00:00" "feat: wire main function"

# Commit 13 -- Bob
echo "TIMEOUT=30" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-14T11:00:00" "feat: add timeout setting"

# Commit 14 -- Alice
echo "## Installation" >> "$REPO_DIR/docs/guide.md"
echo "Run ./src/main.sh" >> "$REPO_DIR/docs/guide.md"
make_commit "Alice" "alice@test.com" "2025-01-15T14:00:00" "docs: add install instructions"

# Commit 15 -- Charlie
echo "#!/usr/bin/env bash" > "$REPO_DIR/tests/integration.sh"
echo "echo integration" >> "$REPO_DIR/tests/integration.sh"
make_commit "Charlie" "charlie@test.com" "2025-01-16T15:00:00" "test: add integration test"

# --- Tag v0.5 at commit 15 ---

# Commit 16 -- Bob
echo "export VERSION" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-17T09:00:00" "fix: export version variable"

# Commit 17 -- Alice
echo "log() { echo \"\$@\"; }" >> "$REPO_DIR/src/utils.sh"
make_commit "Alice" "alice@test.com" "2025-01-18T10:00:00" "feat: add logging function"

# Commit 18 -- Bob
echo "MAX_RETRIES=3" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-19T11:00:00" "feat: add retry config"

# Commit 19 -- Alice
echo "## Troubleshooting" >> "$REPO_DIR/docs/README.md"
make_commit "Alice" "alice@test.com" "2025-01-20T13:00:00" "docs: add troubleshooting"

# Commit 20 -- Bob
echo "cleanup() { rm -f /tmp/lock; }" >> "$REPO_DIR/src/utils.sh"
make_commit "Bob" "bob@test.com" "2025-01-22T09:00:00" "feat: add cleanup function"

# Commit 21 -- Charlie
echo "# test edge cases" >> "$REPO_DIR/tests/test1.sh"
echo "echo edge" >> "$REPO_DIR/tests/test1.sh"
make_commit "Charlie" "charlie@test.com" "2025-01-23T15:00:00" "test: add edge case coverage"

# Commit 22 -- Alice
echo "## Contributing" >> "$REPO_DIR/docs/guide.md"
make_commit "Alice" "alice@test.com" "2025-01-25T10:00:00" "docs: add contributing guide"

# Commit 23 -- Bob
echo "VERSION=1.0" > "$REPO_DIR/src/config.sh"
echo "LOG_LEVEL=info" >> "$REPO_DIR/src/config.sh"
echo "TIMEOUT=30" >> "$REPO_DIR/src/config.sh"
echo "MAX_RETRIES=3" >> "$REPO_DIR/src/config.sh"
echo "export VERSION" >> "$REPO_DIR/src/config.sh"
make_commit "Bob" "bob@test.com" "2025-01-27T11:00:00" "feat: bump to v1.0"

# Commit 24 -- Alice
echo "# v1.0 Stable Release" > "$REPO_DIR/docs/README.md"
echo "Project documentation" >> "$REPO_DIR/docs/README.md"
echo "## Architecture" >> "$REPO_DIR/docs/README.md"
echo "Three-layer design" >> "$REPO_DIR/docs/README.md"
echo "## Troubleshooting" >> "$REPO_DIR/docs/README.md"
make_commit "Alice" "alice@test.com" "2025-01-28T14:00:00" "docs: finalize README for v1.0"

# Commit 25 -- Charlie
echo "# Final integration suite" >> "$REPO_DIR/tests/integration.sh"
echo "echo all-pass" >> "$REPO_DIR/tests/integration.sh"
make_commit "Charlie" "charlie@test.com" "2025-01-30T16:00:00" "test: finalize integration suite"

# ---------------------------------------------------------------------------
# Create annotated tags
# ---------------------------------------------------------------------------

# v0.1 on commit 5
COMMIT_5=$(git -C "$REPO_DIR" log --reverse --format='%H' | sed -n '5p')
export GIT_COMMITTER_DATE="2025-01-05T10:30:00"
git -C "$REPO_DIR" tag -a v0.1 "$COMMIT_5" -m "First alpha release" 2>/dev/null

# v0.5 on commit 15
COMMIT_15=$(git -C "$REPO_DIR" log --reverse --format='%H' | sed -n '15p')
export GIT_COMMITTER_DATE="2025-01-16T15:30:00"
git -C "$REPO_DIR" tag -a v0.5 "$COMMIT_15" -m "Beta release" 2>/dev/null

# v1.0 on HEAD
export GIT_COMMITTER_DATE="2025-01-30T17:00:00"
git -C "$REPO_DIR" tag -a v1.0 HEAD -m "Stable release" 2>/dev/null

# Clean up env
unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE

echo "[create-test-repo] Created deterministic test repo at $REPO_DIR"
echo "[create-test-repo] 25 commits, 3 contributors, 3 tags, 8 files"

exit 0
