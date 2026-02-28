#!/usr/bin/env bash
set -euo pipefail

# sc-git: pr-bundle
# Purpose: Generate diff summary and commit log for PR description
# Input: <repo-path> <base-branch>
# Output: JSON to stdout
# Exit: 0 on success, 2 on unexpected error

REPO_PATH="${1:?Usage: $0 <repo-path> <base-branch>}"
BASE="${2:?Missing base branch}"
cd "$REPO_PATH"

# Verify git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "not a git repository"}' >&2
  exit 2
fi

# --- Get commits ---
COMMITS_JSON="["
FIRST_COMMIT=true
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi
  commit_sha=$(echo "$line" | awk '{print $1}')
  commit_msg=$(echo "$line" | cut -d' ' -f2-)
  # Escape double quotes in message
  commit_msg="${commit_msg//\"/\\\"}"
  if [ "$FIRST_COMMIT" = true ]; then
    FIRST_COMMIT=false
  else
    COMMITS_JSON+=","
  fi
  COMMITS_JSON+="{\"sha\":\"${commit_sha}\",\"message\":\"${commit_msg}\"}"
done < <(git log --oneline "${BASE}..HEAD" 2>/dev/null || true)
COMMITS_JSON+="]"

# --- Get stats ---
TOTAL_INSERTIONS=0
TOTAL_DELETIONS=0
TOTAL_FILES=0
while IFS=$'\t' read -r ins del filepath; do
  if [ -z "$filepath" ]; then continue; fi
  TOTAL_FILES=$((TOTAL_FILES + 1))
  if [ "$ins" != "-" ]; then
    TOTAL_INSERTIONS=$((TOTAL_INSERTIONS + ins))
  fi
  if [ "$del" != "-" ]; then
    TOTAL_DELETIONS=$((TOTAL_DELETIONS + del))
  fi
done < <(git diff --numstat "${BASE}...HEAD" 2>/dev/null || true)

# --- Get file list with status ---
FILES_JSON="["
FIRST_FILE=true
while IFS=$'\t' read -r raw_status filepath rest; do
  if [ -z "$filepath" ]; then continue; fi

  # Map git status letter to human-readable word
  case "${raw_status:0:1}" in
    A) status="added" ;;
    M) status="modified" ;;
    D) status="deleted" ;;
    R) status="renamed"; filepath="${rest:-$filepath}" ;;
    *) status="modified" ;;
  esac

  if [ "$FIRST_FILE" = true ]; then
    FIRST_FILE=false
  else
    FILES_JSON+=","
  fi
  FILES_JSON+="{\"path\":\"${filepath}\",\"status\":\"${status}\"}"
done < <(git diff --name-status "${BASE}...HEAD" 2>/dev/null || true)
FILES_JSON+="]"

# --- Output JSON ---
echo "{\"commits\":${COMMITS_JSON},\"stats\":{\"filesChanged\":${TOTAL_FILES},\"insertions\":${TOTAL_INSERTIONS},\"deletions\":${TOTAL_DELETIONS}},\"files\":${FILES_JSON}}"
