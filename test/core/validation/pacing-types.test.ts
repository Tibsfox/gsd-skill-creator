/**
 * @file Pacing gate type shape tests
 * @description Verifies PacingConfig, PacingResult, ArtifactTimestamp, PacingStatus
 *              types are importable and satisfy expected shapes.
 */
import { describe, expect, it } from 'vitest';
import type { PacingConfig, PacingResult, ArtifactTimestamp, PacingStatus } from '../../../src/core/validation/pacing-gate/index.js';
import { DEFAULT_PACING_CONFIG } from '../../../src/core/validation/pacing-gate/index.js';

describe('PacingConfig type', () => {
  it('should be constructable with all required fields', () => {
    const config: PacingConfig = {
      maxSubversionsPerSession: 5,
      minContextWindowsPerSubversion: 2,
      mandatoryRetrospective: true,
      mandatoryLessonsLearned: true,
      sequentialOnly: true,
    };
    expect(config.maxSubversionsPerSession).toBe(5);
    expect(config.minContextWindowsPerSubversion).toBe(2);
    expect(config.mandatoryRetrospective).toBe(true);
    expect(config.mandatoryLessonsLearned).toBe(true);
    expect(config.sequentialOnly).toBe(true);
  });
});

describe('PacingResult type', () => {
  it('should be constructable with all required fields', () => {
    const result: PacingResult = {
      status: 'warn',
      sessionId: 's1',
      subversionsCompleted: 6,
      budgetMax: 5,
      contextWindowsUsed: 1,
      depthMinimum: 2,
      advisories: ['Exceeded session budget: 6/5 subversions'],
      timestamp: '2026-03-02T00:00:00Z',
    };
    expect(result.status).toBe('warn');
    expect(result.sessionId).toBe('s1');
    expect(result.subversionsCompleted).toBe(6);
    expect(result.budgetMax).toBe(5);
    expect(result.contextWindowsUsed).toBe(1);
    expect(result.depthMinimum).toBe(2);
    expect(result.advisories).toHaveLength(1);
    expect(result.timestamp).toBe('2026-03-02T00:00:00Z');
  });
});

describe('ArtifactTimestamp type', () => {
  it('should be constructable with all required fields', () => {
    const ts: ArtifactTimestamp = {
      path: 'file.md',
      createdAt: '2026-03-02T00:00:00Z',
      sessionId: 's1',
      subversionId: 'v1.50.14',
    };
    expect(ts.path).toBe('file.md');
    expect(ts.createdAt).toBe('2026-03-02T00:00:00Z');
    expect(ts.sessionId).toBe('s1');
    expect(ts.subversionId).toBe('v1.50.14');
  });
});

describe('PacingStatus type', () => {
  it('should accept pass, warn, and fail values', () => {
    const pass: PacingStatus = 'pass';
    const warn: PacingStatus = 'warn';
    const fail: PacingStatus = 'fail';
    expect(pass).toBe('pass');
    expect(warn).toBe('warn');
    expect(fail).toBe('fail');
  });
});

describe('DEFAULT_PACING_CONFIG', () => {
  it('should be a valid PacingConfig with sensible defaults', () => {
    const config: PacingConfig = DEFAULT_PACING_CONFIG;
    expect(config.maxSubversionsPerSession).toBe(5);
    expect(config.minContextWindowsPerSubversion).toBe(2);
    expect(config.mandatoryRetrospective).toBe(true);
    expect(config.mandatoryLessonsLearned).toBe(true);
    expect(config.sequentialOnly).toBe(true);
  });

  it('should have all required PacingConfig fields', () => {
    expect(DEFAULT_PACING_CONFIG).toHaveProperty('maxSubversionsPerSession');
    expect(DEFAULT_PACING_CONFIG).toHaveProperty('minContextWindowsPerSubversion');
    expect(DEFAULT_PACING_CONFIG).toHaveProperty('mandatoryRetrospective');
    expect(DEFAULT_PACING_CONFIG).toHaveProperty('mandatoryLessonsLearned');
    expect(DEFAULT_PACING_CONFIG).toHaveProperty('sequentialOnly');
  });
});
