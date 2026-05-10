/**
 * Atlas spatial-substrate shared types.
 *
 * Wave 0 of the gis-spatial-substrate mission. Cache-stable prefix consumed by
 * components 01-07. Adapted to the real `atlas.*` schema in
 * `src/intelligence/atlas-pg/schema.sql` (not the spec-aspirational
 * `atlas_symbols` flat-table layout).
 *
 * SRID 0 throughout — the atlas operates in a logical coordinate plane, not
 * WGS84 or any Earth-fixed CRS.
 */

/**
 * Logical-coordinate point. (x, y) in atlas layout space; SRID 0.
 */
export interface SpatialPoint {
  x: number;
  y: number;
}

/**
 * Axis-aligned bounding box in atlas layout space (SRID 0).
 */
export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

/**
 * A symbol's spatial position in the atlas's logical coordinate plane.
 * `symbol_id` matches `atlas.symbols.id` (composite key with project_id, but
 * the pair is normally fetched together).
 */
export interface SymbolPosition {
  project_id: string;
  symbol_id: string;
  position: SpatialPoint;
  /** Optional: bbox of the symbol's full extent (e.g. a class with members). */
  bbox?: BoundingBox;
}

/**
 * The bounding box of every symbol/file touched by a mission's commits. Computed
 * at query time via ST_Extent JOIN — no persisted column on
 * atlas.mission_provenance.
 */
export interface MissionBBox {
  project_id: string;
  mission_id: string;
  bbox: BoundingBox;
  /** Number of distinct files in atlas.files_changed for this mission. */
  file_count: number;
  /** Number of distinct symbols in atlas.mission_provenance for this mission. */
  symbol_count: number;
}

/**
 * PMTiles tile coordinate (zoom/x/y).
 */
export interface TileCoord {
  z: number;
  x: number;
  y: number;
}
