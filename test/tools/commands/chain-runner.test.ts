/**
 * @file Combined chain validation runner behavioral tests
 * @description Tests runChainValidation for orchestrating chain integrity validation,
 *              forward reference enforcement, catalog building, and pattern detection.
 */
import { describe, expect, it } from 'vitest';
import { runChainValidation } from '../../../src/tools/commands/lessons-chain/chain-runner.js';
import { DEFAULT_CHAIN_CONFIG } from '../../../src/tools/commands/lessons-chain/chain-types.js';
import type { ChainConfig, LessonEntry } from '../../../src/tools/commands/lessons-chain/chain-types.js';

function makeLessonEntry(overrides: Partial<LessonEntry> = {}): LessonEntry {
  return {
    id: 'L1',
    title: 'Test Lesson',
    observation: 'Observed something',
    connection: 'Connected to foundation',
    actionItem: 'Do something next',
    recurrenceCount: 1,
    firstSeenMilestone: 'v1.50.14',
    tags: ['test'],
    ...overrides,
  };
}

const intactParams = {
  config: DEFAULT_CHAIN_CONFIG,
  milestoneId: 'v1.50.15',
  priorMilestoneId: 'v1.50.14',
  priorLessonsPath: '.planning/v1.50.14/lessons-learned.md',
  priorLessonsExists: true,
  currentMilestoneContent: 'This milestone builds on lessons from .planning/v1.50.14/lessons-learned.md',
  currentLessonsPath: '.planning/v1.50.15/lessons-learned.md',
  nextPlanContent: 'This plan references .planning/v1.50.15/lessons-learned.md for continuity.',
  nextPlanPath: '.planning/v1.50.16/plan.md',
  chainPosition: 2,
  totalInSeries: 50,
  lessonsByMilestone: [
    {
      milestoneId: 'v1.50.14',
      lessons: [makeLessonEntry({ id: 'L1', recurrenceCount: 3 })],
    },
  ],
  milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
};

describe('runChainValidation', () => {
  it('should return overallStatus=intact when both integrity and forward reference are valid', () => {
    const result = runChainValidation(intactParams);
    expect(result.overallStatus).toBe('intact');
    expect(result.errors).toEqual([]);
  });

  it('should return overallStatus=broken when chain integrity fails', () => {
    const result = runChainValidation({
      ...intactParams,
      priorLessonsExists: false,
    });
    expect(result.overallStatus).toBe('broken');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return overallStatus=broken when forward reference fails', () => {
    const result = runChainValidation({
      ...intactParams,
      nextPlanContent: 'No reference at all.',
    });
    expect(result.overallStatus).toBe('broken');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return overallStatus=incomplete when neither broken but at least one incomplete', () => {
    const incompleteConfig: ChainConfig = {
      ...DEFAULT_CHAIN_CONFIG,
      requiresPriorLessons: false,
    };
    const result = runChainValidation({
      ...intactParams,
      config: incompleteConfig,
      priorLessonsExists: false,
    });
    expect(result.overallStatus).toBe('incomplete');
    expect(result.errors).toEqual([]);
  });

  it('should merge chain integrity and forward reference results', () => {
    const result = runChainValidation(intactParams);
    expect(result.chainIntegrity.priorLessonsFound).toBe(true);
    expect(result.chainIntegrity.priorLessonsPath).toBe('.planning/v1.50.14/lessons-learned.md');
    expect(result.chainIntegrity.forwardReferenceFound).toBe(true);
    expect(result.chainIntegrity.forwardReferencePath).toBe('.planning/v1.50.16/plan.md');
  });

  it('should combine errors from both validations', () => {
    const result = runChainValidation({
      ...intactParams,
      priorLessonsExists: false,
      nextPlanContent: 'No reference.',
    });
    expect(result.errors.length).toBe(2);
    expect(result.errors.some((e) => e.includes('Prior lessons-learned'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Next milestone plan'))).toBe(true);
  });

  it('should build catalog with promoted patterns', () => {
    const result = runChainValidation({
      ...intactParams,
      lessonsByMilestone: [
        {
          milestoneId: 'v1.50.14',
          lessons: [
            makeLessonEntry({ id: 'L1', recurrenceCount: 5, tags: ['a'] }),
            makeLessonEntry({ id: 'L2', recurrenceCount: 1, tags: ['b'] }),
          ],
        },
      ],
    });
    expect(result.catalog.totalLessons).toBe(2);
    expect(result.catalog.promotedPatterns).toContain('L1');
    expect(result.catalog.promotedPatterns).not.toContain('L2');
  });

  it('should include a valid ISO timestamp', () => {
    const result = runChainValidation(intactParams);
    expect(result.timestamp).toBeTruthy();
    // Should be parseable as ISO date
    const parsed = new Date(result.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it('should handle single-milestone series (chainPosition=1 and totalInSeries=1)', () => {
    const result = runChainValidation({
      ...intactParams,
      chainPosition: 1,
      totalInSeries: 1,
      priorLessonsExists: false,
      nextPlanContent: '',
    });
    expect(result.overallStatus).toBe('intact');
    expect(result.errors).toEqual([]);
  });

  it('should return ChainValidationResult with all expected fields', () => {
    const result = runChainValidation(intactParams);
    expect(result).toHaveProperty('chainIntegrity');
    expect(result).toHaveProperty('catalog');
    expect(result).toHaveProperty('overallStatus');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('timestamp');
  });

  it('should handle overallStatus=broken when both are broken', () => {
    const result = runChainValidation({
      ...intactParams,
      priorLessonsExists: false,
      nextPlanContent: 'No ref.',
    });
    expect(result.overallStatus).toBe('broken');
  });

  it('should handle overallStatus=incomplete when forward reference is incomplete', () => {
    const relaxedConfig: ChainConfig = {
      ...DEFAULT_CHAIN_CONFIG,
      feedForwardEnforced: false,
    };
    const result = runChainValidation({
      ...intactParams,
      config: relaxedConfig,
      nextPlanContent: 'No ref.',
    });
    expect(result.overallStatus).toBe('incomplete');
  });
});
