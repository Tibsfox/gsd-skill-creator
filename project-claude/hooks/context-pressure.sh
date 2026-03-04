#!/usr/bin/env bash
# context-pressure.sh — PostToolUse hook
# Tracks turn/tool-call counts, estimates context pressure.
# Warnings only — ALWAYS exits 0, never blocks.
set -euo pipefail
trap 'exit 0' ERR

# State file keyed by parent process (Claude session)
STATE="/tmp/.claude-context-pressure-${PPID}"

# Initialize or read counters
if [ -f "$STATE" ]; then
  read -r TURNS TOOLS < "$STATE" 2>/dev/null || { TURNS=0; TOOLS=0; }
else
  TURNS=0
  TOOLS=0
fi

# Increment tool call count
TOOLS=$((TOOLS + 1))

# Increment turn count every 3 tool calls (rough proxy)
if (( TOOLS % 3 == 0 )); then
  TURNS=$((TURNS + 1))
fi

# Write updated state
echo "$TURNS $TOOLS" > "$STATE" 2>/dev/null || true

# Determine pressure level
if (( TURNS >= 60 || TOOLS >= 120 )); then
  LEVEL="critical"
  REC="fresh_agent_recommended"
elif (( TURNS >= 40 || TOOLS >= 80 )); then
  LEVEL="high"
  REC="fresh_agent_recommended"
elif (( TURNS >= 25 || TOOLS >= 50 )); then
  LEVEL="medium"
  REC="consider_checkpoint"
else
  LEVEL="low"
  REC="continue"
fi

# Output JSON to stderr (doesn't interfere with tool output)
echo "{\"context_pressure\":\"${LEVEL}\",\"turns\":${TURNS},\"tool_calls\":${TOOLS},\"recommendation\":\"${REC}\"}" >&2

exit 0
