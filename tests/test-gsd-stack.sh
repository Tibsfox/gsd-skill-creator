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

assert_not_contains() {
  local test_name="$1" haystack="$2" needle="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    pass "$test_name"
  else
    fail "$test_name" "output should NOT contain '$needle'"
  fi
}

assert_exit_code() {
  local test_name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    pass "$test_name"
  else
    fail "$test_name" "expected exit code $expected, got $actual"
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
# Re-write exactly 25 events (previous log calls added log_event entries)
> "$GSD_STACK_DIR/history.jsonl"
for i in $(seq -w 1 25); do
  echo "{\"ts\":\"2026-02-12T16:${i}:00Z\",\"event\":\"push\",\"detail\":\"event number $i\"}" >> "$GSD_STACK_DIR/history.jsonl"
done

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
# Push Subcommand Tests (basic)
# ==============================================================================

echo ""
printf "${BOLD}Push Subcommand Tests (basic)${RESET}\n"

# Reset stack dir for push tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 1. push exits 0
set +e
output=$("$GSD_STACK" push "implement auth module" 2>&1)
rc=$?
set -e
assert_eq "push exits 0" "0" "$rc"

# 2. After push, exactly 1 file in pending/
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "push creates 1 file in pending/" "1" "$file_count"

# 3. Filename starts with 5- (default priority is normal)
first_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ "$first_file" == 5-* ]]; then
  pass "push default priority filename starts with 5-"
else
  fail "push default priority filename starts with 5-" "got: $first_file"
fi

# 4. Filename ends with .md
if [[ "$first_file" == *.md ]]; then
  pass "push filename ends with .md"
else
  fail "push filename ends with .md" "got: $first_file"
fi

# 5-9: File content tests (guard against missing file in RED phase)
if [[ -n "$first_file" ]] && [[ -f "$GSD_STACK_DIR/pending/$first_file" ]]; then
  file_content=$(cat "$GSD_STACK_DIR/pending/$first_file")
  # 5. File body contains "implement auth module"
  assert_contains "push file body contains message" "$file_content" "implement auth module"
  # 6. File contains YAML frontmatter delimiter --- at start
  first_line=$(head -1 "$GSD_STACK_DIR/pending/$first_file")
  assert_eq "push file starts with ---" "---" "$first_line"
  # 7. Frontmatter contains priority: normal
  assert_contains "push frontmatter has priority: normal" "$file_content" "priority: normal"
  # 8. Frontmatter contains source: cli
  assert_contains "push frontmatter has source: cli" "$file_content" "source: cli"
  # 9. Frontmatter contains created: field with ISO 8601 timestamp
  if echo "$file_content" | grep -qE 'created: [0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z'; then
    pass "push frontmatter has ISO 8601 created field"
  else
    fail "push frontmatter has ISO 8601 created field" "content: $file_content"
  fi
else
  fail "push file body contains message" "no file created by push"
  fail "push file starts with ---" "no file created by push"
  fail "push frontmatter has priority: normal" "no file created by push"
  fail "push frontmatter has source: cli" "no file created by push"
  fail "push frontmatter has ISO 8601 created field" "no file created by push"
fi

# 10. After push, history.jsonl has a push event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"push"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "push logs event to history.jsonl"
else
  fail "push logs event to history.jsonl" "no push event found"
fi

# ==============================================================================
# Push Priority Tests
# ==============================================================================

echo ""
printf "${BOLD}Push Priority Tests${RESET}\n"

# Reset stack dir for priority tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 11. --priority=urgent creates file starting with 0-
set +e
output=$("$GSD_STACK" push --priority=urgent "fix critical bug" 2>&1)
rc=$?
set -e
urgent_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ "$urgent_file" == 0-* ]]; then
  pass "push --priority=urgent creates 0- prefix file"
else
  fail "push --priority=urgent creates 0- prefix file" "got: $urgent_file"
fi

# 12. --priority=normal creates file starting with 5-
rm -rf "$TEST_DIR/stack"
set +e
output=$("$GSD_STACK" push --priority=normal "add feature" 2>&1)
rc=$?
set -e
normal_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ "$normal_file" == 5-* ]]; then
  pass "push --priority=normal creates 5- prefix file"
else
  fail "push --priority=normal creates 5- prefix file" "got: $normal_file"
fi

# 13. --priority=low creates file starting with 9-
rm -rf "$TEST_DIR/stack"
set +e
output=$("$GSD_STACK" push --priority=low "update docs" 2>&1)
rc=$?
set -e
low_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ "$low_file" == 9-* ]]; then
  pass "push --priority=low creates 9- prefix file"
else
  fail "push --priority=low creates 9- prefix file" "got: $low_file"
fi

# 14. --priority=invalid exits 1 with error
rm -rf "$TEST_DIR/stack"
set +e
output=$("$GSD_STACK" push --priority=invalid "test" 2>&1)
rc=$?
set -e
assert_eq "push --priority=invalid exits 1" "1" "$rc"
assert_contains "push --priority=invalid shows error" "$output" "Invalid priority"

# 15. Multiple pushes: ls sorts urgent first, normal second, low third
rm -rf "$TEST_DIR/stack"
set +e
"$GSD_STACK" push --priority=low "low msg" >/dev/null 2>&1
"$GSD_STACK" push --priority=urgent "urgent msg" >/dev/null 2>&1
"$GSD_STACK" push --priority=normal "normal msg" >/dev/null 2>&1
set -e
sorted_files=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null)
first_sorted=$(echo "$sorted_files" | head -1)
last_sorted=$(echo "$sorted_files" | tail -1)
if [[ "$first_sorted" == 0-* ]] && [[ "$last_sorted" == 9-* ]]; then
  pass "push multi-priority: ls sorts urgent first, low last"
else
  fail "push multi-priority: ls sorts urgent first, low last" "first=$first_sorted last=$last_sorted"
fi

# 16. GSD_PRIORITY=urgent env var sets default priority
rm -rf "$TEST_DIR/stack"
set +e
output=$(GSD_PRIORITY=urgent "$GSD_STACK" push "env priority" 2>&1)
rc=$?
set -e
env_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ "$env_file" == 0-* ]]; then
  pass "GSD_PRIORITY=urgent env sets 0- prefix"
else
  fail "GSD_PRIORITY=urgent env sets 0- prefix" "got: $env_file"
fi

# ==============================================================================
# Push Stdin Tests
# ==============================================================================

echo ""
printf "${BOLD}Push Stdin Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 17. echo "piped message" | gsd-stack push reads from stdin
set +e
output=$(echo "piped message" | "$GSD_STACK" push 2>&1)
rc=$?
set -e
assert_eq "push from stdin exits 0" "0" "$rc"

# 18. File body contains "piped message"
stdin_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ -n "$stdin_file" ]]; then
  stdin_content=$(cat "$GSD_STACK_DIR/pending/$stdin_file")
  assert_contains "push stdin file body has message" "$stdin_content" "piped message"
else
  fail "push stdin file body has message" "no file created"
fi

# 19. Push with no args and no stdin exits 1
rm -rf "$TEST_DIR/stack"
set +e
output=$("$GSD_STACK" push 2>&1 </dev/null)
rc=$?
set -e
assert_eq "push no args no stdin exits 1" "1" "$rc"
assert_contains "push no args shows error" "$output" "No message"

# ==============================================================================
# Push JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Push JSON Output Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 20. GSD_FORMAT=json outputs valid JSON
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" push "json test" 2>&1)
rc=$?
set -e
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "push json outputs JSON object"
else
  fail "push json outputs JSON object" "output: $output"
fi

# 21. JSON output contains "id" key
assert_contains "push json has id key" "$output" '"id"'

# 22. JSON output contains "priority" key
assert_contains "push json has priority key" "$output" '"priority"'

# 23. JSON output contains "path" key
assert_contains "push json has path key" "$output" '"path"'

# ==============================================================================
# Push GSD_SOURCE Tests
# ==============================================================================

echo ""
printf "${BOLD}Push GSD_SOURCE Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 24. Default source is "cli" in frontmatter
set +e
"$GSD_STACK" push "default source test" >/dev/null 2>&1
set -e
src_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ -n "$src_file" ]]; then
  src_content=$(cat "$GSD_STACK_DIR/pending/$src_file")
  assert_contains "push default source is cli" "$src_content" "source: cli"
else
  fail "push default source is cli" "no file created"
fi

# 25. GSD_SOURCE=agent creates file with source: agent
rm -rf "$TEST_DIR/stack"
set +e
GSD_SOURCE=agent "$GSD_STACK" push "from agent" >/dev/null 2>&1
set -e
agent_file=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | head -1)
if [[ -n "$agent_file" ]]; then
  agent_content=$(cat "$GSD_STACK_DIR/pending/$agent_file")
  assert_contains "push GSD_SOURCE=agent sets source: agent" "$agent_content" "source: agent"
else
  fail "push GSD_SOURCE=agent sets source: agent" "no file created"
fi

# ==============================================================================
# Peek Subcommand Tests (empty stack)
# ==============================================================================

echo ""
printf "${BOLD}Peek Subcommand Tests (empty stack)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 26. peek on empty stack exits 0
set +e
output=$("$GSD_STACK" peek 2>&1)
rc=$?
set -e
assert_eq "peek empty exits 0" "0" "$rc"

# 27. peek on empty stack shows informative message
if echo "$output" | grep -qi "empty\|no message"; then
  pass "peek empty shows informative message"
else
  fail "peek empty shows informative message" "output: $output"
fi

# ==============================================================================
# Peek Subcommand Tests (FIFO mode)
# ==============================================================================

echo ""
printf "${BOLD}Peek Subcommand Tests (FIFO mode)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Push 3 messages with different priorities
set +e
"$GSD_STACK" push --priority=normal "normal message" >/dev/null 2>&1
"$GSD_STACK" push --priority=urgent "urgent message" >/dev/null 2>&1
"$GSD_STACK" push --priority=low "low message" >/dev/null 2>&1
set -e

# 28. FIFO peek shows urgent one (highest priority = lowest prefix, sorts first)
set +e
output=$(GSD_STACK_MODE=fifo "$GSD_STACK" peek 2>&1)
rc=$?
set -e
assert_contains "peek fifo shows urgent message" "$output" "urgent message"

# 29. Peek output contains message body
assert_contains "peek output contains message body" "$output" "urgent message"

# 30. Peek output contains priority indicator
if echo "$output" | grep -qi "urgent\|URGENT"; then
  pass "peek shows priority indicator"
else
  fail "peek shows priority indicator" "output: $output"
fi

# 31. Peek output contains queue depth
assert_contains "peek shows queue depth" "$output" "3"

# 32. After peek, file is STILL in pending/
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
if [[ "$file_count" -ge 1 ]]; then
  pass "peek does not consume file"
else
  fail "peek does not consume file" "pending/ is empty after peek"
fi

# 33. After peek, pending/ still has exactly 3 files
assert_eq "peek leaves all 3 files" "3" "$file_count"

# ==============================================================================
# Peek Subcommand Tests (LIFO mode)
# ==============================================================================

echo ""
printf "${BOLD}Peek Subcommand Tests (LIFO mode)${RESET}\n"

# Reset stack dir -- push 3 same-priority messages with slight delay
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
"$GSD_STACK" push --priority=normal "first message" >/dev/null 2>&1
sleep 0.05
"$GSD_STACK" push --priority=normal "second message" >/dev/null 2>&1
sleep 0.05
"$GSD_STACK" push --priority=normal "third message" >/dev/null 2>&1
set -e

# 34. LIFO peek shows the newest (third) message
set +e
output=$(GSD_STACK_MODE=lifo "$GSD_STACK" peek 2>&1)
rc=$?
set -e
assert_contains "peek lifo shows newest message" "$output" "third message"

# ==============================================================================
# Peek JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Peek JSON Output Tests${RESET}\n"

# 35. GSD_FORMAT=json peek outputs valid JSON
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" peek 2>&1)
rc=$?
set -e
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "peek json outputs JSON object"
else
  fail "peek json outputs JSON object" "output: $output"
fi

# 36. JSON output contains body, priority, depth keys
assert_contains "peek json has body key" "$output" '"body"'
assert_contains "peek json has priority key" "$output" '"priority"'
assert_contains "peek json has depth key" "$output" '"depth"'

# ==============================================================================
# Session Start Tests (tmux mocked)
# ==============================================================================

echo ""
printf "${BOLD}Session Start Tests (tmux mocked)${RESET}\n"

# Reset stack dir for session tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- Session start with --name=test-sess exits 0 --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" session /tmp/testproject --name=test-sess 2>&1)
rc=$?
set -e
assert_exit_code "session start exits 0" "0" "$rc"

# -- Creates session directory --
assert_dir_exists "session creates session dir" "$GSD_STACK_DIR/sessions/test-sess"

# -- Creates meta.json --
assert_file_exists "session creates meta.json" "$GSD_STACK_DIR/sessions/test-sess/meta.json"

# -- meta.json contains expected fields --
if [[ -f "$GSD_STACK_DIR/sessions/test-sess/meta.json" ]]; then
  meta_content=$(cat "$GSD_STACK_DIR/sessions/test-sess/meta.json")
  assert_contains "meta.json has name" "$meta_content" '"name":"test-sess"'
  assert_contains "meta.json has status active" "$meta_content" '"status":"active"'
  assert_contains "meta.json has project path" "$meta_content" '"project":"/tmp/testproject"'
  assert_contains "meta.json has tmux_session" "$meta_content" '"tmux_session"'
  # Check started field has ISO 8601 timestamp pattern
  if echo "$meta_content" | grep -qE '"started":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z"'; then
    pass "meta.json has ISO 8601 started timestamp"
  else
    fail "meta.json has ISO 8601 started timestamp" "meta: $meta_content"
  fi
else
  fail "meta.json has name" "meta.json does not exist"
  fail "meta.json has status active" "meta.json does not exist"
  fail "meta.json has project path" "meta.json does not exist"
  fail "meta.json has tmux_session" "meta.json does not exist"
  fail "meta.json has ISO 8601 started timestamp" "meta.json does not exist"
fi

# -- Creates heartbeat file --
assert_file_exists "session creates heartbeat" "$GSD_STACK_DIR/sessions/test-sess/heartbeat"

# -- Appends to history.jsonl with session event --
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"session"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "session logs event to history.jsonl"
else
  fail "session logs event to history.jsonl" "no session event found in history"
fi

# -- Appends to registry.jsonl --
if [[ -f "$GSD_STACK_DIR/registry.jsonl" ]] && grep -q '"name":"test-sess"' "$GSD_STACK_DIR/registry.jsonl"; then
  pass "session appends to registry.jsonl"
else
  fail "session appends to registry.jsonl" "no registry entry found"
fi

# ==============================================================================
# Session Name Default Tests
# ==============================================================================

echo ""
printf "${BOLD}Session Name Default Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- Session name defaults to project basename when --name not provided --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" session /tmp/my-cool-project 2>&1)
rc=$?
set -e
assert_exit_code "session default name exits 0" "0" "$rc"

if [[ -f "$GSD_STACK_DIR/sessions/my-cool-project/meta.json" ]]; then
  meta_content=$(cat "$GSD_STACK_DIR/sessions/my-cool-project/meta.json")
  assert_contains "default name is project basename" "$meta_content" '"name":"my-cool-project"'
else
  fail "default name is project basename" "meta.json not found at sessions/my-cool-project/"
fi

# ==============================================================================
# Session Duplicate Detection Tests
# ==============================================================================

echo ""
printf "${BOLD}Session Duplicate Detection Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- Start first session --
set +e
GSD_MOCK_TMUX=1 "$GSD_STACK" session /tmp/testproject --name=dup-test >/dev/null 2>&1
set -e

# -- Start duplicate session --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" session /tmp/testproject --name=dup-test 2>&1)
rc=$?
set -e
assert_exit_code "duplicate session exits 1" "1" "$rc"
if echo "$output" | grep -qi "already"; then
  pass "duplicate session shows already exists error"
else
  fail "duplicate session shows already exists error" "output: $output"
fi

# ==============================================================================
# Session Missing Project Path Tests
# ==============================================================================

echo ""
printf "${BOLD}Session Missing Project Path Tests${RESET}\n"

# -- Session without project path fails --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" session 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "session no project path exits non-zero"
else
  fail "session no project path exits non-zero" "exit code: $rc"
fi
if echo "$output" | grep -qiE "project|path|usage"; then
  pass "session no project path shows usage hint"
else
  fail "session no project path shows usage hint" "output: $output"
fi

# ==============================================================================
# Session State Machine Tests
# ==============================================================================

echo ""
printf "${BOLD}Session State Machine Tests${RESET}\n"

# Reset stack dir for state machine tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl"

# -- Active state: fresh heartbeat --
mkdir -p "$GSD_STACK_DIR/sessions/fresh-sess"
echo '{"name":"fresh-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-fresh-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/fresh-sess/meta.json"
touch "$GSD_STACK_DIR/sessions/fresh-sess/heartbeat"

set +e
output=$("$GSD_STACK" _get-state fresh-sess 2>&1)
rc=$?
set -e
assert_eq "active state: exit 0" "0" "$rc"
assert_eq "active state: outputs active" "active" "$output"

# -- Stalled state: old heartbeat (10 minutes ago, timeout 300s) --
mkdir -p "$GSD_STACK_DIR/sessions/stalled-sess"
echo '{"name":"stalled-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-stalled-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/stalled-sess/meta.json"
touch -d "10 minutes ago" "$GSD_STACK_DIR/sessions/stalled-sess/heartbeat"

set +e
output=$(GSD_STALL_TIMEOUT=300 "$GSD_STACK" _get-state stalled-sess 2>&1)
rc=$?
set -e
assert_eq "stalled state: exit 0" "0" "$rc"
assert_eq "stalled state: outputs stalled" "stalled" "$output"

# -- Stalled with custom timeout: 60s, heartbeat 90s old --
mkdir -p "$GSD_STACK_DIR/sessions/timeout-sess"
echo '{"name":"timeout-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-timeout-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/timeout-sess/meta.json"
touch -d "90 seconds ago" "$GSD_STACK_DIR/sessions/timeout-sess/heartbeat"

set +e
output=$(GSD_STALL_TIMEOUT=60 "$GSD_STACK" _get-state timeout-sess 2>&1)
rc=$?
set -e
assert_eq "stalled custom timeout: exit 0" "0" "$rc"
assert_eq "stalled custom timeout: outputs stalled" "stalled" "$output"

# -- Stopped state: meta says stopped --
mkdir -p "$GSD_STACK_DIR/sessions/stopped-sess"
echo '{"name":"stopped-sess","status":"stopped","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-stopped-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/stopped-sess/meta.json"

set +e
output=$("$GSD_STACK" _get-state stopped-sess 2>&1)
rc=$?
set -e
assert_eq "stopped state: exit 0" "0" "$rc"
assert_eq "stopped state: outputs stopped" "stopped" "$output"

# -- Paused state: meta says paused --
mkdir -p "$GSD_STACK_DIR/sessions/paused-sess"
echo '{"name":"paused-sess","status":"paused","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-paused-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/paused-sess/meta.json"

set +e
output=$("$GSD_STACK" _get-state paused-sess 2>&1)
rc=$?
set -e
assert_eq "paused state: exit 0" "0" "$rc"
assert_eq "paused state: outputs paused" "paused" "$output"

# -- Saved state: meta says saved --
mkdir -p "$GSD_STACK_DIR/sessions/saved-sess"
echo '{"name":"saved-sess","status":"saved","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-saved-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/saved-sess/meta.json"

set +e
output=$("$GSD_STACK" _get-state saved-sess 2>&1)
rc=$?
set -e
assert_eq "saved state: exit 0" "0" "$rc"
assert_eq "saved state: outputs saved" "saved" "$output"

# -- Active overrides to stalled when heartbeat is stale --
mkdir -p "$GSD_STACK_DIR/sessions/active-stale-sess"
echo '{"name":"active-stale-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-active-stale-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/active-stale-sess/meta.json"
touch -d "10 minutes ago" "$GSD_STACK_DIR/sessions/active-stale-sess/heartbeat"

set +e
output=$(GSD_STALL_TIMEOUT=300 "$GSD_STACK" _get-state active-stale-sess 2>&1)
rc=$?
set -e
assert_eq "active stale override: exit 0" "0" "$rc"
assert_eq "active stale override: outputs stalled" "stalled" "$output"

# -- Missing session: nonexistent returns unknown --
set +e
output=$("$GSD_STACK" _get-state nonexistent 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]] || [[ "$output" == "unknown" ]]; then
  pass "missing session: returns unknown or exits non-zero"
else
  fail "missing session: returns unknown or exits non-zero" "rc=$rc output=$output"
fi
if [[ "$output" == "unknown" ]]; then
  pass "missing session: outputs unknown"
else
  # If it exits non-zero that's also acceptable
  if [[ "$rc" -ne 0 ]]; then
    pass "missing session: outputs unknown (exits non-zero instead)"
  else
    fail "missing session: outputs unknown" "output: $output"
  fi
fi

# ==============================================================================
# Pop Subcommand Tests (empty stack)
# ==============================================================================

echo ""
printf "${BOLD}Pop Subcommand Tests (empty stack)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 1. pop on empty stack exits 0
set +e
output=$("$GSD_STACK" pop 2>&1)
rc=$?
set -e
assert_eq "pop empty exits 0" "0" "$rc"

# 2. pop on empty stack shows empty/no messages message
if echo "$output" | grep -qi "empty\|no message"; then
  pass "pop empty shows informative message"
else
  fail "pop empty shows informative message" "output: $output"
fi

# ==============================================================================
# Pop Subcommand Tests (FIFO mode)
# ==============================================================================

echo ""
printf "${BOLD}Pop Subcommand Tests (FIFO mode)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Push 3 messages with different priorities (sleep between for unique timestamps)
set +e
"$GSD_STACK" push --priority=urgent "fix bug" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "add feature" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=low "update docs" >/dev/null 2>&1
set -e

# 3. FIFO pop returns urgent message
set +e
output=$(GSD_STACK_MODE=fifo "$GSD_STACK" pop 2>&1)
rc=$?
set -e
assert_eq "pop fifo exits 0" "0" "$rc"
assert_contains "pop fifo returns urgent message" "$output" "fix bug"

# 4. After pop, pending/ has exactly 2 files remaining
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "pop fifo: pending has 2 files" "2" "$file_count"

# 5. After pop, done/ has exactly 1 file
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "pop fifo: done has 1 file" "1" "$done_count"

# 6. Popped file in done/ preserves original YAML frontmatter and body
done_file=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | head -1)
if [[ -n "$done_file" ]] && [[ -f "$GSD_STACK_DIR/done/$done_file" ]]; then
  done_content=$(cat "$GSD_STACK_DIR/done/$done_file")
  assert_contains "pop done file has frontmatter" "$done_content" "priority: urgent"
  assert_contains "pop done file has body" "$done_content" "fix bug"
else
  fail "pop done file has frontmatter" "no file in done/"
  fail "pop done file has body" "no file in done/"
fi

# 7. Pop output contains message body text
assert_contains "pop output has body text" "$output" "fix bug"

# 8. Pop output contains a priority indicator
if echo "$output" | grep -qi "urgent\|URGENT"; then
  pass "pop output has priority indicator"
else
  fail "pop output has priority indicator" "output: $output"
fi

# 9. Second pop returns normal priority message
set +e
output2=$(GSD_STACK_MODE=fifo "$GSD_STACK" pop 2>&1)
rc=$?
set -e
assert_contains "second pop returns normal message" "$output2" "add feature"

# 10. After two pops, pending has 1 file, done has 2 files
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "after 2 pops: pending has 1 file" "1" "$file_count"
assert_eq "after 2 pops: done has 2 files" "2" "$done_count"

# ==============================================================================
# Pop Subcommand Tests (LIFO mode)
# ==============================================================================

echo ""
printf "${BOLD}Pop Subcommand Tests (LIFO mode)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Push 3 same-priority messages with distinguishable content
set +e
"$GSD_STACK" push --priority=normal "first" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "second" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "third" >/dev/null 2>&1
set -e

# 11. LIFO pop returns "third" (newest)
set +e
output=$(GSD_STACK_MODE=lifo "$GSD_STACK" pop 2>&1)
rc=$?
set -e
assert_contains "pop lifo returns newest (third)" "$output" "third"

# 12. After LIFO pop, pending/ has 2 files
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "pop lifo: pending has 2 files" "2" "$file_count"

# ==============================================================================
# Pop JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Pop JSON Output Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
"$GSD_STACK" push --priority=urgent "json pop test" >/dev/null 2>&1
set -e

# 13. GSD_FORMAT=json pop outputs valid JSON
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" pop 2>&1)
rc=$?
set -e
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "pop json outputs JSON object"
else
  fail "pop json outputs JSON object" "output: $output"
fi

# 14. JSON output contains "id" key
assert_contains "pop json has id key" "$output" '"id"'

# 15. JSON output contains "priority" key
assert_contains "pop json has priority key" "$output" '"priority"'

# 16. JSON output contains "body" key
assert_contains "pop json has body key" "$output" '"body"'

# ==============================================================================
# Pop History Logging Tests
# ==============================================================================

echo ""
printf "${BOLD}Pop History Logging Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
"$GSD_STACK" push "history pop test" >/dev/null 2>&1
"$GSD_STACK" pop >/dev/null 2>&1
set -e

# 17. After pop, history.jsonl has a "pop" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"pop"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "pop logs event to history.jsonl"
else
  fail "pop logs event to history.jsonl" "no pop event found"
fi

# ==============================================================================
# Clear Subcommand Tests (empty stack)
# ==============================================================================

echo ""
printf "${BOLD}Clear Subcommand Tests (empty stack)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# 18. clear on empty stack exits 0
set +e
output=$("$GSD_STACK" clear 2>&1)
rc=$?
set -e
assert_eq "clear empty exits 0" "0" "$rc"

# 19. clear on empty stack shows "0" in output
assert_contains "clear empty shows 0" "$output" "0"

# ==============================================================================
# Clear Subcommand Tests (with messages)
# ==============================================================================

echo ""
printf "${BOLD}Clear Subcommand Tests (with messages)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Push 3 messages
set +e
"$GSD_STACK" push --priority=urgent "clear msg 1" >/dev/null 2>&1
"$GSD_STACK" push --priority=normal "clear msg 2" >/dev/null 2>&1
"$GSD_STACK" push --priority=low "clear msg 3" >/dev/null 2>&1
set -e

# 20. clear exits 0
set +e
output=$("$GSD_STACK" clear 2>&1)
rc=$?
set -e
assert_eq "clear with msgs exits 0" "0" "$rc"

# 21. After clear, pending/ has 0 files
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "clear: pending has 0 files" "0" "$file_count"

# 22. After clear, done/ has 3 files
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "clear: done has 3 files" "3" "$done_count"

# 23. Clear output reports "3" (count of messages moved)
assert_contains "clear output shows count 3" "$output" "3"

# 24. Files in done/ after clear preserve YAML frontmatter
done_file=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | head -1)
if [[ -n "$done_file" ]] && [[ -f "$GSD_STACK_DIR/done/$done_file" ]]; then
  done_content=$(cat "$GSD_STACK_DIR/done/$done_file")
  assert_contains "clear done file preserves frontmatter" "$done_content" "priority:"
else
  fail "clear done file preserves frontmatter" "no file in done/"
fi

# ==============================================================================
# Clear History Logging Tests
# ==============================================================================

echo ""
printf "${BOLD}Clear History Logging Tests${RESET}\n"

# 25. After clear, history.jsonl has a "clear" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"clear"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "clear logs event to history.jsonl"
else
  fail "clear logs event to history.jsonl" "no clear event found"
fi

# ==============================================================================
# Clear JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Clear JSON Output Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
"$GSD_STACK" push "json clear test 1" >/dev/null 2>&1
"$GSD_STACK" push "json clear test 2" >/dev/null 2>&1
set -e

# 26. GSD_FORMAT=json clear outputs valid JSON
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" clear 2>&1)
rc=$?
set -e
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "clear json outputs JSON object"
else
  fail "clear json outputs JSON object" "output: $output"
fi

# 27. JSON output contains "cleared" count
assert_contains "clear json has cleared key" "$output" '"cleared"'

# ==============================================================================
# Mixed Operations Test
# ==============================================================================

echo ""
printf "${BOLD}Mixed Operations Test${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Push 5 messages
set +e
"$GSD_STACK" push --priority=urgent "mix msg 1" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "mix msg 2" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "mix msg 3" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=low "mix msg 4" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=low "mix msg 5" >/dev/null 2>&1
set -e

# Pop 2 messages
set +e
"$GSD_STACK" pop >/dev/null 2>&1
"$GSD_STACK" pop >/dev/null 2>&1
set -e

# Clear remaining
set +e
"$GSD_STACK" clear >/dev/null 2>&1
set -e

# 28. After push 5, pop 2, clear: pending has 0, done has 5
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "mixed ops: pending has 0 files" "0" "$file_count"
assert_eq "mixed ops: done has 5 files" "5" "$done_count"

# ==============================================================================
# List Subcommand Tests (no sessions)
# ==============================================================================

echo ""
printf "${BOLD}List Subcommand Tests (no sessions)${RESET}\n"

# Reset stack dir for clean list tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# -- list with no sessions exits 0 --
set +e
output=$("$GSD_STACK" list 2>&1)
rc=$?
set -e
assert_eq "list no sessions exits 0" "0" "$rc"

# -- Output contains "No sessions" or "no sessions" --
if echo "$output" | grep -qi "no sessions"; then
  pass "list no sessions shows empty-state message"
else
  fail "list no sessions shows empty-state message" "output: $output"
fi

# ==============================================================================
# List Subcommand Tests (multiple sessions with different states)
# ==============================================================================

echo ""
printf "${BOLD}List Subcommand Tests (multiple sessions)${RESET}\n"

# Reset and set up 4 session directories manually
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl"
touch "$GSD_STACK_DIR/registry.jsonl"

# Active session (fresh heartbeat)
mkdir -p "$GSD_STACK_DIR/sessions/webapp"
echo '{"name":"webapp","status":"active","project":"/home/user/webapp","started":"2026-02-12T10:00:00Z","tmux_session":"claude-webapp"}' > "$GSD_STACK_DIR/sessions/webapp/meta.json"
touch "$GSD_STACK_DIR/sessions/webapp/heartbeat"

# Stalled session (old heartbeat)
mkdir -p "$GSD_STACK_DIR/sessions/api-server"
echo '{"name":"api-server","status":"active","project":"/home/user/api","started":"2026-02-12T09:00:00Z","tmux_session":"claude-api-server"}' > "$GSD_STACK_DIR/sessions/api-server/meta.json"
touch -d "10 minutes ago" "$GSD_STACK_DIR/sessions/api-server/heartbeat"

# Stopped session
mkdir -p "$GSD_STACK_DIR/sessions/old-proj"
echo '{"name":"old-proj","status":"stopped","project":"/home/user/old","started":"2026-02-11T08:00:00Z","tmux_session":"claude-old-proj"}' > "$GSD_STACK_DIR/sessions/old-proj/meta.json"

# Paused session
mkdir -p "$GSD_STACK_DIR/sessions/paused-work"
echo '{"name":"paused-work","status":"paused","project":"/home/user/work","started":"2026-02-12T11:00:00Z","tmux_session":"claude-paused-work"}' > "$GSD_STACK_DIR/sessions/paused-work/meta.json"
touch "$GSD_STACK_DIR/sessions/paused-work/heartbeat"

# -- list exits 0 --
set +e
output=$("$GSD_STACK" list 2>&1)
rc=$?
set -e
assert_eq "list with sessions exits 0" "0" "$rc"

# -- Output contains all session names --
assert_contains "list shows webapp" "$output" "webapp"
assert_contains "list shows api-server" "$output" "api-server"
assert_contains "list shows old-proj" "$output" "old-proj"
assert_contains "list shows paused-work" "$output" "paused-work"

# -- Output contains state labels --
assert_contains "list shows active state" "$output" "active"
assert_contains "list shows stalled state" "$output" "stalled"
assert_contains "list shows stopped state" "$output" "stopped"
assert_contains "list shows paused state" "$output" "paused"

# -- Output contains at least one project path --
assert_contains "list shows project path" "$output" "/home/user/"

# ==============================================================================
# List --filter Tests
# ==============================================================================

echo ""
printf "${BOLD}List --filter Tests${RESET}\n"

# Using same session setup above

# -- filter=active shows webapp but NOT old-proj --
set +e
output=$("$GSD_STACK" list --filter=active 2>&1)
rc=$?
set -e
assert_eq "list --filter=active exits 0" "0" "$rc"
assert_contains "list --filter=active shows webapp" "$output" "webapp"
assert_not_contains "list --filter=active hides old-proj" "$output" "old-proj"

# -- filter=stalled shows api-server but NOT webapp (as state label) --
set +e
output=$("$GSD_STACK" list --filter=stalled 2>&1)
rc=$?
set -e
assert_eq "list --filter=stalled exits 0" "0" "$rc"
assert_contains "list --filter=stalled shows api-server" "$output" "api-server"
assert_not_contains "list --filter=stalled hides webapp" "$output" "webapp"

# -- filter=stopped shows old-proj but NOT webapp --
set +e
output=$("$GSD_STACK" list --filter=stopped 2>&1)
rc=$?
set -e
assert_eq "list --filter=stopped exits 0" "0" "$rc"
assert_contains "list --filter=stopped shows old-proj" "$output" "old-proj"
assert_not_contains "list --filter=stopped hides webapp" "$output" "webapp"

# -- filter=paused shows paused-work but NOT webapp --
set +e
output=$("$GSD_STACK" list --filter=paused 2>&1)
rc=$?
set -e
assert_eq "list --filter=paused exits 0" "0" "$rc"
assert_contains "list --filter=paused shows paused-work" "$output" "paused-work"
assert_not_contains "list --filter=paused hides webapp" "$output" "webapp"

# -- filter=active does NOT show stalled as a state (filter works) --
set +e
output=$("$GSD_STACK" list --filter=active 2>&1)
set -e
assert_not_contains "list --filter=active no stalled state shown" "$output" "stalled"

# ==============================================================================
# List --json Tests
# ==============================================================================

echo ""
printf "${BOLD}List --json Tests${RESET}\n"

# Using same session setup

# -- GSD_FORMAT=json list exits 0 --
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" list 2>&1)
rc=$?
set -e
assert_eq "list json exits 0" "0" "$rc"

# -- Output starts with [ (JSON array) --
if [[ "$output" == "["* ]]; then
  pass "list json starts with ["
else
  fail "list json starts with [" "output starts with: ${output:0:40}"
fi

# -- JSON contains session data --
assert_contains "list json has webapp name" "$output" '"name":"webapp"'

# -- JSON contains state field --
if echo "$output" | grep -qE '"state":"(active|stalled|stopped|paused|saved)"'; then
  pass "list json has state field"
else
  fail "list json has state field" "output: ${output:0:200}"
fi

# Validate JSON with python3 if available
if command -v python3 &>/dev/null; then
  set +e
  echo "$output" | python3 -m json.tool >/dev/null 2>&1
  json_rc=$?
  set -e
  if [[ "$json_rc" -eq 0 ]]; then
    pass "list json is valid JSON (python3 validated)"
  else
    fail "list json is valid JSON (python3 validated)" "python3 json.tool failed"
  fi
else
  pass "list json is valid JSON (python3 not available, skipped)"
fi

# ==============================================================================
# Watch Subcommand Tests (mocked tmux)
# ==============================================================================

echo ""
printf "${BOLD}Watch Subcommand Tests${RESET}\n"

# Using same session setup (webapp=active, old-proj=stopped)

# -- watch active session exits 0 (mock mode) --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" watch webapp 2>&1)
rc=$?
set -e
assert_eq "watch active session exits 0" "0" "$rc"
# Output should mention webapp and read-only or watching or the tmux session name
if echo "$output" | grep -qi "webapp\|read-only\|watching\|claude-webapp"; then
  pass "watch active session shows relevant info"
else
  fail "watch active session shows relevant info" "output: $output"
fi

# -- watch nonexistent session exits non-zero --
set +e
output=$("$GSD_STACK" watch nonexistent-session 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "watch nonexistent session exits non-zero"
else
  fail "watch nonexistent session exits non-zero" "exit code: $rc"
fi
if echo "$output" | grep -qi "not found\|does not exist"; then
  pass "watch nonexistent session shows error"
else
  fail "watch nonexistent session shows error" "output: $output"
fi

# -- watch stopped session exits non-zero --
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" watch old-proj 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "watch stopped session exits non-zero"
else
  fail "watch stopped session exits non-zero" "exit code: $rc"
fi
if echo "$output" | grep -qi "not active\|not running\|cannot watch\|must be active"; then
  pass "watch stopped session shows state error"
else
  fail "watch stopped session shows state error" "output: $output"
fi

# -- watch with no session name exits non-zero --
set +e
output=$("$GSD_STACK" watch 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "watch no args exits non-zero"
else
  fail "watch no args exits non-zero" "exit code: $rc"
fi
if echo "$output" | grep -qi "usage\|session name\|required"; then
  pass "watch no args shows usage hint"
else
  fail "watch no args shows usage hint" "output: $output"
fi

# ==============================================================================
# Poke Subcommand Tests (mock mode, direct message)
# ==============================================================================

echo ""
printf "${BOLD}Poke Subcommand Tests (mock mode, direct message)${RESET}\n"

# Reset stack dir with active session for poke tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions/test-sess" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"
echo '{"name":"test-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-test-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/test-sess/meta.json"
touch "$GSD_STACK_DIR/sessions/test-sess/heartbeat"

# 1. poke with direct message exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" poke "run the tests" 2>&1)
rc=$?
set -e
assert_eq "poke direct exits 0" "0" "$rc"

# 2. After poke, history.jsonl contains a "poke" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"poke"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "poke logs event to history.jsonl"
else
  fail "poke logs event to history.jsonl" "no poke event found in history"
fi

# 3. poke event detail contains the message text
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep '"event":"poke"' "$GSD_STACK_DIR/history.jsonl" | grep -q "run the tests"; then
  pass "poke history detail contains message text"
else
  fail "poke history detail contains message text" "detail does not contain 'run the tests'"
fi

# 4. Poke output (human mode) contains "Poked" or "Sent" or the message text
if echo "$output" | grep -qi "poked\|sent\|run the tests"; then
  pass "poke output confirms delivery"
else
  fail "poke output confirms delivery" "output: $output"
fi

# ==============================================================================
# Poke Subcommand Tests (mock mode, nudge -- no arguments)
# ==============================================================================

echo ""
printf "${BOLD}Poke Subcommand Tests (mock mode, nudge)${RESET}\n"

# Reset stack dir with active session for nudge tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions/test-sess" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"
echo '{"name":"test-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-test-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/test-sess/meta.json"
touch "$GSD_STACK_DIR/sessions/test-sess/heartbeat"

# 5. poke with no arguments (nudge mode) exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" poke 2>&1)
rc=$?
set -e
assert_eq "poke nudge exits 0" "0" "$rc"

# 6. After nudge poke, history.jsonl contains a "poke" event with "nudge" or "pop-stack" in detail
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep '"event":"poke"' "$GSD_STACK_DIR/history.jsonl" | grep -qi "nudge\|pop-stack"; then
  pass "poke nudge history contains nudge/pop-stack"
else
  fail "poke nudge history contains nudge/pop-stack" "no nudge or pop-stack in poke history"
fi

# 7. Nudge poke output contains "nudge" or "pop-stack"
if echo "$output" | grep -qi "nudge\|pop-stack"; then
  pass "poke nudge output contains nudge/pop-stack"
else
  fail "poke nudge output contains nudge/pop-stack" "output: $output"
fi

# ==============================================================================
# Poke Subcommand Tests (no active session)
# ==============================================================================

echo ""
printf "${BOLD}Poke Subcommand Tests (no active session)${RESET}\n"

# Reset stack dir -- do NOT create any session metadata
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

# 8. poke with no active session exits 1
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" poke "hello" 2>&1)
rc=$?
set -e
assert_eq "poke no session exits 1" "1" "$rc"

# 9. Error output contains "no" and "session" (case insensitive)
if echo "$output" | grep -qi "no.*session\|no active"; then
  pass "poke no session error mentions 'no session'"
else
  fail "poke no session error mentions 'no session'" "output: $output"
fi

# ==============================================================================
# Poke Subcommand Tests (target specific session with --session)
# ==============================================================================

echo ""
printf "${BOLD}Poke Subcommand Tests (--session targeting)${RESET}\n"

# Reset stack dir with two mock active sessions
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions/sess-a" "$GSD_STACK_DIR/sessions/sess-b" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"
echo '{"name":"sess-a","status":"active","project":"/tmp/pa","started":"2026-02-12T10:00:00Z","tmux_session":"claude-sess-a","pid":"1234"}' > "$GSD_STACK_DIR/sessions/sess-a/meta.json"
touch "$GSD_STACK_DIR/sessions/sess-a/heartbeat"
echo '{"name":"sess-b","status":"active","project":"/tmp/pb","started":"2026-02-12T10:00:00Z","tmux_session":"claude-sess-b","pid":"5678"}' > "$GSD_STACK_DIR/sessions/sess-b/meta.json"
touch "$GSD_STACK_DIR/sessions/sess-b/heartbeat"

# 10. poke --session=sess-a with targeted message exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" poke --session=sess-a "targeted msg" 2>&1)
rc=$?
set -e
assert_eq "poke --session=sess-a exits 0" "0" "$rc"

# 11. History event detail contains "sess-a" or "targeted msg"
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep '"event":"poke"' "$GSD_STACK_DIR/history.jsonl" | grep -qi "sess-a\|targeted msg"; then
  pass "poke --session history contains sess-a or targeted msg"
else
  fail "poke --session history contains sess-a or targeted msg" "no matching poke event in history"
fi

# ==============================================================================
# Poke JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Poke JSON Output Tests${RESET}\n"

# Reset stack dir with active session
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions/test-sess" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"
echo '{"name":"test-sess","status":"active","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-test-sess","pid":"1234"}' > "$GSD_STACK_DIR/sessions/test-sess/meta.json"
touch "$GSD_STACK_DIR/sessions/test-sess/heartbeat"

# 12. GSD_FORMAT=json poke outputs valid JSON (starts with {, ends with })
set +e
output=$(GSD_FORMAT=json GSD_MOCK_TMUX=1 "$GSD_STACK" poke "json test" 2>&1)
rc=$?
set -e
if [[ "$output" == "{"* ]] && [[ "$output" == *"}" ]]; then
  pass "poke json outputs JSON object"
else
  fail "poke json outputs JSON object" "output: $output"
fi

# 13. JSON output contains "delivered" or "status" key
if echo "$output" | grep -qE '"delivered"|"status"'; then
  pass "poke json has status/delivered key"
else
  fail "poke json has status/delivered key" "output: $output"
fi

# 14. JSON output contains the message text "json test"
assert_contains "poke json contains message text" "$output" "json test"

# ==============================================================================
# Drain Subcommand Tests (empty stack)
# ==============================================================================

echo ""
printf "${BOLD}Drain Subcommand Tests (empty stack)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
export GSD_DRAIN_LOG_DIR="$TEST_DIR/logs"

# 1. drain on empty stack exits 0
set +e
output=$(GSD_MOCK_DRAIN=1 "$GSD_STACK" drain 2>&1)
rc=$?
set -e
assert_eq "drain empty exits 0" "0" "$rc"

# 2. Output contains indication of nothing to drain
if echo "$output" | grep -qi "nothing\|empty\|0"; then
  pass "drain empty shows nothing to drain"
else
  fail "drain empty shows nothing to drain" "output: $output"
fi

# ==============================================================================
# Drain Subcommand Tests (basic execution, 3 messages)
# ==============================================================================

echo ""
printf "${BOLD}Drain Subcommand Tests (basic execution)${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
rm -rf "$TEST_DIR/logs"
export GSD_STACK_DIR="$TEST_DIR/stack"
export GSD_DRAIN_LOG_DIR="$TEST_DIR/logs"

# Push 3 messages with different priorities
set +e
"$GSD_STACK" push --priority=urgent "fix critical auth bug" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=normal "add user profile page" >/dev/null 2>&1
sleep 0.01
"$GSD_STACK" push --priority=low "update README" >/dev/null 2>&1
set -e

# 3. drain exits 0
set +e
output=$(GSD_MOCK_DRAIN=1 "$GSD_STACK" drain 2>&1)
rc=$?
set -e
assert_eq "drain 3 msgs exits 0" "0" "$rc"

# 4. After drain, pending/ has 0 files
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "drain: pending has 0 files" "0" "$file_count"

# 5. After drain, done/ has 3 files
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "drain: done has 3 files" "3" "$done_count"

# 6. Drain output contains "1/3" progress
assert_contains "drain output has 1/3 progress" "$output" "1/3"

# 7. Drain output contains "3/3" progress
assert_contains "drain output has 3/3 progress" "$output" "3/3"

# 8. Drain output contains first message (urgent priority processed first)
if echo "$output" | grep -qi "fix critical auth bug\|auth"; then
  pass "drain output contains urgent message"
else
  fail "drain output contains urgent message" "output: $output"
fi

# 9. Drain output contains summary with "3" (total processed)
assert_contains "drain summary shows 3 processed" "$output" "3"

# ==============================================================================
# Drain Subcommand Tests (history logging)
# ==============================================================================

echo ""
printf "${BOLD}Drain Subcommand Tests (history logging)${RESET}\n"

# 10. After drain, history.jsonl contains a "drain" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"drain"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "drain logs drain event to history.jsonl"
else
  fail "drain logs drain event to history.jsonl" "no drain event found"
fi

# 11. Drain event detail contains "3" (count of messages processed)
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep '"event":"drain"' "$GSD_STACK_DIR/history.jsonl" | grep -q "3"; then
  pass "drain history detail contains count 3"
else
  fail "drain history detail contains count 3" "no '3' in drain event detail"
fi

# ==============================================================================
# Drain Subcommand Tests (log output)
# ==============================================================================

echo ""
printf "${BOLD}Drain Subcommand Tests (log output)${RESET}\n"

# 12. After drain, log directory exists
assert_dir_exists "drain log dir exists" "$TEST_DIR/logs"

# 13. A drain-* subdirectory exists inside the log dir
drain_log_found=false
for d in "$TEST_DIR/logs"/drain-*; do
  if [[ -d "$d" ]]; then
    drain_log_found=true
    drain_log_dir="$d"
    break
  fi
done
if [[ "$drain_log_found" == true ]]; then
  pass "drain log drain-* directory exists"
else
  fail "drain log drain-* directory exists" "no drain-* directory found in $TEST_DIR/logs"
fi

# 14. The drain log directory contains output files (one per message)
if [[ "$drain_log_found" == true ]]; then
  log_file_count=$(ls -1 "$drain_log_dir"/*.log 2>/dev/null | wc -l)
  log_file_count=$((log_file_count + 0))
  if [[ "$log_file_count" -ge 3 ]]; then
    pass "drain log has 3 output files"
  else
    fail "drain log has 3 output files" "found $log_file_count log files"
  fi
else
  fail "drain log has 3 output files" "no drain log directory to check"
fi

# ==============================================================================
# Drain --dry-run Tests
# ==============================================================================

echo ""
printf "${BOLD}Drain --dry-run Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
rm -rf "$TEST_DIR/logs"
export GSD_STACK_DIR="$TEST_DIR/stack"
export GSD_DRAIN_LOG_DIR="$TEST_DIR/logs"

# Push 2 messages
set +e
"$GSD_STACK" push --priority=normal "dry-run msg 1" >/dev/null 2>&1
"$GSD_STACK" push --priority=urgent "dry-run msg 2" >/dev/null 2>&1
set -e

# 15. drain --dry-run exits 0
set +e
output=$(GSD_MOCK_DRAIN=1 "$GSD_STACK" drain --dry-run 2>&1)
rc=$?
set -e
assert_eq "drain --dry-run exits 0" "0" "$rc"

# 16. After dry-run, pending/ still has 2 files
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
assert_eq "drain --dry-run: pending still has 2 files" "2" "$file_count"

# 17. Dry-run output contains "dry-run" or "would execute" or "would process"
if echo "$output" | grep -qi "dry-run\|would execute\|would process"; then
  pass "drain --dry-run output indicates dry-run"
else
  fail "drain --dry-run output indicates dry-run" "output: $output"
fi

# 18. Dry-run output shows the messages
if echo "$output" | grep -qi "dry-run msg\|msg"; then
  pass "drain --dry-run shows messages"
else
  fail "drain --dry-run shows messages" "output: $output"
fi

# ==============================================================================
# Drain JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Drain JSON Output Tests${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
rm -rf "$TEST_DIR/logs"
export GSD_STACK_DIR="$TEST_DIR/stack"
export GSD_DRAIN_LOG_DIR="$TEST_DIR/logs"

# Push 2 messages
set +e
"$GSD_STACK" push --priority=normal "json drain 1" >/dev/null 2>&1
"$GSD_STACK" push --priority=normal "json drain 2" >/dev/null 2>&1
set -e

# 19. GSD_FORMAT=json drain outputs valid JSON (last line starts with {)
set +e
output=$(GSD_FORMAT=json GSD_MOCK_DRAIN=1 "$GSD_STACK" drain 2>&1)
rc=$?
set -e
last_line=$(echo "$output" | tail -1)
if [[ "$last_line" == "{"* ]]; then
  pass "drain json output starts with {"
else
  fail "drain json output starts with {" "last line: $last_line"
fi

# 20. JSON output contains "processed" or "total" key
if echo "$output" | grep -qE '"processed"|"total"'; then
  pass "drain json has processed/total key"
else
  fail "drain json has processed/total key" "output: $output"
fi

# 21. JSON output contains "passed" or "succeeded" key
if echo "$output" | grep -qE '"passed"|"succeeded"'; then
  pass "drain json has passed/succeeded key"
else
  fail "drain json has passed/succeeded key" "output: $output"
fi

# ==============================================================================
# Drain Single Message Test
# ==============================================================================

echo ""
printf "${BOLD}Drain Single Message Test${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
rm -rf "$TEST_DIR/logs"
export GSD_STACK_DIR="$TEST_DIR/stack"
export GSD_DRAIN_LOG_DIR="$TEST_DIR/logs"

# Push exactly 1 message
set +e
"$GSD_STACK" push --priority=normal "single drain msg" >/dev/null 2>&1
set -e

# 22. drain exits 0
set +e
output=$(GSD_MOCK_DRAIN=1 "$GSD_STACK" drain 2>&1)
rc=$?
set -e
assert_eq "drain single msg exits 0" "0" "$rc"

# 23. Output contains "1/1"
assert_contains "drain single msg has 1/1 progress" "$output" "1/1"

# 24. After drain, pending/ has 0 files, done/ has 1 file
file_count=$(ls -1 "$GSD_STACK_DIR/pending/" 2>/dev/null | wc -l)
file_count=$((file_count + 0))
done_count=$(ls -1 "$GSD_STACK_DIR/done/" 2>/dev/null | wc -l)
done_count=$((done_count + 0))
assert_eq "drain single: pending has 0 files" "0" "$file_count"
assert_eq "drain single: done has 1 file" "1" "$done_count"

# ==============================================================================
# Save Subcommand Tests (basic snapshot)
# ==============================================================================

echo ""
printf "${BOLD}Save Subcommand Tests (basic snapshot)${RESET}\n"

# Reset stack dir for save tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

# Create active session
mkdir -p "$GSD_STACK_DIR/sessions/save-test"
echo '{"name":"save-test","status":"active","project":"/tmp/save-proj","started":"2026-02-12T10:00:00Z","tmux_session":"claude-save-test","pid":"1234"}' > "$GSD_STACK_DIR/sessions/save-test/meta.json"
touch "$GSD_STACK_DIR/sessions/save-test/heartbeat"

# Create fake pending messages
printf -- "---\npriority: normal\nsource: cli\ncreated: 2026-02-12T10:01:00Z\n---\nfix the bug" > "$GSD_STACK_DIR/pending/5-001-0001.md"
printf -- "---\npriority: urgent\nsource: cli\ncreated: 2026-02-12T10:02:00Z\n---\ndeploy hotfix" > "$GSD_STACK_DIR/pending/0-002-0002.md"

# Create fake STATE.md in project dir
mkdir -p /tmp/save-proj/.planning
printf "# State\nPhase: 105\nStatus: executing" > /tmp/save-proj/.planning/STATE.md

# 1. save exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" save save-test 2>&1)
rc=$?
set -e
assert_exit_code "save exits 0" "0" "$rc"

# 2. At least one file exists in saves/
save_count=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | wc -l)
save_count=$((save_count + 0))
if [[ "$save_count" -ge 1 ]]; then
  pass "save creates file in saves/"
else
  fail "save creates file in saves/" "found $save_count files in saves/"
fi

# 3. Save file name starts with "save-test-"
save_file=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | head -1)
if [[ "$save_file" == save-test-* ]]; then
  pass "save file name starts with session name"
else
  fail "save file name starts with session name" "filename: $save_file"
fi

# 4. Save file name ends with ".json"
if [[ "$save_file" == *.json ]]; then
  pass "save file name ends with .json"
else
  fail "save file name ends with .json" "filename: $save_file"
fi

# 5. Save file contains name field from meta
save_content=""
if [[ -n "$save_file" ]] && [[ -f "$GSD_STACK_DIR/saves/$save_file" ]]; then
  save_content=$(cat "$GSD_STACK_DIR/saves/$save_file" 2>/dev/null)
fi
assert_contains "save file has name field" "$save_content" '"name":"save-test"'

# 6. Save file contains status field
if echo "$save_content" | grep -q '"status"'; then
  pass "save file has status field"
else
  fail "save file has status field" "no status field in save file"
fi

# 7. Save file contains project path
assert_contains "save file has project path" "$save_content" '"/tmp/save-proj"'

# 8. Save file contains pending count or pending field
if echo "$save_content" | grep -qE '"pending_count"|"pending"'; then
  pass "save file has pending info"
else
  fail "save file has pending info" "no pending info in save file"
fi

# 9. Save file contains saved_at with ISO 8601 timestamp
if echo "$save_content" | grep -qE '"saved_at":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z"'; then
  pass "save file has ISO 8601 saved_at"
else
  fail "save file has ISO 8601 saved_at" "content: ${save_content:0:200}"
fi

# 10. History.jsonl contains a "save" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"save"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "save logs event to history.jsonl"
else
  fail "save logs event to history.jsonl" "no save event found in history"
fi

# ==============================================================================
# Save --note Tests
# ==============================================================================

echo ""
printf "${BOLD}Save --note Tests${RESET}\n"

# 11. save with --note exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" save save-test --note="before refactor" 2>&1)
rc=$?
set -e
assert_exit_code "save --note exits 0" "0" "$rc"

# 12. Save file contains the note text
note_save=$(ls -1t "$GSD_STACK_DIR/saves/" 2>/dev/null | head -1)
note_content=""
if [[ -n "$note_save" ]] && [[ -f "$GSD_STACK_DIR/saves/$note_save" ]]; then
  note_content=$(cat "$GSD_STACK_DIR/saves/$note_save" 2>/dev/null)
fi
if echo "$note_content" | grep -q "before refactor"; then
  pass "save --note file contains note text"
else
  fail "save --note file contains note text" "content: ${note_content:0:200}"
fi

# ==============================================================================
# Save with STATE.md Tests
# ==============================================================================

echo ""
printf "${BOLD}Save with STATE.md Tests${RESET}\n"

# 13. Save file contains state_md field
if echo "$save_content" | grep -q '"state_md"'; then
  pass "save file has state_md field"
else
  fail "save file has state_md field" "no state_md in save content"
fi

# 14. state_md contains content from STATE.md
if echo "$save_content" | grep -qE "Phase.*105|State"; then
  pass "save state_md contains STATE.md content"
else
  fail "save state_md contains STATE.md content" "content: ${save_content:0:200}"
fi

# ==============================================================================
# Save Error Cases
# ==============================================================================

echo ""
printf "${BOLD}Save Error Cases${RESET}\n"

# 15. save nonexistent session exits non-zero
set +e
output=$("$GSD_STACK" save nonexistent-session 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "save nonexistent session exits non-zero"
else
  fail "save nonexistent session exits non-zero" "exit code: $rc"
fi

# 16. Error output contains "not found" or "does not exist" or "No session"
if echo "$output" | grep -qi "not found\|does not exist\|no session"; then
  pass "save nonexistent session shows error message"
else
  fail "save nonexistent session shows error message" "output: $output"
fi

# 17. save with no session name exits non-zero
set +e
output=$("$GSD_STACK" save 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "save no args exits non-zero"
else
  fail "save no args exits non-zero" "exit code: $rc"
fi

# 18. Error output contains "Usage" or "session name"
if echo "$output" | grep -qi "usage\|session name\|session_name\|required"; then
  pass "save no args shows usage hint"
else
  fail "save no args shows usage hint" "output: $output"
fi

# ==============================================================================
# Save Status Update Tests
# ==============================================================================

echo ""
printf "${BOLD}Save Status Update Tests${RESET}\n"

# Reset for clean status test
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

mkdir -p "$GSD_STACK_DIR/sessions/status-test"
echo '{"name":"status-test","status":"active","project":"/tmp/status-proj","started":"2026-02-12T10:00:00Z","tmux_session":"claude-status-test","pid":"1234"}' > "$GSD_STACK_DIR/sessions/status-test/meta.json"
touch "$GSD_STACK_DIR/sessions/status-test/heartbeat"

# 19. After standalone save, meta.json status changes to "saved"
set +e
GSD_MOCK_TMUX=1 "$GSD_STACK" save status-test >/dev/null 2>&1
set -e
status_after=""
if [[ -f "$GSD_STACK_DIR/sessions/status-test/meta.json" ]]; then
  status_after=$(cat "$GSD_STACK_DIR/sessions/status-test/meta.json" 2>/dev/null)
fi
if echo "$status_after" | grep -q '"status":"saved"'; then
  pass "save standalone sets status to saved"
else
  fail "save standalone sets status to saved" "meta: $status_after"
fi

# 20. _get-state outputs "saved"
set +e
output=$("$GSD_STACK" _get-state status-test 2>&1)
set -e
assert_eq "save: _get-state outputs saved" "saved" "$output"

# ==============================================================================
# Pause Subcommand Tests (basic)
# ==============================================================================

echo ""
printf "${BOLD}Pause Subcommand Tests (basic)${RESET}\n"

# Reset stack dir for pause tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

# Create active session for pause
mkdir -p "$GSD_STACK_DIR/sessions/pause-test"
echo '{"name":"pause-test","status":"active","project":"/tmp/pause-proj","started":"2026-02-12T12:00:00Z","tmux_session":"claude-pause-test","pid":"1234"}' > "$GSD_STACK_DIR/sessions/pause-test/meta.json"
touch "$GSD_STACK_DIR/sessions/pause-test/heartbeat"

# 21. pause exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" pause pause-test 2>&1)
rc=$?
set -e
assert_exit_code "pause exits 0" "0" "$rc"

# 22. After pause, meta.json status is "paused"
meta_after=""
if [[ -f "$GSD_STACK_DIR/sessions/pause-test/meta.json" ]]; then
  meta_after=$(cat "$GSD_STACK_DIR/sessions/pause-test/meta.json" 2>/dev/null)
fi
if echo "$meta_after" | grep -q '"status":"paused"'; then
  pass "pause sets meta status to paused"
else
  fail "pause sets meta status to paused" "meta: $meta_after"
fi

# 23. _get-state outputs "paused"
set +e
output=$("$GSD_STACK" _get-state pause-test 2>&1)
set -e
assert_eq "pause: _get-state outputs paused" "paused" "$output"

# 24. After pause, at least one save file exists in saves/ (auto-save)
save_count=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | wc -l)
save_count=$((save_count + 0))
if [[ "$save_count" -ge 1 ]]; then
  pass "pause creates auto-save file"
else
  fail "pause creates auto-save file" "found $save_count files in saves/"
fi

# 25. Save file name starts with "pause-test-"
pause_save=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | head -1)
if [[ "$pause_save" == pause-test-* ]]; then
  pass "pause save file starts with session name"
else
  fail "pause save file starts with session name" "filename: $pause_save"
fi

# 26. History.jsonl contains a "pause" event
if [[ -f "$GSD_STACK_DIR/history.jsonl" ]] && grep -q '"event":"pause"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "pause logs event to history.jsonl"
else
  fail "pause logs event to history.jsonl" "no pause event found in history"
fi

# 27. Output contains "paused" or "Paused"
if echo "$output" | grep -qi "paused"; then
  pass "pause output mentions paused"
else
  fail "pause output mentions paused" "output: $output"
fi

# ==============================================================================
# Pause Error Cases
# ==============================================================================

echo ""
printf "${BOLD}Pause Error Cases${RESET}\n"

# 28. pause nonexistent session exits non-zero
set +e
output=$("$GSD_STACK" pause nonexistent-session 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "pause nonexistent session exits non-zero"
else
  fail "pause nonexistent session exits non-zero" "exit code: $rc"
fi

# 29. Error output contains "not found" or "does not exist"
if echo "$output" | grep -qi "not found\|does not exist"; then
  pass "pause nonexistent session shows error"
else
  fail "pause nonexistent session shows error" "output: $output"
fi

# 30. pause stopped session exits non-zero
mkdir -p "$GSD_STACK_DIR/sessions/stopped-for-pause"
echo '{"name":"stopped-for-pause","status":"stopped","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-stopped-for-pause","pid":"1234"}' > "$GSD_STACK_DIR/sessions/stopped-for-pause/meta.json"
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" pause stopped-for-pause 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "pause stopped session exits non-zero"
else
  fail "pause stopped session exits non-zero" "exit code: $rc"
fi

# 31. Error output mentions state issue
if echo "$output" | grep -qi "cannot pause\|not active\|not in.*pausable\|state"; then
  pass "pause stopped session shows state error"
else
  fail "pause stopped session shows state error" "output: $output"
fi

# 32. pause with no session name exits non-zero
set +e
output=$("$GSD_STACK" pause 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "pause no args exits non-zero"
else
  fail "pause no args exits non-zero" "exit code: $rc"
fi

# ==============================================================================
# Pause Idempotency Tests
# ==============================================================================

echo ""
printf "${BOLD}Pause Idempotency Tests${RESET}\n"

# Create a paused session
mkdir -p "$GSD_STACK_DIR/sessions/already-paused"
echo '{"name":"already-paused","status":"paused","project":"/tmp/p","started":"2026-02-12T10:00:00Z","tmux_session":"claude-already-paused","pid":"1234"}' > "$GSD_STACK_DIR/sessions/already-paused/meta.json"
touch "$GSD_STACK_DIR/sessions/already-paused/heartbeat"

# 33. Pausing an already-paused session exits non-zero
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" pause already-paused 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "pause already-paused session exits non-zero"
else
  fail "pause already-paused session exits non-zero" "exit code: $rc"
fi

# 34. Output indicates already paused or not active
if echo "$output" | grep -qi "not active\|already paused\|cannot pause\|not in.*pausable\|state"; then
  pass "pause already-paused session shows state error"
else
  fail "pause already-paused session shows state error" "output: $output"
fi

# ==============================================================================
# Resume Paused Session Tests
# ==============================================================================

echo ""
printf "${BOLD}Resume Paused Session Tests${RESET}\n"

# Reset stack dir for resume tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

# Create paused session (simulates what pause leaves behind)
mkdir -p "$GSD_STACK_DIR/sessions/resume-paused"
echo '{"name":"resume-paused","status":"paused","project":"/tmp/resume-proj","started":"2026-02-12T10:00:00Z","tmux_session":"claude-resume-paused","pid":"1234"}' > "$GSD_STACK_DIR/sessions/resume-paused/meta.json"
touch "$GSD_STACK_DIR/sessions/resume-paused/heartbeat"

# Create a save file that resume will find
echo '{"name":"resume-paused","saved_at":"2026-02-12T12:00:00Z","note":"auto-save on pause","meta":{"name":"resume-paused","status":"active","project":"/tmp/resume-proj"},"pending_count":2,"pending_files":"5-001.md,0-002.md","state_md":"# State\nPhase: 105\nStatus: executing","terminal_context":""}' > "$GSD_STACK_DIR/saves/resume-paused-20260212-120000.json"

# Create pending messages for context
echo -e "---\npriority: normal\n---\ntest msg" > "$GSD_STACK_DIR/pending/5-001.md"
echo -e "---\npriority: urgent\n---\nhotfix" > "$GSD_STACK_DIR/pending/0-002.md"

# 1. resume paused session exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" resume resume-paused 2>&1)
rc=$?
set -e
assert_exit_code "resume paused session exits 0" "0" "$rc"

# 2. After resume, meta.json status is "active"
meta_after=""
if [[ -f "$GSD_STACK_DIR/sessions/resume-paused/meta.json" ]]; then
  meta_after=$(cat "$GSD_STACK_DIR/sessions/resume-paused/meta.json" 2>/dev/null)
fi
if echo "$meta_after" | grep -q '"status":"active"'; then
  pass "resume paused: meta.json status is active"
else
  fail "resume paused: meta.json status is active" "meta: $meta_after"
fi

# 3. _get-state outputs "active"
set +e
state_output=$("$GSD_STACK" _get-state resume-paused 2>&1)
set -e
assert_eq "resume paused: _get-state outputs active" "active" "$state_output"

# 4. After resume, heartbeat file is fresh (within last 10 seconds)
if [[ -f "$GSD_STACK_DIR/sessions/resume-paused/heartbeat" ]]; then
  hb_mtime=$(stat -c %Y "$GSD_STACK_DIR/sessions/resume-paused/heartbeat" 2>/dev/null || stat -f %m "$GSD_STACK_DIR/sessions/resume-paused/heartbeat" 2>/dev/null)
  now_ts=$(date +%s)
  hb_age=$((now_ts - hb_mtime))
  if [[ "$hb_age" -lt 10 ]]; then
    pass "resume paused: heartbeat is fresh"
  else
    fail "resume paused: heartbeat is fresh" "heartbeat age: ${hb_age}s"
  fi
else
  fail "resume paused: heartbeat is fresh" "heartbeat file does not exist"
fi

# 5. History.jsonl contains a "resume" event
if grep -q '"event":"resume"' "$GSD_STACK_DIR/history.jsonl" 2>/dev/null; then
  pass "resume paused: history contains resume event"
else
  fail "resume paused: history contains resume event" "no resume event in history"
fi

# 6. Output contains "resume" or "Resumed" or "active" or "paused"
if echo "$output" | grep -qi "resum\|active\|paused"; then
  pass "resume paused: output mentions resume/active"
else
  fail "resume paused: output mentions resume/active" "output: $output"
fi

# ==============================================================================
# Resume Generates Contextual Prompt Tests
# ==============================================================================

echo ""
printf "${BOLD}Resume Contextual Prompt Tests${RESET}\n"

# 7. Output references save snapshot context (pending count, project, or warm-start)
if echo "$output" | grep -qi "warm-start\|context\|resuming\|pending\|message\|2\|resume-paused\|save\|progress"; then
  pass "resume paused: output references context from save"
else
  fail "resume paused: output references context from save" "output: $output"
fi

# ==============================================================================
# Resume Stalled Session Tests
# ==============================================================================

echo ""
printf "${BOLD}Resume Stalled Session Tests${RESET}\n"

# Create stalled session (active meta but old heartbeat)
mkdir -p "$GSD_STACK_DIR/sessions/resume-stalled"
echo '{"name":"resume-stalled","status":"active","project":"/tmp/stalled-proj","started":"2026-02-12T08:00:00Z","tmux_session":"claude-resume-stalled","pid":"5678"}' > "$GSD_STACK_DIR/sessions/resume-stalled/meta.json"
touch -d "10 minutes ago" "$GSD_STACK_DIR/sessions/resume-stalled/heartbeat"

# 8. Confirm state is stalled first
set +e
stalled_state=$(GSD_STALL_TIMEOUT=300 "$GSD_STACK" _get-state resume-stalled 2>&1)
set -e
assert_eq "stalled session: _get-state outputs stalled" "stalled" "$stalled_state"

# 9. resume stalled session exits 0
set +e
output=$(GSD_MOCK_TMUX=1 GSD_STALL_TIMEOUT=300 "$GSD_STACK" resume resume-stalled 2>&1)
rc=$?
set -e
assert_exit_code "resume stalled session exits 0" "0" "$rc"

# 10. After resume, meta.json status is "active"
meta_after=""
if [[ -f "$GSD_STACK_DIR/sessions/resume-stalled/meta.json" ]]; then
  meta_after=$(cat "$GSD_STACK_DIR/sessions/resume-stalled/meta.json" 2>/dev/null)
fi
if echo "$meta_after" | grep -q '"status":"active"'; then
  pass "resume stalled: meta.json status is active"
else
  fail "resume stalled: meta.json status is active" "meta: $meta_after"
fi

# 11. Heartbeat file is fresh (touched after resume)
if [[ -f "$GSD_STACK_DIR/sessions/resume-stalled/heartbeat" ]]; then
  hb_mtime=$(stat -c %Y "$GSD_STACK_DIR/sessions/resume-stalled/heartbeat" 2>/dev/null || stat -f %m "$GSD_STACK_DIR/sessions/resume-stalled/heartbeat" 2>/dev/null)
  now_ts=$(date +%s)
  hb_age=$((now_ts - hb_mtime))
  if [[ "$hb_age" -lt 10 ]]; then
    pass "resume stalled: heartbeat is fresh"
  else
    fail "resume stalled: heartbeat is fresh" "heartbeat age: ${hb_age}s"
  fi
else
  fail "resume stalled: heartbeat is fresh" "heartbeat file does not exist"
fi

# 12. Output contains "recover" or "stalled" or "resumed"
if echo "$output" | grep -qi "recover\|stalled\|resum"; then
  pass "resume stalled: output indicates recovery"
else
  fail "resume stalled: output indicates recovery" "output: $output"
fi

# ==============================================================================
# Resume Saved Session Tests
# ==============================================================================

echo ""
printf "${BOLD}Resume Saved Session Tests${RESET}\n"

# Create saved session
mkdir -p "$GSD_STACK_DIR/sessions/resume-saved"
echo '{"name":"resume-saved","status":"saved","project":"/tmp/saved-proj","started":"2026-02-12T09:00:00Z","tmux_session":"claude-resume-saved","pid":"9012"}' > "$GSD_STACK_DIR/sessions/resume-saved/meta.json"

# Create a save file
echo '{"name":"resume-saved","saved_at":"2026-02-12T11:00:00Z","note":"manual save","meta":{"name":"resume-saved","status":"saved","project":"/tmp/saved-proj"},"pending_count":0,"pending_files":"","state_md":"","terminal_context":""}' > "$GSD_STACK_DIR/saves/resume-saved-20260212-110000.json"

# 13. resume saved session exits 0
set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" resume resume-saved 2>&1)
rc=$?
set -e
assert_exit_code "resume saved session exits 0" "0" "$rc"

# 14. After resume, meta.json status is "active"
meta_after=""
if [[ -f "$GSD_STACK_DIR/sessions/resume-saved/meta.json" ]]; then
  meta_after=$(cat "$GSD_STACK_DIR/sessions/resume-saved/meta.json" 2>/dev/null)
fi
if echo "$meta_after" | grep -q '"status":"active"'; then
  pass "resume saved: meta.json status is active"
else
  fail "resume saved: meta.json status is active" "meta: $meta_after"
fi

# 15. After resume, heartbeat file exists and is fresh
if [[ -f "$GSD_STACK_DIR/sessions/resume-saved/heartbeat" ]]; then
  hb_mtime=$(stat -c %Y "$GSD_STACK_DIR/sessions/resume-saved/heartbeat" 2>/dev/null || stat -f %m "$GSD_STACK_DIR/sessions/resume-saved/heartbeat" 2>/dev/null)
  now_ts=$(date +%s)
  hb_age=$((now_ts - hb_mtime))
  if [[ "$hb_age" -lt 10 ]]; then
    pass "resume saved: heartbeat exists and is fresh"
  else
    fail "resume saved: heartbeat exists and is fresh" "heartbeat age: ${hb_age}s"
  fi
else
  fail "resume saved: heartbeat exists and is fresh" "heartbeat file does not exist"
fi

# 16. History.jsonl contains a "resume" event for saved
if grep -q '"event":"resume"' "$GSD_STACK_DIR/history.jsonl" 2>/dev/null; then
  pass "resume saved: history contains resume event"
else
  fail "resume saved: history contains resume event" "no resume event in history"
fi

# 17. Output contains "resume" or "new session" or context
if echo "$output" | grep -qi "resum\|new session\|save\|context"; then
  pass "resume saved: output mentions resume/new session"
else
  fail "resume saved: output mentions resume/new session" "output: $output"
fi

# ==============================================================================
# Resume Error Cases
# ==============================================================================

echo ""
printf "${BOLD}Resume Error Cases${RESET}\n"

# 18. resume nonexistent session exits non-zero
set +e
output=$("$GSD_STACK" resume nonexistent 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "resume nonexistent session exits non-zero"
else
  fail "resume nonexistent session exits non-zero" "exit code: $rc"
fi

# 19. Error output contains "not found"
if echo "$output" | grep -qi "not found\|does not exist\|unknown"; then
  pass "resume nonexistent: output shows not found"
else
  fail "resume nonexistent: output shows not found" "output: $output"
fi

# 20. resume stopped session exits non-zero
mkdir -p "$GSD_STACK_DIR/sessions/stopped-for-resume"
echo '{"name":"stopped-for-resume","status":"stopped","project":"/tmp/stopped","started":"2026-02-12T07:00:00Z","tmux_session":"claude-stopped","pid":"0000"}' > "$GSD_STACK_DIR/sessions/stopped-for-resume/meta.json"

set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" resume stopped-for-resume 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "resume stopped session exits non-zero"
else
  fail "resume stopped session exits non-zero" "exit code: $rc"
fi

# 21. Output mentions "cannot resume" or "stopped" or "use session command"
if echo "$output" | grep -qi "cannot resume\|stopped\|session.*command\|start.*new"; then
  pass "resume stopped: output shows helpful error"
else
  fail "resume stopped: output shows helpful error" "output: $output"
fi

# 22. resume with no session name exits non-zero
set +e
output=$("$GSD_STACK" resume 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "resume no args exits non-zero"
else
  fail "resume no args exits non-zero" "exit code: $rc"
fi

# 23. Error output contains usage hint
if echo "$output" | grep -qi "usage\|session name\|required"; then
  pass "resume no args shows usage hint"
else
  fail "resume no args shows usage hint" "output: $output"
fi

# ==============================================================================
# Stop Active Session Tests
# ==============================================================================

echo ""
echo "${BOLD}Stop Active Session Tests${RESET}"

# Reset stack dir for stop tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"
mkdir -p "$GSD_STACK_DIR/sessions" "$GSD_STACK_DIR/pending" "$GSD_STACK_DIR/done" "$GSD_STACK_DIR/recordings" "$GSD_STACK_DIR/saves"
touch "$GSD_STACK_DIR/history.jsonl" "$GSD_STACK_DIR/registry.jsonl"

# Create active session
mkdir -p "$GSD_STACK_DIR/sessions/stop-test"
echo '{"name":"stop-test","status":"active","project":"/tmp/stop-proj","started":"2026-02-12T10:00:00Z","tmux_session":"claude-stop-test","pid":"1234"}' > "$GSD_STACK_DIR/sessions/stop-test/meta.json"
touch "$GSD_STACK_DIR/sessions/stop-test/heartbeat"

# Add some history events to compute stats from
echo '{"ts":"2026-02-12T10:01:00Z","event":"push","detail":"normal: msg 1"}' >> "$GSD_STACK_DIR/history.jsonl"
echo '{"ts":"2026-02-12T10:02:00Z","event":"push","detail":"normal: msg 2"}' >> "$GSD_STACK_DIR/history.jsonl"
echo '{"ts":"2026-02-12T10:03:00Z","event":"pop","detail":"consumed msg 1"}' >> "$GSD_STACK_DIR/history.jsonl"
echo '{"ts":"2026-02-12T10:04:00Z","event":"session","detail":"started: stop-test"}' >> "$GSD_STACK_DIR/history.jsonl"

# Add a registry entry
echo '{"ts":"2026-02-12T10:00:00Z","name":"stop-test","project":"/tmp/stop-proj","action":"start"}' >> "$GSD_STACK_DIR/registry.jsonl"

# 1. stop active session exits 0
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" stop stop-test 2>&1)
rc=$?
if [[ "$rc" -eq 0 ]]; then
  pass "stop active session exits 0"
else
  fail "stop active session exits 0" "exit code: $rc, output: $output"
fi

# 2. After stop, meta.json status is "stopped"
meta_status=$(cat "$GSD_STACK_DIR/sessions/stop-test/meta.json" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
assert_eq "stop: meta.json status is stopped" "stopped" "$meta_status"

# 3. _get-state returns "stopped"
state_output=$("$GSD_STACK" _get-state stop-test 2>&1)
assert_eq "stop: _get-state returns stopped" "stopped" "$state_output"

# 4. After stop, heartbeat file does NOT exist (cleaned up)
if [[ ! -f "$GSD_STACK_DIR/sessions/stop-test/heartbeat" ]]; then
  pass "stop: heartbeat file removed"
else
  fail "stop: heartbeat file removed" "heartbeat still exists"
fi

# 5. After stop, at least one save file exists in saves/ (final auto-save)
save_count=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | wc -l)
save_count=$((save_count + 0))
if [[ "$save_count" -ge 1 ]]; then
  pass "stop: at least one save file exists"
else
  fail "stop: at least one save file exists" "save count: $save_count"
fi

# 6. The save file name starts with "stop-test-"
save_file=$(ls -1 "$GSD_STACK_DIR/saves/" 2>/dev/null | head -1)
if [[ "$save_file" == stop-test-* ]]; then
  pass "stop: save file name starts with stop-test-"
else
  fail "stop: save file name starts with stop-test-" "save file: $save_file"
fi

# 7. History.jsonl contains a "stop" event
if grep -q '"event":"stop"' "$GSD_STACK_DIR/history.jsonl"; then
  pass "stop: history.jsonl contains stop event"
else
  fail "stop: history.jsonl contains stop event" "no stop event found"
fi

# 8. Registry.jsonl contains an entry with "action":"stop"
if grep -q '"action":"stop"' "$GSD_STACK_DIR/registry.jsonl"; then
  pass "stop: registry.jsonl contains action:stop entry"
else
  fail "stop: registry.jsonl contains action:stop entry" "no stop action found"
fi

# 9. Output contains "stopped" or "Stopped"
if echo "$output" | grep -qi "stopped"; then
  pass "stop: output contains stopped confirmation"
else
  fail "stop: output contains stopped confirmation" "output: $output"
fi

# 10. Output contains session duration or stats information
if echo "$output" | grep -qi "duration\|push\|pop\|save\|message"; then
  pass "stop: output contains stats information"
else
  fail "stop: output contains stats information" "output: $output"
fi

# ==============================================================================
# Stop Paused Session Tests
# ==============================================================================

echo ""
echo "${BOLD}Stop Paused Session Tests${RESET}"

# Create a paused session to stop
mkdir -p "$GSD_STACK_DIR/sessions/stop-paused"
echo '{"name":"stop-paused","status":"paused","project":"/tmp/stop-proj","started":"2026-02-12T11:00:00Z","tmux_session":"claude-stop-paused","pid":"5678"}' > "$GSD_STACK_DIR/sessions/stop-paused/meta.json"
touch "$GSD_STACK_DIR/sessions/stop-paused/heartbeat"

# 11. stop paused session exits 0
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" stop stop-paused 2>&1)
rc=$?
if [[ "$rc" -eq 0 ]]; then
  pass "stop paused session exits 0"
else
  fail "stop paused session exits 0" "exit code: $rc, output: $output"
fi

# 12. After stop, meta.json status is "stopped"
meta_status=$(cat "$GSD_STACK_DIR/sessions/stop-paused/meta.json" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
assert_eq "stop paused: meta.json status is stopped" "stopped" "$meta_status"

# 13. Heartbeat file does NOT exist
if [[ ! -f "$GSD_STACK_DIR/sessions/stop-paused/heartbeat" ]]; then
  pass "stop paused: heartbeat file removed"
else
  fail "stop paused: heartbeat file removed" "heartbeat still exists"
fi

# ==============================================================================
# Stop Stalled Session Tests
# ==============================================================================

echo ""
echo "${BOLD}Stop Stalled Session Tests${RESET}"

# Create a stalled session to stop
mkdir -p "$GSD_STACK_DIR/sessions/stop-stalled"
echo '{"name":"stop-stalled","status":"active","project":"/tmp/stop-proj","started":"2026-02-12T09:00:00Z","tmux_session":"claude-stop-stalled","pid":"9012"}' > "$GSD_STACK_DIR/sessions/stop-stalled/meta.json"
touch -d "10 minutes ago" "$GSD_STACK_DIR/sessions/stop-stalled/heartbeat"

# 14. stop stalled session exits 0
output=$(GSD_MOCK_TMUX=1 GSD_STALL_TIMEOUT=300 "$GSD_STACK" stop stop-stalled 2>&1)
rc=$?
if [[ "$rc" -eq 0 ]]; then
  pass "stop stalled session exits 0"
else
  fail "stop stalled session exits 0" "exit code: $rc, output: $output"
fi

# 15. After stop, meta.json status is "stopped"
meta_status=$(cat "$GSD_STACK_DIR/sessions/stop-stalled/meta.json" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
assert_eq "stop stalled: meta.json status is stopped" "stopped" "$meta_status"

# ==============================================================================
# Stop Error Cases
# ==============================================================================

echo ""
echo "${BOLD}Stop Error Cases${RESET}"

# 16. stop nonexistent session exits non-zero
set +e
output=$("$GSD_STACK" stop nonexistent-session 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "stop nonexistent session exits non-zero"
else
  fail "stop nonexistent session exits non-zero" "exit code: $rc"
fi

# 17. Output contains "not found"
if echo "$output" | grep -qi "not found"; then
  pass "stop nonexistent: output shows not found"
else
  fail "stop nonexistent: output shows not found" "output: $output"
fi

# 18. stop already-stopped session exits non-zero
mkdir -p "$GSD_STACK_DIR/sessions/already-stopped"
echo '{"name":"already-stopped","status":"stopped","project":"/tmp/stop-proj","started":"2026-02-12T08:00:00Z","tmux_session":"claude-already-stopped","pid":"3456"}' > "$GSD_STACK_DIR/sessions/already-stopped/meta.json"

set +e
output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" stop already-stopped 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "stop already-stopped session exits non-zero"
else
  fail "stop already-stopped session exits non-zero" "exit code: $rc"
fi

# 19. Output contains "already stopped"
if echo "$output" | grep -qi "already stopped"; then
  pass "stop already-stopped: output shows already stopped"
else
  fail "stop already-stopped: output shows already stopped" "output: $output"
fi

# 20. stop with no session name exits non-zero
set +e
output=$("$GSD_STACK" stop 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "stop no args exits non-zero"
else
  fail "stop no args exits non-zero" "exit code: $rc"
fi

# 21. Output contains usage hint
if echo "$output" | grep -qi "usage\|session name\|required"; then
  pass "stop no args shows usage hint"
else
  fail "stop no args shows usage hint" "output: $output"
fi

# ==============================================================================
# Stop JSON Output Test
# ==============================================================================

echo ""
echo "${BOLD}Stop JSON Output Tests${RESET}"

# Create a fresh active session for JSON output test
mkdir -p "$GSD_STACK_DIR/sessions/stop-json"
echo '{"name":"stop-json","status":"active","project":"/tmp/stop-proj","started":"2026-02-12T12:00:00Z","tmux_session":"claude-stop-json","pid":"7890"}' > "$GSD_STACK_DIR/sessions/stop-json/meta.json"
touch "$GSD_STACK_DIR/sessions/stop-json/heartbeat"

# 22. JSON stop exits 0
output=$(GSD_FORMAT=json GSD_MOCK_TMUX=1 "$GSD_STACK" stop stop-json 2>&1)
rc=$?
if [[ "$rc" -eq 0 ]]; then
  pass "stop JSON output exits 0"
else
  fail "stop JSON output exits 0" "exit code: $rc, output: $output"
fi

# 23. Output starts with { (JSON object)
if [[ "$output" == "{"* ]]; then
  pass "stop JSON output starts with {"
else
  fail "stop JSON output starts with {" "output: $output"
fi

# 24. Output contains "status":"stopped" and "session" key
if echo "$output" | grep -q '"status":"stopped"' && echo "$output" | grep -q '"session"'; then
  pass "stop JSON output contains status:stopped and session"
else
  fail "stop JSON output contains status:stopped and session" "output: $output"
fi

# ==============================================================================
# Record Subcommand Tests (basic, mocked capture)
# ==============================================================================

echo ""
printf "${BOLD}Record Subcommand Tests${RESET}\n"

# Reset stack dir for clean record tests
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1  # re-bootstrap dirs

# 1. GSD_MOCK_CAPTURE=1 record --name=test-rec exits 0
set +e
output=$(GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=test-rec 2>&1)
rc=$?
set -e
assert_exit_code "record --name=test-rec exits 0" "0" "$rc"

# 2. Creates recordings/test-rec/ directory
assert_dir_exists "record creates recordings/test-rec/ directory" "$GSD_STACK_DIR/recordings/test-rec"

# 3. Creates meta.json
assert_file_exists "record creates meta.json" "$GSD_STACK_DIR/recordings/test-rec/meta.json"

# 4. meta.json contains "name":"test-rec"
meta_content=$(cat "$GSD_STACK_DIR/recordings/test-rec/meta.json" 2>/dev/null || echo "")
assert_contains "meta.json contains name:test-rec" "$meta_content" '"name":"test-rec"'

# 5. meta.json contains "status":"recording"
assert_contains "meta.json contains status:recording" "$meta_content" '"status":"recording"'

# 6. meta.json contains "started" with ISO 8601 timestamp
assert_contains "meta.json contains started timestamp" "$meta_content" '"started":"'

# 7. Creates stream.jsonl
assert_file_exists "record creates stream.jsonl" "$GSD_STACK_DIR/recordings/test-rec/stream.jsonl"

# 8. stream.jsonl has at least 1 entry
stream_lines=$(wc -l < "$GSD_STACK_DIR/recordings/test-rec/stream.jsonl" 2>/dev/null || echo "0")
stream_lines=$((stream_lines + 0))
if [[ "$stream_lines" -ge 1 ]]; then
  pass "stream.jsonl has at least 1 entry"
else
  fail "stream.jsonl has at least 1 entry" "got $stream_lines lines"
fi

# 9. First stream.jsonl entry contains "type":"recording_start"
first_line=$(head -1 "$GSD_STACK_DIR/recordings/test-rec/stream.jsonl" 2>/dev/null || echo "")
assert_contains "first stream entry is recording_start" "$first_line" '"type":"recording_start"'

# 10. History.jsonl has a record event
history_content=$(cat "$GSD_STACK_DIR/history.jsonl" 2>/dev/null || echo "")
assert_contains "history has record event" "$history_content" '"event":"record"'

# ==============================================================================
# Record Default Name Tests
# ==============================================================================

echo ""
printf "${BOLD}Record Default Name Tests${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# 1. GSD_MOCK_CAPTURE=1 record (no --name) exits 0
set +e
output=$(GSD_MOCK_CAPTURE=1 "$GSD_STACK" record 2>&1)
rc=$?
set -e
assert_exit_code "record with no --name exits 0" "0" "$rc"

# 2. A recording directory exists under recordings/
rec_dirs=$(ls -1 "$GSD_STACK_DIR/recordings/" 2>/dev/null | wc -l)
rec_dirs=$((rec_dirs + 0))
if [[ "$rec_dirs" -ge 1 ]]; then
  pass "record default name creates directory under recordings/"
else
  fail "record default name creates directory under recordings/" "no directories found"
fi

# 3. meta.json inside that directory has status:recording
rec_dir=$(ls -1 "$GSD_STACK_DIR/recordings/" 2>/dev/null | head -1)
if [[ -n "$rec_dir" ]] && [[ -f "$GSD_STACK_DIR/recordings/$rec_dir/meta.json" ]]; then
  default_meta=$(cat "$GSD_STACK_DIR/recordings/$rec_dir/meta.json")
  assert_contains "default name meta.json has status:recording" "$default_meta" '"status":"recording"'
else
  fail "default name meta.json has status:recording" "no meta.json found"
fi

# ==============================================================================
# Record Duplicate Detection Tests
# ==============================================================================

echo ""
printf "${BOLD}Record Duplicate Detection Tests${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# Start first recording
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=dup-rec >/dev/null 2>&1

# Start second recording (should fail)
set +e
output=$(GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=dup-rec2 2>&1)
rc=$?
set -e

# 1. Second invocation exits non-zero
if [[ "$rc" -ne 0 ]]; then
  pass "duplicate record exits non-zero"
else
  fail "duplicate record exits non-zero" "exit code: $rc"
fi

# 2. Output contains indication of active recording
if echo "$output" | grep -iq "already\|active recording"; then
  pass "duplicate record output mentions active recording"
else
  fail "duplicate record output mentions active recording" "output: $output"
fi

# ==============================================================================
# Record Mock Capture Events Tests
# ==============================================================================

echo ""
printf "${BOLD}Record Mock Capture Events Tests${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=capture-test >/dev/null 2>&1

# 1. stream.jsonl has at least 3 entries
stream_lines=$(wc -l < "$GSD_STACK_DIR/recordings/capture-test/stream.jsonl" 2>/dev/null || echo "0")
stream_lines=$((stream_lines + 0))
if [[ "$stream_lines" -ge 3 ]]; then
  pass "mock capture writes at least 3 stream entries"
else
  fail "mock capture writes at least 3 stream entries" "got $stream_lines lines"
fi

# 2. At least one entry contains "type":"terminal"
if grep -q '"type":"terminal"' "$GSD_STACK_DIR/recordings/capture-test/stream.jsonl" 2>/dev/null; then
  pass "mock capture has terminal event"
else
  fail "mock capture has terminal event" "no terminal event found"
fi

# 3. At least one entry contains "type":"file_change"
if grep -q '"type":"file_change"' "$GSD_STACK_DIR/recordings/capture-test/stream.jsonl" 2>/dev/null; then
  pass "mock capture has file_change event"
else
  fail "mock capture has file_change event" "no file_change event found"
fi

# ==============================================================================
# Record JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Record JSON Output Tests${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# 1. JSON record exits 0
set +e
output=$(GSD_FORMAT=json GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=json-rec 2>&1)
rc=$?
set -e
assert_exit_code "record JSON output exits 0" "0" "$rc"

# 2. Output starts with {
if [[ "$output" == "{"* ]]; then
  pass "record JSON output starts with {"
else
  fail "record JSON output starts with {" "output: $output"
fi

# 3. Output contains name:json-rec
assert_contains "record JSON contains name:json-rec" "$output" '"name":"json-rec"'

# 4. Output contains status:recording
assert_contains "record JSON contains status:recording" "$output" '"status":"recording"'

# ==============================================================================
# Mark Subcommand Tests (with active recording)
# ==============================================================================

echo ""
printf "${BOLD}Mark Subcommand Tests${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# Start recording for mark tests
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=mark-test >/dev/null 2>&1

# 1. mark "tests passing" exits 0
set +e
output=$("$GSD_STACK" mark "tests passing" 2>&1)
rc=$?
set -e
assert_exit_code "mark 'tests passing' exits 0" "0" "$rc"

# 2. stream.jsonl has an entry with "type":"marker"
if grep -q '"type":"marker"' "$GSD_STACK_DIR/recordings/mark-test/stream.jsonl" 2>/dev/null; then
  pass "stream.jsonl has marker event"
else
  fail "stream.jsonl has marker event" "no marker event found"
fi

# 3. Marker entry contains "label":"tests passing"
if grep '"type":"marker"' "$GSD_STACK_DIR/recordings/mark-test/stream.jsonl" 2>/dev/null | grep -q '"label":"tests passing"'; then
  pass "marker entry contains label:tests passing"
else
  fail "marker entry contains label:tests passing" "label not found"
fi

# 4. History.jsonl has a mark event
history_content=$(cat "$GSD_STACK_DIR/history.jsonl" 2>/dev/null || echo "")
assert_contains "history has mark event" "$history_content" '"event":"mark"'

# ==============================================================================
# Mark Multiple Markers Tests
# ==============================================================================

echo ""
printf "${BOLD}Mark Multiple Markers Tests${RESET}\n"

# Use the same recording from above (mark-test)
"$GSD_STACK" mark "checkpoint-1" >/dev/null 2>&1
"$GSD_STACK" mark "checkpoint-2" >/dev/null 2>&1

# Count marker events (at least 3: tests passing + checkpoint-1 + checkpoint-2)
marker_count=$(grep -c '"type":"marker"' "$GSD_STACK_DIR/recordings/mark-test/stream.jsonl" 2>/dev/null || echo "0")
if [[ "$marker_count" -ge 2 ]]; then
  pass "stream.jsonl has at least 2 marker entries (got $marker_count)"
else
  fail "stream.jsonl has at least 2 marker entries" "got $marker_count"
fi

# ==============================================================================
# Mark Without Active Recording Tests
# ==============================================================================

echo ""
printf "${BOLD}Mark Without Active Recording Tests${RESET}\n"

# Reset stack dir (no recording started)
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# 1. mark with no recording exits non-zero
set +e
output=$("$GSD_STACK" mark "no recording" 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "mark without recording exits non-zero"
else
  fail "mark without recording exits non-zero" "exit code: $rc"
fi

# 2. Output mentions no active recording
if echo "$output" | grep -iq "no active recording\|not recording"; then
  pass "mark without recording mentions no active recording"
else
  fail "mark without recording mentions no active recording" "output: $output"
fi

# ==============================================================================
# Mark Without Label Tests
# ==============================================================================

echo ""
printf "${BOLD}Mark Without Label Tests${RESET}\n"

# Reset and start recording
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=nolabel >/dev/null 2>&1

# 1. mark with no label exits non-zero
set +e
output=$("$GSD_STACK" mark 2>&1)
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  pass "mark without label exits non-zero"
else
  fail "mark without label exits non-zero" "exit code: $rc"
fi

# 2. Output mentions label required
if echo "$output" | grep -iq "label\|Usage\|required"; then
  pass "mark without label mentions label required"
else
  fail "mark without label mentions label required" "output: $output"
fi

# ==============================================================================
# Mark JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Mark JSON Output Tests${RESET}\n"

# Recording still active from nolabel test above
set +e
output=$(GSD_FORMAT=json "$GSD_STACK" mark "json-marker" 2>&1)
rc=$?
set -e

# 1. Exits 0
assert_exit_code "mark JSON exits 0" "0" "$rc"

# 2. Output starts with {
if [[ "$output" == "{"* ]]; then
  pass "mark JSON output starts with {"
else
  fail "mark JSON output starts with {" "output: $output"
fi

# 3. Contains type:marker
assert_contains "mark JSON contains type:marker" "$output" '"type":"marker"'

# 4. Contains label:json-marker
assert_contains "mark JSON contains label:json-marker" "$output" '"label":"json-marker"'

# ==============================================================================
# Stack Event Mirroring Tests
# ==============================================================================

echo ""
printf "${BOLD}Stack Event Mirroring Tests${RESET}\n"

# Reset stack dir and start recording
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=mirror-test >/dev/null 2>&1

# Count stream lines before push
before_count=$(wc -l < "$GSD_STACK_DIR/recordings/mirror-test/stream.jsonl" 2>/dev/null || echo "0")
before_count=$((before_count + 0))

# Push a message
"$GSD_STACK" push "mirrored msg" >/dev/null 2>&1

# Count stream lines after push
after_count=$(wc -l < "$GSD_STACK_DIR/recordings/mirror-test/stream.jsonl" 2>/dev/null || echo "0")
after_count=$((after_count + 0))

# 1. after_count > before_count
if [[ "$after_count" -gt "$before_count" ]]; then
  pass "push adds event to recording stream (before=$before_count, after=$after_count)"
else
  fail "push adds event to recording stream" "before=$before_count, after=$after_count"
fi

# 2. stream.jsonl has stack_push event
if grep -q '"type":"stack_push"' "$GSD_STACK_DIR/recordings/mirror-test/stream.jsonl" 2>/dev/null; then
  pass "stream.jsonl has stack_push event"
else
  fail "stream.jsonl has stack_push event" "no stack_push event found"
fi

# 3. Pop and check for stack_pop event
set +e
"$GSD_STACK" pop >/dev/null 2>&1
set -e

if grep -q '"type":"stack_pop"' "$GSD_STACK_DIR/recordings/mirror-test/stream.jsonl" 2>/dev/null; then
  pass "stream.jsonl has stack_pop event after pop"
else
  fail "stream.jsonl has stack_pop event after pop" "no stack_pop event found"
fi

# ==============================================================================
# Stop-Record Basic Tests
# ==============================================================================

printf "${BOLD}Stop-Record Basic Tests${RESET}\n"

# Reset stack dir and start recording
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=stop-test >/dev/null 2>&1

# Add some markers
"$GSD_STACK" mark "phase-1-start" >/dev/null 2>&1
"$GSD_STACK" mark "phase-1-done" >/dev/null 2>&1

# Add a stack push to get a stack event in the stream
"$GSD_STACK" push "test msg" >/dev/null 2>&1

# Stop recording
set +e
stop_output=$("$GSD_STACK" stop-record 2>&1)
stop_rc=$?
set -e

# 1. stop-record exits 0
assert_exit_code "stop-record exits 0" "0" "$stop_rc"

# 2. meta.json has status stopped
meta_content=$(cat "$GSD_STACK_DIR/recordings/stop-test/meta.json" 2>/dev/null || echo "")
assert_contains "meta.json has status stopped" "$meta_content" '"status":"stopped"'

# 3. meta.json has ended field
assert_contains "meta.json has ended field" "$meta_content" '"ended"'

# 4. history.jsonl has stop-record event
history=$(cat "$GSD_STACK_DIR/history.jsonl" 2>/dev/null || echo "")
assert_contains "history.jsonl has stop-record event" "$history" '"event":"stop-record"'

# 5. After stop-record, mark should fail
set +e
mark_output=$("$GSD_STACK" mark "should fail" 2>&1)
mark_rc=$?
set -e
if [[ "$mark_rc" -ne 0 ]]; then
  pass "mark fails after stop-record (no active recording)"
else
  fail "mark fails after stop-record (no active recording)" "expected non-zero exit, got $mark_rc"
fi

# ==============================================================================
# Stop-Record Creates metrics.json
# ==============================================================================

printf "${BOLD}Stop-Record Creates metrics.json${RESET}\n"

# Using the stop-test recording from above
metrics_file="$GSD_STACK_DIR/recordings/stop-test/metrics.json"

# 1. metrics.json exists
assert_file_exists "metrics.json file exists" "$metrics_file"

# Read metrics
metrics_content=$(cat "$metrics_file" 2>/dev/null || echo "")

# 2. has duration_seconds
assert_contains "metrics.json has duration_seconds" "$metrics_content" '"duration_seconds"'

# 3. has event_count
assert_contains "metrics.json has event_count" "$metrics_content" '"event_count"'

# 4. has events_by_type
assert_contains "metrics.json has events_by_type" "$metrics_content" '"events_by_type"'

# 5. event_count is > 0
event_count=$(echo "$metrics_content" | grep -o '"event_count":[0-9]*' 2>/dev/null | head -1 | cut -d: -f2 || echo "0")
event_count=${event_count:-0}
if [[ "$event_count" -gt 0 ]]; then
  pass "metrics.json event_count > 0 (got $event_count)"
else
  fail "metrics.json event_count > 0" "got $event_count"
fi

# 6. events_by_type has terminal
assert_contains "metrics.json events_by_type has terminal" "$metrics_content" '"terminal"'

# 7. events_by_type has marker
assert_contains "metrics.json events_by_type has marker" "$metrics_content" '"marker"'

# 8. has first_event timestamp
assert_contains "metrics.json has first_event" "$metrics_content" '"first_event"'

# 9. has last_event timestamp
assert_contains "metrics.json has last_event" "$metrics_content" '"last_event"'

# ==============================================================================
# Stop-Record Creates transcript.md
# ==============================================================================

printf "${BOLD}Stop-Record Creates transcript.md${RESET}\n"

transcript_file="$GSD_STACK_DIR/recordings/stop-test/transcript.md"

# 1. transcript.md exists
assert_file_exists "transcript.md file exists" "$transcript_file"

# Read transcript
transcript_content=$(cat "$transcript_file" 2>/dev/null || echo "")

# 2. contains Recording Transcript
assert_contains "transcript.md has Recording Transcript heading" "$transcript_content" "Recording Transcript"

# 3. contains recording name
assert_contains "transcript.md has recording name" "$transcript_content" "stop-test"

# 4. contains marker label phase-1-start
assert_contains "transcript.md has phase-1-start marker" "$transcript_content" "phase-1-start"

# 5. contains marker label phase-1-done
assert_contains "transcript.md has phase-1-done marker" "$transcript_content" "phase-1-done"

# 6. contains terminal reference
if [[ "$transcript_content" == *"terminal"* ]] || [[ "$transcript_content" == *"Terminal"* ]]; then
  pass "transcript.md has terminal reference"
else
  fail "transcript.md has terminal reference" "no terminal/Terminal found"
fi

# 7. contains file reference
if [[ "$transcript_content" == *"file"* ]] || [[ "$transcript_content" == *"File"* ]]; then
  pass "transcript.md has file reference"
else
  fail "transcript.md has file reference" "no file/File found"
fi

# 8. transcript has at least 10 lines
transcript_lines=$(echo "$transcript_content" | wc -l 2>/dev/null || echo "0")
transcript_lines=$((transcript_lines + 0))
if [[ "$transcript_lines" -ge 10 ]]; then
  pass "transcript.md has >= 10 lines (got $transcript_lines)"
else
  fail "transcript.md has >= 10 lines" "got $transcript_lines lines"
fi

# ==============================================================================
# Stop-Record Output Summary
# ==============================================================================

printf "${BOLD}Stop-Record Output Summary${RESET}\n"

# 1. output contains duration/Duration
if [[ "$stop_output" == *"uration"* ]] || [[ "$stop_output" == *"duration"* ]]; then
  pass "stop-record output contains duration"
else
  fail "stop-record output contains duration" "output: $stop_output"
fi

# 2. output contains recording name
assert_contains "stop-record output contains recording name" "$stop_output" "stop-test"

# 3. output contains events/Events
if [[ "$stop_output" == *"vents"* ]] || [[ "$stop_output" == *"events"* ]]; then
  pass "stop-record output contains events"
else
  fail "stop-record output contains events" "output: $stop_output"
fi

# ==============================================================================
# Stop-Record Without Active Recording
# ==============================================================================

printf "${BOLD}Stop-Record Without Active Recording${RESET}\n"

# Reset stack dir (no recording started)
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1

# 1. stop-record exits non-zero
set +e
no_rec_output=$("$GSD_STACK" stop-record 2>&1)
no_rec_rc=$?
set -e

if [[ "$no_rec_rc" -ne 0 ]]; then
  pass "stop-record with no recording exits non-zero"
else
  fail "stop-record with no recording exits non-zero" "got exit code $no_rec_rc"
fi

# 2. output contains error message about no recording
if [[ "$no_rec_output" == *"no active recording"* ]] || [[ "$no_rec_output" == *"No active recording"* ]] || [[ "$no_rec_output" == *"not recording"* ]]; then
  pass "stop-record error message mentions no recording"
else
  fail "stop-record error message mentions no recording" "output: $no_rec_output"
fi

# ==============================================================================
# Stop-Record JSON Output
# ==============================================================================

printf "${BOLD}Stop-Record JSON Output${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=json-stop >/dev/null 2>&1
"$GSD_STACK" mark "json-test-marker" >/dev/null 2>&1

# 1. GSD_FORMAT=json stop-record exits 0
set +e
json_stop_output=$(GSD_FORMAT=json "$GSD_STACK" stop-record 2>&1)
json_stop_rc=$?
set -e
assert_exit_code "GSD_FORMAT=json stop-record exits 0" "0" "$json_stop_rc"

# 2. output starts with {
if [[ "$json_stop_output" == "{"* ]]; then
  pass "JSON stop-record output starts with {"
else
  fail "JSON stop-record output starts with {" "output: $json_stop_output"
fi

# 3. output contains name
assert_contains "JSON stop-record has name" "$json_stop_output" '"name":"json-stop"'

# 4. output contains duration_seconds
assert_contains "JSON stop-record has duration_seconds" "$json_stop_output" '"duration_seconds"'

# 5. output contains event_count
assert_contains "JSON stop-record has event_count" "$json_stop_output" '"event_count"'

# ==============================================================================
# Stop-Record With Rich Stream Data
# ==============================================================================

printf "${BOLD}Stop-Record With Rich Stream Data${RESET}\n"

# Reset stack dir
rm -rf "$GSD_STACK_DIR"
"$GSD_STACK" version >/dev/null 2>&1
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=rich-test >/dev/null 2>&1

# Add 3 markers
"$GSD_STACK" mark "m1" >/dev/null 2>&1
"$GSD_STACK" mark "m2" >/dev/null 2>&1
"$GSD_STACK" mark "m3" >/dev/null 2>&1

# Push 2 messages (for stack_push events)
"$GSD_STACK" push "msg1" >/dev/null 2>&1
"$GSD_STACK" push "msg2" >/dev/null 2>&1

# Stop recording
set +e
"$GSD_STACK" stop-record >/dev/null 2>&1
rich_rc=$?
set -e
assert_exit_code "rich-test stop-record exits 0" "0" "$rich_rc"

# Read metrics
rich_metrics=$(cat "$GSD_STACK_DIR/recordings/rich-test/metrics.json" 2>/dev/null || echo "")

# event_count should be >= 8
rich_event_count=$(echo "$rich_metrics" | grep -o '"event_count":[0-9]*' 2>/dev/null | head -1 | cut -d: -f2 || echo "0")
rich_event_count=${rich_event_count:-0}
if [[ "$rich_event_count" -ge 8 ]]; then
  pass "rich-test event_count >= 8 (got $rich_event_count)"
else
  fail "rich-test event_count >= 8" "got $rich_event_count"
fi

# Validate marker count >= 3
rich_marker_count=$(echo "$rich_metrics" | grep -o '"marker":[0-9]*' 2>/dev/null | head -1 | cut -d: -f2 || echo "0")
rich_marker_count=${rich_marker_count:-0}
if [[ "$rich_marker_count" -ge 3 ]]; then
  pass "rich-test marker count >= 3 (got $rich_marker_count)"
else
  fail "rich-test marker count >= 3" "got $rich_marker_count"
fi

# ==============================================================================
# Play Analyze Mode Tests (default)
# ==============================================================================

echo ""
printf "${BOLD}Play Analyze Mode Tests${RESET}\n"

# Set up a recording with known data for all play tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Start recording
set +e
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=play-test >/dev/null 2>&1
set -e

# Add markers
set +e
"$GSD_STACK" mark "phase-start" >/dev/null 2>&1
"$GSD_STACK" mark "tests-passing" >/dev/null 2>&1
set -e

# Push a message for stack event
set +e
"$GSD_STACK" push "test command" >/dev/null 2>&1
set -e

# Stop recording
set +e
"$GSD_STACK" stop-record >/dev/null 2>&1
set -e

# Test: play analyze exits 0
set +e
play_output=$("$GSD_STACK" play play-test 2>&1)
play_rc=$?
set -e
assert_eq "play analyze exits 0" "0" "$play_rc"

# Test: output contains recording name in header
assert_contains "play analyze shows recording name" "$play_output" "play-test"

# Test: output contains markers
assert_contains "play analyze shows phase-start marker" "$play_output" "phase-start"
assert_contains "play analyze shows tests-passing marker" "$play_output" "tests-passing"

# Test: output contains terminal events
if echo "$play_output" | grep -qi "terminal\|Terminal"; then
  pass "play analyze shows terminal events"
else
  fail "play analyze shows terminal events" "output does not contain terminal/Terminal"
fi

# Test: output contains file events
if echo "$play_output" | grep -qi "file\|File"; then
  pass "play analyze shows file events"
else
  fail "play analyze shows file events" "output does not contain file/File"
fi

# Test: output contains Duration in metrics
if echo "$play_output" | grep -qi "duration\|Duration"; then
  pass "play analyze shows Duration in metrics"
else
  fail "play analyze shows Duration in metrics" "output does not contain Duration"
fi

# Test: output contains Events count
if echo "$play_output" | grep -qi "events\|Events"; then
  pass "play analyze shows Events count"
else
  fail "play analyze shows Events count" "output does not contain Events"
fi

# Test: output has at least 10 lines
play_lines=$(echo "$play_output" | wc -l)
play_lines=$((play_lines + 0))
if [[ "$play_lines" -ge 10 ]]; then
  pass "play analyze has >= 10 lines of output (got $play_lines)"
else
  fail "play analyze has >= 10 lines of output" "got $play_lines lines"
fi

# ==============================================================================
# Play Analyze Nonexistent Recording Tests
# ==============================================================================

echo ""
printf "${BOLD}Play Analyze Nonexistent Recording Tests${RESET}\n"

set +e
noexist_output=$("$GSD_STACK" play nonexistent-recording 2>&1)
noexist_rc=$?
set -e

if [[ "$noexist_rc" -ne 0 ]]; then
  pass "play nonexistent recording exits non-zero"
else
  fail "play nonexistent recording exits non-zero" "exit code: $noexist_rc"
fi

if echo "$noexist_output" | grep -qi "not found\|does not exist\|no recording"; then
  pass "play nonexistent shows error message"
else
  fail "play nonexistent shows error message" "output: $noexist_output"
fi

# ==============================================================================
# Play No Arguments Tests
# ==============================================================================

echo ""
printf "${BOLD}Play No Arguments Tests${RESET}\n"

set +e
noargs_output=$("$GSD_STACK" play 2>&1)
noargs_rc=$?
set -e

if [[ "$noargs_rc" -ne 0 ]]; then
  pass "play no arguments exits non-zero"
else
  fail "play no arguments exits non-zero" "exit code: $noargs_rc"
fi

if echo "$noargs_output" | grep -qi "usage\|recording name"; then
  pass "play no arguments shows usage hint"
else
  fail "play no arguments shows usage hint" "output: $noargs_output"
fi

# ==============================================================================
# Play Analyze JSON Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Play Analyze JSON Output Tests${RESET}\n"

set +e
json_play_output=$(GSD_FORMAT=json "$GSD_STACK" play play-test 2>&1)
json_play_rc=$?
set -e
assert_eq "play json exits 0" "0" "$json_play_rc"

# Output starts with { (JSON object)
if [[ "$json_play_output" == "{"* ]]; then
  pass "play json starts with {"
else
  fail "play json starts with {" "starts with: ${json_play_output:0:20}"
fi

# Output contains recording name
assert_contains "play json has recording name" "$json_play_output" '"name":"play-test"'

# Output contains timeline array
assert_contains "play json has timeline key" "$json_play_output" '"timeline"'

# Output contains duration_seconds
assert_contains "play json has duration_seconds" "$json_play_output" '"duration_seconds"'

# ==============================================================================
# Play --step Mode Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --step Mode Tests${RESET}\n"

# Create a helper recording for step tests
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=step-test >/dev/null 2>&1
"$GSD_STACK" mark "step-marker" >/dev/null 2>&1
"$GSD_STACK" stop-record >/dev/null 2>&1
set -e

# Step mode with piped input (Enter presses then q to quit)
set +e
step_output=$(printf '\n\n\nq\n' | "$GSD_STACK" play --step step-test 2>&1)
step_rc=$?
set -e
assert_eq "play --step exits 0" "0" "$step_rc"

# Output contains event number with total format [1/
if echo "$step_output" | grep -qE '1/|(\[1/)'; then
  pass "play --step shows event number [1/N]"
else
  fail "play --step shows event number [1/N]" "output: $step_output"
fi

# Output contains recording_start (first event type)
if echo "$step_output" | grep -qi "recording.start\|Recording started"; then
  pass "play --step shows recording_start event"
else
  fail "play --step shows recording_start event" "output: $step_output"
fi

# Output contains marker label
assert_contains "play --step shows step-marker label" "$step_output" "step-marker"

# Output contains quit/end acknowledgement
if echo "$step_output" | grep -qi "q\|quit\|end"; then
  pass "play --step shows quit/end acknowledgement"
else
  fail "play --step shows quit/end acknowledgement" "output: $step_output"
fi

# ==============================================================================
# Play --step End of Recording Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --step End of Recording Tests${RESET}\n"

# Step through ALL events (send enough Enter presses)
set +e
step_all_output=$(printf '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' | "$GSD_STACK" play --step step-test 2>&1)
step_all_rc=$?
set -e

if echo "$step_all_output" | grep -qi "end of recording\|End of recording\|no more events"; then
  pass "play --step shows end of recording message"
else
  fail "play --step shows end of recording message" "output: $step_all_output"
fi

# ==============================================================================
# Play --step Shows Event Details Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --step Shows Event Details Tests${RESET}\n"

# Check event type is shown
if echo "$step_all_output" | grep -qi "type\|Type\|Recording\|Terminal\|Marker\|started"; then
  pass "play --step shows event type details"
else
  fail "play --step shows event type details" "output: $step_all_output"
fi

# Check timestamp pattern (contains T or : for ISO format / time)
if echo "$step_all_output" | grep -qE 'T|[0-9]{2}:[0-9]{2}'; then
  pass "play --step shows timestamp pattern"
else
  fail "play --step shows timestamp pattern" "output: $step_all_output"
fi

# ==============================================================================
# Metrics Display Tests (setup)
# ==============================================================================

echo ""
printf "${BOLD}Metrics Display Tests${RESET}\n"

# Create a recording with known, diverse data for metrics tests
rm -rf "$TEST_DIR/stack" && export GSD_STACK_DIR="$TEST_DIR/stack"

# Start recording
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=metrics-test >/dev/null 2>&1

# Add markers
"$GSD_STACK" mark "phase-start" >/dev/null 2>&1
"$GSD_STACK" mark "tests-done" >/dev/null 2>&1

# Push 2 messages
"$GSD_STACK" push "cmd1" >/dev/null 2>&1
"$GSD_STACK" push "cmd2" >/dev/null 2>&1

# Pop 1 message
"$GSD_STACK" pop >/dev/null 2>&1

# Stop recording
"$GSD_STACK" stop-record >/dev/null 2>&1

# ==============================================================================
# Metrics Display Basic Tests
# ==============================================================================

echo ""
printf "${BOLD}Metrics Display Basic Tests${RESET}\n"

set +e
metrics_output=$("$GSD_STACK" metrics metrics-test 2>&1)
metrics_rc=$?
set -e
assert_eq "metrics display exits 0" "0" "$metrics_rc"

# Output contains recording name
assert_contains "metrics shows recording name" "$metrics_output" "metrics-test"

# Output contains Duration metric
if echo "$metrics_output" | grep -qi "duration"; then
  pass "metrics shows duration"
else
  fail "metrics shows duration" "output: $metrics_output"
fi

# Output contains Efficiency metric
if echo "$metrics_output" | grep -qi "efficiency"; then
  pass "metrics shows efficiency"
else
  fail "metrics shows efficiency" "output: $metrics_output"
fi

# Output contains Active time metric
if echo "$metrics_output" | grep -qi "active"; then
  pass "metrics shows active time"
else
  fail "metrics shows active time" "output: $metrics_output"
fi

# Output contains Idle time metric
if echo "$metrics_output" | grep -qi "idle"; then
  pass "metrics shows idle time"
else
  fail "metrics shows idle time" "output: $metrics_output"
fi

# Output contains Stall metric
if echo "$metrics_output" | grep -qi "stall"; then
  pass "metrics shows stall count"
else
  fail "metrics shows stall count" "output: $metrics_output"
fi

# Output contains Marker metric
if echo "$metrics_output" | grep -qi "marker"; then
  pass "metrics shows marker count"
else
  fail "metrics shows marker count" "output: $metrics_output"
fi

# Output contains Terminal metric
if echo "$metrics_output" | grep -qi "terminal"; then
  pass "metrics shows terminal snapshots"
else
  fail "metrics shows terminal snapshots" "output: $metrics_output"
fi

# Output contains File metric
if echo "$metrics_output" | grep -qi "file"; then
  pass "metrics shows file changes"
else
  fail "metrics shows file changes" "output: $metrics_output"
fi

# Output contains Stack metric
if echo "$metrics_output" | grep -qi "stack"; then
  pass "metrics shows stack operations"
else
  fail "metrics shows stack operations" "output: $metrics_output"
fi

# Output contains Events metric
if echo "$metrics_output" | grep -qi "events"; then
  pass "metrics shows events per minute"
else
  fail "metrics shows events per minute" "output: $metrics_output"
fi

# Output contains Token metric
if echo "$metrics_output" | grep -qi "token"; then
  pass "metrics shows estimated tokens"
else
  fail "metrics shows estimated tokens" "output: $metrics_output"
fi

# ==============================================================================
# Metrics Display Nonexistent Recording
# ==============================================================================

echo ""
printf "${BOLD}Metrics Display Nonexistent Recording${RESET}\n"

set +e
metrics_noexist_output=$("$GSD_STACK" metrics nonexistent 2>&1)
metrics_noexist_rc=$?
set -e

if [[ "$metrics_noexist_rc" -ne 0 ]]; then
  pass "metrics nonexistent exits non-zero"
else
  fail "metrics nonexistent exits non-zero" "got exit code $metrics_noexist_rc"
fi

if echo "$metrics_noexist_output" | grep -qi "not found\|does not exist\|no recording"; then
  pass "metrics nonexistent shows error message"
else
  fail "metrics nonexistent shows error message" "output: $metrics_noexist_output"
fi

# ==============================================================================
# Metrics Display No Arguments
# ==============================================================================

echo ""
printf "${BOLD}Metrics Display No Arguments${RESET}\n"

set +e
metrics_noargs_output=$("$GSD_STACK" metrics 2>&1)
metrics_noargs_rc=$?
set -e

if [[ "$metrics_noargs_rc" -ne 0 ]]; then
  pass "metrics no args exits non-zero"
else
  fail "metrics no args exits non-zero" "got exit code $metrics_noargs_rc"
fi

if echo "$metrics_noargs_output" | grep -qi "usage\|recording name"; then
  pass "metrics no args shows usage hint"
else
  fail "metrics no args shows usage hint" "output: $metrics_noargs_output"
fi

# ==============================================================================
# Metrics Display JSON Output
# ==============================================================================

echo ""
printf "${BOLD}Metrics Display JSON Output${RESET}\n"

set +e
metrics_json_output=$(GSD_FORMAT=json "$GSD_STACK" metrics metrics-test 2>&1)
metrics_json_rc=$?
set -e
assert_eq "metrics json exits 0" "0" "$metrics_json_rc"

if [[ "$metrics_json_output" == "{"* ]]; then
  pass "metrics json starts with {"
else
  fail "metrics json starts with {" "output starts with: ${metrics_json_output:0:20}"
fi

assert_contains "metrics json has duration_seconds" "$metrics_json_output" '"duration_seconds"'
assert_contains "metrics json has efficiency_pct" "$metrics_json_output" '"efficiency_pct"'
assert_contains "metrics json has active_seconds" "$metrics_json_output" '"active_seconds"'
assert_contains "metrics json has idle_seconds" "$metrics_json_output" '"idle_seconds"'
assert_contains "metrics json has stall_count" "$metrics_json_output" '"stall_count"'
assert_contains "metrics json has marker_count" "$metrics_json_output" '"marker_count"'
assert_contains "metrics json has estimated_tokens" "$metrics_json_output" '"estimated_tokens"'
assert_contains "metrics json has events_per_minute" "$metrics_json_output" '"events_per_minute"'

# ==============================================================================
# Metrics Compare Tests (setup)
# ==============================================================================

echo ""
printf "${BOLD}Metrics Compare Tests${RESET}\n"

# Reset and create two recordings with different characteristics
rm -rf "$TEST_DIR/stack" && export GSD_STACK_DIR="$TEST_DIR/stack"

# Create first recording (minimal)
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=rec-a >/dev/null 2>&1
"$GSD_STACK" mark "start" >/dev/null 2>&1
"$GSD_STACK" push "msg1" >/dev/null 2>&1
"$GSD_STACK" stop-record >/dev/null 2>&1

# Create second recording (more activity)
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=rec-b >/dev/null 2>&1
"$GSD_STACK" mark "start" >/dev/null 2>&1
"$GSD_STACK" mark "middle" >/dev/null 2>&1
"$GSD_STACK" mark "end" >/dev/null 2>&1
"$GSD_STACK" push "msg1" >/dev/null 2>&1
"$GSD_STACK" push "msg2" >/dev/null 2>&1
"$GSD_STACK" push "msg3" >/dev/null 2>&1
"$GSD_STACK" stop-record >/dev/null 2>&1

# ==============================================================================
# Metrics Compare Output Tests
# ==============================================================================

echo ""
printf "${BOLD}Metrics Compare Output Tests${RESET}\n"

set +e
compare_output=$("$GSD_STACK" metrics --compare rec-a rec-b 2>&1)
compare_rc=$?
set -e
assert_eq "metrics --compare exits 0" "0" "$compare_rc"

# Output contains both recording names
assert_contains "metrics --compare shows rec-a" "$compare_output" "rec-a"
assert_contains "metrics --compare shows rec-b" "$compare_output" "rec-b"

# Output contains Duration metric label
if echo "$compare_output" | grep -qi "duration"; then
  pass "metrics --compare shows duration label"
else
  fail "metrics --compare shows duration label" "output: $compare_output"
fi

# Output contains Marker metric label
if echo "$compare_output" | grep -qi "marker"; then
  pass "metrics --compare shows marker label"
else
  fail "metrics --compare shows marker label" "output: $compare_output"
fi

# Output contains delta/change indicators (+ or - or = or delta)
if echo "$compare_output" | grep -qE '\+|Delta|delta|='; then
  pass "metrics --compare shows delta indicators"
else
  fail "metrics --compare shows delta indicators" "output: $compare_output"
fi

# Output has at least 8 lines (table format with multiple metrics)
compare_line_count=$(echo "$compare_output" | wc -l)
compare_line_count=$((compare_line_count + 0))
if [[ "$compare_line_count" -ge 8 ]]; then
  pass "metrics --compare has at least 8 lines"
else
  fail "metrics --compare has at least 8 lines" "got $compare_line_count lines"
fi

# ==============================================================================
# Metrics Compare JSON Output
# ==============================================================================

echo ""
printf "${BOLD}Metrics Compare JSON Output${RESET}\n"

set +e
compare_json_output=$(GSD_FORMAT=json "$GSD_STACK" metrics --compare rec-a rec-b 2>&1)
compare_json_rc=$?
set -e
assert_eq "metrics --compare json exits 0" "0" "$compare_json_rc"

if [[ "$compare_json_output" == "{"* ]]; then
  pass "metrics --compare json starts with {"
else
  fail "metrics --compare json starts with {" "output starts with: ${compare_json_output:0:20}"
fi

if echo "$compare_json_output" | grep -qE '"rec_a"|"recording_a"|"left"'; then
  pass "metrics --compare json has first recording key"
else
  fail "metrics --compare json has first recording key" "output: $compare_json_output"
fi

if echo "$compare_json_output" | grep -qE '"rec_b"|"recording_b"|"right"'; then
  pass "metrics --compare json has second recording key"
else
  fail "metrics --compare json has second recording key" "output: $compare_json_output"
fi

if echo "$compare_json_output" | grep -qE '"delta"|"deltas"'; then
  pass "metrics --compare json has delta section"
else
  fail "metrics --compare json has delta section" "output: $compare_json_output"
fi

# ==============================================================================
# Metrics Compare Missing Recording
# ==============================================================================

echo ""
printf "${BOLD}Metrics Compare Missing Recording${RESET}\n"

set +e
compare_missing_output=$("$GSD_STACK" metrics --compare rec-a nonexistent 2>&1)
compare_missing_rc=$?
set -e

if [[ "$compare_missing_rc" -ne 0 ]]; then
  pass "metrics --compare missing recording exits non-zero"
else
  fail "metrics --compare missing recording exits non-zero" "got exit code $compare_missing_rc"
fi

if echo "$compare_missing_output" | grep -qi "not found\|does not exist"; then
  pass "metrics --compare missing recording shows error"
else
  fail "metrics --compare missing recording shows error" "output: $compare_missing_output"
fi

# ==============================================================================
# Metrics Compare Missing Second Arg
# ==============================================================================

echo ""
printf "${BOLD}Metrics Compare Missing Second Arg${RESET}\n"

set +e
compare_noarg_output=$("$GSD_STACK" metrics --compare rec-a 2>&1)
compare_noarg_rc=$?
set -e

if [[ "$compare_noarg_rc" -ne 0 ]]; then
  pass "metrics --compare missing second arg exits non-zero"
else
  fail "metrics --compare missing second arg exits non-zero" "got exit code $compare_noarg_rc"
fi

if echo "$compare_noarg_output" | grep -qi "two recordings\|usage\|second recording"; then
  pass "metrics --compare missing second arg shows usage"
else
  fail "metrics --compare missing second arg shows usage" "output: $compare_noarg_output"
fi

# ==============================================================================
# Play --run Tests (setup)
# ==============================================================================

echo ""
printf "${BOLD}Play --run Tests${RESET}\n"

# Create a recording with replayable commands
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# Start recording
GSD_MOCK_CAPTURE=1 "$GSD_STACK" record --name=run-test >/dev/null 2>&1

# Push 3 messages (these create stack_push events in stream)
"$GSD_STACK" push "echo hello" >/dev/null 2>&1
"$GSD_STACK" push "echo world" >/dev/null 2>&1
"$GSD_STACK" push "ls -la" >/dev/null 2>&1

# Add a marker (not replayable -- should be skipped)
"$GSD_STACK" mark "commands done" >/dev/null 2>&1

# Stop recording
"$GSD_STACK" stop-record >/dev/null 2>&1

# ==============================================================================
# Play --run Dry-Run Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --run Dry-Run Tests${RESET}\n"

set +e
run_dryrun_output=$("$GSD_STACK" play --run --dry-run run-test 2>&1)
run_dryrun_rc=$?
set -e

assert_exit_code "play --run --dry-run exits 0" "0" "$run_dryrun_rc"
assert_contains "play --run --dry-run shows dry-run indicator" "$run_dryrun_output" "ry run"
assert_contains "play --run --dry-run shows echo hello" "$run_dryrun_output" "echo hello"
assert_contains "play --run --dry-run shows echo world" "$run_dryrun_output" "echo world"
assert_contains "play --run --dry-run shows ls -la" "$run_dryrun_output" "ls -la"
assert_not_contains "play --run --dry-run excludes marker" "$run_dryrun_output" "commands done"
assert_contains "play --run --dry-run shows count 3" "$run_dryrun_output" "3"

# ==============================================================================
# Play --run Mock Tmux Replay
# ==============================================================================

echo ""
printf "${BOLD}Play --run Mock Tmux Replay${RESET}\n"

set +e
run_mock_output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" play --run run-test 2>&1)
run_mock_rc=$?
set -e

assert_exit_code "play --run mock tmux exits 0" "0" "$run_mock_rc"
assert_contains "play --run mock shows echo hello" "$run_mock_output" "echo hello"
assert_contains "play --run mock shows echo world" "$run_mock_output" "echo world"
assert_contains "play --run mock shows progress 1/" "$run_mock_output" "1/"
assert_contains "play --run mock shows total /3" "$run_mock_output" "/3"
assert_contains "play --run mock shows completion" "$run_mock_output" "omplete"

# ==============================================================================
# Play --run Nonexistent Recording
# ==============================================================================

echo ""
printf "${BOLD}Play --run Nonexistent Recording${RESET}\n"

set +e
run_noexist_output=$("$GSD_STACK" play --run nonexistent 2>&1)
run_noexist_rc=$?
set -e

if [[ "$run_noexist_rc" -ne 0 ]]; then
  pass "play --run nonexistent exits non-zero"
else
  fail "play --run nonexistent exits non-zero" "got exit code $run_noexist_rc"
fi
assert_contains "play --run nonexistent shows not found" "$run_noexist_output" "not found"

# ==============================================================================
# Play --run JSON Output
# ==============================================================================

echo ""
printf "${BOLD}Play --run JSON Output${RESET}\n"

set +e
run_json_output=$(GSD_FORMAT=json GSD_MOCK_TMUX=1 "$GSD_STACK" play --run run-test 2>&1)
run_json_rc=$?
set -e

assert_exit_code "play --run JSON exits 0" "0" "$run_json_rc"
assert_contains "play --run JSON starts with {" "$run_json_output" "{"
assert_contains "play --run JSON contains replayed" "$run_json_output" "replayed"
assert_contains "play --run JSON contains mode run" "$run_json_output" "\"mode\":\"run\""

# ==============================================================================
# Play --feed Tests (setup)
# ==============================================================================

echo ""
printf "${BOLD}Play --feed Tests${RESET}\n"

PLAYBOOK="$TEST_DIR/playbook.jsonl"
printf '{"type":"push","message":"playbook cmd 1","priority":"normal"}\n' > "$PLAYBOOK"
printf '{"type":"push","message":"playbook cmd 2","priority":"urgent"}\n' >> "$PLAYBOOK"
printf '{"type":"push","message":"playbook cmd 3","delay":1}\n' >> "$PLAYBOOK"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

# ==============================================================================
# Play --feed Dry-Run Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --feed Dry-Run Tests${RESET}\n"

set +e
feed_dryrun_output=$("$GSD_STACK" play --feed --dry-run "$PLAYBOOK" 2>&1)
feed_dryrun_rc=$?
set -e

assert_exit_code "play --feed --dry-run exits 0" "0" "$feed_dryrun_rc"
assert_contains "play --feed --dry-run shows dry-run indicator" "$feed_dryrun_output" "ry run"
assert_contains "play --feed --dry-run shows cmd 1" "$feed_dryrun_output" "playbook cmd 1"
assert_contains "play --feed --dry-run shows cmd 2" "$feed_dryrun_output" "playbook cmd 2"
assert_contains "play --feed --dry-run shows cmd 3" "$feed_dryrun_output" "playbook cmd 3"
assert_contains "play --feed --dry-run shows count 3" "$feed_dryrun_output" "3"
assert_contains "play --feed --dry-run shows delay" "$feed_dryrun_output" "delay"

# ==============================================================================
# Play --feed Execution Tests
# ==============================================================================

echo ""
printf "${BOLD}Play --feed Execution Tests${RESET}\n"

set +e
feed_exec_output=$("$GSD_STACK" play --feed "$PLAYBOOK" 2>&1)
feed_exec_rc=$?
set -e

assert_exit_code "play --feed execution exits 0" "0" "$feed_exec_rc"
assert_contains "play --feed shows cmd 1" "$feed_exec_output" "playbook cmd 1"
assert_contains "play --feed shows completion" "$feed_exec_output" "omplete"

# Verify messages were pushed to stack
set +e
feed_peek_output=$("$GSD_STACK" peek 2>&1)
feed_peek_rc=$?
set -e

assert_exit_code "play --feed peek after push exits 0" "0" "$feed_peek_rc"
assert_contains "play --feed peek shows playbook cmd" "$feed_peek_output" "playbook cmd"

# ==============================================================================
# Play --feed Nonexistent File
# ==============================================================================

echo ""
printf "${BOLD}Play --feed Nonexistent File${RESET}\n"

set +e
feed_noexist_output=$("$GSD_STACK" play --feed "$TEST_DIR/nonexistent.jsonl" 2>&1)
feed_noexist_rc=$?
set -e

if [[ "$feed_noexist_rc" -ne 0 ]]; then
  pass "play --feed nonexistent file exits non-zero"
else
  fail "play --feed nonexistent file exits non-zero" "got exit code $feed_noexist_rc"
fi
assert_contains "play --feed nonexistent file shows error" "$feed_noexist_output" "not found"

# ==============================================================================
# Play --feed No File Argument
# ==============================================================================

echo ""
printf "${BOLD}Play --feed No File Argument${RESET}\n"

set +e
feed_noarg_output=$("$GSD_STACK" play --feed 2>&1)
feed_noarg_rc=$?
set -e

if [[ "$feed_noarg_rc" -ne 0 ]]; then
  pass "play --feed no file arg exits non-zero"
else
  fail "play --feed no file arg exits non-zero" "got exit code $feed_noarg_rc"
fi
assert_contains "play --feed no file arg shows usage/error" "$feed_noarg_output" "equired"

# ==============================================================================
# Play --feed JSON Output
# ==============================================================================

echo ""
printf "${BOLD}Play --feed JSON Output${RESET}\n"

# Reset stack dir
rm -rf "$TEST_DIR/stack"
export GSD_STACK_DIR="$TEST_DIR/stack"

set +e
feed_json_output=$(GSD_FORMAT=json "$GSD_STACK" play --feed "$PLAYBOOK" 2>&1)
feed_json_rc=$?
set -e

assert_exit_code "play --feed JSON exits 0" "0" "$feed_json_rc"
assert_contains "play --feed JSON starts with {" "$feed_json_output" "{"
assert_contains "play --feed JSON contains executed" "$feed_json_output" "executed"
assert_contains "play --feed JSON contains mode feed" "$feed_json_output" "\"mode\":\"feed\""

# ==============================================================================
# Play --feed With Send Type
# ==============================================================================

echo ""
printf "${BOLD}Play --feed With Send Type${RESET}\n"

PLAYBOOK_SEND="$TEST_DIR/playbook-send.jsonl"
printf '{"type":"send","text":"hello world"}\n' > "$PLAYBOOK_SEND"
printf '{"type":"send","text":"/gsd:progress","delay":2}\n' >> "$PLAYBOOK_SEND"

set +e
feed_send_output=$(GSD_MOCK_TMUX=1 "$GSD_STACK" play --feed --dry-run "$PLAYBOOK_SEND" 2>&1)
feed_send_rc=$?
set -e

assert_exit_code "play --feed send type dry-run exits 0" "0" "$feed_send_rc"
assert_contains "play --feed send shows hello world" "$feed_send_output" "hello world"
assert_contains "play --feed send shows /gsd:progress" "$feed_send_output" "/gsd:progress"
assert_contains "play --feed send shows send type" "$feed_send_output" "send"

# ==============================================================================
# Summary
# ==============================================================================

summary
