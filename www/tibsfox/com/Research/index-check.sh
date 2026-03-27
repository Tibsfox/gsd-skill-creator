#!/usr/bin/env bash
# index-check.sh — Verify PNW master index includes all projects
#
# Checks that every project directory under www/tibsfox/com/Research/ is represented in the
# cross-reference matrix, geographic coverage table, and reading order table
# of the master index.html. Created to prevent the v1.49.25 omission where
# AVI and MAM shipped without updating the index.
#
# Usage: bash www/tibsfox/com/Research/index-check.sh
# Exit 0: all projects present in all sections
# Exit 1: one or more projects missing from one or more sections

set -euo pipefail

# Resolve paths relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INDEX="$SCRIPT_DIR/index.html"
PNW_DIR="$SCRIPT_DIR"
ERRORS=0

if [ ! -f "$INDEX" ]; then
  echo "ERROR: index.html not found at $INDEX"
  exit 1
fi

# Extract sections from index.html for targeted checking
# Cross-reference matrix: from "Cross-Reference Matrix" heading to next h2 or end of table
XREF_SECTION=$(sed -n '/Cross-Reference Matrix/,/<\/table>/p' "$INDEX")
# Geographic coverage: from "Geographic Coverage" heading to next h2 or end of table
GEO_SECTION=$(sed -n '/Geographic Coverage/,/<\/table>/p' "$INDEX")
# Reading order: from "Reading Order" heading to next h2 or end of table
READ_SECTION=$(sed -n '/Reading Order/,/<\/table>/p' "$INDEX")

# Discover project directories (uppercase names, non-hidden, directories only)
for dir in "$PNW_DIR"/*/; do
  [ -d "$dir" ] || continue
  proj=$(basename "$dir")
  # Skip hidden dirs and non-project items (lowercase or dotfiles)
  [[ "$proj" == .* ]] && continue

  # Project directories are already uppercase (COL, CAS, ECO, etc.)
  PROJ_CODE="$proj"

  # Check cross-reference matrix header row
  # Pattern: project codes appear as <span class="tag tag-xxx">XXX</span> in thead
  if ! echo "$XREF_SECTION" | grep -q ">${PROJ_CODE}<" 2>/dev/null; then
    echo "MISSING: $PROJ_CODE not in cross-reference matrix"
    ERRORS=$((ERRORS + 1))
  fi

  # Check geographic coverage table
  # Pattern: project codes appear in href paths like COL/index.html
  if ! echo "$GEO_SECTION" | grep -q "${PROJ_CODE}/" 2>/dev/null; then
    echo "MISSING: $PROJ_CODE not in geographic coverage table"
    ERRORS=$((ERRORS + 1))
  fi

  # Check reading order table
  # Pattern: project codes appear in href paths like COL/index.html
  if ! echo "$READ_SECTION" | grep -q "${PROJ_CODE}/" 2>/dev/null; then
    echo "MISSING: $PROJ_CODE not in reading order table"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "FAIL: $ERRORS missing entries in PNW master index"
  exit 1
else
  PROJ_COUNT=$(find "$PNW_DIR" -mindepth 1 -maxdepth 1 -type d ! -name '.*' | wc -l)
  echo "OK: All $PROJ_COUNT projects present in all index tables"
  exit 0
fi
