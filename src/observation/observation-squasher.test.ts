import { describe, it, expect } from 'vitest';
import { ObservationSquasher } from './observation-squasher.js';
import type { SessionObservation } from '../types/observation.js';

function makeObservation(overrides: Partial<SessionObservation> = {}): SessionObservation {
  return {
    sessionId: 'test-session',
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    durationMinutes: 1,
    source: 'startup',
    reason: 'logout',
    metrics: {
      userMessages: 1,
      assistantMessages: 1,
      toolCalls: 0,
      uniqueFilesRead: 0,
      uniqueFilesWritten: 0,
      uniqueCommandsRun: 0,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills: [],
    tier: 'ephemeral',
    ...overrides,
  };
}

describe('ObservationSquasher', () => {
  const squasher = new ObservationSquasher();

  it('returns null for empty input', () => {
    const result = squasher.squash([]);
    expect(result).toBeNull();
  });

  it('returns single observation as-is with tier set to persistent', () => {
    const obs = makeObservation({ sessionId: 'solo-session' });
    const result = squasher.squash([obs]);

    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('solo-session');
    expect(result!.tier).toBe('persistent');
    expect(result!.squashedFrom).toBe(1);
  });

  it('merges two observations with summed metrics', () => {
    const now = Date.now();
    const obs1 = makeObservation({
      sessionId: 'session-a',
      startTime: now - 120000,
      endTime: now - 60000,
      durationMinutes: 1,
      source: 'startup',
      reason: 'clear',
      metrics: {
        userMessages: 2,
        assistantMessages: 3,
        toolCalls: 1,
        uniqueFilesRead: 4,
        uniqueFilesWritten: 2,
        uniqueCommandsRun: 1,
      },
      topCommands: ['npm test'],
      topFiles: ['src/a.ts'],
      topTools: ['Read'],
      activeSkills: ['skill-a'],
    });

    const obs2 = makeObservation({
      sessionId: 'session-b',
      startTime: now - 60000,
      endTime: now,
      durationMinutes: 1,
      source: 'resume',
      reason: 'logout',
      metrics: {
        userMessages: 3,
        assistantMessages: 2,
        toolCalls: 5,
        uniqueFilesRead: 1,
        uniqueFilesWritten: 3,
        uniqueCommandsRun: 2,
      },
      topCommands: ['git status'],
      topFiles: ['src/b.ts'],
      topTools: ['Bash'],
      activeSkills: ['skill-b'],
    });

    const result = squasher.squash([obs1, obs2]);

    expect(result).not.toBeNull();
    // Session ID from first observation
    expect(result!.sessionId).toBe('session-a');
    // Source and reason from first observation
    expect(result!.source).toBe('startup');
    expect(result!.reason).toBe('clear');
    // Timestamps: min start, max end
    expect(result!.startTime).toBe(now - 120000);
    expect(result!.endTime).toBe(now);
    // Duration recalculated
    expect(result!.durationMinutes).toBe(Math.round(120000 / 60000));
    // Summed metrics
    expect(result!.metrics.userMessages).toBe(5);
    expect(result!.metrics.assistantMessages).toBe(5);
    expect(result!.metrics.toolCalls).toBe(6);
    expect(result!.metrics.uniqueFilesRead).toBe(5);
    expect(result!.metrics.uniqueFilesWritten).toBe(5);
    expect(result!.metrics.uniqueCommandsRun).toBe(3);
    // Union arrays
    expect(result!.topCommands).toEqual(expect.arrayContaining(['npm test', 'git status']));
    expect(result!.topFiles).toEqual(expect.arrayContaining(['src/a.ts', 'src/b.ts']));
    expect(result!.topTools).toEqual(expect.arrayContaining(['Read', 'Bash']));
    expect(result!.activeSkills).toEqual(expect.arrayContaining(['skill-a', 'skill-b']));
    // Tier and squash metadata
    expect(result!.tier).toBe('persistent');
    expect(result!.squashedFrom).toBe(2);
  });

  it('merges three observations with squashedFrom: 3', () => {
    const obs1 = makeObservation({ sessionId: 'first' });
    const obs2 = makeObservation({ sessionId: 'second' });
    const obs3 = makeObservation({ sessionId: 'third' });

    const result = squasher.squash([obs1, obs2, obs3]);

    expect(result).not.toBeNull();
    expect(result!.squashedFrom).toBe(3);
    expect(result!.sessionId).toBe('first');
  });

  it('deduplicates overlapping array entries', () => {
    const obs1 = makeObservation({
      topFiles: ['src/a.ts', 'src/b.ts'],
      topCommands: ['npm test', 'git status'],
      topTools: ['Read', 'Bash'],
      activeSkills: ['skill-a'],
    });
    const obs2 = makeObservation({
      topFiles: ['src/b.ts', 'src/c.ts'],
      topCommands: ['npm test', 'npm build'],
      topTools: ['Bash', 'Edit'],
      activeSkills: ['skill-a', 'skill-b'],
    });

    const result = squasher.squash([obs1, obs2]);

    expect(result).not.toBeNull();
    expect(result!.topFiles).toHaveLength(3); // a, b, c
    expect(result!.topCommands).toHaveLength(3); // npm test, git status, npm build
    expect(result!.topTools).toHaveLength(3); // Read, Bash, Edit
    expect(result!.activeSkills).toHaveLength(2); // skill-a, skill-b
  });

  it('handles empty arrays in observations', () => {
    const obs1 = makeObservation({
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills: [],
    });
    const obs2 = makeObservation({
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills: [],
    });

    const result = squasher.squash([obs1, obs2]);

    expect(result).not.toBeNull();
    expect(result!.topCommands).toEqual([]);
    expect(result!.topFiles).toEqual([]);
    expect(result!.topTools).toEqual([]);
    expect(result!.activeSkills).toEqual([]);
  });

  it('uses sessionId from first observation', () => {
    const obs1 = makeObservation({ sessionId: 'first-session' });
    const obs2 = makeObservation({ sessionId: 'second-session' });
    const obs3 = makeObservation({ sessionId: 'third-session' });

    const result = squasher.squash([obs1, obs2, obs3]);

    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('first-session');
  });

  it('uses source and reason from first observation', () => {
    const obs1 = makeObservation({ source: 'resume', reason: 'clear' });
    const obs2 = makeObservation({ source: 'startup', reason: 'logout' });

    const result = squasher.squash([obs1, obs2]);

    expect(result).not.toBeNull();
    expect(result!.source).toBe('resume');
    expect(result!.reason).toBe('clear');
  });
});
