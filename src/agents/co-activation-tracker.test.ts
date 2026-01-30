import { describe, it, expect } from 'vitest';
import { CoActivationTracker } from './co-activation-tracker.js';
import { SessionObservation } from '../types/observation.js';

describe('CoActivationTracker', () => {
  function createSession(
    id: string,
    activeSkills: string[],
    startTime: number = Date.now()
  ): SessionObservation {
    return {
      sessionId: id,
      startTime,
      endTime: startTime + 60000,
      durationMinutes: 1,
      source: 'startup',
      reason: 'clear',
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills,
    };
  }

  describe('analyze', () => {
    it('should return empty array for empty sessions', () => {
      const tracker = new CoActivationTracker();
      const result = tracker.analyze([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for single-skill sessions', () => {
      const tracker = new CoActivationTracker();
      const sessions = [
        createSession('s1', ['skill-a']),
        createSession('s2', ['skill-b']),
        createSession('s3', ['skill-a']),
      ];
      const result = tracker.analyze(sessions);
      expect(result).toEqual([]);
    });

    it('should detect two skills in same session', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [createSession('s1', ['skill-a', 'skill-b'])];
      const result = tracker.analyze(sessions);

      expect(result.length).toBe(1);
      expect(result[0].skillPair).toEqual(['skill-a', 'skill-b']);
      expect(result[0].coActivationCount).toBe(1);
    });

    it('should filter by minCoActivations threshold', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 3 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        // Only 2 co-activations, should be filtered
      ];
      const result = tracker.analyze(sessions);
      expect(result).toEqual([]);
    });

    it('should return co-activations above threshold', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 3 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        createSession('s3', ['skill-a', 'skill-b']),
      ];
      const result = tracker.analyze(sessions);

      expect(result.length).toBe(1);
      expect(result[0].coActivationCount).toBe(3);
    });

    it('should filter by recency', () => {
      const tracker = new CoActivationTracker({
        minCoActivations: 1,
        recencyDays: 7,
      });
      const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const sessions = [createSession('s1', ['skill-a', 'skill-b'], oldTime)];
      const result = tracker.analyze(sessions);

      expect(result).toEqual([]);
    });

    it('should sort pairs alphabetically', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [createSession('s1', ['zebra-skill', 'alpha-skill'])];
      const result = tracker.analyze(sessions);

      expect(result[0].skillPair).toEqual(['alpha-skill', 'zebra-skill']);
    });

    it('should track session IDs', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('session-1', ['skill-a', 'skill-b']),
        createSession('session-2', ['skill-a', 'skill-b']),
      ];
      const result = tracker.analyze(sessions);

      expect(result[0].sessions).toContain('session-1');
      expect(result[0].sessions).toContain('session-2');
    });

    it('should track firstSeen and lastSeen', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const time1 = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
      const time2 = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b'], time1),
        createSession('s2', ['skill-a', 'skill-b'], time2),
      ];
      const result = tracker.analyze(sessions);

      expect(result[0].firstSeen).toBe(time1);
      expect(result[0].lastSeen).toBe(time2);
    });

    it('should handle multiple skill pairs', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b', 'skill-c']),
      ];
      const result = tracker.analyze(sessions);

      // 3 skills = 3 pairs: a-b, a-c, b-c
      expect(result.length).toBe(3);
    });

    it('should sort results by count descending', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        createSession('s3', ['skill-a', 'skill-b']),
        createSession('s4', ['skill-c', 'skill-d']),
      ];
      const result = tracker.analyze(sessions);

      expect(result[0].skillPair).toEqual(['skill-a', 'skill-b']);
      expect(result[0].coActivationCount).toBe(3);
      expect(result[1].skillPair).toEqual(['skill-c', 'skill-d']);
      expect(result[1].coActivationCount).toBe(1);
    });
  });

  describe('getCoActivationScore', () => {
    it('should return 0 for unknown pairs', () => {
      const tracker = new CoActivationTracker();
      const sessions = [createSession('s1', ['skill-a', 'skill-b'])];
      const score = tracker.getCoActivationScore('skill-x', 'skill-y', sessions);

      expect(score).toBe(0);
    });

    it('should return higher score for frequent pairs', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        createSession('s3', ['skill-a', 'skill-b']),
        createSession('s4', ['skill-c', 'skill-d']),
      ];

      const frequentScore = tracker.getCoActivationScore(
        'skill-a',
        'skill-b',
        sessions
      );
      const rareScore = tracker.getCoActivationScore(
        'skill-c',
        'skill-d',
        sessions
      );

      expect(frequentScore).toBeGreaterThan(rareScore);
    });

    it('should normalize score to 0-1 range', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
      ];
      const score = tracker.getCoActivationScore('skill-a', 'skill-b', sessions);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('getRelatedSkills', () => {
    it('should return empty array for unknown skill', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [createSession('s1', ['skill-a', 'skill-b'])];
      const related = tracker.getRelatedSkills('skill-x', sessions);

      expect(related).toEqual([]);
    });

    it('should return related skills sorted by count', () => {
      const tracker = new CoActivationTracker({ minCoActivations: 1 });
      const sessions = [
        createSession('s1', ['skill-a', 'skill-b']),
        createSession('s2', ['skill-a', 'skill-b']),
        createSession('s3', ['skill-a', 'skill-c']),
      ];
      const related = tracker.getRelatedSkills('skill-a', sessions);

      expect(related.length).toBe(2);
      expect(related[0].skill).toBe('skill-b');
      expect(related[0].count).toBe(2);
      expect(related[1].skill).toBe('skill-c');
      expect(related[1].count).toBe(1);
    });
  });
});
