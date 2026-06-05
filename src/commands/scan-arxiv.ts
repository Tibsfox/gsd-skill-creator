#!/usr/bin/env node
// === scan-arxiv CLI Command ===
//
// User-facing entrypoint that composes the arxiv-may-funnel pipeline:
//   fetch → rank → bridge → artifacts (queue.json, report.md, run-ingestion.sh)
//
// Entrypoint-guard pattern applied: main() is NOT called at import time.
// See bug fix at 1d38b12d8 for why this matters.

import { parseArgv, resolveOptions, formatHelpText } from '../scan-arxiv/options.js';
import { createFetcher } from '../scan-arxiv/fetcher.js';
import { createRanker } from '../scan-arxiv/ranker.js';
import { isCliEntrypoint } from '../cli/entrypoint-guard.js';
import {
  NULL_EGRESS_AUDIT_SINK,
  type EgressContext,
} from '../security/egress-context.js';

/**
 * Egress allow-list for the arxiv fetch. The fetcher only ever reaches the
 * arxiv export API host; restricting egress to arxiv.org/export.arxiv.org
 * matches the install-remote chokepoint standard (skill-installer threads its
 * own EgressContext) and denies any redirected/hijacked host before bytes leave.
 */
const ARXIV_EGRESS_CTX: EgressContext = {
  allowList: [/^https?:\/\/export\.arxiv\.org\//, /^https?:\/\/arxiv\.org\//],
  audit: NULL_EGRESS_AUDIT_SINK,
};

// Wave 2A delivers bridge.ts in parallel with this file.
// If bridge.ts does not exist yet (parallel wave not landed), the import below
// will fail at runtime. The CLI tests mock buildBridge via vi.mock to avoid this.
import { buildBridge } from '../scan-arxiv/bridge.js';

/**
 * Main entry point.
 * Returns an exit code: 0 = success, 1 = error, 2 = bad flags.
 */
export async function main(
  argv: string[],
  // Dependency-injection seam for tests: override buildBridge.
  _buildBridge: typeof buildBridge = buildBridge,
): Promise<number> {
  const { options, unknownFlags, helpRequested, errors } = parseArgv(argv);

  if (helpRequested) {
    console.log(formatHelpText());
    return 0;
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`[scan-arxiv] error: ${err}`);
    }
    return 2;
  }

  if (unknownFlags.length > 0) {
    console.error(`[scan-arxiv] unknown flags: ${unknownFlags.join(', ')}`);
    return 2;
  }

  const resolved = resolveOptions(options);
  const start = Date.now();

  console.log(
    `[scan-arxiv] fetching ${resolved.month} ` +
    `categories=${resolved.categories.join(',')}`,
  );

  const fetcher = createFetcher({ noCache: resolved.noCache, ctx: ARXIV_EGRESS_CTX });
  const papers = await fetcher.fetchMonth(resolved.month, resolved.categories);
  console.log(`[scan-arxiv] fetched ${papers.length} papers`);

  if (resolved.dryRun) {
    // Pre-rank only — no LLM cost — produce a simple histogram and stop.
    console.log(`[scan-arxiv] dry-run: skipping LLM rank. Total papers by category:`);
    const byCategory: Record<string, number> = {};
    for (const paper of papers) {
      for (const cat of paper.categories) {
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      }
    }
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${count}`);
    }
    return 0;
  }

  const ranker = createRanker({
    judgeBackend: resolved.judgeBackend,
    cliMaxBudgetUsd: resolved.cliMaxBudgetUsd,
    preRankTop: resolved.preRankTop,
    preRankThreshold: resolved.preRankThreshold,
  });
  const scoreMap = await ranker.rankBatch(papers);

  const ranked = papers
    .map(p => ({ paper: p, relevance: scoreMap.get(p.arxivId)! }))
    .filter(r => r.relevance != null);

  console.log(`[scan-arxiv] ranked ${ranked.length} papers`);

  const bridge = await _buildBridge({
    ranked,
    options: resolved,
    runtimeMs: Date.now() - start,
    fetchedCount: papers.length,
    bridgeOpts: { outputDir: resolved.outputDir },
  });

  console.log(`[scan-arxiv] queue:  ${bridge.queueJsonPath}`);
  console.log(`[scan-arxiv] report: ${bridge.reportMdPath}`);
  console.log(`[scan-arxiv] run:    bash ${bridge.shellScriptPath}`);

  return 0;
}

// Entrypoint guard — do NOT call main at module load time.
if (isCliEntrypoint(import.meta.url)) {
  main(process.argv.slice(2)).then(code => process.exit(code));
}
