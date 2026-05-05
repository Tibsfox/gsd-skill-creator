/**
 * Atlas KB — event-driven cache invalidation tests (v1.49.607 G2).
 *
 * Verifies that KBStore subscribes to atlas:indexing.completed via the event
 * bus wired through setEventBus() and auto-invalidates the atlas KB cache for
 * the indexed project. Also verifies subscription lifecycle (close() removes it).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { KBStore } from '../store.js';
import { applyMigrations } from '../migrations.js';
import type { ProjectId } from '../../types.js';
import type { EventBus, IntelligenceEvent } from '../../events/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_A = 'proj-a' as ProjectId;
const PROJECT_B = 'proj-b' as ProjectId;

// ─── Minimal stub bus ─────────────────────────────────────────────────────────

type Subscriber = (event: IntelligenceEvent) => void;

class StubBus implements EventBus<IntelligenceEvent> {
  private readonly _subs: Set<Subscriber> = new Set();
  readonly published: IntelligenceEvent[] = [];

  subscribe(cb: Subscriber): () => void {
    this._subs.add(cb);
    return () => this._subs.delete(cb);
  }

  publish(event: IntelligenceEvent): void {
    this.published.push(event);
    const snap = Array.from(this._subs);
    for (const cb of snap) cb(event);
  }

  get subscriberCount(): number {
    return this._subs.size;
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

function buildProjectDB(projectDir: string, projectId: ProjectId): void {
  const dbDir = join(projectDir, '.gsd', 'intelligence');
  mkdirSync(dbDir, { recursive: true });
  const dbPath = join(dbDir, 'intelligence.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db, MIGRATIONS_DIR);
  db.prepare(
    `INSERT OR IGNORE INTO projects
       (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(projectId, `Project ${projectId}`, projectDir, 'dev', 'code', 'med', new Date().toISOString(), null);
  db.close();
}

function registerProjectInRegistry(registryPath: string, projectDir: string, projectId: ProjectId): void {
  const reg = new Database(registryPath);
  reg.pragma('journal_mode = WAL');
  reg.pragma('foreign_keys = ON');
  applyMigrations(reg, MIGRATIONS_DIR);
  reg.prepare(
    `INSERT OR IGNORE INTO projects
       (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(projectId, `Project ${projectId}`, projectDir, 'dev', 'code', 'med', new Date().toISOString(), null);
  reg.close();
}

// ─── Test setup ───────────────────────────────────────────────────────────────

let tmpDir: string;
let registryPath: string;
let store: KBStore;
let bus: StubBus;

beforeEach(() => {
  tmpDir = join(
    tmpdir(),
    `gsd-g2-invalidation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(tmpDir, { recursive: true });
  registryPath = join(tmpDir, 'registry.db');

  // Set up two projects
  for (const [id, dir] of [[PROJECT_A, join(tmpDir, 'proj-a')], [PROJECT_B, join(tmpDir, 'proj-b')]] as const) {
    mkdirSync(dir, { recursive: true });
    buildProjectDB(dir, id);
    registerProjectInRegistry(registryPath, dir, id);
  }

  store = new KBStore({ registryPath, migrationsDir: MIGRATIONS_DIR });
  bus = new StubBus();
});

afterEach(() => {
  store.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('intelligence/kb — event-driven cache invalidation (G2)', () => {
  it('atlas:indexing.completed for projectId X invalidates X cached KB', async () => {
    await store.ensureRegistry();
    store.setEventBus(bus);

    // Warm the cache for project A.
    const kb1 = await store.getAtlasSymbolsKB(PROJECT_A);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);

    // Publish indexing.completed for project A.
    bus.publish({
      type: 'atlas:indexing.completed',
      payload: {
        snapshot_id: 'snap-001',
        project_id: PROJECT_A,
        symbols_count: 10,
        calls_count: 5,
        files_count: 3,
      },
    });

    // Cache for A must be evicted.
    expect(store.cachedAtlasSymbolsKBCount()).toBe(0);

    // Next accessor returns a fresh instance.
    const kb2 = await store.getAtlasSymbolsKB(PROJECT_A);
    expect(kb2).not.toBe(kb1);
  });

  it('atlas:indexing.completed for projectId X does NOT invalidate Y cached KB', async () => {
    await store.ensureRegistry();
    store.setEventBus(bus);

    // Warm both projects.
    await store.getAtlasSymbolsKB(PROJECT_A);
    const kbB = await store.getAtlasSymbolsKB(PROJECT_B);
    expect(store.cachedAtlasSymbolsKBCount()).toBe(2);

    // Publish indexing.completed for project A only.
    bus.publish({
      type: 'atlas:indexing.completed',
      payload: {
        snapshot_id: 'snap-002',
        project_id: PROJECT_A,
        symbols_count: 7,
        calls_count: 2,
        files_count: 2,
      },
    });

    // A is gone; B remains.
    expect(store.cachedAtlasSymbolsKBCount()).toBe(1);
    const kbBAfter = await store.getAtlasSymbolsKB(PROJECT_B);
    expect(kbBAfter).toBe(kbB);
  });

  it('close() removes the subscription — publishing after close does not throw', async () => {
    await store.ensureRegistry();
    store.setEventBus(bus);

    const subCountBefore = bus.subscriberCount;
    expect(subCountBefore).toBeGreaterThan(0);

    store.close();

    // Subscriber must be removed.
    expect(bus.subscriberCount).toBe(0);

    // Publishing must not throw even though the store is closed.
    expect(() => {
      bus.publish({
        type: 'atlas:indexing.completed',
        payload: {
          snapshot_id: 'snap-003',
          project_id: PROJECT_A,
          symbols_count: 0,
          calls_count: 0,
          files_count: 0,
        },
      });
    }).not.toThrow();
  });

  it('atlas:cache.invalidated telemetry event is published after auto-invalidation', async () => {
    await store.ensureRegistry();
    store.setEventBus(bus);

    await store.getAtlasSymbolsKB(PROJECT_A);

    bus.publish({
      type: 'atlas:indexing.completed',
      payload: {
        snapshot_id: 'snap-004',
        project_id: PROJECT_A,
        symbols_count: 1,
        calls_count: 0,
        files_count: 1,
      },
    });

    const invalidatedEvents = bus.published.filter(
      (e) => e.type === 'atlas:cache.invalidated',
    );
    expect(invalidatedEvents).toHaveLength(1);
    expect(invalidatedEvents[0].type).toBe('atlas:cache.invalidated');
    if (invalidatedEvents[0].type === 'atlas:cache.invalidated') {
      expect(invalidatedEvents[0].payload.project_id).toBe(PROJECT_A);
    }
  });
});
