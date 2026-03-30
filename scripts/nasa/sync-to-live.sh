#!/bin/bash
# Sync NASA Mission Series to tibsfox.com
# Usage: ./scripts/nasa/sync-to-live.sh [--dry-run]
#
# Pushes www/tibsfox/com/Research/NASA/ to tibsfox.com/Research/NASA/
# Uses ncftpput (not lftp — password has a leading single quote that breaks lftp)
#
# FTP root = tibsfox.com/Research/ (not /public_html/)
# So NASA content goes to /NASA/ on the FTP server
#
# Requires .env with: FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCAL_DIR="$PROJECT_ROOT/www/tibsfox/com/Research/NASA"

# Load credentials via Python (password has a leading ' that breaks bash sourcing)
read_env() {
  python3 -c "
env = {}
with open('$PROJECT_ROOT/.env') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, val = line.split('=', 1)
            env[key] = val
import sys
print(env.get(sys.argv[1], ''))
" "$1"
}

FTP_HOST=$(read_env FTP_HOST)
FTP_USER=$(read_env FTP_USER)
FTP_PASS=$(read_env FTP_PASS)

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Error: FTP credentials not set in .env"
  exit 1
fi

DRY_RUN=""
if [ "$1" = "--dry-run" ]; then
  DRY_RUN="true"
  echo "=== DRY RUN — listing files only ==="
fi

echo "=== NASA Mission Series — Sync to Live ==="
echo "Local:  $LOCAL_DIR"
echo "Remote: $FTP_HOST:/NASA/"
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
    echo "  v$version"
  fi
done
echo ""

if [ -n "$DRY_RUN" ]; then
  echo "Would upload $FILE_COUNT files. Exiting dry run."
  exit 0
fi

# Sync using ncftpput (handles the tricky password correctly)
echo "Starting sync..."
python3 -c "
import subprocess, os, sys

env = {}
with open('$PROJECT_ROOT/.env') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, val = line.split('=', 1)
            env[key] = val

host = env['FTP_HOST']
user = env['FTP_USER']
password = env['FTP_PASS']

local_base = '$LOCAL_DIR'
ok = 0
fail = 0

for root, dirs, files in os.walk(local_base):
    for fname in files:
        local_path = os.path.join(root, fname)
        rel = os.path.relpath(root, local_base)
        if rel == '.':
            remote_dir = '/NASA'
        else:
            remote_dir = f'/NASA/{rel}'

        cmd = ['ncftpput', '-u', user, '-p', password, '-m', host, remote_dir, local_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            ok += 1
            print(f'  OK: NASA/{rel}/{fname}')
        else:
            fail += 1
            print(f'  FAIL: NASA/{rel}/{fname}', file=sys.stderr)

print(f'\nUploaded: {ok}, Failed: {fail}')
if fail > 0:
    sys.exit(1)
"

echo ""
echo "=== Sync complete ==="
echo "Live at: https://tibsfox.com/Research/NASA/"
echo ""

# Verify index
echo "Verifying..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://tibsfox.com/Research/NASA/index.html" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "Index page returns 200 OK"
else
  echo "Index page returned HTTP $HTTP_CODE — check manually"
fi
