#!/usr/bin/env bash
set -euo pipefail

# sc-git: git-state-check
# Purpose: Detect git repository state and output JSON report
# Input: <repo-path>
# Output: JSON to stdout matching GitStateReport schema
# Exit: 0 always (state is data, not error), 2 on unexpected error

REPO_PATH="${1:?Usage: $0 <repo-path>}"
cd "$REPO_PATH"

# Verify this is a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "not a git repository"}' >&2
  exit 2
fi

# --- Detect branch ---
BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")

# --- Get porcelain status ---
PORCELAIN=$(git status --porcelain=v2 2>/dev/null || true)

# --- Detect state (priority: CONFLICT > MERGING > REBASING > DETACHED > DIRTY > CLEAN) ---
STATE="CLEAN"

# Check for dirty (any porcelain output other than untracked)
TRACKED_CHANGES=$(echo "$PORCELAIN" | grep -c "^[12u] " || true)
if [ "$TRACKED_CHANGES" -gt 0 ]; then
  STATE="DIRTY"
fi

# Check detached HEAD
if [ "$BRANCH_RAW" = "HEAD" ]; then
  STATE="DETACHED"
fi

# Detect git dir (handles worktrees)
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)

# Check rebasing
if [ -d "${GIT_DIR}/rebase-merge" ] || [ -d "${GIT_DIR}/rebase-apply" ]; then
  STATE="REBASING"
fi

# Check merging
if [ -f "${GIT_DIR}/MERGE_HEAD" ]; then
  STATE="MERGING"
fi

# Check conflict (highest priority)
CONFLICT_COUNT=$(echo "$PORCELAIN" | grep -c "^u " || true)
if [ "$CONFLICT_COUNT" -gt 0 ]; then
  STATE="CONFLICT"
fi

# --- Parse staged files ---
STAGED_FILES=()
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  # Porcelain v2 format: "1 XY ..." or "2 XY ..."
  # X is staged status, Y is unstaged status. '.' means no change.
  prefix="${line:0:1}"
  if [ "$prefix" = "1" ] || [ "$prefix" = "2" ]; then
    staged_char="${line:2:1}"
    if [ "$staged_char" != "." ]; then
      # Extract file path (last field for type 1, or after tab for renamed type 2)
      if [ "$prefix" = "2" ]; then
        # Renamed: path is after the tab
        filepath=$(echo "$line" | awk -F'\t' '{print $2}')
      else
        filepath=$(echo "$line" | awk '{print $NF}')
      fi
      STAGED_FILES+=("$filepath")
    fi
  fi
done <<< "$PORCELAIN"

# --- Parse unstaged files ---
UNSTAGED_FILES=()
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  prefix="${line:0:1}"
  if [ "$prefix" = "1" ] || [ "$prefix" = "2" ]; then
    unstaged_char="${line:3:1}"
    if [ "$unstaged_char" != "." ]; then
      if [ "$prefix" = "2" ]; then
        filepath=$(echo "$line" | awk -F'\t' '{print $2}')
      else
        filepath=$(echo "$line" | awk '{print $NF}')
      fi
      UNSTAGED_FILES+=("$filepath")
    fi
  fi
done <<< "$PORCELAIN"

# --- Parse untracked files ---
UNTRACKED_FILES=()
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  if [ "${line:0:1}" = "?" ]; then
    filepath="${line:2}"
    UNTRACKED_FILES+=("$filepath")
  fi
done <<< "$PORCELAIN"

# --- Get ahead/behind ---
AHEAD=0
BEHIND=0
if AB_LINE=$(git rev-list --left-right --count "HEAD...@{upstream}" 2>/dev/null); then
  AHEAD=$(echo "$AB_LINE" | awk '{print $1}')
  BEHIND=$(echo "$AB_LINE" | awk '{print $2}')
fi

# --- Get remotes ---
REMOTES_JSON="[]"
REMOTE_NAMES=$(git remote 2>/dev/null || true)
if [ -n "$REMOTE_NAMES" ]; then
  REMOTE_ENTRIES=()
  while IFS= read -r remote_name; do
    if [ -z "$remote_name" ]; then continue; fi
    remote_url=$(git remote get-url "$remote_name" 2>/dev/null || echo "")
    remote_fetch=$(git config "remote.${remote_name}.fetch" 2>/dev/null || echo "")
    REMOTE_ENTRIES+=("{\"name\":\"${remote_name}\",\"url\":\"${remote_url}\",\"fetch\":\"${remote_fetch}\"}")
  done <<< "$REMOTE_NAMES"

  if [ ${#REMOTE_ENTRIES[@]} -gt 0 ]; then
    REMOTES_JSON="["
    for i in "${!REMOTE_ENTRIES[@]}"; do
      if [ "$i" -gt 0 ]; then
        REMOTES_JSON+=","
      fi
      REMOTES_JSON+="${REMOTE_ENTRIES[$i]}"
    done
    REMOTES_JSON+="]"
  fi
fi

# --- Build branch JSON ---
if [ "$BRANCH_RAW" = "HEAD" ]; then
  BRANCH_JSON="null"
else
  BRANCH_JSON="\"${BRANCH_RAW}\""
fi

# --- Build array JSON helper ---
build_json_array() {
  local -n arr=$1
  if [ ${#arr[@]} -eq 0 ]; then
    echo "[]"
    return
  fi
  local result="["
  for i in "${!arr[@]}"; do
    if [ "$i" -gt 0 ]; then
      result+=","
    fi
    result+="\"${arr[$i]}\""
  done
  result+="]"
  echo "$result"
}

STAGED_JSON=$(build_json_array STAGED_FILES)
UNSTAGED_JSON=$(build_json_array UNSTAGED_FILES)
UNTRACKED_JSON=$(build_json_array UNTRACKED_FILES)

# --- Output JSON ---
cat <<ENDJSON
{"state":"${STATE}","branch":${BRANCH_JSON},"remotes":${REMOTES_JSON},"ahead":${AHEAD},"behind":${BEHIND},"staged":${STAGED_JSON},"unstaged":${UNSTAGED_JSON},"untracked":${UNTRACKED_JSON}}
ENDJSON
