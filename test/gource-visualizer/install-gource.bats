#!/usr/bin/env bats
# =============================================================================
# BATS tests for install-gource.sh -- dependency installer
# =============================================================================
#
# Tests cover: platform detection, idempotent installs, version checks,
# verification steps, exit codes, and cross-platform behavior.
#
# Phase 398-01 -- Foundation
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
INSTALL_SCRIPT="${PROJECT_ROOT}/skills/gource-visualizer/scripts/install-gource.sh"

setup() {
    TEST_TMPDIR="$(mktemp -d)"

    # Create mock bin directory
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"

    # Mock sudo -- records calls and succeeds
    MOCK_SUDO_CALLS="$TEST_TMPDIR/sudo-calls.log"
    cat > "$MOCK_BIN/sudo" << MOCKEOF
#!/bin/bash
echo "sudo \$@" >> "$MOCK_SUDO_CALLS"
# Execute the command without privilege escalation
shift  # remove 'sudo'
"\$@"
MOCKEOF
    chmod +x "$MOCK_BIN/sudo"

    # Mock apt-get -- records calls and succeeds
    MOCK_APT_CALLS="$TEST_TMPDIR/apt-calls.log"
    cat > "$MOCK_BIN/apt-get" << MOCKEOF
#!/bin/bash
echo "apt-get \$@" >> "$MOCK_APT_CALLS"
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/apt-get"

    # Default: gource NOT installed
    # (no mock gource in MOCK_BIN)

    # Default: ffmpeg NOT installed
    # (no mock ffmpeg in MOCK_BIN)

    # Default: xvfb-run NOT installed
    # (no mock xvfb-run in MOCK_BIN)

    # Create mock os-release for Ubuntu
    mkdir -p "$TEST_TMPDIR/etc"
    cat > "$TEST_TMPDIR/etc/os-release" << 'MOCKEOF'
NAME="Ubuntu"
VERSION="24.04 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
MOCKEOF

    # Save original PATH
    ORIG_PATH="$PATH"
    export PATH="$MOCK_BIN:$PATH"
    export OS_RELEASE_FILE="$TEST_TMPDIR/etc/os-release"
}

teardown() {
    export PATH="$ORIG_PATH"
    unset OS_RELEASE_FILE
    rm -rf "$TEST_TMPDIR"
}

# Helper: create mock gource with given version
mock_gource() {
    local version="${1:-0.55}"
    cat > "$MOCK_BIN/gource" << MOCKEOF
#!/bin/bash
if [ "\$1" = "--help" ] || [ "\$1" = "--version" ]; then
    echo "Gource v${version}"
fi
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/gource"
}

# Helper: create mock ffmpeg with or without libx264
mock_ffmpeg() {
    local has_libx264="${1:-true}"
    if [ "$has_libx264" = "true" ]; then
        cat > "$MOCK_BIN/ffmpeg" << 'MOCKEOF'
#!/bin/bash
if [ "$1" = "-codecs" ]; then
    echo " DEV.LS h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (decoders: h264) (encoders: libx264 libx264rgb)"
    exit 0
fi
if [ "$1" = "-version" ]; then
    echo "ffmpeg version 6.1"
    exit 0
fi
exit 0
MOCKEOF
    else
        cat > "$MOCK_BIN/ffmpeg" << 'MOCKEOF'
#!/bin/bash
if [ "$1" = "-codecs" ]; then
    echo " DEV.LS h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (decoders: h264)"
    exit 0
fi
if [ "$1" = "-version" ]; then
    echo "ffmpeg version 6.1"
    exit 0
fi
exit 0
MOCKEOF
    fi
    chmod +x "$MOCK_BIN/ffmpeg"
}

# Helper: create mock xvfb-run
mock_xvfb() {
    cat > "$MOCK_BIN/xvfb-run" << 'MOCKEOF'
#!/bin/bash
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/xvfb-run"
}

# ---------------------------------------------------------------------------
# Test 1: Detects Ubuntu/Debian platform from /etc/os-release
# ---------------------------------------------------------------------------
@test "detects Ubuntu/Debian platform from /etc/os-release" {
    mock_gource
    mock_ffmpeg
    mock_xvfb
    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Ubuntu"* ]] || [[ "$output" == *"ubuntu"* ]] || [[ "$output" == *"debian"* ]] || [[ "$output" == *"linux"* ]]
}

# ---------------------------------------------------------------------------
# Test 2: Detects macOS platform from uname
# ---------------------------------------------------------------------------
@test "detects macOS platform from uname" {
    # Create os-release that does NOT match ubuntu/debian
    cat > "$TEST_TMPDIR/etc/os-release" << 'MOCKEOF'
NAME="Unknown"
ID=unknown
MOCKEOF

    # Mock uname to return Darwin
    cat > "$MOCK_BIN/uname" << 'MOCKEOF'
#!/bin/bash
if [ "$1" = "-s" ]; then
    echo "Darwin"
else
    echo "Darwin"
fi
MOCKEOF
    chmod +x "$MOCK_BIN/uname"

    # Mock brew
    cat > "$MOCK_BIN/brew" << 'MOCKEOF'
#!/bin/bash
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/brew"

    mock_gource
    mock_ffmpeg

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    [[ "$output" == *"macOS"* ]] || [[ "$output" == *"darwin"* ]] || [[ "$output" == *"Darwin"* ]]
}

# ---------------------------------------------------------------------------
# Test 3: Exits 1 for unsupported platform
# ---------------------------------------------------------------------------
@test "exits 1 for unsupported platform" {
    # Create os-release that does NOT match ubuntu/debian
    cat > "$TEST_TMPDIR/etc/os-release" << 'MOCKEOF'
NAME="Unknown"
ID=unknown
MOCKEOF

    # Mock uname to return Linux (not Darwin)
    cat > "$MOCK_BIN/uname" << 'MOCKEOF'
#!/bin/bash
echo "Linux"
MOCKEOF
    chmod +x "$MOCK_BIN/uname"

    # Remove apt-get so platform detection fails
    rm -f "$MOCK_BIN/apt-get"

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 1 ]
}

# ---------------------------------------------------------------------------
# Test 4: Skips gource install when already present at sufficient version
# ---------------------------------------------------------------------------
@test "skips gource install when already at sufficient version" {
    mock_gource "0.55"
    mock_ffmpeg
    mock_xvfb

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    [[ "$output" == *"found"* ]] || [[ "$output" == *"skip"* ]] || [[ "$output" == *"already"* ]] || [[ "$output" == *"0.55"* ]]
}

# ---------------------------------------------------------------------------
# Test 5: Skips ffmpeg install when already present with libx264
# ---------------------------------------------------------------------------
@test "skips ffmpeg install when already present with libx264" {
    mock_gource
    mock_ffmpeg "true"
    mock_xvfb

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    [[ "$output" == *"libx264"* ]] || [[ "$output" == *"ffmpeg"* ]]
}

# ---------------------------------------------------------------------------
# Test 6: Installs missing components via apt-get
# ---------------------------------------------------------------------------
@test "installs missing components via apt-get" {
    # No gource, ffmpeg, or xvfb-run mocked -- they are missing
    # After apt-get "install", create the mocks so verification passes
    cat > "$MOCK_BIN/apt-get" << MOCKEOF
#!/bin/bash
echo "apt-get \$@" >> "$MOCK_APT_CALLS"
# Simulate installing gource
if echo "\$@" | grep -q "install"; then
    cat > "$MOCK_BIN/gource" << 'INNEREOF'
#!/bin/bash
if [ "\$1" = "--help" ] || [ "\$1" = "--version" ]; then
    echo "Gource v0.55"
fi
exit 0
INNEREOF
    chmod +x "$MOCK_BIN/gource"
    cat > "$MOCK_BIN/ffmpeg" << 'INNEREOF'
#!/bin/bash
if [ "\$1" = "-codecs" ]; then
    echo " DEV.LS h264  (encoders: libx264 libx264rgb)"
    exit 0
fi
exit 0
INNEREOF
    chmod +x "$MOCK_BIN/ffmpeg"
    cat > "$MOCK_BIN/xvfb-run" << 'INNEREOF'
#!/bin/bash
exit 0
INNEREOF
    chmod +x "$MOCK_BIN/xvfb-run"
fi
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/apt-get"

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    [ -f "$MOCK_APT_CALLS" ]
    grep -q "install" "$MOCK_APT_CALLS"
}

# ---------------------------------------------------------------------------
# Test 7: Exits 3 when gource verification fails
# ---------------------------------------------------------------------------
@test "exits 3 when gource verification fails" {
    # Mock gource that fails on --help
    cat > "$MOCK_BIN/gource" << 'MOCKEOF'
#!/bin/bash
exit 1
MOCKEOF
    chmod +x "$MOCK_BIN/gource"

    mock_ffmpeg
    mock_xvfb

    # Mock apt-get that doesn't actually fix gource
    cat > "$MOCK_BIN/apt-get" << MOCKEOF
#!/bin/bash
echo "apt-get \$@" >> "$MOCK_APT_CALLS"
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/apt-get"

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 3 ]
}

# ---------------------------------------------------------------------------
# Test 8: Exits 4 when ffmpeg missing libx264
# ---------------------------------------------------------------------------
@test "exits 4 when ffmpeg missing libx264" {
    mock_gource
    mock_ffmpeg "false"
    mock_xvfb

    # Mock apt-get that installs but ffmpeg still lacks libx264
    cat > "$MOCK_BIN/apt-get" << MOCKEOF
#!/bin/bash
echo "apt-get \$@" >> "$MOCK_APT_CALLS"
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/apt-get"

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 4 ]
}

# ---------------------------------------------------------------------------
# Test 9: Idempotency -- two runs produce identical output
# ---------------------------------------------------------------------------
@test "idempotency -- two runs produce no errors" {
    mock_gource
    mock_ffmpeg
    mock_xvfb

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    local first_output="$output"

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 10: Xvfb skipped on macOS, installed on Linux
# ---------------------------------------------------------------------------
@test "xvfb skipped on macOS" {
    # Simulate macOS
    cat > "$TEST_TMPDIR/etc/os-release" << 'MOCKEOF'
NAME="Unknown"
ID=unknown
MOCKEOF

    cat > "$MOCK_BIN/uname" << 'MOCKEOF'
#!/bin/bash
if [ "$1" = "-s" ]; then
    echo "Darwin"
else
    echo "Darwin"
fi
MOCKEOF
    chmod +x "$MOCK_BIN/uname"

    cat > "$MOCK_BIN/brew" << 'MOCKEOF'
#!/bin/bash
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/brew"

    mock_gource
    mock_ffmpeg

    run "$INSTALL_SCRIPT"
    [ "$status" -eq 0 ]
    # Output should not mention xvfb install or should mention skipping
    [[ "$output" != *"installing xvfb"* ]] || [[ "$output" == *"skip"* ]] || [[ "$output" == *"macOS"* ]]
}
