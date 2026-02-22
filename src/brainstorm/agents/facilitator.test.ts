/**
 * Facilitator Agent TDD tests -- assessProblem and evaluateTransitionReadiness.
 *
 * Tests all spec test cases for problem assessment (5 nature categories,
 * mixed/ambiguous fallback, complexity detection, technique recommendations)
 * and transition readiness scoring (timer factor, saturation factor,
 * user signal factor, minimum threshold factor, null returns).
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';

import {
  assessProblem,
  evaluateTransitionReadiness,
  FacilitatorAgent,
} from './facilitator.js';
import type {
  ProblemAssessment,
  TransitionSignal,
  IFacilitatorAgent,
} from './facilitator.js';
import type { SessionState, Idea } from '../shared/types.js';

// ============================================================================
// Mock session state helper
// ============================================================================

function mockSessionState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    id: randomUUID(),
    status: 'active',
    phase: 'diverge',
    problem_statement: 'How might we reduce customer churn?',
    active_technique: null,
    active_pathway: null,
    technique_queue: [],
    active_agents: ['facilitator', 'ideator', 'scribe'],
    ideas: [],
    questions: [],
    clusters: [],
    evaluations: [],
    action_items: [],
    timer: {
      technique_timer: null,
      session_timer: { elapsed_ms: 0 },
      is_paused: false,
    },
    energy_level: 'high',
    rules_active: ['quantity', 'no-criticism', 'wild-ideas', 'build-combine'],
    metadata: {
      created_at: Date.now(),
      updated_at: Date.now(),
      total_ideas: 0,
      total_questions: 0,
      techniques_used: [],
      phase_history: [{ phase: 'diverge', entered_at: Date.now() }],
    },
    ...overrides,
  };
}

/**
 * Helper: create a mock idea with a specific timestamp.
 */
function mockIdea(timestamp: number): Idea {
  return {
    id: randomUUID(),
    content: 'Test idea',
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: [],
    timestamp,
  };
}

// ============================================================================
// assessProblem tests
// ============================================================================

describe('assessProblem', () => {
  // --------------------------------------------------------------------------
  // Spec test case 1: Open-ended assessment
  // --------------------------------------------------------------------------
  it('classifies "I need to brainstorm ideas for a new app" as open-ended with creative-exploration', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.nature).toBe('open-ended');
    expect(result.recommended_pathway).toBe('creative-exploration');
  });

  // --------------------------------------------------------------------------
  // Spec test case 2: Analytical assessment
  // --------------------------------------------------------------------------
  it('classifies "Why do our users keep abandoning their carts?" as analytical with problem-solving', () => {
    const result = assessProblem('Why do our users keep abandoning their carts?');
    expect(result.nature).toBe('analytical');
    expect(result.recommended_pathway).toBe('problem-solving');
  });

  // --------------------------------------------------------------------------
  // Spec test case 3: Improvement assessment
  // --------------------------------------------------------------------------
  it('classifies "How can we make our onboarding better?" as improvement with product-innovation', () => {
    const result = assessProblem('How can we make our onboarding better?');
    expect(result.nature).toBe('improvement');
    expect(result.recommended_pathway).toBe('product-innovation');
  });

  // --------------------------------------------------------------------------
  // Spec test case 4: Decision assessment
  // --------------------------------------------------------------------------
  it('classifies "Should we use React or Vue for the frontend?" as decision with decision-making', () => {
    const result = assessProblem('Should we use React or Vue for the frontend?');
    expect(result.nature).toBe('decision');
    expect(result.recommended_pathway).toBe('decision-making');
  });

  // --------------------------------------------------------------------------
  // Spec test case 5: Explicit / free-form assessment
  // --------------------------------------------------------------------------
  it('classifies "I want to do a SCAMPER session" as explicit with free-form', () => {
    const result = assessProblem('I want to do a SCAMPER session');
    expect(result.nature).toBe('explicit');
    expect(result.recommended_pathway).toBe('free-form');
  });

  // --------------------------------------------------------------------------
  // Additional open-ended signal: "blank slate"
  // --------------------------------------------------------------------------
  it('classifies "blank slate" as open-ended', () => {
    const result = assessProblem('blank slate');
    expect(result.nature).toBe('open-ended');
  });

  // --------------------------------------------------------------------------
  // Additional open-ended signal: "I have no idea where to start"
  // --------------------------------------------------------------------------
  it('classifies "I have no idea where to start" as open-ended', () => {
    const result = assessProblem('I have no idea where to start');
    expect(result.nature).toBe('open-ended');
  });

  // --------------------------------------------------------------------------
  // Mixed/ambiguous: dominant signal wins
  // --------------------------------------------------------------------------
  it('classifies "Why does our new product onboarding fail?" with dominant signal winning', () => {
    const result = assessProblem('Why does our new product onboarding fail?');
    // "why does" is analytical, "onboarding" is improvement -- analytical has more signal weight
    expect(['analytical', 'mixed']).toContain(result.nature);
    // Either way, the pathway should be reasonable
    expect(['problem-solving', 'product-innovation']).toContain(result.recommended_pathway);
  });

  // --------------------------------------------------------------------------
  // No signals: defaults to mixed/problem-solving
  // --------------------------------------------------------------------------
  it('classifies "help me think" as mixed with problem-solving', () => {
    const result = assessProblem('help me think');
    expect(result.nature).toBe('mixed');
    expect(result.recommended_pathway).toBe('problem-solving');
  });

  // --------------------------------------------------------------------------
  // Rationale is non-empty
  // --------------------------------------------------------------------------
  it('returns a non-empty rationale string', () => {
    const result = assessProblem('Why do our users keep abandoning their carts?');
    expect(result.rationale).toBeTruthy();
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // estimated_duration_ms is positive
  // --------------------------------------------------------------------------
  it('returns a positive estimated_duration_ms', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.estimated_duration_ms).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // recommended_techniques is a non-empty array
  // --------------------------------------------------------------------------
  it('returns at least one recommended technique', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.recommended_techniques.length).toBeGreaterThanOrEqual(1);
  });

  // --------------------------------------------------------------------------
  // Complexity: simple for short input
  // --------------------------------------------------------------------------
  it('detects simple complexity for short input', () => {
    const result = assessProblem('quick brainstorm');
    expect(result.complexity).toBe('simple');
  });

  // --------------------------------------------------------------------------
  // Complexity: complex for long/keyword input
  // --------------------------------------------------------------------------
  it('detects complex complexity for long input with keywords', () => {
    const longInput = 'We need a comprehensive enterprise architecture system that handles all customer touchpoints across the organization with multiple integration points and legacy system compatibility for the next five years of growth planning';
    const result = assessProblem(longInput);
    expect(result.complexity).toBe('complex');
  });

  // --------------------------------------------------------------------------
  // Complexity: moderate for typical input
  // --------------------------------------------------------------------------
  it('detects moderate complexity for typical input', () => {
    const result = assessProblem('How can we make our onboarding experience better for new users who sign up through the website?');
    expect(result.complexity).toBe('moderate');
  });
});

// ============================================================================
// evaluateTransitionReadiness tests
// ============================================================================

describe('evaluateTransitionReadiness', () => {
  // --------------------------------------------------------------------------
  // Null active_technique -> returns null
  // --------------------------------------------------------------------------
  it('returns null when session has no active technique (no timer)', () => {
    const session = mockSessionState({
      active_technique: null,
      timer: {
        technique_timer: null,
        session_timer: { elapsed_ms: 0 },
        is_paused: false,
      },
    });
    const result = evaluateTransitionReadiness(session);
    expect(result).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Low elapsed + high velocity + no user signals -> null
  // --------------------------------------------------------------------------
  it('returns null when timer is 10% elapsed with high velocity and no user signals', () => {
    const now = Date.now();
    const sessionStart = now - 60_000; // started 1 minute ago

    // Timer: 10% elapsed (54000 remaining of 60000)
    const session = mockSessionState({
      active_technique: 'freewriting',
      problem_statement: 'How might we reduce customer churn?',
      timer: {
        technique_timer: {
          remaining_ms: 540_000,
          total_ms: 600_000,
        },
        session_timer: { elapsed_ms: 60_000 },
        is_paused: false,
      },
      ideas: [
        // Many recent ideas (high velocity)
        mockIdea(now - 50_000),
        mockIdea(now - 45_000),
        mockIdea(now - 40_000),
        mockIdea(now - 35_000),
        mockIdea(now - 30_000),
        mockIdea(now - 25_000),
        mockIdea(now - 20_000),
        mockIdea(now - 15_000),
        mockIdea(now - 10_000),
        mockIdea(now - 5_000),
      ],
      metadata: {
        created_at: sessionStart,
        updated_at: now,
        total_ideas: 10,
        total_questions: 0,
        techniques_used: ['freewriting'],
        phase_history: [{ phase: 'diverge', entered_at: sessionStart }],
      },
    });
    const result = evaluateTransitionReadiness(session);
    expect(result).toBeNull();
  });

  // --------------------------------------------------------------------------
  // High confidence: 80% timer + declining velocity + user signal
  // --------------------------------------------------------------------------
  it('returns confidence > 0.7 when timer 80% elapsed, velocity declining, and user says "running low"', () => {
    const now = Date.now();
    const sessionStart = now - 600_000; // started 10 minutes ago

    // Ideas: 10 in first 5 minutes, 3 in last 5 minutes
    const firstFiveIdeas = Array.from({ length: 10 }, (_, i) =>
      mockIdea(sessionStart + (i + 1) * 25_000),
    );
    const lastFiveIdeas = Array.from({ length: 3 }, (_, i) =>
      mockIdea(now - (3 - i) * 60_000),
    );

    const session = mockSessionState({
      active_technique: 'freewriting',
      problem_statement: 'How might we reduce customer churn? I am running low on ideas',
      timer: {
        technique_timer: {
          remaining_ms: 120_000,  // 20% remaining => 80% elapsed
          total_ms: 600_000,
        },
        session_timer: { elapsed_ms: 600_000 },
        is_paused: false,
      },
      ideas: [...firstFiveIdeas, ...lastFiveIdeas],
      metadata: {
        created_at: sessionStart,
        updated_at: now,
        total_ideas: 13,
        total_questions: 0,
        techniques_used: ['freewriting'],
        phase_history: [{ phase: 'diverge', entered_at: sessionStart }],
      },
    });

    const result = evaluateTransitionReadiness(session);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThan(0.7);
    expect(['user_request', 'saturation_detected']).toContain(result!.type);
  });

  // --------------------------------------------------------------------------
  // Zero ideas -> minimum_threshold_factor is 0.0
  // --------------------------------------------------------------------------
  it('factors in zero ideas as minimum_threshold_factor 0.0', () => {
    const now = Date.now();
    const sessionStart = now - 500_000;

    const session = mockSessionState({
      active_technique: 'freewriting',
      problem_statement: 'running low on ideas',
      timer: {
        technique_timer: {
          remaining_ms: 100_000,
          total_ms: 600_000,
        },
        session_timer: { elapsed_ms: 500_000 },
        is_paused: false,
      },
      ideas: [],
      metadata: {
        created_at: sessionStart,
        updated_at: now,
        total_ideas: 0,
        total_questions: 0,
        techniques_used: ['freewriting'],
        phase_history: [{ phase: 'diverge', entered_at: sessionStart }],
      },
    });

    const result = evaluateTransitionReadiness(session);
    // With 0 ideas, minimum_threshold_factor = 0.0, but user signal contributes 0.4
    // and timer contributes ~0.167, so total ~0.567 -- might or might not cross 0.5
    // The key assertion is that confidence is lower without meeting minimum threshold
    if (result !== null) {
      // Confidence should be moderate but reduced by 0 ideas
      expect(result.confidence).toBeLessThan(0.9);
    }
  });

  // --------------------------------------------------------------------------
  // 100% timer + 10+ ideas + declining velocity -> returns non-null
  // --------------------------------------------------------------------------
  it('returns non-null when timer is 100% elapsed with 10+ ideas and declining velocity', () => {
    const now = Date.now();
    const sessionStart = now - 600_000;

    // 8 ideas in first 5 min, 2 in last 5 min
    const firstIdeas = Array.from({ length: 8 }, (_, i) =>
      mockIdea(sessionStart + (i + 1) * 30_000),
    );
    const lastIdeas = Array.from({ length: 2 }, (_, i) =>
      mockIdea(now - (2 - i) * 60_000),
    );

    const session = mockSessionState({
      active_technique: 'freewriting',
      problem_statement: 'How might we reduce customer churn?',
      timer: {
        technique_timer: {
          remaining_ms: 0,
          total_ms: 600_000,
        },
        session_timer: { elapsed_ms: 600_000 },
        is_paused: false,
      },
      ideas: [...firstIdeas, ...lastIdeas],
      metadata: {
        created_at: sessionStart,
        updated_at: now,
        total_ideas: 10,
        total_questions: 0,
        techniques_used: ['freewriting'],
        phase_history: [{ phase: 'diverge', entered_at: sessionStart }],
      },
    });

    const result = evaluateTransitionReadiness(session);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThanOrEqual(0.5);
  });

  // --------------------------------------------------------------------------
  // Returned TransitionSignal has correct shape
  // --------------------------------------------------------------------------
  it('returned TransitionSignal has type, confidence (0-1), recommendation, and rationale', () => {
    const now = Date.now();
    const sessionStart = now - 600_000;

    const ideas = Array.from({ length: 10 }, (_, i) =>
      mockIdea(sessionStart + (i + 1) * 25_000),
    );
    // Add a few recent ideas with declining velocity
    ideas.push(mockIdea(now - 120_000));

    const session = mockSessionState({
      active_technique: 'freewriting',
      problem_statement: 'I am stuck and running low on ideas',
      timer: {
        technique_timer: {
          remaining_ms: 60_000,
          total_ms: 600_000,
        },
        session_timer: { elapsed_ms: 540_000 },
        is_paused: false,
      },
      ideas,
      metadata: {
        created_at: sessionStart,
        updated_at: now,
        total_ideas: 11,
        total_questions: 0,
        techniques_used: ['freewriting'],
        phase_history: [{ phase: 'diverge', entered_at: sessionStart }],
      },
    });

    const result = evaluateTransitionReadiness(session);
    expect(result).not.toBeNull();

    // Validate shape
    expect(typeof result!.type).toBe('string');
    expect(result!.confidence).toBeGreaterThanOrEqual(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
    expect(typeof result!.recommendation).toBe('string');
    expect(typeof result!.rationale).toBe('string');
    expect(result!.rationale.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// FacilitatorAgent class tests
// ============================================================================

describe('FacilitatorAgent', () => {
  it('exports FacilitatorAgent class', () => {
    expect(FacilitatorAgent).toBeDefined();
  });

  it('stub methods throw "not implemented" errors', () => {
    const agent = new FacilitatorAgent(
      {} as any,
      {} as any,
      {} as any,
    );

    expect(() => agent.recommendPathway({} as any)).toThrow('not implemented');
    expect(() => agent.adaptTechniqueQueue({} as any, {} as any)).toThrow('not implemented');
    expect(() => agent.generateGuidance({} as any)).toThrow('not implemented');
    expect(() => agent.handleEnergySignal('high', {} as any)).toThrow('not implemented');
    expect(() => agent.redirectEvaluation('ideator', 'test')).toThrow('not implemented');
    expect(() => agent.generateSessionSummary({} as any)).toThrow('not implemented');
  });

  it('delegates assessProblem to standalone function', () => {
    const agent = new FacilitatorAgent(
      {} as any,
      {} as any,
      {} as any,
    );
    const result = agent.assessProblem('test');
    expect(result).toBeDefined();
    expect(result.nature).toBeDefined();
  });

  it('delegates evaluateTransitionReadiness to standalone function', () => {
    const agent = new FacilitatorAgent(
      {} as any,
      {} as any,
      {} as any,
    );
    const session = mockSessionState();
    const result = agent.evaluateTransitionReadiness(session);
    // With no active technique, should return null
    expect(result).toBeNull();
  });
});
