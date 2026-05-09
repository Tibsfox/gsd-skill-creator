#!/usr/bin/env bash
# Render a LaTeX equation (or full LaTeX file) as native SVG via dvisvgm.
# See latex-to-svg/README.md for usage.
#
# Requires: TeX Live with `latex` (or `xelatex`) and `dvisvgm` on PATH.
# Output: equation.svg (or <basename>.svg if -i used).

set -euo pipefail

usage() {
  echo "Usage: $0 \"<equation>\"           # inline equation, writes equation.svg"
  echo "       $0 -i input.tex             # full file, writes input.svg"
  exit 2
}

if [ "$#" -eq 0 ]; then usage; fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

if [ "$1" = "-i" ]; then
  [ "$#" -eq 2 ] || usage
  cp "$2" "$WORKDIR/input.tex"
  BASE="$(basename "$2" .tex)"
else
  cat > "$WORKDIR/input.tex" <<EOF
\\documentclass[preview,border=2pt]{standalone}
\\usepackage{amsmath,amssymb}
\\begin{document}
\$\\displaystyle $1\$
\\end{document}
EOF
  BASE="equation"
fi

cd "$WORKDIR"
latex -interaction=nonstopmode input.tex > /dev/null
dvisvgm --no-fonts --exact --bbox=preview --output="$BASE.svg" input.dvi > /dev/null

cp "$BASE.svg" "$OLDPWD/$BASE.svg"
echo "Wrote $BASE.svg"
