#!/usr/bin/env bats
# =============================================================================
# Bubblewrap Sandbox Enforcement Integration Tests
# =============================================================================
#
# Uses REAL bwrap processes (not mocks) to verify sandbox isolation properties.
# Tests skip gracefully when bwrap or unprivileged user namespaces are unavailable.
#
# Requirements: bwrap (bubblewrap), unprivileged user namespaces enabled
# Skip: Gracefully skips when bwrap is unavailable or kernel features disabled.
#
# Phase 517-01 — BATS Integration Tests (SSH-06)
# =============================================================================

load setup
load teardown

# ---------------------------------------------------------------------------
# Skip guards
# ---------------------------------------------------------------------------

_skip_if_no_bwrap() {
    command -v bwrap >/dev/null 2>&1 || skip "bwrap not available"
}

_skip_if_no_userns() {
    local userns_file="/proc/sys/kernel/unprivileged_userns_clone"
    if [[ -f "$userns_file" ]]; then
        local val
        val=$(cat "$userns_file" 2>/dev/null || echo "1")
        [[ "$val" == "0" ]] && skip "unprivileged user namespaces disabled"
    fi
}

# Build a portable set of bind flags for this distro
_bwrap_base_binds() {
    local binds="--ro-bind /usr /usr --ro-bind /etc /etc --proc /proc --dev /dev"
    [[ -d /bin ]] && binds="$binds --ro-bind /bin /bin"
    [[ -d /lib ]] && binds="$binds --ro-bind /lib /lib"
    [[ -d /lib64 ]] && binds="$binds --ro-bind /lib64 /lib64"
    [[ -d /sbin ]] && binds="$binds --ro-bind /sbin /sbin"
    echo "$binds"
}

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@test "bwrap sandbox blocks SSH key access" {
    _skip_if_no_bwrap
    _skip_if_no_userns

    local binds
    binds=$(_bwrap_base_binds)

    # Attempt to read an SSH key inside a sandbox with ~/.ssh as tmpfs
    # shellcheck disable=SC2086
    run bwrap --die-with-parent --cap-drop ALL \
        $binds \
        --tmpfs "${HOME}/.ssh" \
        -- cat "${HOME}/.ssh/id_ed25519" 2>/dev/null
    assert_failure
}

@test "bwrap sandbox isolates /tmp writes" {
    _skip_if_no_bwrap
    _skip_if_no_userns

    local binds
    binds=$(_bwrap_base_binds)
    local escape_marker="/tmp/sandbox-escape-test-$$"

    # Write inside a sandbox with tmpfs /tmp — should NOT appear on host
    # shellcheck disable=SC2086
    bwrap --die-with-parent --cap-drop ALL \
        $binds \
        --tmpfs /tmp \
        -- touch "/tmp/sandbox-escape-test-$$" 2>/dev/null || true

    # The file must NOT exist on the host
    [[ ! -f "$escape_marker" ]]
}

@test "bwrap sandbox blocks nsenter escape" {
    _skip_if_no_bwrap
    _skip_if_no_userns

    local binds
    binds=$(_bwrap_base_binds)

    # Attempt nsenter with --cap-drop ALL — should fail
    # shellcheck disable=SC2086
    run bwrap --die-with-parent --cap-drop ALL \
        $binds \
        -- nsenter --target 1 --mount --pid -- /bin/true 2>/dev/null
    assert_failure
}

@test "verify-sandbox.sh runs inside sandbox and produces output" {
    _skip_if_no_bwrap
    _skip_if_no_userns

    local binds
    binds=$(_bwrap_base_binds)

    # Run the verification script inside a minimal sandbox
    # We bind the project root read-only so the script can be found
    # shellcheck disable=SC2086
    run bwrap --die-with-parent --cap-drop ALL \
        $binds \
        --ro-bind "${PROJECT_ROOT}" "${PROJECT_ROOT}" \
        --tmpfs /tmp \
        -- bash "${PROJECT_ROOT}/scripts/security/verify-sandbox.sh" 2>/dev/null

    # The script should run to completion and produce "Results:" output
    assert_output --partial "Results:"
}

@test "bwrap --unshare-net blocks external network access" {
    _skip_if_no_bwrap
    _skip_if_no_userns

    # curl may not be available inside the sandbox, so check first
    command -v curl >/dev/null 2>&1 || skip "curl not available for network test"

    local binds
    binds=$(_bwrap_base_binds)

    # With --unshare-net, external network should be unreachable
    # shellcheck disable=SC2086
    run bwrap --die-with-parent --cap-drop ALL --unshare-net \
        $binds \
        -- curl -s --max-time 2 --connect-timeout 1 https://example.com 2>/dev/null
    assert_failure
}
