/**
 * Technique Agent behavioral constraint tests -- all 7 agents.
 *
 * Verifies behavioral constraints (throws), Six Thinking Hats synchronization
 * (broadcast gate), Critic phase enforcement, and inter-agent separation
 * (Scribe captures but never generates).
 *
 * Uses real TechniqueEngine + RulesEngine (no mocks) per Phase 307 integration
 * testing pattern. mockSession() helper kept inline per plan guidance.
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';

import type { SessionState, SessionPhase, Idea, Question, Evaluation } from '../shared/types.js';
import { TechniqueEngine } from '../techniques/engine.js';
import { RulesEngine, DEFAULT_RULES_ENGINE_CONFIG } from '../core/rules-engine.js';

import { Ideator, createIdeator } from './ideator.js';
import { Questioner, createQuestioner } from './questioner.js';
import { Analyst, createAnalyst } from './analyst.js';
import { Mapper, createMapper } from './mapper.js';
import { Persona, createPersona, ALLOWED_FIGURES } from './persona.js';
import { Critic, createCritic } from './critic.js';
import { Scribe, createScribe } from './scribe.js';

// ============================================================================
// Shared test infrastructure
// ============================================================================

/**
 * Create a minimal valid SessionState for testing.
 *
 * Inline per plan guidance -- no shared test infrastructure yet.
 */
function mockSession(phase: SessionPhase = 'diverge'): SessionState {
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

/**
 * Create a valid Idea for testing.
 */
function mockIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: randomUUID(),
    content: 'Compost pickup service for apartments',
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: ['composting', 'urban'],
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create N distinct mock ideas for affinity testing.
 */
function mockIdeas(count: number): Idea[] {
  return Array.from({ length: count }, (_, i) =>
    mockIdea({
      id: randomUUID(),
      content: `Idea ${i + 1}: ${['compost pickup', 'meal planning app', 'food sharing platform', 'smart fridge sensor', 'community garden', 'leftover recipe bot', 'portion calculator', 'food expiry tracker', 'local surplus market', 'school lunch redistribution'][i % 10]}`,
      timestamp: Date.now() + i,
    }),
  );
}

// Real engine and rules instances -- no mocks
const engine = new TechniqueEngine();
const rulesEngine = new RulesEngine(DEFAULT_RULES_ENGINE_CONFIG);

// ============================================================================
// Ideator tests
// ============================================================================

describe('Ideator', () => {
  it('should be created via factory function', () => {
    const ideator = createIdeator(engine, rulesEngine);
    expect(ideator).toBeInstanceOf(Ideator);
  });

  it('should return 5 assigned techniques', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const techniques = ideator.getAssignedTechniques();
    expect(techniques).toHaveLength(5);
    expect(techniques).toContain('freewriting');
    expect(techniques).toContain('rapid-ideation');
    expect(techniques).toContain('brainwriting-635');
    expect(techniques).toContain('round-robin');
    expect(techniques).toContain('brain-netting');
  });

  it('generateIdeas with freewriting returns Idea[] with source_agent ideator', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const session = mockSession('diverge');
    ideator.setSession(session.id);

    const ideas = ideator.generateIdeas('freewriting', session, 0);
    expect(Array.isArray(ideas)).toBe(true);
    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.source_agent).toBe('ideator');
    }
  });

  it('generateIdeas with scamper throws technique not assigned', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const session = mockSession('diverge');

    expect(() => ideator.generateIdeas('scamper', session, 0)).toThrow(
      'not assigned technique',
    );
  });

  it('evaluateIdea() throws behavioral constraint violation', () => {
    const ideator = createIdeator(engine, rulesEngine);

    expect(() => ideator.evaluateIdea()).toThrow('behavioral constraint violation');
  });

  it('getCaptureMessages() returns messages after generateIdeas()', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const session = mockSession('diverge');
    ideator.setSession(session.id);

    ideator.generateIdeas('freewriting', session, 0);
    const messages = ideator.getCaptureMessages();

    expect(messages.length).toBeGreaterThan(0);
    for (const msg of messages) {
      expect(msg.agent).toBe('ideator');
      expect(msg.content_type).toBe('idea');
    }
  });

  it('getCaptureMessages() drains outbox (second call returns empty)', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const session = mockSession('diverge');
    ideator.setSession(session.id);

    ideator.generateIdeas('freewriting', session, 0);
    const first = ideator.getCaptureMessages();
    expect(first.length).toBeGreaterThan(0);

    const second = ideator.getCaptureMessages();
    expect(second).toHaveLength(0);
  });
});

// ============================================================================
// Questioner tests
// ============================================================================

describe('Questioner', () => {
  it('should be created via factory function', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    expect(questioner).toBeInstanceOf(Questioner);
  });

  it('should return 3 assigned techniques', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const techniques = questioner.getAssignedTechniques();
    expect(techniques).toHaveLength(3);
    expect(techniques).toContain('question-brainstorming');
    expect(techniques).toContain('starbursting');
    expect(techniques).toContain('five-whys');
  });

  it('generateQuestions with question-brainstorming returns Question[]', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const session = mockSession('diverge');
    questioner.setSession(session.id);

    const questions = questioner.generateQuestions('question-brainstorming', session, 0);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('generateQuestions with freewriting throws technique not assigned', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const session = mockSession('diverge');

    expect(() => questioner.generateQuestions('freewriting', session, 0)).toThrow(
      'not assigned technique',
    );
  });

  it('generateAnswer() throws behavioral constraint violation', () => {
    const questioner = createQuestioner(engine, rulesEngine);

    expect(() => questioner.generateAnswer()).toThrow('behavioral constraint violation');
  });

  it('redirectAnswerToQuestion: statement becomes question ending with ?', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const result = questioner.redirectAnswerToQuestion('users need more time');

    expect(result.endsWith('?')).toBe(true);
  });

  it('redirectAnswerToQuestion: existing question returned unchanged', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const result = questioner.redirectAnswerToQuestion('How might we improve?');

    expect(result).toBe('How might we improve?');
  });

  it('redirectAnswerToQuestion: W-word without ? gets ? appended', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const result = questioner.redirectAnswerToQuestion('What are the options');

    expect(result.endsWith('?')).toBe(true);
    expect(result).toBe('What are the options?');
  });

  it('getCaptureMessages() returns messages after generateQuestions()', () => {
    const questioner = createQuestioner(engine, rulesEngine);
    const session = mockSession('diverge');
    questioner.setSession(session.id);

    questioner.generateQuestions('question-brainstorming', session, 0);
    const messages = questioner.getCaptureMessages();

    expect(messages.length).toBeGreaterThan(0);
    for (const msg of messages) {
      expect(msg.agent).toBe('questioner');
      expect(msg.content_type).toBe('question');
    }
  });
});

// ============================================================================
// Analyst tests
// ============================================================================

describe('Analyst', () => {
  it('should be created via factory function', () => {
    const analyst = createAnalyst(engine, rulesEngine);
    expect(analyst).toBeInstanceOf(Analyst);
  });

  it('should return 2 assigned techniques (scamper, six-thinking-hats)', () => {
    const analyst = createAnalyst(engine, rulesEngine);
    const techniques = analyst.getAssignedTechniques();
    expect(techniques).toHaveLength(2);
    expect(techniques).toContain('scamper');
    expect(techniques).toContain('six-thinking-hats');
  });

  describe('SCAMPER', () => {
    it('generateScamperRound returns Idea[] all with scamper_lens field set', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const session = mockSession('diverge');
      analyst.setSession(session.id);

      const ideas = analyst.generateScamperRound(session, 0);
      expect(Array.isArray(ideas)).toBe(true);
      expect(ideas.length).toBeGreaterThan(0);
      for (const idea of ideas) {
        expect(idea.scamper_lens).toBeDefined();
        expect(typeof idea.scamper_lens).toBe('string');
      }
    });

    it('after 7 calls, getCurrentScamperLens returns each of the 7 lenses at least once', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const session = mockSession('diverge');
      analyst.setSession(session.id);

      const lenses = new Set<string>();
      for (let round = 0; round < 7; round++) {
        analyst.generateScamperRound(session, round);
        const lens = analyst.getCurrentScamperLens();
        expect(lens).not.toBeNull();
        lenses.add(lens!);
      }

      expect(lenses.size).toBe(7);
      expect(lenses.has('substitute')).toBe(true);
      expect(lenses.has('combine')).toBe(true);
      expect(lenses.has('adapt')).toBe(true);
      expect(lenses.has('modify')).toBe(true);
      expect(lenses.has('put-to-another-use')).toBe(true);
      expect(lenses.has('eliminate')).toBe(true);
      expect(lenses.has('reverse')).toBe(true);
    });
  });

  describe('Six Thinking Hats', () => {
    it('broadcastHatChange(black, id, diverge) returns null (Black Hat safety)', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const sessionId = randomUUID();

      const result = analyst.broadcastHatChange('black', sessionId, 'diverge');
      expect(result).toBeNull();
    });

    it('broadcastHatChange(green, id, diverge) returns HatBroadcast object', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const sessionId = randomUUID();

      const result = analyst.broadcastHatChange('green', sessionId, 'diverge');
      expect(result).not.toBeNull();
      expect(result!.hat_color).toBe('green');
      expect(result!.session_id).toBe(sessionId);
      expect(result!.phase).toBe('diverge');
      expect(result!.acknowledged_by).toEqual([]);
    });

    it('broadcastHatChange(black, id, converge) returns HatBroadcast (Black Hat allowed during Converge)', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const sessionId = randomUUID();

      const result = analyst.broadcastHatChange('black', sessionId, 'converge');
      expect(result).not.toBeNull();
      expect(result!.hat_color).toBe('black');
      expect(result!.phase).toBe('converge');
    });

    it('getHatBroadcastHistory grows after each successful broadcast', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const sessionId = randomUUID();

      expect(analyst.getHatBroadcastHistory()).toHaveLength(0);

      analyst.broadcastHatChange('green', sessionId, 'diverge');
      expect(analyst.getHatBroadcastHistory()).toHaveLength(1);

      analyst.broadcastHatChange('white', sessionId, 'diverge');
      expect(analyst.getHatBroadcastHistory()).toHaveLength(2);

      // Refused broadcast (black during diverge) does NOT add to history
      analyst.broadcastHatChange('black', sessionId, 'diverge');
      expect(analyst.getHatBroadcastHistory()).toHaveLength(2);
    });

    it('acknowledgeHatBroadcast adds agent to acknowledged_by', () => {
      const analyst = createAnalyst(engine, rulesEngine);
      const sessionId = randomUUID();

      analyst.broadcastHatChange('green', sessionId, 'diverge');
      analyst.acknowledgeHatBroadcast('green', 'ideator');

      const history = analyst.getHatBroadcastHistory();
      expect(history[0].acknowledged_by).toContain('ideator');
    });
  });
});

// ============================================================================
// Mapper tests
// ============================================================================

describe('Mapper', () => {
  it('should be created via factory function', () => {
    const mapper = createMapper(engine, rulesEngine);
    expect(mapper).toBeInstanceOf(Mapper);
  });

  it('should return 4 assigned techniques', () => {
    const mapper = createMapper(engine, rulesEngine);
    const techniques = mapper.getAssignedTechniques();
    expect(techniques).toHaveLength(4);
    expect(techniques).toContain('mind-mapping');
    expect(techniques).toContain('affinity-mapping');
    expect(techniques).toContain('lotus-blossom');
    expect(techniques).toContain('storyboarding');
  });

  it('generateMindMap returns Idea[] with parent_id chains', () => {
    const mapper = createMapper(engine, rulesEngine);
    const session = mockSession('diverge');
    mapper.setSession(session.id);

    // Round 1 generates top-level branches from root; round 0 has no parent nodes
    const ideas = mapper.generateMindMap(session, 1);
    expect(Array.isArray(ideas)).toBe(true);
    expect(ideas.length).toBeGreaterThan(0);
    // Mind map ideas should have parent_id references (branches from root)
    for (const idea of ideas) {
      expect(idea.parent_id).toBeDefined();
    }
  });

  describe('organizeAffinity', () => {
    it('organizeAffinity with 10 ideas returns clusters covering all 10 idea_ids', () => {
      const mapper = createMapper(engine, rulesEngine);
      const session = mockSession('organize');
      mapper.setSession(session.id);

      const ideas = mockIdeas(10);
      const clusters = mapper.organizeAffinity(ideas, session);

      // Collect all idea_ids from clusters
      const coveredIds = new Set<string>();
      for (const cluster of clusters) {
        for (const id of cluster.idea_ids) {
          coveredIds.add(id);
        }
      }

      // All 10 ideas must be covered
      for (const idea of ideas) {
        expect(coveredIds.has(idea.id)).toBe(true);
      }
      expect(coveredIds.size).toBe(10);
    });

    it('organizeAffinity with 10 ideas returns 2-8 clusters', () => {
      const mapper = createMapper(engine, rulesEngine);
      const session = mockSession('organize');
      mapper.setSession(session.id);

      const ideas = mockIdeas(10);
      const clusters = mapper.organizeAffinity(ideas, session);

      expect(clusters.length).toBeGreaterThanOrEqual(2);
      expect(clusters.length).toBeLessThanOrEqual(8);
    });

    it('organizeAffinity with 1 idea returns 1 cluster containing that idea', () => {
      const mapper = createMapper(engine, rulesEngine);
      const session = mockSession('organize');
      mapper.setSession(session.id);

      const ideas = mockIdeas(1);
      const clusters = mapper.organizeAffinity(ideas, session);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].idea_ids).toContain(ideas[0].id);
    });

    it('organizeAffinity with 0 ideas returns empty array', () => {
      const mapper = createMapper(engine, rulesEngine);
      const session = mockSession('organize');

      const clusters = mapper.organizeAffinity([], session);
      expect(clusters).toHaveLength(0);
    });
  });

  it('evaluateIdeaQuality() throws behavioral constraint violation', () => {
    const mapper = createMapper(engine, rulesEngine);

    expect(() => mapper.evaluateIdeaQuality()).toThrow('behavioral constraint violation');
  });

  it('getCaptureMessages() returns messages after organizeAffinity()', () => {
    const mapper = createMapper(engine, rulesEngine);
    const session = mockSession('organize');
    mapper.setSession(session.id);

    const ideas = mockIdeas(5);
    mapper.organizeAffinity(ideas, session);

    const messages = mapper.getCaptureMessages();
    expect(messages.length).toBeGreaterThan(0);
    for (const msg of messages) {
      expect(msg.agent).toBe('mapper');
      expect(msg.content_type).toBe('cluster');
    }
  });
});

// ============================================================================
// Persona tests
// ============================================================================

describe('Persona', () => {
  it('should be created via factory function', () => {
    const persona = createPersona(engine, rulesEngine);
    expect(persona).toBeInstanceOf(Persona);
  });

  it('should return 2 assigned techniques (rolestorming, figure-storming)', () => {
    const persona = createPersona(engine, rulesEngine);
    const techniques = persona.getAssignedTechniques();
    expect(techniques).toHaveLength(2);
    expect(techniques).toContain('rolestorming');
    expect(techniques).toContain('figure-storming');
  });

  it('activateFigure(Marie Curie) succeeds; getCurrentPersona() returns Marie Curie', () => {
    const persona = createPersona(engine, rulesEngine);
    persona.activateFigure('Marie Curie');
    expect(persona.getCurrentPersona()).toBe('Marie Curie');
  });

  it('activateFigure(Unknown Celebrity) throws', () => {
    const persona = createPersona(engine, rulesEngine);
    expect(() => persona.activateFigure('Unknown Celebrity' as any)).toThrow();
  });

  it('activateRolePerspective(curious child) succeeds; getCurrentPersona() returns curious child', () => {
    const persona = createPersona(engine, rulesEngine);
    persona.activateRolePerspective('curious child');
    expect(persona.getCurrentPersona()).toBe('curious child');
  });

  it('activateRolePerspective(hostile enemy) throws blocked term hostile', () => {
    const persona = createPersona(engine, rulesEngine);
    expect(() => persona.activateRolePerspective('hostile enemy')).toThrow('hostile');
  });

  it('validates all 9 allowed figures are accepted', () => {
    for (const figure of ALLOWED_FIGURES) {
      const persona = createPersona(engine, rulesEngine);
      expect(() => persona.activateFigure(figure)).not.toThrow();
      expect(persona.getCurrentPersona()).toBe(figure);
    }
  });

  it('blocks all hostile/demeaning perspective terms', () => {
    const blockedTerms = ['enemy', 'villain', 'hostile', 'hater', 'troll', 'abusive'];
    for (const term of blockedTerms) {
      const persona = createPersona(engine, rulesEngine);
      expect(() => persona.activateRolePerspective(`a ${term} person`)).toThrow(term);
    }
  });

  it('figure-storming: all returned ideas have perspective === Marie Curie', () => {
    const persona = createPersona(engine, rulesEngine);
    const session = mockSession('diverge');
    persona.setSession(session.id);

    persona.activateFigure('Marie Curie');
    const ideas = persona.generatePersonaIdeas(session, 0);

    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.perspective).toBe('Marie Curie');
    }
  });

  it('rolestorming: all returned ideas have perspective === curious child', () => {
    const persona = createPersona(engine, rulesEngine);
    const session = mockSession('diverge');
    persona.setSession(session.id);

    persona.activateRolePerspective('curious child');
    const ideas = persona.generatePersonaIdeas(session, 0);

    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.perspective).toBe('curious child');
    }
  });

  it('activateFigure clears custom perspective (mutual exclusion)', () => {
    const persona = createPersona(engine, rulesEngine);
    persona.activateRolePerspective('curious child');
    expect(persona.getCurrentPersona()).toBe('curious child');

    persona.activateFigure('Albert Einstein');
    expect(persona.getCurrentPersona()).toBe('Albert Einstein');
  });

  it('activateRolePerspective clears figure (mutual exclusion)', () => {
    const persona = createPersona(engine, rulesEngine);
    persona.activateFigure('Marie Curie');
    expect(persona.getCurrentPersona()).toBe('Marie Curie');

    persona.activateRolePerspective('curious child');
    expect(persona.getCurrentPersona()).toBe('curious child');
  });

  it('generatePersonaIdeas throws when no persona is active', () => {
    const persona = createPersona(engine, rulesEngine);
    const session = mockSession('diverge');

    expect(() => persona.generatePersonaIdeas(session, 0)).toThrow('No active persona');
  });
});

// ============================================================================
// Critic tests
// ============================================================================

describe('Critic', () => {
  it('should be created via factory function', () => {
    const critic = createCritic(engine, rulesEngine);
    expect(critic).toBeInstanceOf(Critic);
  });

  it('should return 0 assigned techniques (Critic evaluates, not generates)', () => {
    const critic = createCritic(engine, rulesEngine);
    expect(critic.getAssignedTechniques()).toHaveLength(0);
  });

  describe('activate() phase gate', () => {
    it('activate(diverge) throws cannot activate', () => {
      const critic = createCritic(engine, rulesEngine);
      expect(() => critic.activate('diverge')).toThrow('cannot activate');
    });

    it('activate(explore) throws cannot activate', () => {
      const critic = createCritic(engine, rulesEngine);
      expect(() => critic.activate('explore')).toThrow('cannot activate');
    });

    it('activate(organize) throws cannot activate', () => {
      const critic = createCritic(engine, rulesEngine);
      expect(() => critic.activate('organize')).toThrow('cannot activate');
    });

    it('activate(act) throws cannot activate', () => {
      const critic = createCritic(engine, rulesEngine);
      expect(() => critic.activate('act')).toThrow('cannot activate');
    });

    it('activate(converge) does NOT throw', () => {
      const critic = createCritic(engine, rulesEngine);
      expect(() => critic.activate('converge')).not.toThrow();
    });
  });

  describe('evaluateIdea', () => {
    it('evaluateIdea returns Evaluation with composite = 10 (4+5+3-2)', () => {
      const critic = createCritic(engine, rulesEngine);
      critic.activate('converge');

      const idea = mockIdea();
      const evaluation = critic.evaluateIdea(idea, 4, 5, 3, 2);

      expect(evaluation.idea_id).toBe(idea.id);
      expect(evaluation.feasibility).toBe(4);
      expect(evaluation.impact).toBe(5);
      expect(evaluation.alignment).toBe(3);
      expect(evaluation.risk).toBe(2);

      // composite = (4+5+3) - 2 = 10
      const composite = (evaluation.feasibility + evaluation.impact + evaluation.alignment) - evaluation.risk;
      expect(composite).toBe(10);
    });

    it('evaluateIdea rejects scores outside 1-5 range', () => {
      const critic = createCritic(engine, rulesEngine);
      critic.activate('converge');

      const idea = mockIdea();
      expect(() => critic.evaluateIdea(idea, 0, 3, 3, 3)).toThrow();
      expect(() => critic.evaluateIdea(idea, 3, 6, 3, 3)).toThrow();
    });

    it('evaluateIdea emits to capture loop', () => {
      const critic = createCritic(engine, rulesEngine);
      critic.activate('converge');
      critic.setSession(randomUUID());

      const idea = mockIdea();
      critic.evaluateIdea(idea, 3, 4, 3, 2);

      const messages = critic.getCaptureMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].content_type).toBe('evaluation');
      expect(messages[0].agent).toBe('critic');
    });
  });

  describe('weightedScore', () => {
    it('returns RankedIdea[] sorted by composite descending', () => {
      const critic = createCritic(engine, rulesEngine);
      critic.activate('converge');

      const idea1 = mockIdea({ content: 'High scorer', timestamp: 1000 });
      const idea2 = mockIdea({ content: 'Low scorer', timestamp: 2000 });

      const eval1: Evaluation = {
        idea_id: idea1.id,
        feasibility: 5,
        impact: 5,
        alignment: 5,
        risk: 1,
        evaluator: 'critic',
        timestamp: Date.now(),
      };
      const eval2: Evaluation = {
        idea_id: idea2.id,
        feasibility: 1,
        impact: 1,
        alignment: 1,
        risk: 5,
        evaluator: 'critic',
        timestamp: Date.now(),
      };

      const ranked = critic.weightedScore([idea1, idea2], [eval1, eval2]);

      expect(ranked).toHaveLength(2);
      expect(ranked[0].idea.id).toBe(idea1.id);
      expect(ranked[0].composite_score).toBe(14); // (5+5+5) - 1
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].idea.id).toBe(idea2.id);
      expect(ranked[1].composite_score).toBe(-2); // (1+1+1) - 5
      expect(ranked[1].rank).toBe(2);
    });
  });

  describe('formatSuggestion', () => {
    it('includes "signal, not a verdict" in output', () => {
      const critic = createCritic(engine, rulesEngine);
      critic.activate('converge');

      const idea = mockIdea();
      const evaluation: Evaluation = {
        idea_id: idea.id,
        feasibility: 4,
        impact: 4,
        alignment: 4,
        risk: 2,
        evaluator: 'critic',
        timestamp: Date.now(),
      };

      const ranked = { idea, evaluation, composite_score: 10, rank: 1 };
      const text = critic.formatSuggestion(ranked);

      expect(text).toContain('signal, not a verdict');
    });
  });
});

// ============================================================================
// Scribe tests
// ============================================================================

describe('Scribe', () => {
  it('should be created via factory function', () => {
    const scribe = createScribe(engine, rulesEngine);
    expect(scribe).toBeInstanceOf(Scribe);
  });

  it('should return 0 assigned techniques (Scribe captures, not generates)', () => {
    const scribe = createScribe(engine, rulesEngine);
    expect(scribe.getAssignedTechniques()).toHaveLength(0);
  });

  it('generateIdea() throws behavioral constraint violation', () => {
    const scribe = createScribe(engine, rulesEngine);
    expect(() => scribe.generateIdea()).toThrow('behavioral constraint violation');
  });

  it('generateQuestion() throws behavioral constraint violation', () => {
    const scribe = createScribe(engine, rulesEngine);
    expect(() => scribe.generateQuestion()).toThrow('behavioral constraint violation');
  });

  it('captureIdea succeeds with valid idea; getCaptureMessages returns 1 entry', () => {
    const scribe = createScribe(engine, rulesEngine);
    scribe.setSession(randomUUID());

    const idea = mockIdea();
    scribe.captureIdea(idea);

    const messages = scribe.getCaptureMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content_type).toBe('idea');
    expect(messages[0].agent).toBe('scribe');
  });

  it('captureIdea with invalid object throws ZodError', () => {
    const scribe = createScribe(engine, rulesEngine);
    scribe.setSession(randomUUID());

    // Missing required fields -- should fail Zod validation
    const invalidIdea = { content: 'missing fields' } as any;
    expect(() => scribe.captureIdea(invalidIdea)).toThrow();
  });

  it('generateTranscript returns string containing "# Brainstorm Session"', () => {
    const scribe = createScribe(engine, rulesEngine);
    const session = mockSession('diverge');

    const transcript = scribe.generateTranscript(session);
    expect(typeof transcript).toBe('string');
    expect(transcript).toContain('# Brainstorm Session');
  });

  it('generateActionPlan returns non-empty string', () => {
    const scribe = createScribe(engine, rulesEngine);
    const session = mockSession('act');

    const plan = scribe.generateActionPlan(session);
    expect(typeof plan).toBe('string');
    expect(plan.length).toBeGreaterThan(0);
  });

  it('captureQuestion succeeds with valid question', () => {
    const scribe = createScribe(engine, rulesEngine);
    scribe.setSession(randomUUID());

    const question: Question = {
      id: randomUUID(),
      content: 'How might we track food waste?',
      category: 'how',
      source_technique: 'question-brainstorming',
      timestamp: Date.now(),
    };
    scribe.captureQuestion(question);

    const messages = scribe.getCaptureMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content_type).toBe('question');
  });
});

// ============================================================================
// Cross-agent tests
// ============================================================================

describe('Cross-agent', () => {
  it('Ideator and Questioner are independent instances (state not shared)', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const questioner = createQuestioner(engine, rulesEngine);
    const session = mockSession('diverge');

    ideator.setSession(session.id);
    questioner.setSession(session.id);

    // Generate on each agent
    ideator.generateIdeas('freewriting', session, 0);
    questioner.generateQuestions('question-brainstorming', session, 0);

    // Draining ideator's capture messages does NOT affect questioner's
    const ideatorMessages = ideator.getCaptureMessages();
    const questionerMessages = questioner.getCaptureMessages();

    expect(ideatorMessages.length).toBeGreaterThan(0);
    expect(questionerMessages.length).toBeGreaterThan(0);

    // Verify agent labels are independent
    for (const msg of ideatorMessages) {
      expect(msg.agent).toBe('ideator');
    }
    for (const msg of questionerMessages) {
      expect(msg.agent).toBe('questioner');
    }
  });

  it('Critic activation only succeeds during converge -- all other phases blocked', () => {
    const phases: SessionPhase[] = ['explore', 'diverge', 'organize', 'converge', 'act'];

    for (const phase of phases) {
      const critic = createCritic(engine, rulesEngine);
      if (phase === 'converge') {
        expect(() => critic.activate(phase)).not.toThrow();
      } else {
        expect(() => critic.activate(phase)).toThrow();
      }
    }
  });

  it('Scribe captures but Ideator generates -- role separation', () => {
    const ideator = createIdeator(engine, rulesEngine);
    const scribe = createScribe(engine, rulesEngine);
    const session = mockSession('diverge');
    ideator.setSession(session.id);
    scribe.setSession(session.id);

    // Ideator generates ideas
    const ideas = ideator.generateIdeas('freewriting', session, 0);
    expect(ideas.length).toBeGreaterThan(0);

    // Scribe captures one of them
    scribe.captureIdea(ideas[0]);

    // Scribe cannot generate
    expect(() => scribe.generateIdea()).toThrow();

    // Ideator cannot evaluate
    expect(() => ideator.evaluateIdea()).toThrow();
  });
});
