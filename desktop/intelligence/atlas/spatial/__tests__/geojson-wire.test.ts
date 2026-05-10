import { describe, it, expect } from 'vitest';
import { spatialNearToFeatureCollection, fetchSpatialNear } from '../geojson-wire.js';
import type { SpatialNearResponse } from '../../../../../src/atlas/spatial/ipc-schemas.js';

describe('spatialNearToFeatureCollection', () => {
  it('empty response → empty FeatureCollection', () => {
    const fc = spatialNearToFeatureCollection({ symbols: [] });
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(0);
  });

  it('maps SpatialNearResponse rows into Point features', () => {
    const resp: SpatialNearResponse = {
      symbols: [
        { project_id: 'p', symbol_id: 's1', position: { x: 100, y: 200 }, distance: 5.0 },
        { project_id: 'p', symbol_id: 's2', position: { x: 110, y: 195 }, distance: 11.2 },
      ],
    };
    const fc = spatialNearToFeatureCollection(resp);
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]!.geometry.type).toBe('Point');
    expect(fc.features[0]!.geometry.coordinates).toEqual([100, 200]);
    expect(fc.features[0]!.properties).toEqual({
      symbol_id: 's1', project_id: 'p', distance: 5.0,
    });
  });
});

describe('fetchSpatialNear', () => {
  it('builds the GET URL with x/y/radius/limit', async () => {
    const captured: { url?: string; init?: RequestInit } = {};
    const stubFetch = (async (url: string, init?: RequestInit) => {
      captured.url = url;
      captured.init = init;
      return new Response(JSON.stringify({ symbols: [] }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    await fetchSpatialNear('/api/atlas/spatial-near', { point: { x: 50, y: 60 }, radius: 100, limit: 25 }, stubFetch);
    expect(captured.url).toContain('x=50');
    expect(captured.url).toContain('y=60');
    expect(captured.url).toContain('radius=100');
    expect(captured.url).toContain('limit=25');
    expect(captured.init?.method).toBe('GET');
  });

  it('appends project_id when provided', async () => {
    const captured: { url?: string } = {};
    const stubFetch = (async (url: string) => {
      captured.url = url;
      return new Response('{"symbols":[]}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    await fetchSpatialNear('/api/atlas/spatial-near', { point: { x: 0, y: 0 }, radius: 10, limit: 5, project_id: 'gsd-skill-creator' }, stubFetch);
    expect(captured.url).toContain('project_id=gsd-skill-creator');
  });

  it('throws on non-2xx response', async () => {
    const stubFetch = (async () => new Response('oops', { status: 500, statusText: 'Server Error' })) as typeof fetch;
    await expect(
      fetchSpatialNear('/api/atlas/spatial-near', { point: { x: 0, y: 0 }, radius: 10, limit: 5 }, stubFetch),
    ).rejects.toThrow(/HTTP 500/);
  });
});
