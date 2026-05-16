// Drive sc:learn for ONE queued arxiv paper.
//
// Usage:
//   npx tsx tools/ingest-one.mts <run-dir> <arxiv-id> [--depth standard]
//
// Reads the run's queue.json, finds the entry for <arxiv-id>, invokes
// scLearn(pdfUrl) with an auto-approving promptFn (the human caller has
// already approved at the queue layer). The promptFn prints the
// sanitizer findings so they remain visible. On success, marks the
// paper in seen-ids.json.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { scLearn } from '../src/commands/sc-learn.js';
import type { PromptFn } from '../src/learn/hitl-gate.js';
import {
  loadSeenIds,
  recordSeen,
  saveSeenIds,
  DEFAULT_SEEN_IDS_PATH,
} from '../src/scan-arxiv/dedup.js';
import type { RunOutput } from '../src/scan-arxiv/types.js';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const runDir = process.argv[2];
const arxivId = process.argv[3];
const depthArg = arg('--depth', 'standard') as 'shallow' | 'standard' | 'deep';

if (!runDir || !arxivId) {
  console.error('usage: tsx tools/ingest-one.mts <run-dir> <arxiv-id> [--depth shallow|standard|deep]');
  process.exit(2);
}

const queuePath = path.join(runDir, 'queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf-8')) as RunOutput;
const entry = queue.queue.find((q) => q.paper.arxivId === arxivId);
if (!entry) {
  console.error(`arxiv id ${arxivId} not found in ${queuePath}`);
  process.exit(2);
}

console.log(`[ingest-one] paper: ${entry.paper.arxivId}`);
console.log(`[ingest-one] title: ${entry.paper.title}`);
console.log(`[ingest-one] url:   ${entry.paper.pdfUrl}`);
console.log(`[ingest-one] depth: ${depthArg}`);
console.log(`[ingest-one] --- starting sc:learn pipeline ---\n`);

// Auto-approver that prints the findings so they remain visible upstream.
const autoApprove: PromptFn = async (message, choices) => {
  console.log('[ingest-one] --- sc:learn HITL gate findings ---');
  console.log(message);
  console.log(`[ingest-one] --- auto-approving (queue-layer review already done; choices were: ${choices.join('|')}) ---`);
  // 'approved-with-warnings' is the safer default — it proceeds but flags
  // any sanitizer findings in the merge log for later inspection.
  return 'approved-with-warnings';
};

const startedAt = Date.now();
const result = await scLearn(entry.paper.pdfUrl, {
  domain: 'arxiv-cs',
  depth: depthArg,
  dryRun: false,
  promptFn: autoApprove,
  onProgress: (stage, detail) => {
    process.stdout.write(`[ingest-one] [${stage}] ${detail}\n`);
  },
});
const elapsedMs = Date.now() - startedAt;

console.log(`\n[ingest-one] --- pipeline done in ${elapsedMs}ms ---`);
console.log(`[ingest-one] success:           ${result.success}`);
console.log(`[ingest-one] sessionId:         ${result.sessionId}`);
console.log(`[ingest-one] primitives added:  ${result.report.primitivesAdded}`);
console.log(`[ingest-one] primitives updated:${result.report.primitivesUpdated}`);
console.log(`[ingest-one] primitives skipped:${result.report.primitivesSkipped}`);
console.log(`[ingest-one] conflicts:         ${result.report.conflictsPresented}`);
console.log(`[ingest-one] skills generated:  ${result.report.skillCount}`);
console.log(`[ingest-one] agents generated:  ${result.report.agentCount}`);
console.log(`[ingest-one] teams generated:   ${result.report.teamCount}`);
if (result.errors.length > 0) {
  console.log(`[ingest-one] errors: ${result.errors.length}`);
  result.errors.forEach((e, i) => console.log(`  [${i}] ${e}`));
}

if (result.success) {
  const seen = loadSeenIds(DEFAULT_SEEN_IDS_PATH);
  const updated = recordSeen(seen, entry.paper.arxivId, result.sessionId);
  saveSeenIds(updated, DEFAULT_SEEN_IDS_PATH);
  console.log(`[ingest-one] seen-ids.json updated`);
  process.exit(0);
} else {
  console.error(`[ingest-one] FAILED — not marking as seen`);
  process.exit(1);
}
