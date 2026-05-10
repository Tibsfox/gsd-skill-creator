/**
 * PMTiles v3 writer for the atlas spatial substrate.
 *
 * Component 05 (write side) of the gis-spatial-substrate Part B mission. Builds
 * a PMTiles v3 archive from atlas.symbols.position values, suitable for SCRIBE
 * Track 4 dashboard-LoD-rendering consumption and the `/api/atlas/tile-fetch`
 * IPC route.
 *
 * pmtiles@4 npm is reader-only — the canonical writer (`go-pmtiles`) is a
 * separate Go CLI. We hand-roll a TypeScript writer here against the v3 spec
 * at github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md and validate it by
 * round-tripping through `pmtiles@4`'s reader. MVT encoding delegates to
 * `vt-pbf` (MIT).
 *
 * Architecture:
 *   1. SELECT all positioned symbols from atlas.symbols once.
 *   2. For each zoom z = minZoom..maxZoom, bin symbols into tiles by (tx, ty).
 *      Cap at densityCap symbols per tile (LoD pruning).
 *   3. For each occupied tile, encode an MVT blob with vt-pbf, gzip it.
 *   4. Sort entries by tileId; serialize the root directory; build the 127-byte
 *      header; emit JSON metadata; concat into a single .pmtiles file.
 *
 * Reference: Part A research mission §2.5.7 (PMTiles).
 */

import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { Compression, TileType, zxyToTileId, tileIdToZxy, type Entry } from 'pmtiles';
// @ts-expect-error vt-pbf ships no types
import vtpbf from 'vt-pbf';
import type { PgQueryable } from './hybrid-query.js';
import { ATLAS_SRID, PMTILES_DENSITY_CAP, MVT_EXTENT } from './format-constants.js';

const HEADER_SIZE = 127;
/**
 * Maximum entries packed into the root directory before we fall back to leaf
 * directories. The pmtiles@4 reader fetches only the first 16,384 bytes of
 * the archive on `getHeader()`, then slices the root directory out of that
 * window — so the GZIP-compressed root + json metadata must fit. Empirically
 * gzipped varint-encoded entries average ~10–12 bytes each, so 1,024 entries
 * compress to ≲12 KB, leaving headroom for json metadata + the 127-byte
 * fixed header.
 */
const ROOT_ENTRY_LIMIT = 1024;
/** Entries per leaf directory when leaf splitting kicks in. */
const ENTRIES_PER_LEAF = 4096;

// ────────────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────────────

export interface BuildPyramidOpts {
  pgClient: PgQueryable;
  /** Where to write the .pmtiles file. */
  outPath: string;
  /** Default 0. */
  minZoom?: number;
  /** Default 12. */
  maxZoom?: number;
  /** Symbols-per-tile cap (LoD prune above). Default {@link PMTILES_DENSITY_CAP}. */
  densityCap?: number;
  /** MVT tile extent. Default {@link MVT_EXTENT}. */
  tileExtent?: number;
  /** Optional project filter. If omitted, builds across all projects. */
  projectId?: string;
  /** Layer name in the MVT (default `'symbols'`). */
  layerName?: string;
}

export interface BuildPyramidReport {
  out_path: string;
  bytes_written: number;
  tiles_emitted: number;
  empty_tiles_skipped: number;
  zoom_range: [number, number];
  bbox: [number, number, number, number];
  upstream_pmtiles_available: true;
}

interface SymbolPoint {
  id: string;
  x: number;
  y: number;
  qualified_name: string;
  kind: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Varint + uint64 helpers (mirror pmtiles@4 reader's `readVarint` + `getUint64`)
// ────────────────────────────────────────────────────────────────────────────

function encodeVarint(out: number[], n: number): void {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`encodeVarint: invalid value ${n}`);
  }
  while (n >= 0x80) {
    out.push((n & 0x7f) | 0x80);
    n = Math.floor(n / 128);
  }
  out.push(n & 0xff);
}

function writeUint64LE(view: DataView, offset: number, n: number): void {
  if (n < 0 || !Number.isFinite(n)) {
    throw new Error(`writeUint64LE: invalid value ${n}`);
  }
  const lo = n >>> 0;
  const hi = Math.floor(n / 0x100000000);
  view.setUint32(offset, lo, true);
  view.setUint32(offset + 4, hi, true);
}

// ────────────────────────────────────────────────────────────────────────────
// Directory serializer — mirrors the reader's `deserializeIndex`
// ────────────────────────────────────────────────────────────────────────────

export function serializeDirectory(entries: Entry[]): Uint8Array {
  // Spec: 4 varint arrays — tile_id deltas, run_lengths, lengths, offsets
  // (with the run-of-contiguous-tiles offset-skip trick).
  const out: number[] = [];
  encodeVarint(out, entries.length);

  let prevTileId = 0;
  for (const e of entries) {
    encodeVarint(out, e.tileId - prevTileId);
    prevTileId = e.tileId;
  }
  for (const e of entries) encodeVarint(out, e.runLength);
  for (const e of entries) encodeVarint(out, e.length);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    if (i > 0 && e.offset === entries[i - 1]!.offset + entries[i - 1]!.length) {
      encodeVarint(out, 0);
    } else {
      encodeVarint(out, e.offset + 1);
    }
  }
  return new Uint8Array(out);
}

// ────────────────────────────────────────────────────────────────────────────
// Header serializer — exact mirror of `bytesToHeader` in pmtiles@4
// ────────────────────────────────────────────────────────────────────────────

interface HeaderInputs {
  rootDirectoryOffset: number;
  rootDirectoryLength: number;
  jsonMetadataOffset: number;
  jsonMetadataLength: number;
  leafDirectoryOffset: number;
  leafDirectoryLength: number;
  tileDataOffset: number;
  tileDataLength: number;
  numAddressedTiles: number;
  numTileEntries: number;
  numTileContents: number;
  clustered: boolean;
  internalCompression: Compression;
  tileCompression: Compression;
  tileType: TileType;
  minZoom: number;
  maxZoom: number;
  /** Bounds in degrees * 1e7. Use 0..0 for SRID-0 logical-coord atlases. */
  minLonE7: number; minLatE7: number;
  maxLonE7: number; maxLatE7: number;
  centerZoom: number;
  centerLonE7: number; centerLatE7: number;
}

export function serializeHeader(h: HeaderInputs): Uint8Array {
  // LOW-01 fix: bounds-check zoom values that get written as single bytes.
  // Without these, h.minZoom=300 would silently wrap to 44 in the header.
  for (const [k, v] of [
    ['minZoom', h.minZoom], ['maxZoom', h.maxZoom], ['centerZoom', h.centerZoom],
  ] as const) {
    if (!Number.isInteger(v) || v < 0 || v > 31) {
      throw new RangeError(`serializeHeader: ${k}=${v} out of range [0..31]`);
    }
  }

  const buf = new Uint8Array(HEADER_SIZE);
  // PMTiles\x03
  buf.set([0x50, 0x4d, 0x54, 0x69, 0x6c, 0x65, 0x73, 0x03], 0);
  const view = new DataView(buf.buffer);
  writeUint64LE(view, 8, h.rootDirectoryOffset);
  writeUint64LE(view, 16, h.rootDirectoryLength);
  writeUint64LE(view, 24, h.jsonMetadataOffset);
  writeUint64LE(view, 32, h.jsonMetadataLength);
  writeUint64LE(view, 40, h.leafDirectoryOffset);
  writeUint64LE(view, 48, h.leafDirectoryLength);
  writeUint64LE(view, 56, h.tileDataOffset);
  writeUint64LE(view, 64, h.tileDataLength);
  writeUint64LE(view, 72, h.numAddressedTiles);
  writeUint64LE(view, 80, h.numTileEntries);
  writeUint64LE(view, 88, h.numTileContents);
  buf[96] = h.clustered ? 1 : 0;
  buf[97] = h.internalCompression;
  buf[98] = h.tileCompression;
  buf[99] = h.tileType;
  buf[100] = h.minZoom;
  buf[101] = h.maxZoom;
  view.setInt32(102, h.minLonE7, true);
  view.setInt32(106, h.minLatE7, true);
  view.setInt32(110, h.maxLonE7, true);
  view.setInt32(114, h.maxLatE7, true);
  buf[118] = h.centerZoom;
  view.setInt32(119, h.centerLonE7, true);
  view.setInt32(123, h.centerLatE7, true);
  return buf;
}

// ────────────────────────────────────────────────────────────────────────────
// MVT encoder
// ────────────────────────────────────────────────────────────────────────────

/**
 * Encode a single MVT tile from atlas-coordinate symbols.
 *
 * Atlas coords are SRID 0 (logical Cartesian, y-up). MVT coords are y-down
 * with origin at top-left of the tile. We flip y on the way in.
 */
export function encodeMvtTile(
  symbols: SymbolPoint[],
  tileBBox: { min_x: number; min_y: number; max_x: number; max_y: number },
  extent: number,
  layerName: string,
): Uint8Array {
  const dx = tileBBox.max_x - tileBBox.min_x;
  const dy = tileBBox.max_y - tileBBox.min_y;
  const features = symbols.map((s, i) => ({
    id: i + 1,
    type: 1, // GeoJSON-VT type code: Point
    geometry: [
      Math.round(((s.x - tileBBox.min_x) / dx) * extent),
      Math.round((1 - (s.y - tileBBox.min_y) / dy) * extent),
    ],
    tags: { id: s.id, qualified_name: s.qualified_name, kind: s.kind },
  }));
  const layers = { [layerName]: { features } };
  const buf = vtpbf.fromGeojsonVt(layers, { extent }) as Buffer | Uint8Array;
  // Normalize Buffer → fresh Uint8Array (avoid reference to underlying pool).
  return Uint8Array.from(buf);
}

// ────────────────────────────────────────────────────────────────────────────
// Tile bbox helper (re-exported for tests / external callers)
// ────────────────────────────────────────────────────────────────────────────

export function tileToAtlasBBox(
  atlasBBox: [number, number, number, number],
  z: number, x: number, y: number,
): { min_x: number; min_y: number; max_x: number; max_y: number } {
  const [minX, minY, maxX, maxY] = atlasBBox;
  const w = maxX - minX;
  const h = maxY - minY;
  const tilesPerAxis = 1 << z;
  return {
    min_x: minX + (x / tilesPerAxis) * w,
    min_y: minY + (y / tilesPerAxis) * h,
    max_x: minX + ((x + 1) / tilesPerAxis) * w,
    max_y: minY + ((y + 1) / tilesPerAxis) * h,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────────────────────

export async function buildSymbolTilePyramid(opts: BuildPyramidOpts): Promise<BuildPyramidReport> {
  const minZoom = opts.minZoom ?? 0;
  const maxZoom = opts.maxZoom ?? 12;
  const densityCap = opts.densityCap ?? PMTILES_DENSITY_CAP;
  const tileExtent = opts.tileExtent ?? MVT_EXTENT;
  const layerName = opts.layerName ?? 'symbols';
  const projectFilter = opts.projectId ?? null;

  if (minZoom < 0 || maxZoom > 22 || minZoom > maxZoom) {
    throw new Error(`buildSymbolTilePyramid: invalid zoom range ${minZoom}..${maxZoom}`);
  }

  // 1. Compute atlas bbox via PostGIS (single roundtrip).
  const bboxRow = (await opts.pgClient.query<{
    min_x: number | null; min_y: number | null;
    max_x: number | null; max_y: number | null;
  }>(`
    SELECT ST_XMin(extent) AS min_x, ST_YMin(extent) AS min_y,
           ST_XMax(extent) AS max_x, ST_YMax(extent) AS max_y
    FROM (
      SELECT ST_Extent(position) AS extent
      FROM atlas.symbols
      WHERE position IS NOT NULL
        AND ($1::text IS NULL OR project_id = $1)
    ) e;
  `, [projectFilter])).rows[0];

  if (!bboxRow || bboxRow.min_x === null) {
    throw new Error('buildSymbolTilePyramid: atlas.symbols has no positions to tile');
  }
  const bbox: [number, number, number, number] = [
    bboxRow.min_x as number, bboxRow.min_y as number,
    bboxRow.max_x as number, bboxRow.max_y as number,
  ];

  // 2. Load all positioned symbols in one query — bin in JS for the per-zoom pass.
  const allRows = (await opts.pgClient.query<SymbolPoint>(`
    SELECT id, ST_X(position) AS x, ST_Y(position) AS y, qualified_name, kind
    FROM atlas.symbols
    WHERE position IS NOT NULL
      AND ($1::text IS NULL OR project_id = $1);
  `, [projectFilter])).rows;

  if (allRows.length === 0) {
    throw new Error('buildSymbolTilePyramid: zero symbols passed the project filter');
  }

  // 3. For each zoom, bin into tiles and emit MVT.
  const tileBlobs: { tileId: number; bytes: Uint8Array }[] = [];
  let emptySkipped = 0;

  const [minX, minY, maxX, maxY] = bbox;
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  for (let z = minZoom; z <= maxZoom; z++) {
    const tilesPerAxis = 1 << z;
    const bins = new Map<string, SymbolPoint[]>();

    for (const s of allRows) {
      const fx = (s.x - minX) / dx;
      const fy = (s.y - minY) / dy;
      const tx = Math.min(tilesPerAxis - 1, Math.max(0, Math.floor(fx * tilesPerAxis)));
      const ty = Math.min(tilesPerAxis - 1, Math.max(0, Math.floor(fy * tilesPerAxis)));
      const key = `${tx},${ty}`;
      const arr = bins.get(key);
      if (arr) {
        if (arr.length < densityCap) arr.push(s);
      } else {
        bins.set(key, [s]);
      }
    }

    for (const [key, syms] of bins) {
      const [tx, ty] = key.split(',').map(Number) as [number, number];
      const tileBB = tileToAtlasBBox(bbox, z, tx, ty);
      const mvtBytes = encodeMvtTile(syms, tileBB, tileExtent, layerName);
      const gzipped = gzipSync(mvtBytes);
      tileBlobs.push({
        tileId: zxyToTileId(z, tx, ty),
        bytes: Uint8Array.from(gzipped),
      });
    }

    // MED-05 fix: only count empty tiles at zooms where the metric is
    // meaningful (z <= 8). At deep zooms most cells are empty by design,
    // so reporting "1.7T tiles skipped" is noise rather than signal.
    if (z <= 8) {
      emptySkipped += (tilesPerAxis * tilesPerAxis) - bins.size;
    }
  }

  if (tileBlobs.length === 0) {
    throw new Error('buildSymbolTilePyramid: no occupied tiles emitted across all zooms');
  }

  // 4. Sort by tileId (entries must be in tileId-ascending order for the directory).
  tileBlobs.sort((a, b) => a.tileId - b.tileId);

  // 5. Compute offsets in the tile_data section.
  let cursor = 0;
  const entries: Entry[] = tileBlobs.map((t) => {
    const e: Entry = { tileId: t.tileId, offset: cursor, length: t.bytes.length, runLength: 1 };
    cursor += t.bytes.length;
    return e;
  });
  const tileDataLength = cursor;

  // 6. Concatenate the tile-data section.
  const tileData = new Uint8Array(tileDataLength);
  let pos = 0;
  for (const t of tileBlobs) {
    tileData.set(t.bytes, pos);
    pos += t.bytes.length;
  }

  // 7. Serialize directories. Small archives use a single root directory; large
  //    archives split into a 2-level hierarchy: root entries with runLength=0
  //    point at gzip-compressed leaves in the leafDirectory section.
  let rootDir: Uint8Array;
  let leafBytes: Uint8Array;
  if (entries.length <= ROOT_ENTRY_LIMIT) {
    rootDir = Uint8Array.from(gzipSync(serializeDirectory(entries)));
    leafBytes = new Uint8Array(0);
  } else {
    const rootEntries: Entry[] = [];
    const leafChunks: Uint8Array[] = [];
    let leafCursor = 0;
    for (let i = 0; i < entries.length; i += ENTRIES_PER_LEAF) {
      const chunk = entries.slice(i, i + ENTRIES_PER_LEAF);
      const leafCompressed = Uint8Array.from(gzipSync(serializeDirectory(chunk)));
      rootEntries.push({
        tileId: chunk[0]!.tileId,
        offset: leafCursor,
        length: leafCompressed.length,
        runLength: 0, // marker for "this entry points at a leaf, not a tile"
      });
      leafChunks.push(leafCompressed);
      leafCursor += leafCompressed.length;
    }
    rootDir = Uint8Array.from(gzipSync(serializeDirectory(rootEntries)));
    leafBytes = new Uint8Array(leafCursor);
    let p = 0;
    for (const c of leafChunks) {
      leafBytes.set(c, p);
      p += c.length;
    }
  }
  const jsonMeta = JSON.stringify({
    name: 'atlas-symbols',
    description: 'gsd-skill-creator atlas symbol-graph tile pyramid',
    attribution: '',
    vector_layers: [{
      id: layerName,
      fields: { id: 'String', qualified_name: 'String', kind: 'String' },
      minzoom: minZoom,
      maxzoom: maxZoom,
    }],
  });
  // The reader applies header.internalCompression to root dir, leaves, AND
  // json metadata, so we gzip metadata too.
  const jsonBytes = Uint8Array.from(gzipSync(new TextEncoder().encode(jsonMeta)));

  // 8. Compute file layout.
  const rootDirOffset = HEADER_SIZE;
  const rootDirLength = rootDir.length;
  const jsonOffset = rootDirOffset + rootDirLength;
  const jsonLength = jsonBytes.length;
  const leafOffset = jsonOffset + jsonLength;
  const leafLength = leafBytes.length;
  const tileDataOffset = leafOffset + leafLength;

  // 9. Header.
  const headerBytes = serializeHeader({
    rootDirectoryOffset: rootDirOffset,
    rootDirectoryLength: rootDirLength,
    jsonMetadataOffset: jsonOffset,
    jsonMetadataLength: jsonLength,
    leafDirectoryOffset: leafOffset,
    leafDirectoryLength: leafLength,
    tileDataOffset,
    tileDataLength,
    numAddressedTiles: entries.length,
    numTileEntries: entries.length,
    numTileContents: entries.length,
    clustered: true,
    internalCompression: Compression.Gzip,
    tileCompression: Compression.Gzip,
    tileType: TileType.Mvt,
    minZoom,
    maxZoom,
    minLonE7: 0, minLatE7: 0, maxLonE7: 0, maxLatE7: 0,
    centerZoom: minZoom,
    centerLonE7: 0, centerLatE7: 0,
  });

  // 10. Concatenate + write.
  const total = HEADER_SIZE + rootDirLength + jsonLength + leafLength + tileDataLength;
  const fileBytes = new Uint8Array(total);
  fileBytes.set(headerBytes, 0);
  fileBytes.set(rootDir, rootDirOffset);
  fileBytes.set(jsonBytes, jsonOffset);
  if (leafLength > 0) fileBytes.set(leafBytes, leafOffset);
  fileBytes.set(tileData, tileDataOffset);
  writeFileSync(opts.outPath, fileBytes);

  return {
    out_path: opts.outPath,
    bytes_written: total,
    tiles_emitted: entries.length,
    empty_tiles_skipped: emptySkipped,
    zoom_range: [minZoom, maxZoom],
    bbox,
    upstream_pmtiles_available: true,
  };
}

// Note: ATLAS_SRID is referenced in the JSDoc comments but not at runtime;
// the import keeps it as a dependency anchor for any future ST_* additions.
export const _ATLAS_SRID_ANCHOR = ATLAS_SRID;
