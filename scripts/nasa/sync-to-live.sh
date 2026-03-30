#!/bin/bash
# Sync NASA Mission Series to tibsfox.com
# Usage: ./scripts/nasa/sync-to-live.sh [--dry-run]
#
# Pushes www/tibsfox/com/Research/NASA/ to tibsfox.com/Research/NASA/
# Only run at version release boundaries — not mid-mission.
#
# Requires .env with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCAL_DIR="$PROJECT_ROOT/www/tibsfox/com/Research/NASA"
REMOTE_SUBDIR="Research/NASA"

# Load credentials
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  # Try the main repo .env
  ENV_FILE="/media/foxy/ai/GSD/dev-tools/gsd-skill-creator/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: No .env file found."
  echo "Create one with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH"
  exit 1
fi

source "$ENV_FILE"

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Error: FTP credentials not set in .env"
  echo "Required: FTP_HOST, FTP_USER, FTP_PASS"
  echo "Optional: FTP_PATH (default: /public_html)"
  exit 1
fi

FTP_PATH="${FTP_PATH:-/public_html}"
REMOTE_DIR="$FTP_PATH/$REMOTE_SUBDIR"
DRY_RUN=""

if [ "$1" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "=== DRY RUN — no changes will be made ==="
fi

echo "=== NASA Mission Series — Sync to Live ==="
echo "Local:  $LOCAL_DIR"
echo "Remote: $FTP_HOST:$REMOTE_DIR"
echo ""

# Count local files
FILE_COUNT=$(find "$LOCAL_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$LOCAL_DIR" | cut -f1)
echo "Files: $FILE_COUNT ($TOTAL_SIZE)"
echo ""

# List completed missions
echo "Completed missions:"
for dir in "$LOCAL_DIR"/1.*/; do
  if [ -f "$dir/index.html" ]; then
    version=$(basename "$dir")
    echo "  v$version ✓"
  fi
done
echo ""

# Sync using lftp mirror
echo "Starting sync..."
lftp -c "
  set ssl:verify-certificate no;
  set net:max-retries 3;
  set net:reconnect-interval-base 5;
  open -u $FTP_USER,$FTP_PASS $FTP_HOST;
  mirror --reverse --verbose --only-newer --no-perms $DRY_RUN \
    '$LOCAL_DIR' '$REMOTE_DIR';
  bye;
"

echo ""
echo "=== Sync complete ==="
echo "Live at: https://tibsfox.com/Research/NASA/"
echo ""

# Verify index is accessible
if [ -z "$DRY_RUN" ]; then
  echo "Verifying..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://tibsfox.com/Research/NASA/index.html" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Index page returns 200 OK"
  else
    echo "⚠ Index page returned HTTP $HTTP_CODE — check manually"
  fi
fi
