/**
 * Tests for src/aminet/index-freshness.ts
 *
 * Validates INDEX freshness detection, RECENT file fetching/parsing,
 * and incremental merge of RECENT entries into cached INDEX data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkFreshness, fetchRecent, mergeRecentIntoIndex } from './index-freshness.js';
import { writeIndexCache, readIndexCache } from './index-parser.js';
import type { AminetIndex, AminetMirrorConfig, AminetPackage } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePackage(overrides: Partial<AminetPackage> & { filename: string; directory: string }): AminetPackage {
  const dir = overrides.directory;
  const slashIdx = dir.indexOf('/');
  return {
    filename: overrides.filename,
    directory: dir,
    category: slashIdx >= 0 ? dir.substring(0, slashIdx) : dir,
    subcategory: slashIdx >= 0 ? dir.substring(slashIdx + 1) : '',
    sizeKb: overrides.sizeKb ?? 100,
    ageDays: overrides.ageDays ?? 10,
    description: overrides.description ?? 'Test package',
    fullPath: overrides.fullPath ?? `${dir}/${overrides.filename}`,
  };
}

function makeIndex(packages: AminetPackage[], parsedAt?: string): AminetIndex {
  return {
    packages,
    parseErrors: 0,
    totalLines: packages.length + 2,
    parsedAt: parsedAt ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// checkFreshness
// ---------------------------------------------------------------------------

describe('checkFreshness', () => {
  it('returns current for metadata fetched 1 hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const metadata = {
      fetchedAt: oneHourAgo,
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1' as const,
    };

    const result = checkFreshness(metadata);

    expect(result.isStale).toBe(false);
    expect(result.recommendation).toBe('current');
    expect(result.ageHours).toBeGreaterThanOrEqual(0.9);
    expect(result.ageHours).toBeLessThan(1.2);
    expect(result.cachedAt).toBe(oneHourAgo);
  });

  it('returns stale_incremental for metadata fetched 25 hours ago', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const metadata = {
      fetchedAt: twentyFiveHoursAgo,
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1' as const,
    };

    const result = checkFreshness(metadata);

    expect(result.isStale).toBe(true);
    expect(result.recommendation).toBe('stale_incremental');
    expect(result.ageMs).toBeGreaterThan(24 * 60 * 60 * 1000);
  });

  it('returns stale_full when metadata is null', () => {
    const result = checkFreshness(null);

    expect(result.isStale).toBe(true);
    expect(result.recommendation).toBe('stale_full');
    expect(result.ageMs).toBe(Infinity);
    expect(result.ageHours).toBe(Infinity);
    expect(result.cachedAt).toBe('');
  });

  it('respects custom maxAgeMs', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const metadata = {
      fetchedAt: twoHoursAgo,
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1' as const,
    };

    // Default 24h: not stale
    expect(checkFreshness(metadata).isStale).toBe(false);
    // Custom 1h: stale
    expect(checkFreshness(metadata, 60 * 60 * 1000).isStale).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// fetchRecent
// ---------------------------------------------------------------------------

describe('fetchRecent', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches and parses RECENT file into AminetPackage[]', async () => {
    const recentContent = [
      '| File                  Dir       Size Age Description',
      '|---------+----------|---+---+------',
      'NewApp.lha  util/misc   50K   1 A brand new app',
      'Update.lha  dev/c      120K   2 Updated compiler',
      'Music.lha   mus/play    88K   0 Fresh music player',
    ].join('\n');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(recentContent),
    } as unknown as Response);

    const config: AminetMirrorConfig = {
      mirrors: ['https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir: '/tmp/test',
    };

    const result = await fetchRecent(config);

    expect(result).toHaveLength(3);
    expect(result[0].filename).toBe('NewApp.lha');
    expect(result[0].directory).toBe('util/misc');
    expect(result[0].fullPath).toBe('util/misc/NewApp.lha');
    expect(result[1].filename).toBe('Update.lha');
    expect(result[2].filename).toBe('Music.lha');

    // Verify the URL used
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://aminet.net/aminet/RECENT',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'Test/1.0' }),
      }),
    );
  });

  it('throws when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const config: AminetMirrorConfig = {
      mirrors: ['https://aminet.net'],
      userAgent: 'Test/1.0',
      timeoutMs: 5000,
      cacheDir: '/tmp/test',
    };

    await expect(fetchRecent(config)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// mergeRecentIntoIndex
// ---------------------------------------------------------------------------

describe('mergeRecentIntoIndex', () => {
  it('adds new packages and updates existing (10 original + 3 RECENT = 12 total)', () => {
    // 10 original packages
    const originals: AminetPackage[] = [];
    for (let i = 0; i < 10; i++) {
      originals.push(
        makePackage({
          filename: `Pkg${i}.lha`,
          directory: 'util/misc',
          sizeKb: 100 + i,
          ageDays: 30 + i,
          description: `Original package ${i}`,
        }),
      );
    }

    const existing = makeIndex(originals, '2026-01-01T00:00:00Z');

    // 3 RECENT entries: 2 new, 1 update of existing Pkg0.lha
    const recent: AminetPackage[] = [
      makePackage({
        filename: 'BrandNew1.lha',
        directory: 'dev/c',
        sizeKb: 200,
        ageDays: 1,
        description: 'Brand new package 1',
      }),
      makePackage({
        filename: 'BrandNew2.lha',
        directory: 'mus/play',
        sizeKb: 300,
        ageDays: 0,
        description: 'Brand new package 2',
      }),
      makePackage({
        filename: 'Pkg0.lha',
        directory: 'util/misc',
        sizeKb: 999,
        ageDays: 0,
        description: 'Updated version of Pkg0',
      }),
    ];

    const merged = mergeRecentIntoIndex(existing, recent);

    // 10 original + 2 new = 12 (Pkg0 was updated, not added)
    expect(merged.packages).toHaveLength(12);

    // Find updated Pkg0 -- should have new metadata from RECENT
    const updatedPkg0 = merged.packages.find((p) => p.fullPath === 'util/misc/Pkg0.lha');
    expect(updatedPkg0).toBeDefined();
    expect(updatedPkg0!.sizeKb).toBe(999);
    expect(updatedPkg0!.description).toBe('Updated version of Pkg0');

    // Original packages (Pkg1-Pkg9) should be unchanged
    for (let i = 1; i < 10; i++) {
      const pkg = merged.packages.find((p) => p.fullPath === `util/misc/Pkg${i}.lha`);
      expect(pkg).toBeDefined();
      expect(pkg!.sizeKb).toBe(100 + i);
      expect(pkg!.description).toBe(`Original package ${i}`);
    }

    // New packages should be present
    expect(merged.packages.find((p) => p.fullPath === 'dev/c/BrandNew1.lha')).toBeDefined();
    expect(merged.packages.find((p) => p.fullPath === 'mus/play/BrandNew2.lha')).toBeDefined();

    // parsedAt should be updated
    expect(merged.parsedAt).not.toBe('2026-01-01T00:00:00Z');
  });

  it('handles empty RECENT (index unchanged except parsedAt)', () => {
    const original = makePackage({
      filename: 'Existing.lha',
      directory: 'util/misc',
    });
    const existing = makeIndex([original], '2026-01-01T00:00:00Z');

    const merged = mergeRecentIntoIndex(existing, []);

    expect(merged.packages).toHaveLength(1);
    expect(merged.packages[0].fullPath).toBe('util/misc/Existing.lha');
    expect(merged.parsedAt).not.toBe('2026-01-01T00:00:00Z');
  });

  it('deduplicates: RECENT with same fullPath replaces old entry', () => {
    const original = makePackage({
      filename: 'Tool.lha',
      directory: 'dev/debug',
      sizeKb: 50,
      description: 'Old version',
    });
    const existing = makeIndex([original]);

    const recent: AminetPackage[] = [
      makePackage({
        filename: 'Tool.lha',
        directory: 'dev/debug',
        sizeKb: 75,
        description: 'New version v2',
      }),
    ];

    const merged = mergeRecentIntoIndex(existing, recent);

    expect(merged.packages).toHaveLength(1);
    expect(merged.packages[0].sizeKb).toBe(75);
    expect(merged.packages[0].description).toBe('New version v2');
  });
});

// ---------------------------------------------------------------------------
// Full cycle integration
// ---------------------------------------------------------------------------

describe('full freshness cycle', () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'aminet-freshness-'));
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('checkFreshness -> stale -> fetchRecent -> merge -> write -> fresh', async () => {
    // 1. Start with no cache -> stale_full
    const check1 = checkFreshness(null);
    expect(check1.isStale).toBe(true);
    expect(check1.recommendation).toBe('stale_full');

    // 2. Simulate having fetched a full INDEX (write cache with current time)
    const original = makePackage({
      filename: 'OldPkg.lha',
      directory: 'util/misc',
      sizeKb: 100,
      ageDays: 30,
      description: 'Old package',
    });
    const index = makeIndex([original]);
    await writeIndexCache(index, cacheDir);

    // 3. Read back the cache and check freshness -> should be current
    const cached = await readIndexCache(cacheDir);
    expect(cached).not.toBeNull();

    const freshMetadata = {
      fetchedAt: new Date().toISOString(),
      mirror: 'https://aminet.net',
      sizeBytes: 1000,
      lineCount: 10,
      encoding: 'iso-8859-1' as const,
    };
    const check2 = checkFreshness(freshMetadata);
    expect(check2.isStale).toBe(false);
    expect(check2.recommendation).toBe('current');

    // 4. Merge some RECENT data into the cached index
    const recentPkg = makePackage({
      filename: 'NewPkg.lha',
      directory: 'dev/c',
      sizeKb: 200,
      ageDays: 0,
      description: 'Brand new',
    });
    const merged = mergeRecentIntoIndex(cached!, [recentPkg]);
    expect(merged.packages).toHaveLength(2);

    // 5. Write merged index back
    await writeIndexCache(merged, cacheDir);

    // 6. Read back and verify
    const final = await readIndexCache(cacheDir);
    expect(final).not.toBeNull();
    expect(final!.packages).toHaveLength(2);
    expect(final!.packages.find((p) => p.fullPath === 'dev/c/NewPkg.lha')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Barrel file integration smoke test
// ---------------------------------------------------------------------------

describe('barrel file (src/aminet/index.ts)', () => {
  it('exports all expected public API members', async () => {
    const barrel = await import('./index.js');

    // Binary parsing
    expect(barrel.AmigaBinaryReader).toBeDefined();
    expect(barrel.parseHunkFile).toBeDefined();
    expect(barrel.parseBootBlock).toBeDefined();

    // INDEX management
    expect(barrel.fetchAminetIndex).toBeDefined();
    expect(barrel.decompressIndex).toBeDefined();
    expect(barrel.decodeIndexContent).toBeDefined();
    expect(barrel.validateIndexFormat).toBeDefined();
    expect(barrel.isIndexStale).toBeDefined();
    expect(barrel.loadCachedIndex).toBeDefined();
    expect(barrel.parseAminetIndex).toBeDefined();
    expect(barrel.parseIndexLine).toBeDefined();
    expect(barrel.writeIndexCache).toBeDefined();
    expect(barrel.readIndexCache).toBeDefined();

    // .readme parsing
    expect(barrel.parseReadme).toBeDefined();

    // Freshness and incremental updates
    expect(barrel.checkFreshness).toBeDefined();
    expect(barrel.fetchRecent).toBeDefined();
    expect(barrel.mergeRecentIntoIndex).toBeDefined();

    // Zod schemas
    expect(barrel.AminetMirrorConfigSchema).toBeDefined();
    expect(barrel.IndexMetadataSchema).toBeDefined();
    expect(barrel.PackageReadmeSchema).toBeDefined();
    expect(barrel.MemoryFlagSchema).toBeDefined();
    expect(barrel.HunkTypeSchema).toBeDefined();
    expect(barrel.HUNK_TYPE_MAP).toBeDefined();
    expect(barrel.RelocationEntrySchema).toBeDefined();
    expect(barrel.SymbolEntrySchema).toBeDefined();
    expect(barrel.HunkBlockSchema).toBeDefined();
    expect(barrel.HunkFileSchema).toBeDefined();
    expect(barrel.DosTypeSchema).toBeDefined();
    expect(barrel.BootBlockFlagSchema).toBeDefined();
    expect(barrel.BootBlockSchema).toBeDefined();
    expect(barrel.AminetPackageSchema).toBeDefined();
    expect(barrel.AminetIndexSchema).toBeDefined();
    expect(barrel.FreshnessCheckSchema).toBeDefined();

    // Hunk constants
    expect(barrel.HUNK_HEADER).toBe(0x000003F3);
    expect(barrel.HUNK_CODE).toBe(0x000003E9);
    expect(barrel.HUNK_END).toBe(0x000003F2);
  });
});
