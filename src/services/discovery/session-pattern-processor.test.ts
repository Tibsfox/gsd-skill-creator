/**
 * TDD tests for session pattern processor with subagent discovery.
 *
 * Tests processSession (single-pass AsyncGenerator consumption extracting both
 * tool sequences and bash commands), discoverSubagentFiles (JSONL file discovery
 * in subagents/ directory), and createPatternSessionProcessor (SessionProcessor
 * factory for CorpusScanner integration).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { processSession, discoverSubagentFiles, createPatternSessionProcessor } from './session-pattern-processor.js';
import { PatternAggregator } from './pattern-aggregator.js';
import type { ParsedEntry, SessionInfo } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create an AsyncGenerator from an array of ParsedEntry for testing.
 */
async function* entriesFrom(items: ParsedEntry[]): AsyncGenerator<ParsedEntry> {
  for (const item of items) {
    yield item;
  }
}

/**
 * Create a tool-uses ParsedEntry with the given tool names.
 */
function toolUses(...names: string[]): ParsedEntry {
  return {
    kind: 'tool-uses',
    data: names.map(name => ({ name, input: {} })),
  };
}

/**
 * Create a tool-uses ParsedEntry with a Bash tool containing a command string.
 */
function bashTool(command: string): ParsedEntry {
  return {
    kind: 'tool-uses',
    data: [{ name: 'Bash', input: { command } }],
  };
}

/**
 * Create a skipped ParsedEntry.
 */
function skipped(type: string): ParsedEntry {
  return { kind: 'skipped', type };
}

/**
 * Create a user-prompt ParsedEntry.
 */
function userPrompt(text: string): ParsedEntry {
  return {
    kind: 'user-prompt',
    data: { text, sessionId: 'test-session', timestamp: '2026-01-01T00:00:00Z', cwd: '/tmp' },
  };
}

/**
 * Create a minimal SessionInfo object.
 */
function makeSessionInfo(overrides: Partial<SessionInfo> & { fullPath: string; sessionId: string; projectSlug: string }): SessionInfo {
  return {
    fileMtime: Date.now(),
    messageCount: 10,
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// processSession
// ============================================================================

describe('processSession', () => {
  it('extracts tool bigrams from tool-uses entries', async () => {
    const entries = entriesFrom([
      toolUses('Read'),
      toolUses('Edit'),
      toolUses('Bash'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    expect(result.toolBigrams.get('Read->Edit')).toBe(1);
    expect(result.toolBigrams.get('Edit->Bash')).toBe(1);
  });

  it('extracts tool trigrams from tool-uses entries', async () => {
    const entries = entriesFrom([
      toolUses('Read'),
      toolUses('Edit'),
      toolUses('Bash'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    expect(result.toolTrigrams.get('Read->Edit->Bash')).toBe(1);
  });

  it('extracts bash command categories from Bash tool invocations', async () => {
    const entries = entriesFrom([
      bashTool('git status'),
      bashTool('git add .'),
      bashTool('npx vitest run'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    expect(result.bashPatterns.get('git-workflow')).toBe(2);
    expect(result.bashPatterns.get('test-command')).toBe(1);
  });

  it('extracts both tool sequences and bash patterns in single pass', async () => {
    const entries = entriesFrom([
      toolUses('Read'),
      toolUses('Edit'),
      bashTool('git commit -m "test"'),
      toolUses('Bash'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    // Tool sequence includes all tool names: Read, Edit, Bash (from bash tool), Bash
    expect(result.toolBigrams.size).toBeGreaterThan(0);
    expect(result.bashPatterns.get('git-workflow')).toBe(1);
  });

  it('sets sessionId and projectSlug on result', async () => {
    const entries = entriesFrom([toolUses('Read')]);

    const result = await processSession(entries, 'my-session', 'my-project');

    expect(result.sessionId).toBe('my-session');
    expect(result.projectSlug).toBe('my-project');
  });

  it('handles empty generator gracefully', async () => {
    const entries = entriesFrom([]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    expect(result.toolBigrams.size).toBe(0);
    expect(result.toolTrigrams.size).toBe(0);
    expect(result.bashPatterns.size).toBe(0);
  });

  it('skips user-prompt and skipped entries for tool sequences', async () => {
    const entries = entriesFrom([
      userPrompt('hello'),
      toolUses('Read'),
      skipped('progress'),
      toolUses('Edit'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    // Only Read and Edit should form tool sequence
    expect(result.toolBigrams.get('Read->Edit')).toBe(1);
    expect(result.toolBigrams.size).toBe(1);
  });

  it('handles multi-tool entries by flattening tool names', async () => {
    const entries = entriesFrom([
      toolUses('Read', 'Grep'),
      toolUses('Edit'),
    ]);

    const result = await processSession(entries, 'sess-1', 'proj-a');

    // Sequence: Read, Grep, Edit
    expect(result.toolBigrams.get('Read->Grep')).toBe(1);
    expect(result.toolBigrams.get('Grep->Edit')).toBe(1);
  });

  it('consumes the AsyncGenerator exactly once (single pass)', async () => {
    let yieldCount = 0;
    async function* countingGen(): AsyncGenerator<ParsedEntry> {
      yieldCount++;
      yield toolUses('Read');
      yieldCount++;
      yield toolUses('Edit');
    }

    await processSession(countingGen(), 'sess-1', 'proj-a');

    // Each yield should be hit exactly once
    expect(yieldCount).toBe(2);
  });
});

// ============================================================================
// discoverSubagentFiles
// ============================================================================

describe('discoverSubagentFiles', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'gsd-subagent-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns .jsonl files from the subagents directory', async () => {
    // Create session file path: /tmp/xxx/session.jsonl
    const sessionPath = path.join(tempDir, 'session.jsonl');
    await fs.writeFile(sessionPath, '');

    // Create subagents dir: /tmp/xxx/session/subagents/
    const subagentDir = path.join(tempDir, 'session', 'subagents');
    await fs.mkdir(subagentDir, { recursive: true });
    await fs.writeFile(path.join(subagentDir, 'agent-1.jsonl'), '');
    await fs.writeFile(path.join(subagentDir, 'agent-2.jsonl'), '');

    const files = await discoverSubagentFiles(sessionPath);

    expect(files).toHaveLength(2);
    expect(files.some(f => f.endsWith('agent-1.jsonl'))).toBe(true);
    expect(files.some(f => f.endsWith('agent-2.jsonl'))).toBe(true);
  });

  it('returns empty array when subagents directory does not exist', async () => {
    const sessionPath = path.join(tempDir, 'session.jsonl');

    const files = await discoverSubagentFiles(sessionPath);

    expect(files).toEqual([]);
  });

  it('ignores non-.jsonl files in the subagents directory', async () => {
    const sessionPath = path.join(tempDir, 'session.jsonl');
    await fs.writeFile(sessionPath, '');

    const subagentDir = path.join(tempDir, 'session', 'subagents');
    await fs.mkdir(subagentDir, { recursive: true });
    await fs.writeFile(path.join(subagentDir, 'agent-1.jsonl'), '');
    await fs.writeFile(path.join(subagentDir, 'notes.txt'), '');
    await fs.writeFile(path.join(subagentDir, 'data.json'), '');

    const files = await discoverSubagentFiles(sessionPath);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('agent-1.jsonl');
  });

  it('returns full absolute paths', async () => {
    const sessionPath = path.join(tempDir, 'session.jsonl');
    await fs.writeFile(sessionPath, '');

    const subagentDir = path.join(tempDir, 'session', 'subagents');
    await fs.mkdir(subagentDir, { recursive: true });
    await fs.writeFile(path.join(subagentDir, 'agent-1.jsonl'), '');

    const files = await discoverSubagentFiles(sessionPath);

    expect(path.isAbsolute(files[0])).toBe(true);
    expect(files[0]).toBe(path.join(subagentDir, 'agent-1.jsonl'));
  });
});

// ============================================================================
// createPatternSessionProcessor
// ============================================================================

describe('createPatternSessionProcessor', () => {
  it('returns a function compatible with SessionProcessor type', () => {
    const aggregator = new PatternAggregator();
    const processor = createPatternSessionProcessor(aggregator);

    expect(typeof processor).toBe('function');
  });

  it('processes main session entries and adds patterns to aggregator', async () => {
    const aggregator = new PatternAggregator();
    const processor = createPatternSessionProcessor(aggregator);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      toolUses('Read'),
      toolUses('Edit'),
      toolUses('Bash'),
    ]);

    await processor(session, entries);

    const results = aggregator.getResults();
    expect(results.get('tool:bigram:Read->Edit')).toBeDefined();
    expect(results.get('tool:bigram:Edit->Bash')).toBeDefined();
    expect(results.get('tool:trigram:Read->Edit->Bash')).toBeDefined();
  });

  it('attributes patterns to the session projectSlug', async () => {
    const aggregator = new PatternAggregator();
    const processor = createPatternSessionProcessor(aggregator);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'my-project',
    });

    const entries = entriesFrom([toolUses('Read'), toolUses('Edit')]);

    await processor(session, entries);

    const results = aggregator.getResults();
    const entry = results.get('tool:bigram:Read->Edit')!;
    expect(entry.projectSlugs.has('my-project')).toBe(true);
  });

  it('discovers and processes subagent JSONL files', async () => {
    // Set up real temp files for subagent discovery
    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'gsd-processor-test-'));

    try {
      const sessionPath = path.join(tempDir, 'session.jsonl');
      await fs.writeFile(sessionPath, '');

      // Create subagents directory with a JSONL containing a tool-uses entry
      const subagentDir = path.join(tempDir, 'session', 'subagents');
      await fs.mkdir(subagentDir, { recursive: true });

      // Write a valid JSONL entry that the session parser can process
      const subagentJsonl = JSON.stringify({
        type: 'assistant',
        uuid: 'u1',
        sessionId: 'sub-sess',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tu1', name: 'Glob', input: { pattern: '**/*.ts' } },
            { type: 'tool_use', id: 'tu2', name: 'Read', input: { file_path: '/x.ts' } },
          ],
        },
      });
      await fs.writeFile(path.join(subagentDir, 'agent-1.jsonl'), subagentJsonl + '\n');

      const aggregator = new PatternAggregator();
      const processor = createPatternSessionProcessor(aggregator);

      const session = makeSessionInfo({
        fullPath: sessionPath,
        sessionId: 'parent-sess',
        projectSlug: 'proj-a',
      });

      // Main session entries are empty -- only subagent has data
      const entries = entriesFrom([]);

      await processor(session, entries);

      const results = aggregator.getResults();

      // Subagent had Glob->Read bigram
      const bigram = results.get('tool:bigram:Glob->Read');
      expect(bigram).toBeDefined();
      // Subagent patterns attributed to parent projectSlug
      expect(bigram!.projectSlugs.has('proj-a')).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('uses subagent sessionId format: parentId:subagent:basename', async () => {
    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'gsd-subid-test-'));

    try {
      const sessionPath = path.join(tempDir, 'session.jsonl');
      await fs.writeFile(sessionPath, '');

      const subagentDir = path.join(tempDir, 'session', 'subagents');
      await fs.mkdir(subagentDir, { recursive: true });

      const subagentJsonl = JSON.stringify({
        type: 'assistant',
        uuid: 'u1',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tu1', name: 'Read', input: {} },
            { type: 'tool_use', id: 'tu2', name: 'Edit', input: {} },
          ],
        },
      });
      await fs.writeFile(path.join(subagentDir, 'my-agent.jsonl'), subagentJsonl + '\n');

      const aggregator = new PatternAggregator();
      const processor = createPatternSessionProcessor(aggregator);

      const session = makeSessionInfo({
        fullPath: sessionPath,
        sessionId: 'parent-123',
        projectSlug: 'proj-x',
      });

      await processor(session, entriesFrom([]));

      const results = aggregator.getResults();
      const bigram = results.get('tool:bigram:Read->Edit');
      expect(bigram).toBeDefined();
      // Check the subagent sessionId format
      expect(bigram!.sessionIds.has('parent-123:subagent:my-agent.jsonl')).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
