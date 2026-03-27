/**
 * Tests for WantedRegistry — pack-style search over wasteland wanted items.
 *
 * Covers:
 * - search: filter by status, effort, tag, text
 * - getById: single item lookup
 * - getCategories: available effort levels and tags
 * - caching: TTL-based cache, invalidation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WantedRegistry } from '../wanted-registry.js';
import type { WantedEntry, WantedDataProvider } from '../wanted-registry.js';

// ============================================================================
// Fixtures
// ============================================================================

const ENTRIES: WantedEntry[] = [
  { id: 'w-001', title: 'Build parser', status: 'open', effortLevel: 'medium', tags: ['rust', 'parser'], postedBy: 'alice' },
  { id: 'w-002', title: 'Write docs', status: 'open', effortLevel: 'small', tags: ['docs'], postedBy: 'bob' },
  { id: 'w-003', title: 'Fix bug in parser', status: 'claimed', effortLevel: 'medium', tags: ['rust', 'bug'], postedBy: 'alice', claimedBy: 'carol' },
  { id: 'w-004', title: 'Design API', status: 'open', effortLevel: 'large', tags: ['design', 'api'], postedBy: 'bob' },
];

function mockProvider(): WantedDataProvider {
  return {
    queryWanted: vi.fn().mockResolvedValue(ENTRIES),
  };
}

// ============================================================================
// search
// ============================================================================

describe('WantedRegistry.search', () => {
  let registry: WantedRegistry;
  let provider: WantedDataProvider;

  beforeEach(() => {
    provider = mockProvider();
    registry = new WantedRegistry(provider);
  });

  it('returns all entries with empty criteria', async () => {
    const results = await registry.search();
    expect(results).toHaveLength(4);
  });

  it('filters by status', async () => {
    const results = await registry.search({ status: 'open' });
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'open')).toBe(true);
  });

  it('filters by effort level', async () => {
    const results = await registry.search({ effortLevel: 'medium' });
    expect(results).toHaveLength(2);
  });

  it('filters by tag', async () => {
    const results = await registry.search({ tag: 'rust' });
    expect(results).toHaveLength(2);
  });

  it('filters by text (case insensitive)', async () => {
    const results = await registry.search({ text: 'PARSER' });
    expect(results).toHaveLength(2);
    expect(results[0].title).toContain('parser');
  });

  it('combines multiple filters', async () => {
    const results = await registry.search({ status: 'open', effortLevel: 'medium' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('w-001');
  });

  it('returns empty for no matches', async () => {
    const results = await registry.search({ tag: 'nonexistent' });
    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// getById
// ============================================================================

describe('WantedRegistry.getById', () => {
  let registry: WantedRegistry;

  beforeEach(() => {
    registry = new WantedRegistry(mockProvider());
  });

  it('finds entry by ID', async () => {
    const entry = await registry.getById('w-003');
    expect(entry).toBeDefined();
    expect(entry!.title).toBe('Fix bug in parser');
  });

  it('returns undefined for unknown ID', async () => {
    expect(await registry.getById('w-999')).toBeUndefined();
  });
});

// ============================================================================
// getCategories
// ============================================================================

describe('WantedRegistry.getCategories', () => {
  it('returns unique effort levels and tags', async () => {
    const registry = new WantedRegistry(mockProvider());
    const cats = await registry.getCategories();

    expect(cats.effortLevels.sort()).toEqual(['large', 'medium', 'small']);
    expect(cats.tags.sort()).toEqual(['api', 'bug', 'design', 'docs', 'parser', 'rust']);
  });
});

// ============================================================================
// Caching
// ============================================================================

describe('WantedRegistry caching', () => {
  it('caches results within TTL', async () => {
    const provider = mockProvider();
    const registry = new WantedRegistry(provider, 60_000);

    await registry.search();
    await registry.search();

    expect(provider.queryWanted).toHaveBeenCalledTimes(1);
  });

  it('invalidateCache forces fresh query', async () => {
    const provider = mockProvider();
    const registry = new WantedRegistry(provider, 60_000);

    await registry.search();
    registry.invalidateCache();
    await registry.search();

    expect(provider.queryWanted).toHaveBeenCalledTimes(2);
  });

  it('expires cache after TTL', async () => {
    const provider = mockProvider();
    const registry = new WantedRegistry(provider, 1); // 1ms TTL

    await registry.search();
    // Wait for TTL to expire
    await new Promise(r => setTimeout(r, 5));
    await registry.search();

    expect(provider.queryWanted).toHaveBeenCalledTimes(2);
  });
});
