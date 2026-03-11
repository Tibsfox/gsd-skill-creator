#!/bin/bash
# build-check.sh — PreToolUse hook: verify TypeScript build before git push/commit
# Blocks git push commands when tsc --noEmit fails (exit 2).
# Blocks git commit commands when TS files are staged and tsc --noEmit fails (exit 2).
# Allows all non-push/commit commands and non-TS commits (exit 0).

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# TypeScript build check: git push (always) and git commit (only when TS files staged)
RUN_TSC=false
if [[ "$CMD" =~ ^git[[:space:]]+push ]]; then
  RUN_TSC=true
elif [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  STAGED_TS=$(git diff --cached --name-only --diff-filter=ACMR -- '*.ts' '*.tsx' 2>/dev/null | head -1)
  if [ -n "$STAGED_TS" ]; then
    RUN_TSC=true
  fi
fi

if [ "$RUN_TSC" = true ]; then
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
  TSC_EXIT=$?

  if [ $TSC_EXIT -ne 0 ]; then
    ERRORS=$(echo "$TSC_OUTPUT" | grep "error TS" | head -10)
    ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS")
    ACTION=$(echo "$CMD" | awk '{print $2}')
    printf '{"decision": "block", "reason": "TypeScript build check failed (%s errors). Fix before %s.\n%s"}\n' "$ERROR_COUNT" "$ACTION" "$ERRORS"
    exit 2
  fi
fi

# Research index completeness warning (non-blocking)
if [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  STAGED_PNW=$(git diff --cached --name-only -- 'www/tibsfox/com/Research/' 2>/dev/null | head -1)
  if [ -n "$STAGED_PNW" ] && [ -f "www/tibsfox/com/Research/index-check.sh" ]; then
    CHECK_OUTPUT=$(bash www/tibsfox/com/Research/index-check.sh 2>&1)
    CHECK_EXIT=$?
    if [ $CHECK_EXIT -ne 0 ]; then
      echo "WARNING: PNW index may be incomplete:"
      echo "$CHECK_OUTPUT"
      # Warning only — does not block
    fi
  fi
fi

exit 0
