#!/usr/bin/env bash
# =============================================================================
# install-gource.sh -- Idempotent installer for gource + ffmpeg + xvfb
# =============================================================================
#
# Detects platform, checks existing installations, installs missing
# components, and verifies everything works.
#
# Exit codes:
#   0 - All components installed and verified
#   1 - Platform not supported
#   2 - Package manager failure
#   3 - Gource verification failed (OpenGL issue)
#   4 - ffmpeg missing libx264 codec
#
# Environment variables:
#   OS_RELEASE_FILE - Override path to os-release (for testing)
#
# Phase 398-01 -- Foundation
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log() {
    echo "[gource-install] $*"
}

log_err() {
    echo "[gource-install] ERROR: $*" >&2
}

# ---------------------------------------------------------------------------
# Platform detection
# ---------------------------------------------------------------------------

PLATFORM=""
PLATFORM_NAME=""

detect_platform() {
    local os_release="${OS_RELEASE_FILE:-/etc/os-release}"

    # Check os-release for Ubuntu/Debian
    if [ -f "$os_release" ]; then
        local id=""
        id=$(grep -E '^ID=' "$os_release" 2>/dev/null | cut -d= -f2 | tr -d '"' || true)
        local id_like=""
        id_like=$(grep -E '^ID_LIKE=' "$os_release" 2>/dev/null | cut -d= -f2 | tr -d '"' || true)

        if [ "$id" = "ubuntu" ] || [ "$id" = "debian" ] || [[ "$id_like" == *"debian"* ]]; then
            PLATFORM="apt"
            PLATFORM_NAME=$(grep -E '^NAME=' "$os_release" 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "Debian-based")
            log "Platform: $PLATFORM_NAME"
            return 0
        fi
    fi

    # Check for macOS via uname
    if [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
        PLATFORM="brew"
        PLATFORM_NAME="macOS"
        log "Platform: macOS"
        return 0
    fi

    # Fallback: check if apt-get is available
    if command -v apt-get >/dev/null 2>&1; then
        PLATFORM="apt"
        PLATFORM_NAME="Linux (apt-based)"
        log "Platform: Linux (apt-based)"
        return 0
    fi

    # Fallback: check if brew is available
    if command -v brew >/dev/null 2>&1; then
        PLATFORM="brew"
        PLATFORM_NAME="macOS (brew)"
        log "Platform: macOS (brew)"
        return 0
    fi

    log_err "Unsupported platform -- requires apt-get (Ubuntu/Debian) or brew (macOS)"
    return 1
}

# ---------------------------------------------------------------------------
# Version comparison: returns 0 if $1 >= $2
# ---------------------------------------------------------------------------

version_gte() {
    local v1="$1"
    local v2="$2"

    # Split into major.minor
    local v1_major v1_minor v2_major v2_minor
    v1_major=$(echo "$v1" | cut -d. -f1)
    v1_minor=$(echo "$v1" | cut -d. -f2)
    v2_major=$(echo "$v2" | cut -d. -f1)
    v2_minor=$(echo "$v2" | cut -d. -f2)

    v1_major=${v1_major:-0}
    v1_minor=${v1_minor:-0}
    v2_major=${v2_major:-0}
    v2_minor=${v2_minor:-0}

    if [ "$v1_major" -gt "$v2_major" ]; then
        return 0
    elif [ "$v1_major" -eq "$v2_major" ] && [ "$v1_minor" -ge "$v2_minor" ]; then
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Component checks
# ---------------------------------------------------------------------------

GOURCE_STATUS="missing"
GOURCE_VERSION=""

check_gource() {
    if ! command -v gource >/dev/null 2>&1; then
        GOURCE_STATUS="missing"
        return 1
    fi

    # Extract version from gource --help or gource --version
    local version_line=""
    version_line=$(gource --help 2>&1 | head -1 || true)
    GOURCE_VERSION=$(echo "$version_line" | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)

    if [ -z "$GOURCE_VERSION" ]; then
        GOURCE_STATUS="unknown-version"
        return 1
    fi

    if version_gte "$GOURCE_VERSION" "0.51"; then
        GOURCE_STATUS="found"
        return 0
    else
        GOURCE_STATUS="outdated"
        return 1
    fi
}

FFMPEG_STATUS="missing"

check_ffmpeg() {
    if ! command -v ffmpeg >/dev/null 2>&1; then
        FFMPEG_STATUS="missing"
        return 1
    fi

    if ffmpeg -codecs 2>/dev/null | grep -q "libx264"; then
        FFMPEG_STATUS="found"
        return 0
    else
        FFMPEG_STATUS="no-libx264"
        return 1
    fi
}

XVFB_STATUS="missing"

check_xvfb() {
    # Xvfb is only needed on Linux
    if [ "$PLATFORM" = "brew" ]; then
        XVFB_STATUS="skipped"
        return 0
    fi

    if command -v xvfb-run >/dev/null 2>&1; then
        XVFB_STATUS="found"
        return 0
    else
        XVFB_STATUS="missing"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Installation
# ---------------------------------------------------------------------------

install_packages() {
    local need_gource=false
    local need_ffmpeg=false
    local need_xvfb=false

    if [ "$GOURCE_STATUS" != "found" ]; then
        need_gource=true
    fi
    if [ "$FFMPEG_STATUS" != "found" ]; then
        need_ffmpeg=true
    fi
    if [ "$XVFB_STATUS" != "found" ] && [ "$XVFB_STATUS" != "skipped" ]; then
        need_xvfb=true
    fi

    # If nothing to install, return early
    if [ "$need_gource" = "false" ] && [ "$need_ffmpeg" = "false" ] && [ "$need_xvfb" = "false" ]; then
        log "All components already installed"
        return 0
    fi

    local packages=()

    if [ "$PLATFORM" = "apt" ]; then
        if [ "$need_gource" = "true" ]; then
            packages+=("gource")
        fi
        if [ "$need_ffmpeg" = "true" ]; then
            packages+=("ffmpeg")
        fi
        if [ "$need_xvfb" = "true" ]; then
            packages+=("xvfb")
        fi

        log "Installing via apt-get: ${packages[*]}"
        export DEBIAN_FRONTEND=noninteractive
        if ! sudo apt-get update -qq; then
            log_err "apt-get update failed"
            return 2
        fi
        if ! sudo apt-get install -y -qq "${packages[@]}"; then
            log_err "apt-get install failed"
            return 2
        fi

    elif [ "$PLATFORM" = "brew" ]; then
        if [ "$need_gource" = "true" ]; then
            packages+=("gource")
        fi
        if [ "$need_ffmpeg" = "true" ]; then
            packages+=("ffmpeg")
        fi
        # No xvfb on macOS

        log "Installing via brew: ${packages[*]}"
        if ! brew install "${packages[@]}"; then
            log_err "brew install failed"
            return 2
        fi
    fi

    return 0
}

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

verify_install() {
    # Verify gource
    if ! gource --help >/dev/null 2>&1; then
        log_err "Gource verification failed -- gource --help returned error"
        return 3
    fi

    local gource_ver=""
    gource_ver=$(gource --help 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || true)
    if [ -n "$gource_ver" ]; then
        log "Gource: installed v${gource_ver}"
    else
        log "Gource: installed (version unknown)"
    fi

    # Verify ffmpeg has libx264
    if ! ffmpeg -codecs 2>/dev/null | grep -q "libx264"; then
        log_err "ffmpeg missing libx264 codec"
        return 4
    fi
    log "ffmpeg: found with libx264"

    # Verify xvfb (Linux only)
    if [ "$PLATFORM" = "apt" ]; then
        if command -v xvfb-run >/dev/null 2>&1; then
            log "Xvfb: found"
        else
            log "Xvfb: not found (optional)"
        fi
    elif [ "$PLATFORM" = "brew" ]; then
        log "Xvfb: skipped (macOS)"
    fi

    log "All dependencies ready."
    return 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    log "Checking gource visualization dependencies..."

    # Step 1: Detect platform
    if ! detect_platform; then
        exit 1
    fi

    # Step 2: Check existing installations
    if check_gource; then
        log "Gource: found v${GOURCE_VERSION} (>= 0.51)"
    else
        log "Gource: ${GOURCE_STATUS}"
    fi

    if check_ffmpeg; then
        log "ffmpeg: found with libx264"
    else
        log "ffmpeg: ${FFMPEG_STATUS}"
    fi

    if check_xvfb; then
        if [ "$XVFB_STATUS" = "skipped" ]; then
            log "Xvfb: skipped (macOS)"
        else
            log "Xvfb: found"
        fi
    else
        log "Xvfb: ${XVFB_STATUS}"
    fi

    # Step 3: Install missing components
    local install_result=0
    install_packages || install_result=$?
    if [ "$install_result" -eq 2 ]; then
        exit 2
    fi

    # Step 4: Verify
    local verify_result=0
    verify_install || verify_result=$?
    exit "$verify_result"
}

main "$@"
