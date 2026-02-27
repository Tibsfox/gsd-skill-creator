#!/usr/bin/env bash
# =============================================================================
# test-multi-repo-merge.sh -- Verify merge-repos.sh with fixture repos (SC5)
# =============================================================================
#
# 4 tests:
#   1. Merge produces combined log with >= 23 lines (10+8+5)
#   2. Namespaces correct (/repo-alpha/, /repo-beta/, /repo-gamma/)
#   3. Chronological order (timestamps ascending globally)
#   4. Color codes present with --color (6-char hex suffix)
#
# Assumes create-multi-repo.sh has been run to create /tmp/gource-multi-test
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

echo "=== test-multi-repo-merge.sh ==="

MULTI_BASE="/tmp/gource-multi-test"
MERGED_LOG="/tmp/test-merged.log"
MERGED_COLOR_LOG="/tmp/test-merged-color.log"

# Ensure fixture exists
if [[ ! -d "$MULTI_BASE/repo-alpha/.git" ]]; then
    bash "$SCRIPT_DIR/fixtures/create-multi-repo.sh" "$MULTI_BASE"
fi

# Clean output
rm -f "$MERGED_LOG" "$MERGED_COLOR_LOG"

# Merge without color
bash "$PACK_DIR/scripts/merge-repos.sh" \
    --output "$MERGED_LOG" \
    "$MULTI_BASE/repo-alpha" \
    "$MULTI_BASE/repo-beta" \
    "$MULTI_BASE/repo-gamma" 2>/dev/null

# Test 1: Combined log has >= 23 lines (10+8+5 commits, may have more file entries)
line_count=$(wc -l < "$MERGED_LOG" | tr -d '[:space:]')
if [[ "$line_count" -ge 23 ]]; then
    pass "merged log has $line_count lines (>= 23 expected)"
else
    fail "merged log has $line_count lines (expected >= 23)"
fi

# Test 2: All 3 namespace prefixes present
has_alpha=$(grep -c '/repo-alpha/' "$MERGED_LOG" || true)
has_beta=$(grep -c '/repo-beta/' "$MERGED_LOG" || true)
has_gamma=$(grep -c '/repo-gamma/' "$MERGED_LOG" || true)
if [[ "$has_alpha" -gt 0 ]] && [[ "$has_beta" -gt 0 ]] && [[ "$has_gamma" -gt 0 ]]; then
    pass "all 3 namespaces present (alpha=$has_alpha, beta=$has_beta, gamma=$has_gamma)"
else
    fail "missing namespaces (alpha=$has_alpha, beta=$has_beta, gamma=$has_gamma)"
fi

# Test 3: Chronological order
sorted_ok=$(awk -F'|' '
    BEGIN { prev = 0; ok = 1 }
    {
        ts = $1 + 0
        if (ts < prev) { ok = 0; exit }
        prev = ts
    }
    END { print ok }
' "$MERGED_LOG")
if [[ "$sorted_ok" -eq 1 ]]; then
    pass "timestamps are in chronological order"
else
    fail "timestamps are NOT in chronological order"
fi

# Test 4: Color codes with --color flag
bash "$PACK_DIR/scripts/merge-repos.sh" \
    --color \
    --output "$MERGED_COLOR_LOG" \
    "$MULTI_BASE/repo-alpha" \
    "$MULTI_BASE/repo-beta" \
    "$MULTI_BASE/repo-gamma" 2>/dev/null

color_lines=$(grep -cE '\|[0-9A-Fa-f]{6}$' "$MERGED_COLOR_LOG" || true)
total_color_lines=$(wc -l < "$MERGED_COLOR_LOG" | tr -d '[:space:]')
if [[ "$color_lines" -gt 0 ]] && [[ "$color_lines" -eq "$total_color_lines" ]]; then
    pass "all $color_lines lines have 6-char hex color codes"
else
    fail "color lines: $color_lines of $total_color_lines have hex suffix"
fi

# Cleanup
rm -f "$MERGED_LOG" "$MERGED_COLOR_LOG"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
