/**
 * GeoJSON wire format conversions for atlas spatial IPC.
 *
 * Component 04. Bridges the IPC schemas in `src/atlas/spatial/ipc-schemas.ts`
 * to the GeoJSON shapes the symbol-graph and archeology renderers consume.
 *
 * RFC 7946 declares WGS84 coordinate ordering. The atlas works in logical
 * coordinates (SRID 0) — `[x, y]` ordering is preserved verbatim; renderers
 * interpret values as layout coordinates, not lng/lat.
 */

import type {
  SpatialNearResponse,
  SpatialPoint,
} from '../../../../src/atlas/spatial/ipc-schemas.js';
import type { GeoFeatureCollection, GeoPoint } from './turf-like.js';

interface SpatialNearProps {
  symbol_id: string;
  project_id: string;
  distance: number;
}

/**
 * Convert a server `spatial-near` response into a GeoJSON FeatureCollection
 * the symbol-graph renderer can consume directly. Each feature carries
 * `symbol_id`, `project_id`, and `distance` properties.
 */
export function spatialNearToFeatureCollection(
  resp: SpatialNearResponse,
): GeoFeatureCollection<GeoPoint> {
  return {
    type: 'FeatureCollection',
    features: resp.symbols.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.position.x, s.position.y] as [number, number] },
      properties: {
        symbol_id: s.symbol_id,
        project_id: s.project_id,
        distance: s.distance,
      } satisfies SpatialNearProps,
    })),
  };
}

/**
 * Issue an HTTP request to the atlas spatial-near endpoint. Browser-side
 * helper used by the symbol-graph view's spatial-halo mode.
 */
export async function fetchSpatialNear(
  endpoint: string,
  params: { point: SpatialPoint; radius: number; limit: number; project_id?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<SpatialNearResponse> {
  const u = new URL(endpoint, 'http://_'); // base only used to make URL parser happy if endpoint is relative
  u.searchParams.set('x', String(params.point.x));
  u.searchParams.set('y', String(params.point.y));
  u.searchParams.set('radius', String(params.radius));
  u.searchParams.set('limit', String(params.limit));
  if (params.project_id) u.searchParams.set('project_id', params.project_id);

  const url = endpoint.startsWith('http') ? u.toString() : `${u.pathname}?${u.searchParams}`;
  const r = await fetchImpl(url, { method: 'GET' });
  if (!r.ok) {
    throw new Error(`fetchSpatialNear: HTTP ${r.status} ${r.statusText}`);
  }
  return (await r.json()) as SpatialNearResponse;
}
