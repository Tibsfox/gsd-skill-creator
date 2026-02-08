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

      // Create transcript with enough signal to route to persistent storage
      // (1 tool call = 0.3 score, at threshold for promotion)
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
        {
          uuid: '2',
          parentUuid: '1',
          isSidechain: false,
          sessionId: 'stored-session',
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Read',
          tool_input: { file_path: '/src/test.ts' },
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

      // Verify the session was stored persistently
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

  describe('tiered routing', () => {
    it('should route high-signal session to persistent storage', async () => {
      const observer = new SessionObserver(patternsDir);

      // Cache start data
      await observer.onSessionStart({
        sessionId: 'high-signal',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 300000, // 5 minutes ago
      });

      // Create transcript with high signal: 5 tool calls, 5 user messages
      const transcriptEntries = [
        { uuid: '1', parentUuid: null, isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 1' } },
        { uuid: '2', parentUuid: '1', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/a.ts' } },
        { uuid: '3', parentUuid: '2', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 2' } },
        { uuid: '4', parentUuid: '3', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm test' } },
        { uuid: '5', parentUuid: '4', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 3' } },
        { uuid: '6', parentUuid: '5', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Edit', tool_input: { file_path: '/b.ts' } },
        { uuid: '7', parentUuid: '6', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 4' } },
        { uuid: '8', parentUuid: '7', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/c.ts' } },
        { uuid: '9', parentUuid: '8', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 5' } },
        { uuid: '10', parentUuid: '9', isSidechain: false, sessionId: 'high-signal', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git status' } },
      ];

      await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const summary = await observer.onSessionEnd({
        sessionId: 'high-signal',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      expect(summary).not.toBeNull();
      expect(summary!.tier).toBe('persistent');

      // Verify stored in sessions.jsonl
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const content = await readFile(sessionsFile, 'utf-8');
      const lines = content.trim().split('\n');
      const stored = JSON.parse(lines[lines.length - 1]);
      expect(stored.data.sessionId).toBe('high-signal');
      expect(stored.data.tier).toBe('persistent');
    });

    it('should route low-signal session to ephemeral storage', async () => {
      const observer = new SessionObserver(patternsDir);

      // Cache start data
      await observer.onSessionStart({
        sessionId: 'low-signal',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 30000, // 30 seconds ago
      });

      // Create transcript with low signal: 1 user message, 0 tool calls
      const transcriptEntries = [
        { uuid: '1', parentUuid: null, isSidechain: false, sessionId: 'low-signal', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'hi' } },
      ];

      await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

      const summary = await observer.onSessionEnd({
        sessionId: 'low-signal',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      expect(summary).not.toBeNull();
      expect(summary!.tier).toBe('ephemeral');

      // Verify NOT in sessions.jsonl (low-signal sessions are not persisted)
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      let sessionsContent = '';
      try {
        sessionsContent = await readFile(sessionsFile, 'utf-8');
      } catch { /* file may not exist */ }
      expect(sessionsContent).not.toContain('low-signal');

      // Ephemeral buffer is cleared after promotion evaluation
      // (single low-signal entry scores below threshold, gets discarded)
      const ephemeralFile = join(patternsDir, '.ephemeral.jsonl');
      const ephemeralContent = await readFile(ephemeralFile, 'utf-8');
      expect(ephemeralContent.trim()).toBe('');
    });

    it('should promote ephemeral entries via collective squashing', async () => {
      const observer = new SessionObserver(patternsDir);
      const now = Date.now();

      // Pre-populate .ephemeral.jsonl with 3 ephemeral observations
      // Each individually scores below 0.3 (2 user messages partial = 0, 0 tool calls = 0, durationMinutes: 3 = 0.1 partial)
      // But squashed: 6 user messages (>=5 = 0.15), duration from earliest to latest >= 5min (0.2) = 0.35 >= 0.3
      const ephemeralFile = join(patternsDir, '.ephemeral.jsonl');
      const ephemeralObs = [
        {
          sessionId: 'eph-1',
          startTime: now - 600000,  // 10 min ago
          endTime: now - 480000,    // 8 min ago (2 min duration individually)
          durationMinutes: 2,
          source: 'startup' as const,
          reason: 'clear' as const,
          metrics: { userMessages: 2, assistantMessages: 1, toolCalls: 0, uniqueFilesRead: 0, uniqueFilesWritten: 0, uniqueCommandsRun: 0 },
          topCommands: [] as string[],
          topFiles: [] as string[],
          topTools: [] as string[],
          activeSkills: [] as string[],
          tier: 'ephemeral' as const,
        },
        {
          sessionId: 'eph-2',
          startTime: now - 480000,  // 8 min ago
          endTime: now - 360000,    // 6 min ago
          durationMinutes: 2,
          source: 'startup' as const,
          reason: 'clear' as const,
          metrics: { userMessages: 2, assistantMessages: 1, toolCalls: 0, uniqueFilesRead: 0, uniqueFilesWritten: 0, uniqueCommandsRun: 0 },
          topCommands: [] as string[],
          topFiles: [] as string[],
          topTools: [] as string[],
          activeSkills: [] as string[],
          tier: 'ephemeral' as const,
        },
        {
          sessionId: 'eph-3',
          startTime: now - 360000,  // 6 min ago
          endTime: now - 240000,    // 4 min ago
          durationMinutes: 2,
          source: 'startup' as const,
          reason: 'clear' as const,
          metrics: { userMessages: 2, assistantMessages: 1, toolCalls: 0, uniqueFilesRead: 0, uniqueFilesWritten: 0, uniqueCommandsRun: 0 },
          topCommands: [] as string[],
          topFiles: [] as string[],
          topTools: [] as string[],
          activeSkills: [] as string[],
          tier: 'ephemeral' as const,
        },
      ];

      const ephemeralLines = ephemeralObs.map(obs =>
        JSON.stringify({ timestamp: Date.now(), category: 'sessions', data: obs })
      ).join('\n') + '\n';
      await writeFile(ephemeralFile, ephemeralLines);

      // Now run a high-signal session to trigger promotion
      await observer.onSessionStart({
        sessionId: 'trigger-session',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 120000,
      });

      const transcriptEntries = [
        { uuid: '1', parentUuid: null, isSidechain: false, sessionId: 'trigger-session', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'Do something' } },
        { uuid: '2', parentUuid: '1', isSidechain: false, sessionId: 'trigger-session', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/test.ts' } },
        { uuid: '3', parentUuid: '2', isSidechain: false, sessionId: 'trigger-session', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm test' } },
      ];

      await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

      await observer.onSessionEnd({
        sessionId: 'trigger-session',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      // Verify sessions.jsonl contains both the trigger session and the squashed aggregate
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const sessionsContent = await readFile(sessionsFile, 'utf-8');
      const sessionsLines = sessionsContent.trim().split('\n');

      // Find the squashed entry
      const squashedEntry = sessionsLines
        .map(line => JSON.parse(line))
        .find((entry: { data: { squashedFrom?: number } }) => entry.data.squashedFrom === 3);

      expect(squashedEntry).toBeDefined();
      expect(squashedEntry.data.squashedFrom).toBe(3);
      expect(squashedEntry.data.tier).toBe('persistent');
      // Summed user messages: 2+2+2 = 6
      expect(squashedEntry.data.metrics.userMessages).toBe(6);

      // Verify the trigger session is also in sessions.jsonl
      const triggerEntry = sessionsLines
        .map(line => JSON.parse(line))
        .find((entry: { data: { sessionId: string } }) => entry.data.sessionId === 'trigger-session');
      expect(triggerEntry).toBeDefined();

      // Verify ephemeral buffer is cleared
      const ephemeralAfter = await readFile(ephemeralFile, 'utf-8');
      expect(ephemeralAfter.trim()).toBe('');
    });

    it('should discard ephemeral entries that score below threshold even after squashing', async () => {
      const observer = new SessionObserver(patternsDir);

      // Pre-populate .ephemeral.jsonl with 3 truly trivial observations
      // Each: 0 tool calls, 1 user message, durationMinutes: 0, empty arrays
      // Squashed: 3 user messages (partial 0.05), 0 duration (0), no tools (0), no files (0), no metadata (0) = 0.05 < 0.3
      const ephemeralFile = join(patternsDir, '.ephemeral.jsonl');
      const trivialObs = Array.from({ length: 3 }, (_, i) => ({
        sessionId: `trivial-${i}`,
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        durationMinutes: 0,
        source: 'startup' as const,
        reason: 'clear' as const,
        metrics: { userMessages: 1, assistantMessages: 0, toolCalls: 0, uniqueFilesRead: 0, uniqueFilesWritten: 0, uniqueCommandsRun: 0 },
        topCommands: [] as string[],
        topFiles: [] as string[],
        topTools: [] as string[],
        activeSkills: [] as string[],
        tier: 'ephemeral' as const,
      }));

      const ephemeralLines = trivialObs.map(obs =>
        JSON.stringify({ timestamp: Date.now(), category: 'sessions', data: obs })
      ).join('\n') + '\n';
      await writeFile(ephemeralFile, ephemeralLines);

      // Run a high-signal session to trigger promotion evaluation
      await observer.onSessionStart({
        sessionId: 'trigger-discard',
        transcriptPath: transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 120000,
      });

      const transcriptEntries = [
        { uuid: '1', parentUuid: null, isSidechain: false, sessionId: 'trigger-discard', timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'Do something' } },
        { uuid: '2', parentUuid: '1', isSidechain: false, sessionId: 'trigger-discard', timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/test.ts' } },
      ];

      await writeFile(transcriptPath, transcriptEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

      await observer.onSessionEnd({
        sessionId: 'trigger-discard',
        transcriptPath: transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });

      // Verify ephemeral buffer is cleared (entries were discarded)
      const ephemeralAfter = await readFile(ephemeralFile, 'utf-8');
      expect(ephemeralAfter.trim()).toBe('');

      // Verify no squashed entry in sessions.jsonl
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const sessionsContent = await readFile(sessionsFile, 'utf-8');
      const sessionsLines = sessionsContent.trim().split('\n');

      const squashedEntry = sessionsLines
        .map(line => JSON.parse(line))
        .find((entry: { data: { squashedFrom?: number } }) => entry.data.squashedFrom !== undefined);
      expect(squashedEntry).toBeUndefined();

      // But the trigger session itself should be in sessions.jsonl (it's high-signal)
      const triggerEntry = sessionsLines
        .map(line => JSON.parse(line))
        .find((entry: { data: { sessionId: string } }) => entry.data.sessionId === 'trigger-discard');
      expect(triggerEntry).toBeDefined();
    });
  });
});
