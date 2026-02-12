#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Test harness for gsd-stack core framework
# Tests: CLI dispatch, directory bootstrapping, env defaults, history logging
# ==============================================================================

# -- Colors --
RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

# -- Counters --
PASS_COUNT=0
FAIL_COUNT=0

# -- Test isolation: use temp directory --
TEST_DIR=$(mktemp -d)
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- Cleanup on exit --
trap 'rm -rf "$TEST_DIR"' EXIT

# -- Path to gsd-stack under test --
GSD_STACK="$(cd "$(dirname "$0")/.." && pwd)/bin/gsd-stack"

# ==============================================================================
# Helper functions
# ==============================================================================

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "${GREEN}  ✓${RESET} %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf "${RED}  ✗${RESET} %s -- %s\n" "$1" "$2"
}

assert_eq() {
  local test_name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    pass "$test_name"
  else
    fail "$test_name" "expected '$expected', got '$actual'"
  fi
}

assert_contains() {
  local test_name="$1" haystack="$2" needle="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$test_name"
  else
    fail "$test_name" "output does not contain '$needle'"
  fi
}

assert_file_exists() {
  local test_name="$1" filepath="$2"
  if [[ -f "$filepath" ]]; then
    pass "$test_name"
  else
    fail "$test_name" "file does not exist: $filepath"
  fi
}

assert_dir_exists() {
  local test_name="$1" dirpath="$2"
  if [[ -d "$dirpath" ]]; then
    pass "$test_name"
  else
    fail "$test_name" "directory does not exist: $dirpath"
  fi
}

summary() {
  echo ""
  printf "${BOLD}Results: %d passed, %d failed${RESET}\n" "$PASS_COUNT" "$FAIL_COUNT"
  if [[ "$FAIL_COUNT" -gt 0 ]]; then
    exit 1
  else
    exit 0
  fi
}

# ==============================================================================
# CLI Dispatch Tests
# ==============================================================================

echo ""
printf "${BOLD}CLI Dispatch Tests${RESET}\n"

# -- No args: exits 0, output contains "Usage:" --
set +e
output=$("$GSD_STACK" 2>&1)
rc=$?
set -e
assert_eq "no args exits 0" "0" "$rc"
assert_contains "no args shows Usage:" "$output" "Usage:"

# -- help: exits 0, output contains "Usage:" and subcommands --
set +e
output=$("$GSD_STACK" help 2>&1)
rc=$?
set -e
assert_eq "help exits 0" "0" "$rc"
assert_contains "help shows Usage:" "$output" "Usage:"
assert_contains "help lists status" "$output" "status"
assert_contains "help lists log" "$output" "log"
assert_contains "help lists push" "$output" "push"
assert_contains "help lists pop" "$output" "pop"
assert_contains "help lists peek" "$output" "peek"
assert_contains "help lists poke" "$output" "poke"
assert_contains "help lists drain" "$output" "drain"
assert_contains "help lists clear" "$output" "clear"
assert_contains "help lists session" "$output" "session"
assert_contains "help lists list" "$output" "list"
assert_contains "help lists watch" "$output" "watch"
assert_contains "help lists pause" "$output" "pause"
assert_contains "help lists resume" "$output" "resume"
assert_contains "help lists stop" "$output" "stop"
assert_contains "help lists save" "$output" "save"
assert_contains "help lists record" "$output" "record"
assert_contains "help lists stop-record" "$output" "stop-record"
assert_contains "help lists mark" "$output" "mark"
assert_contains "help lists play" "$output" "play"
assert_contains "help lists metrics" "$output" "metrics"

# -- version: exits 0, output matches version pattern --
set +e
output=$("$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "version exits 0" "0" "$rc"
if [[ "$output" =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
  pass "version matches semver pattern"
else
  fail "version matches semver pattern" "output was: $output"
fi

# -- unknown command: exits 1, output contains "Unknown command" --
set +e
output=$("$GSD_STACK" unknown-cmd 2>&1)
rc=$?
set -e
assert_eq "unknown command exits 1" "1" "$rc"
assert_contains "unknown command shows error" "$output" "Unknown command"

# -- --help flag: exits 0, output contains "Usage:" --
set +e
output=$("$GSD_STACK" --help 2>&1)
rc=$?
set -e
assert_eq "--help flag exits 0" "0" "$rc"
assert_contains "--help flag shows Usage:" "$output" "Usage:"

# -- --version flag: exits 0 --
set +e
output=$("$GSD_STACK" --version 2>&1)
rc=$?
set -e
assert_eq "--version flag exits 0" "0" "$rc"

# ==============================================================================
# Directory Bootstrapping Tests
# ==============================================================================

echo ""
printf "${BOLD}Directory Bootstrapping Tests${RESET}\n"

# Reset stack dir for clean bootstrapping test
rm -rf "$TEST_DIR/stack"
set +e
"$GSD_STACK" version >/dev/null 2>&1
set -e

assert_dir_exists "pending/ created" "$GSD_STACK_DIR/pending"
assert_dir_exists "done/ created" "$GSD_STACK_DIR/done"
assert_dir_exists "sessions/ created" "$GSD_STACK_DIR/sessions"
assert_dir_exists "recordings/ created" "$GSD_STACK_DIR/recordings"
assert_dir_exists "saves/ created" "$GSD_STACK_DIR/saves"
assert_file_exists "history.jsonl created" "$GSD_STACK_DIR/history.jsonl"

# -- Idempotency: running again does NOT destroy existing content --
if [[ -d "$GSD_STACK_DIR/pending" ]]; then
  echo "sentinel-data" > "$GSD_STACK_DIR/pending/test-file.txt"
  set +e
  "$GSD_STACK" version >/dev/null 2>&1
  set -e
  if [[ -f "$GSD_STACK_DIR/pending/test-file.txt" ]]; then
    content=$(cat "$GSD_STACK_DIR/pending/test-file.txt")
    assert_eq "idempotent: existing content preserved" "sentinel-data" "$content"
  else
    fail "idempotent: existing content preserved" "file was destroyed"
  fi
else
  fail "idempotent: existing content preserved" "pending/ dir does not exist (bootstrapping failed)"
fi

# ==============================================================================
# Environment Variable Tests
# ==============================================================================

echo ""
printf "${BOLD}Environment Variable Tests${RESET}\n"

# -- Default GSD_STACK_DIR is .claude/stack --
# We test by unsetting GSD_STACK_DIR and checking help output works
# (The default should be .claude/stack but we can't easily inspect the internal
# variable, so we test that it doesn't error out and the help output is correct)
set +e
output=$(unset GSD_STACK_DIR && "$GSD_STACK" help 2>&1)
rc=$?
set -e
assert_eq "default GSD_STACK_DIR works" "0" "$rc"

# -- GSD_STACK_DIR override works (we've been using it the whole time) --
assert_dir_exists "GSD_STACK_DIR override works" "$TEST_DIR/stack"

# -- Test environment variable defaults via script behavior --
# We'll check that the script accepts and uses these defaults by running
# with them explicitly set and confirming no errors
set +e
output=$(GSD_TMUX_SESSION="claude" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_TMUX_SESSION default accepted" "0" "$rc"

set +e
output=$(GSD_STACK_MODE="fifo" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_STACK_MODE default accepted" "0" "$rc"

set +e
output=$(GSD_STALL_TIMEOUT="300" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_STALL_TIMEOUT default accepted" "0" "$rc"

set +e
output=$(GSD_RECORD_INTERVAL="5" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_RECORD_INTERVAL default accepted" "0" "$rc"

set +e
output=$(GSD_PRIORITY="normal" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_PRIORITY default accepted" "0" "$rc"

set +e
output=$(GSD_SOURCE="cli" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_SOURCE default accepted" "0" "$rc"

set +e
output=$(GSD_FORMAT="" "$GSD_STACK" version 2>&1)
rc=$?
set -e
assert_eq "GSD_FORMAT default accepted" "0" "$rc"

# ==============================================================================
# History Logging Tests
# ==============================================================================

echo ""
printf "${BOLD}History Logging Tests${RESET}\n"

# Reset stack dir for clean history test
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Run version command to generate history
set +e
"$GSD_STACK" version >/dev/null 2>&1
set -e

# -- History file has at least one entry --
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]]; then
  line_count=$(wc -l < "$GSD_STACK_DIR/history.jsonl")
  if [[ "$line_count" -ge 1 ]]; then
    pass "history.jsonl has at least one entry after version"
  else
    fail "history.jsonl has at least one entry after version" "file is empty"
  fi
else
  fail "history.jsonl has at least one entry after version" "file does not exist"
fi

# -- Each entry is valid JSON with ts, event, detail fields --
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]]; then
  first_line=$(head -1 "$GSD_STACK_DIR/history.jsonl")
  # Check it has "ts" field
  if [[ "$first_line" == *'"ts"'* ]]; then
    pass "history entry has ts field"
  else
    fail "history entry has ts field" "line: $first_line"
  fi
  # Check it has "event" field
  if [[ "$first_line" == *'"event"'* ]]; then
    pass "history entry has event field"
  else
    fail "history entry has event field" "line: $first_line"
  fi
  # Check it has "detail" field
  if [[ "$first_line" == *'"detail"'* ]]; then
    pass "history entry has detail field"
  else
    fail "history entry has detail field" "line: $first_line"
  fi
else
  fail "history entry has ts field" "history.jsonl missing"
  fail "history entry has event field" "history.jsonl missing"
  fail "history entry has detail field" "history.jsonl missing"
fi

# -- Timestamp is in ISO 8601 format --
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]]; then
  first_line=$(head -1 "$GSD_STACK_DIR/history.jsonl")
  # Extract timestamp value - look for pattern like "ts":"2026-..."
  if [[ "$first_line" =~ \"ts\":\"([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)\" ]]; then
    pass "timestamp is ISO 8601 format"
  else
    fail "timestamp is ISO 8601 format" "could not match pattern in: $first_line"
  fi
else
  fail "timestamp is ISO 8601 format" "history.jsonl missing"
fi

# -- Multiple commands append (not overwrite) --
set +e
"$GSD_STACK" help >/dev/null 2>&1
"$GSD_STACK" version >/dev/null 2>&1
set -e

if [[ -f "$GSD_STACK_DIR/history.jsonl" ]]; then
  line_count=$(wc -l < "$GSD_STACK_DIR/history.jsonl")
  # We ran version once, then help, then version again = 3 entries minimum
  if [[ "$line_count" -ge 3 ]]; then
    pass "multiple commands append to history (${line_count} entries)"
  else
    fail "multiple commands append to history" "expected >= 3 entries, got $line_count"
  fi
else
  fail "multiple commands append to history" "history.jsonl missing"
fi

# ==============================================================================
# Summary
# ==============================================================================

summary
