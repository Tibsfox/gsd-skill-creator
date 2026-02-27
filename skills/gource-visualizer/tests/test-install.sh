#!/usr/bin/env bash
# =============================================================================
# test-install.sh -- Verify gource + ffmpeg installation (SC1, SC2, SC11)
# =============================================================================
#
# 5 tests:
#   1. Gource binary exists
#   2. Gource version >= 0.51
#   3. Install script is idempotent (run twice, both exit 0)
#   4. ffmpeg binary exists
#   5. ffmpeg has libx264 codec
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

echo "=== test-install.sh ==="

# Test 1: Gource binary exists
if command -v gource >/dev/null 2>&1; then
    pass "gource binary exists"
else
    fail "gource binary not found"
fi

# Test 2: Gource version >= 0.51
gource_version=""
version_line=$(gource --help 2>&1 | head -1 || true)
gource_version=$(echo "$version_line" | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)

if [[ -n "$gource_version" ]]; then
    major=$(echo "$gource_version" | cut -d. -f1)
    minor=$(echo "$gource_version" | cut -d. -f2)
    if [[ "$major" -gt 0 ]] || { [[ "$major" -eq 0 ]] && [[ "$minor" -ge 51 ]]; }; then
        pass "gource version $gource_version >= 0.51"
    else
        fail "gource version $gource_version < 0.51"
    fi
else
    fail "could not determine gource version"
fi

# Test 3: Install script is idempotent (SC11)
install_script="$PACK_DIR/scripts/install-gource.sh"
if [[ -x "$install_script" ]]; then
    run1_exit=0
    bash "$install_script" >/dev/null 2>&1 || run1_exit=$?
    run2_exit=0
    bash "$install_script" >/dev/null 2>&1 || run2_exit=$?
    if [[ "$run1_exit" -eq 0 ]] && [[ "$run2_exit" -eq 0 ]]; then
        pass "install script idempotent (both runs exit 0)"
    else
        fail "install script not idempotent (run1=$run1_exit, run2=$run2_exit)"
    fi
else
    fail "install script not found at $install_script"
fi

# Test 4: ffmpeg binary exists
if command -v ffmpeg >/dev/null 2>&1; then
    pass "ffmpeg binary exists"
else
    fail "ffmpeg binary not found"
fi

# Test 5: ffmpeg has libx264 codec
if ffmpeg -codecs 2>&1 | grep -q libx264; then
    pass "ffmpeg has libx264 codec"
else
    fail "ffmpeg missing libx264 codec"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
