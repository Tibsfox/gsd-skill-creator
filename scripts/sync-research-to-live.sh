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

# Load credentials — password contains leading ' and shell-hostile chars
# NEVER source .env — always use python to parse
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/path/to/projectGSD/dev-tools/gsd-skill-creator/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: No .env file found."
  echo "Create one with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH"
  exit 1
fi

# Python-based .env parser (handles leading ' and special chars)
eval "$(python3 -c "
import sys
for line in open('$ENV_FILE'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        # Shell-safe export using base64 to avoid any quoting issues
        import base64
        b64 = base64.b64encode(v.encode()).decode()
        print(f'export {k}=\"\$(echo {b64} | base64 -d)\"')
")"

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Error: FTP credentials not set in .env"
  exit 1
fi

FTP_PATH="${FTP_PATH:-/public_html}"
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

# Sync — use python to write lftp script file (password has leading ' and special chars)
echo "Starting sync..."
LFTP_SCRIPT=$(mktemp /tmp/lftp-sync-XXXXXX)
trap "rm -f '$LFTP_SCRIPT'" EXIT

python3 -c "
import sys
env = {}
for line in open('$ENV_FILE'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k] = v

with open('$LFTP_SCRIPT', 'w') as f:
    f.write('set ssl:verify-certificate no\n')
    f.write('set net:max-retries 3\n')
    f.write('set net:reconnect-interval-base 5\n')
    f.write('set mirror:use-pget-n 4\n')
    f.write('open -u ' + env['FTP_USER'] + ',' + env['FTP_PASS'] + ' ' + env['FTP_HOST'] + '\n')
    f.write('mirror --reverse --verbose --only-newer --no-perms $DRY_RUN $EXCLUDES \"$LOCAL_DIR\" \"$REMOTE_DIR\"\n')
    f.write('bye\n')
"

# Substitute shell vars in the lftp script
sed -i "s|\$DRY_RUN|$DRY_RUN|g; s|\$EXCLUDES|$EXCLUDES|g; s|\$LOCAL_DIR|$LOCAL_DIR|g; s|\$REMOTE_DIR|$REMOTE_DIR|g" "$LFTP_SCRIPT"

lftp -f "$LFTP_SCRIPT"

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
