#!/usr/bin/env bash
# =============================================================================
# run-all.sh -- Test runner for the Gource Visualization Pack
# =============================================================================
#
# Creates test fixtures, runs all 8 test scripts in dependency-safe order,
# reports per-script pass/fail, cleans up temp files.
#
# Exit 0 only if ALL scripts pass.
#
# Usage: run-all.sh
#
# Phase 402-01 -- Test Suite
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PASS=0
FAIL=0
SKIP=0

echo "============================================="
echo "  Gource Visualization Pack - Test Suite"
echo "============================================="
echo ""

# ---------------------------------------------------------------------------
# Create fixtures
# ---------------------------------------------------------------------------

echo "--- Setting up test fixtures ---"
bash "$SCRIPT_DIR/fixtures/create-test-repo.sh" /tmp/gource-test-repo
bash "$SCRIPT_DIR/fixtures/create-multi-repo.sh" /tmp/gource-multi-test
echo ""

# ---------------------------------------------------------------------------
# Run all test scripts (dependency-safe order)
# ---------------------------------------------------------------------------

SCRIPTS=(
    test-install.sh
    test-log-generation.sh
    test-multi-repo-merge.sh
    test-preset-configs.sh
    test-caption-generation.sh
    test-avatar-resolution.sh
    test-render-pipeline.sh
    test-headless-render.sh
)

for script in "${SCRIPTS[@]}"; do
    echo "=== Running $script ==="
    if bash "$SCRIPT_DIR/$script"; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
    fi
    echo ""
done

# ---------------------------------------------------------------------------
# Cleanup temp files
# ---------------------------------------------------------------------------

rm -rf /tmp/gource-test-repo /tmp/gource-multi-test
rm -f /tmp/test-*.mp4 /tmp/test-*.webm /tmp/test-*.log
rm -f /tmp/test-captions.txt
rm -rf /tmp/test-avatars
rm -f /tmp/thumbnail.png /tmp/render-summary.md

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

echo "============================================="
echo "  Results: $PASS script(s) passed, $FAIL failed, $SKIP skipped"
echo "============================================="
[ "$FAIL" -eq 0 ]
