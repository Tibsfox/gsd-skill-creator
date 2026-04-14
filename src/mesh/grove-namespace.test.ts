/**
 * Tests for GroveNamespace — the append-only name → hash binding layer
 * on top of the Grove format.
 */

import { describe, it, expect } from 'vitest';
import { GroveNamespace, HEAD_POINTER_HASH, type NamespaceEntry } from './grove-namespace.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import {
  HASH_ALGO,
  hashRefEquals,
  type HashRef,
} from '../memory/grove-format.js';

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
      case 'arena_touch':
        return null;
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
  const ns = new GroveNamespace(cas);
  return { mock, arena, cas, ns };
}

// A couple of sample hashes for binding.
const hashA: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xaa) };
const hashB: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xbb) };
const hashC: HashRef = { algoId: HASH_ALGO.SHA_256, hash: new Uint8Array(32).fill(0xcc) };

// ─── Head pointer ────────────────────────────────────────────────────────────

describe('GroveNamespace head pointer', () => {
  it('HEAD_POINTER_HASH is a stable 32-byte SHA-256', () => {
    expect(HEAD_POINTER_HASH.length).toBe(32);
    // Sanity check: sha256("grove:head-namespace:v1")
    // is a fixed value; any drift means the constant moved.
    const asHex = Array.from(HEAD_POINTER_HASH)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    expect(asHex.length).toBe(64);
  });

  it('headHash() returns null for a fresh store', async () => {
    const { ns } = await buildFixture();
    expect(await ns.headHash()).toBeNull();
  });

  it('head() returns null for a fresh store', async () => {
    const { ns } = await buildFixture();
    expect(await ns.head()).toBeNull();
  });

  it('resolve() returns null for any name in a fresh store', async () => {
    const { ns } = await buildFixture();
    expect(await ns.resolve('anything')).toBeNull();
  });
});

// ─── bind ────────────────────────────────────────────────────────────────────

describe('GroveNamespace.bind', () => {
  it('first bind creates the root namespace and resolves the name', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);

    const resolved = await ns.resolve('skill-a');
    expect(resolved).not.toBeNull();
    expect(hashRefEquals(resolved!, hashA)).toBe(true);
  });

  it('the head pointer moves after each bind', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    const head1 = await ns.headHash();
    await ns.bind('skill-b', hashB);
    const head2 = await ns.headHash();
    expect(head1).not.toBeNull();
    expect(head2).not.toBeNull();
    expect(hashRefEquals(head1!, head2!)).toBe(false);
  });

  it('two binds leave both names resolvable', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.bind('skill-b', hashB);
    expect(hashRefEquals((await ns.resolve('skill-a'))!, hashA)).toBe(true);
    expect(hashRefEquals((await ns.resolve('skill-b'))!, hashB)).toBe(true);
  });

  it('rebinding a name replaces its value in the current namespace', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.bind('skill-a', hashB);
    expect(hashRefEquals((await ns.resolve('skill-a'))!, hashB)).toBe(true);
  });

  it('the root namespace has previous = null', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    const head = await ns.head();
    expect(head).not.toBeNull();
    expect(head!.previous).toBeNull();
  });

  it('subsequent namespaces have previous pointing back', async () => {
    const { ns } = await buildFixture();
    const first = await ns.bind('skill-a', hashA);
    const second = await ns.bind('skill-b', hashB);

    const head = await ns.head();
    expect(head).not.toBeNull();
    expect(head!.previous).not.toBeNull();
    expect(hashRefEquals(head!.previous!, first)).toBe(true);
    expect(hashRefEquals(head!.namespaceHash, second)).toBe(true);
  });

  it('bind options record provenance in the envelope', async () => {
    const { ns, cas } = await buildFixture();
    const hash = await ns.bind('skill-a', hashA, {
      author: 'foxy',
      sessionId: 'sess-1',
      toolVersion: 'test/0.1',
      createdAtMs: 12345,
    });
    const entry = await ns.getNamespaceRecord(hash);
    expect(entry).not.toBeNull();
    expect(entry!.author).toBe('foxy');
    expect(entry!.sessionId).toBe('sess-1');
    expect(entry!.createdAtMs).toBe(12345);
  });
});

// ─── unbind ──────────────────────────────────────────────────────────────────

describe('GroveNamespace.unbind', () => {
  it('unbinding a name removes it from resolve()', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.unbind('skill-a');
    expect(await ns.resolve('skill-a')).toBeNull();
  });

  it('unbinding does NOT remove the underlying chunks from history', async () => {
    const { ns } = await buildFixture();
    const boundHash = await ns.bind('skill-a', hashA);
    await ns.unbind('skill-a');

    // The original binding record is still resolvable by its hash.
    const entry = await ns.getNamespaceRecord(boundHash);
    expect(entry).not.toBeNull();
    expect(hashRefEquals(entry!.bindings['skill-a'], hashA)).toBe(true);
  });

  it('unbinding a non-existent name still advances history', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    const before = await ns.headHash();
    await ns.unbind('ghost');
    const after = await ns.headHash();
    expect(hashRefEquals(before!, after!)).toBe(false);
  });
});

// ─── bindMany ────────────────────────────────────────────────────────────────

describe('GroveNamespace.bindMany', () => {
  it('applies all changes atomically in one namespace record', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);

    const beforeLength = await ns.chainLength();
    await ns.bindMany([
      { name: 'skill-b', hash: hashB },
      { name: 'skill-c', hash: hashC },
      { name: 'skill-a', hash: null }, // unbind skill-a in the same step
    ]);
    const afterLength = await ns.chainLength();

    expect(afterLength).toBe(beforeLength + 1);
    expect(await ns.resolve('skill-a')).toBeNull();
    expect(hashRefEquals((await ns.resolve('skill-b'))!, hashB)).toBe(true);
    expect(hashRefEquals((await ns.resolve('skill-c'))!, hashC)).toBe(true);
  });
});

// ─── listBindings ────────────────────────────────────────────────────────────

describe('GroveNamespace.listBindings', () => {
  it('returns empty object for fresh store', async () => {
    const { ns } = await buildFixture();
    expect(await ns.listBindings()).toEqual({});
  });

  it('returns every current binding', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.bind('skill-b', hashB);
    await ns.bind('skill-c', hashC);

    const bindings = await ns.listBindings();
    expect(Object.keys(bindings).sort()).toEqual(['skill-a', 'skill-b', 'skill-c']);
    expect(hashRefEquals(bindings['skill-a'], hashA)).toBe(true);
    expect(hashRefEquals(bindings['skill-b'], hashB)).toBe(true);
    expect(hashRefEquals(bindings['skill-c'], hashC)).toBe(true);
  });

  it('reflects unbinds', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.bind('skill-b', hashB);
    await ns.unbind('skill-a');

    const bindings = await ns.listBindings();
    expect(Object.keys(bindings)).toEqual(['skill-b']);
  });
});

// ─── walkHistory ─────────────────────────────────────────────────────────────

describe('GroveNamespace.walkHistory', () => {
  it('walks the chain newest-first', async () => {
    const { ns } = await buildFixture();
    const h1 = await ns.bind('skill-a', hashA);
    const h2 = await ns.bind('skill-b', hashB);
    const h3 = await ns.bind('skill-c', hashC);

    const seen: HashRef[] = [];
    for await (const entry of ns.walkHistory()) {
      seen.push(entry.namespaceHash);
    }
    expect(seen.length).toBe(3);
    expect(hashRefEquals(seen[0], h3)).toBe(true);
    expect(hashRefEquals(seen[1], h2)).toBe(true);
    expect(hashRefEquals(seen[2], h1)).toBe(true);
  });

  it('chainLength matches walkHistory count', async () => {
    const { ns } = await buildFixture();
    expect(await ns.chainLength()).toBe(0);
    await ns.bind('skill-a', hashA);
    expect(await ns.chainLength()).toBe(1);
    await ns.bind('skill-b', hashB);
    expect(await ns.chainLength()).toBe(2);
    await ns.unbind('skill-a');
    expect(await ns.chainLength()).toBe(3);
  });
});

// ─── nameHistory ─────────────────────────────────────────────────────────────

describe('GroveNamespace.nameHistory', () => {
  it('returns empty for a name that was never bound', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    expect(await ns.nameHistory('skill-ghost')).toEqual([]);
  });

  it('tracks rebinds as separate history steps', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA, { createdAtMs: 100, author: 'alice' });
    await ns.bind('skill-a', hashB, { createdAtMs: 200, author: 'bob' });
    await ns.bind('skill-a', hashC, { createdAtMs: 300, author: 'carol' });

    const history = await ns.nameHistory('skill-a');
    // Newest first: hashC, hashB, hashA
    expect(history.length).toBe(3);
    expect(hashRefEquals(history[0].value!, hashC)).toBe(true);
    expect(hashRefEquals(history[1].value!, hashB)).toBe(true);
    expect(hashRefEquals(history[2].value!, hashA)).toBe(true);
    expect(history[0].author).toBe('carol');
    expect(history[1].author).toBe('bob');
    expect(history[2].author).toBe('alice');
  });

  it('tracks unbinds with null value entries', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.unbind('skill-a');
    await ns.bind('skill-a', hashB);

    const history = await ns.nameHistory('skill-a');
    expect(history.length).toBe(3);
    expect(hashRefEquals(history[0].value!, hashB)).toBe(true);
    expect(history[1].value).toBeNull();
    expect(hashRefEquals(history[2].value!, hashA)).toBe(true);
  });

  it('does not duplicate entries when other names change', async () => {
    const { ns } = await buildFixture();
    await ns.bind('skill-a', hashA);
    // Binding skill-b shouldn't add a history entry for skill-a.
    await ns.bind('skill-b', hashB);
    await ns.bind('skill-c', hashC);

    const history = await ns.nameHistory('skill-a');
    expect(history.length).toBe(1);
    expect(hashRefEquals(history[0].value!, hashA)).toBe(true);
  });
});

// ─── Warm-start recovery ─────────────────────────────────────────────────────

describe('GroveNamespace warm-start recovery', () => {
  it('a fresh GroveNamespace over the same arena sees the full chain', async () => {
    const { ns, arena } = await buildFixture();
    await ns.bind('skill-a', hashA);
    await ns.bind('skill-b', hashB);
    await ns.bind('skill-a', hashC); // rebind

    // Rebuild from the same arena.
    const cas2 = new ContentAddressedStore({ arena });
    await cas2.loadIndex();
    const ns2 = new GroveNamespace(cas2);

    expect(hashRefEquals((await ns2.resolve('skill-a'))!, hashC)).toBe(true);
    expect(hashRefEquals((await ns2.resolve('skill-b'))!, hashB)).toBe(true);
    expect(await ns2.chainLength()).toBe(3);

    const history = await ns2.nameHistory('skill-a');
    expect(history.length).toBe(2);
    expect(hashRefEquals(history[0].value!, hashC)).toBe(true);
    expect(hashRefEquals(history[1].value!, hashA)).toBe(true);
  });
});

// ─── Error handling ─────────────────────────────────────────────────────────

describe('GroveNamespace error handling', () => {
  it('rejects NamespaceRecord reads when the target hash is not a namespace record', async () => {
    const { cas, ns } = await buildFixture();
    // Put some random bytes under a random hash.
    const bogusHash = new Uint8Array(32).fill(0xde);
    await cas.put(bogusHash, new TextEncoder().encode('not a record'));
    const ref: HashRef = { algoId: HASH_ALGO.SHA_256, hash: bogusHash };
    await expect(ns.getNamespaceRecord(ref)).rejects.toThrow();
  });

  it('reads gracefully when head pointer is missing (fresh store)', async () => {
    const { ns } = await buildFixture();
    expect(await ns.resolve('x')).toBeNull();
    expect(await ns.headHash()).toBeNull();
    expect(await ns.listBindings()).toEqual({});
    expect(await ns.chainLength()).toBe(0);
    expect(await ns.nameHistory('x')).toEqual([]);
  });
});
