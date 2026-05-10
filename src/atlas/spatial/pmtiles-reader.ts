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
 * Concurrency invariants (post-REVIEW.md remediation 2026-05-10):
 *   - `NodeFileSource` promise-caches its file-handle open so concurrent
 *     first-callers share a single descriptor (HIGH-02 fix).
 *   - `archiveCache` raises `max` to 64 (handles are cheap) and defers
 *     `dispose`-driven close behind a 30-second grace window so in-flight
 *     reads don't hit a closed fd (HIGH-01 interim fix; refcount-based
 *     close is the long-term plan).
 *   - `resolvePmtilesPath` rejects names whose resolved path escapes the
 *     configured `ATLAS_PMTILES_DIR` (MED-03 fix).
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
 */
export function validatePMTilesMagic(path: string): boolean {
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
 * fix). Caller may `close()` to release; the LRU below also closes after a
 * grace window when an entry is evicted.
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
 * Archive-instance LRU. Each entry holds a NodeFileSource (one open file
 * handle) plus pmtiles@4's internal directory cache.
 *
 * `max: 64` keeps eviction rare under typical load. `dispose` defers close
 * behind a 30-second grace window so any in-flight `getZxy` (which may
 * issue a deferred root→leaf second range read) completes before the
 * underlying fd disappears (HIGH-01 fix). Refcount-based close is the
 * long-term plan; the grace window is the interim correctness guarantee.
 */
const ARCHIVE_CLOSE_GRACE_MS = 30_000;
const archiveCache = new LRUCache<string, PMTiles>({
  max: 64,
  dispose: (archive) => {
    const src = archive.source as NodeFileSource;
    if (src && typeof src.close === 'function') {
      setTimeout(() => { void src.close(); }, ARCHIVE_CLOSE_GRACE_MS).unref();
    }
  },
});

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
 * Get-or-create a PMTiles archive for the given path. Re-uses the file
 * handle across calls.
 */
function getArchive(path: string): PMTiles {
  let archive = archiveCache.get(path);
  if (!archive) {
    archive = new PMTiles(new NodeFileSource(path));
    archiveCache.set(path, archive);
  }
  return archive;
}

/**
 * Fetch a single tile from a PMTiles file. Returns the tile bytes or `null`
 * if the tile is absent at (z, x, y). Throws if the file is not a valid
 * PMTiles archive.
 */
export async function fetchTileViaPMTiles(
  path: string,
  z: number,
  x: number,
  y: number,
): Promise<Buffer | null> {
  if (!validatePMTilesMagic(path)) {
    throw new Error(`pmtiles file missing magic bytes or unreadable: ${path}`);
  }

  const cacheKey = `${path}|${z}|${x}|${y}`;
  const cached = tileBodyCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const archive = getArchive(path);
  const tile = await archive.getZxy(z, x, y);
  if (!tile) return null;

  const buf = Buffer.from(tile.data);
  tileBodyCache.set(cacheKey, buf);
  return buf;
}

/**
 * Type-safe wrapper that takes a TileCoord and routes to fetchTileViaPMTiles.
 */
export async function fetchTileForCoord(
  pmtilesPath: string,
  coord: TileCoord,
): Promise<Buffer | null> {
  return fetchTileViaPMTiles(pmtilesPath, coord.z, coord.x, coord.y);
}

/**
 * Test / ops hook: clear the in-memory caches. Called by tests between cases
 * and by ops to force a re-read after a swap. The grace-window-deferred
 * source closes are NOT awaited — they fire asynchronously on the unref'd
 * timer queue.
 */
export function clearPmtilesCaches(): void {
  archiveCache.clear();
  tileBodyCache.clear();
}

/** Diagnostic: cache occupancy for ops dashboards. */
export function pmtilesCacheStats(): { archives: number; tiles: number } {
  return { archives: archiveCache.size, tiles: tileBodyCache.size };
}
