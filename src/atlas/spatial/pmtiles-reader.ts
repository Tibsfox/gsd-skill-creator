/**
 * PMTiles reader for the atlas spatial substrate.
 *
 * Component 05 (read side) of the gis-spatial-substrate Part B mission.
 *
 * Uses the upstream `pmtiles@^4` package's `PMTiles` class with a Node-side
 * `Source` implementation that does HTTP-range-equivalent file reads via
 * `fs.read` on a held file handle. Tile bodies are LRU-cached via
 * `lru-cache@^11` (replaces the `inflight`-style coalescing pattern that
 * was deprecated upstream).
 *
 * Concurrency invariants:
 *   - `NodeFileSource` promise-caches its file-handle open so concurrent
 *     first-callers share a single descriptor (HIGH-02 fix, v629).
 *   - `archiveCache` entries carry an inflight refcount; `dispose` defers
 *     the underlying `source.close()` until refcount drains to zero
 *     (HIGH-01 refcount-based close, v815, replaces the 30s grace timer).
 *     `fetchTileViaPMTiles` brackets `getZxy` with acquire/release so the
 *     refcount spans the whole multi-range-read operation, not just a
 *     single `source.getBytes` call.
 *   - `resolvePmtilesPath` rejects names whose resolved path escapes the
 *     configured `ATLAS_PMTILES_DIR` (MED-03 fix).
 *
 * Accepts an optional `LoaderContext` (Tier-E security chokepoint, v1.49.782).
 * Module-function two-site hoisted-check (#10448 sub-variant; mixed sync+async
 * ops): `validatePMTilesMagic` (sync `readFileSync`) and `fetchTileViaPMTiles`
 * (async `open` via NodeFileSource) gate independently. Eleventh LoaderContext
 * chip at v1.49.905; sibling of v892 dacp/bus/scanner.ts (pure async two-site)
 * and v903 keystore.ts (pure sync two-site).
 *
 * Reference: PMTiles v3 spec at github.com/protomaps/PMTiles/blob/main/spec/v3/
 * and Part A research mission §2.5.7.
 */

import { open, type FileHandle } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve as pathResolve, sep } from 'node:path';
import { LRUCache } from 'lru-cache';
import { PMTiles, type Source, type RangeResponse } from 'pmtiles';
import { PMTILES_MAGIC } from './format-constants.js';
import type { TileCoord } from './types.js';
import {
  ensureAllowed,
  type LoaderContext,
} from '../../security/loader-context.js';

const LOADER_SOURCE = 'atlas/spatial/pmtiles-reader';

/**
 * Resolve a `pmtiles_name` query parameter into an absolute on-disk path,
 * refusing any name whose resolved path escapes `ATLAS_PMTILES_DIR` (or `.`
 * when unset). Non-portable filename characters are replaced with `_` before
 * resolution so a hostile `pmtiles_name=../foo` cannot traverse upward.
 */
export function resolvePmtilesPath(name: string | null): string {
  const dir = pathResolve(process.env.ATLAS_PMTILES_DIR ?? '.');
  const safeName = (name ?? 'symbols').replace(/[^A-Za-z0-9._-]/g, '_');
  const out = pathResolve(dir, `${safeName}.pmtiles`);
  if (out !== dir && !out.startsWith(dir + sep)) {
    throw new Error(`resolvePmtilesPath: pmtiles_name escapes ATLAS_PMTILES_DIR (${name})`);
  }
  return out;
}

/**
 * Validate that a file's first 8 bytes match the PMTiles v3 magic.
 * Cheap check before constructing the reader.
 *
 * Optional `ctx?: LoaderContext` gates the `readFileSync` site BEFORE the
 * try/catch swallow (per #10442). Direct callers admitted through the
 * chokepoint; `fetchTileViaPMTiles` also gates independently.
 */
export function validatePMTilesMagic(path: string, ctx?: LoaderContext): boolean {
  ensureAllowed(ctx, LOADER_SOURCE, 'read-file', path);
  try {
    const buf = readFileSync(path, { flag: 'r' }).subarray(0, 8);
    if (buf.length < 8) return false;
    for (let i = 0; i < 8; i++) if (buf[i] !== PMTILES_MAGIC[i]) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Node-side `Source` impl for pmtiles@4. The file handle is opened lazily and
 * promise-cached so concurrent first-callers share one descriptor (HIGH-02
 * fix). Caller may `close()` to release; the archive LRU below also closes
 * via the refcounted dispose path once the entry's inflight count drains
 * to zero (HIGH-01 refcount-based close).
 */
export class NodeFileSource implements Source {
  /**
   * Promise of the underlying file handle. Stored as a promise (not the
   * resolved handle) so we can await it from concurrent callers without
   * racing the lazy-open. `null` means uninitialized; once set, the value
   * is stable until `close()`.
   */
  private handlePromise: Promise<FileHandle> | null = null;

  constructor(public readonly filePath: string) {}

  getKey(): string {
    return this.filePath;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    if (!this.handlePromise) this.handlePromise = open(this.filePath, 'r');
    const handle = await this.handlePromise;
    const buf = new Uint8Array(length);
    const { bytesRead } = await handle.read(buf, 0, length, offset);
    const sliced = bytesRead < length ? buf.subarray(0, bytesRead) : buf;
    const ab = sliced.buffer.slice(sliced.byteOffset, sliced.byteOffset + sliced.byteLength) as ArrayBuffer;
    return { data: ab };
  }

  async close(): Promise<void> {
    const p = this.handlePromise;
    this.handlePromise = null;
    if (p) {
      try { await (await p).close(); } catch { /* swallow close errors */ }
    }
  }
}

/**
 * Refcounted archive cache entry. `inflight` is incremented by callers
 * around `archive.getZxy(...)` and decremented in `finally`. When the LRU
 * evicts the entry, `dispose` checks `inflight`: if zero, it closes the
 * source immediately; otherwise it marks `closeRequested = true` and the
 * final `release` (the decrement that brings `inflight` back to zero)
 * triggers the actual close. This guarantees the fd survives every
 * in-flight `getZxy` even when pmtiles@4 issues deferred root→leaf range
 * reads on the same source. (HIGH-01 refcount-based close, v815.)
 */
type RefcountedArchive = {
  archive: PMTiles;
  source: NodeFileSource;
  inflight: number;
  closeRequested: boolean;
};

/**
 * Archive-instance LRU. `max: 64` keeps eviction rare under typical load.
 * Recreated lazily so `__resetArchiveCacheForTest` can swap `max` between
 * test runs.
 */
const DEFAULT_ARCHIVE_CACHE_MAX = 64;
let archiveCacheMax = DEFAULT_ARCHIVE_CACHE_MAX;
let _archiveCache: LRUCache<string, RefcountedArchive> | null = null;

function archiveCacheInstance(): LRUCache<string, RefcountedArchive> {
  if (_archiveCache) return _archiveCache;
  _archiveCache = new LRUCache<string, RefcountedArchive>({
    max: archiveCacheMax,
    dispose: (entry) => {
      if (entry.inflight === 0) {
        void entry.source.close();
      } else {
        entry.closeRequested = true;
      }
    },
  });
  return _archiveCache;
}

/**
 * Tile-body LRU. Atlas tiles are immutable for the lifetime of a snapshot,
 * so a 5-minute TTL is conservative and lets ops invalidate by restart. 256
 * entries × ~10 KB/tile ≈ 2.5 MB ceiling.
 */
const tileBodyCache = new LRUCache<string, Buffer>({
  max: 256,
  ttl: 1000 * 60 * 5,
});

/**
 * Get-or-create a refcounted archive entry for the given path. Re-uses the
 * file handle across calls. Callers MUST `entry.inflight++` before
 * awaiting `archive.getZxy(...)` and decrement in `finally`; the
 * decrement also triggers the deferred close when applicable.
 */
function getArchive(path: string): RefcountedArchive {
  const cache = archiveCacheInstance();
  let entry = cache.get(path);
  if (!entry) {
    const source = new NodeFileSource(path);
    const archive = new PMTiles(source);
    entry = { archive, source, inflight: 0, closeRequested: false };
    cache.set(path, entry);
  }
  return entry;
}

/**
 * Fetch a single tile from a PMTiles file. Returns the tile bytes or `null`
 * if the tile is absent at (z, x, y). Throws if the file is not a valid
 * PMTiles archive.
 *
 * Optional `ctx?: LoaderContext` gates the archive open (async) via the
 * NodeFileSource that backs the PMTiles archive. Hoisted at the top of
 * this function; covers the implicit `open()` performed by the cached
 * NodeFileSource on first `getBytes` call. Sibling gate at
 * `validatePMTilesMagic` also fires when this function calls into it.
 */
export async function fetchTileViaPMTiles(
  path: string,
  z: number,
  x: number,
  y: number,
  ctx?: LoaderContext,
): Promise<Buffer | null> {
  ensureAllowed(ctx, LOADER_SOURCE, 'read-file', path);
  if (!validatePMTilesMagic(path, ctx)) {
    throw new Error(`pmtiles file missing magic bytes or unreadable: ${path}`);
  }

  const cacheKey = `${path}|${z}|${x}|${y}`;
  const cached = tileBodyCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const entry = getArchive(path);
  entry.inflight++;
  try {
    const tile = await entry.archive.getZxy(z, x, y);
    if (!tile) return null;
    const buf = Buffer.from(tile.data);
    tileBodyCache.set(cacheKey, buf);
    return buf;
  } finally {
    entry.inflight--;
    if (entry.closeRequested && entry.inflight === 0) {
      void entry.source.close();
    }
  }
}

/**
 * Type-safe wrapper that takes a TileCoord and routes to fetchTileViaPMTiles.
 */
export async function fetchTileForCoord(
  pmtilesPath: string,
  coord: TileCoord,
  ctx?: LoaderContext,
): Promise<Buffer | null> {
  return fetchTileViaPMTiles(pmtilesPath, coord.z, coord.x, coord.y, ctx);
}

/**
 * Test / ops hook: clear the in-memory caches. Called by tests between cases
 * and by ops to force a re-read after a swap. Closes on evicted entries
 * fire asynchronously (deferred until inflight refcount drains to zero per
 * the v815 refcount-based close).
 */
export function clearPmtilesCaches(): void {
  _archiveCache?.clear();
  tileBodyCache.clear();
}

/** Diagnostic: cache occupancy for ops dashboards. */
export function pmtilesCacheStats(): { archives: number; tiles: number } {
  return { archives: _archiveCache?.size ?? 0, tiles: tileBodyCache.size };
}

/**
 * Test-only hook. Drops the archive cache and (optionally) sets a new `max`
 * for the next call to `archiveCacheInstance()`. Tests use a small max
 * (e.g. 2) to exercise the eviction race against a manageable archive
 * count. Pass no argument or `{ max: undefined }` to reset to the default.
 */
export function __resetArchiveCacheForTest(opts?: { max?: number }): void {
  _archiveCache?.clear();
  _archiveCache = null;
  archiveCacheMax = opts?.max ?? DEFAULT_ARCHIVE_CACHE_MAX;
}

/**
 * Test-only hook. Returns the refcounted cache entry for a path (or
 * `undefined` if not cached). Tests use this to inspect the `inflight` /
 * `closeRequested` fields and to drive the refcount through scenarios
 * that real `getZxy` calls would complete too fast to observe.
 */
export function __getArchiveEntryForTest(path: string): {
  source: NodeFileSource;
  inflight: number;
  closeRequested: boolean;
} | undefined {
  return _archiveCache?.peek(path);
}
