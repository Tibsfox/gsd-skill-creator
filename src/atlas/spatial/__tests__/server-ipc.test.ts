import { describe, it, expect } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { handleSpatialNear, handleMissionBBox, handleTileFetch, type TileReader } from '../server-ipc.js';
import type { PgQueryable } from '../hybrid-query.js';

/**
 * Server-IPC handlers — exercised against a mock pg client and synthetic
 * IncomingMessage / ServerResponse. The actual `scripts/serve-dashboard.mjs`
 * wiring is documented at ../server-ipc-wiring.md; these tests verify the
 * handler logic in isolation.
 */

function mockClient(rows: unknown[] = [], capture: { sql?: string; values?: unknown[] } = {}): PgQueryable {
  return {
    query: async <R>(text: string, values?: unknown[]) => {
      capture.sql = text;
      capture.values = values;
      return { rows: rows as R[], rowCount: rows.length };
    },
  };
}

function makeReqRes(url: string): {
  req: IncomingMessage;
  res: ServerResponse & { _body?: string; _status?: number; _headers: Record<string, string> };
  finished: Promise<void>;
} {
  // Build a minimal IncomingMessage / ServerResponse pair without spinning a
  // real socket. We use the http module's createServer→requestListener pattern
  // by instantiating handles on-the-fly. Vitest under Node makes this cheap.
  const headers: Record<string, string> = {};
  let body = '';
  let status = 200;
  let resolveFn: () => void = () => {};
  const finished = new Promise<void>((r) => { resolveFn = r; });
  const req = { url, method: 'GET' } as IncomingMessage;
  const res = {
    _headers: headers,
    setHeader(name: string, value: string) { headers[name.toLowerCase()] = value; },
    set statusCode(v: number) { status = v; },
    get statusCode() { return status; },
    end(chunk?: string) {
      if (chunk) body += chunk;
      (this as { _body?: string })._body = body;
      (this as { _status?: number })._status = status;
      resolveFn();
    },
    write(chunk: string) { body += chunk; return true; },
  } as unknown as ServerResponse & { _body?: string; _status?: number; _headers: Record<string, string> };
  return { req, res, finished };
}

describe('handleSpatialNear', () => {
  it('400 when x/y missing', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/spatial-near?radius=100');
    await handleSpatialNear(req, res, mockClient([]));
    await finished;
    expect(res._status).toBe(400);
    expect(JSON.parse(res._body!)).toMatchObject({ ok: false });
    expect(JSON.parse(res._body!).error).toMatch(/x and y/);
  });

  it('200 with typed body when x/y supplied', async () => {
    const fakeRow = {
      project_id: 'p', symbol_id: 's1',
      qualified_name: 'foo.bar', kind: 'function', file_path: 'src/foo.ts',
      x: 100, y: 200, distance: 5.0,
    };
    const { req, res, finished } = makeReqRes('/api/atlas/spatial-near?x=100&y=200&radius=300&limit=10');
    await handleSpatialNear(req, res, mockClient([fakeRow]));
    await finished;
    expect(res._status).toBe(200);
    const body = JSON.parse(res._body!);
    expect(body.ok).toBe(true);
    expect(body.symbols).toHaveLength(1);
    expect(body.symbols[0].position).toEqual({ x: 100, y: 200 });
    expect(body.symbols[0].distance).toBe(5.0);
  });

  it('passes project_id when present', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    const { req, res, finished } = makeReqRes('/api/atlas/spatial-near?x=0&y=0&radius=10&project_id=gsd-skill-creator');
    await handleSpatialNear(req, res, mockClient([], cap));
    await finished;
    expect(cap.values![4]).toBe('gsd-skill-creator');
  });

  it('uses defaults for radius/limit when omitted', async () => {
    const cap: { sql?: string; values?: unknown[] } = {};
    const { req, res, finished } = makeReqRes('/api/atlas/spatial-near?x=0&y=0');
    await handleSpatialNear(req, res, mockClient([], cap));
    await finished;
    expect(cap.values![2]).toBe(200); // DEFAULT_RADIUS
    expect(cap.values![3]).toBe(50);  // DEFAULT_LIMIT
  });
});

describe('handleMissionBBox', () => {
  it('400 when project_id/mission_id missing', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/mission-bbox?project_id=p');
    await handleMissionBBox(req, res, mockClient([]));
    await finished;
    expect(res._status).toBe(400);
  });

  it('404 when no symbols matched', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/mission-bbox?project_id=p&mission_id=m');
    await handleMissionBBox(req, res, mockClient([{
      min_x: null, min_y: null, max_x: null, max_y: null,
      file_count: 0, symbol_count: 0,
    }]));
    await finished;
    expect(res._status).toBe(404);
  });

  it('200 with bbox when match found', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/mission-bbox?project_id=p&mission_id=m');
    await handleMissionBBox(req, res, mockClient([{
      min_x: 100, min_y: 200, max_x: 500, max_y: 600,
      file_count: 12, symbol_count: 145,
    }]));
    await finished;
    expect(res._status).toBe(200);
    const body = JSON.parse(res._body!);
    expect(body.ok).toBe(true);
    expect(body.bbox).toEqual({ min_x: 100, min_y: 200, max_x: 500, max_y: 600 });
    expect(body.file_count).toBe(12);
    expect(body.symbol_count).toBe(145);
  });
});

describe('handleTileFetch', () => {
  const stubResolver = (name: string | null) => `/tmp/atlas/${name ?? 'symbols'}.pmtiles`;

  it('400 when z/x/y missing', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/tile-fetch?z=1');
    await handleTileFetch(req, res, async () => null, stubResolver);
    await finished;
    expect(res._status).toBe(400);
  });

  it('404 when tile reader returns null', async () => {
    const { req, res, finished } = makeReqRes('/api/atlas/tile-fetch?z=0&x=0&y=0');
    await handleTileFetch(req, res, async () => null, stubResolver);
    await finished;
    expect(res._status).toBe(404);
  });

  it('200 with base64 body when reader returns bytes', async () => {
    const reader: TileReader = async () => Buffer.from('hello');
    const { req, res, finished } = makeReqRes('/api/atlas/tile-fetch?z=0&x=0&y=0');
    await handleTileFetch(req, res, reader, stubResolver);
    await finished;
    expect(res._status).toBe(200);
    const body = JSON.parse(res._body!);
    expect(body.ok).toBe(true);
    expect(Buffer.from(body.tile_b64, 'base64').toString()).toBe('hello');
    expect(body.content_type).toBe('application/x-protobuf');
  });

  it('501 when reader throws "not implemented"', async () => {
    const reader: TileReader = async () => { throw new Error('not implemented'); };
    const { req, res, finished } = makeReqRes('/api/atlas/tile-fetch?z=0&x=0&y=0');
    await handleTileFetch(req, res, reader, stubResolver);
    await finished;
    expect(res._status).toBe(501);
  });
});
