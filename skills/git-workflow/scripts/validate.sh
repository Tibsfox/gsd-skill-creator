#!/usr/bin/env bash
set -euo pipefail

# validate.sh — Pre-operation validation for sc-git managed repos.
#
# Checks:
#   1. Current directory is inside a git repository
#   2. .sc-git/config.json exists (managed repo indicator)
#   3. Config JSON is parseable
#   4. Git state is CLEAN (no staged, unstaged, or untracked files)
#   5. Origin and upstream remotes are configured
#
# Output: JSON to stdout
#   { "ready": true/false, "repo": "...", "state": "...", "errors": [...] }
#
# Exit codes:
#   0 — ready (all checks pass)
#   1 — not ready (at least one check failed)

ERRORS=()
REPO=""
STATE="unknown"

# --- Check 1: Inside a git repository ---
if ! GIT_DIR=$(git rev-parse --git-dir 2>/dev/null); then
  ERRORS+=("Not inside a git repository")
  # Cannot proceed without a repo
  printf '{"ready":false,"repo":"","state":"unknown","errors":["%s"]}\n' \
    "Not inside a git repository"
  exit 1
fi

# --- Resolve repo root ---
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
REPO=$(basename "${REPO_ROOT}" 2>/dev/null || echo "unknown")

# --- Check 2: .sc-git/config.json exists ---
CONFIG_PATH="${REPO_ROOT}/.sc-git/config.json"
if [ ! -f "${CONFIG_PATH}" ]; then
  ERRORS+=("Not an sc-git managed repository (.sc-git/config.json not found)")
fi

# --- Check 3: Config JSON is parseable ---
if [ -f "${CONFIG_PATH}" ]; then
  if ! python3 -c "import json; json.load(open('${CONFIG_PATH}'))" 2>/dev/null && \
     ! node -e "JSON.parse(require('fs').readFileSync('${CONFIG_PATH}','utf8'))" 2>/dev/null; then
    ERRORS+=("Config file is not valid JSON")
  fi
fi

# --- Check 4: Git state is CLEAN ---
PORCELAIN_OUTPUT=$(git status --porcelain=v2 2>/dev/null || echo "")
if [ -n "${PORCELAIN_OUTPUT}" ]; then
  STATE="DIRTY"
  LINE_COUNT=$(echo "${PORCELAIN_OUTPUT}" | wc -l)
  ERRORS+=("Working tree is not clean (${LINE_COUNT} change(s))")
else
  STATE="CLEAN"
fi

# Check for merge/rebase in progress
if [ -f "${GIT_DIR}/MERGE_HEAD" ]; then
  STATE="MERGING"
  ERRORS+=("Merge in progress")
elif [ -d "${GIT_DIR}/rebase-merge" ] || [ -d "${GIT_DIR}/rebase-apply" ]; then
  STATE="REBASING"
  ERRORS+=("Rebase in progress")
fi

# --- Check 5: Remotes configured ---
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")
UPSTREAM_URL=$(git remote get-url upstream 2>/dev/null || echo "")

if [ -z "${ORIGIN_URL}" ]; then
  ERRORS+=("Remote 'origin' is not configured")
fi

if [ -z "${UPSTREAM_URL}" ]; then
  ERRORS+=("Remote 'upstream' is not configured")
fi

# --- Build JSON output ---
ERROR_COUNT=${#ERRORS[@]}

if [ "${ERROR_COUNT}" -eq 0 ]; then
  printf '{"ready":true,"repo":"%s","state":"%s","errors":[]}\n' \
    "${REPO}" "${STATE}"
  exit 0
else
  # Build errors array
  ERROR_JSON="["
  for i in "${!ERRORS[@]}"; do
    if [ "$i" -gt 0 ]; then
      ERROR_JSON+=","
    fi
    # Escape double quotes in error messages
    ESCAPED="${ERRORS[$i]//\"/\\\"}"
    ERROR_JSON+="\"${ESCAPED}\""
  done
  ERROR_JSON+="]"

  printf '{"ready":false,"repo":"%s","state":"%s","errors":%s}\n' \
    "${REPO}" "${STATE}" "${ERROR_JSON}"
  exit 1
fi
