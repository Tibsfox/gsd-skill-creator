#!/bin/bash
# Build COL research site from .planning/output markdown files
# Usage: bash www/tibsfox/com/Research/COL/build.sh

set -euo pipefail
cd "$(dirname "$0")/../../.."

SRC=".planning/output"
DST="www/tibsfox/com/Research/COL/research"

mkdir -p "$DST"

# Map of source files to output names and titles
declare -A FILES=(
  ["00-shared-schemas.md"]="schemas|Foundation Schemas & Source Index"
  ["01-flora.md"]="flora|Flora Survey — Plant Biodiversity"
  ["02-fauna.md"]="fauna|Fauna Survey — Animal Biodiversity"
  ["03-fungi.md"]="fungi|Fungi Survey — Mycological Biodiversity"
  ["04-aquatic.md"]="aquatic|Aquatic Analysis — Salmon as Keystone"
  ["05-synthesis.md"]="synthesis|Network Synthesis — Ecological Cascades"
  ["06-publication.md"]="publication|Final Publication"
  ["07-verification-report.md"]="verification|Verification Report"
)

for src_file in "${!FILES[@]}"; do
  IFS='|' read -r slug title <<< "${FILES[$src_file]}"
  src_path="$SRC/$src_file"

  if [ ! -f "$src_path" ]; then
    echo "SKIP: $src_path not found"
    continue
  fi

  echo "BUILD: $slug ($title)"
  cp "$src_path" "$DST/${slug}.md"
done

echo "DONE: $(ls "$DST"/*.md 2>/dev/null | wc -l) markdown files staged"
echo "Serve: python3 -m http.server 8080 --directory www/tibsfox/com/Research/COL"
