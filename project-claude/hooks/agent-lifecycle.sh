#!/usr/bin/env bash
# agent-lifecycle.sh — PostToolUse hook
# Tracks agent spawn/shutdown events to JSONL log.
# Pure observation — ALWAYS exits 0, never blocks.
set -euo pipefail
trap 'exit 0' ERR

# Read hook input from stdin
INPUT=$(cat 2>/dev/null || echo '{}')

# Extract tool name
TOOL_NAME=$(printf '%s' "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")

# Only process Agent and SendMessage tool calls
case "$TOOL_NAME" in
  Agent|SendMessage) ;;
  *) exit 0 ;;
esac

# Session-scoped log file
LOG="/tmp/.claude-agent-lifecycle-${PPID}.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Extract relevant fields from tool input
TOOL_INPUT=$(printf '%s' "$INPUT" | grep -o '"tool_input":{[^}]*}' 2>/dev/null || echo "")

if [ "$TOOL_NAME" = "Agent" ]; then
  # Agent spawn event
  AGENT_NAME=$(printf '%s' "$TOOL_INPUT" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "unknown")
  AGENT_TYPE=$(printf '%s' "$TOOL_INPUT" | grep -o '"subagent_type":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "unknown")
  AGENT_MODEL=$(printf '%s' "$TOOL_INPUT" | grep -o '"model":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "inherit")
  echo "{\"event\":\"spawn\",\"agent\":\"${AGENT_NAME}\",\"type\":\"${AGENT_TYPE}\",\"model\":\"${AGENT_MODEL}\",\"time\":\"${TIMESTAMP}\"}" >> "$LOG" 2>/dev/null || true

elif [ "$TOOL_NAME" = "SendMessage" ]; then
  # Check for shutdown request
  MSG_TYPE=$(printf '%s' "$TOOL_INPUT" | grep -o '"type":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")
  if [ "$MSG_TYPE" = "shutdown_request" ]; then
    RECIPIENT=$(printf '%s' "$TOOL_INPUT" | grep -o '"recipient":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "unknown")
    echo "{\"event\":\"shutdown\",\"agent\":\"${RECIPIENT}\",\"time\":\"${TIMESTAMP}\"}" >> "$LOG" 2>/dev/null || true
  fi
fi

exit 0
