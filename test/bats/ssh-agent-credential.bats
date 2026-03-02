#!/usr/bin/env bats
# =============================================================================
# SSH Agent Credential Handling Integration Tests
# =============================================================================
#
# Uses REAL ssh-agent processes (not mocks) to verify credential handling.
# Ephemeral ed25519 keys are generated, loaded, and cleaned up per test.
#
# Requirements: ssh-agent, ssh-add, ssh-keygen (OpenSSH)
# Skip: Gracefully skips when ssh-agent is unavailable.
#
# Phase 517-01 — BATS Integration Tests (SSH-06)
# =============================================================================

load setup
load teardown

# ---------------------------------------------------------------------------
# Skip guard
# ---------------------------------------------------------------------------

_skip_if_no_ssh_agent() {
    command -v ssh-agent >/dev/null 2>&1 || skip "ssh-agent not available"
}

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@test "ssh-agent has exactly one key loaded" {
    _skip_if_no_ssh_agent
    run ssh-add -l
    assert_success
    assert_output --partial "ED25519"
    # Exactly one line of output = one key
    local line_count
    line_count=$(echo "$output" | wc -l)
    [[ "$line_count" -eq 1 ]]
}

@test "loaded key matches generated test key (bats-test comment)" {
    _skip_if_no_ssh_agent
    run ssh-add -l
    assert_success
    assert_output --partial "bats-test"
}

@test "ssh-agent socket is accessible" {
    _skip_if_no_ssh_agent
    [[ -S "${SSH_AUTH_SOCK}" ]]
}

@test "ssh-add -D removes all keys" {
    _skip_if_no_ssh_agent
    run ssh-add -D
    assert_success
    run ssh-add -l
    # After removing all keys, ssh-add -l returns exit code 1
    # and output contains "no identities" or "agent has no identities"
    [[ "$output" == *"no identities"* ]] || [[ "$output" == *"agent has no identities"* ]]
}

@test "fresh agent after teardown/setup has one key" {
    _skip_if_no_ssh_agent
    teardown
    setup
    run ssh-add -l
    assert_success
    local line_count
    line_count=$(echo "$output" | wc -l)
    [[ "$line_count" -eq 1 ]]
}

@test "agent PID is a running process" {
    _skip_if_no_ssh_agent
    # Verify the ssh-agent process is alive
    kill -0 "${SSH_AGENT_PID}"
}

@test "multiple keys can be loaded" {
    _skip_if_no_ssh_agent
    # Generate a second key
    ssh-keygen -t ed25519 -f "${TEST_TMPDIR}/test_key2" -N "" -q -C "bats-test-2"
    ssh-add "${TEST_TMPDIR}/test_key2" 2>/dev/null
    run ssh-add -l
    assert_success
    local line_count
    line_count=$(echo "$output" | wc -l)
    [[ "$line_count" -eq 2 ]]
}
