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
# Status Subcommand Tests (empty state)
# ==============================================================================

echo ""
printf "${BOLD}Status Subcommand Tests (empty state)${RESET}\n"

# Reset stack dir for clean status tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- status exits 0 --
set +e
output=$("$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_eq "status exits 0" "0" "$rc"

# -- status shows 0 pending --
assert_contains "status shows 0 pending" "$output" "0 pending"

# -- status shows no active session --
# Should contain "none" or "no" for session
if [[ "$output" == *[Ss]ession* ]] && [[ "$output" == *"none"* || "$output" == *"no "* ]]; then
  pass "status shows no active session"
else
  fail "status shows no active session" "output: $output"
fi

# -- status shows no recording --
if [[ "$output" == *[Rr]ecording* ]] && [[ "$output" == *"none"* || "$output" == *"no "* ]]; then
  pass "status shows no recording"
else
  fail "status shows no recording" "output: $output"
fi

# -- status shows mode --
assert_contains "status shows mode" "$output" "fifo"

# -- status shows done count --
if [[ "$output" == *[Dd]one* ]] && [[ "$output" == *"0"* ]]; then
  pass "status shows done count 0"
else
  fail "status shows done count 0" "output: $output"
fi

# ==============================================================================
# Status Subcommand Tests (with data)
# ==============================================================================

echo ""
printf "${BOLD}Status Subcommand Tests (with data)${RESET}\n"

# Reset stack dir for data tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl"

# -- Create fake pending messages --
touch "$GSD_STACK_DIR/pending/0-001.md"   # urgent
touch "$GSD_STACK_DIR/pending/5-002.md"   # normal
touch "$GSD_STACK_DIR/pending/5-003.md"   # normal

set +e
output=$("$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_eq "status with pending exits 0" "0" "$rc"
assert_contains "status shows 3 pending" "$output" "3 pending"
assert_contains "status shows 1 urgent" "$output" "1 urgent"
assert_contains "status shows 2 normal" "$output" "2 normal"

# -- Create fake done files --
touch "$GSD_STACK_DIR/done/msg1.md"
touch "$GSD_STACK_DIR/done/msg2.md"

set +e
output=$("$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_contains "status shows 2 done" "$output" "2"

# -- Create fake active session --
mkdir -p "$GSD_STACK_DIR/sessions/myapp"
echo '{"name":"myapp","status":"active","project":"/home/user/proj","started":"2026-02-12T10:00:00Z"}' > "$GSD_STACK_DIR/sessions/myapp/meta.json"

set +e
output=$("$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_contains "status shows active session" "$output" "active"
assert_contains "status shows session name" "$output" "myapp"

# -- Create fake recording --
mkdir -p "$GSD_STACK_DIR/recordings/sprint-1"
echo '{"name":"sprint-1","status":"recording","started":"2026-02-12T14:00:00Z"}' > "$GSD_STACK_DIR/recordings/sprint-1/meta.json"

set +e
output=$("$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_contains "status shows recording" "$output" "recording"
assert_contains "status shows recording name" "$output" "sprint-1"

# ==============================================================================
# Status JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Status JSON Output Tests${RESET}\n"

set +e
output=$(GSD_FORMAT=json "$GSD_STACK" status 2>&1)
rc=$?
set -e
assert_eq "status json exits 0" "0" "$rc"

# -- Output is valid JSON (check for opening/closing braces) --
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "status json starts/ends with braces"
else
  fail "status json starts/ends with braces" "output: $output"
fi

# -- JSON contains expected keys --
assert_contains "status json has pending key" "$output" '"pending"'
assert_contains "status json has mode key" "$output" '"mode"'
assert_contains "status json has session key" "$output" '"session"'
assert_contains "status json has recording key" "$output" '"recording"'

# Validate JSON with python3 if available
if command -v python3 &>/dev/null; then
  set +e
  echo "$output" | python3 -m json.tool >/dev/null 2>&1
  json_rc=$?
  set -e
  if [[ "$json_rc" -eq 0 ]]; then
    pass "status json is valid JSON (python3 validated)"
  else
    fail "status json is valid JSON (python3 validated)" "python3 json.tool failed"
  fi
else
  pass "status json is valid JSON (python3 not available, skipped)"
fi

# ==============================================================================
# Log Subcommand Tests (empty history)
# ==============================================================================

echo ""
printf "${BOLD}Log Subcommand Tests (empty history)${RESET}\n"

# Reset stack dir for log tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl"

# Truncate history to empty
> "$GSD_STACK_DIR/history.jsonl"

set +e
output=$("$GSD_STACK" log 2>&1)
rc=$?
set -e
assert_eq "log empty exits 0" "0" "$rc"

# Should contain some indication of no events
if echo "$output" | grep -qi "no.*event\|no.*history\|empty"; then
  pass "log empty shows no-events message"
else
  fail "log empty shows no-events message" "output: $output"
fi

# ==============================================================================
# Log Subcommand Tests (with events)
# ==============================================================================

echo ""
printf "${BOLD}Log Subcommand Tests (with events)${RESET}\n"

# Reset and write test events
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"

# Write 5 test events
cat > "$GSD_STACK_DIR/history.jsonl" <<'EVENTS'
{"ts":"2026-02-12T15:00:00Z","event":"push","detail":"implement auth module"}
{"ts":"2026-02-12T15:01:00Z","event":"poke","detail":"tmux: process stack"}
{"ts":"2026-02-12T15:02:00Z","event":"pop","detail":"implement auth module"}
{"ts":"2026-02-12T15:03:00Z","event":"push","detail":"fix login validation bug in the authentication handler service that processes incoming requests"}
{"ts":"2026-02-12T15:04:00Z","event":"status","detail":"displayed status"}
EVENTS

set +e
output=$("$GSD_STACK" log 2>&1)
rc=$?
set -e
assert_eq "log with events exits 0" "0" "$rc"

# -- All 5 timestamps appear --
assert_contains "log shows 15:00 timestamp" "$output" "15:00"
assert_contains "log shows 15:01 timestamp" "$output" "15:01"
assert_contains "log shows 15:02 timestamp" "$output" "15:02"
assert_contains "log shows 15:03 timestamp" "$output" "15:03"
assert_contains "log shows 15:04 timestamp" "$output" "15:04"

# -- Event types present --
assert_contains "log shows push event" "$output" "push"
assert_contains "log shows poke event" "$output" "poke"
assert_contains "log shows pop event" "$output" "pop"
assert_contains "log shows status event" "$output" "status"

# -- Long detail is truncated (the 15:03 entry has >80 char detail) --
# The full detail is "fix login validation bug in the authentication handler service that processes incoming requests"
# which is 95 chars, so it should be cut with "..."
if echo "$output" | grep "15:03" | grep -q '\.\.\.'; then
  pass "log truncates long detail with ..."
else
  fail "log truncates long detail with ..." "15:03 line: $(echo "$output" | grep '15:03')"
fi

# ==============================================================================
# Log --limit / -n Tests
# ==============================================================================

echo ""
printf "${BOLD}Log --limit / -n Tests${RESET}\n"

# Write 25 test events
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
> "$GSD_STACK_DIR/history.jsonl"

for i in $(seq -w 1 25); do
  echo "{\"ts\":\"2026-02-12T16:${i}:00Z\",\"event\":\"push\",\"detail\":\"event number $i\"}" >> "$GSD_STACK_DIR/history.jsonl"
done

# -- Default log shows exactly 20 entries --
set +e
output=$("$GSD_STACK" log 2>&1)
rc=$?
set -e

# Count lines that contain timestamps (event lines)
ts_count=$(echo "$output" | grep -c "2026-02-12" || true)
assert_eq "log default shows 20 entries" "20" "$ts_count"

# -- log -n 5 shows exactly 5 entries --
set +e
output=$("$GSD_STACK" log -n 5 2>&1)
rc=$?
set -e

ts_count=$(echo "$output" | grep -c "2026-02-12" || true)
assert_eq "log -n 5 shows 5 entries" "5" "$ts_count"

# -- log -n 30 shows all 25 entries (not more) --
set +e
output=$("$GSD_STACK" log -n 30 2>&1)
rc=$?
set -e

ts_count=$(echo "$output" | grep -c "2026-02-12" || true)
assert_eq "log -n 30 shows all 25 entries" "25" "$ts_count"

# ==============================================================================
# Log JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Log JSON Output Tests${RESET}\n"

set +e
output=$(GSD_FORMAT=json "$GSD_STACK" log 2>&1)
rc=$?
set -e
assert_eq "log json exits 0" "0" "$rc"

# -- Output starts with [ (JSON array) --
if [[ "$output" == "["* ]]; then
  pass "log json starts with ["
else
  fail "log json starts with [" "output starts with: ${output:0:20}"
fi

# Validate JSON with python3 if available
if command -v python3 &>/dev/null; then
  set +e
  echo "$output" | python3 -m json.tool >/dev/null 2>&1
  json_rc=$?
  set -e
  if [[ "$json_rc" -eq 0 ]]; then
    pass "log json is valid JSON (python3 validated)"
  else
    fail "log json is valid JSON (python3 validated)" "python3 json.tool failed"
  fi
else
  pass "log json is valid JSON (python3 not available, skipped)"
fi

# ==============================================================================
# Summary
# ==============================================================================

summary
