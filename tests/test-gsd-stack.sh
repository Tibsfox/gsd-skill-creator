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
# Summary
# ==============================================================================

summary
