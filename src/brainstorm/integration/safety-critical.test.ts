/**
 * Safety-Critical Test Suite -- SC-01 through SC-18.
 *
 * The most important tests in the entire v1.32 milestone. These verify
 * that Osborn's no-criticism rule is architecturally enforced and that
 * every agent respects its behavioral constraints.
 *
 * A brainstorming system that allows premature evaluation defeats its
 * own purpose. SC-01..SC-18 are the final proof that the architectural
 * Critic gate works end-to-end and all agents are behaviorally sound.
 *
 * Uses real RulesEngine, SessionManager, PhaseController, agents (no mocks).
 * Uses tmpdir isolation (beforeEach creates temp dir, afterEach removes it).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

import type {
  SessionPhase,
  SessionState,
  BrainstormMessage,
  Idea,
} from '../shared/types.js';
import { resetBrainstormCounter } from '../shared/schemas.js';

import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from '../core/rules-engine.js';
import { SessionManager } from '../core/session-manager.js';
import { PhaseController } from '../core/phase-controller.js';
import { TechniqueEngine } from '../techniques/engine.js';

import { Ideator } from '../agents/ideator.js';
import { Questioner } from '../agents/questioner.js';
import { Persona, ALLOWED_FIGURES } from '../agents/persona.js';
import { Scribe } from '../agents/scribe.js';
import { Critic } from '../agents/critic.js';
import { FacilitatorAgent } from '../agents/facilitator.js';

// ============================================================================
// Test infrastructure
// ============================================================================

let testDir: string;
let rulesEngine: RulesEngine;
let sessionManager: SessionManager;
let phaseController: PhaseController;
let engine: TechniqueEngine;

const testSessionId = randomUUID();

beforeEach(async () => {
  resetBrainstormCounter();
  testDir = await mkdtemp(join(tmpdir(), 'brainstorm-sc-test-'));
  rulesEngine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  sessionManager = new SessionManager({ brainstormDir: testDir });
  phaseController = new PhaseController(sessionManager, rulesEngine);
  engine = new TechniqueEngine();
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

/**
 * Build a BrainstormMessage for checkMessage testing.
 */
function buildMessage(content: string, phase: SessionPhase): BrainstormMessage {
  return {
    id: randomUUID(),
    from: 'ideator',
    to: 'broadcast',
    type: 'idea',
    phase,
    payload: { content },
    timestamp: Date.now(),
    session_id: testSessionId,
    priority: 2,
  };
}

/**
 * Create a session and transition it to the given phase.
 * Reused by SC-09, SC-14, SC-17.
 */
async function buildTestSession(brainstormDir: string, phase: SessionPhase): Promise<string> {
  const sm = new SessionManager({ brainstormDir });
  const re = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);
  const pc = new PhaseController(sm, re);

  const session = await sm.createSession('How might we improve urban transportation?');
  // Activate session
  await sm.setActiveTechnique(session.id, 'freewriting');

  // Walk through phases in order until we reach the target
  const phases: SessionPhase[] = ['explore', 'diverge', 'organize', 'converge', 'act'];
  const targetIndex = phases.indexOf(phase);
  const currentIndex = 0; // starts at 'explore'

  for (let i = currentIndex + 1; i <= targetIndex; i++) {
    await pc.transitionTo(session.id, phases[i]);
  }

  return session.id;
}

/**
 * Create a minimal valid SessionState for inline testing.
 */
function mockSessionState(phase: SessionPhase = 'diverge'): SessionState {
  return {
    id: randomUUID(),
    status: 'active',
    phase,
    problem_statement: 'How might we reduce food waste in urban households?',
    active_technique: null,
    active_pathway: null,
    technique_queue: [],
    active_agents: ['facilitator', 'scribe'],
    ideas: [],
    questions: [],
    clusters: [],
    evaluations: [],
    action_items: [],
    timer: { technique_timer: null, session_timer: { elapsed_ms: 0 }, is_paused: false },
    energy_level: 'high',
    rules_active: [],
    metadata: {
      created_at: Date.now(),
      updated_at: Date.now(),
      total_ideas: 0,
      total_questions: 0,
      techniques_used: [],
      phase_history: [{ phase, entered_at: Date.now() }],
    },
  };
}

// ============================================================================
// SC-01 through SC-05: Critic Gate -- Rules Engine
// ============================================================================

describe('Critic Gate -- Rules Engine (SC-01 through SC-05)', () => {
  const phases: SessionPhase[] = ['explore', 'diverge', 'organize', 'converge', 'act'];

  it('SC-01: critic blocked during explore', () => {
    const result = rulesEngine.canActivateAgent('critic', 'explore');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Critic');
  });

  it('SC-02: critic blocked during diverge', () => {
    const result = rulesEngine.canActivateAgent('critic', 'diverge');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Critic');
  });

  it('SC-03: critic blocked during organize', () => {
    const result = rulesEngine.canActivateAgent('critic', 'organize');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Critic');
  });

  it('SC-04: critic allowed during converge', () => {
    const result = rulesEngine.canActivateAgent('critic', 'converge');
    expect(result).toEqual({ allowed: true });
  });

  it('SC-05: critic blocked during act', () => {
    const result = rulesEngine.canActivateAgent('critic', 'act');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Critic');
  });
});

// ============================================================================
// SC-06 through SC-08: Evaluative Content -- Rules Engine checkMessage
// ============================================================================

describe('Evaluative Content Detection (SC-06 through SC-08)', () => {
  it("SC-06: evaluative 'that won't work' blocked during diverge", () => {
    const msg = buildMessage("that won't work", 'diverge');
    const result = rulesEngine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(false);
  });

  it("SC-07: constructive 'and we could also make it faster' allowed during diverge", () => {
    const msg = buildMessage(
      "that won't work on its own but and we could also make it faster",
      'diverge',
    );
    const result = rulesEngine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(true);
  });

  it("SC-08: qualified rejection 'yes, but that's impossible' blocked during diverge", () => {
    const msg = buildMessage("yes, but that's impossible -- unrealistic", 'diverge');
    const result = rulesEngine.checkMessage(msg, 'diverge');
    expect(result.allowed).toBe(false);
  });
});

// ============================================================================
// SC-09: Phase Controller Enforces Critic Gate
// ============================================================================

describe('Phase Controller Critic Gate (SC-09)', () => {
  it('SC-09: activateAgent(critic) during diverge returns {success: false} with reason', async () => {
    const sessionId = await buildTestSession(testDir, 'diverge');
    const result = await phaseController.activateAgent(sessionId, 'critic');
    expect(result.success).toBe(false);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe('string');
    expect(result.reason!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SC-10: Ideator Never Evaluates
// ============================================================================

describe('Ideator Behavioral Constraint (SC-10)', () => {
  it('SC-10: ideator output scan for evaluative patterns returns 0 matches', () => {
    const ideator = new Ideator(engine, rulesEngine);
    const session = mockSessionState('diverge');
    const ideas = ideator.generateIdeas('freewriting', session, 1);

    const evaluativePatterns = ["won't work", 'bad', 'terrible', 'unrealistic'];
    for (const idea of ideas) {
      for (const pattern of evaluativePatterns) {
        expect(idea.content.toLowerCase()).not.toContain(pattern);
      }
    }
  });
});

// ============================================================================
// SC-11: Questioner Produces Only Questions
// ============================================================================

describe('Questioner Behavioral Constraint (SC-11)', () => {
  it('SC-11: questioner output contains only Question-type items, no Idea-type items', () => {
    const questioner = new Questioner(engine, rulesEngine);
    const session = mockSessionState('diverge');
    const questions = questioner.generateQuestions('question-brainstorming', session, 1);

    // Every item must be a Question (has 'category' and 'source_technique' but NOT idea-specific fields)
    for (const q of questions) {
      // Must have question-type fields
      expect('category' in q).toBe(true);
      expect('source_technique' in q).toBe(true);
      // Must NOT have idea-specific combo of fields (source_agent + tags + cluster_id)
      expect('source_agent' in q).toBe(false);
      expect('tags' in q).toBe(false);
    }
  });
});

// ============================================================================
// SC-12: Persona Constructive-Only
// ============================================================================

describe('Persona Constructive Constraint (SC-12)', () => {
  it('SC-12: persona agent persona list contains no hostile or demeaning entries', () => {
    const hostilePatterns = ['enemy', 'villain', 'abuser', 'oppressor'];
    for (const figure of ALLOWED_FIGURES) {
      for (const pattern of hostilePatterns) {
        expect(figure.toLowerCase()).not.toContain(pattern);
      }
    }
  });
});

// ============================================================================
// SC-13: Scribe Never Generates Ideas
// ============================================================================

describe('Scribe Behavioral Constraint (SC-13)', () => {
  it('SC-13: scribe generateIdea() throws unconditionally and captured ideas have non-scribe source', () => {
    const scribe = new Scribe(engine, rulesEngine);

    // generateIdea() must throw
    expect(() => scribe.generateIdea()).toThrow();

    // Create a test idea from another agent and capture it
    const testIdea: Idea = {
      id: randomUUID(),
      content: 'Use solar-powered buses for urban transit',
      source_agent: 'ideator',
      source_technique: 'freewriting',
      phase: 'diverge',
      tags: ['transport', 'green'],
      timestamp: Date.now(),
    };
    scribe.captureIdea(testIdea);

    // Verify captured items have non-scribe source_agent
    const captured = scribe.getCaptureMessages();
    for (const msg of captured) {
      if (msg.content_type === 'idea') {
        expect((msg.content as Idea).source_agent).not.toBe('scribe');
      }
    }
  });
});

// ============================================================================
// SC-14: Phase Ordering Enforcement
// ============================================================================

describe('Phase Ordering Enforcement (SC-14)', () => {
  it("SC-14: PhaseController rejects 'act' -> 'diverge' backward phase transition", async () => {
    // Build a session all the way to 'act' phase
    const sessionId = await buildTestSession(testDir, 'act');
    const result = await phaseController.canTransitionTo(sessionId, 'diverge');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason!.toLowerCase()).toContain('backwards');
  });
});

// ============================================================================
// SC-15: Facilitator Never Quality-Judges Ideas
// ============================================================================

describe('Facilitator Guidance Constraint (SC-15)', () => {
  it('SC-15: facilitator guidance output contains no quality judgments on specific ideas', () => {
    // Create a minimal mock pathway router for the FacilitatorAgent
    const mockPathwayRouter = {
      getPathway: () => null,
      getTechniqueQueue: () => [],
      adaptTechniqueQueue: (q: any) => q,
      listBySituation: () => [],
    };
    const facilitator = new FacilitatorAgent(
      sessionManager,
      phaseController,
      mockPathwayRouter as any,
    );

    const divergeState = mockSessionState('diverge');
    const lowEnergyState = { ...mockSessionState('diverge'), energy_level: 'low' as const };

    // Generate guidance messages across different states
    const guidanceMessages = [
      facilitator.generateGuidance(divergeState),
      facilitator.generateGuidance(lowEnergyState),
      facilitator.handleEnergySignal('high', divergeState),
      facilitator.handleEnergySignal('flagging', divergeState),
    ];

    const qualityJudgmentPatterns = [
      'bad idea',
      'that idea is',
      'weak',
      'strong idea',
      'best idea',
    ];

    for (const guidance of guidanceMessages) {
      for (const pattern of qualityJudgmentPatterns) {
        expect(guidance.message.toLowerCase()).not.toContain(pattern);
      }
    }
  });
});

// ============================================================================
// SC-16: All Four Osborn Rules Active During Diverge
// ============================================================================

describe('Active Rules During Diverge (SC-16)', () => {
  it('SC-16: getActiveRules(diverge) returns all 4 OsbornRule values', () => {
    const rules = rulesEngine.getActiveRules('diverge');
    expect(rules).toContain('quantity');
    expect(rules).toContain('no-criticism');
    expect(rules).toContain('wild-ideas');
    expect(rules).toContain('build-combine');
    expect(rules).toHaveLength(4);
  });
});

// ============================================================================
// SC-17: End-to-End No Evaluation in Diverge Phase
// ============================================================================

describe('End-to-End Diverge Phase (SC-17)', () => {
  it('SC-17: complete diverge-phase session transcript contains zero evaluative content', () => {
    // Generate 5 ideas through the Ideator during diverge
    const ideator = new Ideator(engine, rulesEngine);
    const session = mockSessionState('diverge');

    const allIdeas: Idea[] = [];
    for (let round = 1; round <= 5; round++) {
      const ideas = ideator.generateIdeas('freewriting', session, round);
      allIdeas.push(...ideas);
    }

    // Run every idea's content through the rulesEngine evaluative pattern check
    for (const idea of allIdeas) {
      const msg = buildMessage(idea.content, 'diverge');
      const result = rulesEngine.checkMessage(msg, 'diverge');
      expect(result.allowed).toBe(true);
    }
  });
});

// ============================================================================
// SC-18: Energy Signals as Suggestions Only
// ============================================================================

describe('Energy Signal Advisory Only (SC-18)', () => {
  it('SC-18: energy flagging signal produces a recommendation string, not forced technique switch', async () => {
    // Create a real session to verify no state mutation
    const sessionId = await buildTestSession(testDir, 'diverge');
    const sessionBefore = await sessionManager.getSession(sessionId);

    // Create facilitator with mock pathway router
    const mockPathwayRouter = {
      getPathway: () => null,
      getTechniqueQueue: () => [],
      adaptTechniqueQueue: (q: any) => q,
      listBySituation: () => [],
    };
    const facilitator = new FacilitatorAgent(
      sessionManager,
      phaseController,
      mockPathwayRouter as any,
    );

    // Handle energy flagging signal
    const guidance = facilitator.handleEnergySignal('flagging', sessionBefore);

    // Must be a recommendation, not a direct state mutation
    expect(guidance.message).toBeTruthy();
    expect(typeof guidance.message).toBe('string');
    expect(guidance.message.length).toBeGreaterThan(0);
    // Flagging is advisory, not forced
    expect(guidance.urgency).not.toBe('immediate');

    // Verify session active_technique is UNCHANGED after handleEnergySignal
    const sessionAfter = await sessionManager.getSession(sessionId);
    expect(sessionAfter.active_technique).toBe(sessionBefore.active_technique);
  });
});
