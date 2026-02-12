import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ObservationRateLimiter,
  DEFAULT_RATE_LIMIT_CONFIG,
  detectAnomalies,
} from './rate-limiter.js';
import type { SessionObservation } from '../types/observation.js';

function makeObservation(overrides: Partial<SessionObservation> = {}): SessionObservation {
  const startTime = overrides.startTime ?? 1000000;
  const endTime = overrides.endTime ?? startTime + 600000; // 10 minutes later
  return {
    sessionId: 's1',
    startTime,
    endTime,
    durationMinutes: (endTime - startTime) / 60000,
    source: 'startup',
    reason: 'clear',
    metrics: {
      userMessages: 5,
      assistantMessages: 5,
      toolCalls: 3,
      uniqueFilesRead: 2,
      uniqueFilesWritten: 1,
      uniqueCommandsRun: 1,
    },
    topCommands: ['git status'],
    topFiles: ['src/index.ts'],
    topTools: ['Read'],
    activeSkills: [],
    ...overrides,
  };
}

describe('ObservationRateLimiter', () => {
  describe('defaults', () => {
    it('DEFAULT_RATE_LIMIT_CONFIG has maxPerSession: 50 and maxPerHour: 200', () => {
      expect(DEFAULT_RATE_LIMIT_CONFIG.maxPerSession).toBe(50);
      expect(DEFAULT_RATE_LIMIT_CONFIG.maxPerHour).toBe(200);
    });
  });

  describe('per-session rate limiting', () => {
    let limiter: ObservationRateLimiter;

    beforeEach(() => {
      limiter = new ObservationRateLimiter({ maxPerSession: 3, maxPerHour: 100 });
    });

    it('returns {allowed: true} for first call', () => {
      const result = limiter.checkLimit('session-1');
      expect(result).toEqual({ allowed: true });
    });

    it('returns {allowed: true} up to maxPerSession calls for same session', () => {
      expect(limiter.checkLimit('session-1')).toEqual({ allowed: true });
      expect(limiter.checkLimit('session-1')).toEqual({ allowed: true });
      expect(limiter.checkLimit('session-1')).toEqual({ allowed: true });
    });

    it('returns {allowed: false} on call maxPerSession+1', () => {
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      const result = limiter.checkLimit('session-1');
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('Session rate limit exceeded');
        expect(result.reason).toContain('3');
      }
    });

    it('different sessionIds have independent counters', () => {
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      // session-1 is now at limit
      expect(limiter.checkLimit('session-1').allowed).toBe(false);
      // session-2 should still be allowed
      expect(limiter.checkLimit('session-2')).toEqual({ allowed: true });
    });

    it('reset(sessionId) clears the counter for that session', () => {
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      limiter.checkLimit('session-1');
      expect(limiter.checkLimit('session-1').allowed).toBe(false);
      limiter.reset('session-1');
      expect(limiter.checkLimit('session-1')).toEqual({ allowed: true });
    });
  });

  describe('per-time-window rate limiting', () => {
    it('returns {allowed: false} when global hourly limit exceeded', () => {
      const limiter = new ObservationRateLimiter({ maxPerSession: 100, maxPerHour: 5 });
      // Use different sessions so per-session limit doesn't kick in
      expect(limiter.checkLimit('s1')).toEqual({ allowed: true });
      expect(limiter.checkLimit('s2')).toEqual({ allowed: true });
      expect(limiter.checkLimit('s3')).toEqual({ allowed: true });
      expect(limiter.checkLimit('s4')).toEqual({ allowed: true });
      expect(limiter.checkLimit('s5')).toEqual({ allowed: true });
      const result = limiter.checkLimit('s6');
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('Hourly rate limit exceeded');
        expect(result.reason).toContain('5');
      }
    });

    it('custom config enforces custom limits', () => {
      const limiter = new ObservationRateLimiter({ maxPerSession: 2, maxPerHour: 10 });
      limiter.checkLimit('s1');
      limiter.checkLimit('s1');
      const result = limiter.checkLimit('s1');
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toContain('2');
      }
    });
  });
});

describe('detectAnomalies', () => {
  it('flags entries with identical timestamps as duplicate', () => {
    const entries = [
      makeObservation({ startTime: 1000, endTime: 2000, durationMinutes: (2000 - 1000) / 60000 }),
      makeObservation({ startTime: 1000, endTime: 3000, durationMinutes: (3000 - 1000) / 60000 }),
    ];
    const report = detectAnomalies(entries);
    expect(report.anomalies.length).toBeGreaterThan(0);
    expect(report.anomalies.some(a => a.type === 'duplicate-timestamp')).toBe(true);
    expect(report.anomalies.some(a => a.message.includes('Duplicate timestamps'))).toBe(true);
  });

  it('flags entries where endTime < startTime as impossible duration', () => {
    const entries = [
      makeObservation({ startTime: 5000, endTime: 3000, durationMinutes: 0 }),
    ];
    const report = detectAnomalies(entries);
    expect(report.anomalies.length).toBeGreaterThan(0);
    expect(report.anomalies.some(a => a.type === 'impossible-duration')).toBe(true);
    expect(report.anomalies.some(a => a.message.includes('endTime before startTime'))).toBe(true);
  });

  it('flags entries with duration mismatch (off by more than 2 minutes)', () => {
    // startTime=0, endTime=600000 (10 min), but durationMinutes=20 (off by 10)
    const entries = [
      makeObservation({ startTime: 0, endTime: 600000, durationMinutes: 20 }),
    ];
    const report = detectAnomalies(entries);
    expect(report.anomalies.length).toBeGreaterThan(0);
    expect(report.anomalies.some(a => a.type === 'duration-mismatch')).toBe(true);
    expect(report.anomalies.some(a => a.message.includes('Duration mismatch'))).toBe(true);
  });

  it('returns empty anomalies array for normal entries', () => {
    const entries = [
      makeObservation({ startTime: 1000, endTime: 601000, durationMinutes: 10 }),
      makeObservation({ startTime: 2000, endTime: 602000, durationMinutes: 10 }),
    ];
    const report = detectAnomalies(entries);
    expect(report.anomalies).toEqual([]);
  });

  it('report has correct entryIndex for each anomaly', () => {
    const entries = [
      makeObservation({ startTime: 1000, endTime: 601000, durationMinutes: 10 }),
      makeObservation({ startTime: 5000, endTime: 3000, durationMinutes: 0 }),
    ];
    const report = detectAnomalies(entries);
    const impossibleAnomaly = report.anomalies.find(a => a.type === 'impossible-duration');
    expect(impossibleAnomaly).toBeDefined();
    expect(impossibleAnomaly!.entryIndex).toBe(1);
  });
});
