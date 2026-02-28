import { describe, it, expect } from 'vitest';
import { computeCalibrationDeltas, classifyDirection } from '../../../src/platform/retro/calibration-delta.js';
import type { MilestoneMetrics } from '../../../src/platform/retro/types.js';

/**
 * Helper to create minimal valid MilestoneMetrics.
 */
function makeMetrics(overrides: Partial<MilestoneMetrics> = {}): MilestoneMetrics {
  return {
    milestone_name: 'v1.39 -- GSD-OS Bootstrap',
    milestone_version: 'v1.39',
    completion_date: '2026-02-28',
    wall_time_minutes: 120,
    estimated_wall_time_minutes: 90,
    total_tokens: 500000,
    opus_tokens: 300000,
    sonnet_tokens: 150000,
    haiku_tokens: 50000,
    context_windows: 8,
    sessions: 2,
    phases: 9,
    plans: 18,
    commits: 45,
    tests_written: 200,
    tests_passing: 200,
    requirements_total: 80,
    requirements_met: 80,
    source_loc: 12000,
    ...overrides,
  };
}

describe('calibration-delta', () => {
  describe('classifyDirection', () => {
    it('returns "over" when ratio > 1.1', () => {
      expect(classifyDirection(1.5)).toBe('over');
    });

    it('returns "under" when ratio < 0.9', () => {
      expect(classifyDirection(0.7)).toBe('under');
    });

    it('returns "accurate" when ratio between 0.9 and 1.1', () => {
      expect(classifyDirection(1.0)).toBe('accurate');
      // Boundary tests: 0.9 and 1.1 are inclusive
      expect(classifyDirection(0.9)).toBe('accurate');
      expect(classifyDirection(1.1)).toBe('accurate');
    });
  });

  describe('computeCalibrationDeltas', () => {
    it('returns delta for wall_time', () => {
      const metrics = makeMetrics({
        wall_time_minutes: 120,
        estimated_wall_time_minutes: 90,
      });

      const deltas = computeCalibrationDeltas(metrics);

      const wallDelta = deltas.find((d) => d.metric_name === 'wall_time_minutes');
      expect(wallDelta).toBeDefined();
      expect(wallDelta!.estimated).toBe(90);
      expect(wallDelta!.actual).toBe(120);
      expect(wallDelta!.ratio).toBeCloseTo(1.333, 2);
      expect(wallDelta!.direction).toBe('over');
    });

    it('handles zero estimated gracefully', () => {
      const metrics = makeMetrics({
        wall_time_minutes: 120,
        estimated_wall_time_minutes: 0,
      });

      const deltas = computeCalibrationDeltas(metrics);

      const wallDelta = deltas.find((d) => d.metric_name === 'wall_time_minutes');
      expect(wallDelta).toBeDefined();
      // Zero estimated with non-zero actual => Infinity ratio
      expect(wallDelta!.ratio).toBe(Infinity);
      expect(wallDelta!.direction).toBe('over');
    });

    it('computes deltas for all metric pairs', () => {
      const metrics = makeMetrics({
        wall_time_minutes: 100,
        estimated_wall_time_minutes: 100,
      });

      const deltas = computeCalibrationDeltas(metrics);

      // Built-in pair: wall_time_minutes
      expect(deltas.some((d) => d.metric_name === 'wall_time_minutes')).toBe(true);
    });

    it('with custom estimates map', () => {
      const metrics = makeMetrics({
        total_tokens: 65000,
        sessions: 2,
      });

      const estimates = {
        total_tokens: 50000,
        sessions: 3,
      };

      const deltas = computeCalibrationDeltas(metrics, estimates);

      // Custom: total_tokens
      const tokenDelta = deltas.find((d) => d.metric_name === 'total_tokens');
      expect(tokenDelta).toBeDefined();
      expect(tokenDelta!.estimated).toBe(50000);
      expect(tokenDelta!.actual).toBe(65000);
      expect(tokenDelta!.ratio).toBeCloseTo(1.3, 1);
      expect(tokenDelta!.direction).toBe('over');

      // Custom: sessions
      const sessionDelta = deltas.find((d) => d.metric_name === 'sessions');
      expect(sessionDelta).toBeDefined();
      expect(sessionDelta!.estimated).toBe(3);
      expect(sessionDelta!.actual).toBe(2);
      expect(sessionDelta!.ratio).toBeCloseTo(0.667, 2);
      expect(sessionDelta!.direction).toBe('under');
    });
  });
});
