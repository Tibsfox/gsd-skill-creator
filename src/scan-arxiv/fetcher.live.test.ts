/**
 * fetcher.live.test.ts — 3 integration tests requiring real arxiv network access.
 * Gated by SCAN_ARXIV_LIVE=1 environment variable.
 *
 * Usage:  SCAN_ARXIV_LIVE=1 npm test -- src/scan-arxiv/fetcher.live.test.ts
 */

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFetcher } from './fetcher.js';

const LIVE = process.env.SCAN_ARXIV_LIVE === '1';

const LIVE_CACHE_DIR = join(
  new URL('.', import.meta.url).pathname,
  '__fixtures__/__live-cache__',
);

describe.skipIf(!LIVE)('fetcher — live arxiv', () => {
  // ---------------------------------------------------------------------------
  // Live test 1: month=2026-05, categories=['cs.AI'] returns >= 100 papers
  // ---------------------------------------------------------------------------
  it('live 1: month=2026-05 cs.AI returns >= 100 papers', async () => {
    const fetcher = createFetcher({
      cacheDir: LIVE_CACHE_DIR,
      maxResultsPerRequest: 1000,
    });

    const papers = await fetcher.fetchMonth('2026-05', ['cs.AI']);

    expect(Array.isArray(papers)).toBe(true);
    expect(papers.length).toBeGreaterThanOrEqual(100);

    // Verify all papers are in May 2026
    for (const paper of papers) {
      const pub = new Date(paper.publishedAt);
      expect(pub.getUTCFullYear()).toBe(2026);
      expect(pub.getUTCMonth()).toBe(4); // 0-indexed May
    }

    // Verify sorted ASC
    for (let i = 1; i < papers.length; i++) {
      expect(papers[i].publishedAt >= papers[i - 1].publishedAt).toBe(true);
    }
  }, 120_000); // Allow 2 minutes for network + pagination

  // ---------------------------------------------------------------------------
  // Live test 2: Paginated (maxResultsPerRequest=50) == unpaginated, deduplicated
  // ---------------------------------------------------------------------------
  it('live 2: paginated fetch returns same set as large single fetch', async () => {
    const noCache = true;

    const paginatedFetcher = createFetcher({
      noCache,
      maxResultsPerRequest: 50,
    });

    const unpaginatedFetcher = createFetcher({
      noCache,
      maxResultsPerRequest: 1000,
    });

    const [paginated, unpaginated] = await Promise.all([
      paginatedFetcher.fetchMonth('2026-05', ['cs.AI']),
      unpaginatedFetcher.fetchMonth('2026-05', ['cs.AI']),
    ]);

    const paginatedIds = new Set(paginated.map((p) => p.arxivId.replace(/v\d+$/, '')));
    const unpaginatedIds = new Set(unpaginated.map((p) => p.arxivId.replace(/v\d+$/, '')));

    // All unpaginated IDs should appear in paginated (within some tolerance for
    // papers submitted at exact page boundaries)
    let overlap = 0;
    for (const id of unpaginatedIds) {
      if (paginatedIds.has(id)) overlap++;
    }
    const overlapRatio = overlap / unpaginatedIds.size;
    // Expect at least 95% overlap (small drift due to new submissions during test)
    expect(overlapRatio).toBeGreaterThanOrEqual(0.95);
  }, 300_000); // Allow 5 minutes for two paginated fetches

  // ---------------------------------------------------------------------------
  // Live test 3: Second invocation hits cache (≤ 200ms)
  // ---------------------------------------------------------------------------
  it('live 3: second invocation hits cache and completes in <= 200ms', async () => {
    // Clean up any existing cache for this specific call
    try {
      rmSync(LIVE_CACHE_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }

    const fetcher = createFetcher({
      cacheDir: LIVE_CACHE_DIR,
      maxResultsPerRequest: 1000,
    });

    // Warm-up call — populates cache and pays the JIT/disk-warmup cost so the
    // measured second call below is purely the cache-hit path.
    await fetcher.fetchMonth('2026-05', ['cs.AI']);

    // Second call — should be served from cache
    const start = Date.now();
    await fetcher.fetchMonth('2026-05', ['cs.AI']);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThanOrEqual(200);
  }, 120_000);
});
