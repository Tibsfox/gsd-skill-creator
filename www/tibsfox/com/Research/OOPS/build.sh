#!/bin/bash
# Build OOPS research documents into standalone HTML and PDF
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESEARCH="$DIR/research"
HTML_OUT="$DIR/html"
PDF_OUT="$DIR/pdf"
HTML_TEMPLATE="$DIR/html-template.html"
TEX_TEMPLATE="$DIR/template.tex"
PANDOC="${HOME}/.local/bin/pandoc"

mkdir -p "$HTML_OUT" "$PDF_OUT"

SUCCESS=0
FAIL=0

for md in "$RESEARCH"/[0-9]*.md; do
    [ -f "$md" ] || continue
    base=$(basename "$md" .md)
    title=$(head -1 "$md" | sed 's/^# //')

    echo "Building $base: $title"

    if "$PANDOC" "$md" --standalone --template="$HTML_TEMPLATE" --metadata title="$title" -o "$HTML_OUT/${base}.html" 2>/dev/null; then
        echo "  ✓ HTML"
    else
        echo "  ✗ HTML failed"; FAIL=$((FAIL+1))
    fi

    if "$PANDOC" "$md" --pdf-engine=xelatex --template="$TEX_TEMPLATE" --metadata title="$title" -o "$PDF_OUT/${base}.pdf" 2>/dev/null; then
        echo "  ✓ PDF"; SUCCESS=$((SUCCESS+1))
    else
        echo "  ✗ PDF failed"; FAIL=$((FAIL+1))
    fi
done

echo ""
echo "=== Build complete ==="
echo "HTML: $HTML_OUT/ ($(ls "$HTML_OUT"/*.html 2>/dev/null | wc -l) files)"
echo "PDF:  $PDF_OUT/ ($(ls "$PDF_OUT"/*.pdf 2>/dev/null | wc -l) files)"
echo "Success: $SUCCESS, Failed: $FAIL"
