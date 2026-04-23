#!/bin/bash
# Build one per-topic HTML page + copy the source PDF alongside it.
#
# Usage:
#   scripts/publish/build-page.sh <carved-dir> <output-root>
#
#   carved-dir   directory produced by carve-final.sh (contains source.md
#                + .slug + .title + .source_pdf)
#   output-root  target research root (e.g. www/tibsfox/com/Research for a
#                real build, or /tmp/xyz/Research for a dry-run). The slug
#                from .slug is appended to form the final output directory.
#
# Uses pandoc --mathjax to produce a standalone HTML document that loads
# MathJax from CDN. This matches the 2026-04-22 ship behaviour (those pages
# also relied on MathJax CDN for inline/display math).
#
# Exit codes:
#   0   page built successfully (HTML + optional PDF copy)
#   1   pandoc failed (see stderr)
#   2   usage / input error
set -euo pipefail

CARVED_DIR="${1:-}"
OUTPUT_ROOT="${2:-}"
if [[ -z "$CARVED_DIR" || -z "$OUTPUT_ROOT" ]]; then
    echo "usage: build-page.sh <carved-dir> <output-root>" >&2
    exit 2
fi

[[ -d "$CARVED_DIR" ]]           || { echo "ERROR: carved-dir missing: $CARVED_DIR" >&2; exit 2; }
[[ -f "$CARVED_DIR/.slug" ]]     || { echo "ERROR: $CARVED_DIR/.slug missing" >&2; exit 2; }
[[ -f "$CARVED_DIR/.title" ]]    || { echo "ERROR: $CARVED_DIR/.title missing" >&2; exit 2; }
[[ -f "$CARVED_DIR/source.md" ]] || { echo "ERROR: $CARVED_DIR/source.md missing" >&2; exit 2; }

SLUG=$(head -n1 "$CARVED_DIR/.slug" | tr -d '\r\n')
TITLE=$(head -n1 "$CARVED_DIR/.title" | tr -d '\r\n')
SRC_PDF=""
if [[ -f "$CARVED_DIR/.source_pdf" ]]; then
    SRC_PDF=$(head -n1 "$CARVED_DIR/.source_pdf" | tr -d '\r\n')
fi
SRC_MD="$CARVED_DIR/source.md"
OUT_DIR="$OUTPUT_ROOT/$SLUG"
mkdir -p "$OUT_DIR"

# Verify pandoc presence before invoking.
if ! command -v pandoc >/dev/null 2>&1; then
    echo "ERROR: pandoc not found in PATH (apt install pandoc)" >&2
    exit 1
fi

# pandoc: markdown -> standalone HTML5 with MathJax loader.
# --mathjax tells pandoc to emit math as spans that MathJax can render.
# We also unconditionally inject a MathJax CDN <script> into the <head> so
# every generated page matches the 2026-04-22 ship's MathJax-CDN-loaded
# property, even when the carved section has no $...$ math (pandoc only
# emits the loader when math spans exist in the output).
MATHJAX_HEADER=$(mktemp)
cat > "$MATHJAX_HEADER" <<'MATHJAX_HTML'
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
MATHJAX_HTML

pandoc \
    --from markdown \
    --to html5 \
    --standalone \
    --mathjax \
    --include-in-header="$MATHJAX_HEADER" \
    --metadata "title=$TITLE" \
    --output "$OUT_DIR/index.html" \
    "$SRC_MD"

rm -f "$MATHJAX_HEADER"

# Copy source PDF alongside the HTML (matches 2026-04-22 layout).
PDF_COPIED="no-pdf"
if [[ -n "$SRC_PDF" && -f "$SRC_PDF" ]]; then
    cp "$SRC_PDF" "$OUT_DIR/"
    PDF_COPIED="$(basename "$SRC_PDF")"
elif [[ -n "$SRC_PDF" ]]; then
    echo "WARN: source PDF not found at $SRC_PDF -- HTML built, PDF skipped" >&2
fi

HTML_BYTES=$(stat -c '%s' "$OUT_DIR/index.html")
echo "BUILT $SLUG -> $OUT_DIR (HTML ${HTML_BYTES} bytes, PDF ${PDF_COPIED})"
