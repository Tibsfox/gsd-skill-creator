/**
 * Tests for SkillCodebase — the closed-loop facade that ties together
 * Grove format, SkillView, and GroveNamespace.
 *
 * Covers the full invocation path: define by name → bind → resolve by
 * name → fetch record → decode → walk dependency graph → reconstruct
 * lineage after rebinds.
 */

import { describe, it, expect } from 'vitest';
import { SkillCodebase } from './skill-codebase.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { GroveNamespace } from './grove-namespace.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import {
  hashRefEquals,
  type HashRef,
} from '../memory/grove-format.js';
import type { SkillSpec } from './skill-view.js';

// ─── Mock arena ─────────────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

function createMockArena() {
  const chunks = new Map<number, MockChunk>();
  let nextId = 1;
  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_init':
        return {
          initialized: true,
          recovered: false,
          checkpointPath: '/mock',
          journalPath: '/mock',
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier, payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0, createdAtNs: id * 1000, lastAccessNs: id * 1000,
        });
        return { chunkId: id };
      }
      case 'arena_get': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        return { chunkId, ...chunk };
      }
      case 'arena_free': {
        const { chunkId } = args as { chunkId: number };
        if (!chunks.delete(chunkId)) throw new Error(`not found: ${chunkId}`);
        return null;
      }
      case 'arena_touch': return null;
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024, freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
          allocatedBytes: 0, nextChunkId: nextId,
        };
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };
  return { invoke, size: () => chunks.size };
}

async function buildFixture() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });
  return { mock, arena, cas, codebase };
}

const sampleSpec: SkillSpec = {
  name: 'vision-to-mission',
  description: "Transform a builder vision into a GSD mission package.",
  body: '# Vision to Mission\n\nThis skill takes an idea and produces an executable mission spec.\n',
  activationPatterns: ['structure this for GSD', 'make this into a milestone'],
  dependencies: [],
};

// ─── define ──────────────────────────────────────────────────────────────────

describe('SkillCodebase.define', () => {
  it('stores a skill and binds its name', async () => {
    const { codebase } = await buildFixture();
    const result = await codebase.define(sampleSpec);

    expect(result.created).toBe(true);
    expect(result.bound).toBe(true);
    expect(result.previousHash).toBeNull();
    expect(result.hash.hash.length).toBe(32);

    const resolved = await codebase.resolve('vision-to-mission');
    expect(resolved).not.toBeNull();
    expect(resolved!.spec.name).toBe('vision-to-mission');
    expect(resolved!.spec.body).toBe(sampleSpec.body);
  });

  it('define can skip name binding when bindName = false', async () => {
    const { codebase } = await buildFixture();
    const result = await codebase.define(sampleSpec, { bindName: false });

    expect(result.bound).toBe(false);
    expect(await codebase.resolve('vision-to-mission')).toBeNull();

    // But the record is still retrievable by hash.
    const byHash = await codebase.getByHash('vision-to-mission', result.hash);
    expect(byHash).not.toBeNull();
    expect(byHash!.spec.name).toBe('vision-to-mission');
  });

  it('dedup: defining the same spec twice with linkParent=false dedupes', async () => {
    // With auto parent linking (the default), a second define legitimately
    // produces a new record whose parentHashes contains the first record —
    // so the hashes intentionally differ. Dedup only applies when the
    // records are byte-identical, which requires disabling auto-parent.
    const { codebase } = await buildFixture();
    const r1 = await codebase.define(sampleSpec, {
      createdAtMs: 1000,
      linkParent: false,
    });
    const r2 = await codebase.define(sampleSpec, {
      createdAtMs: 1000,
      linkParent: false,
    });
    expect(hashRefEquals(r1.hash, r2.hash)).toBe(true);
    expect(r2.created).toBe(false);
  });

  it('auto parent linking intentionally defeats dedup (append-only history)', async () => {
    const { codebase } = await buildFixture();
    const r1 = await codebase.define(sampleSpec, { createdAtMs: 1000 });
    const r2 = await codebase.define(sampleSpec, { createdAtMs: 1000 });
    // Different hashes — r2 carries r1 as a parent.
    expect(hashRefEquals(r1.hash, r2.hash)).toBe(false);
    expect(hashRefEquals(r2.previousHash!, r1.hash)).toBe(true);
  });

  it('redefine carries old hash into parentHashes automatically', async () => {
    const { codebase } = await buildFixture();
    const v1 = await codebase.define(sampleSpec, { createdAtMs: 1000 });
    expect(v1.previousHash).toBeNull();

    const v2Spec = { ...sampleSpec, body: sampleSpec.body + '\nUpdated.' };
    const v2 = await codebase.define(v2Spec, { createdAtMs: 2000 });

    expect(hashRefEquals(v2.previousHash!, v1.hash)).toBe(true);
    expect(hashRefEquals(v1.hash, v2.hash)).toBe(false);

    // Walk back to confirm parentHashes was populated.
    const lineage = await codebase.lineage('vision-to-mission', v2.hash);
    expect(lineage.length).toBe(2);
    expect(hashRefEquals(lineage[0].hash, v2.hash)).toBe(true);
    expect(hashRefEquals(lineage[1].hash, v1.hash)).toBe(true);
  });

  it('linkParent = false skips automatic parent linking', async () => {
    const { codebase } = await buildFixture();
    const v1 = await codebase.define(sampleSpec, { createdAtMs: 1000 });
    const v2 = await codebase.define(
      { ...sampleSpec, body: 'brand new' },
      { createdAtMs: 2000, linkParent: false },
    );

    const byHash = await codebase.getByHash('vision-to-mission', v2.hash);
    expect(byHash!.record.provenance.parentHashes.length).toBe(0);

    // History still tracks the name rebinding.
    const history = await codebase.history('vision-to-mission');
    expect(history.length).toBe(2);
  });
});

// ─── resolve / listActive ───────────────────────────────────────────────────

describe('SkillCodebase.resolve + listActive', () => {
  it('resolves the current name to the most recent record', async () => {
    const { codebase } = await buildFixture();
    await codebase.define(sampleSpec, { createdAtMs: 1 });
    await codebase.define(
      { ...sampleSpec, body: sampleSpec.body + '\nPatched' },
      { createdAtMs: 2 },
    );
    const resolved = await codebase.resolve('vision-to-mission');
    expect(resolved!.spec.body).toContain('Patched');
  });

  it('returns null for unknown names', async () => {
    const { codebase } = await buildFixture();
    expect(await codebase.resolve('ghost')).toBeNull();
  });

  it('listActive returns every currently-bound skill', async () => {
    const { codebase } = await buildFixture();
    await codebase.define(sampleSpec);
    await codebase.define({
      ...sampleSpec,
      name: 'another-skill',
      body: 'different body',
    });
    const actives = await codebase.listActive();
    expect(actives.length).toBe(2);
    expect(actives.map((r) => r.name).sort()).toEqual(['another-skill', 'vision-to-mission']);
  });

  it('listNames returns just the sorted names', async () => {
    const { codebase } = await buildFixture();
    await codebase.define({ ...sampleSpec, name: 'beta' });
    await codebase.define({ ...sampleSpec, name: 'alpha' });
    expect(await codebase.listNames()).toEqual(['alpha', 'beta']);
  });
});

// ─── dependencyGraph + typecheck ────────────────────────────────────────────

describe('SkillCodebase.dependencyGraph + typecheck', () => {
  it('walks a simple A → B dependency chain', async () => {
    const { codebase } = await buildFixture();
    const baseResult = await codebase.define({
      name: 'corpus-scan',
      description: 'Scan the corpus',
      body: 'base',
      activationPatterns: [],
      dependencies: [],
    });
    const dependent = await codebase.define({
      name: 'cross-reference',
      description: 'Uses corpus-scan',
      body: 'dependent',
      activationPatterns: [],
      dependencies: [baseResult.hash],
    });

    const { nodes, missing } = await codebase.dependencyGraph(dependent.hash);
    expect(missing).toEqual([]);
    expect(nodes.length).toBe(2);
    // Root first (depth 0).
    expect(nodes[0].depth).toBe(0);
    expect(nodes[0].spec.name).toBe('cross-reference');
    expect(nodes[1].depth).toBe(1);
    expect(nodes[1].spec.name).toBe('corpus-scan');
  });

  it('deduplicates cycles / diamond deps', async () => {
    const { codebase } = await buildFixture();
    const root = await codebase.define({
      name: 'leaf',
      description: 'leaf',
      body: 'x',
      activationPatterns: [],
      dependencies: [],
    });
    const a = await codebase.define({
      name: 'a',
      description: 'a',
      body: 'x',
      activationPatterns: [],
      dependencies: [root.hash],
    });
    const b = await codebase.define({
      name: 'b',
      description: 'b',
      body: 'x',
      activationPatterns: [],
      dependencies: [root.hash],
    });
    // c depends on both a and b, which both depend on root.
    const c = await codebase.define({
      name: 'c',
      description: 'c',
      body: 'x',
      activationPatterns: [],
      dependencies: [a.hash, b.hash],
    });

    const { nodes, missing } = await codebase.dependencyGraph(c.hash);
    expect(missing).toEqual([]);
    // Root + a + b + c = 4 unique nodes (root is visited once).
    expect(nodes.length).toBe(4);
    const names = nodes.map((n) => n.spec.name).sort();
    expect(names).toEqual(['a', 'b', 'c', 'leaf']);
  });

  it('reports missing dependencies in missing[]', async () => {
    const { codebase } = await buildFixture();
    const fakeDep: HashRef = {
      algoId: 1,
      hash: new Uint8Array(32).fill(0xff),
    };
    const root = await codebase.define({
      name: 'needs-fake',
      description: 'Has a dangling dep',
      body: 'x',
      activationPatterns: [],
      dependencies: [fakeDep],
    });
    const { nodes, missing } = await codebase.dependencyGraph(root.hash);
    expect(nodes.length).toBe(1);
    expect(missing.length).toBe(1);
    expect(hashRefEquals(missing[0], fakeDep)).toBe(true);
  });

  it('respects maxDepth', async () => {
    const { codebase } = await buildFixture();
    const leaf = await codebase.define({
      name: 'deep-leaf',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [],
    });
    const mid = await codebase.define({
      name: 'deep-mid',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [leaf.hash],
    });
    const top = await codebase.define({
      name: 'deep-top',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [mid.hash],
    });

    const { nodes: nodesDepth1 } = await codebase.dependencyGraph(top.hash, { maxDepth: 1 });
    // At maxDepth=1 we see the root and its direct deps (mid), not leaf.
    const names1 = nodesDepth1.map((n) => n.spec.name).sort();
    expect(names1).toEqual(['deep-mid', 'deep-top']);

    const { nodes: nodesDepth2 } = await codebase.dependencyGraph(top.hash, { maxDepth: 2 });
    const names2 = nodesDepth2.map((n) => n.spec.name).sort();
    expect(names2).toEqual(['deep-leaf', 'deep-mid', 'deep-top']);
  });

  it('typecheck returns ok for a complete chain', async () => {
    const { codebase } = await buildFixture();
    const base = await codebase.define({
      name: 'base',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [],
    });
    const root = await codebase.define({
      name: 'root',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [base.hash],
    });
    const check = await codebase.typecheck(root.hash);
    expect(check.ok).toBe(true);
    expect(check.missing).toEqual([]);
  });

  it('typecheck returns ok = false with missing when deps are dangling', async () => {
    const { codebase } = await buildFixture();
    const fakeDep: HashRef = {
      algoId: 1,
      hash: new Uint8Array(32).fill(0xcc),
    };
    const root = await codebase.define({
      name: 'partial',
      description: '',
      body: 'x',
      activationPatterns: [],
      dependencies: [fakeDep],
    });
    const check = await codebase.typecheck(root.hash);
    expect(check.ok).toBe(false);
    expect(check.missing.length).toBe(1);
    expect(hashRefEquals(check.missing[0], fakeDep)).toBe(true);
  });
});

// ─── lineage ─────────────────────────────────────────────────────────────────

describe('SkillCodebase.lineage', () => {
  it('walks parent hashes newest-first', async () => {
    const { codebase } = await buildFixture();
    const v1 = await codebase.define(sampleSpec, { createdAtMs: 1 });
    const v2 = await codebase.define({ ...sampleSpec, body: 'v2' }, { createdAtMs: 2 });
    const v3 = await codebase.define({ ...sampleSpec, body: 'v3' }, { createdAtMs: 3 });

    const lineage = await codebase.lineage('vision-to-mission', v3.hash);
    expect(lineage.length).toBe(3);
    expect(lineage[0].spec.body).toBe('v3');
    expect(lineage[1].spec.body).toBe('v2');
    expect(lineage[2].spec.body).toBe(sampleSpec.body);
  });

  it('stops at maxSteps', async () => {
    const { codebase } = await buildFixture();
    await codebase.define(sampleSpec, { createdAtMs: 1 });
    await codebase.define({ ...sampleSpec, body: 'v2' }, { createdAtMs: 2 });
    const v3 = await codebase.define({ ...sampleSpec, body: 'v3' }, { createdAtMs: 3 });

    const lineage = await codebase.lineage('vision-to-mission', v3.hash, 2);
    expect(lineage.length).toBe(2);
  });
});

// ─── history ────────────────────────────────────────────────────────────────

describe('SkillCodebase.history', () => {
  it('reflects name binding history', async () => {
    const { codebase } = await buildFixture();
    await codebase.define(sampleSpec, { createdAtMs: 1 });
    await codebase.define({ ...sampleSpec, body: 'v2' }, { createdAtMs: 2 });
    await codebase.define({ ...sampleSpec, body: 'v3' }, { createdAtMs: 3 });

    const history = await codebase.history('vision-to-mission');
    expect(history.length).toBe(3);
    // Newest first.
    expect(history[0].value).not.toBeNull();
    expect(history[1].value).not.toBeNull();
    expect(history[2].value).not.toBeNull();
  });
});

// ─── Warm start ─────────────────────────────────────────────────────────────

describe('SkillCodebase warm start', () => {
  it('a fresh codebase over the same arena recovers all state', async () => {
    const { arena } = await buildFixture();
    const cas1 = new ContentAddressedStore({ arena });
    await cas1.loadIndex();
    const codebase1 = new SkillCodebase({ cas: cas1 });

    await codebase1.define(sampleSpec, { createdAtMs: 1 });
    await codebase1.define({ ...sampleSpec, body: 'v2' }, { createdAtMs: 2 });
    await codebase1.define({
      ...sampleSpec,
      name: 'other',
      body: 'other-body',
    });

    // Fresh codebase over the same arena.
    const cas2 = new ContentAddressedStore({ arena });
    await cas2.loadIndex();
    const codebase2 = new SkillCodebase({ cas: cas2 });

    // listActive and listNames see both skills.
    expect(await codebase2.listNames()).toEqual(['other', 'vision-to-mission']);

    // resolve still works.
    const resolved = await codebase2.resolve('vision-to-mission');
    expect(resolved!.spec.body).toBe('v2');

    // Lineage walk still works.
    const lineage = await codebase2.lineage('vision-to-mission', resolved!.hash);
    expect(lineage.length).toBe(2);
    expect(lineage[0].spec.body).toBe('v2');
    expect(lineage[1].spec.body).toBe(sampleSpec.body);
  });
});

// ─── Closed loop proof ──────────────────────────────────────────────────────

describe('Closed loop: full invocation path', () => {
  it('caller invokes by name → resolve → dependency graph → complete spec', async () => {
    const { codebase } = await buildFixture();

    // Define a two-level skill graph.
    const fetcher = await codebase.define({
      name: 'corpus-fetcher',
      description: 'Fetch pages from the research corpus',
      body: '# Corpus Fetcher\n\nReads index.html files.',
      activationPatterns: ['fetch corpus'],
      dependencies: [],
    });
    const indexer = await codebase.define({
      name: 'corpus-indexer',
      description: 'Index corpus contents',
      body: '# Corpus Indexer\n\nBuilds a search index from fetched pages.',
      activationPatterns: ['index corpus'],
      dependencies: [fetcher.hash],
    });
    await codebase.define({
      name: 'vision-to-mission',
      description: "Turn a vision into a mission package.",
      body: '# Vision to Mission\n\nUses the indexed corpus.',
      activationPatterns: ['vision to mission'],
      dependencies: [indexer.hash],
    });

    // Invoke by name (the closed loop starts here).
    const resolved = await codebase.resolve('vision-to-mission');
    expect(resolved).not.toBeNull();
    expect(resolved!.spec.name).toBe('vision-to-mission');

    // Walk the dependency graph.
    const { nodes, missing } = await codebase.dependencyGraph(resolved!.hash);
    expect(missing).toEqual([]);
    expect(nodes.length).toBe(3);
    const orderedNames = nodes.map((n) => n.spec.name);
    // BFS order: root (depth 0), indexer (depth 1), fetcher (depth 2).
    expect(orderedNames).toEqual(['vision-to-mission', 'corpus-indexer', 'corpus-fetcher']);

    // All three records are retrievable and parseable.
    for (const node of nodes) {
      expect(node.spec.body.length).toBeGreaterThan(0);
      expect(node.record.version).toBe(1);
    }

    // Typecheck passes — every dependency is present.
    const check = await codebase.typecheck(resolved!.hash);
    expect(check.ok).toBe(true);
  });
});
