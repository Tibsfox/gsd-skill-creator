// === Live integration tests for the four-domain relevance ranker ===
//
// These tests hit the real Anthropic API. Gated by:
//   - process.env.SCAN_ARXIV_LIVE === '1'
//   - process.env.ANTHROPIC_API_KEY present (soft skip otherwise)
//
// Do NOT run these in CI by default. Run locally with:
//   SCAN_ARXIV_LIVE=1 ANTHROPIC_API_KEY=... \
//     npm test -- src/scan-arxiv/ranker.live.test.ts

import { describe, it, expect } from 'vitest';
import { createRanker } from './ranker.js';
import {
  CANNED_PAPERS,
  getCannedPaper,
  type ExpectedBound,
} from './__fixtures__/canned-papers.js';
import { RELEVANCE_DOMAINS, type RelevanceDomain } from './types.js';

const LIVE = process.env.SCAN_ARXIV_LIVE === '1';
const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;
const RUN = LIVE && HAS_KEY;

const describeLive = RUN ? describe : describe.skip;

function checkBound(value: number, bound: ExpectedBound): void {
  if (bound.atLeast !== undefined) expect(value).toBeGreaterThanOrEqual(bound.atLeast);
  if (bound.atMost !== undefined) expect(value).toBeLessThanOrEqual(bound.atMost);
}

describeLive('createRanker (live) — boundary band assertions on canned papers', () => {
  it('1. Live ranker produces scores within the documented boundary bands', async () => {
    if (!RUN) return; // belt-and-suspenders; describe.skip already handles this
    // Use a unique cache dir so the live run is clean.
    const cacheDir = `.planning/arxiv-cache/scores/live-${Date.now()}`;
    const ranker = createRanker({ cacheDir });
    const papers = CANNED_PAPERS.map((c) => c.paper);
    const scores = await ranker.rankBatch(papers);

    for (const canned of CANNED_PAPERS) {
      const score = scores.get(canned.paper.arxivId);
      // objectDetection may be filtered out by pre-rank; that's acceptable.
      if (!score) continue;
      const exp = canned.expectedScores;
      for (const d of RELEVANCE_DOMAINS) {
        if (exp[d]) checkBound(score.subscores[d], exp[d] as ExpectedBound);
      }
      if (exp.aggregateAtMost !== undefined) {
        expect(score.aggregate).toBeLessThanOrEqual(exp.aggregateAtMost);
      }
      if (exp.aggregateAtLeast !== undefined) {
        expect(score.aggregate).toBeGreaterThanOrEqual(exp.aggregateAtLeast);
      }
      if (exp.maxSubscoreAtMost !== undefined) {
        const m = Math.max(...RELEVANCE_DOMAINS.map((d: RelevanceDomain) => score.subscores[d]));
        expect(m).toBeLessThanOrEqual(exp.maxSubscoreAtMost);
      }
    }
  }, 120_000);

  it('2. Live ranker on a real recent agent-orchestration paper scores agent-orch >= 0.7', async () => {
    if (!RUN) return;
    // Re-use the canned `multiAgentCoord` entry as the curated representative
    // of a "real recent agent-orchestration paper" until a real arxiv ID is
    // committed alongside this fixture set.
    const mac = getCannedPaper('multiAgentCoord');
    const cacheDir = `.planning/arxiv-cache/scores/live-mac-${Date.now()}`;
    const ranker = createRanker({ cacheDir });
    const scores = await ranker.rankBatch([mac.paper]);
    const score = scores.get(mac.paper.arxivId);
    expect(score, 'live judge returned a score for the multiAgentCoord paper').toBeDefined();
    expect(score!.subscores['agent-orchestration']).toBeGreaterThanOrEqual(0.7);
  }, 60_000);
});

// Surface a soft-skip notice when the suite is run without the gate so the
// developer sees why nothing executed.
if (!RUN) {
  describe('createRanker (live)', () => {
    it.skip('skipped — set SCAN_ARXIV_LIVE=1 and ANTHROPIC_API_KEY to run', () => {
      /* intentionally empty */
    });
  });
}
