#!/usr/bin/env bash
# tools/gh-release-publish.sh — wrap `gh release create` with the
# snap-confinement workaround (cp release-notes to $HOME first).
#
# Usage:
#   bash tools/gh-release-publish.sh <version> [title]
#   npm run gh-release-publish -- <version> [title]
#
# Examples:
#   npm run gh-release-publish -- 1.49.596
#   npm run gh-release-publish -- 1.49.596 "v1.49.596 — Apollo 13"
#
# Env:
#   GH_RELEASE_PUBLISH_DRY_RUN=1  print the gh invocation, do the file
#                                 copy, but skip the actual `gh` call.
#                                 Used by the test suite + safe rehearsal.
#
# Exit codes:
#   0  release created (or dry-run completed)
#   1  not in a git repo, missing release-notes file, or gh CLI not found
#   2  gh release create failed
#
# Snap-confinement context (closes Lesson #10201):
#
#   `gh` is installed via snap in this environment. Snap-confined apps
#   run in a sandbox that restricts filesystem access to declared
#   "interfaces." gh's interfaces (`snap connections gh`) are home,
#   network, network-bind, desktop, ssh-keys — there is NO interface
#   granting access to /tmp or to mount points outside $HOME. So
#   `gh release create --notes-file docs/release-notes/...` fails with
#   "permission denied" when the repo lives outside $HOME (e.g. on an
#   alternative mount under /media/<user>/...).
#
#   Workaround: copy release-notes to $HOME first, then call gh, then
#   clean up. The full root-cause investigation lives at
#     .planning/missions/v1-49-591-apollo-8-first-crewed-translunar/
#       evidence/gh-cli-path-investigation.md
#
#   Filename hyphenation (v1-49-NNN-rn.md vs v1.49.NNN-rn.md) avoids
#   shell-glob and dot-file pitfalls in $HOME where multiple ship
#   sessions may coexist.
#
# Long-term remediation options (deferred until/unless the workaround
# stops working):
#   - install gh via apt or the official deb (non-confined; loses snap
#     auto-update)
#   - sudo snap connect gh:system-files :system-files (weakens sandbox)
#
# Authored 2026-05-02 in the post-v1.49.596 CLAUDE.md compaction phase
# (Tier 2 — promote snap-confinement workaround prose to a wrapper).

set -euo pipefail

VERSION="${1:?Usage: gh-release-publish <version> [title]}"
TITLE="${2:-v${VERSION}}"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[gh-release-publish] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

# Parse owner/repo from origin remote so we can pass --repo to gh and bypass
# local .git/ discovery — required when snap-confined gh cannot read cwd
# outside $HOME (closes IC-613-2 from v1.49.613 close-state CARRY-FORWARD.md).
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
REPO_SLUG=""
if [ -n "$ORIGIN_URL" ]; then
  # Match both https://github.com/OWNER/REPO(.git) and git@github.com:OWNER/REPO(.git)
  REPO_SLUG="$(echo "$ORIGIN_URL" | sed -E 's|^.*github\.com[/:]([^/]+/[^/]+)(\.git)?/?$|\1|; s|\.git$||')"
fi
if [ -z "$REPO_SLUG" ] || [ "$REPO_SLUG" = "$ORIGIN_URL" ]; then
  echo "[gh-release-publish] FATAL: could not parse OWNER/REPO from origin URL: $ORIGIN_URL" >&2
  exit 1
fi

SRC="docs/release-notes/v${VERSION}/README.md"
if [ ! -f "$SRC" ]; then
  echo "[gh-release-publish] FATAL: release notes not found: $SRC" >&2
  exit 1
fi

SAFE_VERSION="${VERSION//./-}"
TMP="${HOME}/v${SAFE_VERSION}-rn.md"

cp "$SRC" "$TMP"
trap 'rm -f "$TMP"' EXIT

SIZE="$(stat -c%s "$TMP" 2>/dev/null || stat -f%z "$TMP")"

if [ "${GH_RELEASE_PUBLISH_DRY_RUN:-0}" = "1" ]; then
  echo "[gh-release-publish] DRY-RUN: notes-file copied to ${TMP} (${SIZE} bytes)"
  echo "[gh-release-publish] DRY-RUN: would invoke:"
  echo "  gh release create v${VERSION} --repo ${REPO_SLUG} --title \"${TITLE}\" --notes-file ${TMP} --target main"
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "[gh-release-publish] FATAL: gh CLI not installed" >&2
  exit 1
fi

if ! gh release create "v${VERSION}" \
       --repo "$REPO_SLUG" \
       --title "$TITLE" \
       --notes-file "$TMP" \
       --target main; then
  echo "[gh-release-publish] FATAL: gh release create failed" >&2
  exit 2
fi

echo "[gh-release-publish] release created: v${VERSION} on ${REPO_SLUG}"
