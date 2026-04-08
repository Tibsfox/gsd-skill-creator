#!/bin/bash
# Build PSC research documents into standalone HTML and PDF
# Requires: pandoc, xelatex
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

    # Standalone HTML
    if "$PANDOC" "$md" \
        --standalone \
        --template="$HTML_TEMPLATE" \
        --metadata title="$title" \
        -o "$HTML_OUT/${base}.html" 2>/dev/null; then
        echo "  + HTML"
    else
        echo "  x HTML failed"
        FAIL=$((FAIL+1))
    fi

    # PDF via xelatex
    if "$PANDOC" "$md" \
        --pdf-engine=xelatex \
        --template="$TEX_TEMPLATE" \
        --metadata title="$title" \
        -o "$PDF_OUT/${base}.pdf" 2>/dev/null; then
        echo "  + PDF"
        SUCCESS=$((SUCCESS+1))
    else
        echo "  x PDF failed"
        FAIL=$((FAIL+1))
    fi
done

# Build infrastructure dividend essay
if [ -f "$RESEARCH/infrastructure-dividend-essay.md" ]; then
    echo "Building infrastructure-dividend-essay"
    title=$(head -1 "$RESEARCH/infrastructure-dividend-essay.md" | sed 's/^# //')
    "$PANDOC" "$RESEARCH/infrastructure-dividend-essay.md" --standalone --template="$HTML_TEMPLATE" --metadata title="$title" -o "$HTML_OUT/infrastructure-dividend-essay.html" 2>/dev/null && echo "  + HTML" || echo "  x HTML"
    "$PANDOC" "$RESEARCH/infrastructure-dividend-essay.md" --pdf-engine=xelatex --template="$TEX_TEMPLATE" --metadata title="$title" -o "$PDF_OUT/infrastructure-dividend-essay.pdf" 2>/dev/null && echo "  + PDF" || echo "  x PDF"
fi

echo ""
echo "=== Build complete ==="
echo "HTML: $HTML_OUT/ ($(ls "$HTML_OUT"/*.html 2>/dev/null | wc -l) files)"
echo "PDF:  $PDF_OUT/ ($(ls "$PDF_OUT"/*.pdf 2>/dev/null | wc -l) files)"
echo "Success: $SUCCESS, Failed: $FAIL"
