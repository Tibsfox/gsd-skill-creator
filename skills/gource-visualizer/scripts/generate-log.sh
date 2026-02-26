#!/usr/bin/env bash
# =============================================================================
# generate-log.sh -- Convert a git repository into Gource custom log format
# =============================================================================
#
# Produces pipe-delimited log lines consumable by Gource:
#   <unix-timestamp>|<username>|<A|M|D>|<filepath>[|<color>]
#
# Uses gource --output-custom-log when available, falls back to git log
# parsing for environments where gource is not installed.
#
# Usage: generate-log.sh <repo-path> [output-file]
#   If output-file is omitted, outputs to stdout.
#
# Exit codes:
#   0 - Success
#   1 - Invalid arguments or not a git repository
#   2 - Log generation failed
#
# Phase 399-01 -- Log Generation
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[generate-log] ERROR: $*" >&2
}

info() {
    echo "[generate-log] $*" >&2
}

warn() {
    echo "[generate-log] WARNING: $*" >&2
}

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]]; then
    err "Usage: generate-log.sh <repo-path> [output-file]"
    exit 1
fi

REPO_PATH="$1"
OUTPUT_FILE="${2:-}"

# ---------------------------------------------------------------------------
# Validate repository
# ---------------------------------------------------------------------------

if [[ ! -d "$REPO_PATH" ]]; then
    err "Path does not exist: $REPO_PATH"
    exit 1
fi

# Use detect-repo.sh if available, otherwise fall back to git rev-parse
if [[ -x "$SCRIPT_DIR/detect-repo.sh" ]]; then
    if ! "$SCRIPT_DIR/detect-repo.sh" "$REPO_PATH" >/dev/null 2>&1; then
        err "Not a recognized repository: $REPO_PATH"
        exit 1
    fi
else
    if ! git -C "$REPO_PATH" rev-parse --git-dir >/dev/null 2>&1; then
        err "Not a git repository: $REPO_PATH"
        exit 1
    fi
fi

# ---------------------------------------------------------------------------
# Check for commits
# ---------------------------------------------------------------------------

COMMIT_COUNT=$(git -C "$REPO_PATH" rev-list --count HEAD 2>/dev/null || echo "0")
COMMIT_COUNT=$(echo "$COMMIT_COUNT" | tr -d '[:space:]')

if [[ "$COMMIT_COUNT" -eq 0 ]]; then
    warn "Repository has no commits: $REPO_PATH"
    if [[ -n "$OUTPUT_FILE" ]]; then
        : > "$OUTPUT_FILE"
    fi
    exit 0
fi

# ---------------------------------------------------------------------------
# Generate custom log
# ---------------------------------------------------------------------------

TMPFILE=""
cleanup_tmp() {
    if [[ -n "$TMPFILE" && -f "$TMPFILE" ]]; then
        rm -f "$TMPFILE"
    fi
}
trap cleanup_tmp EXIT

generate_with_gource() {
    local target="$1"
    gource --output-custom-log "$target" "$REPO_PATH" 2>/dev/null
}

generate_with_git_log() {
    local target="$1"
    # Produce Gource custom log format from git log
    # Format: timestamp|user|type|/filepath
    # We parse --diff-filter to get A/M/D and --name-status for file paths
    git -C "$REPO_PATH" log \
        --reverse \
        --pretty=format:"COMMIT:%at|%aN" \
        --diff-filter=AMD \
        --name-status \
        -- 2>/dev/null | awk '
        /^COMMIT:/ {
            split(substr($0, 8), parts, "|")
            ts = parts[1]
            user = parts[2]
            next
        }
        /^[AMD]\t/ {
            type = substr($1, 1, 1)
            file = $2
            # Ensure path starts with /
            if (substr(file, 1, 1) != "/") file = "/" file
            print ts "|" user "|" type "|" file
        }
    ' > "$target"
}

if [[ -n "$OUTPUT_FILE" ]]; then
    # Output to file
    if command -v gource >/dev/null 2>&1; then
        if ! generate_with_gource "$OUTPUT_FILE"; then
            warn "gource --output-custom-log failed, falling back to git log"
            generate_with_git_log "$OUTPUT_FILE"
        fi
    else
        generate_with_git_log "$OUTPUT_FILE"
    fi
    TARGET="$OUTPUT_FILE"
else
    # Output to stdout via temp file
    TMPFILE=$(mktemp)
    if command -v gource >/dev/null 2>&1; then
        if ! generate_with_gource "$TMPFILE"; then
            warn "gource --output-custom-log failed, falling back to git log"
            generate_with_git_log "$TMPFILE"
        fi
    else
        generate_with_git_log "$TMPFILE"
    fi
    TARGET="$TMPFILE"
fi

# ---------------------------------------------------------------------------
# Validate output format
# ---------------------------------------------------------------------------

if [[ -f "$TARGET" ]]; then
    MALFORMED=$(grep -cvE '^[0-9]+\|[^|]+\|[AMD]\|/[^|]*(|[0-9A-Fa-f]{6})?$' "$TARGET" 2>/dev/null || true)
    if [[ -n "$MALFORMED" && "$MALFORMED" -gt 0 ]]; then
        warn "$MALFORMED malformed lines detected"
    fi
fi

# ---------------------------------------------------------------------------
# Report stats to stderr
# ---------------------------------------------------------------------------

if [[ -f "$TARGET" ]]; then
    ENTRY_COUNT=$(wc -l < "$TARGET" | tr -d '[:space:]')

    if [[ "$ENTRY_COUNT" -gt 0 ]]; then
        MIN_TS=$(awk -F'|' 'NR==1{print $1}' "$TARGET")
        MAX_TS=$(awk -F'|' 'END{print $1}' "$TARGET")
        USER_COUNT=$(awk -F'|' '{print $2}' "$TARGET" | sort -u | wc -l | tr -d '[:space:]')

        # Convert timestamps to dates
        MIN_DATE=$(date -d "@$MIN_TS" +"%Y-%m-%d" 2>/dev/null || date -r "$MIN_TS" +"%Y-%m-%d" 2>/dev/null || echo "unknown")
        MAX_DATE=$(date -d "@$MAX_TS" +"%Y-%m-%d" 2>/dev/null || date -r "$MAX_TS" +"%Y-%m-%d" 2>/dev/null || echo "unknown")

        info "$ENTRY_COUNT entries, $USER_COUNT users, $MIN_DATE to $MAX_DATE"
    else
        info "0 entries"
    fi
fi

# ---------------------------------------------------------------------------
# Output to stdout if no output file was specified
# ---------------------------------------------------------------------------

if [[ -z "$OUTPUT_FILE" && -f "$TMPFILE" ]]; then
    cat "$TMPFILE"
fi

exit 0
