#!/usr/bin/env bash
# =============================================================================
# test-avatar-resolution.sh -- Verify resolve-avatars.sh (SC9)
# =============================================================================
#
# 2 tests:
#   1. Creates avatar directory when given a valid repo
#   2. Handles no-network gracefully (exits 0 even with failing curl)
#
# Assumes create-test-repo.sh has been run to create /tmp/gource-test-repo
# Uses mock curl to avoid real network access.
#
# Phase 402-01 -- Test Suite
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== test-avatar-resolution.sh ==="

TEST_REPO="/tmp/gource-test-repo"
AVATAR_DIR="/tmp/test-avatars"

# Ensure fixture exists
if [[ ! -d "$TEST_REPO/.git" ]]; then
    bash "$SCRIPT_DIR/fixtures/create-test-repo.sh" "$TEST_REPO"
fi

# ---------------------------------------------------------------------------
# Test 1: Creates avatar directory
# ---------------------------------------------------------------------------

rm -rf "$AVATAR_DIR"

# The test repo has no GitHub remote, so the script will gracefully skip API.
# It should still create the output directory and exit 0.
resolve_exit=0
bash "$PACK_DIR/scripts/resolve-avatars.sh" "$TEST_REPO" "$AVATAR_DIR" 2>/dev/null || resolve_exit=$?

if [[ -d "$AVATAR_DIR" ]]; then
    pass "avatar directory created at $AVATAR_DIR"
else
    fail "avatar directory not created (exit=$resolve_exit)"
fi

# ---------------------------------------------------------------------------
# Test 2: Handles no-network gracefully (exits 0 with mock failing curl)
# ---------------------------------------------------------------------------

rm -rf "$AVATAR_DIR"

# Create a mock curl that always fails
MOCK_DIR=$(mktemp -d)
cat > "$MOCK_DIR/curl" << 'MOCK_SCRIPT'
#!/usr/bin/env bash
# Mock curl that simulates network failure
exit 1
MOCK_SCRIPT
chmod +x "$MOCK_DIR/curl"

# Add a GitHub remote to the test repo temporarily so the script tries API calls
git -C "$TEST_REPO" remote add origin "https://github.com/test/test-repo.git" 2>/dev/null || true

graceful_exit=0
PATH="$MOCK_DIR:$PATH" bash "$PACK_DIR/scripts/resolve-avatars.sh" \
    "$TEST_REPO" "$AVATAR_DIR" 2>/dev/null || graceful_exit=$?

# Remove the temporary remote
git -C "$TEST_REPO" remote remove origin 2>/dev/null || true

if [[ "$graceful_exit" -eq 0 ]]; then
    pass "handles network failure gracefully (exit 0)"
else
    fail "crashed on network failure (exit=$graceful_exit, expected 0)"
fi

# Cleanup
rm -rf "$AVATAR_DIR" "$MOCK_DIR"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
