#!/bin/bash
# Deploy only changed NASA files to tibsfox.com
# Uses git diff to find files changed since last deploy tag
# Usage: ./scripts/nasa/deploy-changed.sh [--all] [--dry-run]
#
# Tracks deployments via git tags: nasa-deployed-YYYYMMDD-HHMMSS
# Only uploads files changed since the last deploy tag.
# Use --all to force full re-deploy.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCAL_DIR="$PROJECT_ROOT/www/tibsfox/com/Research/NASA"
DEPLOY_PREFIX="nasa-deployed"

# Parse args
ALL_MODE=""
DRY_RUN=""
for arg in "$@"; do
  case "$arg" in
    --all) ALL_MODE=true ;;
    --dry-run) DRY_RUN=true ;;
  esac
done

# Load FTP credentials via Python (password has leading quote)
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

# Find last deploy tag
LAST_TAG=$(git tag -l "${DEPLOY_PREFIX}-*" --sort=-creatordate | head -1)

if [ -z "$LAST_TAG" ] || [ -n "$ALL_MODE" ]; then
  echo "=== Full deploy (no previous tag or --all) ==="
  CHANGED_FILES=$(find "$LOCAL_DIR" -type f ! -path "*__pycache__*" ! -name "*.pyc")
else
  echo "=== Incremental deploy since $LAST_TAG ==="
  # Get files changed since last deploy
  CHANGED_FILES=$(git diff --name-only "$LAST_TAG" HEAD -- www/tibsfox/com/Research/NASA/ | \
    while read f; do
      full="$PROJECT_ROOT/$f"
      if [ -f "$full" ]; then echo "$full"; fi
    done)

  # Also include any untracked new files
  UNTRACKED=$(git ls-files --others --exclude-standard -- www/tibsfox/com/Research/NASA/ | \
    while read f; do
      full="$PROJECT_ROOT/$f"
      if [ -f "$full" ]; then echo "$full"; fi
    done)

  if [ -n "$UNTRACKED" ]; then
    CHANGED_FILES="$CHANGED_FILES"$'\n'"$UNTRACKED"
  fi
fi

# Filter empty lines
CHANGED_FILES=$(echo "$CHANGED_FILES" | grep -v '^$' | sort -u)

if [ -z "$CHANGED_FILES" ]; then
  echo "No files to deploy."
  exit 0
fi

COUNT=$(echo "$CHANGED_FILES" | wc -l)
echo "Files to deploy: $COUNT"
echo ""

if [ -n "$DRY_RUN" ]; then
  echo "$CHANGED_FILES" | while read f; do
    rel=$(echo "$f" | sed "s|$LOCAL_DIR/||")
    echo "  DRY: NASA/$rel"
  done
  echo ""
  echo "Dry run complete. $COUNT files would be deployed."
  exit 0
fi

# Deploy via Python (handles password correctly)
python3 -c "
import subprocess, os, sys, time

host = '$FTP_HOST'

env = {}
with open('$PROJECT_ROOT/.env') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, val = line.split('=', 1)
            env[key] = val
user = env['FTP_USER']
password = env['FTP_PASS']
local_base = '$LOCAL_DIR'

# Retry hardening — mirror of sync-research-to-live.sh lftp settings
# (net:max-retries 10, reconnect-interval-multiplier 1.5, net:timeout 30)
MAX_RETRIES = 10
TIMEOUT = 60  # keep original 60s — incremental deploys may include larger files

def upload_with_retry(cmd):
    delay = 2.0
    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT)
            if r.returncode == 0:
                return r, attempt + 1, None
            last_err = (r.stderr or r.stdout or '').strip()[:120]
        except subprocess.TimeoutExpired:
            last_err = f'timeout after {TIMEOUT}s'
        except Exception as e:
            last_err = str(e)[:120]
        if attempt < MAX_RETRIES - 1:
            time.sleep(delay)
            delay = min(delay * 1.5, 30)
    return None, MAX_RETRIES, last_err

ok = fail = 0
files = '''$CHANGED_FILES'''.strip().split('\n')
for local_path in files:
    local_path = local_path.strip()
    if not local_path or not os.path.isfile(local_path):
        continue
    rel = os.path.relpath(local_path, local_base)
    remote_dir = '/NASA/' + os.path.dirname(rel)
    if remote_dir == '/NASA/.':
        remote_dir = '/NASA'

    cmd = ['ncftpput', '-u', user, '-p', password, '-m', host, remote_dir, local_path]
    res = upload_with_retry(cmd)
    if res[0] is not None:
        ok += 1
        tag = f' (after {res[1]} tries)' if res[1] > 1 else ''
        print(f'  OK: NASA/{rel}{tag}')
    else:
        fail += 1
        print(f'  FAIL: NASA/{rel} ({MAX_RETRIES} tries): {res[2]}', file=sys.stderr)

print(f'\nDeployed: {ok} OK, {fail} failed')
if fail > 0:
    sys.exit(1)
"

# Tag the deployment
TAG="${DEPLOY_PREFIX}-$(date +%Y%m%d-%H%M%S)"
git tag "$TAG"
echo ""
echo "=== Deploy complete ==="
echo "Tagged: $TAG"
echo "Next deploy will only push files changed after this point."
