#!/usr/bin/env bash
# =============================================================================
# generate-captions.sh -- Git tags to Gource caption format converter
# =============================================================================
#
# Extracts git tags (and optionally merge commits) into Gource-compatible
# caption format: <unix-timestamp>|<caption-text>
#
# Usage: generate-captions.sh <repo-path> [output-file] [options]
#
# Options:
#   --include-merges          Include merge commit messages as captions
#   --milestone-pattern <rx>  Filter tags matching regex pattern
#
# Exit codes:
#   0 - Success (including zero tags -- produces empty output)
#   1 - Not a git repository or path does not exist
#
# All diagnostic output goes to stderr, only caption data to stdout.
#
# Phase 399-02 -- Generation
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[generate-captions] ERROR: $*" >&2
}

info() {
    echo "[generate-captions] $*" >&2
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

repo_path=""
output_file=""
include_merges=false
milestone_pattern=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --include-merges)
            include_merges=true
            shift
            ;;
        --milestone-pattern)
            if [[ $# -lt 2 ]]; then
                err "Missing argument for --milestone-pattern"
                exit 1
            fi
            milestone_pattern="$2"
            shift 2
            ;;
        -*)
            err "Unknown option: $1"
            exit 1
            ;;
        *)
            if [[ -z "$repo_path" ]]; then
                repo_path="$1"
            elif [[ -z "$output_file" ]]; then
                output_file="$1"
            else
                err "Unexpected argument: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$repo_path" ]]; then
    err "Usage: generate-captions.sh <repo-path> [output-file] [--include-merges] [--milestone-pattern <regex>]"
    exit 1
fi

# ---------------------------------------------------------------------------
# Validate repository
# ---------------------------------------------------------------------------

if [[ ! -d "$repo_path" ]]; then
    err "Path does not exist: $repo_path"
    exit 1
fi

if ! git -C "$repo_path" rev-parse --git-dir >/dev/null 2>&1; then
    err "Not a git repository: $repo_path"
    exit 1
fi

# ---------------------------------------------------------------------------
# Extract tags
# ---------------------------------------------------------------------------

tag_list=$(git -C "$repo_path" tag -l 2>/dev/null || true)

# Apply milestone pattern filter if specified
if [[ -n "$milestone_pattern" ]] && [[ -n "$tag_list" ]]; then
    tag_list=$(echo "$tag_list" | grep -E "$milestone_pattern" || true)
fi

# ---------------------------------------------------------------------------
# Build caption entries from tags
# ---------------------------------------------------------------------------

captions=""

if [[ -n "$tag_list" ]]; then
    while IFS= read -r tag; do
        if [[ -z "$tag" ]]; then
            continue
        fi
        # Get the commit timestamp for this tag
        timestamp=$(git -C "$repo_path" log -1 --format="%ct" "$tag" 2>/dev/null || true)
        if [[ -z "$timestamp" ]]; then
            info "Warning: could not get timestamp for tag '$tag', skipping"
            continue
        fi
        captions+="${timestamp}|${tag}"$'\n'
    done <<< "$tag_list"
fi

# ---------------------------------------------------------------------------
# Optionally include merge commit captions
# ---------------------------------------------------------------------------

if [[ "$include_merges" == "true" ]]; then
    merge_entries=$(git -C "$repo_path" log --merges --format="%ct|%s" 2>/dev/null || true)
    if [[ -n "$merge_entries" ]]; then
        captions+="${merge_entries}"$'\n'
    fi
fi

# ---------------------------------------------------------------------------
# Sort chronologically and output
# ---------------------------------------------------------------------------

# Remove trailing blank lines and sort
sorted=""
if [[ -n "$captions" ]]; then
    sorted=$(echo "$captions" | grep -v '^$' | sort -t'|' -k1,1n || true)
fi

# Output to file or stdout
if [[ -n "$output_file" ]]; then
    if [[ -n "$sorted" ]]; then
        echo "$sorted" > "$output_file"
    else
        : > "$output_file"
    fi
    if [[ -n "$sorted" ]]; then
        line_count=$(echo "$sorted" | wc -l | tr -d '[:space:]')
    else
        line_count=0
    fi
    info "Wrote $line_count caption(s) to $output_file"
else
    if [[ -n "$sorted" ]]; then
        echo "$sorted"
    fi
fi

exit 0
