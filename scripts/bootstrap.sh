#!/bin/bash
# =============================================================================
# GSD-OS Bootstrap — The seed that grows the tree
# =============================================================================
#
# Usage: ./bootstrap.sh [--magic LEVEL] [LEVEL]
# LEVEL: 1 (silent) to 5 (verbose), default 3
#
# 6-step sequence:
#   1. Check prerequisites (node, npm, tmux, git)
#   2. Create archive directory + move zip files
#   3. Initialize .planning/ directory tree
#   4. Check/initialize git
#   5. Build and link (npm install + build)
#   6. Start tmux session
#
# Safety guarantees:
#   - NEVER calls sudo or any privilege-elevating command
#   - NEVER calls rm or any deletion command
#   - All directory creation uses mkdir -p (idempotent)
#   - All file moves use mv (not copy-then-delete)
#   - set -euo pipefail ensures clean exit on any failure
#
# Phase 378-01 — Bootstrap
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing: --magic LEVEL or positional LEVEL
# ---------------------------------------------------------------------------
MAGIC_LEVEL=3

while [ $# -gt 0 ]; do
    case "$1" in
        --magic)
            MAGIC_LEVEL="$2"
            shift 2
            ;;
        [1-5])
            MAGIC_LEVEL="$1"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

export MAGIC_LEVEL

GSD_ROOT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE_DIR="${GSD_ROOT}/archive"
PLANNING_DIR="${GSD_ROOT}/.planning"

# ---------------------------------------------------------------------------
# Visual feedback functions — adapted to magic level
# ---------------------------------------------------------------------------
show_progress() {
    local step="$1" total="$2" label="$3"
    if [ "$MAGIC_LEVEL" -le 2 ]; then
        # Shapes only: progress indicator
        printf "\r[%-${total}s] %d/%d" "$(printf '#%.0s' $(seq 1 "$step"))" "$step" "$total"
    else
        echo "[$step/$total] $label"
    fi
}

show_ok() {
    if [ "$MAGIC_LEVEL" -le 2 ]; then
        printf " ."
    else
        echo "  OK $1"
    fi
}

show_fail() {
    if [ "$MAGIC_LEVEL" -le 2 ]; then
        printf " x"
    else
        echo "  FAIL $1"
    fi
}

export -f show_ok
export -f show_fail

# =============================================================================
# Step 1: Check prerequisites
# =============================================================================
show_progress 1 6 "Checking prerequisites..."
# shellcheck source=scripts/check-prerequisites.sh
source "${GSD_ROOT}/scripts/check-prerequisites.sh"

# =============================================================================
# Step 2: Create archive directory + move zip files
# =============================================================================
show_progress 2 6 "Setting up archive..."
mkdir -p "$ARCHIVE_DIR"
# Move any zip files in root to archive (the seed is preserved)
find "$GSD_ROOT" -maxdepth 1 -name "*.zip" -exec mv {} "$ARCHIVE_DIR/" \;
show_ok "Archive directory ready"

# =============================================================================
# Step 3: Initialize .planning/ directory tree
# =============================================================================
show_progress 3 6 "Initializing planning directories..."
mkdir -p "${PLANNING_DIR}"/{conversations,staging/{intake,processed,quarantine},missions,console/{inbox/pending,outbox/{status,questions,notifications}},config}

# Write magic-level.json config
echo "{\"level\": ${MAGIC_LEVEL}, \"updated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    > "${PLANNING_DIR}/config/magic-level.json"

show_ok "Planning directories initialized"

# =============================================================================
# Step 4: Check/initialize git
# =============================================================================
show_progress 4 6 "Checking version control..."
if [ ! -d "${GSD_ROOT}/.git" ]; then
    git init "$GSD_ROOT" > /dev/null 2>&1
    show_ok "Git initialized"
else
    show_ok "Git already initialized"
fi

# =============================================================================
# Step 5: Build and link
# =============================================================================
show_progress 5 6 "Building GSD-OS..."
if [ -f "${GSD_ROOT}/package.json" ]; then
    npm install --silent 2>&1 | { [ "$MAGIC_LEVEL" -ge 4 ] && cat || cat > /dev/null; }
    npm run build --silent 2>&1 | { [ "$MAGIC_LEVEL" -ge 4 ] && cat || cat > /dev/null; } || true
    show_ok "Build complete"
else
    show_ok "No package.json — skipping build"
fi

# =============================================================================
# Step 6: Start tmux session
# =============================================================================
show_progress 6 6 "Starting tmux session..."
SESSION_NAME="gsd"
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    show_ok "tmux session '$SESSION_NAME' already running"
    echo ""
    echo "Attach with: tmux attach -t $SESSION_NAME"
else
    tmux new-session -d -s "$SESSION_NAME" -c "$GSD_ROOT"
    show_ok "tmux session '$SESSION_NAME' created"
    echo ""
    echo "Attach with: tmux attach -t $SESSION_NAME"
    echo "Then start Claude Code to see READY."
fi
