import { describe, it, expect } from 'vitest';
import { StackBridge } from './stack-bridge.js';
import type { SessionObservation } from '../../types/observation.js';

// ============================================================================
// Test Helpers
// ============================================================================

/** Build a JSONL line from an object. */
function jsonl(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

/** Create a timestamp string (ISO 8601). */
function ts(offsetMs = 0): string {
  return new Date(1700000000000 + offsetMs).toISOString();
}

// ============================================================================
// StackBridge Tests
// ============================================================================

describe('StackBridge', () => {
  // --------------------------------------------------------------------------
  // Construction
  // --------------------------------------------------------------------------

  describe('constructor', () => {
    it('creates with default config', () => {
      const bridge = new StackBridge();
      expect(bridge).toBeDefined();
    });

    it('accepts partial config overrides', () => {
      const bridge = new StackBridge({ maxFilesPerSession: 5 });
      expect(bridge).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // parseStream
  // --------------------------------------------------------------------------

  describe('parseStream', () => {
    it('parses valid JSONL lines into StreamEvent objects', () => {
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(), name: 'test-rec', session: 'sess-1' }),
        jsonl({ type: 'terminal', ts: ts(1000), content: '$ vitest run' }),
        jsonl({ type: 'recording_stop', ts: ts(5000), name: 'test-rec' }),
      ];
      const bridge = new StackBridge();
      const events = bridge.parseStream(lines);
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('recording_start');
      expect(events[1].type).toBe('terminal');
      expect(events[2].type).toBe('recording_stop');
    });

    it('skips invalid JSON lines', () => {
      const lines = [
        'not valid json',
        jsonl({ type: 'recording_start', ts: ts(), name: 'test-rec' }),
        '{ broken',
      ];
      const bridge = new StackBridge();
      const events = bridge.parseStream(lines);
      expect(events).toHaveLength(1);
    });

    it('skips lines that fail schema validation', () => {
      const lines = [
        jsonl({ type: 'unknown_type', ts: ts() }),
        jsonl({ type: 'recording_start', ts: ts(), name: 'valid' }),
      ];
      const bridge = new StackBridge();
      const events = bridge.parseStream(lines);
      expect(events).toHaveLength(1);
    });

    it('skips empty lines', () => {
      const lines = ['', '  ', jsonl({ type: 'marker', ts: ts(), label: 'checkpoint' })];
      const bridge = new StackBridge();
      const events = bridge.parseStream(lines);
      expect(events).toHaveLength(1);
    });

    it('parses all 9 event types', () => {
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(), name: 'rec-1', session: 's1' }),
        jsonl({ type: 'terminal', ts: ts(100), content: '$ echo hello' }),
        jsonl({ type: 'file_change', ts: ts(200), path: 'src/index.ts', action: 'write' }),
        jsonl({ type: 'marker', ts: ts(300), label: 'phase-start' }),
        jsonl({ type: 'stack_push', ts: ts(400), priority: 'normal', message: 'do thing' }),
        jsonl({ type: 'stack_pop', ts: ts(500), priority: 'normal', message: 'do thing' }),
        jsonl({ type: 'stack_clear', ts: ts(600), count: 3 }),
        jsonl({ type: 'stack_poke', ts: ts(700), message: 'nudge' }),
        jsonl({ type: 'recording_stop', ts: ts(800), name: 'rec-1' }),
      ];
      const bridge = new StackBridge();
      const events = bridge.parseStream(lines);
      expect(events).toHaveLength(9);
    });
  });

  // --------------------------------------------------------------------------
  // aggregate
  // --------------------------------------------------------------------------

  describe('aggregate', () => {
    it('returns empty sessions for empty events', () => {
      const bridge = new StackBridge();
      const result = bridge.aggregate([]);
      expect(result.sessions).toHaveLength(0);
      expect(result.candidates).toBeUndefined();
    });

    it('groups events into a single recording session', () => {
      const bridge = new StackBridge();
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(), name: 'rec-1', session: 's1' }),
        jsonl({ type: 'terminal', ts: ts(1000), content: '$ vitest run' }),
        jsonl({ type: 'file_change', ts: ts(2000), path: 'src/foo.ts', action: 'write' }),
        jsonl({ type: 'recording_stop', ts: ts(60000), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      expect(result.sessions).toHaveLength(1);
      const session = result.sessions[0];
      expect(session.sessionId).toBe('rec-1');
      expect(session.source).toBe('startup');
      expect(session.reason).toBe('other');
      expect(session.topFiles).toContain('src/foo.ts');
      expect(session.topCommands).toContain('vitest run');
      expect(session.topTools).toEqual(['gsd-stack']);
      expect(session.activeSkills).toEqual([]);
    });

    it('computes correct timing from recording start/stop', () => {
      const bridge = new StackBridge();
      const startTs = ts(0);
      const stopTs = ts(120000); // 2 minutes later
      const lines = [
        jsonl({ type: 'recording_start', ts: startTs, name: 'rec-1' }),
        jsonl({ type: 'recording_stop', ts: stopTs, name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      const session = result.sessions[0];
      expect(session.startTime).toBe(new Date(startTs).getTime());
      expect(session.endTime).toBe(new Date(stopTs).getTime());
      expect(session.durationMinutes).toBe(2);
    });

    it('handles multiple recording sessions', () => {
      const bridge = new StackBridge();
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'recording_stop', ts: ts(10000), name: 'rec-1' }),
        jsonl({ type: 'recording_start', ts: ts(20000), name: 'rec-2' }),
        jsonl({ type: 'recording_stop', ts: ts(30000), name: 'rec-2' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].sessionId).toBe('rec-1');
      expect(result.sessions[1].sessionId).toBe('rec-2');
    });

    it('handles incomplete recording (no stop event) with endTime = last event ts', () => {
      const bridge = new StackBridge();
      const lastEventTs = ts(5000);
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'terminal', ts: lastEventTs, content: '$ echo done' }),
        // No recording_stop
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].endTime).toBe(new Date(lastEventTs).getTime());
    });

    it('extracts unique file paths from file_change events, limited by maxFilesPerSession', () => {
      const bridge = new StackBridge({ maxFilesPerSession: 3 });
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'file_change', ts: ts(100), path: 'a.ts', action: 'write' }),
        jsonl({ type: 'file_change', ts: ts(200), path: 'b.ts', action: 'write' }),
        jsonl({ type: 'file_change', ts: ts(300), path: 'a.ts', action: 'write' }), // duplicate
        jsonl({ type: 'file_change', ts: ts(400), path: 'c.ts', action: 'write' }),
        jsonl({ type: 'file_change', ts: ts(500), path: 'd.ts', action: 'write' }),
        jsonl({ type: 'recording_stop', ts: ts(600), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      // 4 unique files, but limited to 3
      expect(result.sessions[0].topFiles).toHaveLength(3);
    });

    it('extracts terminal commands from lines starting with "$ "', () => {
      const bridge = new StackBridge();
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'terminal', ts: ts(100), content: '$ npm test\noutput here' }),
        jsonl({ type: 'terminal', ts: ts(200), content: '$ vitest run --reporter=verbose' }),
        jsonl({ type: 'terminal', ts: ts(300), content: 'just some output without command' }),
        jsonl({ type: 'recording_stop', ts: ts(400), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      expect(result.sessions[0].topCommands).toContain('npm test');
      expect(result.sessions[0].topCommands).toContain('vitest run --reporter=verbose');
      expect(result.sessions[0].topCommands).toHaveLength(2);
    });

    it('counts stack operations and file changes as toolCalls metric', () => {
      const bridge = new StackBridge();
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'stack_push', ts: ts(100), message: 'a' }),
        jsonl({ type: 'stack_pop', ts: ts(200), message: 'a' }),
        jsonl({ type: 'stack_clear', ts: ts(300), count: 2 }),
        jsonl({ type: 'stack_poke', ts: ts(400), message: 'nudge' }),
        jsonl({ type: 'file_change', ts: ts(500), path: 'x.ts', action: 'write' }),
        jsonl({ type: 'recording_stop', ts: ts(600), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      // 4 stack ops + 1 file change = 5
      expect(result.sessions[0].metrics.toolCalls).toBe(5);
    });

    it('sets correct metrics fields', () => {
      const bridge = new StackBridge();
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'file_change', ts: ts(100), path: 'a.ts', action: 'write' }),
        jsonl({ type: 'file_change', ts: ts(200), path: 'b.ts', action: 'write' }),
        jsonl({ type: 'terminal', ts: ts(300), content: '$ vitest' }),
        jsonl({ type: 'recording_stop', ts: ts(400), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      const m = result.sessions[0].metrics;
      expect(m.uniqueFilesRead).toBe(0);
      expect(m.uniqueFilesWritten).toBe(2);
      expect(m.uniqueCommandsRun).toBe(1);
      expect(m.userMessages).toBe(0);
      expect(m.assistantMessages).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // fromStreamFile
  // --------------------------------------------------------------------------

  describe('fromStreamFile', () => {
    it('convenience method splits content, parses, and aggregates', () => {
      const bridge = new StackBridge();
      const content = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'terminal', ts: ts(1000), content: '$ echo hello' }),
        jsonl({ type: 'recording_stop', ts: ts(5000), name: 'rec-1' }),
      ].join('\n');

      const result = bridge.fromStreamFile(content);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe('rec-1');
      expect(result.candidates).toBeUndefined();
    });

    it('handles empty content', () => {
      const bridge = new StackBridge();
      const result = bridge.fromStreamFile('');
      expect(result.sessions).toHaveLength(0);
    });

    it('produces valid ObservationInput for LearningCompiler', () => {
      const bridge = new StackBridge();
      const content = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'session-alpha' }),
        jsonl({ type: 'file_change', ts: ts(1000), path: 'src/index.ts', action: 'write' }),
        jsonl({ type: 'terminal', ts: ts(2000), content: '$ npx vitest run' }),
        jsonl({ type: 'stack_push', ts: ts(3000), priority: 'normal', message: 'task 1' }),
        jsonl({ type: 'recording_stop', ts: ts(10000), name: 'session-alpha' }),
      ].join('\n');

      const result = bridge.fromStreamFile(content);

      // Validate the shape matches ObservationInput
      expect(result).toHaveProperty('sessions');
      expect(result).toHaveProperty('candidates');
      expect(Array.isArray(result.sessions)).toBe(true);

      // Validate SessionObservation fields
      const session = result.sessions[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('startTime');
      expect(session).toHaveProperty('endTime');
      expect(session).toHaveProperty('durationMinutes');
      expect(session).toHaveProperty('source');
      expect(session).toHaveProperty('reason');
      expect(session).toHaveProperty('metrics');
      expect(session).toHaveProperty('topCommands');
      expect(session).toHaveProperty('topFiles');
      expect(session).toHaveProperty('topTools');
      expect(session).toHaveProperty('activeSkills');
    });
  });

  // --------------------------------------------------------------------------
  // maxCommandsPerSession
  // --------------------------------------------------------------------------

  describe('maxCommandsPerSession config', () => {
    it('limits extracted commands to configured maximum', () => {
      const bridge = new StackBridge({ maxCommandsPerSession: 2 });
      const lines = [
        jsonl({ type: 'recording_start', ts: ts(0), name: 'rec-1' }),
        jsonl({ type: 'terminal', ts: ts(100), content: '$ cmd1' }),
        jsonl({ type: 'terminal', ts: ts(200), content: '$ cmd2' }),
        jsonl({ type: 'terminal', ts: ts(300), content: '$ cmd3' }),
        jsonl({ type: 'recording_stop', ts: ts(400), name: 'rec-1' }),
      ];
      const events = bridge.parseStream(lines);
      const result = bridge.aggregate(events);

      expect(result.sessions[0].topCommands).toHaveLength(2);
    });
  });
});
