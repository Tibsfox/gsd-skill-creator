#!/usr/bin/env bash
# =============================================================================
# deploy/ftp-sync.sh
# -----------------------------------------------------------------------------
# Sync the SCRIBE research deliverable to tibsfox.com via FTP.
# Delegates to the canonical tools/ftp-sync.mjs (Component 08 — public deployment).
#
# SCRIBE artifacts:
#   Source: www/tibsfox/com/Research/SCRIBE/ (full tree, no version subdir)
#   Remote: https://tibsfox.com/Research/SCRIBE/
# (FTP root `/` maps to URL `/Research/` — chrooted; do NOT cd /Research).
#
# Reads FTP credentials from <repo-root>/.env:
#   FTP_HOST, FTP_USER, FTP_PASS
#
# IMPORTANT: FTP_PASS char 1 is a literal `'` — do NOT strip. See CLAUDE.md
# "Critical FTP credentials gotchas".
#
# Usage:
#   ./ftp-sync.sh                 # uploads full SCRIBE tree
#   ./ftp-sync.sh --dry-run       # list what would upload, no connection
#   ./ftp-sync.sh --json          # machine-readable output
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

# Delegate to the canonical tools/ftp-sync.mjs with SCRIBE target
node "${REPO_ROOT}/tools/ftp-sync.mjs" scribe "$@"
