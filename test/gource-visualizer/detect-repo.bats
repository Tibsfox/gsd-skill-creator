#!/usr/bin/env bats
# =============================================================================
# BATS tests for detect-repo.sh -- repository detection and metrics
# =============================================================================
#
# Tests cover: VCS type detection (git, hg, svn), error exits, JSON output
# validity, all metric fields, GitHub URL detection, edge cases.
#
# Phase 398-01 -- Foundation
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
DETECT_SCRIPT="${PROJECT_ROOT}/skills/gource-visualizer/scripts/detect-repo.sh"

setup() {
    TEST_TMPDIR="$(mktemp -d)"
    MOCK_REPO="$TEST_TMPDIR/mock-repo"
    mkdir -p "$MOCK_REPO"

    # Create mock bin directory
    MOCK_BIN="$TEST_TMPDIR/mock-bin"
    mkdir -p "$MOCK_BIN"

    # Mock git -- responds to various subcommands with canned data
    cat > "$MOCK_BIN/git" << 'MOCKEOF'
#!/bin/bash
# Route based on git subcommand
case "$1" in
    -C)
        shift  # skip -C
        shift  # skip path
        subcmd="$1"
        shift
        ;;
    *)
        subcmd="$1"
        shift
        ;;
esac

case "$subcmd" in
    rev-list)
        if echo "$@" | grep -q -- "--count"; then
            echo "42"
        fi
        ;;
    log)
        if echo "$@" | grep -q -- "--reverse"; then
            echo "2020-01-15T10:30:00+00:00"
        else
            echo "2024-06-17T14:22:00+00:00"
        fi
        ;;
    shortlog)
        cat << 'SHORTLOG'
    25	Alice Developer <alice@example.com>
    12	Bob Coder <bob@example.com>
     5	Carol Hacker <carol@example.com>
SHORTLOG
        ;;
    ls-files)
        # Output 150 fake file names
        for i in $(seq 1 150); do
            echo "src/file${i}.ts"
        done
        ;;
    tag)
        echo "v1.0"
        echo "v1.1"
        echo "v2.0"
        ;;
    rev-parse)
        if echo "$@" | grep -q -- "--abbrev-ref"; then
            echo "main"
        fi
        ;;
    remote)
        if echo "$@" | grep -q "get-url"; then
            echo "https://github.com/user/repo.git"
        fi
        ;;
    *)
        exit 0
        ;;
esac
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/git"

    # Save original PATH
    ORIG_PATH="$PATH"
    export PATH="$MOCK_BIN:$ORIG_PATH"
}

teardown() {
    export PATH="$ORIG_PATH"
    rm -rf "$TEST_TMPDIR"
}

# Helper: extract JSON from output (filters out [detect-repo] stderr lines)
get_json() {
    echo "$output" | grep -v '^\[detect-repo\]'
}

# ---------------------------------------------------------------------------
# Test 1: Exits 1 when path does not exist
# ---------------------------------------------------------------------------
@test "exits 1 when path does not exist" {
    run "$DETECT_SCRIPT" "/nonexistent/path/that/doesnt/exist"
    [ "$status" -eq 1 ]
}

# ---------------------------------------------------------------------------
# Test 2: Exits 2 when path has no VCS
# ---------------------------------------------------------------------------
@test "exits 2 when path has no VCS directory" {
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 2 ]
}

# ---------------------------------------------------------------------------
# Test 3: Detects git repository
# ---------------------------------------------------------------------------
@test "detects git repository" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    get_json | jq -e '.vcs_type == "git"'
}

# ---------------------------------------------------------------------------
# Test 4: Detects mercurial repository
# ---------------------------------------------------------------------------
@test "detects mercurial repository" {
    mkdir -p "$MOCK_REPO/.hg"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    get_json | jq -e '.vcs_type == "hg"'
}

# ---------------------------------------------------------------------------
# Test 5: Detects svn repository
# ---------------------------------------------------------------------------
@test "detects svn repository" {
    mkdir -p "$MOCK_REPO/.svn"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    get_json | jq -e '.vcs_type == "svn"'
}

# ---------------------------------------------------------------------------
# Test 6: Outputs valid JSON
# ---------------------------------------------------------------------------
@test "outputs valid JSON" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    # Must be valid JSON
    get_json | jq . > /dev/null
}

# ---------------------------------------------------------------------------
# Test 7: JSON contains correct commit_count
# ---------------------------------------------------------------------------
@test "JSON contains correct commit_count" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    local count
    count=$(get_json | jq '.commit_count')
    [ "$count" -eq 42 ]
}

# ---------------------------------------------------------------------------
# Test 8: JSON contains correct contributor_count and contributors array
# ---------------------------------------------------------------------------
@test "JSON contains correct contributor_count and contributors" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    local count
    count=$(get_json | jq '.contributor_count')
    [ "$count" -eq 3 ]
    # Check contributors array has 3 entries
    local arr_len
    arr_len=$(get_json | jq '.contributors | length')
    [ "$arr_len" -eq 3 ]
    # Check first contributor has name, email, commits fields
    get_json | jq -e '.contributors[0].name' > /dev/null
    get_json | jq -e '.contributors[0].email' > /dev/null
    get_json | jq -e '.contributors[0].commits' > /dev/null
}

# ---------------------------------------------------------------------------
# Test 9: JSON contains correct date range fields
# ---------------------------------------------------------------------------
@test "JSON contains date range fields" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    get_json | jq -e '.first_commit_date' > /dev/null
    get_json | jq -e '.last_commit_date' > /dev/null
    get_json | jq -e '.date_range_days' > /dev/null
    # date_range_days should be a positive integer
    local days
    days=$(get_json | jq '.date_range_days')
    [ "$days" -gt 0 ]
}

# ---------------------------------------------------------------------------
# Test 10: JSON contains file_count, tag_count, branch, remote_url, is_github
# ---------------------------------------------------------------------------
@test "JSON contains all required fields" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    get_json | jq -e '.file_count' > /dev/null
    get_json | jq -e '.tag_count' > /dev/null
    get_json | jq -e '.branch' > /dev/null
    get_json | jq -e '.remote_url' > /dev/null
    get_json | jq -e '.is_github' > /dev/null
    # Validate specific values
    local file_count
    file_count=$(get_json | jq '.file_count')
    [ "$file_count" -eq 150 ]
    local tag_count
    tag_count=$(get_json | jq '.tag_count')
    [ "$tag_count" -eq 3 ]
    local branch
    branch=$(get_json | jq -r '.branch')
    [ "$branch" = "main" ]
}

# ---------------------------------------------------------------------------
# Test 11: Detects GitHub from HTTPS remote URL
# ---------------------------------------------------------------------------
@test "detects GitHub from HTTPS remote URL" {
    mkdir -p "$MOCK_REPO/.git"
    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    local is_github
    is_github=$(get_json | jq '.is_github')
    [ "$is_github" = "true" ]
}

# ---------------------------------------------------------------------------
# Test 12: Detects GitHub from SSH remote URL
# ---------------------------------------------------------------------------
@test "detects GitHub from SSH remote URL" {
    mkdir -p "$MOCK_REPO/.git"

    # Override git mock with SSH remote
    cat > "$MOCK_BIN/git" << 'MOCKEOF'
#!/bin/bash
case "$1" in
    -C) shift; shift; subcmd="$1"; shift ;;
    *) subcmd="$1"; shift ;;
esac
case "$subcmd" in
    rev-list) echo "42" ;;
    log)
        if echo "$@" | grep -q -- "--reverse"; then
            echo "2020-01-15T10:30:00+00:00"
        else
            echo "2024-06-17T14:22:00+00:00"
        fi
        ;;
    shortlog) echo "    25	Alice Dev <alice@example.com>" ;;
    ls-files) echo "src/main.ts" ;;
    tag) ;;
    rev-parse) echo "main" ;;
    remote) echo "git@github.com:user/repo.git" ;;
    *) ;;
esac
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/git"

    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    local is_github
    is_github=$(get_json | jq '.is_github')
    [ "$is_github" = "true" ]
}

# ---------------------------------------------------------------------------
# Test 13: Handles repo with zero tags gracefully
# ---------------------------------------------------------------------------
@test "handles repo with zero tags gracefully" {
    mkdir -p "$MOCK_REPO/.git"

    # Override git mock with no tags
    cat > "$MOCK_BIN/git" << 'MOCKEOF'
#!/bin/bash
case "$1" in
    -C) shift; shift; subcmd="$1"; shift ;;
    *) subcmd="$1"; shift ;;
esac
case "$subcmd" in
    rev-list) echo "10" ;;
    log)
        if echo "$@" | grep -q -- "--reverse"; then
            echo "2023-01-01T00:00:00+00:00"
        else
            echo "2023-12-31T00:00:00+00:00"
        fi
        ;;
    shortlog) echo "    10	Solo Dev <solo@test.com>" ;;
    ls-files) echo "file.txt" ;;
    tag) ;;
    rev-parse) echo "main" ;;
    remote) echo "" ;;
    *) ;;
esac
exit 0
MOCKEOF
    chmod +x "$MOCK_BIN/git"

    run "$DETECT_SCRIPT" "$MOCK_REPO"
    [ "$status" -eq 0 ]
    local tag_count
    tag_count=$(get_json | jq '.tag_count')
    [ "$tag_count" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Test 14: Defaults to current directory when no argument given
# ---------------------------------------------------------------------------
@test "defaults to current directory when no argument given" {
    mkdir -p "$MOCK_REPO/.git"
    cd "$MOCK_REPO"
    run "$DETECT_SCRIPT"
    [ "$status" -eq 0 ]
    get_json | jq -e '.vcs_type == "git"'
}
