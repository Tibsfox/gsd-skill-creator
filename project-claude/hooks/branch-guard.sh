#!/usr/bin/env bash
# branch-guard.sh — PreToolUse hook: warn on unexpected branch operations
# WARNINGS only (exit 0) — never blocks. Branch switches may be intentional.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only check git commands
[[ -z "$CMD" ]] && exit 0
[[ ! "$CMD" =~ ^git[[:space:]] ]] && exit 0

# Warn on push to main/master
if [[ "$CMD" =~ git[[:space:]]+push ]] && [[ "$CMD" =~ (main|master) ]]; then
  CURRENT=$(git branch --show-current 2>/dev/null || echo "unknown")
  echo "{\"decision\": \"warn\", \"message\": \"Pushing to main/master from branch '${CURRENT}'. Verify this is intentional.\"}"
  exit 0
fi

# Warn on branch mismatch with STATE.md
if [[ "$CMD" =~ git[[:space:]]+(push|commit) ]]; then
  CURRENT=$(git branch --show-current 2>/dev/null || echo "unknown")
  if [ -f ".planning/STATE.md" ]; then
    EXPECTED=$(head -20 .planning/STATE.md | grep -oP 'milestone:\s*\K\S+' 2>/dev/null || true)
    if [ -n "$EXPECTED" ] && [[ ! "$CURRENT" =~ "$EXPECTED" ]] && [[ "$EXPECTED" != "$CURRENT" ]]; then
      echo "{\"decision\": \"warn\", \"message\": \"Current branch '${CURRENT}' may not match STATE.md milestone '${EXPECTED}'. Verify you're on the right branch.\"}"
    fi
  fi
  exit 0
fi

# Warn on branch switch
if [[ "$CMD" =~ git[[:space:]]+(checkout|switch)[[:space:]] ]]; then
  CURRENT=$(git branch --show-current 2>/dev/null || echo "unknown")
  echo "{\"decision\": \"warn\", \"message\": \"Switching branches from '${CURRENT}'. Verify this is intentional.\"}"
  exit 0
fi

exit 0
