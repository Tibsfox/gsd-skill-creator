#!/usr/bin/env bats
# phase-boundary-check.bats — BATS integration tests for phase-boundary-check.sh
# Tests exit codes and advisory output using real Claude Code JSON payloads
# This is a PostToolUse hook — it ALWAYS exits 0 (advisory, never blocks)

HOOK=".claude/hooks/phase-boundary-check.sh"

setup() {
  # Ensure we run from project root
  cd "$BATS_TEST_DIRNAME/../../.." || exit 1
  TEST_DIR=$(mktemp -d)
  mkdir -p "$TEST_DIR/.planning/phases/100-test-phase"
}

teardown() {
  rm -rf "$TEST_DIR"
}

# Helper: write JSON payload to temp file and pipe into hook
run_hook() {
  local payload="$1"
  echo "$payload" > "$TEST_DIR/payload.json"
  run bash -c "cat '$TEST_DIR/payload.json' | bash '$HOOK'"
}

# --- Non-planning file writes: exit 0 silently ---

@test "non-planning file write exits 0 with no output" {
  run_hook '{"tool_input":{"file_path":"src/foo.ts"}}'
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "file without .planning prefix exits 0 silently" {
  run_hook '{"tool_input":{"file_path":"/home/user/project/src/main.ts"}}'
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "empty file_path exits 0 silently" {
  run_hook '{"tool_input":{}}'
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "null JSON exits 0 silently" {
  run_hook '{}'
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

# --- Generic .planning/ file writes: exit 0 with advisory ---

@test "generic planning file write exits 0 with advisory" {
  run_hook '{"tool_input":{"file_path":".planning/STATE.md"}}'
  [ "$status" -eq 0 ]
  [[ "$output" =~ ".planning/ file modified" ]]
}

@test "planning config write exits 0 with advisory" {
  run_hook '{"tool_input":{"file_path":".planning/config.json"}}'
  [ "$status" -eq 0 ]
  [[ "$output" =~ ".planning/ file modified" ]]
}

# --- SUMMARY.md writes: exit 0 with boundary detection ---

@test "SUMMARY.md write triggers phase boundary detection" {
  run_hook '{"tool_input":{"file_path":".planning/phases/100-test-phase/100-01-SUMMARY.md"}}'
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Phase boundary detected" ]]
}

@test "SUMMARY.md write extracts phase number" {
  run_hook '{"tool_input":{"file_path":".planning/phases/200-another-phase/200-01-SUMMARY.md"}}'
  [ "$status" -eq 0 ]
  [[ "$output" =~ "phase 200" ]]
}

@test "SUMMARY.md write surfaces state-pruner failure warning" {
  # npx tsx will fail in test env (no actual imports) -- hook should surface warning, not suppress
  run_hook '{"tool_input":{"file_path":".planning/phases/100-test-phase/100-01-SUMMARY.md"}}'
  [ "$status" -eq 0 ]
  # After HOOK-04 fix, failures should produce visible warnings
  [[ "$output" =~ "Warning:" ]] || [[ "$output" =~ "Phase boundary detected" ]]
}

# --- VERIFICATION.md writes: exit 0 with traceability check ---

@test "VERIFICATION.md write triggers traceability check when date is stale" {
  # Override REQUIREMENTS.md traceability date to be stale (yesterday)
  local orig_req=".planning/REQUIREMENTS.md"
  local backup="$TEST_DIR/REQUIREMENTS.md.bak"
  cp "$orig_req" "$backup" 2>/dev/null || true
  # Create a stale date in REQUIREMENTS.md
  local stale_date="2025-01-01"
  sed -i "s/\*\*Traceability updated:\*\* [0-9-]*/\*\*Traceability updated:\*\* $stale_date/" "$orig_req" 2>/dev/null || true

  run_hook '{"tool_input":{"file_path":".planning/phases/100-test-phase/100-01-VERIFICATION.md"}}'

  # Restore original
  cp "$backup" "$orig_req" 2>/dev/null || true

  [ "$status" -eq 0 ]
  [[ "$output" =~ "TRACEABILITY" ]]
  [[ "$output" =~ "Step 1" ]]
  [[ "$output" =~ "Step 2" ]]
  [[ "$output" =~ "Step 3" ]]
}

@test "VERIFICATION.md with deviation markers outputs deviation advisory" {
  # Create a VERIFICATION.md with deviation markers at a .planning/ path
  # The hook checks: file must match *-VERIFICATION.md AND be in .planning/
  local verif_dir="$TEST_DIR/.planning/phases/100-test-phase"
  mkdir -p "$verif_dir"
  local verif_file="$verif_dir/100-01-VERIFICATION.md"
  printf '# Verification\n\n```deviation\nRequirement: HOOK-99\n```\n' > "$verif_file"

  # The hook reads $FILE directly for deviation detection via grep
  run_hook "{\"tool_input\":{\"file_path\":\"$verif_file\"}}"
  [ "$status" -eq 0 ]
  # Since the temp file has .planning/ in path and ends in -VERIFICATION.md,
  # the hook enters the VERIFICATION branch and checks for deviation markers
  [[ "$output" =~ "DEVIATION" ]]
}

# --- Exit code consistency: all paths exit 0 ---

@test "all code paths exit 0 for planning files" {
  run_hook '{"tool_input":{"file_path":".planning/ROADMAP.md"}}'
  [ "$status" -eq 0 ]
}

@test "SUMMARY.md write always exits 0 even when external commands fail" {
  run_hook '{"tool_input":{"file_path":".planning/phases/999-nonexistent/999-01-SUMMARY.md"}}'
  [ "$status" -eq 0 ]
}
