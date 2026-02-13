#!/bin/bash
#
# write-status.sh -- Update outbox/status/current.json with session progress.
#
# Writes or overwrites the current status file that the dashboard polls
# to display session progress. Part of the console message bridge.
#
# Usage: write-status.sh <base_path> <phase> <plan> <status> <progress_pct>
#   status: planning | executing | verifying | complete | error | idle
#   progress_pct: 0-100
#
# Exit codes:
#   0 -- Status written successfully
#   1 -- Missing required arguments
#

set -euo pipefail

BASE="${1:-}"
PHASE="${2:-}"
PLAN="${3:-}"
STATUS="${4:-}"
PROGRESS="${5:-}"

if [ -z "$BASE" ] || [ -z "$PHASE" ] || [ -z "$STATUS" ]; then
  echo "Usage: write-status.sh <base_path> <phase> <plan> <status> <progress_pct>" >&2
  exit 1
fi

OUTDIR="$BASE/.planning/console/outbox/status"
mkdir -p "$OUTDIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Use jq to build valid JSON with progress as number
jq -n \
  --arg phase "$PHASE" \
  --arg plan "$PLAN" \
  --arg status "$STATUS" \
  --argjson progress "${PROGRESS:-0}" \
  --arg ts "$TIMESTAMP" \
  '{phase: $phase, plan: $plan, status: $status, progress: $progress, updated_at: $ts}' \
  > "$OUTDIR/current.json"

exit 0
