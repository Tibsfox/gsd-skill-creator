/**
 * FlatGeobuf snapshot exporter for the atlas spatial substrate.
 *
 * Component 06. Serializes atlas.symbols to a `.fgb` (FlatGeobuf) binary file
 * with embedded packed Hilbert R-tree spatial index. Output is HTTP-range-
 * request-friendly and serves as an offline / static-distribution mirror of
 * the canonical SQLite snapshot. The PG mirror remains the source of truth;
 * FlatGeobuf is an additional export path.
 *
 * Post-REVIEW.md remediation 2026-05-10:
 *   - HIGH-04: removed the `whereExtra` parameter — it was unparameterized
 *     SQL interpolation guarded only by JSDoc. Filters live as typed options.
 *   - LOW-02: bbox computation in `readFlatGeobufRoundTrip` uses a single
 *     reduce-loop instead of `Math.min(...arr)`, which stack-overflows
 *     past ~100K elements.
 *
 * Reference: Part A research mission §2.5.6 (FlatGeobuf).
 */

import { writeFileSync } from 'node:fs';
import type { PgQueryable } from './hybrid-query.js';
import { ATLAS_SRID, FLATGEOBUF_MAGIC } from './format-constants.js';

export interface ExportOpts {
  pgClient: PgQueryable;
  /** Where to write the .fgb file. */
  outPath: string;
  /** Optional project filter; if omitted, exports all projects. */
  projectId?: string;
  /** Optional kind filter (e.g. 'function', 'class'); bound as a typed parameter. */
  kindFilter?: string;
}

export interface ExportReport {
  out_path: string;
  bytes_written: number;
  row_count: number;
  bbox: [number, number, number, number];
  /** True when the upstream flatgeobuf package was used. False on stub fall-through. */
  upstream_flatgeobuf_available: boolean;
}

/**
 * Export atlas.symbols → FlatGeobuf file. Reads geometry + minimal attributes
 * (id, qualified_name, kind, file_path) from the live PostGIS-augmented
 * mirror and serializes via the upstream library when available.
 *
 * Round-trip parity invariant (asserted by tests once upstream lands):
 * row count + bbox + per-feature geometry are bit-identical between the
 * source PostGIS read and the read-back from the .fgb file.
 */
export async function exportToFlatGeobuf(opts: ExportOpts): Promise<ExportReport> {
  const projectFilter = opts.projectId ?? null;
  const kindFilter = opts.kindFilter ?? null;

  // 1. Bounding box.
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
        AND ($2::text IS NULL OR kind = $2)
    ) e;
  `, [projectFilter, kindFilter])).rows[0];

  if (!bboxRow || bboxRow.min_x === null) {
    throw new Error('exportToFlatGeobuf: atlas.symbols has no positions to export');
  }
  const bbox: [number, number, number, number] = [
    bboxRow.min_x as number, bboxRow.min_y as number,
    bboxRow.max_x as number, bboxRow.max_y as number,
  ];

  // 2. Read all rows + geometry as GeoJSON.
  const rowsResult = await opts.pgClient.query<{
    id: string; qualified_name: string; kind: string; file_path: string;
    geom_json: string;
  }>(`
    SELECT id, qualified_name, kind, file_path,
           ST_AsGeoJSON(position) AS geom_json
    FROM atlas.symbols
    WHERE position IS NOT NULL
      AND ($1::text IS NULL OR project_id = $1)
      AND ($2::text IS NULL OR kind = $2);
  `, [projectFilter, kindFilter]);

  const rowCount = rowsResult.rowCount ?? rowsResult.rows.length;

  // 3. Build a GeoJSON FeatureCollection.
  const featureCollection = {
    type: 'FeatureCollection' as const,
    crs: { type: 'name', properties: { name: `EPSG:${ATLAS_SRID}` } },
    features: rowsResult.rows.map((row) => ({
      type: 'Feature' as const,
      geometry: JSON.parse(row.geom_json) as { type: 'Point'; coordinates: [number, number] },
      properties: {
        id: row.id, qualified_name: row.qualified_name,
        kind: row.kind, file_path: row.file_path,
      },
    })),
  };

  // 4. Serialize via the upstream library if available.
  type FgbMod = { serialize?: (fc: unknown) => Uint8Array };
  let mod: FgbMod | null = null;
  try {
    mod = (await import('flatgeobuf/dist/flatgeobuf-geojson.js' as string)) as unknown as FgbMod;
  } catch {
    // Fallback path: stub file with magic bytes only. NOT a conformant
    // FlatGeobuf — exists so integration tests can verify wiring.
    const stubBytes = Buffer.concat([
      Buffer.from(FLATGEOBUF_MAGIC),
      Buffer.from(`STUB:${rowCount}:${bbox.join(',')}`, 'utf-8'),
    ]);
    writeFileSync(opts.outPath, stubBytes);
    return {
      out_path: opts.outPath,
      bytes_written: stubBytes.length,
      row_count: rowCount,
      bbox,
      upstream_flatgeobuf_available: false,
    };
  }
  if (!mod || !mod.serialize) {
    throw new Error('flatgeobuf package present but `serialize` not found (version mismatch?)');
  }

  const fgbBytes = mod.serialize(featureCollection);
  writeFileSync(opts.outPath, Buffer.from(fgbBytes));

  return {
    out_path: opts.outPath,
    bytes_written: fgbBytes.length,
    row_count: rowCount,
    bbox,
    upstream_flatgeobuf_available: true,
  };
}

/**
 * Quick read-back parity check: compares row count + bbox of a written
 * FlatGeobuf file against the source PG metrics. Used by the integration
 * gate (component 07) and round-trip parity tests.
 *
 * Falls back to "unverified" when upstream `flatgeobuf` isn't present.
 *
 * LOW-02 fix: bbox computation uses a reduce-loop instead of
 * `Math.min(...arr)` so it doesn't stack-overflow at multi-million-feature
 * scale.
 */
export async function readFlatGeobufRoundTrip(
  path: string,
): Promise<{
  row_count: number | null;
  bbox: [number, number, number, number] | null;
  upstream_available: boolean;
}> {
  type FgbReadMod = { deserialize?: (data: Uint8Array) => unknown };
  let mod: FgbReadMod | null = null;
  try {
    mod = (await import('flatgeobuf/dist/flatgeobuf-geojson.js' as string)) as unknown as FgbReadMod;
  } catch {
    return { row_count: null, bbox: null, upstream_available: false };
  }
  if (!mod || !mod.deserialize) {
    return { row_count: null, bbox: null, upstream_available: false };
  }

  const { readFileSync } = await import('node:fs');
  const bytes = new Uint8Array(readFileSync(path));
  const fc = mod.deserialize(bytes) as {
    features: { geometry: { coordinates: [number, number] } }[];
  };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of fc.features) {
    const x = f.geometry.coordinates[0];
    const y = f.geometry.coordinates[1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    row_count: fc.features.length,
    bbox: fc.features.length === 0 ? [0, 0, 0, 0] : [minX, minY, maxX, maxY],
    upstream_available: true,
  };
}
