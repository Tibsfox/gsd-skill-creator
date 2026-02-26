#!/usr/bin/env bash
# =============================================================================
# detect-repo.sh -- VCS detection and repository metrics as JSON
# =============================================================================
#
# Detects VCS type (git, hg, svn), extracts metrics from repository
# history, and outputs structured JSON to stdout.
#
# Usage: detect-repo.sh [path]
#   path defaults to current directory if not specified.
#
# Exit codes:
#   0 - Success, JSON output on stdout
#   1 - Path does not exist
#   2 - No VCS repository found at path
#   3 - Git command failed
#
# All diagnostic output goes to stderr, only JSON to stdout.
#
# Phase 398-01 -- Foundation
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

err() {
    echo "[detect-repo] ERROR: $*" >&2
}

info() {
    echo "[detect-repo] $*" >&2
}

# Escape a string for JSON (handle quotes and backslashes)
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    str="${str//$'\n'/\\n}"
    str="${str//$'\r'/}"
    printf '%s' "$str"
}

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

REPO_PATH="${1:-.}"

# ---------------------------------------------------------------------------
# Validate path
# ---------------------------------------------------------------------------

if [ ! -d "$REPO_PATH" ]; then
    err "Path does not exist: $REPO_PATH"
    exit 1
fi

# ---------------------------------------------------------------------------
# Detect VCS type
# ---------------------------------------------------------------------------

VCS_TYPE=""

if [ -d "$REPO_PATH/.git" ]; then
    VCS_TYPE="git"
elif [ -d "$REPO_PATH/.hg" ]; then
    VCS_TYPE="hg"
elif [ -d "$REPO_PATH/.svn" ]; then
    VCS_TYPE="svn"
else
    err "No VCS repository found at: $REPO_PATH"
    exit 2
fi

info "Detected VCS: $VCS_TYPE at $REPO_PATH"

# ---------------------------------------------------------------------------
# For non-git VCS, output minimal JSON
# ---------------------------------------------------------------------------

if [ "$VCS_TYPE" != "git" ]; then
    printf '{\n'
    printf '  "vcs_type": "%s",\n' "$VCS_TYPE"
    printf '  "path": "%s"\n' "$(json_escape "$REPO_PATH")"
    printf '}\n'
    exit 0
fi

# ---------------------------------------------------------------------------
# Git metrics extraction
# ---------------------------------------------------------------------------

git_cmd() {
    git -C "$REPO_PATH" "$@" 2>/dev/null
}

# Wrap extraction in a function so we can use local variables
extract_git_metrics() {
    # Commit count
    COMMIT_COUNT=$(git_cmd rev-list --count HEAD 2>/dev/null || echo "0")
    COMMIT_COUNT=$(echo "$COMMIT_COUNT" | tr -d '[:space:]')

    # Date range
    FIRST_COMMIT_DATE=$(git_cmd log --reverse --format='%aI' 2>/dev/null | head -1 || echo "")
    LAST_COMMIT_DATE=$(git_cmd log -1 --format='%aI' 2>/dev/null || echo "")

    # Calculate date range in days
    DATE_RANGE_DAYS=0
    if [ -n "$FIRST_COMMIT_DATE" ] && [ -n "$LAST_COMMIT_DATE" ]; then
        local first_epoch=0
        local last_epoch=0
        # Try GNU date first, then BSD date
        if first_epoch=$(date -d "$FIRST_COMMIT_DATE" +%s 2>/dev/null); then
            last_epoch=$(date -d "$LAST_COMMIT_DATE" +%s 2>/dev/null || echo "$first_epoch")
        elif first_epoch=$(date -jf "%Y-%m-%dT%H:%M:%S" "${FIRST_COMMIT_DATE%%+*}" +%s 2>/dev/null); then
            last_epoch=$(date -jf "%Y-%m-%dT%H:%M:%S" "${LAST_COMMIT_DATE%%+*}" +%s 2>/dev/null || echo "$first_epoch")
        else
            first_epoch=0
            last_epoch=0
        fi

        if [ "$first_epoch" -gt 0 ] && [ "$last_epoch" -gt 0 ]; then
            local diff_seconds=$((last_epoch - first_epoch))
            if [ "$diff_seconds" -lt 0 ]; then
                diff_seconds=$(( -diff_seconds ))
            fi
            DATE_RANGE_DAYS=$((diff_seconds / 86400))
        fi
    fi

    # Contributors
    CONTRIBUTOR_COUNT=0
    CONTRIBUTORS_JSON="[]"

    local shortlog_output=""
    shortlog_output=$(git_cmd shortlog -sne HEAD 2>/dev/null || true)
    if [ -n "$shortlog_output" ]; then
        CONTRIBUTOR_COUNT=$(echo "$shortlog_output" | wc -l | tr -d '[:space:]')

        # Build contributors JSON array
        CONTRIBUTORS_JSON="["
        local is_first=true
        while IFS= read -r line; do
            # Parse "    25\tAlice Developer <alice@example.com>"
            local commits=""
            local name_email=""
            commits=$(echo "$line" | sed -E 's/^[[:space:]]*([0-9]+)[[:space:]]+.*/\1/')
            name_email=$(echo "$line" | sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+(.*)/\1/')

            # Split name and email
            local name=""
            local email=""
            if echo "$name_email" | grep -qE '<[^>]+>'; then
                name=$(echo "$name_email" | sed -E 's/[[:space:]]*<[^>]+>[[:space:]]*//')
                email=$(echo "$name_email" | sed -E 's/.*<([^>]+)>.*/\1/')
            else
                name="$name_email"
                email=""
            fi

            if [ "$is_first" = "true" ]; then
                is_first=false
            else
                CONTRIBUTORS_JSON+=","
            fi

            CONTRIBUTORS_JSON+=$(printf '\n    {"name": "%s", "email": "%s", "commits": %s}' \
                "$(json_escape "$name")" \
                "$(json_escape "$email")" \
                "$commits")
        done <<< "$shortlog_output"
        CONTRIBUTORS_JSON+=$'\n  ]'
    fi

    # File count
    FILE_COUNT=$(git_cmd ls-files 2>/dev/null | wc -l | tr -d '[:space:]')

    # Tag count
    local tag_output=""
    tag_output=$(git_cmd tag -l 2>/dev/null || true)
    if [ -n "$tag_output" ]; then
        TAG_COUNT=$(echo "$tag_output" | wc -l | tr -d '[:space:]')
    else
        TAG_COUNT=0
    fi

    # Branch
    BRANCH=$(git_cmd rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

    # Remote URL
    REMOTE_URL=$(git_cmd remote get-url origin 2>/dev/null || echo "")

    # GitHub detection
    IS_GITHUB=false
    if echo "$REMOTE_URL" | grep -qi "github\.com"; then
        IS_GITHUB=true
    fi
}

extract_git_metrics

# ---------------------------------------------------------------------------
# Output JSON
# ---------------------------------------------------------------------------

printf '{\n'
printf '  "vcs_type": "git",\n'
printf '  "commit_count": %s,\n' "$COMMIT_COUNT"
printf '  "first_commit_date": "%s",\n' "$(json_escape "$FIRST_COMMIT_DATE")"
printf '  "last_commit_date": "%s",\n' "$(json_escape "$LAST_COMMIT_DATE")"
printf '  "date_range_days": %s,\n' "$DATE_RANGE_DAYS"
printf '  "contributor_count": %s,\n' "$CONTRIBUTOR_COUNT"
printf '  "contributors": %s,\n' "$CONTRIBUTORS_JSON"
printf '  "file_count": %s,\n' "$FILE_COUNT"
printf '  "tag_count": %s,\n' "$TAG_COUNT"
printf '  "branch": "%s",\n' "$(json_escape "$BRANCH")"
printf '  "remote_url": "%s",\n' "$(json_escape "$REMOTE_URL")"
printf '  "is_github": %s\n' "$IS_GITHUB"
printf '}\n'

exit 0
