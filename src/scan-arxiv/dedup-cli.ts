#!/usr/bin/env node
// === dedup-cli.ts ===
//
// Tiny CLI invoked by the generated run-ingestion.sh to mark a paper as seen
// after a successful sc:learn ingest.
//
// Usage:
//   npx tsx src/scan-arxiv/dedup-cli.ts mark-seen <arxivId> <reportPath>
//
// The shell script calls this after `npx tsx src/commands/sc-learn.ts` succeeds,
// so dedup state is only updated on confirmed successful ingests.

import { loadSeenIds, recordSeen, saveSeenIds } from './dedup.js';

const [, , command, arxivId, reportPath] = process.argv;

if (command !== 'mark-seen' || !arxivId || !reportPath) {
  process.stderr.write(
    'usage: dedup-cli.ts mark-seen <arxivId> <reportPath>\n',
  );
  process.exit(1);
}

const state = loadSeenIds();
const updated = recordSeen(state, arxivId, reportPath);
saveSeenIds(updated);
process.stdout.write(`[dedup] marked seen: ${arxivId}\n`);
