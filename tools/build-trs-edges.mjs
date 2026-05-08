#!/usr/bin/env node
/**
 * build-trs-edges.mjs — back-fill the TRS cross-pack edge catalogue from
 * v604-v613 W1.TRS research files into a single durable JSON file.
 *
 * Closes IC-613-1.2 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 *
 * Why this exists: the TRS pack-pair edge graph + K_N progression is
 * authored fresh each milestone in `.planning/missions/.../work/...TRS...md`
 * but never persisted to a durable public file. The 14 new edges + K_N
 * achievement at each milestone lives in the planning artifact + is
 * referenced obliquely in sibling pages but has no canonical store.
 *
 * Output: www/tibsfox/com/Research/TRS/edges.json
 *
 * Schema:
 *   {
 *     "schema": "trs-edges/v1",
 *     "generated_at": "<ISO timestamp>",
 *     "total_edges": <int>,
 *     "milestones": [
 *       { "milestone": "v1.49.NNN", "pack_bound": "pack-XX",
 *         "predecessor_pack": "pack-YY", "edge_baseline": <int>,
 *         "edges_added": <int>, "edge_total_after": <int>,
 *         "research_file": "<relative path>", "edges": [<edge>...] }
 *     ],
 *     "edges_by_id": { "<id>": <edge> },
 *     "edges_by_pack_pair": { "<pack-A>↔<pack-B>": [<edge>...] }
 *   }
 *
 * Edge object:
 *   { id, source, target, relation, description, milestone_bound, pack_bound }
 *
 * Invocation:
 *   node tools/build-trs-edges.mjs            # write
 *   node tools/build-trs-edges.mjs --dry-run  # report only, no write
 *   node tools/build-trs-edges.mjs --check    # exit 1 if existing file is stale vs scan
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const CHECK = args.has('--check');

const REPO_ROOT = process.cwd();
const OUT_PATH = resolve(REPO_ROOT, 'www/tibsfox/com/Research/TRS/edges.json');

// Known TRS research files across naming conventions (v604-v613 inclusive).
// Each entry: { milestone, paths } — paths tried in order, first existing wins.
const TRS_RESEARCH_LOCATIONS = [
  { milestone: 'v1.49.605', paths: ['.planning/missions/v1-49-605-apollo-16-descartes-highlands/work/research/trs-m1-w2-pack01/research.md'] },
  { milestone: 'v1.49.606', paths: ['.planning/missions/v1-49-606-apollo-17-final-lunar-landing/work/research/trs-m1-w2-next/research.md'] },
  { milestone: 'v1.49.608', paths: ['.planning/missions/v1-49-608-pioneer-11-first-saturn-flyby/work/research/trs-m1-w2-next/research.md'] },
  { milestone: 'v1.49.609', paths: ['.planning/missions/v1-49-609-skylab-station-launch/work/research/trs/research.md'] },
  { milestone: 'v1.49.610', paths: ['.planning/missions/v1-49-610-skylab-2-first-crewed-station/work/research/trs/research.md'] },
  { milestone: 'v1.49.611', paths: ['.planning/missions/v1-49-611-skylab-3-first-long-duration/work/research/trs/research.md'] },
  { milestone: 'v1.49.612', paths: ['.planning/missions/v1-49-612-mariner-10-first-mercury-flyby/work/W1-TRS-research.md'] },
  { milestone: 'v1.49.613', paths: ['.planning/missions/v1-49-613-skylab-4-comet-kohoutek/work/W1-TRS-research.md'] },
  { milestone: 'v1.49.614', paths: ['.planning/missions/v1-49-614-apollo-soyuz-test-project/work/W1-TRS-research.md'] },
  { milestone: 'v1.49.615', paths: ['.planning/missions/v1-49-615-viking-1-first-mars-landing/work/W1-TRS-research.md'] },
  { milestone: 'v1.49.616', paths: ['.planning/missions/v1-49-616-viking-2-utopia-planitia/work/W1-TRS-research.md'] },
  { milestone: 'v1.49.617', paths: ['.planning/missions/v1-49-617-heao-1-x-ray-all-sky-survey/work/W1-TRS-research.md'] },
];

function readFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*?)\s*$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

// Edge row patterns — observed in v605-v613 research files:
//   | <id> | pack-XX-NNN | pack-YY-NNN | <relation> | <description> |
//   | <id> | pack-XX | pack-YY | <relation> | <description> |
// Be permissive about whitespace + escape characters. id is a positive integer.
const EDGE_ROW_RE = /^\|\s*(\d+)\s*\|\s*(pack-\d+(?:-\d+)?)\s*\|\s*(pack-\d+(?:-\d+)?)\s*\|\s*([^|]+?)\s*\|\s*([\s\S]+?)\s*\|\s*$/gm;

function extractPackOnly(packRef) {
  // pack-05-001 → pack-05; pack-12 → pack-12
  const m = packRef.match(/^(pack-\d+)/);
  return m ? m[1] : packRef;
}

function packPairKey(a, b) {
  const pa = extractPackOnly(a);
  const pb = extractPackOnly(b);
  return [pa, pb].sort().join('↔');
}

function extractEdges(text) {
  const edges = [];
  // Strip ** markdown bold markers within cells before regex matching — some
  // milestones (e.g. v611 edges 105-110 highlighted with #10265 hold-test markers)
  // wrap entire rows in bold via **id** | **pack-XX-NNN** | ... format.
  // We keep the cell separators intact but remove ** anywhere in the line.
  const stripped = text.replace(/\*\*/g, '');
  // Reset regex state per-call (lastIndex)
  EDGE_ROW_RE.lastIndex = 0;
  let m;
  while ((m = EDGE_ROW_RE.exec(stripped)) !== null) {
    const [, id, source, target, relation, description] = m;
    // Filter out non-edge rows (separator rows like "| --- | --- |", header rows,
    // or rows where the "id" column contains a non-numeric pack reference).
    if (!/^\d+$/.test(id)) continue;
    const idNum = parseInt(id, 10);
    if (idNum < 1 || idNum > 999) continue;
    edges.push({
      id: idNum,
      source: source.trim(),
      target: target.trim(),
      relation: relation.trim(),
      description: description.trim().replace(/\s+/g, ' '),
    });
  }
  return edges;
}

const milestonesData = [];
const edgesById = {};
const edgesByPackPair = {};
let totalEdges = 0;
const errors = [];

for (const loc of TRS_RESEARCH_LOCATIONS) {
  const existing = loc.paths.find(p => existsSync(resolve(REPO_ROOT, p)));
  if (!existing) {
    errors.push(`[skip] ${loc.milestone}: no research file at any of [${loc.paths.join(', ')}]`);
    continue;
  }
  const fullPath = resolve(REPO_ROOT, existing);
  const text = readFileSync(fullPath, 'utf8');
  const fm = readFrontmatter(text);
  const edges = extractEdges(text);

  const milestoneEntry = {
    milestone: loc.milestone,
    pack_bound: fm.this_pack ?? fm.pack ?? null,
    predecessor_pack: fm.predecessor_pack ?? null,
    edge_baseline: fm.edge_baseline ? parseInt(fm.edge_baseline, 10) : null,
    edges_added: fm.edges_added_this_pass ? parseInt(fm.edges_added_this_pass, 10) : null,
    edge_total_after: fm.edge_total_after_pass ? parseInt(fm.edge_total_after_pass, 10) : null,
    research_file: existing,
    edges_extracted: edges.length,
    edges: edges.map(e => ({ ...e, milestone_bound: loc.milestone, pack_bound: fm.this_pack ?? null })),
  };
  milestonesData.push(milestoneEntry);

  for (const edge of milestoneEntry.edges) {
    if (edgesById[edge.id]) {
      // Duplicate id across milestones — keep first-bound (earlier milestone)
      continue;
    }
    edgesById[edge.id] = edge;
    const key = packPairKey(edge.source, edge.target);
    (edgesByPackPair[key] ??= []).push(edge);
    totalEdges += 1;
  }
}

const output = {
  schema: 'trs-edges/v1',
  generated_at: new Date().toISOString(),
  total_edges: totalEdges,
  milestone_count: milestonesData.length,
  milestones: milestonesData,
  edges_by_id: edgesById,
  edges_by_pack_pair: edgesByPackPair,
  errors,
};

const outputJson = JSON.stringify(output, null, 2);

if (CHECK) {
  if (!existsSync(OUT_PATH)) {
    console.error(`[build-trs-edges] STALE: ${OUT_PATH} does not exist`);
    process.exit(1);
  }
  const existing = readFileSync(OUT_PATH, 'utf8');
  // Compare edge structure only (ignore generated_at timestamp)
  const existingParsed = JSON.parse(existing);
  if (existingParsed.total_edges !== totalEdges
      || existingParsed.milestone_count !== milestonesData.length) {
    console.error(`[build-trs-edges] STALE: existing has total_edges=${existingParsed.total_edges} milestone_count=${existingParsed.milestone_count}; scan finds total_edges=${totalEdges} milestone_count=${milestonesData.length}`);
    process.exit(1);
  }
  console.log(`[build-trs-edges] OK: existing edges.json matches scan (${totalEdges} edges across ${milestonesData.length} milestones)`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log(`[build-trs-edges] DRY-RUN: would write ${OUT_PATH}`);
  console.log(`[build-trs-edges] total_edges=${totalEdges}, milestones=${milestonesData.length}`);
  for (const m of milestonesData) {
    console.log(`  ${m.milestone}: pack_bound=${m.pack_bound} edges_extracted=${m.edges_extracted} (frontmatter says edges_added=${m.edges_added})`);
  }
  if (errors.length) {
    console.log(`[build-trs-edges] errors:\n  ${errors.join('\n  ')}`);
  }
  process.exit(0);
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, outputJson + '\n');

console.log(`[build-trs-edges] wrote ${OUT_PATH}`);
console.log(`[build-trs-edges] total_edges=${totalEdges}, milestones=${milestonesData.length}`);
for (const m of milestonesData) {
  console.log(`  ${m.milestone}: pack_bound=${m.pack_bound} edges_extracted=${m.edges_extracted}`);
}
if (errors.length) {
  console.log(`[build-trs-edges] notes:`);
  for (const e of errors) console.log(`  ${e}`);
}
