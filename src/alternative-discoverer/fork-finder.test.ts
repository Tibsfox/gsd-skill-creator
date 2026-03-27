import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findForks, ForkFinder } from './fork-finder.js';
import type { DependencyRecord, RegistryHealth } from '../dependency-auditor/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDep(name: string): DependencyRecord {
  return { name, version: '1.0.0', ecosystem: 'npm', sourceManifest: '/package.json' };
}

function makeMeta(opts: {
  repository?: string;
  homepage?: string;
} = {}): Record<string, unknown> {
  return { ...opts };
}

const RECENT_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
const OLD_DATE = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(); // 400 days ago

function makeForkResponse(overrides: Record<string, unknown> = {}) {
  return {
    name: 'old-pkg',
    owner: { login: 'new-owner' },
    html_url: 'https://github.com/new-owner/old-pkg',
    stargazers_count: 100,
    has_issues: true,
    pushed_at: RECENT_DATE,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('findForks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns [] when no GitHub URL in meta', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta(); // no repository or homepage
    const results = await findForks(dep, meta);
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns [] when GitHub URL present but API returns 0 forks', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // forks list = empty
    const results = await findForks(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns [] when fork has no releases', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    const fork = makeForkResponse();
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [fork] }) // forks list
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // releases = empty
    const results = await findForks(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns fork with releases and recent push as AlternativeReport', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    const fork = makeForkResponse({ stargazers_count: 200 });
    const release = { id: 1, tag_name: 'v2.0.0' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [fork] })
      .mockResolvedValueOnce({ ok: true, json: async () => [release] });
    const results = await findForks(dep, meta);
    expect(results).toHaveLength(1);
    expect(results[0].relationship).toBe('fork');
    expect(results[0].alternativeName).toBe('new-owner/old-pkg');
    expect(results[0].apiCompatibility).toBe('compatible');
    expect(results[0].migrationEffort).toBe('low');
    expect(results[0].sourceUrl).toBe('https://github.com/new-owner/old-pkg');
    expect(results[0].confidenceScore).toBeGreaterThanOrEqual(0.6);
    expect(results[0].evidenceSummary).toContain('release');
    expect(results[0].originalPackage).toBe('old-pkg');
  });

  it('fork with old push (>365 days) but releases is included', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    const fork = makeForkResponse({ pushed_at: OLD_DATE, stargazers_count: 50 });
    const release = { id: 1, tag_name: 'v1.5.0' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [fork] })
      .mockResolvedValueOnce({ ok: true, json: async () => [release] });
    const results = await findForks(dep, meta);
    // releases signal activity regardless of push date
    expect(results).toHaveLength(1);
    expect(results[0].relationship).toBe('fork');
  });

  it('returns [] on 403 rate-limit response — no throw', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    const results = await findForks(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns [] on 404 — no throw', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    const results = await findForks(dep, meta);
    expect(results).toEqual([]);
  });

  it('returns multiple maintained forks', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    const fork1 = makeForkResponse({ owner: { login: 'user-a' }, stargazers_count: 500 });
    const fork2 = makeForkResponse({ owner: { login: 'user-b' }, stargazers_count: 100 });
    const release = { id: 1, tag_name: 'v2.0.0' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [fork1, fork2] })
      .mockResolvedValueOnce({ ok: true, json: async () => [release] })
      .mockResolvedValueOnce({ ok: true, json: async () => [release] });
    const results = await findForks(dep, meta);
    expect(results).toHaveLength(2);
    expect(results[0].alternativeName).toBe('user-a/old-pkg');
    expect(results[1].alternativeName).toBe('user-b/old-pkg');
  });

  it('confidence score formula: 0.6 + min(stars/1000, 0.3)', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ repository: 'https://github.com/old-owner/old-pkg' });
    // 1000 stars → min(1000/1000, 0.3) = min(1.0, 0.3) = 0.3 → total = 0.9
    const fork = makeForkResponse({ stargazers_count: 1000 });
    const release = { id: 1, tag_name: 'v2.0.0' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [fork] })
      .mockResolvedValueOnce({ ok: true, json: async () => [release] });
    const results = await findForks(dep, meta);
    expect(results[0].confidenceScore).toBeCloseTo(0.9, 5);
  });

  it('extracts GitHub URL from homepage field', async () => {
    const dep = makeDep('old-pkg');
    const meta = makeMeta({ homepage: 'https://github.com/old-owner/old-pkg#readme' });
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // empty forks
    await findForks(dep, meta);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.github.com/repos/old-owner/old-pkg/forks'),
      expect.any(Object),
    );
  });

  it('ForkFinder class wraps findForks', async () => {
    const finder = new ForkFinder();
    const dep = makeDep('old-pkg');
    const meta = makeMeta();
    const results = await finder.find(dep, meta);
    expect(results).toEqual([]);
  });
});
