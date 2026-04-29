#!/usr/bin/env bash
# Self-test for .claude/hooks/self-mod-guard.js
# Authored 2026-04-28 in v1.49.585 component C01.
# v1.49.586 T2.2: sterile execution — `env -i PATH=...` strips inherited
# env vars (including operator-set SC_SELF_MOD=1) so PASS/FAIL reflects
# the test's declared env, not the caller's. Closes Lesson #10173.

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../self-mod-guard.js"
[ -f "$HOOK" ] || { echo "FAIL: hook not found at $HOOK"; exit 1; }

NODE_BIN_DIR="$(dirname "$(command -v node)")"
STERILE_PATH="$NODE_BIN_DIR:/usr/bin:/bin"

# Replaces a leading bare `env` in $@ with `env -i PATH=$STERILE_PATH` so the
# child node process sees only the explicit KEY=VAL pairs the test declares.
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
expect_block() {
  local name="$1"; shift
  local stdin="$1"; shift
  local out
  out=$(_sterile_invoke "$stdin" "$@")
  if echo "$out" | grep -q '"decision":"block"'; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name"
    echo "    expected BLOCK, got: $out"
    FAIL=$((FAIL+1))
  fi
}
expect_allow() {
  local name="$1"; shift
  local stdin="$1"; shift
  local out
  out=$(_sterile_invoke "$stdin" "$@")
  if [ "$out" = '{}' ]; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name"
    echo "    expected ALLOW {}, got: $out"
    FAIL=$((FAIL+1))
  fi
}

echo "=== self-mod-guard.js self-test ==="

# SC-01: BLOCK Write to .claude/skills/
expect_block "SC-01: Write to .claude/skills/" \
  '{"tool_name":"Write","tool_input":{"file_path":".claude/skills/security-hygiene/SKILL.md"}}' \
  env

# SC-02: BLOCK Edit to .claude/agents/
expect_block "SC-02: Edit to .claude/agents/" \
  '{"tool_name":"Edit","tool_input":{"file_path":".claude/agents/lab-director.md","old_string":"x","new_string":"y"}}' \
  env

# SC-03: BLOCK Bash redirect to .claude/hooks/
expect_block "SC-03: Bash redirect to .claude/hooks/" \
  '{"tool_name":"Bash","tool_input":{"command":"echo test > .claude/hooks/foo.js"}}' \
  env

# SC-04: ALLOW with SC_SELF_MOD=1
expect_allow "SC-04: SC_SELF_MOD=1 override" \
  '{"tool_name":"Write","tool_input":{"file_path":".claude/skills/security-hygiene/SKILL.md"}}' \
  env SC_SELF_MOD=1

# SC-05: ALLOW with SC_INSTALL_CALLER=project-claude
expect_allow "SC-05: SC_INSTALL_CALLER=project-claude override" \
  '{"tool_name":"Write","tool_input":{"file_path":".claude/skills/security-hygiene/SKILL.md"}}' \
  env SC_INSTALL_CALLER=project-claude

# Regression: ALLOW non-protected path
expect_allow "regression: non-protected path" \
  '{"tool_name":"Write","tool_input":{"file_path":"src/foo.ts"}}' \
  env

# v1.49.586 T2.1: proximity-aware Bash detection — heredoc/quote-body filter
#
# SC-06: Bash where protected path is INSIDE a heredoc body, write-operator
# present elsewhere — should ALLOW (false-positive cured).
expect_allow "SC-06: protected path inside heredoc body, with rm elsewhere" \
  '{"tool_name":"Bash","tool_input":{"command":"rm /tmp/x; cat <<EOF\nthis touches .claude/skills/foo.md in prose\nEOF\n"}}' \
  env

# SC-07: Bash where protected path is INSIDE a double-quoted echo string,
# no write-operator on a real protected target — should ALLOW.
expect_allow "SC-07: protected path inside double-quoted echo string" \
  '{"tool_name":"Bash","tool_input":{"command":"echo \"edited .claude/skills/foo.md yesterday\""}}' \
  env

# SC-08: Legitimate self-mod via cp — should still BLOCK (regression-protected).
expect_block "SC-08: cp to .claude/skills/" \
  '{"tool_name":"Bash","tool_input":{"command":"cp old.md .claude/skills/new.md"}}' \
  env

# SC-09: Legitimate self-mod via mv — should still BLOCK (regression-protected).
expect_block "SC-09: mv to .claude/agents/" \
  '{"tool_name":"Bash","tool_input":{"command":"mv tmp.md .claude/agents/lab.md"}}' \
  env

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL
