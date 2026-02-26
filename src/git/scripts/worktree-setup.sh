#!/usr/bin/env bash
set -euo pipefail

# sc-git: worktree-setup
# Purpose: Create git worktree with branch tracking
# Input: <repo-path> <branch-name> <worktree-path>
# Output: JSON to stdout
# Exit: 0 on success, 1 on failure, 2 on unexpected error

REPO_PATH="${1:?Usage: $0 <repo-path> <branch-name> <worktree-path>}"
BRANCH="${2:?Missing branch name}"
WORKTREE_PATH="${3:?Missing worktree path}"
cd "$REPO_PATH"

# Verify git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "not a git repository"}' >&2
  exit 2
fi

# Create worktree with new branch from current HEAD
if ! git worktree add "$WORKTREE_PATH" -b "$BRANCH" > /dev/null 2>&1; then
  echo "{\"success\":false,\"reason\":\"worktree creation failed\",\"path\":\"${WORKTREE_PATH}\",\"branch\":\"${BRANCH}\"}"
  exit 1
fi

# Configure push remote tracking (may fail if no origin remote -- OK)
git config "branch.${BRANCH}.pushRemote" origin 2>/dev/null || true

# Verify worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
  echo "{\"success\":false,\"reason\":\"worktree directory not created\",\"path\":\"${WORKTREE_PATH}\",\"branch\":\"${BRANCH}\"}"
  exit 1
fi

# Output success
echo "{\"success\":true,\"path\":\"${WORKTREE_PATH}\",\"branch\":\"${BRANCH}\"}"
