#!/usr/bin/env bats
# =============================================================================
# BATS tests for bootstrap.sh — main bootstrap sequence
# =============================================================================
#
# Tests cover: archive creation, zip moves, .planning/ directory tree,
# magic-level config, tmux session management, idempotency, safety
# guarantees (no sudo, no file deletion), git init, magic level output.
#
# Phase 378-01 — Bootstrap
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
BOOTSTRAP_SCRIPT="${PROJECT_ROOT}/bootstrap.sh"

setup() {
    TEST_TMPDIR="$(mktemp -d)"
    GSD_ROOT="$TEST_TMPDIR/gsd-project"
    mkdir -p "$GSD_ROOT"

    # Create mock bin directory with all required commands
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"

    # Mock node
    cat > "$MOCK_BIN/node" << 'EOF'
#!/bin/bash
if [ "$1" = "--version" ]; then echo "v20.0.0"; fi
exit 0
EOF
    chmod +x "$MOCK_BIN/node"

    # Mock npm (no-op for install/build)
    cat > "$MOCK_BIN/npm" << 'EOF'
#!/bin/bash
exit 0
EOF
    chmod +x "$MOCK_BIN/npm"

    # Mock git
    MOCK_GIT_CALLS="$TEST_TMPDIR/git-calls.log"
    cat > "$MOCK_BIN/git" << EOF
#!/bin/bash
echo "git \$@" >> "$MOCK_GIT_CALLS"
if [ "\$1" = "--version" ]; then
    echo "git version 2.40.0"
elif [ "\$1" = "init" ]; then
    mkdir -p "\$2/.git"
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/git"

    # Mock tmux — track calls
    MOCK_TMUX_CALLS="$TEST_TMPDIR/tmux-calls.log"
    # Default: no existing session (has-session returns 1)
    cat > "$MOCK_BIN/tmux" << EOF
#!/bin/bash
echo "tmux \$@" >> "$MOCK_TMUX_CALLS"
if [ "\$1" = "--version" ]; then
    echo "tmux 3.3"
elif [ "\$1" = "has-session" ]; then
    exit 1
elif [ "\$1" = "new-session" ]; then
    exit 0
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/tmux"

    # Mock sudo — should never be called; if called, record it
    MOCK_SUDO_CALLS="$TEST_TMPDIR/sudo-calls.log"
    cat > "$MOCK_BIN/sudo" << EOF
#!/bin/bash
echo "sudo \$@" >> "$MOCK_SUDO_CALLS"
exit 1
EOF
    chmod +x "$MOCK_BIN/sudo"

    # Copy bootstrap.sh into our test GSD_ROOT
    if [ -f "$BOOTSTRAP_SCRIPT" ]; then
        cp "$BOOTSTRAP_SCRIPT" "$GSD_ROOT/bootstrap.sh"
        chmod +x "$GSD_ROOT/bootstrap.sh"
    fi

    # Copy scripts/check-prerequisites.sh
    if [ -d "$PROJECT_ROOT/scripts" ]; then
        mkdir -p "$GSD_ROOT/scripts"
        cp "$PROJECT_ROOT/scripts/check-prerequisites.sh" "$GSD_ROOT/scripts/" 2>/dev/null || true
        chmod +x "$GSD_ROOT/scripts/check-prerequisites.sh" 2>/dev/null || true
    fi

    # Save and override PATH
    ORIG_PATH="$PATH"
    export PATH="$MOCK_BIN:$PATH"
}

teardown() {
    export PATH="$ORIG_PATH"
    rm -rf "$TEST_TMPDIR"
}

# ---------------------------------------------------------------------------
# Test 1: creates archive directory
# ---------------------------------------------------------------------------
@test "creates archive directory" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    [ -d "$GSD_ROOT/archive" ]
}

# ---------------------------------------------------------------------------
# Test 2: moves zip files to archive
# ---------------------------------------------------------------------------
@test "moves zip files to archive" {
    touch "$GSD_ROOT/test.zip"
    touch "$GSD_ROOT/another.zip"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Zips should be in archive, not in root
    [ ! -f "$GSD_ROOT/test.zip" ]
    [ ! -f "$GSD_ROOT/another.zip" ]
    [ -f "$GSD_ROOT/archive/test.zip" ]
    [ -f "$GSD_ROOT/archive/another.zip" ]
}

# ---------------------------------------------------------------------------
# Test 3: initializes .planning/ directory tree
# ---------------------------------------------------------------------------
@test "initializes .planning/ directory tree" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Check all required subdirectories
    [ -d "$GSD_ROOT/.planning/conversations" ]
    [ -d "$GSD_ROOT/.planning/staging/intake" ]
    [ -d "$GSD_ROOT/.planning/staging/processed" ]
    [ -d "$GSD_ROOT/.planning/staging/quarantine" ]
    [ -d "$GSD_ROOT/.planning/missions" ]
    [ -d "$GSD_ROOT/.planning/console/inbox/pending" ]
    [ -d "$GSD_ROOT/.planning/console/outbox/status" ]
    [ -d "$GSD_ROOT/.planning/console/outbox/questions" ]
    [ -d "$GSD_ROOT/.planning/console/outbox/notifications" ]
    [ -d "$GSD_ROOT/.planning/config" ]
}

# ---------------------------------------------------------------------------
# Test 4: writes magic-level.json to config
# ---------------------------------------------------------------------------
@test "writes magic-level.json to config" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    [ -f "$GSD_ROOT/.planning/config/magic-level.json" ]
    # Must contain "level" key
    grep -q '"level"' "$GSD_ROOT/.planning/config/magic-level.json"
}

# ---------------------------------------------------------------------------
# Test 5: default magic level is 3
# ---------------------------------------------------------------------------
@test "default magic level is 3" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    grep -q '"level": 3' "$GSD_ROOT/.planning/config/magic-level.json" || \
    grep -q '"level":3' "$GSD_ROOT/.planning/config/magic-level.json"
}

# ---------------------------------------------------------------------------
# Test 6: respects --magic argument
# ---------------------------------------------------------------------------
@test "respects --magic argument" {
    run "$GSD_ROOT/bootstrap.sh" --magic 5
    [ "$status" -eq 0 ]
    grep -q '"level": 5' "$GSD_ROOT/.planning/config/magic-level.json" || \
    grep -q '"level":5' "$GSD_ROOT/.planning/config/magic-level.json"
}

# ---------------------------------------------------------------------------
# Test 7: respects positional magic level
# ---------------------------------------------------------------------------
@test "respects positional magic level" {
    run "$GSD_ROOT/bootstrap.sh" 1
    [ "$status" -eq 0 ]
    grep -q '"level": 1' "$GSD_ROOT/.planning/config/magic-level.json" || \
    grep -q '"level":1' "$GSD_ROOT/.planning/config/magic-level.json"
}

# ---------------------------------------------------------------------------
# Test 8: starts tmux session named gsd
# ---------------------------------------------------------------------------
@test "starts tmux session named gsd" {
    # Default mock: has-session returns 1 (no existing session)
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Verify tmux new-session was called with -s gsd
    grep -q "new-session.*-s gsd" "$MOCK_TMUX_CALLS" || \
    grep -q "new-session.*gsd" "$MOCK_TMUX_CALLS"
}

# ---------------------------------------------------------------------------
# Test 9: idempotent — second run produces no errors
# ---------------------------------------------------------------------------
@test "idempotent -- second run produces no errors" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Reset tmux mock to simulate session already exists for second run
    cat > "$MOCK_BIN/tmux" << EOF
#!/bin/bash
echo "tmux \$@" >> "$MOCK_TMUX_CALLS"
if [ "\$1" = "--version" ]; then
    echo "tmux 3.3"
elif [ "\$1" = "has-session" ]; then
    exit 0
elif [ "\$1" = "new-session" ]; then
    exit 0
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/tmux"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Directories still exist
    [ -d "$GSD_ROOT/archive" ]
    [ -d "$GSD_ROOT/.planning" ]
}

# ---------------------------------------------------------------------------
# Test 10: idempotent — does not duplicate directories
# ---------------------------------------------------------------------------
@test "idempotent -- does not duplicate directories" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    local first_count
    first_count=$(find "$GSD_ROOT/.planning" -type d | wc -l)

    # Reset tmux mock for second run
    cat > "$MOCK_BIN/tmux" << EOF
#!/bin/bash
echo "tmux \$@" >> "$MOCK_TMUX_CALLS"
if [ "\$1" = "--version" ]; then echo "tmux 3.3"
elif [ "\$1" = "has-session" ]; then exit 0
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/tmux"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    local second_count
    second_count=$(find "$GSD_ROOT/.planning" -type d | wc -l)

    [ "$first_count" -eq "$second_count" ]
}

# ---------------------------------------------------------------------------
# Test 11: idempotent — existing tmux session detected
# ---------------------------------------------------------------------------
@test "idempotent -- existing tmux session detected" {
    # Mock tmux: has-session returns 0 (session exists)
    cat > "$MOCK_BIN/tmux" << EOF
#!/bin/bash
echo "tmux \$@" >> "$MOCK_TMUX_CALLS"
if [ "\$1" = "--version" ]; then
    echo "tmux 3.3"
elif [ "\$1" = "has-session" ]; then
    exit 0
elif [ "\$1" = "new-session" ]; then
    exit 0
fi
exit 0
EOF
    chmod +x "$MOCK_BIN/tmux"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    [[ "$output" == *"already"* ]] || [[ "$output" == *"running"* ]]

    # Verify new-session was NOT called
    ! grep -q "new-session" "$MOCK_TMUX_CALLS"
}

# ---------------------------------------------------------------------------
# Test 12: never calls sudo
# ---------------------------------------------------------------------------
@test "never calls sudo" {
    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]
    [ ! -f "$MOCK_SUDO_CALLS" ]
}

# ---------------------------------------------------------------------------
# Test 13: never deletes files
# ---------------------------------------------------------------------------
@test "never deletes files" {
    # Create sentinel files
    touch "$GSD_ROOT/sentinel-file-1.txt"
    touch "$GSD_ROOT/sentinel-file-2.txt"
    mkdir -p "$GSD_ROOT/sentinel-dir"
    touch "$GSD_ROOT/sentinel-dir/inner.txt"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # All sentinel files still exist
    [ -f "$GSD_ROOT/sentinel-file-1.txt" ]
    [ -f "$GSD_ROOT/sentinel-file-2.txt" ]
    [ -d "$GSD_ROOT/sentinel-dir" ]
    [ -f "$GSD_ROOT/sentinel-dir/inner.txt" ]
}

# ---------------------------------------------------------------------------
# Test 14: initializes git if not present
# ---------------------------------------------------------------------------
@test "initializes git if not present" {
    # No .git directory in GSD_ROOT
    [ ! -d "$GSD_ROOT/.git" ]

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Git init should have been called
    grep -q "git init" "$MOCK_GIT_CALLS"
}

# ---------------------------------------------------------------------------
# Test 15: skips git init if already initialized
# ---------------------------------------------------------------------------
@test "skips git init if already initialized" {
    # Pre-create .git directory
    mkdir -p "$GSD_ROOT/.git"

    run "$GSD_ROOT/bootstrap.sh"
    [ "$status" -eq 0 ]

    # Git init should NOT have been called
    ! grep -q "git init" "$MOCK_GIT_CALLS"
}

# ---------------------------------------------------------------------------
# Test 16: magic level 1 output is minimal
# ---------------------------------------------------------------------------
@test "magic level 1 output is minimal" {
    run "$GSD_ROOT/bootstrap.sh" 1
    [ "$status" -eq 0 ]

    # Should NOT contain verbose step labels
    [[ "$output" != *"Checking prerequisites"* ]]
}

# ---------------------------------------------------------------------------
# Test 17: magic level 5 shows verbose output
# ---------------------------------------------------------------------------
@test "magic level 5 shows verbose output" {
    run "$GSD_ROOT/bootstrap.sh" 5
    [ "$status" -eq 0 ]

    # Should contain step labels
    [[ "$output" == *"prerequisite"* ]] || [[ "$output" == *"Checking"* ]] || \
    [[ "$output" == *"archive"* ]] || [[ "$output" == *"planning"* ]] || \
    [[ "$output" == *"[1/"* ]] || [[ "$output" == *"Step"* ]]
}

# ---------------------------------------------------------------------------
# Test 18: exits cleanly on prerequisite failure
# ---------------------------------------------------------------------------
@test "exits cleanly on prerequisite failure" {
    # Remove node from mock path
    rm -f "$MOCK_BIN/node"

    # Override PATH to only use MOCK_BIN (no real node)
    run bash -c "
        export PATH='$MOCK_BIN'
        '$GSD_ROOT/bootstrap.sh'
    "
    [ "$status" -ne 0 ]

    # .planning/ should NOT have been created (clean exit before partial setup)
    [ ! -d "$GSD_ROOT/.planning/conversations" ]
}
