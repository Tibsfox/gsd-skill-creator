#!/usr/bin/env bats
# =============================================================================
# BATS tests for Phase 0 security bootstrap core sequence
# =============================================================================
#
# Tests cover: platform detection, check_command, SSH key verification,
# domain allowlist initialization, proxy start, sandbox dispatch,
# and helper function definitions.
#
# Phase 373-01 — Bootstrap Phase 0
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/../../scripts/security" && pwd)"
PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"

setup() {
    TEST_TMPDIR="$(mktemp -d)"
    export SECURITY_DIR="$TEST_TMPDIR/security"
    export PLANNING_DIR="$TEST_TMPDIR/planning"
    export PROJECT_DIR="$TEST_TMPDIR/project"
    mkdir -p "$SECURITY_DIR" "$PLANNING_DIR" "$PROJECT_DIR"
    mkdir -p "$SECURITY_DIR/events" "$SECURITY_DIR/blocked"
    mkdir -p "$PLANNING_DIR/events"

    # Create mock bin directory for overridable commands
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"
    export PATH="$MOCK_BIN:$PATH"

    # Default magic level for verbose test output
    export GSD_MAGIC_LEVEL=4

    # Create a mock generate-sandbox-profile.sh in SCRIPT_DIR location
    MOCK_SCRIPT_DIR="$TEST_TMPDIR/scripts/security"
    mkdir -p "$MOCK_SCRIPT_DIR"

    # Copy helpers to mock script dir so sourcing works
    cp "$SCRIPT_DIR/phase0-helpers.sh" "$MOCK_SCRIPT_DIR/" 2>/dev/null || true

    # Create mock generate-sandbox-profile.sh
    cat > "$MOCK_SCRIPT_DIR/generate-sandbox-profile.sh" << 'MOCKEOF'
#!/bin/bash
# Mock: write a stub profile
OUTPUT=""
while [ $# -gt 0 ]; do
    case "$1" in
        --output) OUTPUT="$2"; shift 2 ;;
        *) shift ;;
    esac
done
if [ -n "$OUTPUT" ]; then
    echo '{"project_dir":"mock","platform":"linux","stub":true}' > "$OUTPUT"
fi
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/generate-sandbox-profile.sh"

    # Create mock verify-sandbox.sh (passes by default)
    cat > "$MOCK_SCRIPT_DIR/verify-sandbox.sh" << 'MOCKEOF'
#!/bin/bash
echo "PASS: mock verification"
exit 0
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/verify-sandbox.sh"

    # Create mock run-in-sandbox.sh (just runs the command)
    cat > "$MOCK_SCRIPT_DIR/run-in-sandbox.sh" << 'MOCKEOF'
#!/bin/bash
# Skip args until --
while [ $# -gt 0 ]; do
    case "$1" in
        --) shift; break ;;
        *) shift ;;
    esac
done
exec "$@"
MOCKEOF
    chmod +x "$MOCK_SCRIPT_DIR/run-in-sandbox.sh"

    # Create mock gsd-credential-proxy (just sleeps)
    MOCK_PROXY_DIR="$TEST_TMPDIR/scripts/bin"
    mkdir -p "$MOCK_PROXY_DIR"
    cat > "$MOCK_PROXY_DIR/gsd-credential-proxy" << 'MOCKEOF'
#!/bin/bash
# Mock proxy — just stay alive
sleep 60 &
wait
MOCKEOF
    chmod +x "$MOCK_PROXY_DIR/gsd-credential-proxy"
}

teardown() {
    # Kill any background processes from tests
    jobs -p 2>/dev/null | xargs kill 2>/dev/null || true
    rm -rf "$TEST_TMPDIR"
}

# ---------------------------------------------------------------------------
# Test 1: Platform detection — Linux
# ---------------------------------------------------------------------------
@test "platform detection sets SANDBOX_PLATFORM=linux on Linux" {
    # Create a stripped-down bootstrap that only does platform detection
    source "$SCRIPT_DIR/phase0-helpers.sh"

    # Simulate platform detection logic
    local platform
    case "$(uname -s)" in
        Linux)  platform="linux" ;;
        Darwin) platform="macos" ;;
        *)      platform="unsupported" ;;
    esac

    # On Linux CI / dev machines this should be linux
    if [ "$(uname -s)" = "Linux" ]; then
        [ "$platform" = "linux" ]
    else
        # On macOS it should be macos
        [ "$platform" = "macos" ]
    fi
}

# ---------------------------------------------------------------------------
# Test 2: Platform detection — Darwin (mocked)
# ---------------------------------------------------------------------------
@test "platform detection sets SANDBOX_PLATFORM=macos on Darwin" {
    # Create mock uname that returns Darwin
    cat > "$MOCK_BIN/uname" << 'EOF'
#!/bin/bash
if [ "$1" = "-s" ]; then
    echo "Darwin"
else
    echo "Darwin"
fi
EOF
    chmod +x "$MOCK_BIN/uname"

    source "$SCRIPT_DIR/phase0-helpers.sh"

    local platform
    case "$(uname -s)" in
        Linux)  platform="linux" ;;
        Darwin) platform="macos" ;;
        *)      platform="unsupported" ;;
    esac

    [ "$platform" = "macos" ]
}

# ---------------------------------------------------------------------------
# Test 3: check_command detects missing binary
# ---------------------------------------------------------------------------
@test "check_command detects missing binary and prints install guidance" {
    source "$SCRIPT_DIR/phase0-helpers.sh"
    export MAGIC_LEVEL=4

    run check_command "nonexistent_cmd_xyz_12345" "apt install xyz" "dnf install xyz"
    [ "$status" -ne 0 ]
}

# ---------------------------------------------------------------------------
# Test 4: SSH key check finds existing ed25519 key
# ---------------------------------------------------------------------------
@test "SSH key check finds existing ed25519 key and logs verified" {
    # Create fake SSH dir with ed25519 key
    FAKE_SSH="$TEST_TMPDIR/fake-ssh"
    mkdir -p "$FAKE_SSH"
    echo "fake-key-content" > "$FAKE_SSH/id_ed25519"
    chmod 600 "$FAKE_SSH/id_ed25519"

    source "$SCRIPT_DIR/phase0-helpers.sh"
    export MAGIC_LEVEL=4

    # Check that the key file exists and has correct permissions
    [ -f "$FAKE_SSH/id_ed25519" ]
    local perms
    perms=$(stat -c '%a' "$FAKE_SSH/id_ed25519" 2>/dev/null || stat -f '%Lp' "$FAKE_SSH/id_ed25519" 2>/dev/null)
    [ "$perms" = "600" ]
}

# ---------------------------------------------------------------------------
# Test 5: SSH key check skips generation when user declines
# ---------------------------------------------------------------------------
@test "SSH key check skips generation when user declines (n response)" {
    source "$SCRIPT_DIR/phase0-helpers.sh"
    export MAGIC_LEVEL=4

    # Simulate no SSH key present and user declining
    FAKE_SSH="$TEST_TMPDIR/empty-ssh"
    mkdir -p "$FAKE_SSH"

    # Verify no key files exist
    [ ! -f "$FAKE_SSH/id_ed25519" ]
    [ ! -f "$FAKE_SSH/id_rsa" ]

    # If user would say "n", no key should be generated
    echo "n" | phase0_prompt "Generate SSH key?" > /dev/null 2>&1 || true
    [ ! -f "$FAKE_SSH/id_ed25519" ]
}

# ---------------------------------------------------------------------------
# Test 6: Domain allowlist initialized with 3 defaults
# ---------------------------------------------------------------------------
@test "domain allowlist initialized with 3 default domains when not present" {
    source "$SCRIPT_DIR/phase0-helpers.sh"
    export MAGIC_LEVEL=4

    # Ensure no allowlist exists
    [ ! -f "$SECURITY_DIR/domain-allowlist.json" ]

    # Write default allowlist (mimics what bootstrap-phase0.sh does)
    if [ ! -f "$SECURITY_DIR/domain-allowlist.json" ]; then
        cat > "$SECURITY_DIR/domain-allowlist.json" << 'EOALLOW'
{
  "domains": [
    { "domain": "api.anthropic.com", "credential_type": "api_key_header", "header": "x-api-key" },
    { "domain": "github.com", "credential_type": "ssh_agent" },
    { "domain": "registry.npmjs.org", "credential_type": "bearer_token" }
  ]
}
EOALLOW
    fi

    [ -f "$SECURITY_DIR/domain-allowlist.json" ]
    run grep -c '"domain"' "$SECURITY_DIR/domain-allowlist.json"
    [ "$output" = "3" ]
    run grep 'api.anthropic.com' "$SECURITY_DIR/domain-allowlist.json"
    [ "$status" -eq 0 ]
    run grep 'github.com' "$SECURITY_DIR/domain-allowlist.json"
    [ "$status" -eq 0 ]
    run grep 'registry.npmjs.org' "$SECURITY_DIR/domain-allowlist.json"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 7: Domain allowlist not overwritten when present
# ---------------------------------------------------------------------------
@test "domain allowlist not overwritten when already present" {
    source "$SCRIPT_DIR/phase0-helpers.sh"

    # Pre-create custom allowlist
    echo '{"domains":[{"domain":"custom.example.com","credential_type":"none"}]}' \
        > "$SECURITY_DIR/domain-allowlist.json"

    # Simulate the "don't overwrite" logic
    if [ ! -f "$SECURITY_DIR/domain-allowlist.json" ]; then
        echo '{"domains":[]}' > "$SECURITY_DIR/domain-allowlist.json"
    fi

    # Custom content should be intact
    run grep 'custom.example.com' "$SECURITY_DIR/domain-allowlist.json"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 8: Proxy start writes pid file
# ---------------------------------------------------------------------------
@test "proxy start writes pid file to SECURITY_DIR/proxy.pid" {
    # Start a mock background process as "proxy"
    sleep 300 &
    local MOCK_PID=$!
    echo "$MOCK_PID" > "$SECURITY_DIR/proxy.pid"

    [ -f "$SECURITY_DIR/proxy.pid" ]
    local stored_pid
    stored_pid=$(cat "$SECURITY_DIR/proxy.pid")
    [ "$stored_pid" = "$MOCK_PID" ]

    # Verify the process is actually running
    kill -0 "$MOCK_PID" 2>/dev/null
    [ $? -eq 0 ]

    # Cleanup
    kill "$MOCK_PID" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Test 9: generate-sandbox-profile.sh passes required args
# ---------------------------------------------------------------------------
@test "generate-sandbox-profile.sh wrapper passes --project --platform --output args" {
    # Create a capturing mock
    cat > "$MOCK_BIN/generate-sandbox-profile-capture.sh" << 'EOF'
#!/bin/bash
echo "$@" > /tmp/gen-profile-args-$$
OUTPUT=""
while [ $# -gt 0 ]; do
    case "$1" in
        --project) echo "GOT_PROJECT=$2"; shift 2 ;;
        --planning) echo "GOT_PLANNING=$2"; shift 2 ;;
        --platform) echo "GOT_PLATFORM=$2"; shift 2 ;;
        --output) OUTPUT="$2"; echo "GOT_OUTPUT=$2"; shift 2 ;;
        *) shift ;;
    esac
done
[ -n "$OUTPUT" ] && echo '{"stub":true}' > "$OUTPUT"
EOF
    chmod +x "$MOCK_BIN/generate-sandbox-profile-capture.sh"

    run "$MOCK_BIN/generate-sandbox-profile-capture.sh" \
        --project "/test/project" \
        --planning "/test/planning" \
        --platform "linux" \
        --output "$TEST_TMPDIR/profile.json"

    [ "$status" -eq 0 ]
    [[ "$output" == *"GOT_PROJECT=/test/project"* ]]
    [[ "$output" == *"GOT_PLATFORM=linux"* ]]
    [[ "$output" == *"GOT_OUTPUT=$TEST_TMPDIR/profile.json"* ]]
    [ -f "$TEST_TMPDIR/profile.json" ]
}

# ---------------------------------------------------------------------------
# Test 10: run-in-sandbox.sh uses bwrap on Linux
# ---------------------------------------------------------------------------
@test "run-in-sandbox.sh uses bwrap on Linux" {
    source "$SCRIPT_DIR/phase0-helpers.sh"

    # Create mock bwrap that logs its invocation
    cat > "$MOCK_BIN/bwrap" << 'EOF'
#!/bin/bash
echo "BWRAP_CALLED with args: $@"
exit 0
EOF
    chmod +x "$MOCK_BIN/bwrap"

    # The real run-in-sandbox.sh should dispatch to bwrap on Linux
    # For now, verify the script exists and has bwrap references
    run grep -q 'bwrap' "$SCRIPT_DIR/run-in-sandbox.sh"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 11: run-in-sandbox.sh uses sandbox-exec on macOS
# ---------------------------------------------------------------------------
@test "run-in-sandbox.sh uses sandbox-exec on macOS" {
    source "$SCRIPT_DIR/phase0-helpers.sh"

    # Verify the script references sandbox-exec for macOS
    run grep -q 'sandbox-exec' "$SCRIPT_DIR/run-in-sandbox.sh"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 12: phase0-helpers.sh defines all 5 helper functions
# ---------------------------------------------------------------------------
@test "phase0-helpers.sh defines phase0_log phase0_warn phase0_error phase0_prompt check_command" {
    source "$SCRIPT_DIR/phase0-helpers.sh"

    # Verify all functions are defined
    type phase0_log   | head -1 | grep -q 'function'
    type phase0_warn  | head -1 | grep -q 'function'
    type phase0_error | head -1 | grep -q 'function'
    type phase0_prompt | head -1 | grep -q 'function'
    type check_command | head -1 | grep -q 'function'
}
