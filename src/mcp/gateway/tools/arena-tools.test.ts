/**
 * Unit tests for arena.* MCP gateway tools (P3B).
 *
 * Uses a minimal mock McpServer that records `tool()` registrations and
 * exposes an `invoke(name, args)` method so tests can call handlers
 * directly without needing a real MCP runtime. The arena backing is the
 * same mock-RustArena pattern used by content-addressed-store tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { registerArenaTools } from './arena-tools.js';
import { ContentAddressedStore } from '../../../memory/content-addressed-store.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../../../memory/rust-arena.js';

// ─── Mock McpServer ──────────────────────────────────────────────────────────

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
}>;

interface RegisteredTool {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  handler: ToolHandler;
}

class MockMcpServer {
  public tools: Map<string, RegisteredTool> = new Map();

  tool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: ToolHandler,
  ): void {
    this.tools.set(name, { name, description, schema, handler });
  }

  async invoke(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`mock: tool ${name} not registered`);
    const result = await tool.handler(args);
    // Every tool returns an MCP-style envelope with a single text chunk
    // containing JSON. Parse it so tests can assert on structured data.
    return JSON.parse(result.content[0].text);
  }

  names(): string[] {
    return Array.from(this.tools.keys()).sort();
  }
}

// ─── Mock arena backend ──────────────────────────────────────────────────────

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
          checkpointPath: '/mock/arena.checkpoint',
          journalPath: '/mock/arena.journal',
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

// ─── Setup helper ────────────────────────────────────────────────────────────

async function buildFixture() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const store = new ContentAddressedStore({ arena });
  await store.loadIndex();
  const server = new MockMcpServer();
  registerArenaTools(server as unknown as Parameters<typeof registerArenaTools>[0], store);
  return { server, store, arena, mock };
}

// ─── Registration ────────────────────────────────────────────────────────────

describe('registerArenaTools', () => {
  it('registers all 8 arena tools on the server', async () => {
    const { server } = await buildFixture();
    expect(server.names()).toEqual([
      'arena.count',
      'arena.get_by_hash',
      'arena.has_hash',
      'arena.list_hashes',
      'arena.preload',
      'arena.put',
      'arena.remove_by_hash',
      'arena.stats',
    ]);
  });

  it('each tool has a non-empty description', async () => {
    const { server } = await buildFixture();
    for (const tool of server.tools.values()) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });
});

// ─── arena.put ───────────────────────────────────────────────────────────────

describe('arena.put', () => {
  it('stores bytes under a caller-supplied hash', async () => {
    const { server, store } = await buildFixture();
    const result = (await server.invoke('arena.put', {
      hashHex: 'deadbeef',
      payloadText: 'hello arena',
    })) as {
      ok: boolean;
      hash: string;
      chunkId: number;
      created: boolean;
      size: number;
    };

    expect(result.ok).toBe(true);
    expect(result.hash).toBe('deadbeef');
    expect(result.created).toBe(true);
    expect(result.size).toBe(11);
    expect(await store.hasHash('deadbeef')).toBe(true);
  });

  it('auto-hashes with SHA-256 when hashHex is omitted', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.put', {
      payloadText: 'hello',
    })) as { hash: string; created: boolean };
    // Known SHA-256 of "hello".
    expect(result.hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
    expect(result.created).toBe(true);
  });

  it('dedup on second put of the same hash', async () => {
    const { server, mock } = await buildFixture();
    const first = (await server.invoke('arena.put', {
      hashHex: '01',
      payloadText: 'a',
    })) as { chunkId: number; created: boolean };
    const second = (await server.invoke('arena.put', {
      hashHex: '01',
      payloadText: 'anything',
    })) as { chunkId: number; created: boolean };

    expect(first.chunkId).toBe(second.chunkId);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(mock.size()).toBe(1);
  });

  it('accepts base64 payload input', async () => {
    const { server } = await buildFixture();
    // "hello" in base64 is "aGVsbG8="
    const result = (await server.invoke('arena.put', {
      hashHex: '02',
      payloadBase64: 'aGVsbG8=',
    })) as { size: number };
    expect(result.size).toBe(5);
  });

  it('errors when neither payload nor base64 is supplied', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.put', {
      hashHex: 'ff',
    })) as { ok: boolean; error?: string };
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/exactly one/);
  });

  it('errors when both payload forms are supplied', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.put', {
      hashHex: 'fe',
      payloadText: 'x',
      payloadBase64: 'YQ==',
    })) as { ok: boolean; error?: string };
    expect(result.ok).toBe(false);
  });
});

// ─── arena.get_by_hash ───────────────────────────────────────────────────────

describe('arena.get_by_hash', () => {
  it('returns base64 payload for a stored hash', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: 'aa', payloadText: 'value' });

    const result = (await server.invoke('arena.get_by_hash', {
      hashHex: 'aa',
    })) as {
      ok: boolean;
      found: boolean;
      hash: string;
      payloadBase64: string;
      size: number;
    };
    expect(result.found).toBe(true);
    expect(result.hash).toBe('aa');
    expect(result.size).toBe(5);
    const decoded = new TextDecoder().decode(base64ToBytes(result.payloadBase64));
    expect(decoded).toBe('value');
  });

  it('returns found:false for a missing hash', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.get_by_hash', {
      hashHex: 'ff',
    })) as { found: boolean };
    expect(result.found).toBe(false);
  });
});

// ─── arena.has_hash ──────────────────────────────────────────────────────────

describe('arena.has_hash', () => {
  it('returns present:true for a stored hash', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: 'bb', payloadText: 'x' });
    const result = (await server.invoke('arena.has_hash', { hashHex: 'bb' })) as {
      present: boolean;
    };
    expect(result.present).toBe(true);
  });

  it('returns present:false for a missing hash', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.has_hash', { hashHex: 'cc' })) as {
      present: boolean;
    };
    expect(result.present).toBe(false);
  });
});

// ─── arena.remove_by_hash ────────────────────────────────────────────────────

describe('arena.remove_by_hash', () => {
  it('frees the chunk and reports removed:true', async () => {
    const { server, mock } = await buildFixture();
    await server.invoke('arena.put', { hashHex: 'dd', payloadText: 'x' });
    expect(mock.size()).toBe(1);

    const result = (await server.invoke('arena.remove_by_hash', { hashHex: 'dd' })) as {
      removed: boolean;
    };
    expect(result.removed).toBe(true);
    expect(mock.size()).toBe(0);
  });

  it('reports removed:false for a missing hash', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.remove_by_hash', {
      hashHex: 'ee',
    })) as { removed: boolean };
    expect(result.removed).toBe(false);
  });
});

// ─── arena.list_hashes ───────────────────────────────────────────────────────

describe('arena.list_hashes', () => {
  it('returns every stored hash with a count', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: '01', payloadText: 'a' });
    await server.invoke('arena.put', { hashHex: '02', payloadText: 'b' });
    await server.invoke('arena.put', { hashHex: '03', payloadText: 'c' });

    const result = (await server.invoke('arena.list_hashes', {})) as {
      count: number;
      total: number;
      hashes: string[];
    };
    expect(result.total).toBe(3);
    expect(result.count).toBe(3);
    expect(result.hashes.sort()).toEqual(['01', '02', '03']);
  });

  it('respects the limit argument', async () => {
    const { server } = await buildFixture();
    for (let i = 0; i < 5; i++) {
      await server.invoke('arena.put', {
        hashHex: `0${i}`,
        payloadText: 'x',
      });
    }
    const result = (await server.invoke('arena.list_hashes', { limit: 2 })) as {
      count: number;
      total: number;
      hashes: string[];
    };
    expect(result.total).toBe(5);
    expect(result.count).toBe(2);
    expect(result.hashes.length).toBe(2);
  });
});

// ─── arena.count ─────────────────────────────────────────────────────────────

describe('arena.count', () => {
  it('returns 0 for an empty store', async () => {
    const { server } = await buildFixture();
    const result = (await server.invoke('arena.count', {})) as { count: number };
    expect(result.count).toBe(0);
  });

  it('reflects puts and removes', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: '01', payloadText: 'a' });
    await server.invoke('arena.put', { hashHex: '02', payloadText: 'b' });
    expect(((await server.invoke('arena.count', {})) as { count: number }).count).toBe(2);

    await server.invoke('arena.remove_by_hash', { hashHex: '01' });
    expect(((await server.invoke('arena.count', {})) as { count: number }).count).toBe(1);
  });
});

// ─── arena.preload ───────────────────────────────────────────────────────────

describe('arena.preload', () => {
  it('reports hits for existing hashes only', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: '01', payloadText: 'a' });
    await server.invoke('arena.put', { hashHex: '02', payloadText: 'b' });

    const result = (await server.invoke('arena.preload', {
      hashes: ['01', '02', '99'],
    })) as { hits: number; requested: number };
    expect(result.hits).toBe(2);
    expect(result.requested).toBe(3);
  });
});

// ─── arena.stats ─────────────────────────────────────────────────────────────

describe('arena.stats', () => {
  it('reports count and index state', async () => {
    const { server } = await buildFixture();
    await server.invoke('arena.put', { hashHex: '01', payloadText: 'a' });
    await server.invoke('arena.put', { hashHex: '02', payloadText: 'b' });

    const result = (await server.invoke('arena.stats', {})) as {
      count: number;
      indexLoaded: boolean;
    };
    expect(result.count).toBe(2);
    expect(result.indexLoaded).toBe(true);
  });
});
