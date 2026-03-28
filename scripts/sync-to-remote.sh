#!/bin/bash
# Sync local research data to tibsfox.com MySQL via API
# Usage: ./scripts/sync-to-remote.sh [init|full|projects|edges]

set -e
API="https://tibsfox.com/api/sync.php"
TOKEN="fox-research-sync-2026"
RESEARCH="www/tibsfox/com/Research"

action="${1:-full}"

echo "=== PNW Research Series — Remote Sync ==="
echo "Action: $action"
echo "Target: $API"

# Build project data from series.js
build_project_json() {
  node -e "
    const fs = require('fs');
    const series = fs.readFileSync('$RESEARCH/series.js', 'utf-8');
    const match = series.match(/var projects = \[([\s\S]*?)\];/);
    if (!match) { console.error('Cannot parse series.js'); process.exit(1); }
    const raw = match[1];
    const projects = [];
    const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*path:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      projects.push({ id: m[1], name: m[2], path: m[3] });
    }

    // Parse clusters
    const cmatch = series.match(/var clusters = \[([\s\S]*?)\];/);
    const clusters = [];
    if (cmatch) {
      const cre = /name:\s*'([^']+)',\s*color:\s*'([^']+)',\s*ids:\s*\[([^\]]+)\]/g;
      let cm;
      while ((cm = cre.exec(cmatch[1])) !== null) {
        const ids = cm[3].match(/'([^']+)'/g).map(s => s.replace(/'/g, ''));
        clusters.push({ name: cm[1], color: cm[2], ids: ids, count: ids.length });
        ids.forEach(id => {
          const p = projects.find(pp => pp.id === id);
          if (p) { p.cluster = cm[1]; p.cluster_color = cm[2]; }
        });
      }
    }

    console.log(JSON.stringify({ projects, clusters }));
  "
}

# Build edge data from cross-references.json
build_edge_json() {
  if [ -f "$RESEARCH/AAR/data/cross-references.json" ]; then
    node -e "
      const data = require('./$RESEARCH/AAR/data/cross-references.json');
      const edges = (data.edges || []).map(e => ({
        source: e.source, target: e.target, type: e.type || 'cites'
      }));
      console.log(JSON.stringify({ edges }));
    "
  else
    echo '{"edges":[]}'
  fi
}

case "$action" in
  init)
    echo "Initializing schema..."
    curl -s -X POST "$API?action=init" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}' | python3 -m json.tool
    ;;

  projects)
    echo "Syncing projects..."
    DATA=$(build_project_json)
    echo "$DATA" | curl -s -X POST "$API?action=projects" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- | python3 -m json.tool
    ;;

  edges)
    echo "Syncing edges..."
    DATA=$(build_edge_json)
    echo "$DATA" | curl -s -X POST "$API?action=edges" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- | python3 -m json.tool
    ;;

  full)
    echo "Full sync: projects + clusters + edges..."
    PDATA=$(build_project_json)
    EDATA=$(build_edge_json)

    # Merge project and edge data
    MERGED=$(node -e "
      const p = $PDATA;
      const e = $EDATA;
      console.log(JSON.stringify({
        projects: p.projects,
        clusters: p.clusters,
        edges: e.edges
      }));
    ")

    echo "$MERGED" | curl -s -X POST "$API?action=full" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @- | python3 -m json.tool
    ;;

  *)
    echo "Usage: $0 [init|full|projects|edges]"
    exit 1
    ;;
esac

echo "=== Sync complete ==="
