#!/usr/bin/env bash
# Validate SVG file(s) against the SVG schema and the SCRIBE accessibility checklist.
#
# Usage: ./validate.sh path/to/file.svg [more.svg ...]
#
# Exits 0 if all files pass; non-zero otherwise.
# Requires: xmllint, node. The a11y-check.ts script is invoked via npx tsx.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 path/to/file.svg [more.svg ...]" >&2
  exit 2
fi

FAIL=0

for file in "$@"; do
  echo "=== $file ==="

  # XML well-formedness.
  if ! xmllint --noout "$file" 2>/dev/null; then
    echo "  FAIL: malformed XML"
    FAIL=$((FAIL + 1))
    continue
  fi
  echo "  OK: well-formed XML"

  # SVG schema (best-effort; depends on local schema availability).
  if [ -f "$SCRIPT_DIR/svg.xsd" ]; then
    if xmllint --noout --schema "$SCRIPT_DIR/svg.xsd" "$file" 2>/dev/null; then
      echo "  OK: SVG schema validation"
    else
      echo "  WARN: SVG schema validation failed (non-blocking)"
    fi
  fi

  # Accessibility checks.
  if command -v npx > /dev/null 2>&1; then
    if npx tsx "$SCRIPT_DIR/a11y-check.ts" "$file"; then
      echo "  OK: a11y checklist"
    else
      echo "  FAIL: a11y checklist (see output above)"
      FAIL=$((FAIL + 1))
    fi
  else
    echo "  SKIP: npx not available; install Node + tsx for a11y checks"
  fi
done

if [ "$FAIL" -gt 0 ]; then
  echo
  echo "$FAIL file(s) failed validation"
  exit 1
fi

echo
echo "All files passed."
