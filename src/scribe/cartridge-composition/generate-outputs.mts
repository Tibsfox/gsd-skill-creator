/**
 * Generation entrypoint — runs the foundational chipset composer + citation
 * merger and writes the three output artifacts to disk.
 *
 * Run via: `npx tsx src/scribe/cartridge-composition/generate-outputs.mts`
 *
 * Outputs:
 *   cartridges/foundational/scribe/manifest.json
 *   cartridges/foundational/scribe/composition-graph.json
 *   .planning/missions/v1-49-621-scribe/CITATIONS.json
 *
 * The README.md is hand-authored; this script does NOT regenerate it. The
 * unifiedIndex pointer added to T1's citations.json is also hand-authored
 * (one-line in-place edit) so the substrate-respect rule (do-not-modify-
 * member-cartridges) is honoured at both author and re-run time.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { composeFoundationalChipset } from './compose-chipset.js';
import { mergeCitations, TRACK_CITATIONS } from './merge-citations.js';
import { recordScribeSources } from './record-scribe-sources.js';
import { SourceLedger } from '../../source-ledger/source-ledger.js';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..', '..', '..');

const MISSION = 'scribe';
const MILESTONE = 'v1.49.621';
const VERSION = '1.49.621';
const NAMESPACE = 'https://tibsfox.com/Research/SCRIBE/ns#';

// Member-cartridge declarations extracted from `examples/cartridges/*/manifest.json`
// (T2 has no top-level manifest yet — Component 04 namespace-conformance
// will author one in v1.49.621; we declare it here at version 1.0.0 to match
// the convoy convention).
const MEMBERS = [
  { name: 'markup-lineage',           track: 'T1', version: '1.0.0', composesWith: [] },
  { name: 'svg-substrate',            track: 'T2', version: '1.0.0', composesWith: [] },
  { name: 'code-svg-hdl-bridge',      track: 'T3', version: '1.0.0', composesWith: ['svg-substrate', 'retrieval-provenance', 'markup-lineage'] },
  { name: 'dashboard-lod-rendering',  track: 'T4', version: '0.1.0', composesWith: ['svg-substrate', 'retrieval-provenance'] },
  { name: 'retrieval-provenance',     track: 'T5', version: '1.0.0', composesWith: [] },
] as const;

const SUMMARY = 'Foundational chipset composing the five SCRIBE track cartridges (T1 markup-lineage, T2 svg-substrate, T3 code-svg-hdl-bridge, T4 dashboard-lod-rendering, T5 retrieval-provenance) into one categorical-sum bundle. Thin shell — member cartridges remain authoritative for their content.';

function jsonStable(value: unknown): string {
  // Stable, deterministic JSON formatting for byte-identical idempotent re-runs.
  return JSON.stringify(value, null, 2) + '\n';
}

function writeOut(relPath: string, content: string): void {
  const abs = resolve(REPO_ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, { encoding: 'utf8' });
  // eslint-disable-next-line no-console
  console.log(`wrote ${relPath} (${content.length} bytes)`);
}

const { manifest, graph } = composeFoundationalChipset({
  chipsetName: 'scribe',
  mission: MISSION,
  milestone: MILESTONE,
  chipsetVersion: VERSION,
  members: MEMBERS,
  summary: SUMMARY,
  license: 'Apache-2.0',
  scribeNamespace: NAMESPACE,
});

const citations = mergeCitations({
  milestone: MILESTONE,
  perTrack: TRACK_CITATIONS,
});

writeOut('cartridges/foundational/scribe/manifest.json', jsonStable(manifest));
writeOut('cartridges/foundational/scribe/composition-graph.json', jsonStable(graph));
writeOut('.planning/missions/v1-49-621-scribe/CITATIONS.json', jsonStable(citations));

console.log(`unique sources: ${citations.totalUniqueSources}`);

// Forward every unified source onto the shared source-ledger spine so an
// arxiv/DOI scribe source is visible to the arxiv / citation entry points under
// one dedup key. Best-effort and observability-only — it never gates generation
// and writes to a separate file, so the three output artifacts stay byte-stable.
await recordScribeSources(citations, new SourceLedger());
console.log(`recorded ${citations.totalUniqueSources} scribe sources to source-ledger`);
