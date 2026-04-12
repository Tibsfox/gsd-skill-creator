/**
 * Tests for the SkillView — the first user-defined record type built
 * on the Grove format. Verifies the full chain: SkillSpec encode →
 * record envelope → identity hash → roundtrip → arena store.
 */

import { describe, it, expect } from 'vitest';
import {
  type SkillSpec,
  buildSkillRecord,
  buildSkillSpecTypeRecord,
  SKILL_SPEC_TYPE_HASH,
  encodeSkillSpec,
  decodeSkillSpec,
  parseSkillRecord,
  parseSkillRecordBytes,
  serializeSkillRecord,
  recordHashOf,
} from './skill-view.js';
import {
  hashRefEquals,
  HASH_ALGO,
  TYPE_RECORD_HASH,
  decodeRecord,
  type HashRef,
} from '../memory/grove-format.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';

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
            totalSlots: 1024,
            freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size,
            totalBytes: 0,
            freeBytes: 0,
            allocatedBytes: 0,
            nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier,
          payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0,
          createdAtNs: id * 1000,
          lastAccessNs: id * 1000,
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
      case 'arena_touch': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        chunk.accessCount += 1;
        return null;
      }
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024,
            freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size,
            totalBytes: 0,
            freeBytes: 0,
            allocatedBytes: 0,
            nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024,
          freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size,
          totalBytes: 0,
          freeBytes: 0,
          allocatedBytes: 0,
          nextChunkId: nextId,
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
  return { mock, arena, cas };
}

const sampleSpec: SkillSpec = {
  name: 'vision-to-mission',
  description: "Transform a builder's vision into a GSD mission package.",
  body: '# Vision to Mission\n\nThis skill takes an idea and produces an executable mission spec.\n',
  activationPatterns: ['structure this for GSD', 'turn this vision into a mission'],
  dependencies: [],
};

// ─── SkillSpec type record ──────────────────────────────────────────────────

describe('SKILL_SPEC_TYPE_HASH', () => {
  it('is a 32-byte SHA-256 hash', () => {
    expect(SKILL_SPEC_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(SKILL_SPEC_TYPE_HASH.hash.length).toBe(32);
  });

  it('is deterministic across multiple calls to buildSkillSpecTypeRecord', () => {
    const a = buildSkillSpecTypeRecord();
    const b = buildSkillSpecTypeRecord();
    expect(hashRefEquals(recordHashOf(a), recordHashOf(b))).toBe(true);
    expect(hashRefEquals(recordHashOf(a), SKILL_SPEC_TYPE_HASH)).toBe(true);
  });

  it('is distinct from BOOTSTRAP and TYPE_RECORD hashes', () => {
    expect(hashRefEquals(SKILL_SPEC_TYPE_HASH, TYPE_RECORD_HASH)).toBe(false);
  });

  it('the SkillSpec TypeRecord references the bootstrap TYPE_RECORD type', () => {
    const record = buildSkillSpecTypeRecord();
    expect(hashRefEquals(record.typeHash, TYPE_RECORD_HASH)).toBe(true);
  });
});

// ─── encode/decode SkillSpec payload ────────────────────────────────────────

describe('encodeSkillSpec / decodeSkillSpec', () => {
  it('roundtrips a simple spec', () => {
    const bytes = encodeSkillSpec(sampleSpec);
    const back = decodeSkillSpec(bytes);
    expect(back.name).toBe(sampleSpec.name);
    expect(back.description).toBe(sampleSpec.description);
    expect(back.body).toBe(sampleSpec.body);
    expect(back.activationPatterns).toEqual(sampleSpec.activationPatterns);
    expect(back.dependencies).toEqual([]);
  });

  it('roundtrips a spec with dependencies', () => {
    const dep1: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xab) };
    const dep2: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xcd) };
    const spec: SkillSpec = { ...sampleSpec, dependencies: [dep1, dep2] };
    const back = decodeSkillSpec(encodeSkillSpec(spec));
    expect(back.dependencies.length).toBe(2);
    expect(hashRefEquals(back.dependencies[0], dep1)).toBe(true);
    expect(hashRefEquals(back.dependencies[1], dep2)).toBe(true);
  });

  it('roundtrips empty arrays and unicode bodies', () => {
    const spec: SkillSpec = {
      name: 'unicode-test',
      description: 'A 测试 skill 🌲 with emoji.',
      body: '日本語\nemoji: 🦊',
      activationPatterns: [],
      dependencies: [],
    };
    const back = decodeSkillSpec(encodeSkillSpec(spec));
    expect(back).toEqual(spec);
  });

  it('rejects payloads missing required fields', () => {
    const bad = encodeSkillSpec({ ...sampleSpec });
    // Truncate by 1 byte to corrupt the canonical encoding.
    const truncated = bad.slice(0, bad.length - 1);
    expect(() => decodeSkillSpec(truncated)).toThrow();
  });
});

// ─── buildSkillRecord ───────────────────────────────────────────────────────

describe('buildSkillRecord', () => {
  it('produces a record with the right typeHash', () => {
    const record = buildSkillRecord(sampleSpec);
    expect(hashRefEquals(record.typeHash, SKILL_SPEC_TYPE_HASH)).toBe(true);
  });

  it('mirrors spec.dependencies into provenance.dependencies', () => {
    const dep: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0x99) };
    const spec: SkillSpec = { ...sampleSpec, dependencies: [dep] };
    const record = buildSkillRecord(spec);
    expect(record.provenance.dependencies.length).toBe(1);
    expect(hashRefEquals(record.provenance.dependencies[0], dep)).toBe(true);
  });

  it('respects explicit provenance options', () => {
    const record = buildSkillRecord(sampleSpec, {
      author: 'foxy',
      sessionId: 'sess-1',
      toolVersion: 'gsd-skill-creator/1.50.0',
      createdAtMs: 12345,
    });
    expect(record.provenance.author).toBe('foxy');
    expect(record.provenance.sessionId).toBe('sess-1');
    expect(record.provenance.toolVersion).toBe('gsd-skill-creator/1.50.0');
    expect(record.provenance.createdAtMs).toBe(12345);
  });

  it('records parent hashes for derived versions', () => {
    const v1 = buildSkillRecord(sampleSpec, { createdAtMs: 1000 });
    const v1Hash = recordHashOf(v1);
    const v2 = buildSkillRecord(
      { ...sampleSpec, body: sampleSpec.body + '\nUpdated!' },
      { createdAtMs: 2000, parentHashes: [v1Hash] },
    );
    expect(v2.provenance.parentHashes.length).toBe(1);
    expect(hashRefEquals(v2.provenance.parentHashes[0], v1Hash)).toBe(true);
    // v1 and v2 must have different identity hashes.
    expect(hashRefEquals(recordHashOf(v1), recordHashOf(v2))).toBe(false);
  });
});

// ─── parseSkillRecord roundtrip ─────────────────────────────────────────────

describe('parseSkillRecord roundtrip', () => {
  it('encode → decode preserves the spec', () => {
    const record = buildSkillRecord(sampleSpec, { createdAtMs: 100 });
    const back = parseSkillRecord(record);
    expect(back).toEqual(sampleSpec);
  });

  it('rejects records with the wrong typeHash', () => {
    const record = buildSkillRecord(sampleSpec);
    const tampered = { ...record, typeHash: TYPE_RECORD_HASH };
    expect(() => parseSkillRecord(tampered)).toThrow(/SKILL_SPEC_TYPE_HASH/);
  });

  it('parseSkillRecordBytes decodes serialized records', () => {
    const record = buildSkillRecord(sampleSpec, { createdAtMs: 200 });
    const bytes = serializeSkillRecord(record);
    const { spec, record: decoded } = parseSkillRecordBytes(bytes);
    expect(spec).toEqual(sampleSpec);
    expect(decoded.provenance.createdAtMs).toBe(200);
  });
});

// ─── recordHashOf determinism ───────────────────────────────────────────────

describe('recordHashOf determinism', () => {
  it('byte-identical records produce identical hashes', () => {
    const a = buildSkillRecord(sampleSpec, { createdAtMs: 100 });
    const b = buildSkillRecord(sampleSpec, { createdAtMs: 100 });
    expect(hashRefEquals(recordHashOf(a), recordHashOf(b))).toBe(true);
  });

  it('different bodies produce different hashes', () => {
    const a = buildSkillRecord(sampleSpec, { createdAtMs: 100 });
    const b = buildSkillRecord({ ...sampleSpec, body: sampleSpec.body + ' ' }, { createdAtMs: 100 });
    expect(hashRefEquals(recordHashOf(a), recordHashOf(b))).toBe(false);
  });

  it('different provenance produces different hashes', () => {
    const a = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'a' });
    const b = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'b' });
    expect(hashRefEquals(recordHashOf(a), recordHashOf(b))).toBe(false);
  });
});

// ─── End-to-end via ContentAddressedStore ───────────────────────────────────

describe('SkillView end-to-end via ContentAddressedStore', () => {
  it('stores and retrieves a skill record by its identity hash', async () => {
    const { cas } = await buildFixture();
    const record = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'foxy' });
    const recordHash = recordHashOf(record);
    const recordBytes = serializeSkillRecord(record);

    const { chunkId, created } = await cas.put(recordHash.hash, recordBytes);
    expect(created).toBe(true);
    expect(typeof chunkId).toBe('number');

    const fetched = await cas.getByHash(recordHash.hash);
    expect(fetched).not.toBeNull();

    const { spec } = parseSkillRecordBytes(fetched!);
    expect(spec).toEqual(sampleSpec);
  });

  it('two byte-identical records dedupe to one chunk', async () => {
    const { cas, mock } = await buildFixture();
    const r1 = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'foxy' });
    const r2 = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'foxy' });
    const h1 = recordHashOf(r1);
    const h2 = recordHashOf(r2);
    expect(hashRefEquals(h1, h2)).toBe(true);

    await cas.put(h1.hash, serializeSkillRecord(r1));
    await cas.put(h2.hash, serializeSkillRecord(r2));
    expect(mock.size()).toBe(1);
  });

  it('parent → child evolution preserves both records', async () => {
    const { cas, mock } = await buildFixture();
    const v1 = buildSkillRecord(sampleSpec, { createdAtMs: 100, author: 'foxy' });
    const v1Hash = recordHashOf(v1);
    await cas.put(v1Hash.hash, serializeSkillRecord(v1));

    const v2Spec: SkillSpec = { ...sampleSpec, body: sampleSpec.body + '\nUpdated.' };
    const v2 = buildSkillRecord(v2Spec, {
      createdAtMs: 200,
      author: 'foxy',
      parentHashes: [v1Hash],
    });
    const v2Hash = recordHashOf(v2);
    await cas.put(v2Hash.hash, serializeSkillRecord(v2));

    expect(mock.size()).toBe(2);

    // We can still retrieve both versions.
    const fromV1 = parseSkillRecordBytes((await cas.getByHash(v1Hash.hash))!);
    const fromV2 = parseSkillRecordBytes((await cas.getByHash(v2Hash.hash))!);
    expect(fromV1.spec.body).not.toContain('Updated.');
    expect(fromV2.spec.body).toContain('Updated.');
    expect(fromV2.record.provenance.parentHashes.length).toBe(1);
    expect(hashRefEquals(fromV2.record.provenance.parentHashes[0], v1Hash)).toBe(true);
  });

  it('a skill that depends on another stores both, with traversable refs', async () => {
    const { cas } = await buildFixture();

    // Define a base skill.
    const base = buildSkillRecord(
      {
        name: 'corpus-scan',
        description: 'Scan the research corpus',
        body: '...',
        activationPatterns: [],
        dependencies: [],
      },
      { createdAtMs: 100 },
    );
    const baseHash = recordHashOf(base);
    await cas.put(baseHash.hash, serializeSkillRecord(base));

    // Define a dependent skill that references the base by hash.
    const dependent = buildSkillRecord(
      {
        name: 'cross-reference',
        description: 'Build cross-references using corpus-scan',
        body: '...',
        activationPatterns: [],
        dependencies: [baseHash],
      },
      { createdAtMs: 200 },
    );
    const dependentHash = recordHashOf(dependent);
    await cas.put(dependentHash.hash, serializeSkillRecord(dependent));

    // Re-fetch the dependent and walk its dependency edges.
    const back = parseSkillRecordBytes((await cas.getByHash(dependentHash.hash))!);
    expect(back.spec.dependencies.length).toBe(1);
    const depHash = back.spec.dependencies[0];
    expect(hashRefEquals(depHash, baseHash)).toBe(true);

    // Resolve the dependency from the store.
    const resolvedBase = await cas.getByHash(depHash.hash);
    expect(resolvedBase).not.toBeNull();
    const baseSpec = parseSkillRecordBytes(resolvedBase!).spec;
    expect(baseSpec.name).toBe('corpus-scan');
  });

  it('records survive a fresh store rebuild over the same arena (warm-start)', async () => {
    const { arena } = await buildFixture();
    const cas1 = new ContentAddressedStore({ arena });
    await cas1.loadIndex();
    const record = buildSkillRecord(sampleSpec, { createdAtMs: 500, author: 'foxy' });
    const hash = recordHashOf(record);
    await cas1.put(hash.hash, serializeSkillRecord(record));

    // Rebuild a second store over the same arena.
    const cas2 = new ContentAddressedStore({ arena });
    await cas2.loadIndex();

    const fetched = await cas2.getByHash(hash.hash);
    expect(fetched).not.toBeNull();
    const { spec } = parseSkillRecordBytes(fetched!);
    expect(spec).toEqual(sampleSpec);
  });
});

// ─── Reference skill end-to-end (the proof) ─────────────────────────────────

describe('Reference skill: vision-to-mission end-to-end', () => {
  it('serializes the actual SKILL.md content and roundtrips bit-for-bit', async () => {
    const { cas } = await buildFixture();

    // The actual content (a small representative excerpt — full body
    // would bloat tests but the principle is identical).
    const realSpec: SkillSpec = {
      name: 'vision-to-mission',
      description:
        "Transform a user's builder vision into a complete, executable GSD mission package. Use this skill whenever a user has described what they want to BUILD",
      body: [
        '# Vision → Mission Skill',
        '',
        "Transform a user's builder vision — described in conversation — into a complete, GSD-ready mission package.",
        '',
        '## Pipeline Speed Detection',
        '',
        'Detect which pipeline the conversation warrants — do not ask the user unless genuinely ambiguous.',
      ].join('\n'),
      activationPatterns: [
        'structure this for GSD',
        'make this into a milestone',
        'turn this vision into a mission',
        'package this up for Claude Code',
        'create the mission files',
      ],
      dependencies: [],
    };

    const record = buildSkillRecord(realSpec, {
      createdAtMs: 1712534400000, // 2024-04-08 in ms (deterministic for the test)
      author: 'foxy',
      sessionId: 'p4-reference-port',
      toolVersion: 'grove-skillview/1.0',
    });
    const hash = recordHashOf(record);
    const bytes = serializeSkillRecord(record);

    await cas.put(hash.hash, bytes);

    // Re-fetch and re-decode.
    const fetched = await cas.getByHash(hash.hash);
    expect(fetched).not.toBeNull();
    const { spec, record: decoded } = parseSkillRecordBytes(fetched!);

    // Verify every field roundtripped exactly.
    expect(spec).toEqual(realSpec);
    expect(decoded.provenance.author).toBe('foxy');
    expect(decoded.provenance.sessionId).toBe('p4-reference-port');
    expect(decoded.provenance.toolVersion).toBe('grove-skillview/1.0');

    // Verify the recomputed identity hash matches the put key.
    expect(hashRefEquals(recordHashOf(decoded), hash)).toBe(true);
  });
});
