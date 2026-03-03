/**
 * v1.50.13 Hindsight Corrections — RC-to-Code Traceability Integration Tests
 *
 * Verifies that every root cause (RC-1 through RC-6) from the v1.50a post-mortem
 * traces to specific, tested enforcement code modules. Each describe block maps
 * one root cause to the code that addresses it, imports via barrel exports, and
 * proves the enforcement functions exist and run correctly.
 *
 * INTEG-02: Each root cause (RC-1 through RC-6) traces to specific tested code module.
 *
 * @module integration/hindsight-corrections
 */

import { describe, it, expect } from 'vitest';

// Import all enforcement modules via barrel exports
import {
  checkSessionBudget,
  checkContextDepth,
  formatPacingReport,
  DEFAULT_PACING_CONFIG,
} from '../../src/core/validation/pacing-gate/index.js';
import type { PacingConfig, PacingResult } from '../../src/core/validation/pacing-gate/index.js';

import {
  detectTimestampClustering,
  detectSessionCompression,
  checkContentDepth,
  detectTemplateSimilarity,
  runBatchDetection,
  formatBatchReport,
  DEFAULT_BATCH_DETECTION_CONFIG,
} from '../../src/core/validation/batch-detection/index.js';

import {
  validateChainIntegrity,
  validateForwardReference,
  buildLessonsCatalog,
  flagRecurringPatterns,
  runChainValidation,
  formatChainReport,
  DEFAULT_CHAIN_CONFIG,
} from '../../src/tools/commands/lessons-chain/index.js';

import {
  createReviewMilestoneState,
  transitionReviewMilestone,
  enforceSequentialExecution,
  isValidReviewTransition,
  VALID_REVIEW_TRANSITIONS,
  evaluateReviewGates,
  DEFAULT_REVIEW_MILESTONE_CONFIG,
} from '../../src/tools/commands/review-milestone/index.js';
import type { ReviewMilestoneConfig } from '../../src/tools/commands/review-milestone/index.js';

// ============================================================================
// RC-1: 100 milestones compressed to 1
// Code: review-milestone/review-lifecycle.ts, review-config.ts
// ============================================================================

describe('RC-1: 100→1 compression → review-milestone', () => {
  it('exports createReviewMilestoneState from review-milestone', () => {
    expect(typeof createReviewMilestoneState).toBe('function');
  });

  it('exports DEFAULT_REVIEW_MILESTONE_CONFIG with type "review"', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG).toBeDefined();
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.type).toBe('review');
  });

  it('enforces sequential-only execution by default', () => {
    expect(DEFAULT_REVIEW_MILESTONE_CONFIG.pacing.sequentialOnly).toBe(true);
  });

  it('creates individual milestone state objects with LOAD initial state', () => {
    const state = createReviewMilestoneState('v1.50.14');
    expect(state.milestoneId).toBe('v1.50.14');
    expect(state.currentState).toBe('LOAD');
    expect(state.transitions).toEqual([]);
  });

  it('enforces lifecycle progression LOAD→REVIEW→REFLECT→CLOSE', () => {
    let state = createReviewMilestoneState('v1.50.14');
    expect(state.currentState).toBe('LOAD');

    state = transitionReviewMilestone(state, 'REVIEW', 'context loaded');
    expect(state.currentState).toBe('REVIEW');

    state = transitionReviewMilestone(state, 'REFLECT', 'review complete');
    expect(state.currentState).toBe('REFLECT');

    state = transitionReviewMilestone(state, 'CLOSE', 'reflection done');
    expect(state.currentState).toBe('CLOSE');
  });
});

// ============================================================================
// RC-2: No enforcement code existed
// Code: pacing-gate/pacing-checks.ts, lessons-chain/chain-runner.ts
// ============================================================================

describe('RC-2: No enforcement code → pacing-gate + lessons-chain', () => {
  it('exports checkSessionBudget from pacing-gate', () => {
    expect(typeof checkSessionBudget).toBe('function');
  });

  it('exports checkContextDepth from pacing-gate', () => {
    expect(typeof checkContextDepth).toBe('function');
  });

  it('exports runChainValidation from lessons-chain', () => {
    expect(typeof runChainValidation).toBe('function');
  });

  it('checkSessionBudget returns structured PacingResult', () => {
    const result = checkSessionBudget(DEFAULT_PACING_CONFIG, 'session-1', 3);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('sessionId', 'session-1');
    expect(result).toHaveProperty('subversionsCompleted', 3);
    expect(result).toHaveProperty('advisories');
    expect(result).toHaveProperty('timestamp');
  });

  it('checkContextDepth returns structured PacingResult', () => {
    const result = checkContextDepth(DEFAULT_PACING_CONFIG, 'session-1', 'sub-1', 3);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('contextWindowsUsed', 3);
    expect(result).toHaveProperty('advisories');
  });
});

// ============================================================================
// RC-3: Draft artifacts enabled shortcuts
// Code: batch-detection/batch-runner.ts, batch-heuristics.ts
// ============================================================================

describe('RC-3: Draft artifacts → batch-detection', () => {
  it('exports runBatchDetection from batch-detection', () => {
    expect(typeof runBatchDetection).toBe('function');
  });

  it('exports detectTimestampClustering from batch-detection', () => {
    expect(typeof detectTimestampClustering).toBe('function');
  });

  it('exports checkContentDepth from batch-detection', () => {
    expect(typeof checkContentDepth).toBe('function');
  });

  it('exports detectTemplateSimilarity from batch-detection', () => {
    expect(typeof detectTemplateSimilarity).toBe('function');
  });

  it('exports detectSessionCompression from batch-detection', () => {
    expect(typeof detectSessionCompression).toBe('function');
  });

  it('runBatchDetection returns structured result with all heuristics', () => {
    const result = runBatchDetection({
      config: DEFAULT_BATCH_DETECTION_CONFIG,
      artifacts: [],
      completedSubversions: 0,
      sessionBudget: 5,
      artifactContents: [],
      templateContent: '',
    });
    expect(result).toHaveProperty('overallStatus');
    expect(result).toHaveProperty('timestampClustering');
    expect(result).toHaveProperty('sessionCompression');
    expect(result).toHaveProperty('contentDepth');
    expect(result).toHaveProperty('templateSimilarity');
  });
});

// ============================================================================
// RC-4: GSD optimizes for throughput
// Code: review-milestone/review-lifecycle.ts (sequential-only enforcement)
// ============================================================================

describe('RC-4: Throughput optimization → review-lifecycle', () => {
  it('exports enforceSequentialExecution from review-milestone', () => {
    expect(typeof enforceSequentialExecution).toBe('function');
  });

  it('review config enforces sequentialOnly by default', () => {
    const config: ReviewMilestoneConfig = DEFAULT_REVIEW_MILESTONE_CONFIG;
    expect(config.pacing.sequentialOnly).toBe(true);
  });

  it('enforceSequentialExecution rejects wave parallelism with multiple waves', () => {
    const result = enforceSequentialExecution(DEFAULT_REVIEW_MILESTONE_CONFIG, 3);
    expect(result).toHaveProperty('allowed');
    // sequential-only means parallelism with >1 wave is NOT allowed
    expect(result.allowed).toBe(false);
  });

  it('enforceSequentialExecution allows single-wave execution', () => {
    const result = enforceSequentialExecution(DEFAULT_REVIEW_MILESTONE_CONFIG, 1);
    expect(result.allowed).toBe(true);
  });

  it('review lifecycle prevents state skipping (LOAD cannot jump to CLOSE)', () => {
    expect(isValidReviewTransition('LOAD', 'CLOSE')).toBe(false);
    expect(isValidReviewTransition('LOAD', 'REFLECT')).toBe(false);
    expect(isValidReviewTransition('REVIEW', 'CLOSE')).toBe(false);
  });

  it('VALID_REVIEW_TRANSITIONS defines all 4 lifecycle states', () => {
    const states = Object.keys(VALID_REVIEW_TRANSITIONS);
    expect(states).toHaveLength(4);
    expect(states).toContain('LOAD');
    expect(states).toContain('REVIEW');
    expect(states).toContain('REFLECT');
    expect(states).toContain('CLOSE');
  });
});

// ============================================================================
// RC-5: No pacing gates existed
// Code: pacing-gate/pacing-checks.ts, pacing-report.ts
// ============================================================================

describe('RC-5: No pacing gates → pacing-gate', () => {
  it('exports formatPacingReport from pacing-gate', () => {
    expect(typeof formatPacingReport).toBe('function');
  });

  it('checkSessionBudget returns warn when over budget', () => {
    const result = checkSessionBudget(DEFAULT_PACING_CONFIG, 'session-1', 10);
    expect(result.status).toBe('warn');
    expect(result.advisories.length).toBeGreaterThan(0);
  });

  it('checkSessionBudget returns pass when within budget', () => {
    const result = checkSessionBudget(DEFAULT_PACING_CONFIG, 'session-1', 3);
    expect(result.status).toBe('pass');
  });

  it('checkContextDepth returns warn when below minimum', () => {
    const result = checkContextDepth(DEFAULT_PACING_CONFIG, 'session-1', 'sub-1', 1);
    expect(result.status).toBe('warn');
    expect(result.advisories.length).toBeGreaterThan(0);
  });

  it('formatPacingReport produces human-readable string', () => {
    const results: PacingResult[] = [
      checkSessionBudget(DEFAULT_PACING_CONFIG, 'session-1', 3),
    ];
    const report = formatPacingReport(results);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// RC-6: Retro feedback loop never started
// Code: lessons-chain/chain-runner.ts, chain-report.ts, review-milestone/review-gates.ts
// ============================================================================

describe('RC-6: Retro feedback loop → lessons-chain + review-gates', () => {
  it('exports evaluateReviewGates from review-milestone', () => {
    expect(typeof evaluateReviewGates).toBe('function');
  });

  it('exports formatChainReport from lessons-chain', () => {
    expect(typeof formatChainReport).toBe('function');
  });

  it('exports validateChainIntegrity from lessons-chain', () => {
    expect(typeof validateChainIntegrity).toBe('function');
  });

  it('exports validateForwardReference from lessons-chain', () => {
    expect(typeof validateForwardReference).toBe('function');
  });

  it('exports buildLessonsCatalog from lessons-chain', () => {
    expect(typeof buildLessonsCatalog).toBe('function');
  });

  it('exports flagRecurringPatterns from lessons-chain', () => {
    expect(typeof flagRecurringPatterns).toBe('function');
  });

  it('review gates fail without retrospective document', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const reflectState = transitionReviewMilestone(
      transitionReviewMilestone(state, 'REVIEW', 'loaded'),
      'REFLECT',
      'reviewed',
    );

    const evaluation = evaluateReviewGates({
      state: reflectState,
      retrospectiveExists: false,
      lessonsLearnedExists: true,
    });

    const retroGate = evaluation.gates.find(g => g.gate === 'retrospective');
    expect(retroGate).toBeDefined();
    expect(retroGate!.status).toBe('fail');
    expect(evaluation.canTransitionToClose).toBe(false);
  });

  it('review gates fail without lessons-learned document', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const reflectState = transitionReviewMilestone(
      transitionReviewMilestone(state, 'REVIEW', 'loaded'),
      'REFLECT',
      'reviewed',
    );

    const evaluation = evaluateReviewGates({
      state: reflectState,
      retrospectiveExists: true,
      lessonsLearnedExists: false,
    });

    const lessonsGate = evaluation.gates.find(g => g.gate === 'lessons-learned');
    expect(lessonsGate).toBeDefined();
    expect(lessonsGate!.status).toBe('fail');
    expect(evaluation.canTransitionToClose).toBe(false);
  });

  it('review gates pass when both retrospective and lessons-learned exist', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const reflectState = transitionReviewMilestone(
      transitionReviewMilestone(state, 'REVIEW', 'loaded'),
      'REFLECT',
      'reviewed',
    );

    const evaluation = evaluateReviewGates({
      state: reflectState,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });

    const mandatoryGates = evaluation.gates.filter(
      g => g.gate === 'retrospective' || g.gate === 'lessons-learned',
    );
    mandatoryGates.forEach(g => expect(g.status).toBe('pass'));
    expect(evaluation.canTransitionToClose).toBe(true);
  });
});
