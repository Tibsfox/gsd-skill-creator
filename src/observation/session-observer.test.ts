import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SessionObserver, SessionStartData, SessionEndData } from './session-observer.js';
import { readObservationRetentionEvents } from '../bounded-learning/observation-retention-events.js';
import { readIntegrationConfig } from '../integration/config/index.js';

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

  // v1.49.944 (counter-cadence #23, consume axis): the session-end prune is the
  // first production caller of the `observation.retention_days` substrate.
  // When the observer is threaded a retention_days value (the session-end hook
  // loads it from the integration config), the prune routes through
  // runObservationRetentionSweep, which auto-emits a traffic-attributed
  // ObservationRetentionEvent for the bounded-learning calibration loop.
  describe('observation.retention_days substrate wire (consume)', () => {
    // Drive onSessionEnd to completion with a minimal non-empty transcript.
    async function runSession(observer: SessionObserver, sessionId: string): Promise<void> {
      const startData: SessionStartData = {
        sessionId,
        transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 60000,
      };
      await observer.onSessionStart(startData);

      const transcriptEntries = [
        {
          uuid: '1',
          parentUuid: null,
          isSidechain: false,
          sessionId,
          timestamp: new Date().toISOString(),
          type: 'user',
          message: { role: 'user', content: 'Hello' },
        },
        {
          uuid: '2',
          parentUuid: '1',
          isSidechain: false,
          sessionId,
          timestamp: new Date().toISOString(),
          type: 'tool_use',
          tool_name: 'Read',
          tool_input: { file_path: '/home/user/test.ts' },
        },
      ];
      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n',
      );

      const summary = await observer.onSessionEnd({
        sessionId,
        transcriptPath,
        cwd: testDir,
        reason: 'logout',
      });
      expect(summary).not.toBeNull();
      // Let the fire-and-forget auto-emit settle on real disk (#10454).
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }

    it('auto-emits too_lax when the swept corpus is far younger than the window (v982)', async () => {
      // Seed sessions.jsonl with a young corpus (~5 days old). retention_days 90
      // ⇒ oldest-retained R ≈ 0.056 < band.low (0.5) ⇒ window over-generous ⇒
      // too_lax. (Pre-v982 the substrate emitted a hardcoded too_aggressive
      // regardless of the actual corpus — the degenerate signal.)
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
      const seeded = [0, 1, 2].map((i) =>
        JSON.stringify({ timestamp: fiveDaysAgo, sessionId: `seed-${i}`, tier: 'persistent' }),
      );
      await writeFile(sessionsFile, seeded.join('\n') + '\n');

      const observer = new SessionObserver(patternsDir, undefined, undefined, 90);
      await runSession(observer, 'retention-wire-on');

      const eventsPath = join(patternsDir, 'observation-retention-events.jsonl');
      const events = await readObservationRetentionEvents(eventsPath);

      expect(events.length).toBeGreaterThanOrEqual(1);
      const event = events[events.length - 1];
      expect(event.kind).toBe('too_lax');
      expect(event.retentionDays).toBe(90);
      expect(typeof event.droppedCount).toBe('number');
      expect(typeof event.retainedCount).toBe('number');
    });

    it('auto-emits too_aggressive when dropping at a packed window edge (v982)', async () => {
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const eventsPath = join(patternsDir, 'observation-retention-events.jsonl');
      const observer = new SessionObserver(patternsDir, undefined, undefined, 90);

      // (1) Packed edge: 85-day entry (retained) + 100-day entry (dropped),
      // retention 90 ⇒ oldest retained ≈ 85, R ≈ 0.944 ≥ band.high (0.9) AND a
      // drop occurred ⇒ too_aggressive.
      await writeFile(
        sessionsFile,
        [
          JSON.stringify({ timestamp: Date.now() - 85 * 24 * 60 * 60 * 1000, sessionId: 'edge', tier: 'persistent' }),
          JSON.stringify({ timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000, sessionId: 'old', tier: 'persistent' }),
        ].join('\n') + '\n',
      );
      await runSession(observer, 'retention-wire-aggressive');
      let events = await readObservationRetentionEvents(eventsPath);
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[events.length - 1].kind).toBe('too_aggressive');

      // (2) Contrast on the SAME wire: a young corpus (~5 days) yields too_lax.
      // A single hardcoded kind cannot satisfy BOTH branches, so this pair is
      // self-discriminating against a regression to the pre-v982 constant.
      await writeFile(
        sessionsFile,
        JSON.stringify({ timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, sessionId: 'young', tier: 'persistent' }) + '\n',
      );
      await runSession(observer, 'retention-wire-aggressive-contrast');
      events = await readObservationRetentionEvents(eventsPath);
      expect(events[events.length - 1].kind).toBe('too_lax');
    });

    it('does NOT auto-emit when retention_days is not threaded (legacy prune)', async () => {
      const observer = new SessionObserver(patternsDir);
      await runSession(observer, 'retention-wire-off');

      const eventsPath = join(patternsDir, 'observation-retention-events.jsonl');
      const events = await readObservationRetentionEvents(eventsPath);
      expect(events).toEqual([]);
    });

    // v1.49.946 (consume sibling of v944): the session-end prune's count cap now
    // honors the operator's `observation.max_entries` (5th ctor arg) instead of
    // the RetentionManager hardcoded default (100).
    it('honors a threaded observation.max_entries as the session-end count cap', async () => {
      // Pre-seed sessions.jsonl with 5 recent entries (all within the age window,
      // so only the count cap can prune them).
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const now = Date.now();
      const seeded: string[] = [];
      for (let i = 0; i < 5; i++) {
        seeded.push(JSON.stringify({ timestamp: now - i * 1000, sessionId: `seed-${i}`, tier: 'persistent' }));
      }
      await writeFile(sessionsFile, seeded.join('\n') + '\n');

      // retention_days=90 keeps all by age; max_entries=2 caps the count.
      const observer = new SessionObserver(patternsDir, undefined, undefined, 90, 2);
      await runSession(observer, 'max-entries-wire');

      const content = await readFile(sessionsFile, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());
      // The count cap fired: exactly max_entries (2) survive. Mutation guard:
      // dropping the 5th-arg threading reverts to the default cap (100) → 5+ kept.
      expect(lines.length).toBe(2);
    });
  });

  // 5.1b: optional transcript skill-mining. Skills surface as Skill tool_use
  // blocks nested in message.content[]. Default off → activeSkills stays []
  // (byte-identical to pre-5.1b). The 6th ctor arg (the operator's
  // `observation.mine_active_skills` flag) un-starves co-activation detection.
  describe('active-skill mining (mine_active_skills flag)', () => {
    async function runWith(observer: SessionObserver, sessionId: string) {
      await observer.onSessionStart({
        sessionId,
        transcriptPath,
        cwd: testDir,
        source: 'startup',
        model: 'claude-3-opus',
        startTime: Date.now() - 60000,
      });
      const transcriptEntries = [
        {
          uuid: '1', parentUuid: null, isSidechain: false, sessionId,
          timestamp: new Date().toISOString(), type: 'user',
          message: { role: 'user', content: 'use a couple skills' },
        },
        {
          uuid: '2', parentUuid: '1', isSidechain: false, sessionId,
          timestamp: new Date().toISOString(), type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              { type: 'tool_use', name: 'Skill', input: { skill: 'graphify' } },
              { type: 'tool_use', name: 'Skill', input: { skill: 'context-handoff' } },
            ],
          },
        },
      ];
      await writeFile(
        transcriptPath,
        transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n',
      );
      return observer.onSessionEnd({ sessionId, transcriptPath, cwd: testDir, reason: 'logout' });
    }

    it('records activeSkills:[] when mining is OFF (default — byte-identical)', async () => {
      const observer = new SessionObserver(patternsDir);
      const summary = await runWith(observer, 'mine-off');
      expect(summary).not.toBeNull();
      expect(summary!.activeSkills).toEqual([]);
    });

    it('mines distinct sorted skill names from the transcript when mining is ON', async () => {
      const observer = new SessionObserver(patternsDir, undefined, undefined, undefined, undefined, true);
      const summary = await runWith(observer, 'mine-on');
      expect(summary).not.toBeNull();
      expect(summary!.activeSkills).toEqual(['context-handoff', 'graphify']);
    });
  });

  // Item-2 (v1.49.983 — Ship 5.3): prove the mining pipeline FIRES under the
  // production config path, end-to-end, and lands non-empty activeSkills on
  // DISK. The 5.1c re-audit found 0/126 sessions.jsonl records with non-empty
  // activeSkills — which could mean "real sessions had <2 skills" OR "mining
  // never fired". This test removes the ambiguity: with this repo's config
  // shape (mine_active_skills ABSENT → Zod-inherits the 5.1c true default),
  // threaded exactly as src/hooks/session-end.ts threads it, a ≥2-skill session
  // writes its mined skills into the persisted sessions.jsonl record the
  // re-audit reads. So a future empty record means a genuinely <2-skill
  // session, not a broken pipeline.
  describe('active-skill mining — production config wiring (v1.49.983 item-2)', () => {
    it('config default (absent key → true) drives the hook wiring to persist non-empty activeSkills on disk', async () => {
      // 1. This repo's actual config shape: the key is ABSENT, so Zod fills the
      //    5.1c default (true). This is the default passive accrual relies on.
      const configPath = join(testDir, 'skill-creator.json');
      await writeFile(
        configPath,
        JSON.stringify({ observation: { retention_days: 90, max_entries: 1000 } }, null, 2) + '\n',
      );
      const config = await readIntegrationConfig(configPath);
      expect(config.observation.mine_active_skills).toBe(true);

      // 2. Construct the observer EXACTLY as src/hooks/session-end.ts:111 does
      //    (config → 4th/5th/6th ctor args), no hardcoded `true`.
      const observer = new SessionObserver(
        patternsDir,
        undefined,
        undefined,
        config.observation.retention_days,
        config.observation.max_entries,
        config.observation.mine_active_skills,
      );

      const sessionId = 'prod-wire';
      await observer.onSessionStart({
        sessionId, transcriptPath, cwd: testDir,
        source: 'startup', model: 'claude-3-opus', startTime: Date.now() - 300000,
      });

      // 3. High-signal transcript (promotes to persistent) + one assistant entry
      //    carrying two nested Skill tool_use blocks (the only place skills
      //    surface). The nested blocks add no top-level toolCalls, so promotion
      //    signal is identical to the existing high-signal routing test.
      const transcriptEntries = [
        { uuid: '1', parentUuid: null, isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 1' } },
        { uuid: '2', parentUuid: '1', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/a.ts' } },
        { uuid: '3', parentUuid: '2', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 2' } },
        { uuid: '4', parentUuid: '3', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm test' } },
        { uuid: '5', parentUuid: '4', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 3' } },
        { uuid: '6', parentUuid: '5', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Edit', tool_input: { file_path: '/b.ts' } },
        { uuid: '7', parentUuid: '6', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 4' } },
        { uuid: '8', parentUuid: '7', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/c.ts' } },
        { uuid: '9', parentUuid: '8', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'user', message: { role: 'user', content: 'msg 5' } },
        { uuid: '10', parentUuid: '9', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git status' } },
        { uuid: '11', parentUuid: '10', isSidechain: false, sessionId, timestamp: new Date().toISOString(), type: 'assistant', message: { role: 'assistant', content: [
          { type: 'tool_use', name: 'Skill', input: { skill: 'graphify' } },
          { type: 'tool_use', name: 'Skill', input: { skill: 'session-awareness' } },
        ] } },
      ];
      await writeFile(transcriptPath, transcriptEntries.map((e) => JSON.stringify(e)).join('\n') + '\n');

      const summary = await observer.onSessionEnd({ sessionId, transcriptPath, cwd: testDir, reason: 'logout' });

      // 4. The returned summary carries the mined skills...
      expect(summary).not.toBeNull();
      expect(summary!.tier).toBe('persistent');
      expect(summary!.activeSkills).toEqual(['graphify', 'session-awareness']);

      // 5. ...and they are PERSISTED to sessions.jsonl — under the PatternStore
      //    envelope's `.data`, which is exactly where the re-audit reads
      //    activeSkills (it found 0/126 non-empty; this proves a non-empty write).
      const sessionsFile = join(patternsDir, 'sessions.jsonl');
      const lines = (await readFile(sessionsFile, 'utf-8')).trim().split('\n');
      const stored = JSON.parse(lines[lines.length - 1]!);
      expect(stored.data.sessionId).toBe(sessionId);
      expect(stored.data.activeSkills).toEqual(['graphify', 'session-awareness']);
    });
  });
});
