#!/usr/bin/env bash
# =============================================================================
# test-generate-log.sh -- Tests for generate-log.sh (Gource custom log output)
# =============================================================================
#
# Tests that generate-log.sh produces valid Gource custom log format from a
# git repository. Creates temporary fixture repos for each test run.
#
# Phase 399-01 -- Log Generation (RED)
# =============================================================================

set -euo pipefail

PASS=0; FAIL=0; ERRORS=""
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GENERATE_LOG="$SCRIPT_DIR/scripts/generate-log.sh"

# ---------------------------------------------------------------------------
# Test harness
# ---------------------------------------------------------------------------

assert_eq() {
    if [[ "$1" == "$2" ]]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+="  FAIL: $3 -- expected '$2', got '$1'\n"
    fi
}

assert_true() {
    if eval "$1"; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+="  FAIL: $2\n"
    fi
}

assert_false() {
    if ! eval "$1"; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+="  FAIL: $2 (expected failure)\n"
    fi
}

assert_exit() {
    local expected=$1; shift
    local actual
    set +e; "$@" >/dev/null 2>&1; actual=$?; set -e
    if [[ "$actual" -eq "$expected" ]]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+="  FAIL: expected exit $expected, got $actual -- $*\n"
    fi
}

report() {
    echo ""
    echo "Results: $PASS passed, $FAIL failed"
    if [[ $FAIL -gt 0 ]]; then printf "%b" "$ERRORS"; exit 1; fi
}
trap report EXIT

# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

CLEANUP_DIRS=()

create_test_repo() {
    local dir
    dir=$(mktemp -d)
    CLEANUP_DIRS+=("$dir")
    (
        cd "$dir"
        git init -b main . >/dev/null 2>&1
        git config user.email "test@test.com"
        git config user.name "Test User"
        echo "file1" > file1.txt
        git add file1.txt
        git commit -m "initial commit" >/dev/null 2>&1
        mkdir -p sub
        echo "file2" > sub/file2.txt
        git add sub/file2.txt
        git commit -m "add subdir file" >/dev/null 2>&1
    )
    echo "$dir"
}

create_empty_repo() {
    local dir
    dir=$(mktemp -d)
    CLEANUP_DIRS+=("$dir")
    (
        cd "$dir"
        git init -b main . >/dev/null 2>&1
        git config user.email "test@test.com"
        git config user.name "Test User"
    )
    echo "$dir"
}

cleanup_all() {
    for d in "${CLEANUP_DIRS[@]}"; do
        rm -rf "$d" 2>/dev/null || true
    done
}
trap 'cleanup_all; report' EXIT

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

echo "=== test-generate-log.sh ==="

# Test 1: produces output
test_produces_output() {
    echo "  test_produces_output..."
    local repo outfile
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    "$GENERATE_LOG" "$repo" "$outfile" 2>/dev/null
    local lines
    lines=$(wc -l < "$outfile" | tr -d '[:space:]')
    assert_true "[[ $lines -gt 0 ]]" "output file should have > 0 lines (got $lines)"
}

# Test 2: format validation -- each line matches Gource custom log format
test_format_validation() {
    echo "  test_format_validation..."
    local repo outfile
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    "$GENERATE_LOG" "$repo" "$outfile" 2>/dev/null
    local bad_lines
    bad_lines=$(grep -cvE '^[0-9]+\|[^|]+\|[AMD]\|/[^|]*(|[0-9A-Fa-f]{6})?$' "$outfile" 2>/dev/null || true)
    assert_eq "$bad_lines" "0" "all lines should match Gource custom log format"
}

# Test 3: timestamp is integer
test_timestamp_is_integer() {
    echo "  test_timestamp_is_integer..."
    local repo outfile
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    "$GENERATE_LOG" "$repo" "$outfile" 2>/dev/null
    local bad_ts
    bad_ts=$(awk -F'|' '$1 !~ /^[0-9]+$/ || $1 <= 0' "$outfile" | wc -l | tr -d '[:space:]')
    assert_eq "$bad_ts" "0" "all timestamps should be positive integers"
}

# Test 4: type field is one of A, M, D
test_type_field_valid() {
    echo "  test_type_field_valid..."
    local repo outfile
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    "$GENERATE_LOG" "$repo" "$outfile" 2>/dev/null
    local bad_types
    bad_types=$(awk -F'|' '$3 !~ /^[AMD]$/' "$outfile" | wc -l | tr -d '[:space:]')
    assert_eq "$bad_types" "0" "all type fields should be A, M, or D"
}

# Test 5: path starts with /
test_path_starts_with_slash() {
    echo "  test_path_starts_with_slash..."
    local repo outfile
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    "$GENERATE_LOG" "$repo" "$outfile" 2>/dev/null
    local bad_paths
    bad_paths=$(awk -F'|' '$4 !~ /^\//' "$outfile" | wc -l | tr -d '[:space:]')
    assert_eq "$bad_paths" "0" "all paths should start with /"
}

# Test 6: stdout mode (no output file arg)
test_stdout_mode() {
    echo "  test_stdout_mode..."
    local repo output
    repo=$(create_test_repo)
    output=$("$GENERATE_LOG" "$repo" 2>/dev/null)
    local lines
    lines=$(echo "$output" | wc -l | tr -d '[:space:]')
    assert_true "[[ $lines -gt 0 ]]" "stdout mode should produce > 0 lines (got $lines)"
}

# Test 7: stats report on stderr
test_stats_report() {
    echo "  test_stats_report..."
    local repo outfile stderr_out
    repo=$(create_test_repo)
    outfile=$(mktemp)
    CLEANUP_DIRS+=("$outfile")
    stderr_out=$("$GENERATE_LOG" "$repo" "$outfile" 2>&1 1>/dev/null || true)
    assert_true "echo '$stderr_out' | grep -qi 'entries'" "stderr should contain 'entries'"
    assert_true "echo '$stderr_out' | grep -qi 'users'" "stderr should contain 'users'"
}

# Test 8: non-repo exits nonzero
test_non_repo_exits_nonzero() {
    echo "  test_non_repo_exits_nonzero..."
    local tmpdir
    tmpdir=$(mktemp -d)
    CLEANUP_DIRS+=("$tmpdir")
    assert_false "'$GENERATE_LOG' '$tmpdir' /dev/null 2>/dev/null" \
        "running on non-repo should exit nonzero"
}

# Test 9: empty repo (no commits) handled gracefully
test_empty_repo() {
    echo "  test_empty_repo..."
    local repo stderr_out exit_code
    repo=$(create_empty_repo)
    set +e
    stderr_out=$("$GENERATE_LOG" "$repo" 2>&1 1>/dev/null)
    exit_code=$?
    set -e
    # Should not crash (exit 0), and should warn on stderr
    assert_eq "$exit_code" "0" "empty repo should exit 0 (graceful)"
    assert_true "echo '$stderr_out' | grep -qi 'warn\|no commits\|empty'" \
        "stderr should contain warning about empty/no commits"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

test_produces_output
test_format_validation
test_timestamp_is_integer
test_type_field_valid
test_path_starts_with_slash
test_stdout_mode
test_stats_report
test_non_repo_exits_nonzero
test_empty_repo
