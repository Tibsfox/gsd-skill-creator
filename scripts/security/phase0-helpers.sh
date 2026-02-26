#!/bin/bash
# =============================================================================
# Phase 0 Helper Functions
# =============================================================================
#
# Logging and prompt helpers consumed by bootstrap-phase0.sh.
# All output respects GSD_MAGIC_LEVEL for appropriate verbosity.
#
# Exports:
#   phase0_log(msg)    — prefix "[Phase0]", silent at MAGIC_LEVEL <=1
#   phase0_warn(msg)   — prefix "[Phase0 WARN]", stderr at level >=1
#   phase0_error(msg)  — prefix "[Phase0 ERROR]", always stderr
#   phase0_prompt(msg) — prompt with default accept at level 1
#   check_command(cmd, apt_install, dnf_install [, brew_install])
#
# Phase 373-01 — Bootstrap Phase 0
# =============================================================================

set -euo pipefail

# Magic level: controls output verbosity
# 1=silent, 2=summary, 3=status, 4=steps, 5=full diagnostic
MAGIC_LEVEL="${GSD_MAGIC_LEVEL:-3}"

# ---------------------------------------------------------------------------
# phase0_log — informational log, respects magic level
# ---------------------------------------------------------------------------
phase0_log() {
    local msg="$1"
    if [ "$MAGIC_LEVEL" -ge 2 ]; then
        echo "[Phase0] $msg"
    fi
}

# ---------------------------------------------------------------------------
# phase0_warn — warning log, always to stderr at level >=1
# ---------------------------------------------------------------------------
phase0_warn() {
    local msg="$1"
    if [ "$MAGIC_LEVEL" -ge 1 ]; then
        echo "[Phase0 WARN] $msg" >&2
    fi
}

# ---------------------------------------------------------------------------
# phase0_error — error log, always to stderr regardless of magic level
# ---------------------------------------------------------------------------
phase0_error() {
    local msg="$1"
    echo "[Phase0 ERROR] $msg" >&2
}

# ---------------------------------------------------------------------------
# phase0_prompt — interactive prompt, auto-accepts at magic level 1
# ---------------------------------------------------------------------------
phase0_prompt() {
    local msg="$1"
    if [ "$MAGIC_LEVEL" -le 1 ]; then
        # Auto-accept defaults at silent level
        echo "y"
        return 0
    fi
    echo -n "$msg " >&2
    local response
    read -r response
    echo "$response"
}

# ---------------------------------------------------------------------------
# check_command — verify binary exists, print install guidance if missing
# ---------------------------------------------------------------------------
# Usage: check_command CMD APT_INSTALL DNF_INSTALL [BREW_INSTALL]
# Returns 0 if command found, 1 if missing (with error message)
check_command() {
    local cmd="$1"
    local apt_install="$2"
    local dnf_install="$3"
    local brew_install="${4:-}"

    if command -v "$cmd" > /dev/null 2>&1; then
        phase0_log "Found: $cmd ($(command -v "$cmd"))"
        return 0
    fi

    phase0_error "Missing required command: $cmd"
    phase0_error "Install with one of:"
    phase0_error "  apt:  $apt_install"
    phase0_error "  dnf:  $dnf_install"
    if [ -n "$brew_install" ]; then
        phase0_error "  brew: $brew_install"
    fi
    return 1
}
