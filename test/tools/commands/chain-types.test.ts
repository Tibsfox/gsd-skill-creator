/**
 * @file Lessons-learned chain type shape tests
 * @description Verifies ChainConfig, ChainIntegrity, LessonEntry, LessonsCatalog,
 *              ChainStatus types are importable and satisfy expected shapes.
 */
import { describe, expect, it } from 'vitest';
import type {
  ChainConfig,
  ChainIntegrity,
  LessonEntry,
  LessonsCatalog,
  ChainStatus,
} from '../../../src/tools/commands/lessons-chain/index.js';
import { DEFAULT_CHAIN_CONFIG } from '../../../src/tools/commands/lessons-chain/index.js';

describe('ChainConfig type', () => {
  it('should be constructable with all required fields', () => {
    const config: ChainConfig = {
      requiresPriorLessons: true,
      feedForwardEnforced: true,
      patternPromotionThreshold: 3,
      catalogScope: 'milestone-series',
    };
    expect(config.requiresPriorLessons).toBe(true);
    expect(config.feedForwardEnforced).toBe(true);
    expect(config.patternPromotionThreshold).toBe(3);
    expect(config.catalogScope).toBe('milestone-series');
  });

  it('should accept all catalogScope', () => {
    const config: ChainConfig = {
      requiresPriorLessons: false,
      feedForwardEnforced: false,
      patternPromotionThreshold: 5,
      catalogScope: 'all',
    };
    expect(config.catalogScope).toBe('all');
  });
});

describe('ChainIntegrity type', () => {
  it('should be constructable with all required fields', () => {
    const integrity: ChainIntegrity = {
      valid: true,
      status: 'intact',
      priorLessonsFound: true,
      priorLessonsPath: '.planning/v1.50.13/lessons-learned.md',
      forwardReferenceFound: true,
      forwardReferencePath: '.planning/v1.50.14/plan.md',
      errors: [],
      chainPosition: 3,
      totalInSeries: 50,
    };
    expect(integrity.valid).toBe(true);
    expect(integrity.status).toBe('intact');
    expect(integrity.priorLessonsFound).toBe(true);
    expect(integrity.priorLessonsPath).toContain('lessons-learned');
    expect(integrity.forwardReferenceFound).toBe(true);
    expect(integrity.errors).toEqual([]);
    expect(integrity.chainPosition).toBe(3);
    expect(integrity.totalInSeries).toBe(50);
  });
});

describe('LessonEntry type', () => {
  it('should be constructable with all required fields', () => {
    const entry: LessonEntry = {
      id: 'L1',
      title: 'Batch compression root cause',
      observation: 'GSD optimized for throughput over depth',
      connection: 'Matches RC-4 from v1.50a analysis',
      actionItem: 'Add pacing gate to enforce session budget',
      recurrenceCount: 1,
      firstSeenMilestone: 'v1.50.14',
      tags: ['pacing', 'enforcement'],
    };
    expect(entry.id).toBe('L1');
    expect(entry.title).toContain('Batch');
    expect(entry.observation).toBeTruthy();
    expect(entry.connection).toBeTruthy();
    expect(entry.actionItem).toBeTruthy();
    expect(entry.recurrenceCount).toBe(1);
    expect(entry.firstSeenMilestone).toBe('v1.50.14');
    expect(entry.tags).toHaveLength(2);
  });
});

describe('LessonsCatalog type', () => {
  it('should be constructable with all required fields', () => {
    const entry: LessonEntry = {
      id: 'L1',
      title: 'Test',
      observation: 'Observed',
      connection: 'Connected',
      actionItem: 'Action',
      recurrenceCount: 1,
      firstSeenMilestone: 'v1.50.14',
      tags: ['test'],
    };
    const catalog: LessonsCatalog = {
      milestoneRange: { from: 'v1.50.14', to: 'v1.50.20' },
      entries: [entry],
      promotedPatterns: ['recurring-pattern-1'],
      totalLessons: 15,
      uniquePatterns: 8,
    };
    expect(catalog.milestoneRange.from).toBe('v1.50.14');
    expect(catalog.milestoneRange.to).toBe('v1.50.20');
    expect(catalog.entries).toHaveLength(1);
    expect(catalog.promotedPatterns).toHaveLength(1);
    expect(catalog.totalLessons).toBe(15);
    expect(catalog.uniquePatterns).toBe(8);
  });
});

describe('ChainStatus type', () => {
  it('should accept intact, broken, and incomplete values', () => {
    const intact: ChainStatus = 'intact';
    const broken: ChainStatus = 'broken';
    const incomplete: ChainStatus = 'incomplete';
    expect(intact).toBe('intact');
    expect(broken).toBe('broken');
    expect(incomplete).toBe('incomplete');
  });
});

describe('DEFAULT_CHAIN_CONFIG', () => {
  it('should be a valid ChainConfig with sensible defaults', () => {
    const config: ChainConfig = DEFAULT_CHAIN_CONFIG;
    expect(config.requiresPriorLessons).toBe(true);
    expect(config.feedForwardEnforced).toBe(true);
    expect(config.patternPromotionThreshold).toBe(3);
    expect(config.catalogScope).toBe('milestone-series');
  });

  it('should have all required ChainConfig fields', () => {
    expect(DEFAULT_CHAIN_CONFIG).toHaveProperty('requiresPriorLessons');
    expect(DEFAULT_CHAIN_CONFIG).toHaveProperty('feedForwardEnforced');
    expect(DEFAULT_CHAIN_CONFIG).toHaveProperty('patternPromotionThreshold');
    expect(DEFAULT_CHAIN_CONFIG).toHaveProperty('catalogScope');
  });
});
