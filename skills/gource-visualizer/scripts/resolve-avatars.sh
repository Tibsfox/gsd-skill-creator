#!/usr/bin/env bash
# =============================================================================
# resolve-avatars.sh -- GitHub API avatar fetcher with caching
# =============================================================================
#
# Extracts contributor names and emails from a git repository, searches
# GitHub for matching avatar images, and downloads them named exactly
# as the git contributor name (Gource requirement).
#
# Usage: resolve-avatars.sh <repo-path> <output-dir>
#
# Features:
#   - Caching: skips re-download if avatar file already exists
#   - Rate limiting: respects GitHub API limits (60/hr or 5000/hr with token)
#   - GITHUB_TOKEN: uses authenticated requests when token is set
#   - Non-GitHub repos: skips API calls gracefully with message
#   - Placeholder generation: uses ImageMagick if available for missing avatars
#
# Exit codes:
#   0 - Success (at least some avatars resolved, or non-GitHub graceful skip)
#   1 - No contributors found or not a git repository
#   2 - Output directory not writable
#
# All diagnostic output goes to stderr, nothing on stdout.
#
# Phase 399-02 -- Generation
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

err() {
    echo "[resolve-avatars] ERROR: $*" >&2
}

info() {
    echo "[resolve-avatars] $*" >&2
}

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

if [[ $# -lt 2 ]]; then
    err "Usage: resolve-avatars.sh <repo-path> <output-dir>"
    exit 1
fi

repo_path="$1"
output_dir="$2"

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
# Validate / create output directory
# ---------------------------------------------------------------------------

if ! mkdir -p "$output_dir" 2>/dev/null; then
    err "Cannot create output directory: $output_dir"
    exit 2
fi

if ! touch "$output_dir/.write-test" 2>/dev/null; then
    err "Output directory not writable: $output_dir"
    exit 2
fi
rm -f "$output_dir/.write-test"

# ---------------------------------------------------------------------------
# Extract contributors
# ---------------------------------------------------------------------------

declare -a names=()
declare -a emails=()

shortlog_output=$(git -C "$repo_path" shortlog -sne HEAD 2>/dev/null || true)

if [[ -z "$shortlog_output" ]]; then
    err "No contributors found in repository"
    exit 1
fi

while IFS= read -r line; do
    if [[ -z "$line" ]]; then
        continue
    fi
    # Parse "    25\tAlice Developer <alice@example.com>"
    name=$(echo "$line" | sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+(.*)/\1/' | sed -E 's/[[:space:]]*<[^>]+>[[:space:]]*$//')
    email=$(echo "$line" | grep -oP '<\K[^>]+' || true)
    names+=("$name")
    emails+=("$email")
done <<< "$shortlog_output"

contributor_count=${#names[@]}
if [[ $contributor_count -eq 0 ]]; then
    err "No contributors found in repository"
    exit 1
fi

info "Found $contributor_count contributor(s)"

# ---------------------------------------------------------------------------
# Detect GitHub repo
# ---------------------------------------------------------------------------

remote_url=$(git -C "$repo_path" remote get-url origin 2>/dev/null || true)
is_github=false

if echo "$remote_url" | grep -qi "github\.com"; then
    is_github=true
    info "GitHub repository detected: $remote_url"
else
    info "Non-GitHub repository, skipping API avatar lookup"
fi

# ---------------------------------------------------------------------------
# Rate limiting configuration
# ---------------------------------------------------------------------------

request_count=0
MAX_REQUESTS=60

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    MAX_REQUESTS=5000
    info "GITHUB_TOKEN set, rate limit: $MAX_REQUESTS requests"
else
    info "No GITHUB_TOKEN, rate limit: $MAX_REQUESTS requests (unauthenticated)"
fi

# ---------------------------------------------------------------------------
# Fetch avatars
# ---------------------------------------------------------------------------

found_count=0
cached_count=0
downloaded_count=0
not_found_count=0

for i in "${!names[@]}"; do
    name="${names[$i]}"
    email="${emails[$i]}"
    avatar_file="$output_dir/${name}.png"

    # Check cache first
    if [[ -f "$avatar_file" ]]; then
        info "Skipping cached: $name"
        ((cached_count++)) || true
        ((found_count++)) || true
        continue
    fi

    # Only do API lookups for GitHub repos
    if [[ "$is_github" != "true" ]]; then
        ((not_found_count++)) || true
        continue
    fi

    # Rate limit check
    if [[ $request_count -ge $MAX_REQUESTS ]]; then
        info "Rate limit reached ($MAX_REQUESTS requests), stopping API calls"
        ((not_found_count++)) || true
        continue
    fi

    # Build curl auth header
    auth_args=()
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        auth_args+=(-H "Authorization: token $GITHUB_TOKEN")
    fi

    # Search GitHub API for user by email
    encoded_email=$(printf '%s' "$email" | sed 's/@/%40/g; s/+/%2B/g')
    response=$(curl -s "${auth_args[@]}" "https://api.github.com/search/users?q=${encoded_email}+in:email" 2>/dev/null || true)
    ((request_count++)) || true

    # Extract avatar URL using jq
    avatar_url=""
    if command -v jq &>/dev/null; then
        avatar_url=$(echo "$response" | jq -r '.items[0].avatar_url // empty' 2>/dev/null || true)
    else
        # Fallback: grep for avatar_url in JSON
        avatar_url=$(echo "$response" | grep -oP '"avatar_url"\s*:\s*"\K[^"]+' | head -1 || true)
    fi

    if [[ -n "$avatar_url" ]]; then
        # Download avatar
        curl -sL "${auth_args[@]}" "$avatar_url" -o "$avatar_file" 2>/dev/null || true
        ((request_count++)) || true

        if [[ -f "$avatar_file" ]] && [[ -s "$avatar_file" ]]; then
            # Resize to 90x90 if ImageMagick is available
            if command -v convert &>/dev/null; then
                convert "$avatar_file" -resize 90x90 "$avatar_file" 2>/dev/null || true
            fi
            info "Downloaded: $name"
            ((downloaded_count++)) || true
            ((found_count++)) || true
        else
            info "Download failed: $name"
            ((not_found_count++)) || true
        fi
    else
        info "Not found on GitHub: $name"
        ((not_found_count++)) || true
    fi
done

# ---------------------------------------------------------------------------
# Generate placeholders for missing avatars (if ImageMagick available)
# ---------------------------------------------------------------------------

if command -v convert &>/dev/null; then
    for i in "${!names[@]}"; do
        name="${names[$i]}"
        avatar_file="$output_dir/${name}.png"
        if [[ ! -f "$avatar_file" ]]; then
            # Generate a simple colored placeholder with initials
            initials=$(echo "$name" | sed -E 's/([A-Za-z])[^ ]* ?/\1/g' | head -c2 | tr '[:lower:]' '[:upper:]')
            # Deterministic color from name hash
            hash_val=$(echo -n "$name" | cksum | cut -d' ' -f1)
            hue=$(( hash_val % 360 ))
            convert -size 90x90 "xc:hsl($hue,60%,50%)" \
                -gravity center -pointsize 36 -fill white \
                -annotate +0+0 "$initials" \
                "$avatar_file" 2>/dev/null || true
            if [[ -f "$avatar_file" ]]; then
                info "Generated placeholder: $name"
            fi
        fi
    done
fi

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

info "Resolved $found_count/$contributor_count avatars ($cached_count cached, $downloaded_count downloaded, $not_found_count not found)"

exit 0
