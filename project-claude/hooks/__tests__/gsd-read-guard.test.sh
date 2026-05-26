#!/usr/bin/env bash
# Self-test for project-claude/hooks/gsd-read-guard.js
# Authored 2026-05-26 in v1.49.779 Wave 3 (test-quality HIGH).
#
# This hook is advisory-only — it injects read-first guidance via
# additionalContext when Write/Edit targets an existing file AND the
# session is not Claude Code (Claude Code natively enforces read-first).
# It never blocks. Tests verify:
#   - emits hookSpecificOutput when targeting an existing non-Claude-Code file
#   - is silent for non-Write/Edit tools
#   - is silent for non-existent target paths
#   - is silent when session_id is present (Claude Code signal)
#   - is silent on malformed input (the hook is advisory-only)

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../gsd-read-guard.js"
[ -f "$HOOK" ] || { echo "FAIL: hook not found at $HOOK"; exit 1; }

NODE_BIN_DIR="$(dirname "$(command -v node)")"
STERILE_PATH="$NODE_BIN_DIR:/usr/bin:/bin"

_sterile_invoke() {
  local stdin="$1"; shift
  local -a cmd=()
  local first=1
  for arg in "$@"; do
    if [ $first -eq 1 ] && [ "$arg" = "env" ]; then
      cmd+=("env" "-i" "PATH=$STERILE_PATH")
      first=0
    else
      cmd+=("$arg")
      first=0
    fi
  done
  echo "$stdin" | "${cmd[@]}" node "$HOOK"
}

PASS=0; FAIL=0
expect_advisory() {
  local name="$1"; shift
  local stdin="$1"; shift
  local out
  out=$(_sterile_invoke "$stdin" "$@")
  if echo "$out" | grep -q '"hookEventName":"PreToolUse"'; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name"
    echo "    expected advisory, got: $out"
    FAIL=$((FAIL+1))
  fi
}
expect_silent() {
  local name="$1"; shift
  local stdin="$1"; shift
  local out
  out=$(_sterile_invoke "$stdin" "$@")
  if [ -z "$out" ]; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name"
    echo "    expected silent (empty stdout), got: $out"
    FAIL=$((FAIL+1))
  fi
}

# Set up a real existing file for the advisory case to fire against.
TMP_FILE="$(mktemp -t gsd-read-guard-test-XXXXXX)"
trap "rm -f $TMP_FILE" EXIT

echo "=== gsd-read-guard.js self-test ==="

# RG-01: ADVISORY for Write to existing file from non-Claude-Code session
expect_advisory "RG-01: Write to existing file (non-Claude-Code) emits advisory" \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$TMP_FILE\",\"content\":\"x\"}}" \
  env

# RG-02: ADVISORY for Edit to existing file from non-Claude-Code session
expect_advisory "RG-02: Edit to existing file (non-Claude-Code) emits advisory" \
  "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$TMP_FILE\",\"old_string\":\"a\",\"new_string\":\"b\"}}" \
  env

# RG-03: SILENT for non-existent target (new file)
expect_silent "RG-03: Write to non-existent file is silent" \
  '{"tool_name":"Write","tool_input":{"file_path":"/tmp/does-not-exist-rg.test","content":"x"}}' \
  env

# RG-04: SILENT for non-Write/Edit tools
expect_silent "RG-04: Bash tool is silent" \
  '{"tool_name":"Bash","tool_input":{"command":"echo hi"}}' \
  env

# RG-05: SILENT when session_id is present (Claude Code signal in payload)
expect_silent "RG-05: session_id payload signals Claude Code (silent)" \
  "{\"session_id\":\"abc-123\",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$TMP_FILE\",\"content\":\"x\"}}" \
  env

# RG-06: SILENT when CLAUDE_CODE_ENTRYPOINT env var is set
expect_silent "RG-06: CLAUDE_CODE_ENTRYPOINT signals Claude Code (silent)" \
  "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$TMP_FILE\",\"content\":\"x\"}}" \
  env CLAUDE_CODE_ENTRYPOINT=cli

# RG-07: SILENT on malformed JSON (advisory-only hook never blocks)
expect_silent "RG-07: malformed JSON is silent" \
  'this is not json {' \
  env

# RG-08: SILENT when file_path is missing
expect_silent "RG-08: missing file_path is silent" \
  '{"tool_name":"Write","tool_input":{"content":"x"}}' \
  env

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL
