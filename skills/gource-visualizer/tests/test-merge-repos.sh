#!/usr/bin/env bash
# =============================================================================
# test-merge-repos.sh -- Tests for merge-repos.sh (multi-repo log merging)
# =============================================================================
#
# Tests that merge-repos.sh correctly merges Gource custom logs from multiple
# repositories with namespace prefixing, color coding, and chronological sort.
#
# Phase 399-01 -- Log Generation (RED)
# =============================================================================

set -euo pipefail

PASS=0; FAIL=0; ERRORS=""
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MERGE_REPOS="$SCRIPT_DIR/scripts/merge-repos.sh"
GENERATE_LOG="$SCRIPT_DIR/scripts/generate-log.sh"

# ---------------------------------------------------------------------------
# Test harness
# ---------------------------------------------------------------------------

assert_eq() {
    if [[ "$1" == "$2" ]]; then
        ((PASS++))
    else
        ((FAIL++))
        ERRORS+="  FAIL: $3 -- expected '$2', got '$1'\n"
    fi
}

assert_true() {
    if eval "$1"; then
        ((PASS++))
    else
        ((FAIL++))
        ERRORS+="  FAIL: $2\n"
    fi
}

assert_false() {
    if ! eval "$1"; then
        ((PASS++))
    else
        ((FAIL++))
        ERRORS+="  FAIL: $2 (expected failure)\n"
    fi
}

assert_exit() {
    local expected=$1; shift
    local actual
    set +e; "$@" >/dev/null 2>&1; actual=$?; set -e
    if [[ "$actual" -eq "$expected" ]]; then
        ((PASS++))
    else
        ((FAIL++))
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
CLEANUP_FILES=()

create_named_repo() {
    local name="$1"
    local base
    base=$(mktemp -d)
    local dir="$base/$name"
    mkdir -p "$dir"
    CLEANUP_DIRS+=("$base")
    (
        cd "$dir"
        git init -b main . >/dev/null 2>&1
        git config user.email "test@test.com"
        git config user.name "Test User"
        echo "file1" > file1.txt
        git add file1.txt
        GIT_COMMITTER_DATE="2025-01-01T00:00:00" \
        GIT_AUTHOR_DATE="2025-01-01T00:00:00" \
        git commit -m "initial commit in $name" >/dev/null 2>&1
        mkdir -p src
        echo "code" > src/main.sh
        git add src/main.sh
        GIT_COMMITTER_DATE="2025-06-15T12:00:00" \
        GIT_AUTHOR_DATE="2025-06-15T12:00:00" \
        git commit -m "add source in $name" >/dev/null 2>&1
    )
    echo "$dir"
}

create_tiny_repo() {
    local name="$1"
    local base
    base=$(mktemp -d)
    local dir="$base/$name"
    mkdir -p "$dir"
    CLEANUP_DIRS+=("$base")
    (
        cd "$dir"
        git init -b main . >/dev/null 2>&1
        git config user.email "test@test.com"
        git config user.name "Test User"
        echo "data" > data.txt
        git add data.txt
        git commit -m "init $name" >/dev/null 2>&1
    )
    echo "$dir"
}

cleanup_all() {
    for d in "${CLEANUP_DIRS[@]}"; do
        rm -rf "$d" 2>/dev/null || true
    done
    for f in "${CLEANUP_FILES[@]}"; do
        rm -f "$f" 2>/dev/null || true
    done
}
trap 'cleanup_all; report' EXIT

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

echo "=== test-merge-repos.sh ==="

# Test 1: no args exits 1
test_no_args_exits_1() {
    echo "  test_no_args_exits_1..."
    assert_exit 1 "$MERGE_REPOS"
}

# Test 2: invalid repo path exits 2
test_invalid_repo_exits_2() {
    echo "  test_invalid_repo_exits_2..."
    assert_exit 2 "$MERGE_REPOS" "/nonexistent/path/that/does/not/exist"
}

# Test 3: single repo merge -- output has lines with namespace prefix
test_single_repo_merge() {
    echo "  test_single_repo_merge..."
    local repo outfile
    repo=$(create_named_repo "myproject")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --output "$outfile" "$repo" 2>/dev/null
    local lines
    lines=$(wc -l < "$outfile" | tr -d '[:space:]')
    assert_true "[[ $lines -gt 0 ]]" "single repo merge should produce output (got $lines lines)"
    local ns_lines
    ns_lines=$(grep -c '/myproject/' "$outfile" || true)
    assert_eq "$ns_lines" "$lines" "all lines should have /myproject/ namespace prefix"
}

# Test 4: two repos get distinct namespace prefixes
test_two_repo_namespacing() {
    echo "  test_two_repo_namespacing..."
    local repo1 repo2 outfile
    repo1=$(create_named_repo "alpha")
    repo2=$(create_named_repo "beta")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --output "$outfile" "$repo1" "$repo2" 2>/dev/null
    local alpha_count beta_count
    alpha_count=$(grep -c '/alpha/' "$outfile" || true)
    beta_count=$(grep -c '/beta/' "$outfile" || true)
    assert_true "[[ $alpha_count -gt 0 ]]" "output should contain /alpha/ namespace"
    assert_true "[[ $beta_count -gt 0 ]]" "output should contain /beta/ namespace"
}

# Test 5: chronological sort -- timestamps ascending
test_chronological_sort() {
    echo "  test_chronological_sort..."
    local repo1 repo2 outfile
    repo1=$(create_named_repo "first")
    repo2=$(create_named_repo "second")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --output "$outfile" "$repo1" "$repo2" 2>/dev/null
    local sorted
    sorted=$(awk -F'|' '
        BEGIN { prev = 0; ok = 1 }
        {
            ts = $1 + 0
            if (ts < prev) { ok = 0; exit }
            prev = ts
        }
        END { print ok }
    ' "$outfile")
    assert_eq "$sorted" "1" "timestamps should be in ascending order"
}

# Test 6: --color flag adds hex color to each line
test_color_flag() {
    echo "  test_color_flag..."
    local repo outfile
    repo=$(create_named_repo "colored")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --color --output "$outfile" "$repo" 2>/dev/null
    local bad_colors
    bad_colors=$(awk -F'|' 'NF >= 5 && $NF !~ /^[0-9A-Fa-f]{6}$/' "$outfile" | wc -l | tr -d '[:space:]')
    assert_eq "$bad_colors" "0" "with --color, last field should be 6-char hex"
    # Verify all lines have a color field
    local no_color
    no_color=$(awk -F'|' 'NF < 5' "$outfile" | wc -l | tr -d '[:space:]')
    assert_eq "$no_color" "0" "with --color, all lines should have 5 fields"
}

# Test 7: color palette assignment (first repo FF6B6B, second 4ECDC4)
test_color_palette_assignment() {
    echo "  test_color_palette_assignment..."
    local repo1 repo2 outfile
    repo1=$(create_named_repo "proj1")
    repo2=$(create_named_repo "proj2")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --color --output "$outfile" "$repo1" "$repo2" 2>/dev/null
    local color1 color2
    color1=$(grep '/proj1/' "$outfile" | head -1 | awk -F'|' '{print $NF}')
    color2=$(grep '/proj2/' "$outfile" | head -1 | awk -F'|' '{print $NF}')
    assert_eq "$color1" "FF6B6B" "first repo should get FF6B6B (Coral)"
    assert_eq "$color2" "4ECDC4" "second repo should get 4ECDC4 (Teal)"
}

# Test 8: color cycling -- 9th repo gets same color as 1st
test_color_cycling() {
    echo "  test_color_cycling..."
    local repos=()
    for i in $(seq 1 9); do
        repos+=("$(create_tiny_repo "repo$i")")
    done
    local outfile
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --color --output "$outfile" "${repos[@]}" 2>/dev/null
    local color1 color9
    color1=$(grep '/repo1/' "$outfile" | head -1 | awk -F'|' '{print $NF}')
    color9=$(grep '/repo9/' "$outfile" | head -1 | awk -F'|' '{print $NF}')
    assert_eq "$color1" "FF6B6B" "repo1 should get FF6B6B"
    assert_eq "$color9" "FF6B6B" "repo9 should cycle back to FF6B6B"
}

# Test 9: --output flag creates the specified file
test_output_flag() {
    echo "  test_output_flag..."
    local repo outdir outfile
    repo=$(create_named_repo "outtest")
    outdir=$(mktemp -d)
    CLEANUP_DIRS+=("$outdir")
    outfile="$outdir/custom.log"
    "$MERGE_REPOS" --output "$outfile" "$repo" 2>/dev/null
    assert_true "[[ -f '$outfile' ]]" "output file custom.log should exist"
}

# Test 10: stderr metadata contains expected fields
test_stderr_metadata() {
    echo "  test_stderr_metadata..."
    local repo outfile stderr_out
    repo=$(create_named_repo "metarepo")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    stderr_out=$("$MERGE_REPOS" --output "$outfile" "$repo" 2>&1 1>/dev/null || true)
    assert_true "echo '$stderr_out' | grep -q '\\[merge-repos\\]'" "stderr should contain [merge-repos]"
    assert_true "echo '$stderr_out' | grep -qi 'entries'" "stderr should contain 'entries'"
    assert_true "echo '$stderr_out' | grep -qi 'date range\\|Date range'" "stderr should contain 'Date range'"
}

# Test 11: three repos all get namespace prefixes
test_three_repo_all_namespaces() {
    echo "  test_three_repo_all_namespaces..."
    local repo1 repo2 repo3 outfile
    repo1=$(create_named_repo "aaa")
    repo2=$(create_named_repo "bbb")
    repo3=$(create_named_repo "ccc")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    "$MERGE_REPOS" --output "$outfile" "$repo1" "$repo2" "$repo3" 2>/dev/null
    assert_true "grep -q '/aaa/' '$outfile'" "output should contain /aaa/ namespace"
    assert_true "grep -q '/bbb/' '$outfile'" "output should contain /bbb/ namespace"
    assert_true "grep -q '/ccc/' '$outfile'" "output should contain /ccc/ namespace"
}

# Test 12: empty combined log exits 4
test_empty_combined_exits_4() {
    echo "  test_empty_combined_exits_4..."
    # Create a mock generate-log.sh that produces empty output
    local mock_dir
    mock_dir=$(mktemp -d)
    CLEANUP_DIRS+=("$mock_dir")
    mkdir -p "$mock_dir/scripts"
    # Create a mock generate-log.sh that creates an empty file
    cat > "$mock_dir/scripts/generate-log.sh" << 'MOCK'
#!/usr/bin/env bash
# Mock generate-log.sh that produces empty output
if [[ -n "${2:-}" ]]; then
    : > "$2"
else
    true
fi
exit 0
MOCK
    chmod +x "$mock_dir/scripts/generate-log.sh"
    # Copy merge-repos.sh to mock dir so it finds mock generate-log.sh
    cp "$SCRIPT_DIR/scripts/merge-repos.sh" "$mock_dir/scripts/merge-repos.sh"
    chmod +x "$mock_dir/scripts/merge-repos.sh"
    local repo outfile
    repo=$(create_named_repo "emptytest")
    outfile=$(mktemp)
    CLEANUP_FILES+=("$outfile")
    assert_exit 4 "$mock_dir/scripts/merge-repos.sh" --output "$outfile" "$repo"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

test_no_args_exits_1
test_invalid_repo_exits_2
test_single_repo_merge
test_two_repo_namespacing
test_chronological_sort
test_color_flag
test_color_palette_assignment
test_color_cycling
test_output_flag
test_stderr_metadata
test_three_repo_all_namespaces
test_empty_combined_exits_4
