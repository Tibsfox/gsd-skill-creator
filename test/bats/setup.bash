#!/usr/bin/env bash
# =============================================================================
# BATS Shared Setup — SSH Agent Lifecycle and Ephemeral Key Generation
# =============================================================================
#
# Sourced by all BATS test files via `load setup`.
# Creates an isolated ssh-agent per test with ephemeral ed25519 keys.
#
# Phase 517-01 — BATS Integration Tests (SSH-06)
# =============================================================================

# Project root (two levels up from test/bats/)
PROJECT_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
SECURITY_SCRIPTS="${PROJECT_ROOT}/scripts/security"

export PROJECT_ROOT
export SECURITY_SCRIPTS

# ---------------------------------------------------------------------------
# bats-support / bats-assert loading with fallback
# ---------------------------------------------------------------------------
# Try system paths first, then local clones, then define minimal fallbacks.

_bats_helpers_loaded=false

# System paths (Debian/Ubuntu, Fedora, Arch)
for dir in /usr/lib/bats /usr/share/bats /usr/local/lib/bats; do
    if [[ -f "${dir}/bats-support/load.bash" && -f "${dir}/bats-assert/load.bash" ]]; then
        # shellcheck source=/dev/null
        source "${dir}/bats-support/load.bash"
        # shellcheck source=/dev/null
        source "${dir}/bats-assert/load.bash"
        _bats_helpers_loaded=true
        break
    fi
done

# Local clones (in test/bats/ directory)
if [[ "$_bats_helpers_loaded" != "true" ]]; then
    if [[ -f "${BATS_TEST_DIRNAME}/bats-support/load.bash" && -f "${BATS_TEST_DIRNAME}/bats-assert/load.bash" ]]; then
        # shellcheck source=/dev/null
        source "${BATS_TEST_DIRNAME}/bats-support/load.bash"
        # shellcheck source=/dev/null
        source "${BATS_TEST_DIRNAME}/bats-assert/load.bash"
        _bats_helpers_loaded=true
    fi
fi

# Minimal fallbacks if neither system nor local helpers are available
if [[ "$_bats_helpers_loaded" != "true" ]]; then
    assert_success() {
        if [[ "$status" -ne 0 ]]; then
            echo "Expected success (exit 0), got exit $status" >&2
            echo "Output: $output" >&2
            return 1
        fi
    }

    assert_failure() {
        if [[ "$status" -eq 0 ]]; then
            echo "Expected failure (non-zero exit), got exit 0" >&2
            echo "Output: $output" >&2
            return 1
        fi
    }

    assert_output() {
        if [[ "$1" == "--partial" ]]; then
            shift
            if [[ "$output" != *"$1"* ]]; then
                echo "Expected output to contain: $1" >&2
                echo "Actual output: $output" >&2
                return 1
            fi
        else
            if [[ "$output" != "$1" ]]; then
                echo "Expected output: $1" >&2
                echo "Actual output: $output" >&2
                return 1
            fi
        fi
    }
fi

# ---------------------------------------------------------------------------
# setup() — called before each test
# ---------------------------------------------------------------------------

setup() {
    # Create isolated temp directory
    TEST_TMPDIR="$(mktemp -d "${BATS_TMPDIR:-/tmp}/ssh-test-XXXXXX")"
    export TEST_TMPDIR

    # Generate ephemeral ed25519 key (no passphrase, quiet)
    ssh-keygen -t ed25519 -f "${TEST_TMPDIR}/test_key" -N "" -q -C "bats-test"

    # Start a fresh ssh-agent
    eval "$(ssh-agent -s)" > /dev/null 2>&1
    export SSH_AUTH_SOCK
    export SSH_AGENT_PID

    # Load the ephemeral key
    ssh-add "${TEST_TMPDIR}/test_key" 2>/dev/null
}
