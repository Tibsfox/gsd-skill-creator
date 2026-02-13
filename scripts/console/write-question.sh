#!/bin/bash
#
# write-question.sh -- Emit a structured question to outbox/questions/.
#
# Writes a JSON question file that the dashboard can poll and display
# to the user. Part of the console message bridge (session -> dashboard).
#
# Usage: write-question.sh <base_path> <question_id> <question_text> <type> [options_json]
#   type: binary | choice | multi-select | text | confirmation
#   options_json: optional JSON array string for choice/multi-select
#
# Exit codes:
#   0 -- Question written successfully
#   1 -- Missing required arguments
#

set -euo pipefail

BASE="${1:-}"
QID="${2:-}"
TEXT="${3:-}"
TYPE="${4:-}"
OPTIONS="${5:-null}"

if [ -z "$BASE" ] || [ -z "$QID" ] || [ -z "$TEXT" ] || [ -z "$TYPE" ]; then
  echo "Usage: write-question.sh <base_path> <question_id> <question_text> <type> [options_json]" >&2
  exit 1
fi

OUTDIR="$BASE/.planning/console/outbox/questions"
mkdir -p "$OUTDIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FILENAME="${TIMESTAMP//[:.]/-}-${QID}.json"

# Use jq to build valid JSON (handles escaping)
if [ "$OPTIONS" = "null" ]; then
  jq -n \
    --arg qid "$QID" \
    --arg text "$TEXT" \
    --arg type "$TYPE" \
    --arg ts "$TIMESTAMP" \
    '{question_id: $qid, text: $text, type: $type, timestamp: $ts, status: "pending"}' \
    > "$OUTDIR/$FILENAME"
else
  jq -n \
    --arg qid "$QID" \
    --arg text "$TEXT" \
    --arg type "$TYPE" \
    --arg ts "$TIMESTAMP" \
    --argjson opts "$OPTIONS" \
    '{question_id: $qid, text: $text, type: $type, timestamp: $ts, status: "pending", options: $opts}' \
    > "$OUTDIR/$FILENAME"
fi

exit 0
