#!/usr/bin/env bats
# =============================================================================
# BATS tests for check-prerequisites.sh — prerequisite detection
# =============================================================================
#
# Tests cover: node, npm, tmux, git detection; optional claude detection;
# platform-specific install hints; missing prerequisite error handling.
#
# Phase 378-01 — Bootstrap
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
SCRIPT_PATH="${PROJECT_ROOT}/scripts/check-prerequisites.sh"

setup() {
    TEST_TMPDIR="$(mktemp -d)"
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"

    # Save original PATH and prepend mock bin
    ORIG_PATH="$PATH"
    export PATH="$MOCK_BIN:$PATH"

    # Default magic level
    export MAGIC_LEVEL=3

    # Define show_ok and show_fail (normally provided by bootstrap.sh before sourcing)
    show_ok() {
        if [ "$MAGIC_LEVEL" -le 2 ]; then printf " ."; else echo "  OK $1"; fi
    }
    show_fail() {
        if [ "$MAGIC_LEVEL" -le 2 ]; then printf " x"; else echo "  FAIL $1"; fi
    }
    export -f show_ok
    export -f show_fail
}

teardown() {
    export PATH="$ORIG_PATH"
    rm -rf "$TEST_TMPDIR"
}

# Helper: create a mock command that prints a version
create_mock() {
    local cmd="$1"
    local version="${2:-1.0.0}"
    cat > "$MOCK_BIN/$cmd" << EOF
#!/bin/bash
if [ "\$1" = "--version" ]; then
    echo "$version"
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/$cmd"
}

# Helper: remove real commands from PATH by hiding them behind a failing mock
hide_command() {
    local cmd="$1"
    cat > "$MOCK_BIN/$cmd" << 'EOF'
#!/bin/bash
exit 127
EOF
    chmod +x "$MOCK_BIN/$cmd"
    # Actually we need command -v to not find it — remove mock and rely on
    # the real command not being in MOCK_BIN. Instead, shadow with a script
    # that exits nonzero for --version but also makes command -v fail.
    # The simplest approach: don't create a mock at all, and ensure the real
    # binary is not accessible. We'll use a subshell with restricted PATH.
    rm -f "$MOCK_BIN/$cmd"
}

# ---------------------------------------------------------------------------
# Test 1: detects node when available
# ---------------------------------------------------------------------------
@test "detects node when available" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN:$PATH'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"Node.js"* ]]
}

# ---------------------------------------------------------------------------
# Test 2: reports missing node with install hint
# ---------------------------------------------------------------------------
@test "reports missing node with install hint" {
    # Only mock npm, tmux, git — no node
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 1 ]
    [[ "$output" == *"https://nodejs.org"* ]]
}

# ---------------------------------------------------------------------------
# Test 3: detects npm when available
# ---------------------------------------------------------------------------
@test "detects npm when available" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.2.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN:$PATH'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"npm"* ]]
}

# ---------------------------------------------------------------------------
# Test 4: reports missing tmux with platform-specific hint
# ---------------------------------------------------------------------------
@test "reports missing tmux with platform-specific hint" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "git" "git version 2.40.0"
    # No tmux mock

    run bash -c "
        export PATH='$MOCK_BIN'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 1 ]
    # Should contain apt or brew install hint
    [[ "$output" == *"apt install tmux"* ]] || [[ "$output" == *"brew install tmux"* ]]
}

# ---------------------------------------------------------------------------
# Test 5: detects git when available
# ---------------------------------------------------------------------------
@test "detects git when available" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN:$PATH'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"git"* ]]
}

# ---------------------------------------------------------------------------
# Test 6: reports missing git with platform hint
# ---------------------------------------------------------------------------
@test "reports missing git with platform hint" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    # No git mock

    run bash -c "
        export PATH='$MOCK_BIN'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 1 ]
    [[ "$output" == *"apt install git"* ]] || [[ "$output" == *"xcode-select"* ]]
}

# ---------------------------------------------------------------------------
# Test 7: claude is optional — missing claude does not cause exit 1
# ---------------------------------------------------------------------------
@test "claude is optional -- missing claude does not cause exit 1" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"
    # No claude mock

    run bash -c "
        export PATH='$MOCK_BIN'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"Claude Code not found"* ]] || [[ "$output" == *"claude"* ]]
}

# ---------------------------------------------------------------------------
# Test 8: claude detected when available
# ---------------------------------------------------------------------------
@test "claude detected when available" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"
    create_mock "claude" "1.0.0"

    run bash -c "
        export PATH='$MOCK_BIN:$PATH'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"Claude Code"* ]] || [[ "$output" == *"claude"* ]]
}

# ---------------------------------------------------------------------------
# Test 9: exits 1 when multiple prerequisites missing
# ---------------------------------------------------------------------------
@test "exits 1 when multiple prerequisites missing" {
    # Only mock git — node, npm, tmux missing
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 1 ]
    [[ "$output" == *"prerequisite"* ]] || [[ "$output" == *"missing"* ]] || [[ "$output" == *"MISSING"* ]]
}

# ---------------------------------------------------------------------------
# Test 10: all required present produces exit 0
# ---------------------------------------------------------------------------
@test "all required present produces exit 0" {
    create_mock "node" "v20.0.0"
    create_mock "npm" "10.0.0"
    create_mock "tmux" "tmux 3.3"
    create_mock "git" "git version 2.40.0"

    run bash -c "
        export PATH='$MOCK_BIN:$PATH'
        export MAGIC_LEVEL=3
        show_ok() { echo \"  OK \$1\"; }
        show_fail() { echo \"  FAIL \$1\"; }
        export -f show_ok show_fail
        source '$SCRIPT_PATH'
    "
    [ "$status" -eq 0 ]
}
