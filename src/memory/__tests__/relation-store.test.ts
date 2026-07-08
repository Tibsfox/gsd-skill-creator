import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileRelationStore } from '../relation-store.js';
import type { MemoryRelation, RelationType } from '../types.js';

function makeRelation(overrides: Partial<MemoryRelation> = {}): MemoryRelation {
  const now = new Date();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    subjectId: overrides.subjectId ?? crypto.randomUUID(),
    predicate: (overrides.predicate ?? 'elaborates') as RelationType,
    objectId: overrides.objectId ?? crypto.randomUUID(),
    validFrom: overrides.validFrom ?? now,
    validTo: overrides.validTo ?? null,
    confidence: overrides.confidence ?? 1.0,
    createdAt: overrides.createdAt ?? now,
  };
}

describe('FileRelationStore (MEM-5)', () => {
  let dir: string;
  let path: string;
  let store: FileRelationStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-rel-'));
    path = join(dir, 'relations.json');
    store = new FileRelationStore(path);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('starts empty when no file exists', async () => {
    expect(await store.all()).toEqual([]);
  });

  it('adds a relation and reads it back', async () => {
    const rel = makeRelation();
    expect(await store.add(rel)).toBe(true);
    const all = await store.all();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(rel.id);
    expect(all[0].validFrom).toBeInstanceOf(Date);
  });

  it('persists relations across a fresh instance (survives restart)', async () => {
    const rel = makeRelation({ subjectId: 'a', objectId: 'b', predicate: 'derives-from' });
    await store.add(rel);

    // A brand-new store reading the same file — simulates a process restart.
    const reopened = new FileRelationStore(path);
    const all = await reopened.all();
    expect(all.length).toBe(1);
    expect(all[0].subjectId).toBe('a');
    expect(all[0].objectId).toBe('b');
    expect(all[0].predicate).toBe('derives-from');
    expect(all[0].createdAt).toBeInstanceOf(Date);
  });

  it('is idempotent on the same id', async () => {
    const rel = makeRelation();
    expect(await store.add(rel)).toBe(true);
    expect(await store.add(rel)).toBe(false);
    expect((await store.all()).length).toBe(1);
  });

  it('dedups an active (subject,predicate,object) tuple with a different id', async () => {
    const first = makeRelation({ subjectId: 'a', predicate: 'elaborates', objectId: 'b' });
    const dupTuple = makeRelation({ subjectId: 'a', predicate: 'elaborates', objectId: 'b' });
    expect(await store.add(first)).toBe(true);
    expect(await store.add(dupTuple)).toBe(false);
    expect((await store.all()).length).toBe(1);
  });

  it('getForMemory returns relations where the memory is subject or object', async () => {
    await store.add(makeRelation({ subjectId: 'a', objectId: 'b' }));
    await store.add(makeRelation({ subjectId: 'c', objectId: 'a' }));
    await store.add(makeRelation({ subjectId: 'x', objectId: 'y' }));

    const forA = await store.getForMemory('a');
    expect(forA.length).toBe(2);
  });

  it('getForMemory excludes deprecated (validTo set) relations', async () => {
    await store.add(makeRelation({ subjectId: 'a', objectId: 'b', validTo: new Date() }));
    expect(await store.getForMemory('a')).toEqual([]);
  });

  it('getRelatedIds returns the opposite endpoints, excluding self', async () => {
    await store.add(makeRelation({ subjectId: 'a', objectId: 'b' }));
    await store.add(makeRelation({ subjectId: 'c', objectId: 'a' }));

    const ids = await store.getRelatedIds('a');
    expect(ids.sort()).toEqual(['b', 'c']);
  });

  it('writes valid JSON that a plain reader can parse', async () => {
    await store.add(makeRelation({ subjectId: 'a', objectId: 'b' }));
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].subjectId).toBe('a');
    // Dates serialize as ISO strings on disk.
    expect(typeof parsed[0].createdAt).toBe('string');
  });

  it('tolerates a corrupt file by returning an empty graph', async () => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path, 'not json{{{', 'utf-8');
    const corrupt = new FileRelationStore(path);
    expect(await corrupt.all()).toEqual([]);
  });

  // ── LoaderContext chokepoint (Tier-E) ──────────────────────────────────

  describe('LoaderContext chokepoint integration', () => {
    it('all() emits exactly one audit record per call, gated on the file path', async () => {
      const { CapturingAuditSink, defaultLoaderContext } = await import(
        '../../security/loader-context.js'
      );
      const sink = new CapturingAuditSink();
      const ctx = defaultLoaderContext(sink);
      const wired = new FileRelationStore(path, ctx);
      await wired.all();
      expect(sink.records.length).toBe(1);
      expect(sink.records[0]?.op).toBe('read-file');
      expect(sink.records[0]?.target).toBe(path);
    });

    it('throws LoaderContextDenied when ctx rejects the path', async () => {
      const { LoaderContextDenied, CapturingAuditSink } = await import(
        '../../security/loader-context.js'
      );
      const sink = new CapturingAuditSink();
      const restrictiveCtx = { allowList: [], audit: sink };
      const wired = new FileRelationStore(path, restrictiveCtx);
      await expect(wired.all()).rejects.toThrow(LoaderContextDenied);
      expect(sink.records[0]?.allowed).toBe(false);
    });

    it('legacy permissive mode (no ctx) preserves prior behavior', async () => {
      const legacy = new FileRelationStore(path);
      await legacy.add(makeRelation({ subjectId: 'a', objectId: 'b' }));
      expect((await legacy.all()).length).toBe(1);
    });
  });
});
