/**
 * Tests for SkillDiff — the impact-radius diff tool.
 */

import { describe, it, expect } from 'vitest';
import { SkillDiff, diffSpecs } from './skill-diff.js';
import { SkillCodebase } from './skill-codebase.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import { hashRefEquals, HASH_ALGO, type HashRef } from '../memory/grove-format.js';
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
          initialized: true, recovered: false,
          checkpointPath: '/mock', journalPath: '/mock',
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
  const diff = new SkillDiff(codebase);
  return { mock, arena, cas, codebase, diff };
}

const baseSpec: SkillSpec = {
  name: 'test-skill',
  description: 'A test skill',
  body: '# Test\n\nBody',
  activationPatterns: ['run it'],
  dependencies: [],
};

// ─── diffSpecs pure function ────────────────────────────────────────────────

describe('diffSpecs', () => {
  it('returns empty array for identical specs', () => {
    expect(diffSpecs(baseSpec, baseSpec)).toEqual([]);
    // Structural equality (different object, same fields).
    expect(diffSpecs(baseSpec, { ...baseSpec })).toEqual([]);
  });

  it('detects name change', () => {
    const changes = diffSpecs(baseSpec, { ...baseSpec, name: 'renamed' });
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('name');
    expect(changes[0].before).toBe('test-skill');
    expect(changes[0].after).toBe('renamed');
  });

  it('detects description change', () => {
    const changes = diffSpecs(baseSpec, { ...baseSpec, description: 'new desc' });
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('description');
  });

  it('detects body change', () => {
    const changes = diffSpecs(baseSpec, { ...baseSpec, body: 'different body' });
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('body');
  });

  it('detects activationPatterns change', () => {
    const changes = diffSpecs(baseSpec, { ...baseSpec, activationPatterns: ['new pattern'] });
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('activationPatterns');
  });

  it('detects dependencies change', () => {
    const newDep: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xaa) };
    const changes = diffSpecs(baseSpec, { ...baseSpec, dependencies: [newDep] });
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('dependencies');
  });

  it('detects multiple simultaneous changes', () => {
    const changes = diffSpecs(baseSpec, {
      ...baseSpec,
      description: 'x',
      body: 'y',
    });
    const fields = changes.map((c) => c.field).sort();
    expect(fields).toEqual(['body', 'description']);
  });
});

// ─── SkillDiff.diff ─────────────────────────────────────────────────────────

describe('SkillDiff.diff', () => {
  it('reports field changes between two versions of a skill', async () => {
    const { codebase, diff } = await buildFixture();
    const v1 = await codebase.define(baseSpec, { linkParent: false });
    const v2 = await codebase.define(
      { ...baseSpec, body: 'new body' },
      { linkParent: false },
    );

    const report = await diff.diff(v1.hash, v2.hash);
    expect(report.name).toBe('test-skill');
    expect(report.oldSpec).not.toBeNull();
    expect(report.newSpec).not.toBeNull();
    expect(report.fieldChanges.length).toBe(1);
    expect(report.fieldChanges[0].field).toBe('body');
  });

  it('reports dependents of the old hash', async () => {
    const { codebase, diff } = await buildFixture();
    // Base skill that other skills will depend on.
    const base = await codebase.define(baseSpec, { linkParent: false });

    // Three dependents.
    await codebase.define(
      {
        name: 'dep-a',
        description: 'dep a',
        body: 'x',
        activationPatterns: [],
        dependencies: [base.hash],
      },
      { linkParent: false },
    );
    await codebase.define(
      {
        name: 'dep-b',
        description: 'dep b',
        body: 'x',
        activationPatterns: [],
        dependencies: [base.hash],
      },
      { linkParent: false },
    );
    await codebase.define(
      {
        name: 'independent',
        description: 'no deps',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );

    // Diff base against a hypothetical new version.
    const report = await diff.diff(base.hash, null);
    expect(report.dependents.length).toBe(2);
    const dependentNames = report.dependents.map((d) => d.name).sort();
    expect(dependentNames).toEqual(['dep-a', 'dep-b']);
  });

  it('reports transitive dependency diff: unchanged, removed, added', async () => {
    const { codebase, diff } = await buildFixture();

    // Shared leaf used by both old and new.
    const leafShared = await codebase.define(
      {
        name: 'leaf-shared',
        description: '',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );
    // Leaf only in old.
    const leafOld = await codebase.define(
      {
        name: 'leaf-old',
        description: '',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );
    // Leaf only in new.
    const leafNew = await codebase.define(
      {
        name: 'leaf-new',
        description: '',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );

    const oldVer = await codebase.define(
      {
        name: 'root',
        description: '',
        body: 'v1',
        activationPatterns: [],
        dependencies: [leafShared.hash, leafOld.hash],
      },
      { linkParent: false },
    );
    const newVer = await codebase.define(
      {
        name: 'root',
        description: '',
        body: 'v2',
        activationPatterns: [],
        dependencies: [leafShared.hash, leafNew.hash],
      },
      { linkParent: false },
    );

    const report = await diff.diff(oldVer.hash, newVer.hash);
    expect(report.transitive.unchanged.length).toBe(1);
    expect(report.transitive.removed.length).toBe(1);
    expect(report.transitive.added.length).toBe(1);

    expect(hashRefEquals(report.transitive.unchanged[0], leafShared.hash)).toBe(true);
    expect(hashRefEquals(report.transitive.removed[0], leafOld.hash)).toBe(true);
    expect(hashRefEquals(report.transitive.added[0], leafNew.hash)).toBe(true);
  });

  it('handles one-sided diff (only old)', async () => {
    const { codebase, diff } = await buildFixture();
    const v1 = await codebase.define(baseSpec, { linkParent: false });
    const report = await diff.diff(v1.hash, null);
    expect(report.oldSpec).not.toBeNull();
    expect(report.newSpec).toBeNull();
    expect(report.fieldChanges).toEqual([]);
  });

  it('handles one-sided diff (only new)', async () => {
    const { codebase, diff } = await buildFixture();
    const v1 = await codebase.define(baseSpec, { linkParent: false });
    const report = await diff.diff(null, v1.hash);
    expect(report.oldSpec).toBeNull();
    expect(report.newSpec).not.toBeNull();
  });

  it('throws when both sides are null', async () => {
    const { diff } = await buildFixture();
    await expect(diff.diff(null, null)).rejects.toThrow(/at least one/);
  });

  it('reports no field changes for byte-identical specs under different hashes', async () => {
    const { codebase, diff } = await buildFixture();
    // Same content but different provenance → different hashes.
    const v1 = await codebase.define(baseSpec, {
      linkParent: false,
      createdAtMs: 100,
    });
    const v2 = await codebase.define(baseSpec, {
      linkParent: false,
      createdAtMs: 200,
    });
    const report = await diff.diff(v1.hash, v2.hash);
    expect(report.fieldChanges).toEqual([]);
    expect(hashRefEquals(v1.hash, v2.hash)).toBe(false);
  });
});

// ─── SkillDiff.previewUpdate ────────────────────────────────────────────────

describe('SkillDiff.previewUpdate', () => {
  it('diffs the current bound version against a proposed new spec', async () => {
    const { codebase, diff } = await buildFixture();
    await codebase.define(baseSpec);
    const report = await diff.previewUpdate('test-skill', {
      ...baseSpec,
      body: 'proposed new body',
    });
    expect(report.oldSpec).not.toBeNull();
    expect(report.newSpec).not.toBeNull();
    expect(report.fieldChanges.length).toBe(1);
    expect(report.fieldChanges[0].field).toBe('body');
  });

  it('handles preview for a name that has never been bound', async () => {
    const { diff } = await buildFixture();
    const report = await diff.previewUpdate('new-skill', {
      name: 'new-skill',
      description: 'fresh',
      body: '...',
      activationPatterns: [],
      dependencies: [],
    });
    expect(report.oldSpec).toBeNull();
    expect(report.newSpec).not.toBeNull();
  });

  it('transitive diff reflects the proposed dependency set', async () => {
    const { codebase, diff } = await buildFixture();
    const oldLeaf = await codebase.define(
      {
        name: 'old-leaf',
        description: '',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );
    const newLeaf = await codebase.define(
      {
        name: 'new-leaf',
        description: '',
        body: 'x',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );
    await codebase.define({
      name: 'target',
      description: '',
      body: 'v1',
      activationPatterns: [],
      dependencies: [oldLeaf.hash],
    });

    const report = await diff.previewUpdate('target', {
      name: 'target',
      description: '',
      body: 'v2',
      activationPatterns: [],
      dependencies: [newLeaf.hash],
    });
    expect(report.transitive.removed.length).toBe(1);
    expect(report.transitive.added.length).toBe(1);
    expect(hashRefEquals(report.transitive.removed[0], oldLeaf.hash)).toBe(true);
    expect(hashRefEquals(report.transitive.added[0], newLeaf.hash)).toBe(true);
  });
});

// ─── Blast-radius scenario ──────────────────────────────────────────────────

describe('SkillDiff blast radius — realistic scenario', () => {
  it('computes the full impact of changing a leaf dependency', async () => {
    const { codebase, diff } = await buildFixture();

    // Build a small DAG:
    //
    //   leaf        (base)
    //    ↑
    //   mid-a       (depends on leaf)
    //    ↑
    //   top         (depends on mid-a)
    //
    // Another chain:
    //   mid-b       (also depends on leaf)
    //    ↑
    //   side        (depends on mid-b)
    //
    // Changing `leaf` should surface mid-a and mid-b as direct dependents.

    const leaf = await codebase.define(
      {
        name: 'leaf',
        description: 'base',
        body: 'base body',
        activationPatterns: [],
        dependencies: [],
      },
      { linkParent: false },
    );
    const midA = await codebase.define(
      {
        name: 'mid-a',
        description: 'uses leaf',
        body: '',
        activationPatterns: [],
        dependencies: [leaf.hash],
      },
      { linkParent: false },
    );
    await codebase.define(
      {
        name: 'top',
        description: 'uses mid-a',
        body: '',
        activationPatterns: [],
        dependencies: [midA.hash],
      },
      { linkParent: false },
    );
    const midB = await codebase.define(
      {
        name: 'mid-b',
        description: 'also uses leaf',
        body: '',
        activationPatterns: [],
        dependencies: [leaf.hash],
      },
      { linkParent: false },
    );
    await codebase.define(
      {
        name: 'side',
        description: 'uses mid-b',
        body: '',
        activationPatterns: [],
        dependencies: [midB.hash],
      },
      { linkParent: false },
    );

    // Diff `leaf` against a hypothetical new version.
    const report = await diff.diff(leaf.hash, null);

    // Only mid-a and mid-b directly depend on leaf. top and side depend
    // on mid-a and mid-b respectively, not on leaf directly.
    const directDependents = report.dependents.map((d) => d.name).sort();
    expect(directDependents).toEqual(['mid-a', 'mid-b']);
  });
});
