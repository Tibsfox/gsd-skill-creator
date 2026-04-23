#!/bin/bash
# Carve a research FINAL.md into per-topic markdown files via a section-map.yaml.
#
# Usage:
#   scripts/publish/carve-final.sh <section-map.yaml> [--output-dir DIR]
#   scripts/publish/carve-final.sh <section-map.yaml> <output-dir>
#
# Emits one subdirectory per YAML output-entry; each contains:
#   source.md      -- the carved markdown (slice of FINAL.md between the two headings)
#   .slug          -- the slug (e.g. BLN/nonlinear-frontier), used by build-page.sh
#   .title         -- the page title, used by build-page.sh
#   .source_pdf    -- the path to the source PDF, copied by build-page.sh
#
# Exit codes:
#   0   all sections carved successfully
#   1   one or more start_heading lines missing from source
#   2   usage / I/O error
set -euo pipefail

SECTION_MAP="${1:-}"
if [[ -z "$SECTION_MAP" ]]; then
    echo "usage: carve-final.sh <section-map.yaml> [--output-dir DIR | <output-dir>]" >&2
    exit 2
fi

# Accept both "--output-dir X" and positional X. Default /tmp/carved.
OUTPUT_DIR="/tmp/carved"
if [[ "${2:-}" == "--output-dir" ]]; then
    OUTPUT_DIR="${3:-/tmp/carved}"
elif [[ -n "${2:-}" ]]; then
    OUTPUT_DIR="$2"
fi

[[ -f "$SECTION_MAP" ]] || { echo "ERROR: section-map not found: $SECTION_MAP" >&2; exit 2; }
mkdir -p "$OUTPUT_DIR"

# YAML parsing via python3 (portable, no yq dep). Keep heredoc self-contained.
python3 - "$SECTION_MAP" "$OUTPUT_DIR" <<'PY'
import sys, os, re, pathlib
try:
    import yaml
except ImportError:
    print("ERROR: python3-yaml not installed (apt install python3-yaml)", file=sys.stderr)
    sys.exit(2)

section_map_path = sys.argv[1]
out_dir = pathlib.Path(sys.argv[2])

with open(section_map_path) as fh:
    sm = yaml.safe_load(fh)

src_path = pathlib.Path(sm["source"])
if not src_path.exists():
    print(f"ERROR: source FINAL.md not found: {src_path}", file=sys.stderr)
    sys.exit(2)

lines = src_path.read_text().splitlines(keepends=True)

def find_exact_line(heading, lines, start=0):
    """Find first line whose stripped content equals heading (stripped)."""
    target = heading.rstrip("\n")
    for i in range(start, len(lines)):
        if lines[i].rstrip("\n") == target:
            return i
    return -1

rc = 0
for out in sm["outputs"]:
    slug = out["slug"]
    start_heading = out["start_heading"]
    end_heading = out["end_heading"]
    s = find_exact_line(start_heading, lines)
    if s < 0:
        print(f"MISSING start_heading for {slug}: {start_heading!r}", file=sys.stderr)
        rc = 1
        continue
    e = find_exact_line(end_heading, lines, s + 1)
    if e < 0:
        # Backstop: carve to end of file if end_heading is missing.
        print(f"WARN  end_heading not found for {slug}; carving to EOF", file=sys.stderr)
        e = len(lines)
    # Slug may contain slashes (TIBS/merle-breakthrough-2026); normalize to a flat dir name.
    out_subdir = out_dir / slug.replace("/", "__")
    out_subdir.mkdir(parents=True, exist_ok=True)
    (out_subdir / "source.md").write_text("".join(lines[s:e]))
    (out_subdir / ".slug").write_text(slug + "\n")
    (out_subdir / ".title").write_text(out["title"] + "\n")
    (out_subdir / ".source_pdf").write_text(out["source_pdf"] + "\n")
    print(f"CARVED {slug} -> {out_subdir}/source.md ({e-s} lines)")

sys.exit(rc)
PY
