#!/usr/bin/env bash
set -euo pipefail

# sc-git: safe-merge
# Purpose: Merge source branch into target with --no-ff, abort on conflict
# Input: <repo-path> <source-branch> <target-branch>
# Output: JSON to stdout
# Exit: 0 on success, 1 on expected failure (conflict/dirty state), 2 on unexpected error

REPO_PATH="${1:?Usage: $0 <repo-path> <source-branch> <target-branch>}"
SOURCE="${2:?Missing source branch}"
TARGET="${3:?Missing target branch}"
cd "$REPO_PATH"

# Verify git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "not a git repository"}' >&2
  exit 2
fi

# Check for clean state
PORCELAIN=$(git status --porcelain=v2 2>/dev/null || true)
if [ -n "$PORCELAIN" ]; then
  # Collect dirty files
  DIRTY_FILES=()
  while IFS= read -r line; do
    if [ -z "$line" ]; then continue; fi
    prefix="${line:0:1}"
    if [ "$prefix" = "1" ] || [ "$prefix" = "2" ]; then
      filepath=$(echo "$line" | awk '{print $NF}')
      DIRTY_FILES+=("$filepath")
    elif [ "$prefix" = "?" ]; then
      filepath="${line:2}"
      DIRTY_FILES+=("$filepath")
    fi
  done <<< "$PORCELAIN"

  # Build files JSON array
  FILES_JSON="["
  for i in "${!DIRTY_FILES[@]}"; do
    if [ "$i" -gt 0 ]; then
      FILES_JSON+=","
    fi
    FILES_JSON+="\"${DIRTY_FILES[$i]}\""
  done
  FILES_JSON+="]"

  echo "{\"success\":false,\"reason\":\"dirty\",\"files\":${FILES_JSON}}"
  exit 1
fi

# Checkout target branch
git checkout "$TARGET" > /dev/null 2>&1

# Attempt merge with --no-ff
MERGE_EXIT=0
git merge --no-ff "$SOURCE" > /dev/null 2>&1 || MERGE_EXIT=$?

if [ "$MERGE_EXIT" -eq 0 ]; then
  # Merge succeeded
  MERGE_SHA=$(git rev-parse HEAD)
  FILES_CHANGED=$(git diff --numstat HEAD~1 HEAD 2>/dev/null | wc -l)
  echo "{\"success\":true,\"mergeCommit\":\"${MERGE_SHA}\",\"filesChanged\":${FILES_CHANGED}}"
  exit 0
else
  # Merge failed — collect conflict files
  CONFLICT_FILES=()
  CONFLICT_PORCELAIN=$(git status --porcelain=v2 2>/dev/null || true)
  while IFS= read -r line; do
    if [ -z "$line" ]; then continue; fi
    if [ "${line:0:1}" = "u" ]; then
      filepath=$(echo "$line" | awk '{print $NF}')
      CONFLICT_FILES+=("$filepath")
    fi
  done <<< "$CONFLICT_PORCELAIN"

  # Abort the merge to restore clean state
  git merge --abort 2>/dev/null || true

  # Build conflict files JSON array
  CFILES_JSON="["
  for i in "${!CONFLICT_FILES[@]}"; do
    if [ "$i" -gt 0 ]; then
      CFILES_JSON+=","
    fi
    CFILES_JSON+="\"${CONFLICT_FILES[$i]}\""
  done
  CFILES_JSON+="]"

  echo "{\"success\":false,\"reason\":\"conflict\",\"files\":${CFILES_JSON}}"
  exit 1
fi
