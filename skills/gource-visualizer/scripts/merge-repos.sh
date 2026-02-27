#!/usr/bin/env bash
# =============================================================================
# merge-repos.sh -- Merge Gource logs from multiple repositories
# =============================================================================
#
# Generates individual Gource custom logs for each repository, namespaces
# paths under each repo's basename, optionally applies per-repo color codes,
# and produces a single chronologically sorted combined log.
#
# Usage: merge-repos.sh [--color] [--output combined.log] <repo1> [<repo2> ...]
#
# Options:
#   --color              Apply per-repo color coding from 8-color palette
#   --output <file>      Output file path (default: combined.log in cwd)
#
# Exit codes:
#   0 - Success
#   1 - No repo paths provided
#   2 - A repo path doesn't exist or isn't a git repo
#   3 - Log generation failed for a repo
#   4 - Combined log is empty after merge
#
# Phase 399-01 -- Log Generation
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GENERATE_LOG="$SCRIPT_DIR/generate-log.sh"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[merge-repos] ERROR: $*" >&2
}

info() {
    echo "[merge-repos] $*" >&2
}

# ---------------------------------------------------------------------------
# Color palette (8-color, cycles for repos beyond 8)
# ---------------------------------------------------------------------------

COLORS=(FF6B6B 4ECDC4 45B7D1 96CEB4 FFEAA7 DDA0DD 98D8C8 F7DC6F)

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

USE_COLOR=false
OUTPUT_FILE="combined.log"
REPO_PATHS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --color)
            USE_COLOR=true
            shift
            ;;
        --output)
            if [[ $# -lt 2 ]]; then
                err "Missing argument for --output"
                exit 1
            fi
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -*)
            err "Unknown option: $1"
            exit 1
            ;;
        *)
            REPO_PATHS+=("$1")
            shift
            ;;
    esac
done

if [[ ${#REPO_PATHS[@]} -eq 0 ]]; then
    err "Usage: merge-repos.sh [--color] [--output combined.log] <repo1> [<repo2> ...]"
    exit 1
fi

# ---------------------------------------------------------------------------
# Validate all repo paths first
# ---------------------------------------------------------------------------

for repo_path in "${REPO_PATHS[@]}"; do
    if [[ ! -d "$repo_path" ]]; then
        err "Path does not exist: $repo_path"
        exit 2
    fi
    if ! git -C "$repo_path" rev-parse --git-dir >/dev/null 2>&1; then
        err "Not a git repository: $repo_path"
        exit 2
    fi
done

# ---------------------------------------------------------------------------
# Create temp directory for intermediate files
# ---------------------------------------------------------------------------

TMPDIR_MERGE=$(mktemp -d)
# shellcheck disable=SC2329
cleanup_merge() {
    rm -rf "$TMPDIR_MERGE" 2>/dev/null || true
}
trap cleanup_merge EXIT

# ---------------------------------------------------------------------------
# Process each repository
# ---------------------------------------------------------------------------

REPO_COUNT=${#REPO_PATHS[@]}
info "Processing $REPO_COUNT repositories..."

for i in $(seq 1 "$REPO_COUNT"); do
    idx=$((i - 1))
    repo_path="${REPO_PATHS[$idx]}"
    repo_name=$(basename "$repo_path")
    tmpfile="$TMPDIR_MERGE/gource-log-$i.log"

    # Generate log for this repo
    if ! "$GENERATE_LOG" "$repo_path" "$tmpfile" 2>/dev/null; then
        err "Log generation failed for: $repo_path"
        exit 3
    fi

    # Skip if log is empty (empty repo)
    if [[ ! -s "$tmpfile" ]]; then
        info "  $repo_name -> /$repo_name -- 0 entries (skipped)"
        continue
    fi

    # Namespace: prepend repo name to each path field (field 4)
    awk -F'|' -v prefix="/$repo_name" '{
        OFS="|"
        $4 = prefix $4
        print
    }' "$tmpfile" > "$tmpfile.ns" && mv "$tmpfile.ns" "$tmpfile"

    # Apply color if --color flag is set
    color_idx=$(( (i - 1) % 8 ))
    REPO_COLOR="${COLORS[$color_idx]}"

    if [[ "$USE_COLOR" == true ]]; then
        awk -F'|' -v color="$REPO_COLOR" '{
            if (NF == 4) print $0 "|" color;
            else if (NF >= 5) print $1"|"$2"|"$3"|"$4"|"color;
            else print $0;
        }' "$tmpfile" > "$tmpfile.colored" && mv "$tmpfile.colored" "$tmpfile"
    fi

    # Report this repo
    local_count=$(wc -l < "$tmpfile" | tr -d '[:space:]')
    if [[ "$USE_COLOR" == true ]]; then
        info "  $repo_name -> /$repo_name ($REPO_COLOR) -- $local_count entries"
    else
        info "  $repo_name -> /$repo_name -- $local_count entries"
    fi
done

# ---------------------------------------------------------------------------
# Combine and sort chronologically
# ---------------------------------------------------------------------------

# Concatenate all individual logs and sort by timestamp (field 1, numeric)
cat "$TMPDIR_MERGE"/gource-log-*.log 2>/dev/null | sort -t'|' -k1,1n > "$OUTPUT_FILE"

# ---------------------------------------------------------------------------
# Validate combined output
# ---------------------------------------------------------------------------

if [[ ! -s "$OUTPUT_FILE" ]]; then
    err "Combined log is empty -- no entries produced"
    exit 4
fi

TOTAL_ENTRIES=$(wc -l < "$OUTPUT_FILE" | tr -d '[:space:]')

# Extract date range from first and last timestamps
FIRST_TS=$(head -1 "$OUTPUT_FILE" | awk -F'|' '{print $1}')
LAST_TS=$(tail -1 "$OUTPUT_FILE" | awk -F'|' '{print $1}')

FIRST_DATE=$(date -d "@$FIRST_TS" +"%Y-%m-%d" 2>/dev/null || date -r "$FIRST_TS" +"%Y-%m-%d" 2>/dev/null || echo "unknown")
LAST_DATE=$(date -d "@$LAST_TS" +"%Y-%m-%d" 2>/dev/null || date -r "$LAST_TS" +"%Y-%m-%d" 2>/dev/null || echo "unknown")

# ---------------------------------------------------------------------------
# Report summary
# ---------------------------------------------------------------------------

info "Combined: $TOTAL_ENTRIES entries, sorted chronologically"
info "Date range: $FIRST_DATE -> $LAST_DATE"
info "Output: $OUTPUT_FILE"

exit 0
