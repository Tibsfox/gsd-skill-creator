// Aggregate-mode ingestion driver.
//
// Same loop as tools/ingest-batch.mts, but:
//   1. Accumulates added primitives across calls into one big array.
//   2. Passes the accumulator as `existingPrimitives` on each subsequent
//      scLearn() call so dedup still works inside the batch.
//   3. After all papers have been processed, invokes the higher-order
//      generators (skill / agent / team) on the aggregated primitive set
//      grouped by domain, and writes any generated artifacts to disk.
//
// Background: sc:learn's generators have a 30-primitives-per-domain
// threshold; a single arxiv paper produces ~17. Running per-paper in a
// batch never aggregates enough primitives to fire. See
// .planning/missions/arxiv-may-funnel/HANDOFF.md "What to Do Next" #1.
//
// Usage:
//   npx tsx tools/ingest-aggregate.mts <run-dir> \
//     [--depth standard|shallow|deep] \
//     [--max N] \
//     [--seen-ids <path>] \
//     [--output-dir <path>] \
//     [--force]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { scLearn } from '../src/commands/sc-learn.js';
import type { PromptFn } from '../src/learn/hitl-gate.js';
import {
  loadSeenIds,
  recordSeen,
  saveSeenIds,
  isSeen,
} from '../src/scan-arxiv/dedup.js';
import {
  harvestAddedPrimitives,
  runAggregateGenerators,
  computeDomainCenter,
  groupByDomain,
} from '../src/scan-arxiv/aggregate-generators.js';
import type { MathematicalPrimitive, PlanePosition } from '../src/types/mfe-types.js';
import type { RunOutput } from '../src/scan-arxiv/types.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

const runDir = process.argv[2];
const depthArg = arg('--depth', 'standard') as 'shallow' | 'standard' | 'deep';
const maxArg = parseInt(arg('--max') ?? '0', 10);
const seenIdsPath = arg(
  '--seen-ids',
  path.join('.planning', 'arxiv-cache', 'aggregate-seen-ids.json'),
)!;
const outputDir = arg(
  '--output-dir',
  path.join('.planning', 'arxiv-cache', 'aggregate-artifacts'),
)!;
const force = hasFlag('--force');

if (!runDir) {
  console.error('usage: tsx tools/ingest-aggregate.mts <run-dir> [--depth ...] [--max N] [--seen-ids <path>] [--output-dir <path>] [--force]');
  process.exit(2);
}

const queuePath = path.join(runDir, 'queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8')) as RunOutput;

const all = queue.queue;
const work = maxArg > 0 ? all.slice(0, maxArg) : all;
console.log(`[ingest-aggregate] queue size: ${all.length}, processing: ${work.length}, depth: ${depthArg}`);
console.log(`[ingest-aggregate] seen-ids: ${seenIdsPath}${force ? ' (bypassed via --force)' : ''}`);
console.log(`[ingest-aggregate] output-dir: ${outputDir}`);

const autoApprove: PromptFn = async () => 'approved-with-warnings';

let seenState = loadSeenIds(seenIdsPath);
let success = 0;
let failure = 0;
let skipped = 0;
const startedAt = Date.now();
const failedIds: Array<{ id: string; err: string }> = [];

// Cross-batch primitive accumulator.
const accumulator: MathematicalPrimitive[] = [];

for (let i = 0; i < work.length; i++) {
  const entry = work[i];
  const pos = `[${i + 1}/${work.length}]`;

  if (!force && isSeen(seenState, entry.paper.arxivId)) {
    skipped++;
    console.log(`${pos} SKIP (already seen): ${entry.paper.arxivId}`);
    continue;
  }

  // Derive domain centers of accumulated groups, so per-call agent
  // generation has stable cross-domain reference.
  const accumulatedCenters: PlanePosition[] = [];
  for (const [, group] of groupByDomain(accumulator)) {
    const c = computeDomainCenter(group);
    if (c) accumulatedCenters.push(c);
  }

  try {
    const t0 = Date.now();
    const result = await scLearn(entry.paper.pdfUrl, {
      domain: 'arxiv-cs',
      depth: depthArg,
      dryRun: false,
      promptFn: autoApprove,
      existingPrimitives: accumulator,
      existingDomainCenters: accumulatedCenters,
    });
    const dt = Date.now() - t0;

    if (result.success) {
      const added = harvestAddedPrimitives(result.changeset);
      accumulator.push(...added);
      seenState = recordSeen(seenState, entry.paper.arxivId, result.sessionId);
      saveSeenIds(seenState, seenIdsPath);
      success++;
      console.log(
        `${pos} OK   ${entry.paper.arxivId}  prims=${added.length}  acc=${accumulator.length}  ${dt}ms  ${entry.paper.title.slice(0, 60)}`,
      );
    } else {
      failure++;
      failedIds.push({ id: entry.paper.arxivId, err: result.errors.join('; ').slice(0, 200) });
      console.log(`${pos} FAIL ${entry.paper.arxivId}  ${result.errors.join('; ').slice(0, 100)}`);
    }
  } catch (err) {
    failure++;
    const msg = err instanceof Error ? err.message : String(err);
    failedIds.push({ id: entry.paper.arxivId, err: msg.slice(0, 200) });
    console.log(`${pos} ERR  ${entry.paper.arxivId}  ${msg.slice(0, 100)}`);
  }
}

const elapsed = Date.now() - startedAt;
console.log('');
console.log(`[ingest-aggregate] done in ${(elapsed / 1000).toFixed(1)}s`);
console.log(`[ingest-aggregate] success: ${success}`);
console.log(`[ingest-aggregate] skipped: ${skipped}`);
console.log(`[ingest-aggregate] failed:  ${failure}`);
console.log(`[ingest-aggregate] accumulated primitives: ${accumulator.length}`);

if (accumulator.length === 0) {
  console.log('');
  console.log('[ingest-aggregate] No primitives accumulated; nothing to generate. Did all papers get skipped?');
  process.exit(failure > 0 ? 1 : 0);
}

console.log('');
console.log('[ingest-aggregate] Running aggregate generators...');
fs.mkdirSync(outputDir, { recursive: true });

// Persist the raw primitive accumulator alongside generated artifacts so
// downstream enrichment tools (composition derivation, plane refinement)
// can operate without re-running scLearn over the entire batch.
const primitivesPath = path.join(outputDir, 'primitives.json');
fs.writeFileSync(primitivesPath, JSON.stringify(accumulator, null, 2), 'utf-8');
console.log(`[ingest-aggregate] persisted primitives: ${primitivesPath}`);

const report = runAggregateGenerators({ primitives: accumulator, outputDir });

console.log('');
console.log('[ingest-aggregate] Aggregate generator report:');
console.log(`  total primitives:   ${report.totalPrimitives}`);
console.log(`  domains scanned:    ${report.domains.length}`);
let firedSkills = 0, firedAgents = 0, firedTeams = 0;
for (const d of report.domains) {
  if (d.skill.generated) firedSkills++;
  if (d.agent.generated) firedAgents++;
  if (d.team.generated) firedTeams++;
  console.log(
    `  ${d.name.padEnd(20)} prims=${String(d.primitiveCount).padStart(5)} ` +
    `skill=${d.skill.generated ? 'YES' : 'no '} ` +
    `agent=${d.agent.generated ? 'YES' : 'no '} ` +
    `team=${d.team.generated ? 'YES' : 'no '}`,
  );
}
console.log('');
console.log(`[ingest-aggregate] generators fired:  skills=${firedSkills}  agents=${firedAgents}  teams=${firedTeams}`);

const reportPath = path.join(outputDir, 'report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`[ingest-aggregate] full JSON report:  ${reportPath}`);

if (failedIds.length > 0) {
  console.log('');
  console.log('[ingest-aggregate] failures:');
  for (const f of failedIds.slice(0, 20)) {
    console.log(`  ${f.id}: ${f.err}`);
  }
  if (failedIds.length > 20) {
    console.log(`  ... and ${failedIds.length - 20} more`);
  }
}

process.exit(failure > 0 ? 1 : 0);
