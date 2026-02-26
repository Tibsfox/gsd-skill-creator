#!/usr/bin/env bash
# =============================================================================
# test-generate-captions.sh -- Tests for generate-captions.sh
# =============================================================================
#
# Validates that generate-captions.sh correctly extracts git tags into
# Gource caption format (timestamp|caption), sorted chronologically.
#
# Uses inline test harness (no external deps). All tests should FAIL when
# production script does not exist yet (RED phase).
#
# Phase 399-02 -- Generation
# =============================================================================

set -euo pipefail

PASS=0; FAIL=0; ERRORS=""
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/generate-captions.sh"

assert_eq() {
  if [[ "$1" == "$2" ]]; then
    ((PASS++)) || true
  else
    ((FAIL++)) || true
    ERRORS+="  FAIL: $3 -- expected '$2', got '$1'\n"
  fi
}

assert_true() {
  if eval "$1"; then
    ((PASS++)) || true
  else
    ((FAIL++)) || true
    ERRORS+="  FAIL: $2\n"
  fi
}

assert_false() {
  if ! eval "$1"; then
    ((PASS++)) || true
  else
    ((FAIL++)) || true
    ERRORS+="  FAIL: $2 (expected failure)\n"
  fi
}

assert_exit() {
  local expected=$1; shift
  local actual
  set +e; "$@" >/dev/null 2>&1; actual=$?; set -e
  if [[ "$actual" -eq "$expected" ]]; then
    ((PASS++)) || true
  else
    ((FAIL++)) || true
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
# Fixture: create a git repo with tags
# ---------------------------------------------------------------------------

create_tagged_repo() {
  local dir
  dir=$(mktemp -d)
  git -C "$dir" init -b main >/dev/null 2>&1
  git -C "$dir" config user.email "alice@example.com"
  git -C "$dir" config user.name "Alice Developer"
  echo "v1" > "$dir/file.txt"
  git -C "$dir" add file.txt
  git -C "$dir" commit -m "initial" >/dev/null 2>&1
  git -C "$dir" tag v1.0.0
  # sleep to ensure distinct timestamps
  sleep 1
  echo "v2" > "$dir/file.txt"
  git -C "$dir" add file.txt
  git -C "$dir" commit -m "feature: improvements" >/dev/null 2>&1
  git -C "$dir" tag v1.1.0
  # Add second contributor
  sleep 1
  git -C "$dir" config user.email "bob@example.com"
  git -C "$dir" config user.name "Bob Builder"
  echo "v3" > "$dir/file2.txt"
  git -C "$dir" add file2.txt
  git -C "$dir" commit -m "bob's contribution" >/dev/null 2>&1
  git -C "$dir" tag v2.0.0
  echo "$dir"
}

create_empty_repo() {
  local dir
  dir=$(mktemp -d)
  git -C "$dir" init -b main >/dev/null 2>&1
  git -C "$dir" config user.email "test@example.com"
  git -C "$dir" config user.name "Test User"
  echo "hello" > "$dir/file.txt"
  git -C "$dir" add file.txt
  git -C "$dir" commit -m "initial commit" >/dev/null 2>&1
  # No tags
  echo "$dir"
}

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

echo "=== test-generate-captions.sh ==="

# -- test_produces_output --
echo "  test_produces_output"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
line_count=$(echo "$output" | grep -c '.' || true)
assert_true "[[ $line_count -ge 3 ]]" "test_produces_output: expected >= 3 lines, got $line_count"
rm -rf "$REPO"

# -- test_format_validation --
echo "  test_format_validation"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
all_valid=true
while IFS= read -r line; do
  if [[ -n "$line" ]] && ! [[ "$line" =~ ^[0-9]+\|.+$ ]]; then
    all_valid=false
    break
  fi
done <<< "$output"
assert_eq "$all_valid" "true" "test_format_validation: all lines match timestamp|caption"
rm -rf "$REPO"

# -- test_timestamps_are_integers --
echo "  test_timestamps_are_integers"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
all_numeric=true
while IFS='|' read -r ts _rest; do
  if [[ -n "$ts" ]] && ! [[ "$ts" =~ ^[0-9]+$ ]]; then
    all_numeric=false
    break
  fi
done <<< "$output"
assert_eq "$all_numeric" "true" "test_timestamps_are_integers: first field is numeric"
rm -rf "$REPO"

# -- test_chronological_order --
echo "  test_chronological_order"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
in_order=true
prev=0
while IFS='|' read -r ts _rest; do
  if [[ -n "$ts" ]] && [[ "$ts" =~ ^[0-9]+$ ]]; then
    if [[ "$ts" -lt "$prev" ]]; then
      in_order=false
      break
    fi
    prev=$ts
  fi
done <<< "$output"
assert_eq "$in_order" "true" "test_chronological_order: timestamps are ascending"
rm -rf "$REPO"

# -- test_tag_names_present --
echo "  test_tag_names_present"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
has_v1=$(echo "$output" | grep -c "v1.0.0" || true)
has_v11=$(echo "$output" | grep -c "v1.1.0" || true)
has_v2=$(echo "$output" | grep -c "v2.0.0" || true)
assert_true "[[ $has_v1 -ge 1 ]]" "test_tag_names_present: v1.0.0 found"
assert_true "[[ $has_v11 -ge 1 ]]" "test_tag_names_present: v1.1.0 found"
assert_true "[[ $has_v2 -ge 1 ]]" "test_tag_names_present: v2.0.0 found"
rm -rf "$REPO"

# -- test_stdout_mode --
echo "  test_stdout_mode"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" 2>/dev/null)
assert_true "[[ -n \"$output\" ]]" "test_stdout_mode: output goes to stdout when no file arg"
rm -rf "$REPO"

# -- test_file_mode --
echo "  test_file_mode"
REPO=$(create_tagged_repo)
OUTFILE=$(mktemp)
"$SCRIPT" "$REPO" "$OUTFILE" >/dev/null 2>&1
assert_true "[[ -s \"$OUTFILE\" ]]" "test_file_mode: output file exists and has content"
rm -f "$OUTFILE"
rm -rf "$REPO"

# -- test_no_tags_empty_output --
echo "  test_no_tags_empty_output"
REPO=$(create_empty_repo)
set +e
output=$("$SCRIPT" "$REPO" 2>/dev/null)
exit_code=$?
set -e
non_empty_lines=$(echo "$output" | grep -c '.' || true)
assert_eq "$exit_code" "0" "test_no_tags_empty_output: exit code is 0"
assert_eq "$non_empty_lines" "0" "test_no_tags_empty_output: output is empty"
rm -rf "$REPO"

# -- test_non_repo_exits_nonzero --
echo "  test_non_repo_exits_nonzero"
TMPDIR_NR=$(mktemp -d)
assert_exit 1 "$SCRIPT" "$TMPDIR_NR"
rm -rf "$TMPDIR_NR"

# -- test_milestone_pattern_flag --
echo "  test_milestone_pattern_flag"
REPO=$(create_tagged_repo)
output=$("$SCRIPT" "$REPO" --milestone-pattern "v1\\." 2>/dev/null)
has_v1=$(echo "$output" | grep -c "v1\." || true)
has_v2=$(echo "$output" | grep -c "v2\." || true)
assert_true "[[ $has_v1 -ge 1 ]]" "test_milestone_pattern_flag: v1.x tags included"
assert_eq "$has_v2" "0" "test_milestone_pattern_flag: v2.x tags excluded"
rm -rf "$REPO"

echo ""
echo "=== All caption tests complete ==="
