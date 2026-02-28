/**
 * Tests for the SnapshotManager class.
 *
 * Covers:
 * - generate(): returns null for non-existent/empty transcripts, produces valid
 *   snapshots with summary, files_modified, open_questions, metrics, top_tools,
 *   top_commands from transcript entries
 * - store(): creates directory, appends Pattern-enveloped JSONL, supports multiple appends
 * - getLatest(): returns null for missing/empty files, returns last valid snapshot,
 *   skips corrupted lines
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SnapshotManager } from './snapshot-manager.js';
import { SNAPSHOT_FILENAME } from './types.js';
import type { SessionSnapshot } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeTranscriptFixture(): string {
  const entries = [
    {
      uuid: '1',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:00:00Z',
      type: 'user',
      message: { role: 'user', content: 'I need to implement the authentication system for the project with JWT tokens' },
    },
    {
      uuid: '2',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:01:00Z',
      type: 'tool_use',
      tool_name: 'Write',
      tool_input: { file_path: 'src/auth.ts', content: 'export class Auth {}' },
    },
    {
      uuid: '3',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:02:00Z',
      type: 'tool_use',
      tool_name: 'Edit',
      tool_input: { file_path: 'src/config.ts' },
    },
    {
      uuid: '4',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:03:00Z',
      type: 'tool_use',
      tool_name: 'Read',
      tool_input: { file_path: 'src/index.ts' },
    },
    {
      uuid: '5',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:04:00Z',
      type: 'tool_use',
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
    },
    {
      uuid: '6',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:05:00Z',
      type: 'user',
      message: { role: 'user', content: 'How should we handle token refresh?' },
    },
    {
      uuid: '7',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:06:00Z',
      type: 'tool_use',
      tool_name: 'Bash',
      tool_input: { command: 'git status' },
    },
    {
      uuid: '8',
      parentUuid: null,
      isSidechain: false,
      sessionId: 'test-session',
      timestamp: '2026-01-01T00:07:00Z',
      type: 'assistant',
      message: { role: 'assistant', content: 'I have implemented the auth system.' },
    },
  ];
  return entries.map(e => JSON.stringify(e)).join('\n') + '\n';
}

function makeSnapshotFixture(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    session_id: 'snap-test-1',
    timestamp: Date.now(),
    saved_at: new Date().toISOString(),
    summary: 'Test session snapshot',
    active_skills: [],
    files_modified: ['src/auth.ts'],
    open_questions: [],
    metrics: {
      duration_minutes: 10,
      tool_calls: 5,
      files_read: 3,
      files_written: 2,
    },
    top_tools: ['Write', 'Read'],
    top_commands: ['npm'],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SnapshotManager', () => {
  let testDir: string;
  let snapshotDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-snapshot-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
    snapshotDir = join(testDir, 'snapshots');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // generate()
  // --------------------------------------------------------------------------

  describe('generate()', () => {
    it('returns null for non-existent transcript path', async () => {
      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(
        join(testDir, 'does-not-exist.jsonl'),
        'sess-1',
      );
      expect(result).toBeNull();
    });

    it('returns null for empty transcript file (0 entries)', async () => {
      const emptyPath = join(testDir, 'empty.jsonl');
      await writeFile(emptyPath, '', 'utf-8');
      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(emptyPath, 'sess-empty');
      expect(result).toBeNull();
    });

    it('returns a valid SessionSnapshot for a substantive transcript', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-test');

      expect(result).not.toBeNull();
      expect(result!.session_id).toBe('sess-test');
      expect(typeof result!.timestamp).toBe('number');
      expect(result!.saved_at).toBeTruthy();
      expect(typeof result!.summary).toBe('string');
      expect(result!.summary.length).toBeGreaterThan(0);
    });

    it('summary contains first substantive user message truncated to 200 chars', async () => {
      // Create a transcript with a long first user message
      const longMessage = 'A'.repeat(300);
      const entries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'test',
          timestamp: '2026-01-01T00:00:00Z',
          type: 'user',
          message: { role: 'user', content: longMessage },
        },
        {
          uuid: '2',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'test',
          timestamp: '2026-01-01T00:01:00Z',
          type: 'tool_use',
          tool_name: 'Bash',
          tool_input: { command: 'echo hello' },
        },
      ];
      const transcriptPath = join(testDir, 'long.jsonl');
      await writeFile(
        transcriptPath,
        entries.map(e => JSON.stringify(e)).join('\n') + '\n',
        'utf-8',
      );

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-long');

      expect(result).not.toBeNull();
      expect(result!.summary.length).toBeLessThanOrEqual(200);
    });

    it('files_modified contains paths from Write/Edit tool_use entries', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-files');

      expect(result).not.toBeNull();
      expect(result!.files_modified).toContain('src/auth.ts');
      expect(result!.files_modified).toContain('src/config.ts');
      // Should not contain Read-only files
      expect(result!.files_modified).not.toContain('src/index.ts');
    });

    it('open_questions contains lines ending with ? from user messages', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-questions');

      expect(result).not.toBeNull();
      expect(result!.open_questions).toContain('How should we handle token refresh?');
    });

    it('metrics contains duration_minutes, tool_calls, files_read, files_written', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-metrics');

      expect(result).not.toBeNull();
      expect(typeof result!.metrics.duration_minutes).toBe('number');
      expect(result!.metrics.tool_calls).toBe(5); // 5 tool_use entries
      expect(result!.metrics.files_read).toBe(1); // src/index.ts
      expect(result!.metrics.files_written).toBe(2); // src/auth.ts, src/config.ts
    });

    it('active_skills passed through from input parameter', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(
        transcriptPath,
        'sess-skills',
        ['typescript', 'git-commit'],
      );

      expect(result).not.toBeNull();
      expect(result!.active_skills).toEqual(['typescript', 'git-commit']);
    });

    it('top_tools and top_commands populated from transcript', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-tops');

      expect(result).not.toBeNull();
      // Bash appears twice, Write once, Edit once, Read once
      expect(result!.top_tools).toContain('Bash');
      expect(result!.top_tools).toContain('Write');
      // Commands: npm, git
      expect(result!.top_commands.length).toBeGreaterThan(0);
    });

    it('timestamp is a number (Unix ms)', async () => {
      const transcriptPath = join(testDir, 'transcript.jsonl');
      await writeFile(transcriptPath, makeTranscriptFixture(), 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.generate(transcriptPath, 'sess-ts');

      expect(result).not.toBeNull();
      expect(typeof result!.timestamp).toBe('number');
      expect(result!.timestamp).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // store()
  // --------------------------------------------------------------------------

  describe('store()', () => {
    it('creates snapshot directory if it does not exist', async () => {
      const deepDir = join(testDir, 'a', 'b', 'c');
      const manager = new SnapshotManager(deepDir);
      const snapshot = makeSnapshotFixture();

      await manager.store(snapshot);

      const filePath = join(deepDir, SNAPSHOT_FILENAME);
      const content = await readFile(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('appends snapshot as JSONL line wrapped in Pattern envelope', async () => {
      await mkdir(snapshotDir, { recursive: true });
      const manager = new SnapshotManager(snapshotDir);
      const snapshot = makeSnapshotFixture();

      await manager.store(snapshot);

      const filePath = join(snapshotDir, SNAPSHOT_FILENAME);
      const content = await readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const envelope = JSON.parse(lines[0]);
      expect(envelope.timestamp).toBe(snapshot.timestamp);
      expect(envelope.category).toBe('snapshots');
      expect(envelope.data).toEqual(snapshot);
    });

    it('multiple stores append multiple lines', async () => {
      const manager = new SnapshotManager(snapshotDir);
      const snap1 = makeSnapshotFixture({ session_id: 'snap-1', timestamp: 1000 });
      const snap2 = makeSnapshotFixture({ session_id: 'snap-2', timestamp: 2000 });
      const snap3 = makeSnapshotFixture({ session_id: 'snap-3', timestamp: 3000 });

      await manager.store(snap1);
      await manager.store(snap2);
      await manager.store(snap3);

      const filePath = join(snapshotDir, SNAPSHOT_FILENAME);
      const content = await readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(3);

      const last = JSON.parse(lines[2]);
      expect(last.data.session_id).toBe('snap-3');
    });
  });

  // --------------------------------------------------------------------------
  // getLatest()
  // --------------------------------------------------------------------------

  describe('getLatest()', () => {
    it('returns null when JSONL file does not exist', async () => {
      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.getLatest();
      expect(result).toBeNull();
    });

    it('returns null when JSONL file is empty', async () => {
      await mkdir(snapshotDir, { recursive: true });
      await writeFile(join(snapshotDir, SNAPSHOT_FILENAME), '', 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.getLatest();
      expect(result).toBeNull();
    });

    it('returns the last valid snapshot from a multi-entry JSONL file', async () => {
      await mkdir(snapshotDir, { recursive: true });
      const snap1 = makeSnapshotFixture({ session_id: 'old', timestamp: 1000 });
      const snap2 = makeSnapshotFixture({ session_id: 'latest', timestamp: 2000 });

      const envelope1 = { timestamp: snap1.timestamp, category: 'snapshots', data: snap1 };
      const envelope2 = { timestamp: snap2.timestamp, category: 'snapshots', data: snap2 };

      const content = JSON.stringify(envelope1) + '\n' + JSON.stringify(envelope2) + '\n';
      await writeFile(join(snapshotDir, SNAPSHOT_FILENAME), content, 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.getLatest();

      expect(result).not.toBeNull();
      expect(result!.session_id).toBe('latest');
    });

    it('skips corrupted JSONL lines gracefully', async () => {
      await mkdir(snapshotDir, { recursive: true });
      const validSnap = makeSnapshotFixture({ session_id: 'valid', timestamp: 3000 });
      const envelope = { timestamp: validSnap.timestamp, category: 'snapshots', data: validSnap };

      const content = 'this is not json\n' + JSON.stringify(envelope) + '\n' + '{broken\n';
      await writeFile(join(snapshotDir, SNAPSHOT_FILENAME), content, 'utf-8');

      const manager = new SnapshotManager(snapshotDir);
      const result = await manager.getLatest();

      expect(result).not.toBeNull();
      expect(result!.session_id).toBe('valid');
    });
  });
});
