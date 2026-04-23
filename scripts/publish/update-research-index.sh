#!/bin/bash
# Idempotent: adds per-topic links to Research/index.html if missing.
#
# Usage:
#   scripts/publish/update-research-index.sh <section-map.yaml> <research-root>
#
# Behaviour:
#   - For each slug in the section-map, look for any <a ... href="{slug}/" ...>
#     OR <a ... href="{slug}/index.html" ...> already in the index. If present,
#     skip; otherwise append a minimal <li><a href="{slug}/">{title}</a></li>
#     before the closing </body>.
#   - Re-running with no missing slugs must produce identical output (true
#     idempotency: byte-for-byte same index.html after a second run).
#
# Exit codes:
#   0   index updated (or already up to date)
#   1   section-map or index not found
set -euo pipefail

SECTION_MAP="${1:-}"
RESEARCH_ROOT="${2:-}"
if [[ -z "$SECTION_MAP" || -z "$RESEARCH_ROOT" ]]; then
    echo "usage: update-research-index.sh <section-map.yaml> <research-root>" >&2
    exit 1
fi

INDEX="$RESEARCH_ROOT/index.html"
[[ -f "$SECTION_MAP" ]] || { echo "ERROR: section-map not found: $SECTION_MAP" >&2; exit 1; }
[[ -f "$INDEX" ]]       || { echo "ERROR: research index not found: $INDEX" >&2; exit 1; }

python3 - "$SECTION_MAP" "$INDEX" <<'PY'
import sys, pathlib
try:
    import yaml
except ImportError:
    print("ERROR: python3-yaml not installed (apt install python3-yaml)", file=sys.stderr)
    sys.exit(1)

section_map_path = sys.argv[1]
index_path = pathlib.Path(sys.argv[2])

with open(section_map_path) as fh:
    sm = yaml.safe_load(fh)

html = index_path.read_text()
original = html
added = 0

for out in sm["outputs"]:
    slug = out["slug"]
    title = out["title"]
    # Accept any of these existing patterns as "already present":
    #   href="SLUG/"                  (plan's canonical form)
    #   href="SLUG/index.html"        (2026-04-22 ship used this form)
    #   href='SLUG/'                  (single-quote variant)
    candidates = [
        f'href="{slug}/"',
        f'href="{slug}/index.html"',
        f"href='{slug}/'",
        f"href='{slug}/index.html'",
    ]
    if any(c in html for c in candidates):
        print(f"SKIP {slug} (already present)")
        continue
    # Append before </body>. Simple, no template engine.
    new_li = f'  <li><a href="{slug}/">{title}</a></li>\n'
    if "</body>" in html:
        html = html.replace("</body>", new_li + "</body>", 1)
    else:
        html = html + "\n" + new_li
    added += 1
    print(f"ADDED {slug}")

if html != original:
    index_path.write_text(html)

print(f"DONE -- {added} new links")
PY
