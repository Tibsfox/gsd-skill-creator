#!/usr/bin/env bash
# validate-commit.sh — PreToolUse hook: enforce Conventional Commits format
# Blocks git commit commands with non-conforming messages (exit 2).
# Allows conforming messages and all non-commit commands (exit 0).
# Compatible with macOS Bash 3.2 (no grep -P, no local -n).

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only check git commit commands
if [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  # Extract message from -m flag using sed (portable, no grep -P)
  # Try double-quoted -m first
  MSG=$(echo "$CMD" | sed -n 's/.*-m "\([^"]*\)".*/\1/p' 2>/dev/null)
  # Try single-quoted -m
  if [ -z "$MSG" ]; then
    MSG=$(echo "$CMD" | sed -n "s/.*-m '\\([^']*\\)'.*/\\1/p" 2>/dev/null)
  fi
  # Try heredoc pattern (common in GSD: -m "$(cat <<'EOF'\n...)")
  if [ -z "$MSG" ]; then
    MSG=$(echo "$CMD" | sed -n "s/.*-m \"\$(cat <<'EOF'/p" 2>/dev/null)
    if [ -n "$MSG" ]; then
      # For heredoc, extract the first line after the marker
      MSG=$(echo "$CMD" | sed -n "s/.*<<'EOF'//p" | head -1 | sed 's/^[[:space:]]*//')
    fi
  fi

  if [ -n "$MSG" ]; then
    # Get first line of message (the subject line)
    SUBJECT=$(echo "$MSG" | head -1)
    if ! echo "$SUBJECT" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?: .{1,72}$'; then
      echo '{"decision": "block", "reason": "Commit message must follow Conventional Commits: <type>(<scope>): <subject>. Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore. Subject must be <=72 chars, lowercase, imperative mood, no trailing period."}'
      exit 2
    fi
  fi
fi

exit 0
