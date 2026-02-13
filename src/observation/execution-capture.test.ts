import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { ExecutionCapture } from './execution-capture.js';
import { TranscriptParser } from './transcript-parser.js';
import { PatternStore } from '../storage/pattern-store.js';
import type { TranscriptEntry, ExecutionContext } from '../types/observation.js';

/** Helper to create a tool_use transcript entry */
function toolUse(uuid: string, toolName: string, input: Record<string, unknown> = {}): TranscriptEntry {
  return {
    uuid,
    parentUuid: null,
    isSidechain: false,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'tool_use',
    tool_name: toolName,
    tool_input: input as TranscriptEntry['tool_input'],
  };
}

/** Helper to create a tool_result transcript entry */
function toolResult(uuid: string, toolUseId: string, output: string): TranscriptEntry {
  return {
    uuid,
    parentUuid: toolUseId,
    isSidechain: false,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:01Z',
    type: 'tool_result',
    tool_use_id: toolUseId,
    tool_output: output,
  };
}

/** Helper to create a user transcript entry */
function userEntry(uuid: string): TranscriptEntry {
  return {
    uuid,
    parentUuid: null,
    isSidechain: false,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'user',
    message: { role: 'user', content: 'hello' },
  };
}

/** Helper to create an assistant transcript entry */
function assistantEntry(uuid: string): TranscriptEntry {
  return {
    uuid,
    parentUuid: null,
    isSidechain: false,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'assistant',
    message: { role: 'assistant', content: 'hi' },
  };
}

describe('ExecutionCapture', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'exec-capture-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('captures complete tool execution pairs from transcript entries', () => {
    const capture = new ExecutionCapture(tmpDir);
    const entries: TranscriptEntry[] = [
      toolUse('tu-1', 'Read', { file_path: '/src/foo.ts' }),
      toolResult('tr-1', 'tu-1', 'file contents here'),
      toolUse('tu-2', 'Write', { file_path: '/src/bar.ts' }),
      toolResult('tr-2', 'tu-2', 'write successful'),
    ];
    const context: ExecutionContext = { sessionId: 'sess-1', phase: '115', activeSkill: 'test-skill' };

    const result = capture.captureFromEntries(entries, context);

    expect(result.pairs).toHaveLength(2);
    expect(result.pairs[0].status).toBe('complete');
    expect(result.pairs[1].status).toBe('complete');
    // SHA-256 hex = 64 chars
    expect(result.pairs[0].outputHash).not.toBeNull();
    expect(result.pairs[0].outputHash).toHaveLength(64);
    expect(result.pairs[1].outputHash).not.toBeNull();
    expect(result.pairs[1].outputHash).toHaveLength(64);
    // Context propagated
    expect(result.context.sessionId).toBe('sess-1');
    expect(result.context.phase).toBe('115');
    expect(result.context.activeSkill).toBe('test-skill');
  });

  it('stores execution batch to pattern store', async () => {
    const capture = new ExecutionCapture(tmpDir);
    const entries: TranscriptEntry[] = [
      toolUse('tu-1', 'Read', { file_path: '/src/foo.ts' }),
      toolResult('tr-1', 'tu-1', 'file contents here'),
    ];
    const context: ExecutionContext = { sessionId: 'sess-store', phase: '115', activeSkill: 'test-skill' };

    await capture.captureAndStore(entries, context);

    // Read back from the pattern store
    const store = new PatternStore(tmpDir);
    const stored = await store.read('executions');
    expect(stored).toHaveLength(1);

    const entry = stored[0].data as Record<string, unknown>;
    expect(entry.sessionId).toBe('sess-store');
    expect(Array.isArray(entry.pairs)).toBe(true);
    expect(entry.completeCount).toBe(1);
    expect(entry.partialCount).toBe(0);
    expect(typeof entry.capturedAt).toBe('number');
  });

  it('attaches execution context metadata to every pair', () => {
    const capture = new ExecutionCapture(tmpDir);
    const entries: TranscriptEntry[] = [
      toolUse('tu-1', 'Bash', { command: 'npm test' }),
      toolResult('tr-1', 'tu-1', 'all tests passed'),
    ];
    const context: ExecutionContext = { sessionId: 'sess-2', phase: '117', activeSkill: 'my-skill' };

    const result = capture.captureFromEntries(entries, context);

    for (const pair of result.pairs) {
      expect(pair.context.sessionId).toBe('sess-2');
      expect(pair.context.phase).toBe('117');
      expect(pair.context.activeSkill).toBe('my-skill');
    }
  });

  it('handles partial pairs without error in storage', async () => {
    const capture = new ExecutionCapture(tmpDir);
    const entries: TranscriptEntry[] = [
      toolUse('tu-orphan', 'Bash', { command: 'sleep 999' }),
      // No tool_result follows
    ];
    const context: ExecutionContext = { sessionId: 'sess-partial', phase: '115' };

    const batch = await capture.captureAndStore(entries, context);

    expect(batch.partialCount).toBe(1);
    expect(batch.completeCount).toBe(0);

    // Verify stored without errors
    const store = new PatternStore(tmpDir);
    const stored = await store.read('executions');
    expect(stored).toHaveLength(1);
  });

  it('returns empty batch for entries with no tool operations', () => {
    const capture = new ExecutionCapture(tmpDir);
    const entries: TranscriptEntry[] = [
      userEntry('u-1'),
      assistantEntry('a-1'),
    ];
    const context: ExecutionContext = { sessionId: 'sess-empty' };

    const result = capture.captureFromEntries(entries, context);

    expect(result.pairs).toEqual([]);
    expect(result.completeCount).toBe(0);
    expect(result.partialCount).toBe(0);
  });

  it('content hashes are deterministic for identical outputs', () => {
    const capture = new ExecutionCapture(tmpDir);
    const identicalOutput = 'exactly the same output content';

    const entries1: TranscriptEntry[] = [
      toolUse('tu-a', 'Read', { file_path: '/a.ts' }),
      toolResult('tr-a', 'tu-a', identicalOutput),
    ];
    const entries2: TranscriptEntry[] = [
      toolUse('tu-b', 'Read', { file_path: '/b.ts' }),
      toolResult('tr-b', 'tu-b', identicalOutput),
    ];
    const context: ExecutionContext = { sessionId: 'sess-hash' };

    const result1 = capture.captureFromEntries(entries1, context);
    const result2 = capture.captureFromEntries(entries2, context);

    expect(result1.pairs[0].outputHash).toBe(result2.pairs[0].outputHash);
  });
});
