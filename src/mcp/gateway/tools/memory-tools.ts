/**
 * Memory gateway tools — MCP interface to the unified memory service.
 *
 * Registers 8 MCP tools that expose the LOD-tiered memory system to
 * external clients (Claude Code, other AI tools). Tools cover the full
 * lifecycle: query, store, recall, relate, deprecate, wakeup, stats,
 * and conversation search.
 *
 * @module mcp/gateway/tools/memory-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryService } from '../../../memory/service.js';
import type { ConversationStore } from '../../../memory/conversation-store.js';
import type { MemoryType, MemoryScope, MemoryVisibility } from '../../../memory/types.js';
import { inferTemporalClass, inferVisibility } from '../../../memory/types.js';

// ── Shared Schemas ─────────────────────────────────────────────────────────

const MemoryTypeSchema = z.enum([
  'user', 'feedback', 'project', 'reference', 'episodic', 'semantic',
]);

const MemoryScopeSchema = z.enum([
  'global', 'domain', 'project', 'branch', 'session',
]);

const MemoryVisibilitySchema = z.enum([
  'private', 'internal', 'public',
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Truncate a string to a maximum length, appending ellipsis if needed. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/** Wrap a JSON payload in the MCP content envelope. */
function jsonContent(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(data, null, 2),
    }],
  };
}

/** Wrap an error message in the MCP content envelope. */
function errorContent(message: string): { content: [{ type: 'text'; text: string }] } {
  return jsonContent({ error: message });
}

// ── Tool Registration ──────────────────────────────────────────────────────

/**
 * Register all memory:* tools on the given MCP server.
 *
 * Provides 8 tools covering the full memory lifecycle:
 *   - memory.query           — hybrid search across all LOD tiers
 *   - memory.store           — persist a new memory
 *   - memory.recall          — quick content-only retrieval
 *   - memory.relate          — create relationships between memories
 *   - memory.deprecate       — mark a memory as no longer valid
 *   - memory.wakeup          — session start context (LOD 100 + 200)
 *   - memory.stats           — system health metrics
 *   - memory.search_conversations — private conversation history search
 *
 * @param server - The MCP server to register tools on
 * @param memoryService - The unified memory service instance
 * @param conversationStore - Optional conversation store for search_conversations
 */
export function registerMemoryTools(
  server: McpServer,
  memoryService: MemoryService,
  conversationStore?: ConversationStore,
): void {
  registerQueryTool(server, memoryService);
  registerStoreTool(server, memoryService);
  registerRecallTool(server, memoryService);
  registerRelateTool(server, memoryService);
  registerDeprecateTool(server, memoryService);
  registerWakeupTool(server, memoryService);
  registerStatsTool(server, memoryService);
  registerSearchConversationsTool(server, conversationStore);
}

// ── memory.query ───────────────────────────────────────────────────────────

function registerQueryTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.query',
    'Search across all memory tiers with hybrid re-ranking',
    {
      query: z.string().min(1).describe('Search query string'),
      type: MemoryTypeSchema.optional().describe('Filter by memory type'),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      limit: z.number().int().min(1).max(100).default(10).describe('Maximum results to return (default 10)'),
      cascade: z.boolean().default(true).describe('Cascade through LOD tiers (default true)'),
      visibility: MemoryVisibilitySchema.optional().describe('Maximum visibility level to include'),
    },
    async (args) => {
      try {
        const response = await memoryService.query(args.query, {
          type: args.type as MemoryType | undefined,
          tags: args.tags,
          limit: args.limit,
          cascade: args.cascade,
          visibility: args.visibility as MemoryVisibility | undefined,
        });

        const results = response.results.map(r => ({
          name: r.record.name,
          description: r.record.description,
          score: Math.round(r.score * 1000) / 1000,
          content: truncate(r.record.content, 500),
          tier: r.sourceLod,
          type: r.record.type,
          id: r.record.id,
        }));

        return jsonContent({
          query: args.query,
          resultCount: results.length,
          results,
          queryTimeMs: Math.round(response.queryTimeMs * 100) / 100,
          tiersSearched: response.tiersSearched,
          totalTokens: response.totalTokens,
        });
      } catch (err) {
        return errorContent(`memory.query failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.store ───────────────────────────────────────────────────────────

function registerStoreTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.store',
    'Store a new memory in the LOD-tiered memory system',
    {
      content: z.string().min(1).describe('The memory content to store'),
      type: MemoryTypeSchema.describe('Memory classification'),
      name: z.string().min(1).max(200).describe('Short name for indexing and display'),
      description: z.string().max(500).optional().describe('One-line description for relevance matching'),
      tags: z.array(z.string()).optional().describe('Tags for filtering'),
      scope: MemoryScopeSchema.optional().describe('Where this memory applies (default: project)'),
      visibility: MemoryVisibilitySchema.optional().describe('Visibility classification (default: inferred from type/scope)'),
    },
    async (args) => {
      try {
        const type = args.type as MemoryType;
        const scope = (args.scope ?? 'project') as MemoryScope;
        const tags = args.tags ?? [];
        const visibility = (args.visibility ?? inferVisibility(type, scope, tags)) as MemoryVisibility;

        // Use remember() for the base record, then augment provenance
        const record = await memoryService.remember(
          args.content,
          type,
          args.name,
          args.description,
        );

        // Patch provenance with provided scope/visibility/tags
        record.tags = tags;
        record.provenance.scope = scope;
        record.provenance.visibility = visibility;
        record.temporalClass = inferTemporalClass(type, scope);

        return jsonContent({
          id: record.id,
          name: record.name,
          type: record.type,
          lodTier: record.lodCurrent,
          scope,
          visibility,
          temporalClass: record.temporalClass,
          stored: true,
        });
      } catch (err) {
        return errorContent(`memory.store failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.recall ──────────────────────────────────────────────────────────

function registerRecallTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.recall',
    'Quick retrieval — returns content strings only, no metadata',
    {
      query: z.string().min(1).describe('Search query string'),
      limit: z.number().int().min(1).max(50).default(5).describe('Maximum results to return (default 5)'),
    },
    async (args) => {
      try {
        const response = await memoryService.query(args.query, {
          cascade: true,
          limit: args.limit,
          minResults: 3,
        });

        const contents = response.results.map(r => r.record.content);

        return jsonContent(contents);
      } catch (err) {
        return errorContent(`memory.recall failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.relate ──────────────────────────────────────────────────────────

function registerRelateTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.relate',
    'Create a relationship between two memories',
    {
      subjectId: z.string().uuid().describe('Source memory UUID'),
      predicate: z.enum(['supersedes', 'contradicts', 'elaborates', 'derives-from']).describe('Relationship type'),
      objectId: z.string().uuid().describe('Target memory UUID'),
    },
    async (args) => {
      try {
        await memoryService.relate(
          args.subjectId,
          args.predicate as 'supersedes' | 'contradicts' | 'elaborates' | 'derives-from',
          args.objectId,
        );

        return jsonContent({
          subjectId: args.subjectId,
          predicate: args.predicate,
          objectId: args.objectId,
          created: true,
          note: args.predicate === 'supersedes' || args.predicate === 'contradicts'
            ? `Object memory ${args.objectId} was automatically deprecated`
            : undefined,
        });
      } catch (err) {
        return errorContent(`memory.relate failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.deprecate ───────────────────────────────────────────────────────

function registerDeprecateTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.deprecate',
    'Mark a memory as no longer valid (sets validTo timestamp)',
    {
      id: z.string().uuid().describe('Memory UUID to deprecate'),
      reason: z.string().max(500).optional().describe('Explanation for deprecation'),
    },
    async (args) => {
      try {
        await memoryService.deprecate(args.id, args.reason);

        return jsonContent({
          id: args.id,
          deprecated: true,
          reason: args.reason ?? null,
        });
      } catch (err) {
        return errorContent(`memory.deprecate failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.wakeup ──────────────────────────────────────────────────────────

function registerWakeupTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.wakeup',
    'Get session start context from LOD 100 (RAM) and LOD 200 (index)',
    {},
    async () => {
      try {
        const { context, tokenEstimate } = await memoryService.getWakeUpContext();

        return jsonContent({
          context,
          tokenEstimate,
          tiers: ['LOD 100 (RAM)', 'LOD 200 (Index)'],
        });
      } catch (err) {
        return errorContent(`memory.wakeup failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.stats ───────────────────────────────────────────────────────────

function registerStatsTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.stats',
    'Get memory system health metrics — tier counts, type distribution, active vs deprecated',
    {},
    async () => {
      try {
        const stats = await memoryService.getStats();

        return jsonContent({
          tierCounts: stats.tierCounts,
          totalMemories: stats.totalMemories,
          typeCounts: stats.typeCounts,
          activeCount: stats.activeCount,
          deprecatedCount: stats.deprecatedCount,
          avgAccessCount: Math.round(stats.avgAccessCount * 100) / 100,
          oldestMemory: stats.oldestMemory?.toISOString() ?? null,
          newestMemory: stats.newestMemory?.toISOString() ?? null,
        });
      } catch (err) {
        return errorContent(`memory.stats failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}

// ── memory.search_conversations ────────────────────────────────────────────

function registerSearchConversationsTool(
  server: McpServer,
  conversationStore?: ConversationStore,
): void {
  server.tool(
    'memory.search_conversations',
    'Search private conversation history (local only, never synced externally)',
    {
      query: z.string().min(1).describe('Search query string'),
      limit: z.number().int().min(1).max(100).default(20).describe('Maximum results to return (default 20)'),
      sessionId: z.string().optional().describe('Filter to a specific session UUID'),
    },
    async (args) => {
      if (!conversationStore) {
        return errorContent('Conversation store not configured. Initialize ConversationStore to enable conversation search.');
      }

      try {
        const sessionFilter = args.sessionId ? [args.sessionId] : undefined;
        const results = await conversationStore.search(args.query, args.limit, sessionFilter);

        const mapped = results.map(r => ({
          turnId: r.turn.id,
          sessionId: r.turn.sessionId,
          role: r.turn.role,
          score: Math.round(r.score * 1000) / 1000,
          snippet: truncate(r.snippet, 500),
          timestamp: r.turn.timestamp.toISOString(),
          session: {
            id: r.session.id,
            project: r.session.project ?? null,
            branch: r.session.branch ?? null,
            summary: r.session.summary ?? null,
          },
        }));

        return jsonContent({
          query: args.query,
          resultCount: mapped.length,
          results: mapped,
        });
      } catch (err) {
        return errorContent(`memory.search_conversations failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
