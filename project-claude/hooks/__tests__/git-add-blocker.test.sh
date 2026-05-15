#!/usr/bin/env bash
# Self-test for .claude/hooks/git-add-blocker.js
# Authored 2026-04-28 in v1.49.585 component C02.
# v1.49.586 T2.2: sterile execution — `env -i PATH=...` strips inherited
# env vars (including operator-set SC_FORCE_ADD=1) so PASS/FAIL reflects
# the test's declared env, not the caller's. Closes Lesson #10173.

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/../git-add-blocker.js"
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

echo "=== git-add-blocker.js self-test ==="

# SC-06: BLOCK git add .planning/
expect_block "SC-06: git add .planning/STATE.md" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .planning/STATE.md"}}' \
  env

# SC-07: BLOCK git add -f .claude/
expect_block "SC-07: git add -f .claude/agents/foo.md" \
  '{"tool_name":"Bash","tool_input":{"command":"git add -f .claude/agents/foo.md"}}' \
  env

# SC-08: BLOCK git commit -a
expect_block "SC-08: git commit -a" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit -a -m \"test\""}}' \
  env

# SC-09: ALLOW with SC_FORCE_ADD=1
expect_allow "SC-09: SC_FORCE_ADD=1 override" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .planning/foo"}}' \
  env SC_FORCE_ADD=1

# SC-10: ALLOW non-protected paths
expect_allow "SC-10: git add src/foo.ts" \
  '{"tool_name":"Bash","tool_input":{"command":"git add src/foo.ts"}}' \
  env
expect_allow "SC-10b: git add docs/foo.md" \
  '{"tool_name":"Bash","tool_input":{"command":"git add docs/foo.md"}}' \
  env

# Regression: ALLOW non-Bash tool
expect_allow "regression: non-Bash Write" \
  '{"tool_name":"Write","tool_input":{"file_path":"src/foo.ts"}}' \
  env

# Regression: ALLOW git status / git log / git diff
expect_allow "regression: git status" \
  '{"tool_name":"Bash","tool_input":{"command":"git status"}}' \
  env

# Regression: ALLOW git commit (without -a)
expect_allow "regression: git commit -m" \
  '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"test\""}}' \
  env

# EC-02: handle quoted paths with spaces (should still detect protected)
expect_block "EC-02: git add 'path/with .planning/spaces'" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .planning/has\\ space.md"}}' \
  env

# v1.49.653 hardening (CONCERNS §2.3 + §7.4):
# CC-01: BLOCK git add .gsd/  (556MB intelligence.db accidental-stage exposure)
expect_block "CC-01: git add .gsd/intelligence.db" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .gsd/intelligence.db"}}' \
  env

# CC-02: BLOCK git add -f .env (production FTP credential leak exposure)
expect_block "CC-02: git add -f .env" \
  '{"tool_name":"Bash","tool_input":{"command":"git add -f .env"}}' \
  env

# CC-03: BLOCK git add .chipset/
expect_block "CC-03: git add .chipset/state" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .chipset/state"}}' \
  env

# CC-04: BLOCK git add project-claude/hooks/.log/
expect_block "CC-04: git add project-claude/hooks/.log/" \
  '{"tool_name":"Bash","tool_input":{"command":"git add project-claude/hooks/.log/foo.jsonl"}}' \
  env

# CC-05: BLOCK nested .env (e.g. apps/foo/.env)
expect_block "CC-05: git add apps/foo/.env" \
  '{"tool_name":"Bash","tool_input":{"command":"git add apps/foo/.env"}}' \
  env

# CC-06: ALLOW non-protected env-like paths (e.g. .envrc, env/, environments.json)
expect_allow "CC-06a: git add .envrc" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .envrc"}}' \
  env
expect_allow "CC-06b: git add environments.json" \
  '{"tool_name":"Bash","tool_input":{"command":"git add environments.json"}}' \
  env
expect_allow "CC-06c: git add env/foo.ts" \
  '{"tool_name":"Bash","tool_input":{"command":"git add env/foo.ts"}}' \
  env

# CC-07: ALLOW project-claude/ outside hooks/.log/
expect_allow "CC-07: git add project-claude/hooks/git-add-blocker.js" \
  '{"tool_name":"Bash","tool_input":{"command":"git add project-claude/hooks/git-add-blocker.js"}}' \
  env

# CC-08: SC_FORCE_ADD=1 override still works for new paths
expect_allow "CC-08: SC_FORCE_ADD=1 .gsd/" \
  '{"tool_name":"Bash","tool_input":{"command":"git add .gsd/foo"}}' \
  env SC_FORCE_ADD=1

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL
