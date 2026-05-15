#!/usr/bin/env bash
# tools/diagnostics/list-daemons.sh — discover daemon processes + state files
#
# Closes CONCERNS §22 — the bypass behavior (daemons running outside Claude's
# session/tool surface) is intentional. This tool surfaces what's currently
# running + what state files exist, so an operator can audit / clean up
# orphaned daemons from prior sessions.
#
# Usage:
#   bash tools/diagnostics/list-daemons.sh           # human-readable report
#   bash tools/diagnostics/list-daemons.sh --json    # JSON output
#
# Reads (does not write).
#
# Authored 2026-05-15 per CONCERNS §22 recommendation.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

JSON_MODE=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=1 ;;
    -h|--help)
      cat <<EOF
Usage: bash tools/diagnostics/list-daemons.sh [--json]

Reports daemon processes (sweep_daemon.py, sync-research-to-live, etc.)
and state files (.sweep-daemon-state.json, .local/, .bg-shell/).
EOF
      exit 0
      ;;
    *)
      echo "unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

# Use ps + grep -v self instead of pgrep to avoid matching the running script.
SELF_PID=$$
find_procs() {
  local pattern="$1"
  ps -eo pid,user,etime,cmd 2>/dev/null \
    | grep -E "$pattern" \
    | grep -v -E "grep -E|list-daemons.sh|/bin/bash.*$$|claude" \
    || true
}

SWEEP_PROCS=$(find_procs "sweep_daemon\.py")
SYNC_PROCS=$(find_procs "sync-research-to-live")
USGS_PROCS=$(find_procs "python/sync-usgs\.py")
LEARN_PROCS=$(find_procs "python/build-learn-pages\.py")

# State files
STATE_FILES=()
for f in .sweep-daemon-state.json .bg-shell .local; do
  if [ -e "$f" ]; then
    STATE_FILES+=("$f")
  fi
done

count_or_zero() {
  if [ -z "$1" ]; then echo 0; else echo "$1" | wc -l; fi
}

if [ "$JSON_MODE" = "1" ]; then
  # Minimal JSON output (no quoting of process detail to keep simple).
  cat <<EOF
{
  "scan_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "running": {
    "sweep_daemon_count": $(count_or_zero "$SWEEP_PROCS"),
    "sync_research_count": $(count_or_zero "$SYNC_PROCS"),
    "usgs_sync_count": $(count_or_zero "$USGS_PROCS"),
    "learn_pages_count": $(count_or_zero "$LEARN_PROCS")
  },
  "state_files_present": $(printf '%s\n' "${STATE_FILES[@]:-}" | grep -v '^$' | sort | uniq | wc -l)
}
EOF
  exit 0
fi

# Human-readable report
echo "=== Daemon Process Audit ==="
echo "Repo root: $REPO_ROOT"
echo "Scan time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo

echo "--- Running processes ---"
for label_pattern in \
  "sweep_daemon.py|$SWEEP_PROCS" \
  "sync-research-to-live|$SYNC_PROCS" \
  "python/sync-usgs.py|$USGS_PROCS" \
  "python/build-learn-pages.py|$LEARN_PROCS"
do
  label="${label_pattern%%|*}"
  procs="${label_pattern#*|}"
  if [ -z "$procs" ]; then
    echo "  $label: none"
  else
    echo "  $label:"
    echo "$procs" | sed 's/^/    /'
  fi
done
echo

echo "--- State files ---"
if [ "${#STATE_FILES[@]}" -eq 0 ]; then
  echo "  (none)"
else
  for f in "${STATE_FILES[@]}"; do
    if [ -d "$f" ]; then
      size=$(du -sh "$f" 2>/dev/null | awk '{print $1}' || echo "?")
      count=$(find "$f" -type f 2>/dev/null | wc -l)
      echo "  $f/  ($size, $count files)"
    else
      size=$(stat -c "%s" "$f" 2>/dev/null || echo "?")
      mtime=$(stat -c "%y" "$f" 2>/dev/null | cut -d. -f1 || echo "?")
      echo "  $f  ($size bytes, last modified $mtime)"
    fi
  done
fi
echo

# Hint about cleanup
total_procs=$(($(count_or_zero "$SWEEP_PROCS") + $(count_or_zero "$SYNC_PROCS") + $(count_or_zero "$USGS_PROCS") + $(count_or_zero "$LEARN_PROCS")))
if [ "$total_procs" -gt 0 ]; then
  echo "Hint: to inspect a process: \`ps -p <pid> -o pid,etime,cmd\`"
  echo "      to stop:              \`kill <pid>\` (or check the daemon's documented shutdown procedure)"
fi
