#!/usr/bin/env bash
# =============================================================================
# test-headless-render.sh -- Verify headless rendering via Xvfb (SC8)
# =============================================================================
#
# 2 tests:
#   1. Renders with DISPLAY unset (headless mode via render-video.sh --headless)
#   2. Output matches windowed render duration (within 2 seconds)
#
# Assumes create-test-repo.sh has been run to create /tmp/gource-test-repo
# Requires: gource, ffmpeg, ffprobe, xvfb-run or Xvfb
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

echo "=== test-headless-render.sh ==="

TEST_REPO="/tmp/gource-test-repo"
HEADLESS_MP4="/tmp/test-headless.mp4"
WINDOWED_MP4="/tmp/test-windowed-ref.mp4"

# Ensure fixture exists
if [[ ! -d "$TEST_REPO/.git" ]]; then
    bash "$SCRIPT_DIR/fixtures/create-test-repo.sh" "$TEST_REPO"
fi

# Check dependencies
if ! command -v gource >/dev/null 2>&1; then
    echo "  SKIP: gource not installed"
    echo ""
    echo "Results: $PASS passed, $FAIL failed"
    exit 0
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "  SKIP: ffmpeg not installed"
    echo ""
    echo "Results: $PASS passed, $FAIL failed"
    exit 0
fi
if ! command -v xvfb-run >/dev/null 2>&1 && ! command -v Xvfb >/dev/null 2>&1; then
    echo "  SKIP: xvfb not installed (needed for headless rendering)"
    echo ""
    echo "Results: $PASS passed, $FAIL failed"
    exit 0
fi

# Clean output
rm -f "$HEADLESS_MP4" "$WINDOWED_MP4"

# ---------------------------------------------------------------------------
# Test 1: Renders with DISPLAY unset (headless mode)
# ---------------------------------------------------------------------------

render_exit=0
env -u DISPLAY bash "$PACK_DIR/scripts/render-video.sh" \
    --repo "$TEST_REPO" \
    --preset quick \
    --headless \
    --output "$HEADLESS_MP4" 2>/dev/null || render_exit=$?

if [[ "$render_exit" -eq 0 ]] && [[ -f "$HEADLESS_MP4" ]]; then
    codec_type=$(ffprobe -v error -show_entries stream=codec_type \
        -of default=noprint_wrappers=1:nokey=1 "$HEADLESS_MP4" 2>/dev/null | head -1 || true)
    if [[ "$codec_type" == "video" ]]; then
        pass "headless render produces valid MP4 with video stream"
    else
        fail "headless render MP4 has no video stream"
    fi
else
    fail "headless render failed (exit=$render_exit)"
fi

# ---------------------------------------------------------------------------
# Test 2: Output duration matches windowed render (within 2 seconds)
# ---------------------------------------------------------------------------

# Render a windowed reference (or use headless if no display)
ref_exit=0
# shellcheck disable=SC2034
bash "$PACK_DIR/scripts/render-video.sh" \
    --repo "$TEST_REPO" \
    --preset quick \
    --output "$WINDOWED_MP4" 2>/dev/null || ref_exit=$?

if [[ -f "$HEADLESS_MP4" ]] && [[ -f "$WINDOWED_MP4" ]]; then
    headless_dur=$(ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$HEADLESS_MP4" 2>/dev/null || echo "0")
    windowed_dur=$(ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$WINDOWED_MP4" 2>/dev/null || echo "0")

    h_int=${headless_dur%%.*}
    w_int=${windowed_dur%%.*}
    h_int=${h_int:-0}
    w_int=${w_int:-0}

    diff=$((h_int - w_int))
    if [[ "$diff" -lt 0 ]]; then
        diff=$((-diff))
    fi

    if [[ "$diff" -le 2 ]]; then
        pass "headless duration (${h_int}s) matches windowed (${w_int}s) within 2s"
    else
        fail "headless duration (${h_int}s) differs from windowed (${w_int}s) by ${diff}s"
    fi
else
    if [[ ! -f "$HEADLESS_MP4" ]]; then
        fail "headless MP4 not available for duration comparison"
    elif [[ ! -f "$WINDOWED_MP4" ]]; then
        fail "windowed reference MP4 not available for comparison"
    fi
fi

# Cleanup
rm -f "$HEADLESS_MP4" "$WINDOWED_MP4"
rm -f /tmp/thumbnail.png /tmp/render-summary.md

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
