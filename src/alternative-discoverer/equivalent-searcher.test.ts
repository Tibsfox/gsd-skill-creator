import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchEquivalents, EquivalentSearcher } from './equivalent-searcher.js';
import type { DependencyRecord } from '../dependency-auditor/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDep(name: string, ecosystem: DependencyRecord['ecosystem'] = 'npm'): DependencyRecord {
  return { name, version: '1.0.0', ecosystem, sourceManifest: '/package.json' };
}

function makeNpmSearchResult(name: string, score: number = 0.5, keywords: string[] = []) {
  return {
    package: {
      name,
      description: `Package ${name}`,
      keywords,
    },
    score: {
      final: score,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('searchEquivalents', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns [] for non-npm ecosystems without calling fetch', async () => {
    const dep = makeDep('some-crate', 'cargo');
    const meta = { _meta: { keywords: ['logging'] } };
    const results = await searchEquivalents(dep, meta);
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns [] for pypi without calling fetch', async () => {
    const results = await searchEquivalents(makeDep('requests', 'pypi'), {});
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('searches npm registry for npm dep with keywords', async () => {
    const dep = makeDep('old-logger');
    const meta = { _meta: { keywords: ['logging', 'debug'] } };
    const searchResult = { objects: [makeNpmSearchResult('new-logger', 0.7)] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results).toHaveLength(1);
    expect(results[0].alternativeName).toBe('new-logger');
    expect(results[0].relationship).toBe('equivalent');
    expect(results[0].apiCompatibility).toBe('unknown');
    expect(results[0].migrationEffort).toBe('medium');
    expect(results[0].originalPackage).toBe('old-logger');
  });

  it('filters out the original package from results', async () => {
    const dep = makeDep('old-logger');
    const meta = { _meta: { keywords: ['logging'] } };
    const searchResult = {
      objects: [
        makeNpmSearchResult('old-logger', 0.9), // original — should be filtered
        makeNpmSearchResult('better-logger', 0.6),
      ],
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results.every(r => r.alternativeName !== 'old-logger')).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].alternativeName).toBe('better-logger');
  });

  it('computes confidence score as 0.3 + (textScore * 0.4)', async () => {
    const dep = makeDep('old-pkg');
    const meta = { _meta: { keywords: ['parsing'] } };
    // textScore = 0.5 → 0.3 + (0.5 * 0.4) = 0.3 + 0.2 = 0.5
    const searchResult = { objects: [makeNpmSearchResult('new-pkg', 0.5)] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results[0].confidenceScore).toBeCloseTo(0.5, 5);
  });

  it('includes results with confidenceScore >= 0.3', async () => {
    const dep = makeDep('old-pkg');
    const meta = { _meta: { keywords: ['utils'] } };
    // score 0.0 → 0.3 + (0.0 * 0.4) = 0.3 (exactly at threshold — include)
    const searchResult = { objects: [makeNpmSearchResult('low-confidence-pkg', 0.0)] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results).toHaveLength(1);
    expect(results[0].confidenceScore).toBeCloseTo(0.3, 5);
  });

  it('returns [] on empty search results', async () => {
    const dep = makeDep('old-pkg');
    const meta = { _meta: { keywords: ['utils'] } };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ objects: [] }),
    });
    const results = await searchEquivalents(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns [] on npm search API failure — no throw', async () => {
    const dep = makeDep('old-pkg');
    const meta = { _meta: { keywords: ['utils'] } };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns [] on fetch network error — no throw', async () => {
    const dep = makeDep('old-pkg');
    const meta = { _meta: { keywords: ['utils'] } };
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network failure'));
    const results = await searchEquivalents(dep, meta);
    expect(results).toEqual([]);
  });

  it('uses dep name as keyword when no _meta.keywords', async () => {
    const dep = makeDep('old-logger');
    const meta = {}; // no _meta
    const searchResult = { objects: [makeNpmSearchResult('new-logger', 0.4)] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    await searchEquivalents(dep, meta);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('old-logger'),
      expect.any(Object),
    );
  });

  it('evidenceSummary contains matched keywords', async () => {
    const dep = makeDep('old-logger');
    const meta = { _meta: { keywords: ['logging', 'debug'] } };
    const searchResult = { objects: [makeNpmSearchResult('new-logger', 0.6)] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => searchResult,
    });
    const results = await searchEquivalents(dep, meta);
    expect(results[0].evidenceSummary).toContain('Registry keyword match');
  });

  it('EquivalentSearcher class wraps searchEquivalents', async () => {
    const searcher = new EquivalentSearcher();
    const dep = makeDep('test-pkg', 'cargo');
    const results = await searcher.search(dep, {});
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
