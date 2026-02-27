#!/usr/bin/env bash
# =============================================================================
# test-preset-configs.sh -- Verify preset config files (SC1, SC11)
# =============================================================================
#
# 4 tests:
#   1. All 4 preset files exist
#   2. Quick preset has 720p viewport (1280x720)
#   3. Standard preset has 1080p and 60fps
#   4. All presets have stop-at-end (except thumbnail which uses stop-at-time)
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

echo "=== test-preset-configs.sh ==="

CONFIGS_DIR="$PACK_DIR/configs"

# Test 1: All 4 preset files exist
all_exist=true
for preset in quick standard cinematic thumbnail; do
    conf="$CONFIGS_DIR/preset-${preset}.conf"
    if [[ ! -f "$conf" ]]; then
        all_exist=false
        echo "    missing: $conf"
    fi
done
if [[ "$all_exist" == "true" ]]; then
    pass "all 4 preset files exist"
else
    fail "one or more preset files missing"
fi

# Test 2: Quick preset has 720p viewport
if grep -q "1280x720" "$CONFIGS_DIR/preset-quick.conf" 2>/dev/null; then
    pass "quick preset has 720p viewport (1280x720)"
else
    fail "quick preset missing 720p viewport"
fi

# Test 3: Standard preset has 1080p and 60fps
has_1080p=false
has_60fps=false
if grep -q "1920x1080" "$CONFIGS_DIR/preset-standard.conf" 2>/dev/null; then
    has_1080p=true
fi
if grep -qE "output-framerate.*60" "$CONFIGS_DIR/preset-standard.conf" 2>/dev/null; then
    has_60fps=true
fi
if [[ "$has_1080p" == "true" ]] && [[ "$has_60fps" == "true" ]]; then
    pass "standard preset has 1080p viewport and 60fps"
else
    fail "standard preset: 1080p=$has_1080p, 60fps=$has_60fps"
fi

# Test 4: All video presets have stop-at-end (thumbnail uses stop-at-time instead)
stop_count=0
for preset in quick standard cinematic; do
    conf="$CONFIGS_DIR/preset-${preset}.conf"
    if grep -q "stop-at-end" "$conf" 2>/dev/null; then
        stop_count=$((stop_count + 1))
    fi
done
# Thumbnail uses stop-at-time which is its own form of stopping
has_thumbnail_stop=false
if grep -q "stop-at-time" "$CONFIGS_DIR/preset-thumbnail.conf" 2>/dev/null; then
    has_thumbnail_stop=true
fi
if [[ "$stop_count" -eq 3 ]] && [[ "$has_thumbnail_stop" == "true" ]]; then
    pass "all presets have stop condition (3 stop-at-end + 1 stop-at-time)"
else
    fail "stop conditions: $stop_count/3 have stop-at-end, thumbnail stop-at-time=$has_thumbnail_stop"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
