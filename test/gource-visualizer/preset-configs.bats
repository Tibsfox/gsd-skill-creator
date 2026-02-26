#!/usr/bin/env bats
# =============================================================================
# BATS tests for Gource preset configuration files and custom log format ref
# =============================================================================
#
# Tests cover: file existence, viewport/framerate settings, INI section headers,
# cross-preset consistency, thumbnail single-frame behavior, reference doc content.
#
# Phase 398-02 — Preset Configs & Custom Log Format
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
CONFIGS_DIR="${PROJECT_ROOT}/skills/gource-visualizer/configs"
REFS_DIR="${PROJECT_ROOT}/skills/gource-visualizer/references"

# ---------------------------------------------------------------------------
# Existence tests
# ---------------------------------------------------------------------------

@test "preset-quick.conf exists" {
    [ -f "$CONFIGS_DIR/preset-quick.conf" ]
}

@test "preset-standard.conf exists" {
    [ -f "$CONFIGS_DIR/preset-standard.conf" ]
}

@test "preset-cinematic.conf exists" {
    [ -f "$CONFIGS_DIR/preset-cinematic.conf" ]
}

@test "preset-thumbnail.conf exists" {
    [ -f "$CONFIGS_DIR/preset-thumbnail.conf" ]
}

@test "custom-log-format.md exists" {
    [ -f "$REFS_DIR/custom-log-format.md" ]
}

# ---------------------------------------------------------------------------
# Quick preset tests
# ---------------------------------------------------------------------------

@test "quick preset: viewport is 720p" {
    run grep -q "viewport=1280x720" "$CONFIGS_DIR/preset-quick.conf"
    [ "$status" -eq 0 ]
}

@test "quick preset: framerate is 30fps" {
    run grep -q "output-framerate=30" "$CONFIGS_DIR/preset-quick.conf"
    [ "$status" -eq 0 ]
}

@test "quick preset: hides filenames" {
    run grep -q "hide=mouse,progress,filenames" "$CONFIGS_DIR/preset-quick.conf"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Standard preset tests
# ---------------------------------------------------------------------------

@test "standard preset: viewport is 1080p" {
    run grep -q "viewport=1920x1080" "$CONFIGS_DIR/preset-standard.conf"
    [ "$status" -eq 0 ]
}

@test "standard preset: framerate is 60fps" {
    run grep -q "output-framerate=60" "$CONFIGS_DIR/preset-standard.conf"
    [ "$status" -eq 0 ]
}

@test "standard preset: key enabled" {
    run grep -q "key=true" "$CONFIGS_DIR/preset-standard.conf"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Cinematic preset tests
# ---------------------------------------------------------------------------

@test "cinematic preset: caption-size is 22" {
    run grep -q "caption-size=22" "$CONFIGS_DIR/preset-cinematic.conf"
    [ "$status" -eq 0 ]
}

@test "cinematic preset: bloom-multiplier is 1.2" {
    run grep -q "bloom-multiplier=1.2" "$CONFIGS_DIR/preset-cinematic.conf"
    [ "$status" -eq 0 ]
}

@test "cinematic preset: highlight-all-users enabled" {
    run grep -q "highlight-all-users=true" "$CONFIGS_DIR/preset-cinematic.conf"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Thumbnail preset tests
# ---------------------------------------------------------------------------

@test "thumbnail preset: start-position is 0.5" {
    run grep -q "start-position=0.5" "$CONFIGS_DIR/preset-thumbnail.conf"
    [ "$status" -eq 0 ]
}

@test "thumbnail preset: stop-at-time is 1" {
    run grep -q "stop-at-time=1" "$CONFIGS_DIR/preset-thumbnail.conf"
    [ "$status" -eq 0 ]
}

@test "thumbnail preset: does NOT contain output-framerate" {
    run grep -q "output-framerate" "$CONFIGS_DIR/preset-thumbnail.conf"
    [ "$status" -ne 0 ]
}

# ---------------------------------------------------------------------------
# Cross-preset tests
# ---------------------------------------------------------------------------

@test "all presets contain [gource] section header" {
    for preset in preset-quick.conf preset-standard.conf preset-cinematic.conf preset-thumbnail.conf; do
        run grep -q '^\[gource\]' "$CONFIGS_DIR/$preset"
        [ "$status" -eq 0 ]
    done
}

@test "quick, standard, cinematic presets contain stop-at-end" {
    for preset in preset-quick.conf preset-standard.conf preset-cinematic.conf; do
        run grep -q "stop-at-end=true" "$CONFIGS_DIR/$preset"
        [ "$status" -eq 0 ]
    done
}

@test "all presets contain hide=mouse,progress" {
    for preset in preset-quick.conf preset-standard.conf preset-cinematic.conf preset-thumbnail.conf; do
        run grep -q "hide=mouse,progress" "$CONFIGS_DIR/$preset"
        [ "$status" -eq 0 ]
    done
}

# ---------------------------------------------------------------------------
# Reference doc tests
# ---------------------------------------------------------------------------

@test "custom-log-format.md documents timestamp field" {
    run grep -q "timestamp" "$REFS_DIR/custom-log-format.md"
    [ "$status" -eq 0 ]
}

@test "custom-log-format.md shows pipe delimiter" {
    run grep -q "|" "$REFS_DIR/custom-log-format.md"
    [ "$status" -eq 0 ]
}
