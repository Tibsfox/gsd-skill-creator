/**
 * @file Review milestone gate evaluation tests
 * @description Behavioral tests for evaluateReviewGates: retrospective gate,
 *              lessons-learned gate, pacing integration, batch detection
 *              integration, chain validation integration, and overall status.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateReviewGates,
} from '../../../src/tools/commands/review-milestone/review-gates.js';
import type {
  ReviewGateResult,
  ReviewGateEvaluation,
} from '../../../src/tools/commands/review-milestone/review-gates.js';
import { createReviewMilestoneState } from '../../../src/tools/commands/review-milestone/review-lifecycle.js';
import type { PacingResult } from '../../../src/core/validation/pacing-gate/index.js';
import type { BatchDetectionResult, BatchHeuristicResult } from '../../../src/core/validation/batch-detection/index.js';
import type { ChainValidationResult } from '../../../src/tools/commands/lessons-chain/index.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeHeuristicResult(overrides?: Partial<BatchHeuristicResult>): BatchHeuristicResult {
  return {
    detected: false,
    severity: 'info',
    details: 'No detection',
    artifacts: [],
    ...overrides,
  };
}

function makeBatchResult(overrides?: Partial<BatchDetectionResult>): BatchDetectionResult {
  return {
    timestampClustering: makeHeuristicResult(),
    sessionCompression: makeHeuristicResult(),
    contentDepth: makeHeuristicResult(),
    templateSimilarity: makeHeuristicResult(),
    overallStatus: 'pass',
    advisories: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makePacingResult(overrides?: Partial<PacingResult>): PacingResult {
  return {
    status: 'pass',
    sessionId: 'test-session',
    subversionsCompleted: 1,
    budgetMax: 5,
    contextWindowsUsed: 3,
    depthMinimum: 2,
    advisories: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeChainResult(overrides?: Partial<ChainValidationResult>): ChainValidationResult {
  return {
    chainIntegrity: {
      valid: true,
      status: 'intact',
      priorLessonsLoaded: true,
      priorLessonsPath: '/test/prior.md',
      missingFields: [],
      forwardReferenceFound: true,
      forwardReferencePath: '/test/forward.md',
      errors: [],
      timestamp: new Date().toISOString(),
    },
    catalog: {
      entries: [],
      milestoneRange: { from: 'v1.0', to: 'v1.5' },
      promotedPatterns: [],
      timestamp: new Date().toISOString(),
    },
    overallStatus: 'intact',
    errors: [],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Retrospective gate
// ============================================================================

describe('evaluateReviewGates - retrospective gate', () => {
  it('should pass when retrospectiveExists is true', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    const retroGate = result.gates.find((g) => g.gate === 'retrospective');
    expect(retroGate).toBeDefined();
    expect(retroGate!.status).toBe('pass');
    expect(retroGate!.advisories).toHaveLength(0);
  });

  it('should fail when retrospectiveExists is false', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: false,
      lessonsLearnedExists: true,
    });
    const retroGate = result.gates.find((g) => g.gate === 'retrospective');
    expect(retroGate).toBeDefined();
    expect(retroGate!.status).toBe('fail');
    expect(retroGate!.advisories[0]).toMatch(/[Rr]etrospective/);
  });

  it('should prevent canTransitionToClose when retrospective missing', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: false,
      lessonsLearnedExists: true,
    });
    expect(result.canTransitionToClose).toBe(false);
  });
});

// ============================================================================
// Lessons-learned gate
// ============================================================================

describe('evaluateReviewGates - lessons-learned gate', () => {
  it('should pass when lessonsLearnedExists is true', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    const lessonsGate = result.gates.find((g) => g.gate === 'lessons-learned');
    expect(lessonsGate).toBeDefined();
    expect(lessonsGate!.status).toBe('pass');
    expect(lessonsGate!.advisories).toHaveLength(0);
  });

  it('should fail when lessonsLearnedExists is false', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: false,
    });
    const lessonsGate = result.gates.find((g) => g.gate === 'lessons-learned');
    expect(lessonsGate).toBeDefined();
    expect(lessonsGate!.status).toBe('fail');
    expect(lessonsGate!.advisories[0]).toMatch(/[Ll]essons/);
  });

  it('should prevent canTransitionToClose when lessons-learned missing', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: false,
    });
    expect(result.canTransitionToClose).toBe(false);
  });
});

// ============================================================================
// Pacing gate integration
// ============================================================================

describe('evaluateReviewGates - pacing gate', () => {
  it('should pass when all PacingResults pass', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      pacingResults: [makePacingResult({ status: 'pass' })],
    });
    const pacingGate = result.gates.find((g) => g.gate === 'pacing');
    expect(pacingGate).toBeDefined();
    expect(pacingGate!.status).toBe('pass');
  });

  it('should warn when any PacingResult has warn status', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      pacingResults: [
        makePacingResult({ status: 'pass' }),
        makePacingResult({ status: 'warn', advisories: ['Exceeded budget'] }),
      ],
    });
    const pacingGate = result.gates.find((g) => g.gate === 'pacing');
    expect(pacingGate).toBeDefined();
    expect(pacingGate!.status).toBe('warn');
    expect(pacingGate!.advisories).toContain('Exceeded budget');
  });

  it('should pass when no pacingResults provided (skipped gracefully)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    const pacingGate = result.gates.find((g) => g.gate === 'pacing');
    expect(pacingGate).toBeDefined();
    expect(pacingGate!.status).toBe('pass');
  });
});

// ============================================================================
// Batch detection gate integration
// ============================================================================

describe('evaluateReviewGates - batch detection gate', () => {
  it('should pass when overallStatus is pass', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      batchDetectionResult: makeBatchResult({ overallStatus: 'pass' }),
    });
    const batchGate = result.gates.find((g) => g.gate === 'batch-detection');
    expect(batchGate).toBeDefined();
    expect(batchGate!.status).toBe('pass');
  });

  it('should warn when overallStatus is warn', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      batchDetectionResult: makeBatchResult({
        overallStatus: 'warn',
        advisories: ['Clustering detected'],
      }),
    });
    const batchGate = result.gates.find((g) => g.gate === 'batch-detection');
    expect(batchGate).toBeDefined();
    expect(batchGate!.status).toBe('warn');
    expect(batchGate!.advisories).toContain('Clustering detected');
  });

  it('should warn (not fail) when overallStatus is critical (advisory-first)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      batchDetectionResult: makeBatchResult({
        overallStatus: 'critical',
        advisories: ['Critical batch production'],
      }),
    });
    const batchGate = result.gates.find((g) => g.gate === 'batch-detection');
    expect(batchGate).toBeDefined();
    expect(batchGate!.status).toBe('warn');
  });

  it('should pass when no batchDetectionResult provided (skipped gracefully)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    const batchGate = result.gates.find((g) => g.gate === 'batch-detection');
    expect(batchGate).toBeDefined();
    expect(batchGate!.status).toBe('pass');
  });
});

// ============================================================================
// Chain validation gate integration
// ============================================================================

describe('evaluateReviewGates - chain validation gate', () => {
  it('should pass when overallStatus is intact', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      chainValidationResult: makeChainResult({ overallStatus: 'intact' }),
    });
    const chainGate = result.gates.find((g) => g.gate === 'chain');
    expect(chainGate).toBeDefined();
    expect(chainGate!.status).toBe('pass');
  });

  it('should warn when overallStatus is broken', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      chainValidationResult: makeChainResult({
        overallStatus: 'broken',
        errors: ['Missing prior lessons'],
      }),
    });
    const chainGate = result.gates.find((g) => g.gate === 'chain');
    expect(chainGate).toBeDefined();
    expect(chainGate!.status).toBe('warn');
    expect(chainGate!.advisories).toContain('Missing prior lessons');
  });

  it('should warn when overallStatus is incomplete', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      chainValidationResult: makeChainResult({
        overallStatus: 'incomplete',
        errors: ['Forward reference missing'],
      }),
    });
    const chainGate = result.gates.find((g) => g.gate === 'chain');
    expect(chainGate).toBeDefined();
    expect(chainGate!.status).toBe('warn');
  });

  it('should pass when no chainValidationResult provided (skipped gracefully)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    const chainGate = result.gates.find((g) => g.gate === 'chain');
    expect(chainGate).toBeDefined();
    expect(chainGate!.status).toBe('pass');
  });
});

// ============================================================================
// Overall evaluation
// ============================================================================

describe('evaluateReviewGates - overall evaluation', () => {
  it('should return overallStatus pass when all gates pass', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    expect(result.overallStatus).toBe('pass');
    expect(result.canTransitionToClose).toBe(true);
  });

  it('should return overallStatus fail when any gate fails', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: false,
      lessonsLearnedExists: true,
    });
    expect(result.overallStatus).toBe('fail');
    expect(result.canTransitionToClose).toBe(false);
  });

  it('should return overallStatus warn when any gate warns (no fails)', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      batchDetectionResult: makeBatchResult({ overallStatus: 'warn', advisories: ['warn'] }),
    });
    expect(result.overallStatus).toBe('warn');
    expect(result.canTransitionToClose).toBe(true);
  });

  it('should have two fail gates when both retro and lessons missing', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: false,
      lessonsLearnedExists: false,
    });
    const failGates = result.gates.filter((g) => g.status === 'fail');
    expect(failGates).toHaveLength(2);
    expect(result.canTransitionToClose).toBe(false);
  });

  it('should return pass with all present and clean pacing/batch/chain', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
      pacingResults: [makePacingResult()],
      batchDetectionResult: makeBatchResult(),
      chainValidationResult: makeChainResult(),
    });
    expect(result.overallStatus).toBe('pass');
    expect(result.canTransitionToClose).toBe(true);
  });

  it('should include milestoneId in the evaluation', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    expect(result.milestoneId).toBe('v1.50.14');
  });

  it('should include currentState from the state', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    expect(result.currentState).toBe('LOAD');
  });

  it('should include timestamp in evaluation', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: true,
      lessonsLearnedExists: true,
    });
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should aggregate advisories from non-pass gates', () => {
    const state = createReviewMilestoneState('v1.50.14');
    const result = evaluateReviewGates({
      state,
      retrospectiveExists: false,
      lessonsLearnedExists: true,
      batchDetectionResult: makeBatchResult({ overallStatus: 'warn', advisories: ['Batch warn'] }),
    });
    expect(result.advisories.length).toBeGreaterThanOrEqual(2);
  });
});
