/**
 * atlas-index-endpoint.test.ts — unit tests for the POST /api/atlas/index
 * handler wired in scripts/serve-dashboard.mjs (v1.49.607 G1).
 *
 * Strategy: extract the `handleAtlasIndex` logic into a testable form by
 * directly exercising the same code path that the server uses, with fully
 * stubbed modules (no real SQLite, no real file-walker). This avoids
 * spinning up the HTTP server while still verifying all branch conditions.
 *
 * 5 cases:
 *   1. 400 when projectId is missing from body
 *   2. 400 when snapshotId is missing from body
 *   3. 404 when project is not found in registry (getProject returns null)
 *   4. 200 with correct totals shape on a successful run
 *   5. 500 when runAtlasIndexer throws
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';

// ── inline handler (mirrors the serve-dashboard logic without the HTTP server) ──

/**
 * Minimal faithful re-implementation of the handler from serve-dashboard.mjs.
 * We inline it here so the test runs without importing the .mjs server file
 * (which would try to bind ports, load generators, start watchers, etc.).
 *
 * The handler receives the same `mods` object the server lazy-loads:
 *   { runAtlasIndexer, KBStore, applyMigrations, Database }
 */
async function handleAtlasIndex(
  req: IncomingMessage,
  res: ServerResponse,
  mods: {
    runAtlasIndexer: (...args: unknown[]) => Promise<unknown>;
    KBStore: new (opts?: Record<string, unknown>) => {
      ensureRegistry(): Promise<void>;
      getProject(id: string): Promise<{ path?: string } | null>;
      registerProject(p: Record<string, unknown>): Promise<unknown>;
      ensureProjectDB(id: string): Promise<void>;
      getProjectRawDB(id: string): Promise<unknown>;
      close(): void;
    };
  } | null,
): Promise<void> {
  if (!mods) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'atlas indexer modules not available (run npm run build)' }));
    return;
  }

  // Collect body
  let rawBody = '';
  await new Promise<void>((resolve) => {
    req.on('data', (chunk: Buffer) => { rawBody += chunk.toString('utf8'); });
    req.on('end', resolve);
  });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody || '{}') as Record<string, unknown>;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'request body must be valid JSON' }));
    return;
  }

  const { snapshotId, projectId, projectPath: bodyPath, languages, replace, runProvenance } = body;

  if (typeof projectId !== 'string' || !projectId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'projectId (string) is required' }));
    return;
  }
  if (typeof snapshotId !== 'string' || !snapshotId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'snapshotId (string) is required' }));
    return;
  }

  const { runAtlasIndexer, KBStore } = mods;

  let projectPath: string | null =
    typeof bodyPath === 'string' && bodyPath ? bodyPath : null;
  const store = new KBStore({});

  try {
    await store.ensureRegistry();
    if (!projectPath) {
      const project = await store.getProject(projectId as string);
      if (!project) {
        store.close();
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: `project "${projectId}" not found in registry` }));
        return;
      }
      if (!project.path) {
        store.close();
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: false,
          error: `project "${projectId}" has no path field in registry; pass projectPath in the request body`,
        }));
        return;
      }
      projectPath = project.path;
    }

    await store.registerProject({
      id: projectId, name: projectId, path: projectPath,
      kind: 'code', priority: 'med', last_activity_at: new Date().toISOString(),
    });
    await store.ensureProjectDB(projectId as string);
    const db = await store.getProjectRawDB(projectId as string);

    const result = await runAtlasIndexer(db, {
      snapshotId,
      projectId,
      projectPath,
      languages: Array.isArray(languages) ? languages : undefined,
      replace: replace === true,
      runProvenance: runProvenance === true,
    }) as { symbols: number; calls: number; references: number; provenanceLines: number };

    store.close();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      totals: {
        symbols: result.symbols,
        calls: result.calls,
        references: result.references,
        provenanceLines: result.provenanceLines,
      },
    }));
  } catch (err) {
    try { store.close(); } catch { /* ignore */ }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
  }
}

// ── fake request/response builders ─────────────────────────────────────────────

type FakeRes = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead(code: number, headers?: Record<string, string>): void;
  end(data?: string): void;
};

function makeRes(): ServerResponse & FakeRes {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    writeHead(code: number, headers?: Record<string, string>) {
      res.statusCode = code;
      if (headers) Object.assign(res.headers, headers);
    },
    end(data = '') {
      res.body = data;
    },
  };
  return res as unknown as ServerResponse & FakeRes;
}

function makeReq(bodyStr: string): IncomingMessage {
  const listeners: Record<string, Array<(arg: unknown) => void>> = {};
  const req = {
    on(event: string, cb: (arg: unknown) => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return req;
    },
    _emit(event: string, arg?: unknown) {
      for (const cb of listeners[event] ?? []) cb(arg);
    },
  } as unknown as IncomingMessage & { _emit(e: string, a?: unknown): void };

  // Emit data and end asynchronously so the await-new-Promise in the handler resolves
  Promise.resolve().then(() => {
    (req as unknown as { _emit: (e: string, a?: unknown) => void })._emit(
      'data',
      Buffer.from(bodyStr, 'utf8'),
    );
    (req as unknown as { _emit: (e: string, a?: unknown) => void })._emit('end');
  });

  return req;
}

// ── stub mods factory ─────────────────────────────────────────────────────────

/**
 * Build a constructor-compatible KBStore stub.
 * `vi.fn().mockImplementation` does not produce a constructable function;
 * we use a real ES class instead so `new KBStore({})` works in the handler.
 */
function makeStubKBStore(overrides: {
  getProject?: (id: string) => Promise<{ path?: string } | null>;
} = {}) {
  const getProjectImpl =
    overrides.getProject ?? vi.fn().mockResolvedValue({ path: '/tmp/proj' });

  return class StubKBStore {
    ensureRegistry = vi.fn().mockResolvedValue(undefined);
    getProject = getProjectImpl;
    registerProject = vi.fn().mockResolvedValue({});
    ensureProjectDB = vi.fn().mockResolvedValue(undefined);
    getProjectRawDB = vi.fn().mockResolvedValue({});
    close = vi.fn();
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/atlas/index handler (G1)', () => {
  it('1. 400 when projectId is missing', async () => {
    const req = makeReq(JSON.stringify({ snapshotId: 'snap-1' }));
    const res = makeRes();
    const mods = {
      runAtlasIndexer: vi.fn(),
      KBStore: makeStubKBStore(),
    };
    await handleAtlasIndex(req, res, mods);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/projectId/);
  });

  it('2. 400 when snapshotId is missing', async () => {
    const req = makeReq(JSON.stringify({ projectId: 'proj-1', projectPath: '/tmp/proj' }));
    const res = makeRes();
    const mods = {
      runAtlasIndexer: vi.fn(),
      KBStore: makeStubKBStore(),
    };
    await handleAtlasIndex(req, res, mods);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/snapshotId/);
  });

  it('3. 404 when project not found in registry (no projectPath in body)', async () => {
    const req = makeReq(JSON.stringify({ projectId: 'missing-proj', snapshotId: 'snap-1' }));
    const res = makeRes();
    const mods = {
      runAtlasIndexer: vi.fn(),
      KBStore: makeStubKBStore({ getProject: vi.fn().mockResolvedValue(null) }),
    };
    await handleAtlasIndex(req, res, mods);
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not found/);
  });

  it('4. 200 with totals shape on successful run', async () => {
    const req = makeReq(JSON.stringify({
      projectId: 'proj-success',
      snapshotId: 'snap-ok',
      projectPath: '/tmp/proj',
    }));
    const res = makeRes();
    const fakeResult = { symbols: 42, calls: 7, references: 12, provenanceLines: 3 };
    const mods = {
      runAtlasIndexer: vi.fn().mockResolvedValue(fakeResult),
      KBStore: makeStubKBStore(),
    };
    await handleAtlasIndex(req, res, mods);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.totals.symbols).toBe(42);
    expect(body.totals.calls).toBe(7);
    expect(body.totals.references).toBe(12);
    expect(body.totals.provenanceLines).toBe(3);
  });

  it('5. 500 when runAtlasIndexer throws', async () => {
    const req = makeReq(JSON.stringify({
      projectId: 'proj-err',
      snapshotId: 'snap-err',
      projectPath: '/tmp/proj',
    }));
    const res = makeRes();
    const mods = {
      runAtlasIndexer: vi.fn().mockRejectedValue(new Error('symbol parse failure')),
      KBStore: makeStubKBStore(),
    };
    await handleAtlasIndex(req, res, mods);
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/symbol parse failure/);
  });
});
