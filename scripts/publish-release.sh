#!/bin/bash
# publish-release.sh — Create or update a GitHub release with full release notes
#
# Usage: ./scripts/publish-release.sh v1.49.31
#
# Validates that release notes exist and contain required sections before
# publishing. Refuses to proceed without complete notes.
#
# Required sections:
#   - Summary
#   - Key Features
#   - Retrospective (What Worked + What Could Be Better OR Lessons Learned)
#
# If the release already exists on GitHub, updates the body.
# If it doesn't exist, creates it from the tag.

set -euo pipefail

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/publish-release.sh <version>"
  echo "Example: ./scripts/publish-release.sh v1.49.31"
  exit 1
fi

# Strip leading 'v' for directory lookup, add it back for tag
TAG="$VERSION"
if [[ "$VERSION" != v* ]]; then
  TAG="v${VERSION}"
fi
DIR_VERSION="$TAG"

NOTES_DIR="docs/release-notes/${DIR_VERSION}"
NOTES_FILE="${NOTES_DIR}/README.md"

# --- Validation ---

echo "Checking release notes for ${TAG}..."

# 1. File exists
if [ ! -f "$NOTES_FILE" ]; then
  echo "FAIL: ${NOTES_FILE} does not exist."
  echo ""
  echo "Create the release notes first, then run this script."
  exit 1
fi

# 2. File is not empty
if [ ! -s "$NOTES_FILE" ]; then
  echo "FAIL: ${NOTES_FILE} is empty."
  exit 1
fi

# 3. Required sections
MISSING=()

if ! grep -qi "## Summary" "$NOTES_FILE"; then
  MISSING+=("Summary")
fi

if ! grep -qi "## Key Features" "$NOTES_FILE" && ! grep -qi "### Key Features" "$NOTES_FILE"; then
  # Some releases use ### instead of ##
  if ! grep -qi "Key Features" "$NOTES_FILE"; then
    MISSING+=("Key Features")
  fi
fi

if ! grep -qi "Retrospective" "$NOTES_FILE"; then
  MISSING+=("Retrospective")
fi

# Check for at least one of: What Worked, Lessons Learned
if ! grep -qi "What Worked" "$NOTES_FILE" && ! grep -qi "Lessons Learned" "$NOTES_FILE"; then
  MISSING+=("What Worked or Lessons Learned")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "FAIL: Missing required sections:"
  for section in "${MISSING[@]}"; do
    echo "  - ${section}"
  done
  echo ""
  echo "Add the missing sections to ${NOTES_FILE} and try again."
  exit 1
fi

# 4. Tag exists
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "FAIL: Tag ${TAG} does not exist."
  echo ""
  echo "Create the tag first: git tag ${TAG}"
  exit 1
fi

echo "PASS: Release notes validated."
echo ""

# --- Get repo info ---
REPO=$(git remote get-url origin 2>/dev/null | sed 's|.*github\.com[:/]||;s|\.git$||')
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
fi
if [ -z "$REPO" ]; then
  echo "FAIL: Could not determine GitHub repository. Check git remote or gh auth."
  exit 1
fi

# --- Publish ---

# Check if release already exists
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Release ${TAG} exists. Updating body..."
  gh release edit "$TAG" --repo "$REPO" \
    --title "$(head -1 "$NOTES_FILE" | sed 's/^# //')" \
    --notes "$(tail -n +2 "$NOTES_FILE")"
  echo ""
  echo "Updated: https://github.com/${REPO}/releases/tag/${TAG}"
else
  echo "Creating release ${TAG}..."
  gh release create "$TAG" --repo "$REPO" \
    --title "$(head -1 "$NOTES_FILE" | sed 's/^# //')" \
    --notes "$(tail -n +2 "$NOTES_FILE")"
  echo ""
  echo "Created: https://github.com/${REPO}/releases/tag/${TAG}"
fi

# --- Refresh RELEASE-HISTORY.md (Postgres release_history schema + docs/RELEASE-HISTORY.md) ---
#
# Idempotent; ingests the new release into the release_history schema, extracts
# lessons/metrics, regenerates the top-level index. Non-blocking if it fails
# so a flaky DB doesn't prevent the GitHub release from being marked published.

echo ""
echo "Refreshing docs/RELEASE-HISTORY.md (release_history schema)..."
if [ -x "${0%/*}/release-history-refresh.sh" ]; then
  "${0%/*}/release-history-refresh.sh" --fast --no-classify --quiet || {
    echo ""
    echo "WARN: release-history-refresh failed — docs/RELEASE-HISTORY.md may be stale."
    echo "      Re-run manually: ./scripts/release-history-refresh.sh"
  }
else
  echo "WARN: scripts/release-history-refresh.sh not executable; skipping index refresh."
fi
