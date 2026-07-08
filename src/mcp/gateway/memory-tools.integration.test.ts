/**
 * Integration tests for MEM-1: the memory.* tools wired into the production
 * gateway factory (createGsdGatewayFactory) and reached over real HTTP.
 *
 * Verifies the D-1 acceptance criterion end-to-end: a client can call
 * memory.store then memory.recall and get the record back, backed by a real
 * FileStore in a temp directory. Also pins the default-off guarantee: a
 * factory built without a memoryService exposes no memory tools.
 *
 * Follows the harness from gateway-298.integration.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startGateway, type GatewayHandle } from './server.js';
import { createGsdGatewayFactory } from './create-gateway-server.js';
import { MemoryService } from '../../memory/service.js';
import { ConversationStore } from '../../memory/conversation-store.js';
import { createTokenInfo, writeToken } from './token-manager.js';
import type { TokenInfo, GatewayScope } from './types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

function createClientTransport(port: number, token: string): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${port}/mcp`),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

function parseToolResult(result: unknown): unknown {
  const r = result as { content: Array<{ type: string; text: string }> };
  return JSON.parse(r.content[0]!.text);
}

const MEMORY_TOOL_NAMES = [
  'memory.query',
  'memory.store',
  'memory.recall',
  'memory.relate',
  'memory.get_relations',
  'memory.deprecate',
  'memory.wakeup',
  'memory.stats',
  'memory.search_conversations',
];

// ── Test Suite ──────────────────────────────────────────────────────────

describe('Gateway memory tools integration (MEM-1)', () => {
  let tempDir: string;
  let gateway: GatewayHandle;
  let storedToken: TokenInfo;
  let port: number;

  async function startWithFactory(
    factory: ReturnType<typeof createGsdGatewayFactory>,
    scopes: GatewayScope[] = ['admin'],
  ) {
    const tokenPath = join(tempDir, 'gateway-token');
    storedToken = createTokenInfo(scopes);
    await writeToken(tokenPath, storedToken);
    gateway = await startGateway(
      { port: 0, host: '127.0.0.1', tokenPath, enableJsonResponse: true },
      factory,
    );
    port = (gateway.httpServer.address() as AddressInfo).port;
  }

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gateway-memory-'));
  });

  afterEach(async () => {
    if (gateway) await gateway.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('with a memory service', () => {
    beforeEach(async () => {
      const memoryDir = join(tempDir, 'memory');
      const memoryService = new MemoryService({
        memoryDir,
        indexFile: 'MEMORY.md',
      });
      await startWithFactory(createGsdGatewayFactory({ memoryService }));
    });

    it('registers all nine memory.* tools', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-list', version: '1.0.0' });
      await client.connect(transport);

      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      for (const expected of MEMORY_TOOL_NAMES) {
        expect(names).toContain(expected);
      }

      await client.close();
    });

    it('stores a memory and recalls it end-to-end', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-roundtrip', version: '1.0.0' });
      await client.connect(transport);

      const storeResult = await client.callTool({
        name: 'memory.store',
        arguments: {
          content: 'Ocean altimetry measures sea-surface height to centimeter precision.',
          type: 'project',
          name: 'altimetry-precision-note',
          description: 'How ocean altimetry works',
        },
      });
      const stored = parseToolResult(storeResult) as { stored: boolean; id: string };
      expect(stored.stored).toBe(true);
      expect(stored.id).toMatch(/[0-9a-f-]{36}/);

      const recallResult = await client.callTool({
        name: 'memory.recall',
        arguments: { query: 'altimetry' },
      });
      const contents = parseToolResult(recallResult) as string[];
      expect(Array.isArray(contents)).toBe(true);
      expect(contents.some((c) => c.includes('centimeter precision'))).toBe(true);

      await client.close();
    });

    it('reflects the stored memory in memory.stats', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-stats', version: '1.0.0' });
      await client.connect(transport);

      await client.callTool({
        name: 'memory.store',
        arguments: {
          content: 'DORIS provides precise orbit determination via ground beacons.',
          type: 'reference',
          name: 'doris-orbit-note',
        },
      });

      const statsResult = await client.callTool({ name: 'memory.stats', arguments: {} });
      const stats = parseToolResult(statsResult) as { totalMemories: number };
      expect(stats.totalMemories).toBeGreaterThanOrEqual(1);

      await client.close();
    });
  });

  describe('scope enforcement for memory tools', () => {
    beforeEach(async () => {
      const memoryDir = join(tempDir, 'memory');
      const memoryService = new MemoryService({ memoryDir, indexFile: 'MEMORY.md' });
      // Stored token grants only 'read' — memory reads allowed, writes denied.
      await startWithFactory(createGsdGatewayFactory({ memoryService }), ['read']);
    });

    it('allows a read-scoped token to call memory.recall', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-read-ok', version: '1.0.0' });
      await client.connect(transport);

      // Should not throw — memory.recall is classified 'read'.
      const result = await client.callTool({ name: 'memory.recall', arguments: { query: 'anything' } });
      expect(parseToolResult(result)).toBeDefined();

      await client.close();
    });

    it('denies a read-scoped token from calling memory.store (write)', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-write-denied', version: '1.0.0' });
      await client.connect(transport);

      await expect(
        client.callTool({
          name: 'memory.store',
          arguments: { content: 'should be denied', type: 'project', name: 'denied-note' },
        }),
      ).rejects.toThrow();

      await client.close();
    });
  });

  describe('without a memory service (default off)', () => {
    beforeEach(async () => {
      await startWithFactory(createGsdGatewayFactory());
    });

    it('registers no memory.* tools', async () => {
      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'mem-absent', version: '1.0.0' });
      await client.connect(transport);

      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      for (const memTool of MEMORY_TOOL_NAMES) {
        expect(names).not.toContain(memTool);
      }
      // Sanity: the always-on chipset tool is still present.
      expect(names).toContain('chipset.get');

      await client.close();
    });
  });

  describe('search_conversations PG semantic preference (MEM-7 step 2)', () => {
    it('prefers the PG semantic searcher and maps its rows to the tool shape', async () => {
      const memoryService = new MemoryService({
        memoryDir: join(tempDir, 'memory'),
        indexFile: 'MEMORY.md',
      });
      const pgConversationSearch = {
        async search() {
          return [
            {
              turn: {
                id: 't1',
                session_id: 'sess-uuid',
                role: 'assistant',
                content: 'a semantic answer about gateways and vectors',
                timestamp: new Date('2026-07-08T00:00:00.000Z'),
              },
              sessionId: 'sess-uuid',
              score: 0.9127,
            },
          ];
        },
      };
      await startWithFactory(createGsdGatewayFactory({ memoryService, pgConversationSearch }));

      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'convo-semantic', version: '1.0.0' });
      await client.connect(transport);

      const res = parseToolResult(
        await client.callTool({ name: 'memory.search_conversations', arguments: { query: 'gateway' } }),
      );
      expect(res).toMatchObject({
        source: 'semantic',
        resultCount: 1,
        results: [
          {
            turnId: 't1',
            sessionId: 'sess-uuid',
            role: 'assistant',
            score: 0.913,
            snippet: 'a semantic answer about gateways and vectors',
          },
        ],
      });

      await client.close();
    });

    it('falls back to keyword search when the PG searcher returns nothing', async () => {
      const memoryService = new MemoryService({
        memoryDir: join(tempDir, 'memory'),
        indexFile: 'MEMORY.md',
      });
      const conversationStore = new ConversationStore({ storePath: join(tempDir, 'conversations') });
      await conversationStore.ingestTurn({
        id: 'k1',
        sessionId: 'sess-1',
        role: 'human',
        content: 'the keyword fallback path still answers',
        timestamp: new Date('2026-07-08T00:00:00.000Z'),
        tags: [],
      });
      const pgConversationSearch = { async search() { return []; } }; // empty → fall back

      await startWithFactory(
        createGsdGatewayFactory({ memoryService, conversationStore, pgConversationSearch }),
      );

      const transport = createClientTransport(port, storedToken.token);
      const client = new Client({ name: 'convo-fallback', version: '1.0.0' });
      await client.connect(transport);

      const res = parseToolResult(
        await client.callTool({ name: 'memory.search_conversations', arguments: { query: 'fallback' } }),
      ) as { source: string; resultCount: number };
      expect(res.source).toBe('keyword');
      expect(res.resultCount).toBeGreaterThanOrEqual(1);

      await client.close();
    });
  });
});
