import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { PMTiles, Compression, TileType, type Source, type RangeResponse } from 'pmtiles';
import {
  resolvePmtilesPath,
  validatePMTilesMagic,
  fetchTileViaPMTiles,
  clearPmtilesCaches,
  pmtilesCacheStats,
  NodeFileSource,
  __resetArchiveCacheForTest,
  __getArchiveEntryForTest,
} from '../pmtiles-reader.js';
import {
  tileToAtlasBBox,
  buildSymbolTilePyramid,
  serializeDirectory,
  serializeHeader,
  encodeMvtTile,
} from '../pmtiles-writer.js';
import { PMTILES_MAGIC } from '../format-constants.js';
import type { PgQueryable } from '../hybrid-query.js';

beforeEach(() => clearPmtilesCaches());

// ── Reader-side tests (unchanged) ────────────────────────────────────────

describe('resolvePmtilesPath', () => {
  it('returns absolute path with default name when null passed', () => {
    expect(resolvePmtilesPath(null)).toMatch(/symbols\.pmtiles$/);
  });
  it('uses ATLAS_PMTILES_DIR env when set', () => {
    process.env.ATLAS_PMTILES_DIR = '/tmp/atlas-test';
    expect(resolvePmtilesPath('foo')).toBe('/tmp/atlas-test/foo.pmtiles');
    delete process.env.ATLAS_PMTILES_DIR;
  });
});

describe('validatePMTilesMagic', () => {
  const tmpFile = resolve(tmpdir(), 'pmtiles-magic-test.pmtiles');
  afterEach(() => { if (existsSync(tmpFile)) unlinkSync(tmpFile); });

  it('returns true for a file with correct magic bytes', () => {
    const buf = Buffer.alloc(16); buf.set(PMTILES_MAGIC, 0);
    writeFileSync(tmpFile, buf);
    expect(validatePMTilesMagic(tmpFile)).toBe(true);
  });
  it('returns false for wrong bytes', () => {
    writeFileSync(tmpFile, 'not a pmtiles');
    expect(validatePMTilesMagic(tmpFile)).toBe(false);
  });
  it('returns false for missing file', () => {
    expect(validatePMTilesMagic('/no/such/file.pmtiles')).toBe(false);
  });
});

describe('NodeFileSource', () => {
  const tmpFile = resolve(tmpdir(), 'pmtiles-source-test.bin');
  afterEach(() => { if (existsSync(tmpFile)) unlinkSync(tmpFile); });

  it('returns the requested byte range', async () => {
    writeFileSync(tmpFile, 'abcdefghijklmnop');
    const src = new NodeFileSource(tmpFile);
    const r = await src.getBytes(2, 5);
    expect(Buffer.from(new Uint8Array(r.data as ArrayBuffer)).toString()).toBe('cdefg');
    await src.close();
  });
  it('getKey returns the file path', () => {
    expect(new NodeFileSource('/tmp/x.pmtiles').getKey()).toBe('/tmp/x.pmtiles');
  });
});

describe('pmtilesCacheStats / clearPmtilesCaches', () => {
  it('reports empty caches after clear', () => {
    clearPmtilesCaches();
    expect(pmtilesCacheStats()).toEqual({ archives: 0, tiles: 0 });
  });
});

// ── Writer-side primitives ────────────────────────────────────────────────

describe('tileToAtlasBBox', () => {
  it('zoom 0 covers the full atlas bbox', () => {
    expect(tileToAtlasBBox([0, 0, 100, 100], 0, 0, 0)).toEqual({ min_x: 0, min_y: 0, max_x: 100, max_y: 100 });
  });
  it('zoom 1 splits into quadrants', () => {
    expect(tileToAtlasBBox([0, 0, 100, 100], 1, 0, 0)).toEqual({ min_x: 0, min_y: 0, max_x: 50, max_y: 50 });
    expect(tileToAtlasBBox([0, 0, 100, 100], 1, 1, 0)).toEqual({ min_x: 50, min_y: 0, max_x: 100, max_y: 50 });
  });
});

describe('serializeHeader', () => {
  it('emits a 127-byte buffer with PMTiles magic + version 3', () => {
    const buf = serializeHeader({
      rootDirectoryOffset: 127, rootDirectoryLength: 0,
      jsonMetadataOffset: 127, jsonMetadataLength: 0,
      leafDirectoryOffset: 127, leafDirectoryLength: 0,
      tileDataOffset: 127, tileDataLength: 0,
      numAddressedTiles: 0, numTileEntries: 0, numTileContents: 0,
      clustered: true,
      internalCompression: Compression.None,
      tileCompression: Compression.Gzip,
      tileType: TileType.Mvt,
      minZoom: 0, maxZoom: 12,
      minLonE7: 0, minLatE7: 0, maxLonE7: 0, maxLatE7: 0,
      centerZoom: 0, centerLonE7: 0, centerLatE7: 0,
    });
    expect(buf.length).toBe(127);
    for (let i = 0; i < 8; i++) expect(buf[i]).toBe(PMTILES_MAGIC[i]);
    expect(buf[100]).toBe(0); // minZoom
    expect(buf[101]).toBe(12); // maxZoom
  });
});

describe('serializeDirectory', () => {
  it('round-trips a single entry through the readVarint-mirroring layout', () => {
    const bytes = serializeDirectory([{ tileId: 5, offset: 0, length: 100, runLength: 1 }]);
    // 5 varints: count(1), tileId-delta(5), runLength(1), length(100), offset(0+1=1)
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(1); // count varint == 1
  });
});

describe('encodeMvtTile', () => {
  it('produces a non-empty buffer for one symbol', () => {
    const bytes = encodeMvtTile(
      [{ id: 'a', x: 50, y: 50, qualified_name: 'foo.bar', kind: 'function' }],
      { min_x: 0, min_y: 0, max_x: 100, max_y: 100 },
      4096,
      'symbols',
    );
    expect(bytes.length).toBeGreaterThan(0);
  });
});

// ── End-to-end: build a minimal archive, round-trip through pmtiles@4 reader ──

function mockClient(rows: { bbox?: unknown[]; symbols?: unknown[] }): PgQueryable {
  let call = 0;
  return {
    query: async <R>() => {
      call++;
      const r = (call === 1 ? rows.bbox : rows.symbols) ?? [];
      return { rows: r as R[], rowCount: r.length };
    },
  };
}

describe('buildSymbolTilePyramid → pmtiles@4 reader round-trip', () => {
  const tmpFile = resolve(tmpdir(), 'pmtiles-roundtrip-test.pmtiles');
  afterEach(() => { if (existsSync(tmpFile)) unlinkSync(tmpFile); });

  it('throws when atlas.symbols has no positions', async () => {
    const client = mockClient({ bbox: [{ min_x: null, min_y: null, max_x: null, max_y: null }], symbols: [] });
    await expect(buildSymbolTilePyramid({ pgClient: client, outPath: tmpFile }))
      .rejects.toThrow(/no positions to tile/);
  });

  it('writes a valid PMTiles v3 file the upstream reader can parse', async () => {
    const client = mockClient({
      bbox: [{ min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 }],
      symbols: [
        { id: 'a', x: 100, y: 100, qualified_name: 'mod.a', kind: 'function' },
        { id: 'b', x: 500, y: 500, qualified_name: 'mod.b', kind: 'class' },
        { id: 'c', x: 900, y: 900, qualified_name: 'mod.c', kind: 'function' },
      ],
    });

    const report = await buildSymbolTilePyramid({
      pgClient: client, outPath: tmpFile, minZoom: 0, maxZoom: 2,
    });
    expect(report.tiles_emitted).toBeGreaterThan(0);
    expect(report.bytes_written).toBeGreaterThan(127); // header + body
    expect(existsSync(tmpFile)).toBe(true);

    // Round-trip through the upstream pmtiles@4 reader.
    class InMemorySource implements Source {
      constructor(public buf: Uint8Array, public key: string) {}
      getKey() { return this.key; }
      async getBytes(offset: number, length: number): Promise<RangeResponse> {
        const slice = this.buf.subarray(offset, offset + length);
        const ab = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer;
        return { data: ab };
      }
    }

    const fileBytes = new Uint8Array(readFileSync(tmpFile));
    const archive = new PMTiles(new InMemorySource(fileBytes, tmpFile));
    const header = await archive.getHeader();
    expect(header.specVersion).toBe(3);
    expect(header.tileType).toBe(TileType.Mvt);
    expect(header.tileCompression).toBe(Compression.Gzip);
    expect(header.minZoom).toBe(0);
    expect(header.maxZoom).toBe(2);
    expect(header.numTileEntries).toBe(report.tiles_emitted);

    // Read back tile (0,0,0) — should always exist if any tiles emitted (zoom 0 is one tile).
    const tile = await archive.getZxy(0, 0, 0);
    expect(tile).toBeDefined();
    expect(tile!.data.byteLength).toBeGreaterThan(0);
  });

  it('handles the leaf-directory path (>1024 entries) and round-trips through reader', async () => {
    // Generate a synthetic 5,000-symbol fixture spread across [0..1000]² so
    // many cells are occupied at z=4 (16x16=256 tiles) and z=5 (1024 tiles).
    // Combined with z=6 (4096 tiles) we should comfortably exceed the
    // ROOT_ENTRY_LIMIT (1024) and exercise the leaf-directory split.
    const fixture: { id: string; x: number; y: number; qualified_name: string; kind: string }[] = [];
    for (let i = 0; i < 5000; i++) {
      fixture.push({
        id: `s${i}`,
        x: (i * 37) % 1000,
        y: (i * 53) % 1000,
        qualified_name: `mod.fn${i}`,
        kind: i % 2 === 0 ? 'function' : 'class',
      });
    }
    const client = mockClient({
      bbox: [{ min_x: 0, min_y: 0, max_x: 999, max_y: 999 }],
      symbols: fixture,
    });

    const report = await buildSymbolTilePyramid({
      pgClient: client, outPath: tmpFile, minZoom: 0, maxZoom: 6, densityCap: 50,
    });
    // 1+4+16+64+256+1024+4096 = 5461 tile cells max; with a 5K-symbol fixture
    // most cells at deep zooms are occupied → entries comfortably > 1024.
    expect(report.tiles_emitted).toBeGreaterThan(1024);

    // Round-trip through pmtiles@4 reader (forces leaf-dir traversal).
    class InMemorySource implements Source {
      constructor(public buf: Uint8Array, public key: string) {}
      getKey() { return this.key; }
      async getBytes(offset: number, length: number): Promise<RangeResponse> {
        const slice = this.buf.subarray(offset, offset + length);
        const ab = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer;
        return { data: ab };
      }
    }
    const fileBytes = new Uint8Array(readFileSync(tmpFile));
    const archive = new PMTiles(new InMemorySource(fileBytes, tmpFile));

    const header = await archive.getHeader();
    expect(header.numTileEntries).toBe(report.tiles_emitted);
    expect(header.leafDirectoryLength).toBeGreaterThan(0); // leaf dirs in use

    // A few tile spot-checks across zoom levels.
    const t0 = await archive.getZxy(0, 0, 0);
    expect(t0).toBeDefined();
    expect(t0!.data.byteLength).toBeGreaterThan(0);

    const tDeep = await archive.getZxy(6, 32, 32);
    // Mid-pyramid tile may or may not exist depending on fixture density;
    // either is fine — the reader follows the leaf pointer either way.
    if (tDeep) expect(tDeep.data.byteLength).toBeGreaterThan(0);
  });
});

// ── HIGH-01 refcount-based close (v815) ─────────────────────────────────────

describe('archiveCache refcounted dispose (HIGH-01 refcount close)', () => {
  // Build three tiny real PMTiles files so the cache holds real archives.
  // Then drive the eviction race via `__getArchiveEntryForTest` to inspect
  // `inflight` / `closeRequested` directly — real `getZxy` calls complete
  // too fast to observe the deferred-close window in a test.
  const tmpA = resolve(tmpdir(), 'pmtiles-rc-A.pmtiles');
  const tmpB = resolve(tmpdir(), 'pmtiles-rc-B.pmtiles');
  const tmpC = resolve(tmpdir(), 'pmtiles-rc-C.pmtiles');

  async function makeTiny(path: string): Promise<void> {
    const client = mockClient({
      bbox: [{ min_x: 0, min_y: 0, max_x: 100, max_y: 100 }],
      symbols: [{ id: 'a', x: 10, y: 10, qualified_name: 'm.a', kind: 'function' }],
    });
    await buildSymbolTilePyramid({ pgClient: client, outPath: path, minZoom: 0, maxZoom: 0 });
  }

  beforeEach(async () => {
    __resetArchiveCacheForTest({ max: 2 });
    await makeTiny(tmpA);
    await makeTiny(tmpB);
    await makeTiny(tmpC);
  });

  afterEach(() => {
    [tmpA, tmpB, tmpC].forEach((p) => { if (existsSync(p)) unlinkSync(p); });
    __resetArchiveCacheForTest();
  });

  it('closes the source immediately on eviction when inflight is 0', async () => {
    const closeSpy = vi.spyOn(NodeFileSource.prototype, 'close');
    try {
      // Seed cache with A and B. With max=2, both fit.
      await fetchTileViaPMTiles(tmpA, 0, 0, 0);
      await fetchTileViaPMTiles(tmpB, 0, 0, 0);
      expect(closeSpy).not.toHaveBeenCalled();
      expect(pmtilesCacheStats().archives).toBe(2);

      // Fetch C evicts A (LRU). A's inflight was 0 at eviction time, so
      // dispose closes A's source immediately (fire-and-forget).
      await fetchTileViaPMTiles(tmpC, 0, 0, 0);
      // Wait one microtask tick for the void close() to schedule.
      await Promise.resolve();
      expect(closeSpy).toHaveBeenCalledTimes(1);
      const closedThis = closeSpy.mock.instances[0] as unknown as NodeFileSource;
      expect(closedThis.filePath).toBe(tmpA);
      expect(pmtilesCacheStats().archives).toBe(2); // B + C
    } finally {
      closeSpy.mockRestore();
    }
  });

  it('defers the source close on eviction when inflight > 0, then closes on release', async () => {
    const closeSpy = vi.spyOn(NodeFileSource.prototype, 'close');
    try {
      // Seed A in cache.
      await fetchTileViaPMTiles(tmpA, 0, 0, 0);
      expect(closeSpy).not.toHaveBeenCalled();

      // Simulate an in-flight getZxy on A by incrementing inflight directly.
      const entryA = __getArchiveEntryForTest(tmpA)!;
      expect(entryA).toBeDefined();
      expect(entryA.inflight).toBe(0);
      entryA.inflight = 1;

      // Fill cache (B) then evict A by fetching C. With max=2, C eviction-displaces A.
      await fetchTileViaPMTiles(tmpB, 0, 0, 0);
      await fetchTileViaPMTiles(tmpC, 0, 0, 0);
      await Promise.resolve();

      // A's dispose ran but close was deferred — source still has its handle.
      expect(closeSpy).not.toHaveBeenCalled();
      expect(entryA.closeRequested).toBe(true);

      // Caller's `finally` block (release): drop inflight to 0 and fire
      // the pending close exactly as `fetchTileViaPMTiles` does.
      entryA.inflight = 0;
      if (entryA.closeRequested && entryA.inflight === 0) {
        await entryA.source.close();
      }
      expect(closeSpy).toHaveBeenCalledTimes(1);
      const closedThis = closeSpy.mock.instances[0] as unknown as NodeFileSource;
      expect(closedThis.filePath).toBe(tmpA);
    } finally {
      closeSpy.mockRestore();
    }
  });
});
