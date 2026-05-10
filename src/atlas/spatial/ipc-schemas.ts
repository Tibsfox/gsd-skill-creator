/**
 * IPC message shapes for the atlas spatial substrate.
 *
 * Wave 0. The handler implementation lives in `server-ipc.ts` (component 02);
 * the browser-side caller lives under `desktop/` (component 04). Both sides
 * import from this file so the contract is single-sourced.
 */

import type {
  SpatialPoint,
  BoundingBox,
  SymbolPosition,
  MissionBBox,
  TileCoord,
} from './types.js';

// ── spatial-near ──────────────────────────────────────────────────────────

export interface SpatialNearRequest {
  /** Search anchor in atlas logical coordinates (SRID 0). */
  point: SpatialPoint;
  /** Search radius in logical units. */
  radius: number;
  /** Cap on results returned. */
  limit: number;
  /** Optional project filter; if omitted, searches across all projects. */
  project_id?: string;
}

export interface SpatialNearResultEntry extends SymbolPosition {
  /** ST_Distance from the query point to the symbol's position. */
  distance: number;
}

export interface SpatialNearResponse {
  symbols: SpatialNearResultEntry[];
}

// ── mission-bbox ──────────────────────────────────────────────────────────

export interface MissionBBoxRequest {
  project_id: string;
  mission_id: string;
}

export type MissionBBoxResponse = MissionBBox;

// ── tile-fetch ────────────────────────────────────────────────────────────

export interface TileFetchRequest extends TileCoord {
  /** Path to the .pmtiles file relative to the snapshot dir. */
  pmtiles_name?: string;
}

export interface TileFetchResponse {
  /** Base64-encoded MVT tile bytes. Empty if tile not present at coord. */
  tile_b64: string;
  /** Tile MIME type. PMTiles v3 default is application/x-protobuf. */
  content_type: 'application/x-protobuf';
}

// Re-export the type-bag so other modules can `import {…} from './ipc-schemas'` once.
export type { SpatialPoint, BoundingBox, SymbolPosition, MissionBBox, TileCoord };
