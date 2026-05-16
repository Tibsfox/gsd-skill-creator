// Enrich an aggregated primitive set with derived composition rules
// and refined plane positions, then re-run the higher-order generators.
//
// Why: the regex extractor produces primitives with empty compositionRules
// and a single per-document planePosition. With all 5,602 May primitives
// in one quadrant, the team generator can't fire (it requires >=2
// quadrants + 20 cross-quadrant rules). This tool projects each
// primitive into the Complex Plane via embedding contrasts and derives
// pairwise composition rules so generators see real structure.
//
// Usage:
//   npx tsx tools/enrich-primitives.mts <input-primitives.json> \
//     [--output-dir <path>] \
//     [--similarity 0.7] \
//     [--max-rules 8]

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MathematicalPrimitive } from '../src/types/mfe-types.js';
import {
  deriveCompositions,
  refinePlanePositions,
  embedPrimitives,
} from '../src/scan-arxiv/primitive-enrichment.js';
import { getEmbeddingService } from '../src/embeddings/embedding-service.js';
import { runAggregateGenerators } from '../src/scan-arxiv/aggregate-generators.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const inputPath = process.argv[2];
const outputDir = arg('--output-dir', path.join('.planning', 'arxiv-cache', 'enriched-artifacts'))!;
const similarity = parseFloat(arg('--similarity', '0.7')!);
const maxRules = parseInt(arg('--max-rules', '8')!, 10);

if (!inputPath) {
  console.error('usage: tsx tools/enrich-primitives.mts <primitives.json> [--output-dir <path>] [--similarity 0.7] [--max-rules 8]');
  process.exit(2);
}

console.log(`[enrich] reading: ${inputPath}`);
const primitives = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as MathematicalPrimitive[];
console.log(`[enrich] loaded ${primitives.length} primitives`);
console.log(`[enrich] similarity threshold=${similarity}  max rules/prim=${maxRules}`);
console.log(`[enrich] output-dir: ${outputDir}`);

const t0 = Date.now();
console.log('[enrich] initializing embedder...');
const service = await getEmbeddingService();
const embedder = async (text: string) => {
  const r = await service.embed(text);
  return r.embedding as number[];
};

console.log('[enrich] embedding primitives...');
const tEmb0 = Date.now();
const primEmbeddings = await embedPrimitives(primitives, embedder);
console.log(`[enrich] embedded ${primEmbeddings.length} primitives in ${((Date.now() - tEmb0) / 1000).toFixed(1)}s`);

console.log('[enrich] refining plane positions...');
const tPlane0 = Date.now();
const planeRefined = await refinePlanePositions(primitives, {
  embedder,
  primitiveEmbeddings: primEmbeddings,
});
console.log(`[enrich] plane refinement done in ${((Date.now() - tPlane0) / 1000).toFixed(1)}s`);

// Quadrant distribution after refinement.
function quadrantOf(p: MathematicalPrimitive): string {
  const { real, imaginary } = p.planePosition;
  if (real >= 0 && imaginary >= 0) return 'Q1';
  if (real < 0 && imaginary >= 0) return 'Q2';
  if (real < 0 && imaginary < 0) return 'Q3';
  return 'Q4';
}
const quadCount: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
for (const p of planeRefined) quadCount[quadrantOf(p)]++;
console.log(`[enrich] quadrant distribution after refinement: Q1=${quadCount.Q1} Q2=${quadCount.Q2} Q3=${quadCount.Q3} Q4=${quadCount.Q4}`);

console.log(`[enrich] deriving compositions (threshold=${similarity}, max=${maxRules})...`);
const tComp0 = Date.now();
const enriched = await deriveCompositions(planeRefined, {
  embedder,
  primitiveEmbeddings: primEmbeddings,
  similarityThreshold: similarity,
  maxRulesPerPrimitive: maxRules,
});
console.log(`[enrich] composition derivation done in ${((Date.now() - tComp0) / 1000).toFixed(1)}s`);

let totalRules = 0;
let primsWithRules = 0;
let crossQuadrantRules = 0;
const seqByPair = new Map<string, number>();
for (const p of enriched) {
  if (p.compositionRules.length > 0) primsWithRules++;
  totalRules += p.compositionRules.length;
  const pQ = quadrantOf(p);
  for (const r of p.compositionRules) {
    const peer = enriched.find(e => e.id === r.with);
    if (peer && quadrantOf(peer) !== pQ) crossQuadrantRules++;
    const k = r.type;
    seqByPair.set(k, (seqByPair.get(k) ?? 0) + 1);
  }
}
console.log(`[enrich] composition rules: ${totalRules} total across ${primsWithRules} primitives`);
console.log(`[enrich] cross-quadrant rules: ${crossQuadrantRules}`);
console.log(`[enrich] by type: ${JSON.stringify(Object.fromEntries(seqByPair))}`);

fs.mkdirSync(outputDir, { recursive: true });
const enrichedPath = path.join(outputDir, 'primitives-enriched.json');
fs.writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`[enrich] wrote: ${enrichedPath}`);

console.log('');
console.log('[enrich] Re-running aggregate generators on enriched set...');
const report = runAggregateGenerators({ primitives: enriched, outputDir });

console.log('');
console.log('[enrich] Aggregate generator report (post-enrichment):');
console.log(`  total primitives:   ${report.totalPrimitives}`);
console.log(`  domains scanned:    ${report.domains.length}`);
for (const d of report.domains) {
  console.log(
    `  ${d.name.padEnd(20)} prims=${String(d.primitiveCount).padStart(5)} ` +
    `skill=${d.skill.generated ? 'YES' : 'no '} ` +
    `agent=${d.agent.generated ? 'YES' : 'no '} ` +
    `team=${d.team.generated ? 'YES' : 'no '}` +
    (d.team.generated ? '' : `   (team-reason: ${d.team.reason})`),
  );
}

const reportPath = path.join(outputDir, 'enriched-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log('');
console.log(`[enrich] full JSON report: ${reportPath}`);
console.log(`[enrich] total wall time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
