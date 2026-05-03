/**
 * C04 T3 — Project registration & sort tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';
import type { Project } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;
let store: KBStore;

function makeStore() {
  return new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
}

function makeProject(id: string, override: Partial<Omit<Project, 'id' | 'last_snapshot_id'>> = {}): Omit<Project, 'last_snapshot_id'> {
  return {
    id,
    name: `Project ${id}`,
    path: join(tmpDir, `project-${id}`),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
    ...override,
  };
}

describe('intelligence/kb — project registration & sort', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-projects-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    store = makeStore();
    await store.ensureRegistry();
  });

  afterEach(() => {
    store.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('register 3 projects → listProjects returns all 3', async () => {
    await store.registerProject(makeProject('p1'));
    await store.registerProject(makeProject('p2'));
    await store.registerProject(makeProject('p3'));

    const projects = await store.listProjects();
    expect(projects.length).toBe(3);
    const ids = projects.map((p) => p.id).sort();
    expect(ids).toEqual(['p1', 'p2', 'p3']);
  });

  it('sort: recent → most recently active first', async () => {
    const old = new Date(Date.now() - 100_000).toISOString();
    const mid = new Date(Date.now() - 50_000).toISOString();
    const recent = new Date().toISOString();

    await store.registerProject(makeProject('p-old', { last_activity_at: old }));
    await store.registerProject(makeProject('p-mid', { last_activity_at: mid }));
    await store.registerProject(makeProject('p-new', { last_activity_at: recent }));

    const projects = await store.listProjects({ sort: 'recent' });
    expect(projects[0].id).toBe('p-new');
    expect(projects[1].id).toBe('p-mid');
    expect(projects[2].id).toBe('p-old');
  });

  it('sort: priority → high first, then activity desc within priority', async () => {
    const now = new Date().toISOString();
    const earlier = new Date(Date.now() - 10_000).toISOString();

    await store.registerProject(makeProject('p-low', { priority: 'low', last_activity_at: now }));
    await store.registerProject(makeProject('p-high-1', { priority: 'high', last_activity_at: earlier }));
    await store.registerProject(makeProject('p-high-2', { priority: 'high', last_activity_at: now }));
    await store.registerProject(makeProject('p-med', { priority: 'med', last_activity_at: now }));

    const projects = await store.listProjects({ sort: 'priority' });
    // high comes first (priority ASC with high < low < med alphabetically, but actually:
    // SQLite text sort: 'high' < 'low' < 'med' alphabetically)
    expect(projects[0].priority).toBe('high');
    expect(projects[1].priority).toBe('high');
    // Within high, most recently active first
    expect(projects[0].id).toBe('p-high-2');
    expect(projects[1].id).toBe('p-high-1');
  });

  it('sort: findings → projects ordered by open-finding count desc', async () => {
    const projectPath1 = join(tmpDir, 'project-f1');
    const projectPath2 = join(tmpDir, 'project-f2');
    const projectPath3 = join(tmpDir, 'project-f3');

    await store.registerProject(makeProject('f1', { path: projectPath1 }));
    await store.registerProject(makeProject('f2', { path: projectPath2 }));
    await store.registerProject(makeProject('f3', { path: projectPath3 }));

    // Set up project DBs with different finding counts
    await store.ensureProjectDB('f1');
    await store.ensureProjectDB('f2');
    await store.ensureProjectDB('f3');

    // Write snapshots for each project
    const s1 = await store.writeSnapshot({ project_id: 'f1', taken_at: new Date().toISOString(), files_scanned: 0, loc_total: 0 });
    const s2 = await store.writeSnapshot({ project_id: 'f2', taken_at: new Date().toISOString(), files_scanned: 0, loc_total: 0 });
    const s3 = await store.writeSnapshot({ project_id: 'f3', taken_at: new Date().toISOString(), files_scanned: 0, loc_total: 0 });

    const makeFindings = (projectId: string, snapshotId: string, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `F-${projectId}-${i}` as const,
        project_id: projectId,
        kind: 'dead_code' as const,
        severity: 'low' as const,
        confidence: 0.8,
        title: `Finding ${i}`,
        rationale: 'test',
        produced_by: 'analyzer' as const,
        produced_at: new Date().toISOString(),
        snapshot_id: snapshotId,
        status: 'open' as const,
      }));

    await store.writeFindings(s1.id, 'f1', makeFindings('f1', s1.id, 5));
    await store.writeFindings(s2.id, 'f2', makeFindings('f2', s2.id, 10));
    await store.writeFindings(s3.id, 'f3', makeFindings('f3', s3.id, 2));

    const projects = await store.listProjects({ sort: 'findings' });
    expect(projects[0].id).toBe('f2'); // 10 findings
    expect(projects[1].id).toBe('f1'); // 5 findings
    expect(projects[2].id).toBe('f3'); // 2 findings
  });

  it('getProject returns the registered project', async () => {
    await store.registerProject(makeProject('p-get'));
    const p = await store.getProject('p-get');
    expect(p).not.toBeNull();
    expect(p?.id).toBe('p-get');
    expect(p?.name).toBe('Project p-get');
  });

  it('getProject returns null for unknown id', async () => {
    const p = await store.getProject('nonexistent');
    expect(p).toBeNull();
  });
});
