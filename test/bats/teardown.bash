#!/usr/bin/env bash
# =============================================================================
# BATS Shared Teardown — Agent Kill and Temp Cleanup
# =============================================================================
#
# Sourced by all BATS test files via `load teardown`.
# Kills the per-test ssh-agent and removes temporary files.
#
# Phase 517-01 — BATS Integration Tests (SSH-06)
# =============================================================================

teardown() {
    # Kill ssh-agent if PID is set
    if [[ -n "${SSH_AGENT_PID:-}" ]]; then
        ssh-agent -k > /dev/null 2>&1 || true
    fi

    # Remove temp directory
    rm -rf "${TEST_TMPDIR:-}"

    # Unset agent environment
    unset SSH_AUTH_SOCK
    unset SSH_AGENT_PID
}
