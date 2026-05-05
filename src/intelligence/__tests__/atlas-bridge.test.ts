/**
 * W4c — atlas-bridge HTTP-side command tests.
 *
 * Verifies that the 14 atlas commands installed by `installAtlasCommands()` into
 * the dashboard-bridge dispatch correctly against an in-process KBStore.
 *
 * Each test seeds a fresh registry + project DB in tmpdir, populates a small
 * synthetic snapshot (symbols + calls + provenance rows), drives commands through
 * the HTTP bridge via mock req/res, and asserts response shape parity with the
 * Tauri command layer in `src-tauri/src/intelligence/atlas.rs`.
 *
 * Empty-state contract: missing snapshots / unknown ids must return `[]`,
 * never an error.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIntelligenceBridge } from '../dashboard-bridge.js';
import { KBStore } from '../kb/store.js';
import { ATLAS_COMMANDS } from '../atlas-bridge.js';
import type { ProjectId, SnapshotId } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../db/migrations');

interface MockResponse {
  status: number | null;
  headers: Record<string, string>;
  body: string;
  writeHead(s: number, h?: Record<string, string>): MockResponse;
  end(b?: string): MockResponse;
}

function makeRes(): MockResponse {
  const res: MockResponse = {
    status: null,
    headers: {},
    body: '',
    writeHead(s, h) {
      res.status = s;
      if (h) Object.assign(res.headers, h);
      return res;
    },
    end(b) {
      res.body = b ?? '';
      return res;
    },
  };
  return res;
}

interface SeedResult {
  kb: KBStore;
  projectId: ProjectId;
  snapshotId: SnapshotId;
  cleanup: () => void;
}

const SNAP: SnapshotId = 'snap-w4c-1';
const PROJ: ProjectId = 'P-w4c-test';

async function seed(): Promise<SeedResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), 'w4c-atlas-bridge-'));
  const registryPath = join(tmpDir, 'registry.db');
  const projectPath = join(tmpDir, 'project');
  mkdirSync(projectPath, { recursive: true });

  const kb = new KBStore({ registryPath, migrationsDir: MIGRATIONS_DIR });
  await kb.ensureRegistry();

  await kb.registerProject({
    id: PROJ,
    name: 'W4c Bridge Test',
    path: projectPath,
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await kb.ensureProjectDB(PROJ);

  // Seed a snapshot row that the snapshot-keyed atlas commands can resolve.
  const snap = await kb.writeSnapshot({
    project_id: PROJ,
    taken_at: new Date().toISOString(),
    files_scanned: 1,
    loc_total: 10,
  });
  // Pin the snapshot id to a known string so cross-call assertions hold.
  const db = await kb.getProjectRawDB(PROJ);
  db.prepare('UPDATE snapshots SET id = ? WHERE id = ?').run(SNAP, snap.id);

  // Seed two symbols (caller + callee) plus one call edge + one reference.
  db.prepare(
    `INSERT INTO symbols
       (id, snapshot_id, project_id, file_path, kind, name, qualified_name,
        start_byte, end_byte, start_line, end_line, signature_hash,
        modifiers_json, language, parent_symbol_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('sym-A', SNAP, PROJ, 'src/foo.ts', 'function', 'foo', 'foo', 0, 50, 1, 5, null, '[]', 'ts', null);
  db.prepare(
    `INSERT INTO symbols
       (id, snapshot_id, project_id, file_path, kind, name, qualified_name,
        start_byte, end_byte, start_line, end_line, signature_hash,
        modifiers_json, language, parent_symbol_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('sym-B', SNAP, PROJ, 'src/foo.ts', 'function', 'bar', 'bar', 60, 100, 7, 12, null, '[]', 'ts', null);

  db.prepare(
    `INSERT INTO calls
       (id, snapshot_id, caller_symbol_id, callee_symbol_id,
        call_site_byte, call_site_line, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run('call-1', SNAP, 'sym-A', 'sym-B', 30, 3, 1.0);

  db.prepare(
    `INSERT INTO symbol_references
       (id, snapshot_id, file_path, start_byte, end_byte, start_line, end_line,
        name, resolved_symbol_id, resolution_confidence, resolution_kind)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('ref-1', SNAP, 'src/foo.ts', 30, 33, 3, 3, 'bar', 'sym-B', 1.0, 'call');

  db.prepare(
    `INSERT INTO type_relations
       (id, snapshot_id, from_symbol_id, to_symbol_id, kind, confidence)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('rel-1', SNAP, 'sym-A', 'sym-B', 'uses_type', 1.0);

  // Seed mission provenance + files-changed for the provenance-side commands.
  db.prepare(
    `INSERT INTO files_changed
       (id, mission_id, commit_sha, file_path, change_kind,
        added_lines, removed_lines)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run('fc-1', 'M-w4c', 'abc123', 'src/foo.ts', 'A', 10, 0);

  db.prepare(
    `INSERT INTO mission_provenance
       (id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run('mp-1', SNAP, 'src/foo.ts', 3, 'M-w4c', 'abc123', 1.0);

  return {
    kb,
    projectId: PROJ,
    snapshotId: SNAP,
    cleanup: () => {
      try {
        kb.close();
      } catch {
        /* swallow close errors during teardown */
      }
      try {
        rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* swallow cleanup errors */
      }
    },
  };
}

async function invokeBridge(
  bridge: ReturnType<typeof createIntelligenceBridge>,
  cmd: string,
  args: Record<string, unknown> = {},
): Promise<{ status: number; body: unknown }> {
  const res = makeRes();
  await bridge.handle(
    { method: 'POST', url: '/api/intelligence/invoke' },
    res,
    JSON.stringify({ cmd, args }),
  );
  return {
    status: res.status ?? 0,
    body: res.body ? JSON.parse(res.body) : null,
  };
}

describe('W4c — atlas commands over HTTP bridge', () => {
  let s: SeedResult;

  beforeEach(async () => {
    s = await seed();
  });

  afterEach(() => {
    s.cleanup();
  });

  it('catalog: ATLAS_COMMANDS exposes exactly 14 commands', () => {
    const names = Object.keys(ATLAS_COMMANDS).sort();
    expect(names).toEqual(
      [
        'atlas_find_symbols_by_qualified_name',
        'atlas_get_symbol',
        'atlas_invalidate_cache',
        'atlas_list_callees',
        'atlas_list_callers',
        'atlas_list_files_changed_by_mission',
        'atlas_list_missions_for_file',
        'atlas_list_provenance_for_line',
        'atlas_list_references_for_symbol',
        'atlas_list_symbols_for_file',
        'atlas_list_symbols_in_snapshot',
        'atlas_list_type_relations_from',
        'atlas_list_type_relations_to',
        'atlas_request_index_snapshot',
      ],
    );
  });

  it('atlas_list_symbols_for_file returns seeded symbols', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_symbols_for_file', {
      snapshotId: s.snapshotId,
      filePath: 'src/foo.ts',
    });
    expect(r.status).toBe(200);
    const rows = r.body as Array<{ id: string; name: string }>;
    expect(rows.length).toBe(2);
    expect(rows.map((s) => s.id).sort()).toEqual(['sym-A', 'sym-B']);
    bridge.close();
  });

  it('atlas_list_symbols_in_snapshot returns all symbols in snapshot (no filters)', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_symbols_in_snapshot', {
      snapshotId: s.snapshotId,
    });
    expect(r.status).toBe(200);
    expect((r.body as unknown[]).length).toBe(2);
    bridge.close();
  });

  it('atlas_get_symbol returns a single symbol by id', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_get_symbol', { id: 'sym-A' });
    expect(r.status).toBe(200);
    const sym = r.body as { id: string; name: string };
    expect(sym.id).toBe('sym-A');
    expect(sym.name).toBe('foo');
    bridge.close();
  });

  it('atlas_get_symbol returns null for unknown id', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_get_symbol', { id: 'sym-DOES-NOT-EXIST' });
    expect(r.status).toBe(200);
    expect(r.body).toBeNull();
    bridge.close();
  });

  it('atlas_find_symbols_by_qualified_name resolves QN', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_find_symbols_by_qualified_name', {
      snapshotId: s.snapshotId,
      qn: 'foo',
    });
    expect(r.status).toBe(200);
    expect((r.body as Array<{ id: string }>)[0].id).toBe('sym-A');
    bridge.close();
  });

  it('atlas_list_callers returns the caller of a symbol', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_callers', { symbolId: 'sym-B' });
    expect(r.status).toBe(200);
    const edges = r.body as Array<{ caller_symbol_id: string }>;
    expect(edges.length).toBe(1);
    expect(edges[0].caller_symbol_id).toBe('sym-A');
    bridge.close();
  });

  it('atlas_list_callees returns the callee of a symbol', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_callees', { symbolId: 'sym-A' });
    expect(r.status).toBe(200);
    const edges = r.body as Array<{ callee_symbol_id: string }>;
    expect(edges.length).toBe(1);
    expect(edges[0].callee_symbol_id).toBe('sym-B');
    bridge.close();
  });

  it('atlas_list_references_for_symbol returns refs', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_references_for_symbol', {
      symbolId: 'sym-B',
    });
    expect(r.status).toBe(200);
    expect((r.body as unknown[]).length).toBe(1);
    bridge.close();
  });

  it('atlas_list_type_relations_from + to return seeded relation', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const fromR = await invokeBridge(bridge, 'atlas_list_type_relations_from', { symbolId: 'sym-A' });
    const toR = await invokeBridge(bridge, 'atlas_list_type_relations_to', { symbolId: 'sym-B' });
    expect(fromR.status).toBe(200);
    expect(toR.status).toBe(200);
    expect((fromR.body as unknown[]).length).toBe(1);
    expect((toR.body as unknown[]).length).toBe(1);
    bridge.close();
  });

  it('atlas_list_files_changed_by_mission returns mission rows', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_files_changed_by_mission', {
      missionId: 'M-w4c',
    });
    expect(r.status).toBe(200);
    expect((r.body as Array<{ file_path: string }>)[0].file_path).toBe('src/foo.ts');
    bridge.close();
  });

  it('atlas_list_missions_for_file returns mission summaries', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_missions_for_file', {
      snapshotId: s.snapshotId,
      filePath: 'src/foo.ts',
    });
    expect(r.status).toBe(200);
    const missions = r.body as Array<{ mission_id: string; line_count: number }>;
    expect(missions[0].mission_id).toBe('M-w4c');
    expect(missions[0].line_count).toBeGreaterThan(0);
    bridge.close();
  });

  it('atlas_list_provenance_for_line returns provenance rows', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_provenance_for_line', {
      snapshotId: s.snapshotId,
      filePath: 'src/foo.ts',
      lineNo: 3,
    });
    expect(r.status).toBe(200);
    expect((r.body as Array<{ mission_id: string }>)[0].mission_id).toBe('M-w4c');
    bridge.close();
  });

  it('atlas_invalidate_cache (no projectId) returns scope=all', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_invalidate_cache', {});
    expect(r.status).toBe(200);
    const out = r.body as { scope: string; evicted_count: number };
    expect(out.scope).toBe('all');
    expect(typeof out.evicted_count).toBe('number');
    bridge.close();
  });

  it('atlas_invalidate_cache (with projectId) returns scope=project', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_invalidate_cache', { projectId: PROJ });
    expect(r.status).toBe(200);
    expect((r.body as { scope: string }).scope).toBe('project');
    bridge.close();
  });

  it('empty-state: unknown snapshot → empty array (not error)', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_symbols_for_file', {
      snapshotId: 'nonexistent-snapshot',
      filePath: 'src/foo.ts',
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
    bridge.close();
  });

  it('empty-state: unknown mission → empty array', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_list_files_changed_by_mission', {
      missionId: 'M-DOES-NOT-EXIST',
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
    bridge.close();
  });

  it('atlas_request_index_snapshot rejects when projectId is missing', async () => {
    const bridge = createIntelligenceBridge(undefined, { kb: s.kb });
    const r = await invokeBridge(bridge, 'atlas_request_index_snapshot', {
      snapshotId: 'snap-new',
      // projectId intentionally omitted
    });
    // Browser-mode requires explicit projectId — must surface as 500 with descriptive error.
    expect(r.status).toBe(500);
    const err = r.body as { error: string };
    expect(err.error).toMatch(/projectId is required/);
    bridge.close();
  });
});
