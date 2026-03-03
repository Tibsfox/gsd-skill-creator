/**
 * @file Review milestone config type shape tests
 * @description Verifies ReviewMilestoneConfig, ReviewLifecycleState, ReviewScoringConfig
 *              types are importable and satisfy expected shapes, including cross-module
 *              references to PacingConfig and ChainConfig.
 */
import { describe, expect, it } from 'vitest';
import type {
  ReviewMilestoneConfig,
  ReviewLifecycleState,
  ReviewScoringConfig,
} from '../../../src/tools/commands/review-milestone/index.js';
import { DEFAULT_REVIEW_MILESTONE_CONFIG } from '../../../src/tools/commands/review-milestone/index.js';
import { DEFAULT_PACING_CONFIG } from '../../../src/core/validation/pacing-gate/index.js';
import type { PacingConfig } from '../../../src/core/validation/pacing-gate/index.js';
import { DEFAULT_CHAIN_CONFIG } from '../../../src/tools/commands/lessons-chain/index.js';
import type { ChainConfig } from '../../../src/tools/commands/lessons-chain/index.js';

describe('ReviewMilestoneConfig type', () => {
  it('should be constructable with all required fields', () => {
    const config: ReviewMilestoneConfig = {
      type: 'review',
      pacing: DEFAULT_PACING_CONFIG,
      chain: DEFAULT_CHAIN_CONFIG,
      scoring: {
        rubric: ['completeness', 'depth', 'connections', 'honesty'],
        minimumScore: 3.0,
      },
    };
    expect(config.type).toBe('review');
    expect(config.pacing.maxSubversionsPerSession).toBe(5);
    expect(config.chain.requiresPriorLessons).toBe(true);
    expect(config.scoring.rubric).toHaveLength(4);
    expect(config.scoring.minimumScore).toBe(3.0);
  });

  it('should accept PacingConfig for pacing field', () => {
    const pacing: PacingConfig = DEFAULT_PACING_CONFIG;
    const config: ReviewMilestoneConfig = {
      type: 'review',
      pacing,
      chain: DEFAULT_CHAIN_CONFIG,
      scoring: { rubric: [], minimumScore: 1.0 },
    };
    expect(config.pacing).toBe(pacing);
  });

  it('should accept ChainConfig for chain field', () => {
    const chain: ChainConfig = DEFAULT_CHAIN_CONFIG;
    const config: ReviewMilestoneConfig = {
      type: 'review',
      pacing: DEFAULT_PACING_CONFIG,
      chain,
      scoring: { rubric: [], minimumScore: 1.0 },
    };
    expect(config.chain).toBe(chain);
  });
});

describe('ReviewLifecycleState type', () => {
  it('should accept LOAD, REVIEW, REFLECT, and CLOSE values', () => {
    const load: ReviewLifecycleState = 'LOAD';
    const review: ReviewLifecycleState = 'REVIEW';
    const reflect: ReviewLifecycleState = 'REFLECT';
    const close: ReviewLifecycleState = 'CLOSE';
    expect(load).toBe('LOAD');
    expect(review).toBe('REVIEW');
    expect(reflect).toBe('REFLECT');
    expect(close).toBe('CLOSE');
  });
});

describe('ReviewScoringConfig type', () => {
  it('should be constructable with rubric and minimumScore', () => {
    const scoring: ReviewScoringConfig = {
      rubric: ['completeness', 'depth', 'connections', 'honesty'],
      minimumScore: 3.0,
    };
    expect(scoring.rubric).toHaveLength(4);
    expect(scoring.minimumScore).toBe(3.0);
  });
});

describe('DEFAULT_REVIEW_MILESTONE_CONFIG', () => {
  it('should be a valid ReviewMilestoneConfig with type review', () => {
    const config: ReviewMilestoneConfig = DEFAULT_REVIEW_MILESTONE_CONFIG;
    expect(config.type).toBe('review');
  });

  it('should have pacing config with sensible defaults', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.maxSubversionsPerSession).toBe(5);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.minContextWindowsPerSubversion).toBe(2);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.mandatoryRetrospective).toBe(true);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.mandatoryLessonsLearned).toBe(true);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.sequentialOnly).toBe(true);
  });

  it('should have chain config with sensible defaults', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.chain.requiresPriorLessons).toBe(true);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.chain.feedForwardEnforced).toBe(true);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.chain.patternPromotionThreshold).toBe(3);
  });

  it('should have scoring config with rubric and minimum', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.scoring.rubric.length).toBeGreaterThan(0);
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.scoring.minimumScore).toBeGreaterThan(0);
  });

  it('should have all required fields', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG).toHaveProperty('type');
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG).toHaveProperty('pacing');
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG).toHaveProperty('chain');
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG).toHaveProperty('scoring');
  });
});

describe('Core types barrel re-exports', () => {
  it('should re-export PacingConfig from core types barrel', async () => {
    const coreTypes = await import('../../../src/core/types/index.js');
    expect(coreTypes.DEFAULT_PACING_CONFIG).toBeDefined();
    expect(coreTypes.DEFAULT_PACING_CONFIG.maxSubversionsPerSession).toBe(5);
  });

  it('should re-export BatchDetectionConfig from core types barrel', async () => {
    const coreTypes = await import('../../../src/core/types/index.js');
    expect(coreTypes.DEFAULT_BATCH_DETECTION_CONFIG).toBeDefined();
    expect(coreTypes.DEFAULT_BATCH_DETECTION_CONFIG.timestampClusteringWindowSeconds).toBe(60);
  });
});
