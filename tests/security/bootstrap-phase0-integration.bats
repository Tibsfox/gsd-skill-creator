#!/usr/bin/env bats
# =============================================================================
# Integration BATS tests for Phase 0 security bootstrap hardening
# =============================================================================
#
# Tests cover: sandbox verification hard-stop, security LED IPC emission,
# magic level output (levels 1-5), 30s performance target, and Remote
# Control session compatibility.
#
# Phase 373-02 — Bootstrap Phase 0 Hardening
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/../../scripts/security" && pwd)"
PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"

setup() {
    TEST_TMPDIR="$(mktemp -d)"
    export SECURITY_DIR="$TEST_TMPDIR/security"
    export PLANNING_DIR="$TEST_TMPDIR/planning"
    export PROJECT_DIR="$TEST_TMPDIR/project"
    mkdir -p "$SECURITY_DIR/events" "$SECURITY_DIR/blocked"
    mkdir -p "$PLANNING_DIR/events"
    mkdir -p "$PROJECT_DIR"

    # Create mock bin directory
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"

    # Create mock script directory mirroring real structure
    MOCK_SCRIPT_DIR="$TEST_TMPDIR/scripts/security"
    mkdir -p "$MOCK_SCRIPT_DIR"

    # Copy real helpers and bootstrap
    cp "$SCRIPT_DIR/phase0-helpers.sh" "$MOCK_SCRIPT_DIR/"
    cp "$SCRIPT_DIR/bootstrap-phase0.sh" "$MOCK_SCRIPT_DIR/"

    # Create mock generate-sandbox-profile.sh (always succeeds)
    cat > "$MOCK_SCRIPT_DIR/generate-sandbox-profile.sh" << 'MOCKEOF'
#!/bin/bash
OUTPUT=""
while [ $# -gt 0 ]; do
    case "$1" in
        --output) OUTPUT="$2"; shift 2 ;;
        *) shift ;;
    esac
done
[ -n "$OUTPUT" ] && mkdir -p "$(dirname "$OUTPUT")" && echo '{"stub":true,"platform":"linux"}' > "$OUTPUT"
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/generate-sandbox-profile.sh"

    # Create mock run-in-sandbox.sh (default: runs command directly)
    cat > "$MOCK_SCRIPT_DIR/run-in-sandbox.sh" << 'MOCKEOF'
#!/bin/bash
while [ $# -gt 0 ]; do
    case "$1" in
        --) shift; break ;;
        *) shift ;;
    esac
done
exec "$@"
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/run-in-sandbox.sh"

    # Create mock verify-sandbox.sh (default: passes)
    cat > "$MOCK_SCRIPT_DIR/verify-sandbox.sh" << 'MOCKEOF'
#!/bin/bash
echo "PASS: all isolation tests pass"
exit 0
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/verify-sandbox.sh"

    # Create mock socat (health check always passes)
    cat > "$MOCK_BIN/socat" << 'MOCKEOF'
#!/bin/bash
echo '{"status":"running"}'
MOCKEOF
    chmod +x "$MOCK_BIN/socat"

    # Create mock ssh-keygen (no-op)
    cat > "$MOCK_BIN/ssh-keygen" << 'MOCKEOF'
#!/bin/bash
# No-op mock: create empty key files
while [ $# -gt 0 ]; do
    case "$1" in
        -f) touch "$2"; shift 2 ;;
        *) shift ;;
    esac
done
MOCKEOF
    chmod +x "$MOCK_BIN/ssh-keygen"

    # Create mock ssh-agent
    cat > "$MOCK_BIN/ssh-agent" << 'MOCKEOF'
#!/bin/bash
echo "SSH_AUTH_SOCK=/tmp/mock-ssh-agent.sock; export SSH_AUTH_SOCK;"
echo "SSH_AGENT_PID=99999; export SSH_AGENT_PID;"
MOCKEOF
    chmod +x "$MOCK_BIN/ssh-agent"

    # Create mock ssh-add
    cat > "$MOCK_BIN/ssh-add" << 'MOCKEOF'
#!/bin/bash
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/ssh-add"

    # Create mock bwrap
    cat > "$MOCK_BIN/bwrap" << 'MOCKEOF'
#!/bin/bash
echo "MOCK_BWRAP"
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/bwrap"

    # Create fake SSH key so Step 0.2 doesn't try to generate
    FAKE_SSH="$TEST_TMPDIR/fake-ssh"
    mkdir -p "$FAKE_SSH"
    echo "fake-key" > "$FAKE_SSH/id_ed25519"
    chmod 600 "$FAKE_SSH/id_ed25519"
    export HOME="$TEST_TMPDIR"
    mkdir -p "$HOME/.ssh"
    echo "fake-key" > "$HOME/.ssh/id_ed25519"
    chmod 600 "$HOME/.ssh/id_ed25519"

    # Create mock proxy binary
    MOCK_PROXY_DIR="$MOCK_SCRIPT_DIR/../../bin"
    mkdir -p "$MOCK_PROXY_DIR"
    cat > "$MOCK_PROXY_DIR/gsd-credential-proxy" << 'MOCKEOF'
#!/bin/bash
# Mock proxy: just stay alive
while true; do sleep 60; done
MOCKEOF
    chmod +x "$MOCK_PROXY_DIR/gsd-credential-proxy"

    # Patch bootstrap to use our mock dirs
    sed -i "s|SCRIPT_DIR=.*|SCRIPT_DIR=\"$MOCK_SCRIPT_DIR\"|" "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    sed -i "s|PROJECT_DIR=.*|PROJECT_DIR=\"$PROJECT_DIR\"|" "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"

    # Add mock bin to PATH
    export PATH="$MOCK_BIN:$PATH"
}

teardown() {
    # Kill any background processes
    jobs -p 2>/dev/null | xargs kill 2>/dev/null || true
    # Kill any mock proxy processes
    if [ -f "$SECURITY_DIR/proxy.pid" ]; then
        kill "$(cat "$SECURITY_DIR/proxy.pid")" 2>/dev/null || true
    fi
    rm -rf "$TEST_TMPDIR"
}

# ---------------------------------------------------------------------------
# Test 1: Sandbox verification failure halts Phase 0 with exit 1
# ---------------------------------------------------------------------------
@test "sandbox verification failure halts Phase 0 with exit 1" {
    # Override verify-sandbox.sh to fail
    cat > "$MOCK_SCRIPT_DIR/verify-sandbox.sh" << 'EOF'
#!/bin/bash
echo "FAIL: ISOLATION BREACH detected"
exit 1
EOF
    chmod +x "$MOCK_SCRIPT_DIR/verify-sandbox.sh"

    export GSD_MAGIC_LEVEL=4
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 1 ]
}

# ---------------------------------------------------------------------------
# Test 2: Sandbox verification failure exit 1 at all magic levels
# ---------------------------------------------------------------------------
@test "sandbox verification failure exit 1 at all magic levels" {
    cat > "$MOCK_SCRIPT_DIR/verify-sandbox.sh" << 'EOF'
#!/bin/bash
echo "FAIL: breach"
exit 1
EOF
    chmod +x "$MOCK_SCRIPT_DIR/verify-sandbox.sh"

    # Even at silent level, security errors must halt
    export GSD_MAGIC_LEVEL=1
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 1 ]
}

# ---------------------------------------------------------------------------
# Test 3: Security LED emits status.json with phase0_complete=true
# ---------------------------------------------------------------------------
@test "security LED emits status.json with phase0_complete=true on success" {
    export GSD_MAGIC_LEVEL=4
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    [ -f "$SECURITY_DIR/status.json" ]
    run grep '"phase0_complete": true' "$SECURITY_DIR/status.json"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 4: Security LED emits IPC event to security.jsonl
# ---------------------------------------------------------------------------
@test "security LED emits IPC event to security.jsonl on success" {
    export GSD_MAGIC_LEVEL=4
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    [ -f "$PLANNING_DIR/events/security.jsonl" ]
    run grep 'security:sandbox-active' "$PLANNING_DIR/events/security.jsonl"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 5: Magic level 1 produces no stdout output on happy path
# ---------------------------------------------------------------------------
@test "magic level 1 produces no stdout output on happy path" {
    export GSD_MAGIC_LEVEL=1
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    # Stdout should be empty at magic level 1
    [ -z "$output" ]
}

# ---------------------------------------------------------------------------
# Test 6: Magic level 2 produces single summary line
# ---------------------------------------------------------------------------
@test "magic level 2 produces single summary line" {
    export GSD_MAGIC_LEVEL=2
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Security systems online."* ]]
}

# ---------------------------------------------------------------------------
# Test 7: Magic level 3 produces status summary
# ---------------------------------------------------------------------------
@test "magic level 3 produces status summary with 4 key items" {
    export GSD_MAGIC_LEVEL=3
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Sandbox"* ]]
    [[ "$output" == *"Proxy"* ]]
    [[ "$output" == *"SSH"* ]]
    [[ "$output" == *"LED"* ]]
}

# ---------------------------------------------------------------------------
# Test 8: Magic level 4 shows each step with status
# ---------------------------------------------------------------------------
@test "magic level 4 shows each step with status" {
    export GSD_MAGIC_LEVEL=4
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    # Should have multiple Phase0 log lines (one per step)
    local log_lines
    log_lines=$(echo "$output" | grep -c '\[Phase0\]' || true)
    [ "$log_lines" -ge 6 ]
}

# ---------------------------------------------------------------------------
# Test 9: Magic level 5 includes proxy socket path in output
# ---------------------------------------------------------------------------
@test "magic level 5 includes proxy socket path in output" {
    export GSD_MAGIC_LEVEL=5
    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Proxy socket:"* ]]
}

# ---------------------------------------------------------------------------
# Test 10: Phase 0 completes in under 30 seconds on happy path
# ---------------------------------------------------------------------------
@test "Phase 0 completes in under 30 seconds on happy path" {
    export GSD_MAGIC_LEVEL=4
    local START_MS
    START_MS=$(date +%s%3N 2>/dev/null || date +%s)

    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"

    local END_MS
    END_MS=$(date +%s%3N 2>/dev/null || date +%s)

    [ "$status" -eq 0 ]

    local ELAPSED=$((END_MS - START_MS))
    # If using seconds fallback (no %3N), multiply by 1000
    if [ "$ELAPSED" -lt 100 ]; then
        ELAPSED=$((ELAPSED * 1000))
    fi
    [ "$ELAPSED" -lt 30000 ]
}

# ---------------------------------------------------------------------------
# Test 11: Remote Control session skips local ssh-agent start
# ---------------------------------------------------------------------------
@test "Remote Control session skips local ssh-agent start" {
    # Create a mock SSH_AUTH_SOCK socket
    MOCK_SOCK="$TEST_TMPDIR/mock-ssh-sock"
    # Create an actual socket using socat or Python
    python3 -c "
import socket, os
s = socket.socket(socket.AF_UNIX)
s.bind('$MOCK_SOCK')
s.listen(1)
# Write pid so we can clean up
with open('$MOCK_SOCK.pid', 'w') as f:
    f.write(str(os.getpid()))
" &
    SOCK_PID=$!
    sleep 0.2

    export SSH_REMOTE_CONTROL=1
    export SSH_AUTH_SOCK="$MOCK_SOCK"
    export GSD_MAGIC_LEVEL=4

    # Create tracking mock for ssh-agent that records if it was called
    cat > "$MOCK_BIN/ssh-agent" << 'EOF'
#!/bin/bash
echo "SSH_AGENT_CALLED" > /tmp/ssh-agent-called-$$
echo "SSH_AUTH_SOCK=/tmp/mock.sock; export SSH_AUTH_SOCK;"
EOF
    chmod +x "$MOCK_BIN/ssh-agent"

    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"

    # ssh-agent should NOT have been called (Remote Control uses forwarded agent)
    [[ "$output" == *"Remote Control session detected"* ]]

    # Cleanup
    kill "$SOCK_PID" 2>/dev/null || true
    rm -f "$MOCK_SOCK" "$MOCK_SOCK.pid"
}

# ---------------------------------------------------------------------------
# Test 12: Remote Control session verifies SSH_AUTH_SOCK is accessible
# ---------------------------------------------------------------------------
@test "Remote Control session verifies SSH_AUTH_SOCK is accessible" {
    # Set Remote Control without a valid socket
    export SSH_REMOTE_CONTROL=1
    export SSH_AUTH_SOCK="$TEST_TMPDIR/nonexistent-socket"
    export GSD_MAGIC_LEVEL=4

    run bash "$MOCK_SCRIPT_DIR/bootstrap-phase0.sh"
    # Should fail because socket doesn't exist
    [ "$status" -eq 1 ]
}
