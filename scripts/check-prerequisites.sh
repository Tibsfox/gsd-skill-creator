#!/bin/bash
# =============================================================================
# Check Prerequisites — Platform-aware prerequisite detection
# =============================================================================
#
# Sourced by bootstrap.sh (not executed directly).
# Uses show_ok() and show_fail() functions defined by bootstrap.sh.
# Uses $MAGIC_LEVEL set by bootstrap.sh.
#
# Checks 4 required commands (node, npm, tmux, git) and 1 optional (claude).
# Exits 1 if any required command is missing.
#
# Phase 378-01 — Bootstrap
# =============================================================================

check_command() {
    local cmd="$1" name="$2" install_hint="$3"
    if command -v "$cmd" > /dev/null 2>&1; then
        local version
        version=$("$cmd" --version 2>&1 | head -1)
        show_ok "$name: $version"
        return 0
    else
        show_fail "$name not found"
        echo "    Install: $install_hint"
        return 1
    fi
}

MISSING=0

check_command "node" "Node.js" "https://nodejs.org/ (v18+ required)" || MISSING=$((MISSING + 1))
check_command "npm" "npm" "Comes with Node.js" || MISSING=$((MISSING + 1))
check_command "tmux" "tmux" "apt install tmux (Ubuntu) / brew install tmux (macOS)" || MISSING=$((MISSING + 1))
check_command "git" "git" "apt install git (Ubuntu) / xcode-select --install (macOS)" || MISSING=$((MISSING + 1))

# Claude Code is optional at bootstrap but needed for READY.
if command -v "claude" > /dev/null 2>&1; then
    show_ok "Claude Code: $(claude --version 2>&1 | head -1)"
else
    echo "  Claude Code not found (needed after bootstrap)"
    echo "    Install: npm install -g @anthropic-ai/claude-code"
fi

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "$MISSING prerequisite(s) missing. Install them and re-run bootstrap.sh"
    exit 1
fi
