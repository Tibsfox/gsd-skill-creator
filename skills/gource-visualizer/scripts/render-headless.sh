#!/usr/bin/env bash
# =============================================================================
# render-headless.sh -- xvfb-run wrapper for headless environments
# =============================================================================
#
# Wraps a command string in xvfb-run with GLX extension for environments
# where no display is available (CI, SSH, Docker). Falls back to manual
# Xvfb process if xvfb-run is not available.
#
# Usage: render-headless.sh "<command string>"
#
# Exit codes:
#   0 - Command executed successfully
#   1 - No command argument provided
#   2 - Neither xvfb-run nor Xvfb available
#
# Phase 400-01 -- Render Pipeline
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[headless] ERROR: $*" >&2
}

info() {
    echo "[headless] $*" >&2
}

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]] || [[ -z "$1" ]]; then
    err "Usage: render-headless.sh \"<command string>\""
    exit 1
fi

CMD="$1"

# ---------------------------------------------------------------------------
# Cleanup trap for manual Xvfb
# ---------------------------------------------------------------------------

XVFB_PID=""

cleanup_xvfb() {
    if [[ -n "$XVFB_PID" ]]; then
        kill "$XVFB_PID" 2>/dev/null || true
        wait "$XVFB_PID" 2>/dev/null || true
    fi
}

trap 'cleanup_xvfb' INT TERM EXIT

# ---------------------------------------------------------------------------
# Execute with virtual framebuffer
# ---------------------------------------------------------------------------

if command -v xvfb-run >/dev/null 2>&1; then
    info "Using xvfb-run"
    xvfb-run -a -s "-screen 0 1920x1080x24 +extension GLX" \
        bash -c "$CMD"
elif command -v Xvfb >/dev/null 2>&1; then
    info "Using manual Xvfb"

    # Find a free display number
    DISPLAY_NUM=99
    while [[ -e "/tmp/.X${DISPLAY_NUM}-lock" ]]; do
        DISPLAY_NUM=$((DISPLAY_NUM + 1))
    done

    Xvfb ":${DISPLAY_NUM}" -screen 0 1920x1080x24 +extension GLX &
    XVFB_PID=$!
    sleep 1

    # Verify Xvfb started
    if ! kill -0 "$XVFB_PID" 2>/dev/null; then
        err "Failed to start Xvfb"
        exit 2
    fi

    info "Xvfb running on :${DISPLAY_NUM} (PID $XVFB_PID)"
    DISPLAY=":${DISPLAY_NUM}" bash -c "$CMD"
    exit_code=$?

    kill "$XVFB_PID" 2>/dev/null || true
    XVFB_PID=""

    exit "$exit_code"
else
    err "Neither xvfb-run nor Xvfb found. Install xvfb:"
    err "  Ubuntu/Debian: sudo apt-get install xvfb"
    err "  See: scripts/install-gource.sh"
    exit 2
fi
