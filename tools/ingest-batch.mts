// Batch ingest every paper in a scan-arxiv queue.json through sc:learn.
//
// Usage:
//   npx tsx tools/ingest-batch.mts <run-dir> [--depth standard|shallow|deep] [--max N]
//
// Iterates the queue, calls scLearn(pdfUrl) per entry with an
// auto-approving promptFn so the sc:learn HITL gate doesn't block in
// non-TTY contexts (queue-layer review preceded this batch). Updates
// seen-ids.json after each success so a crash mid-batch resumes cleanly
// — already-seen papers are skipped on re-run.
//
// One-paper failures (HTTP timeout, PDF extraction issue, etc.) are
// logged and skipped; the batch continues.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { scLearn } from '../src/commands/sc-learn.js';
import type { PromptFn } from '../src/learn/hitl-gate.js';
import {
  loadSeenIds,
  recordSeen,
  saveSeenIds,
  isSeen,
  DEFAULT_SEEN_IDS_PATH,
} from '../src/scan-arxiv/dedup.js';
import type { RunOutput } from '../src/scan-arxiv/types.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const runDir = process.argv[2];
const depthArg = arg('--depth', 'standard') as 'shallow' | 'standard' | 'deep';
const maxArg = parseInt(arg('--max') ?? '0', 10);

if (!runDir) {
  console.error('usage: tsx tools/ingest-batch.mts <run-dir> [--depth shallow|standard|deep] [--max N]');
  process.exit(2);
}

const queuePath = path.join(runDir, 'queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8')) as RunOutput;

const all = queue.queue;
const work = maxArg > 0 ? all.slice(0, maxArg) : all;
console.log(`[ingest-batch] queue size: ${all.length}, processing: ${work.length}, depth: ${depthArg}`);

const autoApprove: PromptFn = async () => 'approved-with-warnings';

let seenState = loadSeenIds(DEFAULT_SEEN_IDS_PATH);
let success = 0;
let failure = 0;
let skipped = 0;
let primitivesTotal = 0;
const startedAt = Date.now();
const failedIds: Array<{ id: string; err: string }> = [];

for (let i = 0; i < work.length; i++) {
  const entry = work[i];
  const pos = `[${i + 1}/${work.length}]`;

  if (isSeen(seenState, entry.paper.arxivId)) {
    skipped++;
    console.log(`${pos} SKIP (already seen): ${entry.paper.arxivId}`);
    continue;
  }

  try {
    const t0 = Date.now();
    const result = await scLearn(entry.paper.pdfUrl, {
      domain: 'arxiv-cs',
      depth: depthArg,
      dryRun: false,
      promptFn: autoApprove,
    });
    const dt = Date.now() - t0;

    if (result.success) {
      seenState = recordSeen(seenState, entry.paper.arxivId, result.sessionId);
      saveSeenIds(seenState, DEFAULT_SEEN_IDS_PATH);
      primitivesTotal += result.report.primitivesAdded;
      success++;
      console.log(
        `${pos} OK   ${entry.paper.arxivId}  prims=${result.report.primitivesAdded}  ${dt}ms  ${entry.paper.title.slice(0, 70)}`,
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
console.log(`[ingest-batch] done in ${(elapsed / 1000).toFixed(1)}s`);
console.log(`[ingest-batch] success: ${success}`);
console.log(`[ingest-batch] skipped: ${skipped}`);
console.log(`[ingest-batch] failed:  ${failure}`);
console.log(`[ingest-batch] primitives added: ${primitivesTotal}`);
if (failedIds.length > 0) {
  console.log('');
  console.log('[ingest-batch] failures:');
  for (const f of failedIds.slice(0, 20)) {
    console.log(`  ${f.id}: ${f.err}`);
  }
  if (failedIds.length > 20) {
    console.log(`  ... and ${failedIds.length - 20} more`);
  }
}
process.exit(failure > 0 ? 1 : 0);
