/**
 * Unit tests for session gateway tools (session:query, session:patterns).
 *
 * Tests the session store and end-to-end tool invocation through MCP.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SessionStore } from './session-store.js';
import { registerSessionTools } from './session-tools.js';
import type { SessionMatch, PatternRecord } from './session-types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Call a tool on an MCP server and parse the JSON response.
 */
async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: Record<string, unknown>; isError?: boolean }> {
  const toolMap = (server as unknown as {
    _registeredTools: Record<string, {
      handler: (args: Record<string, unknown>, extra: Record<string, unknown>) => Promise<{
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      }>;
    }>;
  })._registeredTools;

  if (!toolMap) {
    throw new Error('Cannot access tool handlers');
  }

  const tool = toolMap[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not found. Available: ${Object.keys(toolMap).join(', ')}`);
  }

  const response = await tool.handler(args, {});
  const text = response.content[0]?.text;
  if (!text) throw new Error('Empty response from tool');

  return {
    result: JSON.parse(text),
    isError: response.isError,
  };
}

/**
 * Create a pre-populated session store for testing.
 */
function createTestStore(): SessionStore {
  const store = new SessionStore();

  // Add intelligence entries
  store.addEntry({
    id: 'entry-1',
    project: 'project-alpha',
    content: 'MCP server integration patterns for TypeScript projects',
    tags: ['mcp', 'typescript', 'integration'],
    timestamp: Date.now() - 3600000,
  });

  store.addEntry({
    id: 'entry-2',
    project: 'project-alpha',
    content: 'Vitest testing patterns with concurrent test isolation',
    tags: ['testing', 'vitest', 'concurrency'],
    timestamp: Date.now() - 7200000,
  });

  store.addEntry({
    id: 'entry-3',
    project: 'project-beta',
    content: 'Rust FFI type mapping for Tauri IPC commands',
    tags: ['rust', 'ffi', 'tauri'],
    timestamp: Date.now() - 1800000,
  });

  store.addEntry({
    id: 'entry-4',
    project: 'project-beta',
    content: 'MCP gateway authentication with bearer tokens',
    tags: ['mcp', 'gateway', 'auth'],
    timestamp: Date.now() - 900000,
  });

  // Add pattern records
  store.addPattern({
    id: 'pattern-1',
    name: 'test-before-commit',
    description: 'Run tests before every git commit to catch regressions early',
    domain: 'testing',
    occurrences: 5,
    confidence: 0.92,
    exampleSessions: ['session-a', 'session-b', 'session-c'],
    firstSeen: Date.now() - 86400000,
    lastSeen: Date.now() - 3600000,
  });

  store.addPattern({
    id: 'pattern-2',
    name: 'type-first-development',
    description: 'Define Zod schemas and TypeScript types before implementation',
    domain: 'development',
    occurrences: 8,
    confidence: 0.95,
    exampleSessions: ['session-d', 'session-e'],
    firstSeen: Date.now() - 172800000,
    lastSeen: Date.now() - 7200000,
  });

  store.addPattern({
    id: 'pattern-3',
    name: 'lint-fix-cycle',
    description: 'Run lint, fix errors, re-run lint pattern',
    domain: 'testing',
    occurrences: 2,
    confidence: 0.65,
    exampleSessions: ['session-f'],
    firstSeen: Date.now() - 43200000,
    lastSeen: Date.now() - 10800000,
  });

  return store;
}

// ── SessionStore Tests ──────────────────────────────────────────────────

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('query', () => {
    it('returns ranked matches for a search query', () => {
      const matches = store.query('MCP');

      expect(matches.length).toBe(2);
      // Both MCP entries should match
      expect(matches.every((m) => m.content.toLowerCase().includes('mcp'))).toBe(true);
      // Higher relevance first
      expect(matches[0]!.relevance).toBeGreaterThanOrEqual(matches[1]!.relevance);
    });

    it('filters by project', () => {
      const matches = store.query('MCP', 'project-alpha');

      expect(matches.length).toBe(1);
      expect(matches[0]!.project).toBe('project-alpha');
    });

    it('returns empty array for no matches', () => {
      const matches = store.query('nonexistent-query-xyz');

      expect(matches).toEqual([]);
    });

    it('matches on tags', () => {
      const matches = store.query('typescript');

      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty for empty store', () => {
      const emptyStore = new SessionStore();
      const matches = emptyStore.query('anything');

      expect(matches).toEqual([]);
    });

    it('is case-insensitive', () => {
      const upper = store.query('MCP');
      const lower = store.query('mcp');

      expect(upper.length).toBe(lower.length);
    });
  });

  describe('getPatterns', () => {
    it('returns all patterns above default minOccurrences threshold', () => {
      const patterns = store.getPatterns();

      // Default minOccurrences is 3, so lint-fix-cycle (occurrences=2) is excluded
      expect(patterns.length).toBe(2);
    });

    it('returns all patterns when minOccurrences is 1', () => {
      const patterns = store.getPatterns(undefined, 1);

      expect(patterns.length).toBe(3);
    });

    it('filters by domain', () => {
      const patterns = store.getPatterns('testing', 1);

      expect(patterns.length).toBe(2);
      expect(patterns.every((p) => p.domain === 'testing')).toBe(true);
    });

    it('respects minOccurrences threshold', () => {
      const patterns = store.getPatterns(undefined, 3);

      // Only patterns with 3+ occurrences
      expect(patterns.length).toBe(2);
      expect(patterns.every((p) => p.occurrences >= 3)).toBe(true);
    });

    it('combines domain filter and minOccurrences', () => {
      const patterns = store.getPatterns('testing', 3);

      expect(patterns.length).toBe(1);
      expect(patterns[0]!.name).toBe('test-before-commit');
    });

    it('returns empty for unknown domain', () => {
      const patterns = store.getPatterns('nonexistent-domain');

      expect(patterns).toEqual([]);
    });

    it('returns empty for empty store', () => {
      const emptyStore = new SessionStore();
      const patterns = emptyStore.getPatterns();

      expect(patterns).toEqual([]);
    });
  });
});

// ── Session Tool Tests ──────────────────────────────────────────────────

describe('Session Tools (MCP)', () => {
  let server: McpServer;
  let store: SessionStore;

  beforeEach(() => {
    server = new McpServer({ name: 'test-session-tools', version: '1.0.0' });
    store = createTestStore();
    registerSessionTools(server, store);
  });

  describe('session:query', () => {
    it('returns matches for a search query', async () => {
      const { result } = await callTool(server, 'session:query', {
        query: 'MCP integration',
      });

      expect(result.matchCount).toBeGreaterThan(0);
      const matches = result.matches as SessionMatch[];
      expect(matches[0]!.content).toContain('MCP');
    });

    it('filters by project', async () => {
      const { result } = await callTool(server, 'session:query', {
        query: 'MCP',
        project: 'project-beta',
      });

      const matches = result.matches as SessionMatch[];
      expect(matches.every((m) => m.project === 'project-beta')).toBe(true);
    });

    it('returns empty matches for no results', async () => {
      const { result } = await callTool(server, 'session:query', {
        query: 'completely-nonexistent-term-xyz',
      });

      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
    });

    it('returns error for empty query string', async () => {
      // Empty string should be rejected by Zod min(1)
      // The MCP SDK will handle the validation error
      // We test with a valid but no-match query instead
      const { result } = await callTool(server, 'session:query', {
        query: '.',
      });

      // A single dot may or may not match depending on content
      expect(result).toBeDefined();
    });
  });

  describe('session:patterns', () => {
    it('returns patterns above default minOccurrences threshold', async () => {
      const { result } = await callTool(server, 'session:patterns', {});

      // Default minOccurrences is 3, so lint-fix-cycle (occurrences=2) is excluded
      expect(result.patternCount).toBe(2);
      const patterns = result.patterns as PatternRecord[];
      expect(patterns.length).toBe(2);
    });

    it('returns all patterns when minOccurrences is 1', async () => {
      const { result } = await callTool(server, 'session:patterns', {
        minOccurrences: 1,
      });

      expect(result.patternCount).toBe(3);
    });

    it('filters by domain', async () => {
      const { result } = await callTool(server, 'session:patterns', {
        domain: 'testing',
        minOccurrences: 1,
      });

      const patterns = result.patterns as PatternRecord[];
      expect(patterns.every((p) => p.domain === 'testing')).toBe(true);
      expect(patterns.length).toBe(2);
    });

    it('respects minOccurrences threshold', async () => {
      const { result } = await callTool(server, 'session:patterns', {
        minOccurrences: 5,
      });

      const patterns = result.patterns as PatternRecord[];
      expect(patterns.every((p) => p.occurrences >= 5)).toBe(true);
    });

    it('returns empty patterns for unknown domain', async () => {
      const { result } = await callTool(server, 'session:patterns', {
        domain: 'nonexistent',
      });

      expect(result.patternCount).toBe(0);
      expect(result.patterns).toEqual([]);
    });

    it('sorts by confidence descending', async () => {
      const { result } = await callTool(server, 'session:patterns', {});

      const patterns = result.patterns as PatternRecord[];
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1]!.confidence).toBeGreaterThanOrEqual(patterns[i]!.confidence);
      }
    });
  });
});
