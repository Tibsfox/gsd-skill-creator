#!/usr/bin/env bash
# tool-tracker.sh — telemetry for hook events not covered by PostToolUse (W1).
#
# Reads the hook payload as JSON on STDIN (Claude Code's hook contract) and
# appends a tier-B-scrubbed JSONL line keyed by hook_event_name.
#
# FIXED 2026-07-08: this previously read $CLAUDE_HOOK_EVENT / $CLAUDE_* env vars
# that the runtime never sets, so every record was event:"unknown" / data:{}.
# The real payload arrives as JSON on stdin with `hook_event_name`.
#
# Tier B (operational data, no PII) — this hook MUST NOT capture:
#   - File contents, permission-request bodies, or subagent prompts
#   - Any raw identifier (the session id is hashed before it is written)

set -euo pipefail

PATTERNS_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.planning/patterns"
mkdir -p "$PATTERNS_DIR" 2>/dev/null || true
JSONL_FILE="$PATTERNS_DIR/tool-tracker-$(date -u +%Y-%m-%d).jsonl"

# Parse + tier-B-scrub the stdin payload with node (always in this toolchain).
# Emits one JSONL line to stdout, or nothing on empty/invalid input.
LINE=$(node -e '
  const crypto = require("crypto");
  let raw = "";
  try { raw = require("fs").readFileSync(0, "utf8"); } catch { process.exit(0); }
  if (!raw.trim()) process.exit(0);
  let p;
  try { p = JSON.parse(raw); } catch { process.exit(0); }
  const event = p.hook_event_name || "unknown";
  const hash = crypto
    .createHash("sha256")
    .update(String(p.session_id || "anon"))
    .digest("hex")
    .slice(0, 16);
  let data = {};
  switch (event) {
    case "PreCompact":
    case "PostCompact":
      data = { trigger: p.trigger || p.compact_kind || "unknown" };
      break;
    case "SubagentStop":
      data = { agent_type: p.agent_type || p.subagent_type || "unknown" };
      break;
    case "UserPromptSubmit":
      data = { prompt_chars: typeof p.prompt === "string" ? p.prompt.length : 0 };
      break;
    default:
      data = {};
  }
  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    session_id: hash,
    tier: "B",
    data,
  }));
' 2>/dev/null || true)

if [ -n "$LINE" ]; then
  printf '%s\n' "$LINE" >> "$JSONL_FILE" 2>/dev/null || true
fi
exit 0
