#!/bin/bash
#
# check-inbox.sh -- Session-side inbox polling for the console message bridge.
#
# Scans .planning/console/inbox/pending/ for JSON messages, outputs a JSON
# summary, and moves processed messages to inbox/acknowledged/.
#
# Usage: check-inbox.sh [base_path]
#   base_path: Project root directory (default: current working directory)
#
# Exit codes:
#   0 -- Pending messages found and processed
#   1 -- No pending messages (or inbox doesn't exist)
#
# Output (stdout, only on exit 0):
#   { "count": N, "messages": [{ "id": "...", "type": "...", "filename": "..." }, ...] }
#

set -euo pipefail

BASE="${1:-.}"
INBOX="$BASE/.planning/console/inbox/pending"
ACK="$BASE/.planning/console/inbox/acknowledged"

# Exit 1 if inbox doesn't exist
if [ ! -d "$INBOX" ]; then
  exit 1
fi

# Collect JSON files
shopt -s nullglob
json_files=("$INBOX"/*.json)
shopt -u nullglob

if [ ${#json_files[@]} -eq 0 ]; then
  exit 1
fi

# Ensure acknowledged directory exists
mkdir -p "$ACK"

# Build JSON output
count=0
messages="["

for f in "${json_files[@]}"; do
  filename=$(basename "$f")

  # Try to extract id and type from JSON
  if id=$(jq -r '.id // empty' "$f" 2>/dev/null) && \
     type=$(jq -r '.type // empty' "$f" 2>/dev/null) && \
     [ -n "$id" ] && [ -n "$type" ]; then
    # Valid and parseable JSON with id and type
    if [ $count -gt 0 ]; then
      messages+=","
    fi
    messages+="{\"id\":\"${id}\",\"type\":\"${type}\",\"filename\":\"${filename}\"}"
    count=$((count + 1))
  fi

  # Move to acknowledged (even if malformed, to prevent infinite retry)
  mv "$f" "$ACK/"
done

messages+="]"

if [ $count -eq 0 ]; then
  exit 1
fi

echo "{\"count\":${count},\"messages\":${messages}}"
exit 0
