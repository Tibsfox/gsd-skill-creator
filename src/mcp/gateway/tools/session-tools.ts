/**
 * Session gateway tools — session.query, session.patterns.
 *
 * Registers two MCP tools on a gateway server that allow external clients
 * to query cross-project intelligence and retrieve detected patterns
 * from skill-creator analysis.
 *
 * @module mcp/gateway/tools/session-tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionStore } from './session-store.js';

// ── Tool Registration ───────────────────────────────────────────────────────

/**
 * Register all session:* tools on the given MCP server.
 *
 * @param server - The MCP server to register tools on
 * @param store - The session store for intelligence queries
 */
export function registerSessionTools(server: McpServer, store: SessionStore): void {
  registerQueryTool(server, store);
  registerPatternsTool(server, store);
}

// ── session.query ───────────────────────────────────────────────────────────

function registerQueryTool(server: McpServer, store: SessionStore): void {
  server.tool(
    'session.query',
    'Search cross-project intelligence for relevant matches',
    {
      query: z.string().min(1).describe('Search query string'),
      project: z.string().optional().describe('Optional project name to filter results'),
      limit: z.number().int().min(1).max(100).default(20).describe('Maximum results to return (default 20)'),
    },
    async (args) => {
      const matches = store.query(args.query, args.project, args.limit);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            query: args.query,
            project: args.project ?? null,
            matchCount: matches.length,
            matches,
          }, null, 2),
        }],
      };
    },
  );
}

// ── session.patterns ────────────────────────────────────────────────────────

function registerPatternsTool(server: McpServer, store: SessionStore): void {
  server.tool(
    'session.patterns',
    'Get detected patterns from skill-creator analysis, optionally filtered by domain',
    {
      domain: z.string().optional().describe('Optional domain to filter patterns (e.g., "testing", "debugging", "deployment")'),
      minOccurrences: z.number().int().min(1).default(3).describe('Minimum occurrence count threshold (default 3)'),
    },
    async (args) => {
      const patterns = store.getPatterns(args.domain, args.minOccurrences);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            domain: args.domain ?? null,
            minOccurrences: args.minOccurrences,
            patternCount: patterns.length,
            patterns,
          }, null, 2),
        }],
      };
    },
  );
}
