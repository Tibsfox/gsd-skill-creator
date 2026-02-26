#!/bin/bash
# phase-boundary-check.sh — PostToolUse hook: detect .planning/ file writes
# Outputs a reminder when planning files are modified.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ "$FILE" == *.planning/* ]] || [[ "$FILE" == .planning/* ]]; then
  echo ".planning/ file modified: $FILE"
  echo "Check: Does this phase transition trigger any skill-creator hooks?"
  echo "Check: Should STATE.md be updated?"
fi

exit 0
