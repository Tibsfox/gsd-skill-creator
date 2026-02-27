#!/usr/bin/env bash
# =============================================================================
# test-caption-generation.sh -- Verify generate-captions.sh with fixture (SC7)
# =============================================================================
#
# 3 tests:
#   1. Generates 3 captions from test repo (one per tag: v0.1, v0.5, v1.0)
#   2. Format is valid (each line matches timestamp|caption_text)
#   3. Captions sorted chronologically (timestamps ascending)
#
# Assumes create-test-repo.sh has been run to create /tmp/gource-test-repo
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

echo "=== test-caption-generation.sh ==="

TEST_REPO="/tmp/gource-test-repo"
CAPTION_FILE="/tmp/test-captions.txt"

# Ensure fixture exists
if [[ ! -d "$TEST_REPO/.git" ]]; then
    bash "$SCRIPT_DIR/fixtures/create-test-repo.sh" "$TEST_REPO"
fi

# Clean output
rm -f "$CAPTION_FILE"

# Generate captions
bash "$PACK_DIR/scripts/generate-captions.sh" "$TEST_REPO" "$CAPTION_FILE" 2>/dev/null

# Test 1: Generates 3 captions (one per tag)
line_count=0
if [[ -f "$CAPTION_FILE" ]]; then
    line_count=$(wc -l < "$CAPTION_FILE" | tr -d '[:space:]')
fi
if [[ "$line_count" -eq 3 ]]; then
    pass "generated 3 captions from 3 tags"
else
    fail "generated $line_count captions (expected 3)"
fi

# Test 2: Format validation (timestamp|caption_text)
if [[ -f "$CAPTION_FILE" ]] && [[ "$line_count" -gt 0 ]]; then
    bad_lines=$(grep -cvE '^[0-9]+\|.+$' "$CAPTION_FILE" 2>/dev/null || true)
    if [[ -z "$bad_lines" ]] || [[ "$bad_lines" -eq 0 ]]; then
        pass "all lines match timestamp|caption format"
    else
        fail "$bad_lines lines do not match expected format"
    fi
else
    fail "caption file empty or missing, cannot validate format"
fi

# Test 3: Timestamps are ascending (chronological order)
if [[ -f "$CAPTION_FILE" ]] && [[ "$line_count" -gt 0 ]]; then
    sorted_ok=$(awk -F'|' '
        BEGIN { prev = 0; ok = 1 }
        {
            ts = $1 + 0
            if (ts < prev) { ok = 0; exit }
            prev = ts
        }
        END { print ok }
    ' "$CAPTION_FILE")
    if [[ "$sorted_ok" -eq 1 ]]; then
        pass "captions are in chronological order"
    else
        fail "captions are NOT in chronological order"
    fi
else
    fail "caption file empty or missing, cannot check order"
fi

# Cleanup
rm -f "$CAPTION_FILE"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
