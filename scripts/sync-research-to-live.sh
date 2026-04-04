#!/bin/bash
# Sync ALL Research to tibsfox.com
# Usage: ./scripts/sync-research-to-live.sh [--dry-run] [--nasa-only]
#
# Pushes www/tibsfox/com/Research/ to tibsfox.com/Research/
# Includes: all 168+ PNW research projects, S36, SPS, NASA missions, series index
#
# Requires .env with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_BASE="$PROJECT_ROOT/www/tibsfox/com"
REMOTE_SUBDIR=""

# Load credentials — use python to parse .env because passwords contain shell-hostile chars
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/path/to/projectGSD/dev-tools/gsd-skill-creator/.env"
fi
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/path/to/projectGSD/dev-tools/gsd-skill-creator-nasa/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: No .env file found."
  echo "Create one with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH"
  exit 1
fi

# Parse .env with python to handle special chars in passwords
eval "$(python3 -c "
with open('$ENV_FILE') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, val = line.split('=', 1)
            if key.startswith('FTP_'):
                # Escape single quotes for bash export
                val_escaped = val.replace(\"'\", \"'\\\"'\\\"'\")
                print(f\"export {key}='{val_escaped}'\")
")"

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Error: FTP credentials not set in .env"
  exit 1
fi

FTP_PATH="${FTP_PATH:-/}"
DRY_RUN=""
NASA_ONLY=""
LOCAL_DIR="$LOCAL_BASE/Research"
REMOTE_DIR="$FTP_PATH/Research"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --nasa-only)
      NASA_ONLY="yes"
      LOCAL_DIR="$LOCAL_BASE/Research/NASA"
      REMOTE_DIR="$FTP_PATH/Research/NASA"
      ;;
  esac
done

if [ -n "$DRY_RUN" ]; then
  echo "=== DRY RUN — no changes will be made ==="
fi

echo "=== tibsfox.com Research Sync ==="
echo "Local:  $LOCAL_DIR"
echo "Remote: $FTP_HOST:$REMOTE_DIR"
echo ""

# Stats
FILE_COUNT=$(find "$LOCAL_DIR" -type f | wc -l)
DIR_COUNT=$(find "$LOCAL_DIR" -type d | wc -l)
TOTAL_SIZE=$(du -sh "$LOCAL_DIR" | cut -f1)
echo "Files: $FILE_COUNT in $DIR_COUNT directories ($TOTAL_SIZE)"

if [ -z "$NASA_ONLY" ]; then
  # Count research projects
  PROJECT_COUNT=$(ls -d "$LOCAL_DIR"/*/index.html 2>/dev/null | wc -l)
  echo "Research projects with index: $PROJECT_COUNT"

  # Count NASA missions
  NASA_COUNT=$(ls -d "$LOCAL_DIR"/NASA/1.*/index.html 2>/dev/null | wc -l)
  echo "NASA missions complete: $NASA_COUNT"
fi
echo ""

# Exclude patterns (don't sync these)
EXCLUDES="--exclude-glob .git/ --exclude-glob .planning/ --exclude-glob node_modules/ --exclude-glob .env"

# Sync — use python to write lftp script file (avoids shell escaping of password)
LFTP_SCRIPT=$(mktemp /tmp/lftp-sync-XXXXXX.sh)
python3 -c "
import os
host = os.environ['FTP_HOST']
user = os.environ['FTP_USER']
with open('$ENV_FILE') as f:
    for line in f:
        if line.startswith('FTP_PASS='):
            pwd = line.strip().split('=', 1)[1]
            break
# Escape for lftp (backslash special chars)
pwd_esc = pwd.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
script = f'''set ssl:verify-certificate no
set net:max-retries 3
set net:reconnect-interval-base 5
set mirror:use-pget-n 4
open -u {user},\"{pwd_esc}\" {host}
mirror --reverse --verbose --only-newer --no-perms $DRY_RUN $EXCLUDES '$LOCAL_DIR' '$REMOTE_DIR'
bye
'''
with open('$LFTP_SCRIPT', 'w') as f:
    f.write(script)
"
echo "Starting sync..."
lftp -f "$LFTP_SCRIPT"
rm -f "$LFTP_SCRIPT"

echo ""
echo "=== Sync complete ==="
echo "Live at: https://tibsfox.com/Research/"
if [ -n "$NASA_ONLY" ]; then
  echo "NASA at: https://tibsfox.com/Research/NASA/"
fi
echo ""

# Verify
if [ -z "$DRY_RUN" ]; then
  echo "Verifying..."
  for url in "https://tibsfox.com/Research/" "https://tibsfox.com/Research/NASA/index.html"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "  ✓ $url (200)"
    else
      echo "  ⚠ $url ($HTTP_CODE)"
    fi
  done
fi
