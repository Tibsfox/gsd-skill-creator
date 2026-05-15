#!/usr/bin/env bash
# tools/restore-from-live.sh — pull canonical Research/ tree from tibsfox.com
#
# Closes CONCERNS §24.4 — fresh-clone agents lack `www/` (gitignored, 228+ MB,
# ~8000 files). Tools that read `www/tibsfox/com/Research/<track>/<degree>/`
# fail opaquely until the tree is present. Standard recovery is to rebuild
# from the catalog pipelines; this script provides a faster path by
# mirroring the already-published canonical tree from tibsfox.com over HTTPS
# (read-only, no FTP auth required).
#
# Usage:
#   bash tools/restore-from-live.sh                 # full Research tree
#   bash tools/restore-from-live.sh --tree NASA     # just NASA
#   bash tools/restore-from-live.sh --dry-run       # estimate size, don't download
#
# Defaults to mirroring into <repo-root>/www/tibsfox/com/Research/ (or the
# subtree specified by --tree).
#
# Authored 2026-05-15 per CONCERNS §24.4 recommendation.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

BASE_URL="https://tibsfox.com/Research/"
LOCAL_BASE="$REPO_ROOT/www/tibsfox/com/Research/"
DRY_RUN=0
TREE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --tree)
      TREE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      cat <<EOF
Usage: bash tools/restore-from-live.sh [--tree <NASA|MUS|ELC|SPS|TRS>] [--dry-run]

Mirrors canonical Research/ tree (or specified subtree) from tibsfox.com over
HTTPS into <repo-root>/www/tibsfox/com/Research/.

  --tree <X>    pull only the named subtree (e.g. NASA, MUS, ELC)
  --dry-run     run wget --spider to estimate; don't download

Read-only — no FTP credentials needed. Uses wget --mirror with --no-host-directories
and --cut-dirs to map https://tibsfox.com/Research/* → www/tibsfox/com/Research/*.

Closes CONCERNS §24.4. See: docs/release-notes/STORY.md history for context.
EOF
      exit 0
      ;;
    *)
      echo "unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

if ! command -v wget >/dev/null 2>&1; then
  echo "fatal: wget not found in PATH" >&2
  exit 3
fi

# Compose source URL + local target
if [ -n "$TREE" ]; then
  SRC="${BASE_URL}${TREE}/"
  DST="${LOCAL_BASE}${TREE}/"
else
  SRC="$BASE_URL"
  DST="$LOCAL_BASE"
fi

echo "[restore-from-live] source: $SRC"
echo "[restore-from-live] target: $DST"
mkdir -p "$DST"

# wget --mirror semantics:
#   --recursive --level=inf
#   --timestamping (skip if local newer)
#   --no-host-directories (don't create tibsfox.com/ prefix)
#   --cut-dirs=1 (strip the /Research/ from the path layout — we re-add via target)
#   --no-parent (don't ascend above the source URL)
#   --reject 'index.html*?' (skip apache directory listings with query strings)
#
# Note: we mirror INTO a directory that mirrors the source URL path; the
# --no-host-directories + --cut-dirs=1 combination keeps the local layout
# clean.

WGET_ARGS=(
  --mirror
  --no-host-directories
  --cut-dirs=1
  --no-parent
  --reject "index.html?*,*.tmp"
  --quiet
  --show-progress
  --user-agent "skill-creator-restore/1.49.653"
  --directory-prefix "$LOCAL_BASE"
)

if [ -n "$TREE" ]; then
  WGET_ARGS+=(--include-directories="/Research/${TREE}")
fi

if [ "$DRY_RUN" = "1" ]; then
  WGET_ARGS+=(--spider)
  echo "[restore-from-live] DRY-RUN — running wget --spider to estimate"
fi

echo "[restore-from-live] invoking: wget ${WGET_ARGS[*]} $SRC"
echo ""

if wget "${WGET_ARGS[@]}" "$SRC" 2>&1 | grep -vE "^Saving|^--[0-9]"; then
  :  # success path
fi

EXIT=${PIPESTATUS[0]}

if [ "$EXIT" -ne 0 ]; then
  echo "[restore-from-live] wget exited $EXIT — partial or failed mirror" >&2
  exit "$EXIT"
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[restore-from-live] DRY-RUN complete."
else
  total_files=$(find "$DST" -type f 2>/dev/null | wc -l)
  total_size=$(du -sh "$DST" 2>/dev/null | awk '{print $1}')
  echo "[restore-from-live] done. $total_files files, $total_size total in $DST"
fi
