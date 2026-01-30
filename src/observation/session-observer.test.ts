import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SessionObserver, SessionStartData, SessionEndData } from './session-observer.js';

describe('SessionObserver', () => {
  const testDir = join(tmpdir(), `session-observer-test-${Date.now()}`);
  const patternsDir = join(testDir, 'patterns');
  const transcriptPath = join(testDir, 'transcript.jsonl');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(patternsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('onSessionStart', () => {
    it('should cache session data', async () => {
      const observer = new SessionObserver(patternsDir);

      const startData: SessionStartData = {
        sessionId: 'test-session-123',
        transcriptPath: '/tmp/transcript.jsonl',
        cwd: '/home/user/project',
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now(),
      };

      await observer.onSessionStart(startData);

      // Verify cache file was created
      const cacheFile = join(patternsDir, '.session-cache.json');
      const cached = JSON.parse(await readFile(cacheFile, 'utf-8'));

      expect(cached.sessionId).toBe('test-session-123');
      expect(cached.source).toBe('startup');
      expect(cached.model).toBe('claude-3-opus');
    });
  });

  describe('onSessionEnd', () => {
    it('should parse transcript and store summary', async () => {
      const observer = new SessionObserver(patternsDir);

      // Cache start data
      const startData: SessionStartData = {
        sessionId: 'test-session-456',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 60000, // 1 minute ago
      };
      await observer.onSessionStart(startData);

      // Create a mock transcript
      const transcriptEntries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'test-session-456',
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { role: 'user', content: 'Hello' },
        },
        {
          uuid: '2',
          parentUuid: '1',
          isSidechain: false,
          sessionId: 'test-session-456',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          message: { role: 'assistant', content: 'Hi there!' },
        },
        {
          uuid: '3',
          parentUuid: '2',
          isSidechain: false,
          sessionId: 'test-session-456',
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Read',
          tool_input: { file_path: '/home/user/test.ts' },
        },
      ];

      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      const endData: SessionEndData = {
        sessionId: 'test-session-456',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      };

      const summary = await observer.onSessionEnd(endData);

      expect(summary).not.toBeNull();
      expect(summary!.sessionId).toBe('test-session-456');
      expect(summary!.source).toBe('startup');
      expect(summary!.reason).toBe('logout');
      expect(summary!.metrics.userMessages).toBe(1);
      expect(summary!.metrics.assistantMessages).toBe(1);
      expect(summary!.metrics.toolCalls).toBe(1);
    });

    it('should return null for empty session', async () => {
      const observer = new SessionObserver(patternsDir);

      // Create empty transcript
      await writeFile(transcriptPath, '');

      const endData: SessionEndData = {
        sessionId: 'empty-session',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'clear',
      };

      const summary = await observer.onSessionEnd(endData);

      expect(summary).toBeNull();
    });

    it('should use defaults when no cache exists', async () => {
      const observer = new SessionObserver(patternsDir);

      // Create transcript without starting session first
      const transcriptEntries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'no-cache-session',
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { role: 'user', content: 'Test' },
        },
      ];

      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      const endData: SessionEndData = {
        sessionId: 'no-cache-session',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'other',
      };

      const summary = await observer.onSessionEnd(endData);

      expect(summary).not.toBeNull();
      expect(summary!.source).toBe('startup'); // Default
      expect(summary!.reason).toBe('other');
    });

    it('should store summary in sessions.jsonl', async () => {
      const observer = new SessionObserver(patternsDir);

      // Create transcript
      const transcriptEntries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'stored-session',
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { role: 'user', content: 'Test' },
        },
      ];

      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      await observer.onSessionEnd({
        sessionId: 'stored-session',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      // Verify the session was stored
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const content = await readFile(sessionsFile, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(1);

      const stored = JSON.parse(lines[lines.length - 1]);
      expect(stored.category).toBe('sessions');
      expect(stored.data.sessionId).toBe('stored-session');
    });
  });

  describe('integration', () => {
    it('should coordinate full session lifecycle', async () => {
      const observer = new SessionObserver(patternsDir);

      // Start session
      await observer.onSessionStart({
        sessionId: 'full-lifecycle',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'resume',
        model: 'claude-3-sonnet',
        startTime: Date.now() - 120000, // 2 minutes ago
      });

      // Create transcript with various tool uses
      const transcriptEntries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId: 'full-lifecycle',
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { role: 'user', content: 'Help me fix a bug' },
        },
        {
          uuid: '2',
          parentUuid: '1',
          isSidechain: false,
          sessionId: 'full-lifecycle',
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Read',
          tool_input: { file_path: '/src/main.ts' },
        },
        {
          uuid: '3',
          parentUuid: '2',
          isSidechain: false,
          sessionId: 'full-lifecycle',
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Bash',
          tool_input: { command: 'npm test' },
        },
        {
          uuid: '4',
          parentUuid: '3',
          isSidechain: false,
          sessionId: 'full-lifecycle',
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Edit',
          tool_input: { file_path: '/src/main.ts' },
        },
        {
          uuid: '5',
          parentUuid: '4',
          isSidechain: false,
          sessionId: 'full-lifecycle',
          timestamp: new Date().toISOString(),
          type: 'assistant',
          message: { role: 'assistant', content: 'I fixed the bug.' },
        },
      ];

      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n'
      );

      // End session
      const summary = await observer.onSessionEnd({
        sessionId: 'full-lifecycle',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      // Verify full summary
      expect(summary).not.toBeNull();
      expect(summary!.sessionId).toBe('full-lifecycle');
      expect(summary!.source).toBe('resume');
      expect(summary!.metrics.toolCalls).toBe(3);
      expect(summary!.metrics.uniqueFilesRead).toBeGreaterThanOrEqual(1);
      expect(summary!.metrics.uniqueFilesWritten).toBeGreaterThanOrEqual(1);
      expect(summary!.topTools).toContain('Read');
      expect(summary!.topTools).toContain('Bash');
      expect(summary!.topTools).toContain('Edit');
    });
  });
});
