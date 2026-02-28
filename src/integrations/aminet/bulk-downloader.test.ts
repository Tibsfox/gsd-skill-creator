/**
 * Tests for the bulk download engine.
 *
 * Covers concurrency control, global rate limiting, resume from
 * interruption, state persistence, error handling, and integrity checks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { AminetPackage, DownloadConfig, MirrorState } from './types.js';
import { saveMirrorState, loadMirrorState } from './mirror-state.js';
import { bulkDownload } from './bulk-downloader.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory for each test. */
function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'bulk-dl-'));
}

/** Build a minimal AminetPackage for testing. */
function makePkg(name: string, sizeKb = 12): AminetPackage {
  return {
    filename: `${name}.lha`,
    directory: 'dev/misc',
    category: 'dev',
    subcategory: 'misc',
    sizeKb,
    ageDays: 10,
    description: `Test package ${name}`,
    fullPath: `dev/misc/${name}.lha`,
  };
}

/** Build a minimal DownloadConfig. */
function makeConfig(mirrorDir: string, overrides: Partial<DownloadConfig> = {}): DownloadConfig {
  return {
    mirrors: ['http://mirror1.test'],
    userAgent: 'test-agent/1.0',
    timeoutMs: 5000,
    cacheDir: mirrorDir,
    delayMs: 0,
    concurrency: 2,
    mirrorDir,
    ...overrides,
  };
}

/**
 * Build a Buffer of a specific size in KB.
 * Vitest runs in Node, so Buffer is available.
 */
function makeBuffer(sizeKb: number): Buffer {
  return Buffer.alloc(sizeKb * 1024, 0x42);
}

// ============================================================================
// Tests
// ============================================================================

describe('bulkDownload', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * Helper: mock fetch to return success with a Buffer of the expected size.
   * .readme requests return 404 (non-fatal).
   */
  function mockFetchSuccess(sizeKb = 12): void {
    fetchSpy.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.endsWith('.readme')) {
        return { ok: false, status: 404 };
      }
      const buf = makeBuffer(sizeKb);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    });
  }

  // --------------------------------------------------------------------------
  // 1. Downloads all packages
  // --------------------------------------------------------------------------

  it('downloads all packages successfully', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    const result = await bulkDownload(
      [makePkg('alpha'), makePkg('bravo'), makePkg('charlie')],
      makeConfig(dir),
    );

    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.total).toBe(3);
  });

  // --------------------------------------------------------------------------
  // 2. Concurrency limit respected
  // --------------------------------------------------------------------------

  it('respects concurrency=1 (sequential downloads)', async () => {
    const dir = makeTmpDir();
    const order: string[] = [];

    fetchSpy.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.endsWith('.readme')) {
        return { ok: false, status: 404 };
      }
      const name = url.split('/').pop()!;
      order.push(`start:${name}`);
      // Small delay to allow concurrency overlap if it exists
      await new Promise((r) => setTimeout(r, 20));
      order.push(`end:${name}`);
      const buf = makeBuffer(12);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    });

    await bulkDownload(
      [makePkg('a'), makePkg('b'), makePkg('c')],
      makeConfig(dir, { concurrency: 1, delayMs: 0 }),
    );

    // With concurrency=1, each download must finish before the next starts.
    // The order array should be: start:a, end:a, start:b, end:b, start:c, end:c
    // (interleaved .readme calls filtered out above)
    const lhaOrder = order.filter((e) => e.includes('.lha'));
    for (let i = 0; i < lhaOrder.length - 1; i += 2) {
      expect(lhaOrder[i]).toMatch(/^start:/);
      expect(lhaOrder[i + 1]).toMatch(/^end:/);
      // The "end" of one must come before the "start" of the next
      if (i + 2 < lhaOrder.length) {
        const endIdx = i + 1;
        const nextStartIdx = i + 2;
        expect(endIdx).toBeLessThan(nextStartIdx);
      }
    }
  });

  it('allows concurrency=2 (parallel downloads)', async () => {
    const dir = makeTmpDir();
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    fetchSpy.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.endsWith('.readme')) {
        return { ok: false, status: 404 };
      }
      currentConcurrent++;
      if (currentConcurrent > maxConcurrent) {
        maxConcurrent = currentConcurrent;
      }
      await new Promise((r) => setTimeout(r, 30));
      currentConcurrent--;
      const buf = makeBuffer(12);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    });

    await bulkDownload(
      [makePkg('a'), makePkg('b'), makePkg('c')],
      makeConfig(dir, { concurrency: 2, delayMs: 0 }),
    );

    // At most 2 should be in-flight simultaneously
    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(maxConcurrent).toBeGreaterThanOrEqual(2); // Should actually USE concurrency
  });

  // --------------------------------------------------------------------------
  // 3. Rate limiting delay
  // --------------------------------------------------------------------------

  it('applies global rate limiting delay between downloads', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    const start = performance.now();
    await bulkDownload(
      [makePkg('a'), makePkg('b'), makePkg('c')],
      makeConfig(dir, { concurrency: 1, delayMs: 50 }),
    );
    const elapsed = performance.now() - start;

    // 3 downloads with concurrency=1 means 2 delays of 50ms each = 100ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(90); // Small tolerance for timer precision
  });

  // --------------------------------------------------------------------------
  // 4. Resume: skip already-mirrored
  // --------------------------------------------------------------------------

  it('skips already-mirrored packages on resume', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    // Pre-populate state with one package already mirrored
    const preState: MirrorState = {
      entries: {
        'dev/misc/bravo.lha': {
          fullPath: 'dev/misc/bravo.lha',
          status: 'mirrored',
          sizeKb: 12,
          sha256: 'abc123',
          localPath: '/some/path',
          downloadedAt: '2026-01-01T00:00:00Z',
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(preState, dir);

    const result = await bulkDownload(
      [makePkg('alpha'), makePkg('bravo'), makePkg('charlie')],
      makeConfig(dir),
    );

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped).toContain('dev/misc/bravo.lha');
  });

  // --------------------------------------------------------------------------
  // 5. Resume: re-download 'downloading' status
  // --------------------------------------------------------------------------

  it('re-downloads packages stuck in downloading status', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    // Pre-populate state with one package stuck in 'downloading'
    const preState: MirrorState = {
      entries: {
        'dev/misc/bravo.lha': {
          fullPath: 'dev/misc/bravo.lha',
          status: 'downloading',
          sizeKb: 12,
          sha256: null,
          localPath: null,
          downloadedAt: null,
          lastChecked: null,
        },
      },
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    saveMirrorState(preState, dir);

    const result = await bulkDownload(
      [makePkg('bravo')],
      makeConfig(dir),
    );

    // Should re-download, not skip
    expect(result.succeeded).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 6. State updated after each download
  // --------------------------------------------------------------------------

  it('updates mirror state after each successful download', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    await bulkDownload(
      [makePkg('alpha'), makePkg('bravo')],
      makeConfig(dir),
    );

    // Load the persisted state
    const state = loadMirrorState(dir);

    const alphaEntry = state.entries['dev/misc/alpha.lha'];
    expect(alphaEntry).toBeDefined();
    expect(alphaEntry.status).toBe('mirrored');
    expect(alphaEntry.sha256).toBeTruthy();
    expect(alphaEntry.localPath).toBeTruthy();
    expect(alphaEntry.downloadedAt).toBeTruthy();

    const bravoEntry = state.entries['dev/misc/bravo.lha'];
    expect(bravoEntry).toBeDefined();
    expect(bravoEntry.status).toBe('mirrored');
  });

  // --------------------------------------------------------------------------
  // 7. Failed download recorded
  // --------------------------------------------------------------------------

  it('records failed downloads with error messages', async () => {
    const dir = makeTmpDir();

    fetchSpy.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.endsWith('.readme')) {
        return { ok: false, status: 404 };
      }
      // Fail only bravo
      if (typeof url === 'string' && url.includes('bravo')) {
        return { ok: false, status: 500 };
      }
      const buf = makeBuffer(12);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    });

    const result = await bulkDownload(
      [makePkg('alpha'), makePkg('bravo'), makePkg('charlie')],
      makeConfig(dir),
    );

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].fullPath).toBe('dev/misc/bravo.lha');
    expect(result.failed[0].error).toBeTruthy();

    // Failed package should have status='not-mirrored' in state
    const state = loadMirrorState(dir);
    expect(state.entries['dev/misc/bravo.lha'].status).toBe('not-mirrored');
  });

  // --------------------------------------------------------------------------
  // 8. Integrity failure
  // --------------------------------------------------------------------------

  it('marks package as failed on integrity size mismatch', async () => {
    const dir = makeTmpDir();

    fetchSpy.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.endsWith('.readme')) {
        return { ok: false, status: 404 };
      }
      // Return empty buffer (0 bytes) for a package expected to be 12 KB
      const buf = Buffer.alloc(0);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      };
    });

    const result = await bulkDownload(
      [makePkg('alpha', 12)],
      makeConfig(dir),
    );

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].fullPath).toBe('dev/misc/alpha.lha');
    expect(result.failed[0].error).toMatch(/size/i);
    expect(result.succeeded).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 9. Empty package list
  // --------------------------------------------------------------------------

  it('returns immediately with empty results for empty package list', async () => {
    const dir = makeTmpDir();

    const result = await bulkDownload([], makeConfig(dir));

    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 10. State persistence across calls
  // --------------------------------------------------------------------------

  it('persists state across multiple bulkDownload calls', async () => {
    const dir = makeTmpDir();
    mockFetchSuccess(12);

    // First call: download 2 packages
    await bulkDownload(
      [makePkg('alpha'), makePkg('bravo')],
      makeConfig(dir),
    );

    // Second call: 3 packages including the original 2
    const result = await bulkDownload(
      [makePkg('alpha'), makePkg('bravo'), makePkg('charlie')],
      makeConfig(dir),
    );

    // alpha and bravo should be skipped (already mirrored from first call)
    expect(result.skipped).toHaveLength(2);
    expect(result.succeeded).toHaveLength(1);
    expect(result.succeeded).toContain('dev/misc/charlie.lha');
  });
});
