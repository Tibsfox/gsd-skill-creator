import { describe, it, expect } from 'vitest';
import { PatternSummarizer, summarizeSession } from './pattern-summarizer.js';
import type { TranscriptEntry } from '../types/observation.js';

describe('PatternSummarizer', () => {
  const summarizer = new PatternSummarizer();

  const createEntry = (overrides: Partial<TranscriptEntry>): TranscriptEntry => ({
    uuid: '1',
    parentUuid: null,
    isSidechain: false,
    sessionId: 'session-1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'user',
    ...overrides,
  });

  describe('summarize', () => {
    it('should calculate user and assistant message counts', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'user', message: { role: 'user', content: 'hello' } }),
        createEntry({ uuid: '2', type: 'assistant', message: { role: 'assistant', content: 'hi' } }),
        createEntry({ uuid: '3', type: 'user', message: { role: 'user', content: 'thanks' } }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.metrics.userMessages).toBe(2);
      expect(summary.metrics.assistantMessages).toBe(1);
    });

    it('should calculate tool call count', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'tool_use', tool_name: 'Read' }),
        createEntry({ uuid: '2', type: 'tool_use', tool_name: 'Write' }),
        createEntry({ uuid: '3', type: 'tool_use', tool_name: 'Bash' }),
        createEntry({ uuid: '4', type: 'assistant' }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.metrics.toolCalls).toBe(3);
    });

    it('should extract unique files read and written', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/a.ts' } }),
        createEntry({ uuid: '2', type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/a.ts' } }),
        createEntry({ uuid: '3', type: 'tool_use', tool_name: 'Read', tool_input: { file_path: '/b.ts' } }),
        createEntry({ uuid: '4', type: 'tool_use', tool_name: 'Write', tool_input: { file_path: '/c.ts' } }),
        createEntry({ uuid: '5', type: 'tool_use', tool_name: 'Edit', tool_input: { file_path: '/c.ts' } }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.metrics.uniqueFilesRead).toBe(2);
      expect(summary.metrics.uniqueFilesWritten).toBe(1);
    });

    it('should extract unique commands run', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git status' } }),
        createEntry({ uuid: '2', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git add .' } }),
        createEntry({ uuid: '3', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm install' } }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.metrics.uniqueCommandsRun).toBe(2); // git, npm
    });

    it('should extract top commands sorted by frequency', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git status' } }),
        createEntry({ uuid: '2', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git add' } }),
        createEntry({ uuid: '3', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'git commit' } }),
        createEntry({ uuid: '4', type: 'tool_use', tool_name: 'Bash', tool_input: { command: 'npm test' } }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.topCommands[0]).toBe('git');
      expect(summary.topCommands).toContain('npm');
    });

    it('should extract top tools sorted by frequency', () => {
      const entries: TranscriptEntry[] = [
        createEntry({ uuid: '1', type: 'tool_use', tool_name: 'Read' }),
        createEntry({ uuid: '2', type: 'tool_use', tool_name: 'Read' }),
        createEntry({ uuid: '3', type: 'tool_use', tool_name: 'Read' }),
        createEntry({ uuid: '4', type: 'tool_use', tool_name: 'Write' }),
        createEntry({ uuid: '5', type: 'tool_use', tool_name: 'Bash' }),
      ];

      const summary = summarizer.summarize(
        entries,
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary.topTools[0]).toBe('Read');
    });

    it('should calculate duration in minutes', () => {
      const start = 1000;
      const end = start + 5 * 60 * 1000; // 5 minutes

      const summary = summarizer.summarize(
        [],
        'session-1',
        start,
        end,
        'startup',
        'other'
      );

      expect(summary.durationMinutes).toBe(5);
    });

    it('should include session metadata', () => {
      const summary = summarizer.summarize(
        [],
        'my-session-id',
        1000,
        2000,
        'resume',
        'clear'
      );

      expect(summary.sessionId).toBe('my-session-id');
      expect(summary.source).toBe('resume');
      expect(summary.reason).toBe('clear');
    });
  });

  describe('summarizeSession', () => {
    it('should be a convenience function', () => {
      const summary = summarizeSession(
        [],
        'session-1',
        1000,
        61000,
        'startup',
        'other'
      );

      expect(summary).toBeDefined();
      expect(summary.sessionId).toBe('session-1');
    });
  });
});
