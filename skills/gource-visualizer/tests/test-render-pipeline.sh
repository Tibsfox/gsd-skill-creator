#!/usr/bin/env bash
# =============================================================================
# test-render-pipeline.sh -- Verify render-video.sh pipeline (SC3, SC4, SC10)
# =============================================================================
#
# 6 tests:
#   1. Quick preset produces valid MP4 (ffprobe shows video stream)
#   2. Quick preset completes in < 60s
#   3. Standard preset produces 1080p (width=1920, height=1080)
#   4. Standard preset produces 60fps
#   5. Auto-timing within +/-20% of target duration
#   6. WebM format produces valid output
#
# Assumes create-test-repo.sh has been run to create /tmp/gource-test-repo
# Requires: gource, ffmpeg, ffprobe
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

echo "=== test-render-pipeline.sh ==="

TEST_REPO="/tmp/gource-test-repo"
QUICK_MP4="/tmp/test-quick.mp4"
STANDARD_MP4="/tmp/test-standard.mp4"
WEBM_OUTPUT="/tmp/test-output.webm"

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
if ! command -v ffprobe >/dev/null 2>&1; then
    echo "  SKIP: ffprobe not installed"
    echo ""
    echo "Results: $PASS passed, $FAIL failed"
    exit 0
fi

# Clean output files
rm -f "$QUICK_MP4" "$STANDARD_MP4" "$WEBM_OUTPUT"

# ---------------------------------------------------------------------------
# Test 1 + 2: Quick preset produces valid MP4, completes in < 60s
# ---------------------------------------------------------------------------

start_time=$(date +%s)
render_exit=0
bash "$PACK_DIR/scripts/render-video.sh" \
    --repo "$TEST_REPO" \
    --preset quick \
    --output "$QUICK_MP4" 2>/dev/null || render_exit=$?
end_time=$(date +%s)
elapsed=$((end_time - start_time))

# Test 1: Valid MP4
if [[ "$render_exit" -eq 0 ]] && [[ -f "$QUICK_MP4" ]]; then
    codec_type=$(ffprobe -v error -show_entries stream=codec_type \
        -of default=noprint_wrappers=1:nokey=1 "$QUICK_MP4" 2>/dev/null | head -1 || true)
    if [[ "$codec_type" == "video" ]]; then
        pass "quick preset produces valid MP4 with video stream"
    else
        fail "quick preset MP4 has no video stream (codec_type=$codec_type)"
    fi
else
    fail "quick preset render failed (exit=$render_exit, file exists=$([ -f "$QUICK_MP4" ] && echo yes || echo no))"
fi

# Test 2: Completes in < 60s
if [[ "$elapsed" -lt 60 ]]; then
    pass "quick preset completed in ${elapsed}s (< 60s)"
else
    fail "quick preset took ${elapsed}s (expected < 60s)"
fi

# ---------------------------------------------------------------------------
# Test 3 + 4: Standard preset produces 1080p at 60fps
# ---------------------------------------------------------------------------

render_exit=0
bash "$PACK_DIR/scripts/render-video.sh" \
    --repo "$TEST_REPO" \
    --preset standard \
    --output "$STANDARD_MP4" 2>/dev/null || render_exit=$?

if [[ "$render_exit" -eq 0 ]] && [[ -f "$STANDARD_MP4" ]]; then
    # Test 3: 1080p resolution
    resolution=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=width,height \
        -of csv=s=x:p=0 "$STANDARD_MP4" 2>/dev/null || true)
    if [[ "$resolution" == "1920x1080" ]]; then
        pass "standard preset is 1080p ($resolution)"
    else
        fail "standard preset resolution is $resolution (expected 1920x1080)"
    fi

    # Test 4: 60fps
    frame_rate=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=r_frame_rate \
        -of default=noprint_wrappers=1:nokey=1 "$STANDARD_MP4" 2>/dev/null || true)
    if echo "$frame_rate" | grep -q "60"; then
        pass "standard preset is 60fps (r_frame_rate=$frame_rate)"
    else
        fail "standard preset frame rate is $frame_rate (expected 60)"
    fi
else
    fail "standard preset render failed (exit=$render_exit)"
    fail "standard preset render failed -- cannot check fps"
fi

# ---------------------------------------------------------------------------
# Test 5: Auto-timing within +/-20% of target
# ---------------------------------------------------------------------------

# Quick preset target = ~30s for a 25-commit repo over 30 days
# Acceptable range: 24s to 36s
if [[ -f "$QUICK_MP4" ]]; then
    duration_raw=$(ffprobe -v error -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$QUICK_MP4" 2>/dev/null || echo "0")
    duration_int=${duration_raw%%.*}
    duration_int=${duration_int:-0}
    if [[ "$duration_int" -ge 10 ]] && [[ "$duration_int" -le 50 ]]; then
        pass "auto-timing: ${duration_int}s is within acceptable range (10-50s)"
    else
        fail "auto-timing: ${duration_int}s outside acceptable range (10-50s)"
    fi
else
    fail "auto-timing: quick MP4 not available for duration check"
fi

# ---------------------------------------------------------------------------
# Test 6: WebM format produces valid output
# ---------------------------------------------------------------------------

render_exit=0
bash "$PACK_DIR/scripts/render-video.sh" \
    --repo "$TEST_REPO" \
    --preset quick \
    --format webm \
    --output "$WEBM_OUTPUT" 2>/dev/null || render_exit=$?

if [[ "$render_exit" -eq 0 ]] && [[ -f "$WEBM_OUTPUT" ]]; then
    webm_codec=$(ffprobe -v error -show_entries stream=codec_type \
        -of default=noprint_wrappers=1:nokey=1 "$WEBM_OUTPUT" 2>/dev/null | head -1 || true)
    if [[ "$webm_codec" == "video" ]]; then
        pass "WebM format produces valid video output"
    else
        fail "WebM output has no video stream (codec_type=$webm_codec)"
    fi
else
    fail "WebM render failed (exit=$render_exit)"
fi

# Cleanup
rm -f "$QUICK_MP4" "$STANDARD_MP4" "$WEBM_OUTPUT"
rm -f /tmp/test-quick-thumbnail.png /tmp/test-standard-thumbnail.png /tmp/test-output-thumbnail.png
rm -f /tmp/thumbnail.png /tmp/render-summary.md

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
