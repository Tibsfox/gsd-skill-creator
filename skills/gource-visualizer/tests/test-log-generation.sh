#!/usr/bin/env bash
# =============================================================================
# test-log-generation.sh -- Verify generate-log.sh with fixture repo (SC6)
# =============================================================================
#
# 4 tests:
#   1. Generates log with 25 lines (one per commit)
#   2. Format validation (pipe-delimited Gource custom log)
#   3. Timestamps are ascending
#   4. All 3 contributors present (Alice, Bob, Charlie)
#
# Assumes create-test-repo.sh has already been run to create /tmp/gource-test-repo
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

echo "=== test-log-generation.sh ==="

TEST_REPO="/tmp/gource-test-repo"
LOG_FILE="/tmp/test-gource.log"

# Ensure fixture exists
if [[ ! -d "$TEST_REPO/.git" ]]; then
    bash "$SCRIPT_DIR/fixtures/create-test-repo.sh" "$TEST_REPO"
fi

# Clean output
rm -f "$LOG_FILE"

# Generate log
bash "$PACK_DIR/scripts/generate-log.sh" "$TEST_REPO" "$LOG_FILE" 2>/dev/null

# Test 1: Log has >= 25 lines (one per file change, may exceed commit count)
line_count=$(wc -l < "$LOG_FILE" | tr -d '[:space:]')
if [[ "$line_count" -ge 25 ]]; then
    pass "log has $line_count lines (>= 25 expected)"
else
    fail "log has $line_count lines (expected >= 25)"
fi

# Test 2: Every line matches pipe-delimited Gource custom log format
# Format: <unix-timestamp>|<username>|<A|M|D>|/<path>[|<color>]
bad_lines=$(grep -cvE '^[0-9]+\|[^|]+\|[AMD]\|/[^|]*(\|[0-9A-Fa-f]{6})?$' "$LOG_FILE" 2>/dev/null || true)
if [[ -z "$bad_lines" ]] || [[ "$bad_lines" -eq 0 ]]; then
    pass "all lines match Gource custom log format"
else
    fail "$bad_lines lines do not match Gource custom log format"
fi

# Test 3: Timestamps are ascending (each >= previous)
sorted_ok=$(awk -F'|' '
    BEGIN { prev = 0; ok = 1 }
    {
        ts = $1 + 0
        if (ts < prev) { ok = 0; exit }
        prev = ts
    }
    END { print ok }
' "$LOG_FILE")
if [[ "$sorted_ok" -eq 1 ]]; then
    pass "timestamps are in ascending order"
else
    fail "timestamps are NOT in ascending order"
fi

# Test 4: All 3 contributors present
has_alice=$(grep -c "Alice" "$LOG_FILE" || true)
has_bob=$(grep -c "Bob" "$LOG_FILE" || true)
has_charlie=$(grep -c "Charlie" "$LOG_FILE" || true)
if [[ "$has_alice" -gt 0 ]] && [[ "$has_bob" -gt 0 ]] && [[ "$has_charlie" -gt 0 ]]; then
    pass "all 3 contributors present (Alice=$has_alice, Bob=$has_bob, Charlie=$has_charlie)"
else
    fail "missing contributors (Alice=$has_alice, Bob=$has_bob, Charlie=$has_charlie)"
fi

# Cleanup
rm -f "$LOG_FILE"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
