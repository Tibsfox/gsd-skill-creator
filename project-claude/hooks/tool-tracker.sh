#!/usr/bin/env bash
# tool-tracker.sh — Tool-call telemetry for the four event types missed by W1.
#
# Subscribes to: PostCompact, FileChanged, PermissionDenied, SubagentSpawn.
# Privacy tier: B (operational data, no PII). See project-claude/.claude/skills/
# security-hygiene/ for the canonical 4-tier privacy taxonomy.
#
# Tier B contract — this hook MUST NOT capture:
#   - File contents from FileChanged (only paths)
#   - Permission-request payload bodies (only resource type)
#   - Subagent prompts (only agent type + token count if available)
#   - Any user identifier (name, email, hostname beyond hashed session id)
#
# Closes: OGA-034.

set -euo pipefail

# --- Paths (gitignored output dir) ---
PATTERNS_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.planning/patterns"
mkdir -p "$PATTERNS_DIR" 2>/dev/null || true

DATE=$(date -u +%Y-%m-%d)
JSONL_FILE="$PATTERNS_DIR/tool-tracker-${DATE}.jsonl"

# --- Inputs (read from environment, set by Claude Code hook runtime) ---
EVENT="${CLAUDE_HOOK_EVENT:-unknown}"
SESSION_ID="${CLAUDE_SESSION_ID:-anon}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# --- Hash session id (avoid leaking raw session identifier) ---
if command -v sha256sum >/dev/null 2>&1; then
    SESSION_HASH=$(printf '%s' "$SESSION_ID" | sha256sum | cut -c1-16)
else
    SESSION_HASH="unhashed"
fi

# --- Build event-specific payload (scrubbed per tier B) ---
case "$EVENT" in
    PostCompact)
        # Capture only: pre/post token counts (no transcript content)
        PAYLOAD="{\"compact_kind\":\"${CLAUDE_COMPACT_KIND:-unknown}\"}"
        ;;
    FileChanged)
        # Capture only: path (NOT contents). Strip any absolute home paths.
        FILE_PATH="${CLAUDE_FILE_PATH:-unknown}"
        FILE_PATH_REL=$(printf '%s' "$FILE_PATH" | sed 's|^/home/[^/]*|~|; s|^/Users/[^/]*|~|')
        PAYLOAD="{\"path\":\"${FILE_PATH_REL}\"}"
        ;;
    PermissionDenied)
        # Capture only: resource type (NOT the payload body)
        PAYLOAD="{\"resource_type\":\"${CLAUDE_RESOURCE_TYPE:-unknown}\"}"
        ;;
    SubagentSpawn)
        # Capture only: agent type + token count (NOT the prompt)
        PAYLOAD="{\"agent_type\":\"${CLAUDE_SUBAGENT_TYPE:-unknown}\",\"effort\":\"${CLAUDE_SUBAGENT_EFFORT:-default}\"}"
        ;;
    *)
        PAYLOAD="{}"
        ;;
esac

# --- Write JSONL line ---
LINE="{\"timestamp\":\"${TIMESTAMP}\",\"event\":\"${EVENT}\",\"session_id\":\"${SESSION_HASH}\",\"tier\":\"B\",\"data\":${PAYLOAD}}"
printf '%s\n' "$LINE" >> "$JSONL_FILE" 2>/dev/null || true

exit 0
