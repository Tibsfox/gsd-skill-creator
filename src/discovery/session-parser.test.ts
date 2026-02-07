import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { parseSessionFile, parseJsonlLine } from './session-parser.js';
import type { ParsedEntry } from './types.js';

// ---------------------------------------------------------------------------
// Test fixture data (mirrors real Claude Code JSONL shapes)
// ---------------------------------------------------------------------------

const userPromptEntry = {
  type: 'user',
  uuid: 'test-uuid-1',
  sessionId: 'test-session-1',
  timestamp: '2026-01-15T10:00:00.000Z',
  cwd: '/home/user/project',
  message: { role: 'user', content: 'Refactor the auth module to use JWT tokens' },
};

const assistantToolEntry = {
  type: 'assistant',
  uuid: 'test-uuid-2',
  sessionId: 'test-session-1',
  timestamp: '2026-01-15T10:00:05.000Z',
  message: {
    role: 'assistant',
    content: [
      { type: 'text', text: 'I will read the auth module first.' },
      { type: 'tool_use', id: 'tu_1', name: 'Read', input: { file_path: '/src/auth.ts' } },
    ],
  },
};

const assistantMultiToolEntry = {
  type: 'assistant',
  uuid: 'test-uuid-3',
  sessionId: 'test-session-1',
  timestamp: '2026-01-15T10:00:10.000Z',
  message: {
    role: 'assistant',
    content: [
      { type: 'tool_use', id: 'tu_2', name: 'Read', input: { file_path: '/src/a.ts' } },
      { type: 'text', text: 'Now writing.' },
      { type: 'tool_use', id: 'tu_3', name: 'Write', input: { file_path: '/src/b.ts', content: '...' } },
      { type: 'tool_use', id: 'tu_4', name: 'Bash', input: { command: 'npm test' } },
    ],
  },
};

const assistantTextOnlyEntry = {
  type: 'assistant',
  uuid: 'test-uuid-4',
  sessionId: 'test-session-1',
  timestamp: '2026-01-15T10:00:15.000Z',
  message: {
    role: 'assistant',
    content: [
      { type: 'text', text: 'Here is a summary of the changes.' },
      { type: 'text', text: 'No tools were needed.' },
    ],
  },
};

const progressEntry = {
  type: 'progress',
  sessionId: 'test-session-1',
  content: { type: 'bash_progress', output: 'npm test' },
};

const fileHistoryEntry = {
  type: 'file-history-snapshot',
  sessionId: 'test-session-1',
  files: [{ path: '/src/auth.ts', hash: 'abc123' }],
};

const queueOperationEntry = {
  type: 'queue-operation',
  sessionId: 'test-session-1',
  operation: 'enqueue',
};

const systemEntry = {
  type: 'system',
  sessionId: 'test-session-1',
  message: { role: 'system', content: 'System prompt' },
};

const summaryEntry = {
  type: 'summary',
  sessionId: 'test-session-1',
  summary: 'Refactored auth to JWT',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDirs: string[] = [];

function createTempFile(lines: string[]): string {
  const tmpDir = mkdtempSync(join(os.tmpdir(), 'session-parser-test-'));
  tempDirs.push(tmpDir);
  const filePath = join(tmpDir, 'session.jsonl');
  writeFileSync(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
  tempDirs = [];
});

/** Collect all entries from an async generator */
async function collectEntries(filePath: string): Promise<ParsedEntry[]> {
  const entries: ParsedEntry[] = [];
  for await (const entry of parseSessionFile(filePath)) {
    entries.push(entry);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// parseJsonlLine tests
// ---------------------------------------------------------------------------

describe('parseJsonlLine', () => {
  it('parses user entry with string content', () => {
    const result = parseJsonlLine(JSON.stringify(userPromptEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('user-prompt');
    if (result!.kind === 'user-prompt') {
      expect(result!.data.text).toBe('Refactor the auth module to use JWT tokens');
      expect(result!.data.sessionId).toBe('test-session-1');
      expect(result!.data.timestamp).toBe('2026-01-15T10:00:00.000Z');
      expect(result!.data.cwd).toBe('/home/user/project');
    }
  });

  it('parses assistant entry and extracts tool_use blocks', () => {
    const result = parseJsonlLine(JSON.stringify(assistantToolEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('tool-uses');
    if (result!.kind === 'tool-uses') {
      expect(result!.data).toHaveLength(1);
      expect(result!.data[0].name).toBe('Read');
      expect(result!.data[0].input).toEqual({ file_path: '/src/auth.ts' });
    }
  });

  it('parses assistant entry with multiple tool_use blocks', () => {
    const result = parseJsonlLine(JSON.stringify(assistantMultiToolEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('tool-uses');
    if (result!.kind === 'tool-uses') {
      expect(result!.data).toHaveLength(3);
      expect(result!.data[0].name).toBe('Read');
      expect(result!.data[1].name).toBe('Write');
      expect(result!.data[2].name).toBe('Bash');
    }
  });

  it('parses assistant entry with only text blocks (no tools)', () => {
    const result = parseJsonlLine(JSON.stringify(assistantTextOnlyEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('tool-uses');
    if (result!.kind === 'tool-uses') {
      expect(result!.data).toHaveLength(0);
    }
  });

  it('skips progress entry', () => {
    const result = parseJsonlLine(JSON.stringify(progressEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('progress');
    }
  });

  it('skips file-history-snapshot entry', () => {
    const result = parseJsonlLine(JSON.stringify(fileHistoryEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('file-history-snapshot');
    }
  });

  it('skips queue-operation entry', () => {
    const result = parseJsonlLine(JSON.stringify(queueOperationEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('queue-operation');
    }
  });

  it('handles system entry', () => {
    const result = parseJsonlLine(JSON.stringify(systemEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('system');
    }
  });

  it('handles summary entry', () => {
    const result = parseJsonlLine(JSON.stringify(summaryEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('summary');
    }
  });

  it('handles unknown entry type gracefully', () => {
    const unknownEntry = { type: 'future-type', data: 'something' };
    const result = parseJsonlLine(JSON.stringify(unknownEntry));
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('skipped');
    if (result!.kind === 'skipped') {
      expect(result!.type).toBe('future-type');
    }
  });

  it('returns null for invalid JSON', () => {
    const result = parseJsonlLine('{invalid');
    expect(result).toBeNull();
  });

  it('returns null for empty line', () => {
    expect(parseJsonlLine('')).toBeNull();
    expect(parseJsonlLine('  ')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseSessionFile tests
// ---------------------------------------------------------------------------

describe('parseSessionFile', () => {
  it('streams entries from JSONL file', async () => {
    const filePath = createTempFile([
      JSON.stringify(userPromptEntry),
      JSON.stringify(assistantToolEntry),
      JSON.stringify(assistantMultiToolEntry),
      JSON.stringify(progressEntry),
      JSON.stringify(progressEntry),
    ]);

    const entries = await collectEntries(filePath);
    expect(entries).toHaveLength(5);
    expect(entries[0].kind).toBe('user-prompt');
    expect(entries[1].kind).toBe('tool-uses');
    expect(entries[2].kind).toBe('tool-uses');
    expect(entries[3].kind).toBe('skipped');
    expect(entries[4].kind).toBe('skipped');
  });

  it('skips blank lines', async () => {
    const filePath = createTempFile([
      JSON.stringify(userPromptEntry),
      '',
      '   ',
      JSON.stringify(progressEntry),
    ]);

    const entries = await collectEntries(filePath);
    expect(entries).toHaveLength(2);
  });

  it('handles corrupted lines gracefully', async () => {
    const filePath = createTempFile([
      JSON.stringify(userPromptEntry),
      '{bad json line',
      JSON.stringify(progressEntry),
    ]);

    const entries = await collectEntries(filePath);
    expect(entries).toHaveLength(2);
    expect(entries[0].kind).toBe('user-prompt');
    expect(entries[1].kind).toBe('skipped');
  });

  it('handles non-existent file', async () => {
    const entries = await collectEntries('/tmp/nonexistent-session-parser-test-file-xyz.jsonl');
    expect(entries).toHaveLength(0);
  });

  it('handles empty file', async () => {
    const filePath = createTempFile([]);
    const entries = await collectEntries(filePath);
    expect(entries).toHaveLength(0);
  });
});
