#!/usr/bin/env bash
#
# load-kb-context.sh — extract redacted KB context for the AI investigator skill.
#
# Usage: bash load-kb-context.sh <projectId> [<projectPath>]
#
# Emits structured JSON to stdout with:
#   - findings: top 30 by severity*confidence
#   - meetings: last 3 committed/wrapped meetings
#   - bundles:  in-flight bundles + decisions
#   - dismissed_findings: last 20 dismissed
#
# Critical invariants (D-25-30, D-25-31, S14):
#   - NEVER emits raw source-file content (only finding rationales).
#   - Applies secret-redaction patterns before emitting any rationale text.
#
# The redaction sweep runs as a final pass over the assembled JSON before stdout.
#
# Phase 825 / C12.

set -euo pipefail

PROJECT_ID="${1:?project id required}"
PROJECT_PATH="${2:-}"

if [ -z "$PROJECT_PATH" ]; then
  # Default to current working directory (sessions run from repo root).
  PROJECT_PATH="$(pwd)"
fi

DB_PATH="$PROJECT_PATH/.gsd/intelligence/intelligence.db"

if [ ! -f "$DB_PATH" ]; then
  # Empty KB: emit a minimal but well-formed context blob.
  printf '%s\n' '{
  "project_id": "'"$PROJECT_ID"'",
  "findings": [],
  "meetings": [],
  "bundles": [],
  "dismissed_findings": [],
  "warnings": ["KB not found at '"$DB_PATH"'"]
}'
  exit 0
fi

# ─── Helpers ──────────────────────────────────────────────────────────────────

# JSON-escape stdin (handles backslash, double-quote, newline, tab).
json_escape() {
  python3 -c '
import sys, json
sys.stdout.write(json.dumps(sys.stdin.read())[1:-1])
' 2>/dev/null || sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g' -e 's/\t/\\t/g'
}

# Apply secret redaction. Patterns:
#   - any 32+ alphanumeric run preceded/followed by key|token|secret|password|api
#   - sk-... API keys (Anthropic-style)
#   - ghp_..., gho_..., ghu_... GitHub tokens
#   - generic AWS access keys (AKIA...)
#   - "Bearer <token>" patterns
redact_secrets() {
  python3 -c '
import sys, re
text = sys.stdin.read()
patterns = [
    (re.compile(r"sk-[a-zA-Z0-9_-]{20,}", re.IGNORECASE), "[REDACTED-API-KEY]"),
    (re.compile(r"sk-ant-api[0-9]{2,}-[a-zA-Z0-9_-]{30,}", re.IGNORECASE), "[REDACTED-ANTHROPIC-KEY]"),
    (re.compile(r"gh[poursu]_[a-zA-Z0-9]{30,}"), "[REDACTED-GITHUB-TOKEN]"),
    (re.compile(r"AKIA[A-Z0-9]{16}"), "[REDACTED-AWS-KEY]"),
    (re.compile(r"Bearer [a-zA-Z0-9._-]+", re.IGNORECASE), "Bearer [REDACTED]"),
    # Any 32+ alphanumeric run with key/token/secret/password/api context within 30 chars
    (
        re.compile(
            r"((?:key|token|secret|password|api)[\s_-]*[:=]?[\s_-]*)([a-zA-Z0-9_+/=-]{16,})",
            re.IGNORECASE,
        ),
        lambda m: m.group(1) + "[REDACTED]",
    ),
    # SSH private key headers
    (re.compile(r"-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----"), "[REDACTED-SSH-KEY]"),
]
for rx, repl in patterns:
    text = rx.sub(repl, text)
sys.stdout.write(text)
' 2>/dev/null || cat
}

# ─── Findings: top 30 by severity*confidence ─────────────────────────────────

FINDINGS_JSON=$(sqlite3 -separator '	' "$DB_PATH" "
SELECT
  id, kind, severity, confidence, title, rationale, COALESCE(source_path, '')
FROM findings
WHERE project_id = '$PROJECT_ID' AND status = 'open'
ORDER BY
  CASE severity WHEN 'high' THEN 3 WHEN 'med' THEN 2 ELSE 1 END * confidence DESC
LIMIT 30;
" 2>/dev/null | python3 -c '
import sys, json
out = []
for line in sys.stdin:
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 7:
        continue
    out.append({
        "id": parts[0],
        "kind": parts[1],
        "severity": parts[2],
        "confidence": float(parts[3]) if parts[3] else 0.0,
        "title": parts[4],
        "rationale": parts[5],
        "source_path": parts[6] or None,
    })
sys.stdout.write(json.dumps(out, indent=2))
' 2>/dev/null || echo "[]")

# ─── Meetings: last 3 committed/wrapped ───────────────────────────────────────

MEETINGS_JSON=$(sqlite3 -separator '	' "$DB_PATH" "
SELECT id, started_at, COALESCE(committed_at, ''), status, kb_snapshot
FROM meetings
WHERE project_id = '$PROJECT_ID' AND status IN ('committed', 'wrapped')
ORDER BY committed_at DESC
LIMIT 3;
" 2>/dev/null | python3 -c '
import sys, json
out = []
for line in sys.stdin:
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 5: continue
    out.append({
        "id": parts[0],
        "started_at": parts[1],
        "committed_at": parts[2] or None,
        "status": parts[3],
        "kb_snapshot": parts[4],
    })
sys.stdout.write(json.dumps(out, indent=2))
' 2>/dev/null || echo "[]")

# ─── Bundles: in-flight ──────────────────────────────────────────────────────

BUNDLES_JSON=$(sqlite3 -separator '	' "$DB_PATH" "
SELECT b.id, b.emitted_at, d.id, d.kind, d.state, COALESCE(d.ai_draft_title, '')
FROM bundles b
JOIN bundle_decisions bd ON bd.bundle_id = b.id
JOIN decisions d ON d.id = bd.decision_id
JOIN meetings m ON m.id = b.meeting_id
WHERE m.project_id = '$PROJECT_ID'
ORDER BY b.emitted_at DESC, d.state;
" 2>/dev/null | python3 -c '
import sys, json, collections
agg = collections.defaultdict(lambda: {"id": None, "emitted_at": None, "decisions": []})
for line in sys.stdin:
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 6: continue
    bid = parts[0]
    if agg[bid]["id"] is None:
        agg[bid]["id"] = bid
        agg[bid]["emitted_at"] = parts[1]
    agg[bid]["decisions"].append({
        "id": parts[2], "kind": parts[3], "state": parts[4], "title": parts[5]
    })
sys.stdout.write(json.dumps(list(agg.values()), indent=2))
' 2>/dev/null || echo "[]")

# ─── Dismissed findings (last 20) ────────────────────────────────────────────

DISMISSED_JSON=$(sqlite3 -separator '	' "$DB_PATH" "
SELECT id, kind, title, COALESCE(dismissed_rationale, '')
FROM findings
WHERE project_id = '$PROJECT_ID' AND status = 'dismissed'
ORDER BY produced_at DESC
LIMIT 20;
" 2>/dev/null | python3 -c '
import sys, json
out = []
for line in sys.stdin:
    parts = line.rstrip("\n").split("\t")
    if len(parts) < 4: continue
    out.append({
        "id": parts[0], "kind": parts[1], "title": parts[2], "dismissed_rationale": parts[3] or None
    })
sys.stdout.write(json.dumps(out, indent=2))
' 2>/dev/null || echo "[]")

# ─── Assemble ────────────────────────────────────────────────────────────────

# Build the final document. Use python json.loads() to safely parse the
# pre-serialized JSON fragments (avoids embedding raw JSON literals into
# Python source where `null`, `true`, `false` would be name errors).
ASSEMBLED=$(
  PROJECT_ID="$PROJECT_ID" \
  FINDINGS_JSON="$FINDINGS_JSON" \
  MEETINGS_JSON="$MEETINGS_JSON" \
  BUNDLES_JSON="$BUNDLES_JSON" \
  DISMISSED_JSON="$DISMISSED_JSON" \
  python3 -c '
import json
import os
doc = {
    "project_id": os.environ["PROJECT_ID"],
    "findings": json.loads(os.environ.get("FINDINGS_JSON", "[]") or "[]"),
    "meetings": json.loads(os.environ.get("MEETINGS_JSON", "[]") or "[]"),
    "bundles": json.loads(os.environ.get("BUNDLES_JSON", "[]") or "[]"),
    "dismissed_findings": json.loads(os.environ.get("DISMISSED_JSON", "[]") or "[]"),
    "warnings": [],
}
print(json.dumps(doc, indent=2))
'
)

# Apply secret redaction sweep before emitting. (D-25-31 / S14.)
echo "$ASSEMBLED" | redact_secrets
