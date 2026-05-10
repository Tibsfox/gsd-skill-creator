/**
 * Atlas spatial-substrate HTTP IPC handlers.
 *
 * Component 02 of the gis-spatial-substrate Part B mission. Adapts to the
 * actual atlas IPC surface — the `scripts/serve-dashboard.mjs` HTTP server
 * with `pathname === '/api/atlas/...'` routing.
 *
 * Three new endpoints (all GET):
 *   /api/atlas/spatial-near?x&y&radius&limit&project_id
 *   /api/atlas/mission-bbox?project_id&mission_id
 *   /api/atlas/tile-fetch?z&x&y&pmtiles_name
 *
 * Post-REVIEW.md remediation 2026-05-10:
 *   - Responses use the existing dashboard `{ok: true, ...}` / `{ok: false, error}`
 *     envelope (MED-01 fix).
 *   - `parseIntOr` / `parseFloatOr` reject partial-numeric strings like
 *     "12abc" instead of silently accepting them (MED-02 fix).
 *   - `mission-bbox` JOIN drops the `snapshot_id` equality clause; that
 *     equation was incorrect — provenance and symbol snapshots have
 *     different semantics (HIGH-03 fix).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { ATLAS_SRID, DEFAULT_RADIUS, DEFAULT_LIMIT } from './format-constants.js';
import type { PgQueryable } from './hybrid-query.js';
import type {
  SpatialNearResultEntry,
  MissionBBox,
  BoundingBox,
} from './ipc-schemas.js';

// ── envelope helpers ────────────────────────────────────────────────────────

function sendOk<T extends object>(res: ServerResponse, body: T): void {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, ...body }));
}

function sendError(res: ServerResponse, status: number, error: string): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: false, error }));
}

function parseQuery(url: string): URLSearchParams {
  return new URL(url, 'http://_').searchParams;
}

/**
 * Reject partial-numeric input ("12abc" → fallback, not 12). Pattern check
 * up front so we don't return an integer that came from `Number.parseInt`'s
 * lenient prefix-only behaviour.
 */
function parseFloatOr(s: string | null, fallback: number): number {
  if (s === null) return fallback;
  if (!/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) return fallback;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function parseIntOr(s: string | null, fallback: number): number {
  if (s === null) return fallback;
  if (!/^-?\d+$/.test(s)) return fallback;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ── GET /api/atlas/spatial-near ────────────────────────────────────────────

export async function handleSpatialNear(
  req: IncomingMessage,
  res: ServerResponse,
  client: PgQueryable,
): Promise<void> {
  const q = parseQuery(req.url ?? '');
  const x = parseFloatOr(q.get('x'), Number.NaN);
  const y = parseFloatOr(q.get('y'), Number.NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return sendError(res, 400, 'spatial-near: x and y are required and must be numeric');
  }
  const radius = parseFloatOr(q.get('radius'), DEFAULT_RADIUS);
  const limit = parseIntOr(q.get('limit'), DEFAULT_LIMIT);
  const projectId = q.get('project_id');

  const sql = `
    SELECT
      s.project_id, s.id AS symbol_id, s.qualified_name, s.kind, s.file_path,
      ST_X(s.position) AS x,
      ST_Y(s.position) AS y,
      ST_Distance(s.position, ST_SetSRID(ST_MakePoint($1, $2), ${ATLAS_SRID})) AS distance
    FROM atlas.symbols s
    WHERE s.position IS NOT NULL
      AND ST_DWithin(s.position, ST_SetSRID(ST_MakePoint($1, $2), ${ATLAS_SRID}), $3)
      AND ($5::text IS NULL OR s.project_id = $5)
    ORDER BY distance
    LIMIT $4;
  `;
  try {
    const r = await client.query<{
      project_id: string; symbol_id: string;
      qualified_name: string; kind: string; file_path: string;
      x: number; y: number; distance: number;
    }>(sql, [x, y, radius, limit, projectId]);
    const symbols: SpatialNearResultEntry[] = r.rows.map((row) => ({
      project_id: row.project_id,
      symbol_id: row.symbol_id,
      position: { x: row.x, y: row.y },
      distance: row.distance,
    }));
    return sendOk(res, { symbols });
  } catch (e) {
    return sendError(res, 500, `spatial-near: ${(e as Error).message}`);
  }
}

// ── GET /api/atlas/mission-bbox ────────────────────────────────────────────

export async function handleMissionBBox(
  req: IncomingMessage,
  res: ServerResponse,
  client: PgQueryable,
): Promise<void> {
  const q = parseQuery(req.url ?? '');
  const projectId = q.get('project_id');
  const missionId = q.get('mission_id');
  if (!projectId || !missionId) {
    return sendError(res, 400, 'mission-bbox: project_id and mission_id are required');
  }

  // HIGH-03 fix: drop the s.snapshot_id = mp.snapshot_id clause. provenance
  // is anchored at the mission's authoring snapshot; symbols are stored at
  // the latest indexer snapshot. Joining on (project_id, file_path,
  // line BETWEEN start_line..end_line) is the correct per-symbol predicate.
  const sql = `
    SELECT
      ST_XMin(extent) AS min_x, ST_YMin(extent) AS min_y,
      ST_XMax(extent) AS max_x, ST_YMax(extent) AS max_y,
      file_count, symbol_count
    FROM (
      SELECT
        ST_Extent(s.position) AS extent,
        COUNT(DISTINCT s.file_path) AS file_count,
        COUNT(DISTINCT s.id) AS symbol_count
      FROM atlas.symbols s
      JOIN atlas.mission_provenance mp
        ON mp.project_id = s.project_id
       AND mp.file_path = s.file_path
       AND mp.line_no BETWEEN s.start_line AND s.end_line
      WHERE s.position IS NOT NULL
        AND s.project_id = $1
        AND mp.mission_id = $2
    ) e;
  `;
  try {
    const r = await client.query<{
      min_x: number | null; min_y: number | null;
      max_x: number | null; max_y: number | null;
      file_count: string | number; symbol_count: string | number;
    }>(sql, [projectId, missionId]);
    const row = r.rows[0];
    if (!row || row.min_x === null) {
      return sendError(res, 404, `mission-bbox: no symbols matched (project=${projectId}, mission=${missionId})`);
    }
    const bbox: BoundingBox = {
      min_x: row.min_x as number, min_y: row.min_y as number,
      max_x: row.max_x as number, max_y: row.max_y as number,
    };
    const body: MissionBBox = {
      project_id: projectId,
      mission_id: missionId,
      bbox,
      file_count: Number(row.file_count) || 0,
      symbol_count: Number(row.symbol_count) || 0,
    };
    return sendOk(res, body);
  } catch (e) {
    return sendError(res, 500, `mission-bbox: ${(e as Error).message}`);
  }
}

// ── GET /api/atlas/tile-fetch ──────────────────────────────────────────────

export type TileReader = (
  pmtilesPath: string,
  z: number,
  x: number,
  y: number,
) => Promise<Buffer | null>;

export async function handleTileFetch(
  req: IncomingMessage,
  res: ServerResponse,
  reader: TileReader,
  resolvePmtilesPath: (name: string | null) => string,
): Promise<void> {
  const q = parseQuery(req.url ?? '');
  const z = parseIntOr(q.get('z'), Number.NaN);
  const x = parseIntOr(q.get('x'), Number.NaN);
  const y = parseIntOr(q.get('y'), Number.NaN);
  if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return sendError(res, 400, 'tile-fetch: z, x, y are required and must be integers');
  }
  const pmtilesName = q.get('pmtiles_name');

  let path: string;
  try {
    path = resolvePmtilesPath(pmtilesName);
  } catch (e) {
    return sendError(res, 400, `tile-fetch: ${(e as Error).message}`);
  }

  try {
    const tile = await reader(path, z, x, y);
    if (!tile) {
      return sendError(res, 404, `tile-fetch: tile not found at z=${z} x=${x} y=${y}`);
    }
    return sendOk(res, {
      tile_b64: tile.toString('base64'),
      content_type: 'application/x-protobuf' as const,
    });
  } catch (e) {
    const msg = (e as Error).message;
    let status = 500;
    if (/not implemented/i.test(msg)) status = 501;
    else if (/zoom level exceeds|outside zoom level bounds/i.test(msg)) status = 400;
    return sendError(res, status, `tile-fetch: ${msg}`);
  }
}
