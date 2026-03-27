/**
 * Facilitator Agent tests -- all 8 IFacilitatorAgent methods.
 *
 * Plan 309-01: assessProblem (15 tests), evaluateTransitionReadiness (6 tests)
 * Plan 309-02: generateGuidance (8 tests), handleEnergySignal (6 tests),
 *   redirectEvaluation (5 tests), recommendPathway (2 tests),
 *   adaptTechniqueQueue (2 tests), generateSessionSummary (6 tests),
 *   safety boundaries (2 tests), class delegation (4 tests)
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
  FacilitatorGuidance,
  IFacilitatorAgent,
} from './facilitator.js';
import type { SessionState, Idea, Cluster, TechniqueId } from '../shared/types.js';
import type { IPathwayRouter, AdaptationSignal } from '../pathways/router.js';

// ============================================================================
// Mock helpers
// ============================================================================

/**
 * Fixed UUID for deterministic test sessions.
 */
const FIXED_SESSION_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Create a minimal valid SessionState for testing.
 */
function mockSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    id: FIXED_SESSION_ID,
    status: 'active',
    phase: 'diverge',
    problem_statement: 'How might we reduce customer churn?',
    active_technique: null,
    active_pathway: 'problem-solving',
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
    energy_level: 'medium',
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
 * Backward-compatible alias for Plan 01 tests.
 */
function mockSessionState(overrides: Partial<SessionState> = {}): SessionState {
  return mockSession(overrides);
}

/**
 * Helper: create a mock idea with a specific timestamp.
 */
function mockIdea(timestampOrOverrides?: number | Partial<Idea>): Idea {
  const base: Idea = {
    id: randomUUID(),
    content: 'Test idea',
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: [],
    timestamp: Date.now(),
  };
  if (typeof timestampOrOverrides === 'number') {
    return { ...base, timestamp: timestampOrOverrides };
  }
  return { ...base, ...timestampOrOverrides };
}

/**
 * Helper: create a mock cluster.
 */
function mockCluster(label: string, ideaCount: number): Cluster {
  return {
    id: randomUUID(),
    label,
    idea_ids: Array.from({ length: ideaCount }, () => randomUUID()),
  };
}

/**
 * Mock PathwayRouter that returns predictable values.
 */
function mockPathwayRouter(): IPathwayRouter {
  return {
    recommendPathway: () => 'problem-solving' as const,
    getPathway: () => ({
      id: 'problem-solving' as const,
      name: 'Problem Solving',
      description: 'For analytical problems',
      situation: 'When you need to solve a problem',
      technique_sequence: [],
      required_agents: ['facilitator' as const],
      recommended_for: [],
    }),
    getTechniqueQueue: () => ['question-brainstorming' as TechniqueId, 'five-whys' as TechniqueId],
    adaptTechniqueQueue: (queue: TechniqueId[]) => [...queue],
  };
}

/**
 * Create a FacilitatorAgent with mock dependencies for testing.
 */
function createTestAgent(routerOverrides?: Partial<IPathwayRouter>): FacilitatorAgent {
  const router = { ...mockPathwayRouter(), ...routerOverrides };
  return new FacilitatorAgent(
    {} as any, // ISessionManager (not used by the 6 methods under test)
    {} as any, // IPhaseController (not used by the 6 methods under test)
    router,
  );
}

/**
 * Pressure phrases that must NEVER appear in facilitator messages.
 */
const PRESSURE_PHRASES = [
  'you need to',
  'you must',
  'you should have',
  'not enough',
  'try harder',
  'more ideas',
];

/**
 * Assert a message contains no pressure language.
 */
function assertNoPressure(message: string): void {
  const lower = message.toLowerCase();
  for (const phrase of PRESSURE_PHRASES) {
    expect(lower).not.toContain(phrase);
  }
}

// ============================================================================
// assessProblem tests (Plan 309-01, preserved)
// ============================================================================

describe('assessProblem', () => {
  it('classifies "I need to brainstorm ideas for a new app" as open-ended with creative-exploration', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.nature).toBe('open-ended');
    expect(result.recommended_pathway).toBe('creative-exploration');
  });

  it('classifies "Why do our users keep abandoning their carts?" as analytical with problem-solving', () => {
    const result = assessProblem('Why do our users keep abandoning their carts?');
    expect(result.nature).toBe('analytical');
    expect(result.recommended_pathway).toBe('problem-solving');
  });

  it('classifies "How can we make our onboarding better?" as improvement with product-innovation', () => {
    const result = assessProblem('How can we make our onboarding better?');
    expect(result.nature).toBe('improvement');
    expect(result.recommended_pathway).toBe('product-innovation');
  });

  it('classifies "Should we use React or Vue for the frontend?" as decision with decision-making', () => {
    const result = assessProblem('Should we use React or Vue for the frontend?');
    expect(result.nature).toBe('decision');
    expect(result.recommended_pathway).toBe('decision-making');
  });

  it('classifies "I want to do a SCAMPER session" as explicit with free-form', () => {
    const result = assessProblem('I want to do a SCAMPER session');
    expect(result.nature).toBe('explicit');
    expect(result.recommended_pathway).toBe('free-form');
  });

  it('classifies "blank slate" as open-ended', () => {
    const result = assessProblem('blank slate');
    expect(result.nature).toBe('open-ended');
  });

  it('classifies "I have no idea where to start" as open-ended', () => {
    const result = assessProblem('I have no idea where to start');
    expect(result.nature).toBe('open-ended');
  });

  it('classifies "Why does our new product onboarding fail?" with dominant signal winning', () => {
    const result = assessProblem('Why does our new product onboarding fail?');
    expect(['analytical', 'mixed']).toContain(result.nature);
    expect(['problem-solving', 'product-innovation']).toContain(result.recommended_pathway);
  });

  it('classifies "help me think" as mixed with problem-solving', () => {
    const result = assessProblem('help me think');
    expect(result.nature).toBe('mixed');
    expect(result.recommended_pathway).toBe('problem-solving');
  });

  it('returns a non-empty rationale string', () => {
    const result = assessProblem('Why do our users keep abandoning their carts?');
    expect(result.rationale).toBeTruthy();
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it('returns a positive estimated_duration_ms', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.estimated_duration_ms).toBeGreaterThan(0);
  });

  it('returns at least one recommended technique', () => {
    const result = assessProblem('I need to brainstorm ideas for a new app');
    expect(result.recommended_techniques.length).toBeGreaterThanOrEqual(1);
  });

  it('detects simple complexity for short input', () => {
    const result = assessProblem('quick brainstorm');
    expect(result.complexity).toBe('simple');
  });

  it('detects complex complexity for long input with keywords', () => {
    const longInput = 'We need a comprehensive enterprise architecture system that handles all customer touchpoints across the organization with multiple integration points and legacy system compatibility for the next five years of growth planning';
    const result = assessProblem(longInput);
    expect(result.complexity).toBe('complex');
  });

  it('detects moderate complexity for typical input', () => {
    const result = assessProblem('How can we make our onboarding experience better for new users who sign up through the website?');
    expect(result.complexity).toBe('moderate');
  });
});

// ============================================================================
// evaluateTransitionReadiness tests (Plan 309-01, preserved)
// ============================================================================

describe('evaluateTransitionReadiness', () => {
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

  it('returns null when timer is 10% elapsed with high velocity and no user signals', () => {
    const now = Date.now();
    const sessionStart = now - 60_000;

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

  it('returns confidence > 0.7 when timer 80% elapsed, velocity declining, and user says "running low"', () => {
    const now = Date.now();
    const sessionStart = now - 600_000;

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
          remaining_ms: 120_000,
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
    if (result !== null) {
      expect(result.confidence).toBeLessThan(0.9);
    }
  });

  it('returns non-null when timer is 100% elapsed with 10+ ideas and declining velocity', () => {
    const now = Date.now();
    const sessionStart = now - 600_000;

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

  it('returned TransitionSignal has type, confidence (0-1), recommendation, and rationale', () => {
    const now = Date.now();
    const sessionStart = now - 600_000;

    const ideas = Array.from({ length: 10 }, (_, i) =>
      mockIdea(sessionStart + (i + 1) * 25_000),
    );
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

    expect(typeof result!.type).toBe('string');
    expect(result!.confidence).toBeGreaterThanOrEqual(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
    expect(typeof result!.recommendation).toBe('string');
    expect(typeof result!.rationale).toBe('string');
    expect(result!.rationale.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// FacilitatorAgent class tests (Plan 309-01 base + Plan 309-02 expansion)
// ============================================================================

describe('FacilitatorAgent', () => {
  it('exports FacilitatorAgent class', () => {
    expect(FacilitatorAgent).toBeDefined();
  });

  it('delegates assessProblem to standalone function', () => {
    const agent = createTestAgent();
    const result = agent.assessProblem('test');
    expect(result).toBeDefined();
    expect(result.nature).toBeDefined();
  });

  it('delegates evaluateTransitionReadiness to standalone function', () => {
    const agent = createTestAgent();
    const session = mockSession();
    const result = agent.evaluateTransitionReadiness(session);
    // With no active technique, should return null
    expect(result).toBeNull();
  });
});

// ============================================================================
// generateGuidance tests (Plan 309-02)
// ============================================================================

describe('generateGuidance', () => {
  const agent = createTestAgent();

  it('returns message containing "keep going" or "Great flow" for diverge/high energy', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'high' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message).toMatch(/keep going|Great flow/i);
  });

  it('returns next-pause urgency with suggest_technique_switch for diverge/low energy', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'low' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.urgency).toBe('next-pause');
    expect(guidance.internal_action).toBe('suggest_technique_switch');
  });

  it('returns next-pause urgency with suggest_phase_transition for diverge/flagging energy', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'flagging' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.urgency).toBe('next-pause');
    expect(guidance.internal_action).toBe('suggest_phase_transition');
  });

  it('returns a non-empty string for explore phase', () => {
    const session = mockSession({ phase: 'explore' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for act phase', () => {
    const session = mockSession({ phase: 'act' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message.length).toBeGreaterThan(0);
  });

  it('includes "Substitute" hint when active_technique is scamper', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'high', active_technique: 'scamper' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message).toContain('Substitute');
  });

  it('includes "why" or "root" hint when active_technique is five-whys', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'high', active_technique: 'five-whys' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message).toMatch(/why|root/i);
  });

  it('never contains pressure language in any phase/energy combination', () => {
    const phases = ['explore', 'diverge', 'organize', 'converge', 'act'] as const;
    const energies = ['high', 'medium', 'low', 'flagging'] as const;

    for (const phase of phases) {
      for (const energy of energies) {
        const session = mockSession({ phase, energy_level: energy });
        const guidance = agent.generateGuidance(session);
        assertNoPressure(guidance.message);
      }
    }
  });
});

// ============================================================================
// handleEnergySignal tests (Plan 309-02)
// ============================================================================

describe('handleEnergySignal', () => {
  const agent = createTestAgent();

  it('returns message containing "flow" or "keep going" for high energy', () => {
    const session = mockSession();
    const guidance = agent.handleEnergySignal('high', session);
    expect(guidance.message).toMatch(/flow|keep going/i);
  });

  it('returns non-empty message with advisory urgency for medium energy', () => {
    const session = mockSession();
    const guidance = agent.handleEnergySignal('medium', session);
    expect(guidance.message.length).toBeGreaterThan(0);
    expect(guidance.urgency).toBe('advisory');
  });

  it('returns next-pause urgency with suggest_technique_switch for low energy', () => {
    const session = mockSession();
    const guidance = agent.handleEnergySignal('low', session);
    expect(guidance.urgency).toBe('next-pause');
    expect(guidance.internal_action).toBe('suggest_technique_switch');
  });

  it('returns message containing idea count for flagging energy with 3 ideas', () => {
    const session = mockSession({
      ideas: [mockIdea(), mockIdea(), mockIdea()],
    });
    const guidance = agent.handleEnergySignal('flagging', session);
    expect(guidance.message).toContain('3');
    expect(guidance.urgency).toBe('next-pause');
  });

  it('does NOT contain "not enough" or "try harder" for flagging energy', () => {
    const session = mockSession();
    const guidance = agent.handleEnergySignal('flagging', session);
    expect(guidance.message.toLowerCase()).not.toContain('not enough');
    expect(guidance.message.toLowerCase()).not.toContain('try harder');
  });

  it('HUMANE FLOW: none of the 4 energy level messages contain pressure language', () => {
    const session = mockSession({ ideas: [mockIdea(), mockIdea()] });
    const levels = ['high', 'medium', 'low', 'flagging'] as const;

    for (const level of levels) {
      const guidance = agent.handleEnergySignal(level, session);
      assertNoPressure(guidance.message);
    }
  });
});

// ============================================================================
// redirectEvaluation tests (Plan 309-02)
// ============================================================================

describe('redirectEvaluation', () => {
  const agent = createTestAgent();

  it('returns advisory urgency', () => {
    const guidance = agent.redirectEvaluation('ideator', "this won't work");
    expect(guidance.urgency).toBe('advisory');
  });

  it('does NOT contain the agent name "ideator"', () => {
    const guidance = agent.redirectEvaluation('ideator', "this won't work");
    expect(guidance.message.toLowerCase()).not.toContain('ideator');
  });

  it("does NOT contain the quoted content 'won't work'", () => {
    const guidance = agent.redirectEvaluation('ideator', "this won't work");
    expect(guidance.message).not.toContain("won't work");
  });

  it('contains "Converge" or "save" or "later" in redirect message', () => {
    const guidance = agent.redirectEvaluation('ideator', 'bad idea');
    expect(guidance.message).toMatch(/Converge|save|later/i);
  });

  it('redirect message contains no pressure language', () => {
    const guidance = agent.redirectEvaluation('ideator', 'bad idea');
    assertNoPressure(guidance.message);
  });
});

// ============================================================================
// recommendPathway tests (Plan 309-02)
// ============================================================================

describe('recommendPathway', () => {
  const agent = createTestAgent();

  it('returns creative-exploration when assessment has recommended_pathway creative-exploration', () => {
    const assessment: ProblemAssessment = {
      nature: 'open-ended',
      complexity: 'moderate',
      recommended_pathway: 'creative-exploration',
      recommended_techniques: ['freewriting', 'mind-mapping'],
      estimated_duration_ms: 1_500_000,
      rationale: 'test',
    };
    expect(agent.recommendPathway(assessment)).toBe('creative-exploration');
  });

  it('returns problem-solving when assessment has recommended_pathway problem-solving', () => {
    const assessment: ProblemAssessment = {
      nature: 'analytical',
      complexity: 'complex',
      recommended_pathway: 'problem-solving',
      recommended_techniques: ['question-brainstorming', 'five-whys'],
      estimated_duration_ms: 1_200_000,
      rationale: 'test',
    };
    expect(agent.recommendPathway(assessment)).toBe('problem-solving');
  });
});

// ============================================================================
// adaptTechniqueQueue tests (Plan 309-02)
// ============================================================================

describe('adaptTechniqueQueue', () => {
  it('calls pathwayRouter.adaptTechniqueQueue for saturation_detected signal', () => {
    let calledWith: { queue: TechniqueId[]; signal: AdaptationSignal } | null = null;

    const agent = createTestAgent({
      adaptTechniqueQueue: (queue, signal, _session) => {
        calledWith = { queue, signal };
        return [...queue];
      },
    });

    const session = mockSession({
      active_technique: 'freewriting',
      technique_queue: ['mind-mapping', 'rapid-ideation'],
    });
    const signal: TransitionSignal = {
      type: 'saturation_detected',
      confidence: 0.8,
      recommendation: 'organize',
      rationale: 'test',
    };

    const result = agent.adaptTechniqueQueue(session, signal);

    expect(calledWith).not.toBeNull();
    expect(calledWith!.signal.type).toBe('saturation');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns an array of TechniqueId (may be empty)', () => {
    const agent = createTestAgent({
      adaptTechniqueQueue: () => [],
    });

    const session = mockSession();
    const signal: TransitionSignal = {
      type: 'energy_low',
      confidence: 0.6,
      recommendation: 'organize',
      rationale: 'test',
    };

    const result = agent.adaptTechniqueQueue(session, signal);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================================
// generateSessionSummary tests (Plan 309-02)
// ============================================================================

describe('generateSessionSummary', () => {
  const agent = createTestAgent();

  it('returns string starting with "## Session Summary"', () => {
    const session = mockSession();
    const summary = agent.generateSessionSummary(session);
    expect(summary.startsWith('## Session Summary')).toBe(true);
  });

  it('contains "3" when session has 3 ideas', () => {
    const session = mockSession({
      ideas: [mockIdea(), mockIdea(), mockIdea()],
    });
    const summary = agent.generateSessionSummary(session);
    expect(summary).toContain('3');
  });

  it('contains technique names when techniques_used has entries', () => {
    const session = mockSession({
      metadata: {
        ...mockSession().metadata,
        techniques_used: ['freewriting', 'mind-mapping'],
      },
    });
    const summary = agent.generateSessionSummary(session);
    expect(summary).toContain('freewriting');
  });

  it('contains cluster label when clusters are present', () => {
    const session = mockSession({
      clusters: [
        mockCluster('User Interface', 4),
        mockCluster('Performance', 3),
      ],
    });
    const summary = agent.generateSessionSummary(session);
    expect(summary).toContain('User Interface');
  });

  it('returns valid non-empty string for empty session (0 ideas, 0 techniques)', () => {
    const session = mockSession();
    const summary = agent.generateSessionSummary(session);
    expect(summary.length).toBeGreaterThan(0);
    expect(typeof summary).toBe('string');
  });

  it('is valid Markdown: starts with "##" and contains "**Problem:**"', () => {
    const session = mockSession();
    const summary = agent.generateSessionSummary(session);
    expect(summary.startsWith('##')).toBe(true);
    expect(summary).toContain('**Problem:**');
  });
});

// ============================================================================
// Safety boundary tests (Plan 309-02)
// ============================================================================

describe('Safety boundaries', () => {
  const agent = createTestAgent();

  it('generateGuidance returns message < 500 chars and not a numbered idea list', () => {
    const session = mockSession({ phase: 'diverge', energy_level: 'high' });
    const guidance = agent.generateGuidance(session);
    expect(guidance.message.length).toBeLessThan(500);
    expect(guidance.message).not.toMatch(/^\d+\./);
  });

  it('generateSessionSummary returns session ideas, not new generated ones', () => {
    const ideas = [
      mockIdea({ content: 'Improve checkout flow' } as any),
      mockIdea({ content: 'Add loyalty rewards' } as any),
    ];
    const session = mockSession({ ideas });
    const summary = agent.generateSessionSummary(session);
    // Summary should reference the session's own ideas
    expect(summary).toContain('Improve checkout flow');
    expect(summary).toContain('Add loyalty rewards');
  });
});
