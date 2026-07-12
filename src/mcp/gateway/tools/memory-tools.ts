/**
 * Memory gateway tools — MCP interface to the unified memory service.
 *
 * Registers 9 MCP tools that expose the LOD-tiered memory system to
 * external clients (Claude Code, other AI tools). Tools cover the full
 * lifecycle: query, store, recall, relate, get_relations, deprecate,
 * wakeup, stats, and conversation search.
 *
 * @module mcp/gateway/tools/memory-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryService } from '../../../memory/service.js';
import type { ConversationStore } from '../../../memory/conversation-store.js';
import type { MemoryType, MemoryScope, MemoryVisibility } from '../../../memory/types.js';
import { inferTemporalClass, inferVisibility } from '../../../memory/types.js';
import {
  hybridRerank,
  scoreToDistance,
  distanceToScore,
  type ScoredDocument,
} from '../../../memory/hybrid-scorer.js';

// ── Shared Schemas ─────────────────────────────────────────────────────────

// Mirror of the canonical MemoryType (src/memory/types.ts) — keep these
// values in sync with that union. (MEM-3)
const MemoryTypeSchema = z.enum([
  'user', 'feedback', 'project', 'reference', 'episodic', 'semantic',
  'lesson', 'finding',
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
 * Provides 9 tools covering the full memory lifecycle:
 *   - memory.query           — hybrid search across all LOD tiers
 *   - memory.store           — persist a new memory
 *   - memory.recall          — quick content-only retrieval
 *   - memory.relate          — create relationships between memories
 *   - memory.get_relations   — list persisted relations for a memory
 *   - memory.deprecate       — mark a memory as no longer valid
 *   - memory.wakeup          — session start context (LOD 100 + 200)
 *   - memory.stats           — system health metrics
 *   - memory.search_conversations — private conversation history search
 *
 * @param server - The MCP server to register tools on
 * @param memoryService - The unified memory service instance
 * @param conversationStore - Optional conversation store (keyword) for search_conversations
 * @param pgConversationSearch - Optional PG semantic searcher; preferred over keyword when present (MEM-7 step 2)
 */
export function registerMemoryTools(
  server: McpServer,
  memoryService: MemoryService,
  conversationStore?: ConversationStore,
  pgConversationSearch?: PgConversationSearcher,
): void {
  registerQueryTool(server, memoryService);
  registerStoreTool(server, memoryService);
  registerRecallTool(server, memoryService);
  registerRelateTool(server, memoryService);
  registerGetRelationsTool(server, memoryService);
  registerDeprecateTool(server, memoryService);
  registerWakeupTool(server, memoryService);
  registerStatsTool(server, memoryService);
  registerSearchConversationsTool(server, conversationStore, pgConversationSearch);
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
      expandRelations: z.boolean().default(false).describe('Also surface memories one hop away from the top hits via persisted relations (default false)'),
    },
    async (args) => {
      try {
        const response = await memoryService.query(args.query, {
          type: args.type as MemoryType | undefined,
          tags: args.tags,
          limit: args.limit,
          cascade: args.cascade,
          visibility: args.visibility as MemoryVisibility | undefined,
          expandRelations: args.expandRelations,
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

// ── memory.get_relations ─────────────────────────────────────────────────────

function registerGetRelationsTool(server: McpServer, memoryService: MemoryService): void {
  server.tool(
    'memory.get_relations',
    'List persisted relations for a memory (as subject or object)',
    {
      memoryId: z.string().uuid().describe('Memory UUID to fetch relations for'),
    },
    async (args) => {
      try {
        const relations = await memoryService.getRelations(args.memoryId);

        return jsonContent({
          memoryId: args.memoryId,
          relationCount: relations.length,
          relations: relations.map(r => ({
            id: r.id,
            subjectId: r.subjectId,
            predicate: r.predicate,
            objectId: r.objectId,
            confidence: r.confidence,
            createdAt: r.createdAt.toISOString(),
          })),
        });
      } catch (err) {
        return errorContent(`memory.get_relations failed: ${err instanceof Error ? err.message : String(err)}`);
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

/**
 * Semantic conversation searcher backed by the LOD-400 PgStore (MEM-7 step 2).
 * Supplied by the gateway when the PG tier + an embedder are active; it embeds
 * the query and runs pgvector cosine search over conversation turns. Returns
 * raw `conversation_turns` rows (snake_case); the tool maps them. Kept as a thin
 * adapter so this module stays decoupled from PgStore / EmbeddingService.
 */
export interface PgConversationSearcher {
  search(
    query: string,
    limit: number,
    sessionFilter?: string[],
  ): Promise<ConversationHit[]>;
  /**
   * Optional lexical arm over the SAME conversation_turns corpus (PG full-text).
   * When present, its rows are fused with the semantic arm and reranked so the
   * hybrid scorer applies to the most-used tier. Absent on searchers that only
   * do semantic search — the fusion degrades to semantic-only in that case.
   */
  searchKeyword?(
    query: string,
    limit: number,
    sessionFilter?: string[],
  ): Promise<ConversationHit[]>;
}

/** A conversation search hit as returned by the PG search arms. */
export interface ConversationHit {
  turn: { id: string; session_id: string; role: string; content: string; timestamp: Date };
  sessionId: string;
  score: number;
}

/**
 * Fuse conversation search hits from one or both PG arms (semantic + lexical)
 * over the same `conversation_turns` corpus and rerank them with the shared
 * hybrid scorer — the same reranker MemoryService.query() applies to the memory
 * tiers, now extended to the conversation tier.
 *
 * Dedups by turn id (keeping the stronger raw score), then mirrors
 * MemoryService.query()'s `merged.length > 1` gate: a single candidate is
 * returned untouched (reranking a set of one cannot change order and would only
 * mutate the displayed score), so single-arm results keep their original score.
 * The polarity bridge matches service.ts exactly — PG cosine/rank score is
 * higher=better, the reranker consumes rawDistance lower=better, so
 * scoreToDistance runs BEFORE and distanceToScore AFTER.
 */
export function fuseConversationHits(
  query: string,
  hits: ConversationHit[],
  now: Date,
): ConversationHit[] {
  const byId = new Map<string, ConversationHit>();
  for (const hit of hits) {
    const existing = byId.get(hit.turn.id);
    if (!existing || hit.score > existing.score) byId.set(hit.turn.id, hit);
  }
  const deduped = Array.from(byId.values());

  if (deduped.length <= 1) return deduped;

  const docs: ScoredDocument[] = deduped.map(h => ({
    id: h.turn.id,
    text: h.turn.content,
    rawDistance: scoreToDistance(h.score),
    date: h.turn.timestamp instanceof Date ? h.turn.timestamp : new Date(h.turn.timestamp),
  }));

  const reranked = hybridRerank(query, docs, now);
  const byIdOrig = new Map(deduped.map(h => [h.turn.id, h]));
  return reranked.map(rr => {
    const orig = byIdOrig.get(rr.doc.id)!;
    return { ...orig, score: distanceToScore(rr.fusedDistance) };
  });
}

function registerSearchConversationsTool(
  server: McpServer,
  conversationStore?: ConversationStore,
  pgConversationSearch?: PgConversationSearcher,
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
      const sessionFilter = args.sessionId ? [args.sessionId] : undefined;

      try {
        // Prefer PG search when the PG tier + embedder are active (MEM-7 step 2).
        // Gather the semantic arm and, when available, the lexical arm over the
        // same conversation_turns corpus, then fuse + rerank so the hybrid scorer
        // applies to the conversation tier. Fall through to the always-on JSONL
        // keyword layer when PG is absent or returns nothing.
        if (pgConversationSearch) {
          const semantic = await pgConversationSearch.search(args.query, args.limit, sessionFilter);
          const keyword = pgConversationSearch.searchKeyword
            ? await pgConversationSearch.searchKeyword(args.query, args.limit, sessionFilter)
            : [];
          const candidates = [...semantic, ...keyword];
          if (candidates.length > 0) {
            const fused = fuseConversationHits(args.query, candidates, new Date()).slice(0, args.limit);
            const mapped = fused.map(r => ({
              turnId: r.turn.id,
              sessionId: r.sessionId,
              role: r.turn.role,
              score: Math.round(r.score * 1000) / 1000,
              snippet: truncate(r.turn.content, 500),
              timestamp: r.turn.timestamp instanceof Date
                ? r.turn.timestamp.toISOString()
                : new Date(r.turn.timestamp).toISOString(),
              // PG rows carry no session metadata; synthesize the id, leave the rest null.
              session: { id: r.sessionId, project: null, branch: null, summary: null },
            }));
            // 'hybrid' only when both arms contributed rows; otherwise the single
            // arm's label ('semantic' or 'keyword') so single-arm behavior and its
            // score are unchanged (the rerank gate skips a lone candidate).
            const source = semantic.length > 0 && keyword.length > 0
              ? 'hybrid'
              : semantic.length > 0 ? 'semantic' : 'keyword';
            return jsonContent({
              query: args.query,
              resultCount: mapped.length,
              results: mapped,
              source,
            });
          }
        }

        if (!conversationStore) {
          return errorContent('Conversation store not configured. Initialize ConversationStore to enable conversation search.');
        }

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
          source: 'keyword',
        });
      } catch (err) {
        return errorContent(`memory.search_conversations failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
