#!/bin/bash
#
# validate-config.sh -- Validate milestone-config.json against required fields.
#
# Reads the milestone configuration file and checks that all required
# fields are present and the JSON is well-formed. Part of the console
# message bridge.
#
# Usage: validate-config.sh [base_path]
#   base_path: Project root directory (default: current working directory)
#
# Exit codes:
#   0 -- Config is valid
#   1 -- Config is missing, malformed, or fails validation
#

set -euo pipefail

BASE="${1:-.}"
CONFIG="$BASE/.planning/console/config/milestone-config.json"

if [ ! -f "$CONFIG" ]; then
  echo "error: milestone-config.json not found at $CONFIG" >&2
  exit 1
fi

# Validate JSON is parseable
if ! jq empty "$CONFIG" 2>/dev/null; then
  echo "error: milestone-config.json is not valid JSON" >&2
  exit 1
fi

# Check required fields
NAME=$(jq -r '.milestone.name // empty' "$CONFIG" 2>/dev/null)
if [ -z "$NAME" ]; then
  echo "error: milestone.name is required" >&2
  exit 1
fi

SUBMITTED_AT=$(jq -r '.milestone.submitted_at // empty' "$CONFIG" 2>/dev/null)
if [ -z "$SUBMITTED_AT" ]; then
  echo "error: milestone.submitted_at is required" >&2
  exit 1
fi

echo "valid"
exit 0
