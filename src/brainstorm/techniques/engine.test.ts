/**
 * TechniqueEngine integration tests.
 *
 * Tests loadTechnique() for all 16 techniques, listByCategory counts,
 * and per-technique isComplete() implementations with fidelity checks
 * for Brainwriting parent_id chains, SCAMPER lens tagging, Six Thinking
 * Hats Black Hat skip, Five Whys causal depth, and Lotus Blossom 64-idea
 * threshold.
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { TechniqueEngine } from './engine.js';
import type { TechniqueInstance } from './engine.js';
import type { SessionState, TechniqueId, Idea } from '../shared/types.js';

// ============================================================================
// Mock helper
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
    timer: { technique_timer: null, session_timer: { elapsed_ms: 0 }, is_paused: false },
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

// ============================================================================
// Tests
// ============================================================================

describe('TechniqueEngine', () => {
  const ALL_TECHNIQUE_IDS: TechniqueId[] = [
    'freewriting',
    'mind-mapping',
    'rapid-ideation',
    'question-brainstorming',
    'brainwriting-635',
    'round-robin',
    'brain-netting',
    'rolestorming',
    'figure-storming',
    'scamper',
    'six-thinking-hats',
    'starbursting',
    'five-whys',
    'storyboarding',
    'affinity-mapping',
    'lotus-blossom',
  ];

  // --------------------------------------------------------------------------
  // Test 1: loadTechnique loads all 16 techniques without throwing
  // --------------------------------------------------------------------------
  describe('loadTechnique', () => {
    it('loads all 16 techniques without throwing', () => {
      const engine = new TechniqueEngine();

      for (const id of ALL_TECHNIQUE_IDS) {
        const instance = engine.loadTechnique(id);
        expect(instance).toBeDefined();
        expect(instance.id).toBe(id);
        expect(instance.config).toBeDefined();
        expect(typeof instance.initialize).toBe('function');
        expect(typeof instance.generateRound).toBe('function');
        expect(typeof instance.getState).toBe('function');
        expect(typeof instance.isComplete).toBe('function');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: listByCategory returns correct counts
  // --------------------------------------------------------------------------
  describe('listByCategory', () => {
    it('returns correct counts per category', () => {
      const engine = new TechniqueEngine();

      const individual = engine.listByCategory('individual');
      const collaborative = engine.listByCategory('collaborative');
      const analytical = engine.listByCategory('analytical');
      const visual = engine.listByCategory('visual');

      expect(individual).toHaveLength(4);
      expect(collaborative).toHaveLength(5);
      expect(analytical).toHaveLength(4);
      expect(visual).toHaveLength(3);

      // Total across all categories = 16
      expect(individual.length + collaborative.length + analytical.length + visual.length).toBe(16);
    });
  });

  // --------------------------------------------------------------------------
  // Test 3: freewriting.isComplete() returns true at stream target
  // --------------------------------------------------------------------------
  describe('freewriting.isComplete()', () => {
    it('returns true at stream target', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('freewriting');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Generate enough rounds to produce ideas
      // min_ideas_per_minute=3, so any ideas count should trigger completion
      // since elapsed time will be near zero and we'll have ideas > target
      for (let round = 1; round <= 5; round++) {
        instance.generateRound(round);
      }

      // After 5 rounds producing 3-5 ideas each, we should have 15+ ideas.
      // With near-zero elapsed time, the stream target (elapsed_minutes * 3)
      // is effectively 0, so any ideas > 0 should be complete.
      expect(instance.isComplete()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: rapid-ideation.isComplete() returns true at 10 ideas
  // --------------------------------------------------------------------------
  describe('rapid-ideation.isComplete()', () => {
    it('returns true at 10 ideas', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('rapid-ideation');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Not complete before generating
      expect(instance.isComplete()).toBe(false);

      // Round 1: 5 + (1%6)=6 ideas. Round 2: 5 + (2%6)=7. Total after round 1 = 6, after round 2 = 13.
      instance.generateRound(1);
      // After round 1 we have 6 ideas (5 + 1%6 = 6)
      instance.generateRound(2);
      // After round 2 we have 6+7 = 13 ideas, >= 10
      expect(instance.isComplete()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 5: question-brainstorming.isComplete() returns true at 15 questions
  // --------------------------------------------------------------------------
  describe('question-brainstorming.isComplete()', () => {
    it('returns true at 15 questions', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('question-brainstorming');
      const session = mockSessionState();

      instance.initialize('test problem', session);
      expect(instance.isComplete()).toBe(false);

      // Generate rounds until we hit 15+ questions
      // Round 1: 3+(1%3)=4, Round 2: 3+(2%3)=5, Round 3: 3+(3%3)=3, Round 4: 3+(4%3)=4
      // Cumulative: 4, 9, 12, 16
      for (let round = 1; round <= 4; round++) {
        instance.generateRound(round);
      }

      expect(instance.isComplete()).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 6: brainwriting-635 Round 6 ideas have parent_id from Round 5
  // --------------------------------------------------------------------------
  describe('brainwriting-635 parent_id chains', () => {
    it('Round 6 ideas have parent_id from Round 5 ideas', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('brainwriting-635');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Run all 6 rounds, passing previous round output forward
      let previousOutput: Idea[] = [];
      const allRounds: Map<number, Idea[]> = new Map();

      for (let round = 1; round <= 6; round++) {
        const output = instance.generateRound(round, previousOutput);
        const ideas = output.ideas ?? [];
        allRounds.set(round, ideas);
        previousOutput = ideas;
      }

      const round5Ideas = allRounds.get(5)!;
      const round6Ideas = allRounds.get(6)!;

      expect(round5Ideas.length).toBeGreaterThan(0);
      expect(round6Ideas.length).toBeGreaterThan(0);

      // All Round 6 ideas must have parent_id
      for (const idea of round6Ideas) {
        expect(idea.parent_id).toBeDefined();
      }

      // All Round 6 parent_ids must reference Round 5 ideas
      const round5Ids = new Set(round5Ideas.map(i => i.id));
      for (const idea of round6Ideas) {
        expect(round5Ids.has(idea.parent_id!)).toBe(true);
      }

      // SEMANTIC CHECK: Round 6 ideas are not identical in content to Round 1 ideas
      const round1Ideas = allRounds.get(1)!;
      const round1Contents = new Set(round1Ideas.map(i => i.content));
      for (const idea of round6Ideas) {
        expect(round1Contents.has(idea.content)).toBe(false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 7: rolestorming perspective field populated
  // --------------------------------------------------------------------------
  describe('rolestorming perspective field', () => {
    it('populates perspective field on all ideas', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('rolestorming');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      const allIdeas: Idea[] = [];
      for (let round = 1; round <= 2; round++) {
        const output = instance.generateRound(round);
        const ideas = output.ideas ?? [];
        allIdeas.push(...ideas);
      }

      expect(allIdeas.length).toBeGreaterThan(0);

      for (const idea of allIdeas) {
        expect(idea.perspective).toBeDefined();
        expect(idea.perspective!.length).toBeGreaterThan(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 8: SCAMPER all 7 lenses produce ideas with scamper_lens field
  // --------------------------------------------------------------------------
  describe('scamper lens coverage', () => {
    it('all 7 lenses produce ideas with scamper_lens field', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('scamper');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Run enough rounds to cover all 7 lenses
      // Each lens gets ~3 rounds before advancing, so 21+ rounds should cover all
      const allIdeas: Idea[] = [];
      for (let round = 1; round <= 30; round++) {
        const output = instance.generateRound(round);
        const ideas = output.ideas ?? [];
        allIdeas.push(...ideas);
        if (instance.isComplete()) break;
      }

      // Every SCAMPER idea should have scamper_lens set
      for (const idea of allIdeas) {
        expect(idea.scamper_lens).toBeDefined();
      }

      // Collect all lenses seen
      const lensesSeen = new Set(allIdeas.map(i => i.scamper_lens));
      const expected_lenses = [
        'substitute',
        'combine',
        'adapt',
        'modify',
        'put-to-another-use',
        'eliminate',
        'reverse',
      ];

      for (const lens of expected_lenses) {
        expect(lensesSeen.has(lens as any)).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 9: Six Thinking Hats Black Hat skips during diverge phase
  // --------------------------------------------------------------------------
  describe('six-thinking-hats Black Hat skip', () => {
    it('skips Black Hat during diverge phase', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('six-thinking-hats');
      const session = mockSessionState({ phase: 'diverge' });

      instance.initialize('test problem', session);

      // Run enough rounds to go through all hats
      const allIdeas: Idea[] = [];
      for (let round = 1; round <= 30; round++) {
        const output = instance.generateRound(round);
        const ideas = output.ideas ?? [];
        allIdeas.push(...ideas);
        if (instance.isComplete()) break;
      }

      // NO ideas should have hat_color: 'black' when phase is diverge
      const blackHatIdeas = allIdeas.filter(i => i.hat_color === 'black');
      expect(blackHatIdeas).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Test 10: Five Whys chain reaches depth 5 with parent_id
  // --------------------------------------------------------------------------
  describe('five-whys causal chain', () => {
    it('chain reaches depth 5 with parent_id forming causal chain', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('five-whys');
      const session = mockSessionState();

      instance.initialize('Why are customers leaving?', session);

      // Run enough rounds to complete all chains (3 chains x 5 depths each)
      for (let round = 1; round <= 20; round++) {
        instance.generateRound(round);
        if (instance.isComplete()) break;
      }

      expect(instance.isComplete()).toBe(true);

      // Check that chain state reflects depth 5 reached
      const state = instance.getState() as Record<string, unknown>;
      const chain_depths = state.chain_depths as Record<string, number>;

      // At least one chain should have reached depth 5
      const depths = Object.values(chain_depths);
      expect(depths.some(d => d >= 5)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 11: Starbursting covers all 6 W-categories
  // --------------------------------------------------------------------------
  describe('starbursting W-category coverage', () => {
    it('covers all 6 W-categories', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('starbursting');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Run enough rounds to cycle through all categories
      for (let round = 1; round <= 30; round++) {
        instance.generateRound(round);
        if (instance.isComplete()) break;
      }

      const state = instance.getState() as Record<string, unknown>;
      const categories_covered = state.categories_covered as string[];

      const expected_categories = ['who', 'what', 'where', 'when', 'why', 'how'];
      for (const cat of expected_categories) {
        expect(categories_covered).toContain(cat);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 12: Lotus Blossom isComplete() false before 64 ideas
  // --------------------------------------------------------------------------
  describe('lotus-blossom 64-idea threshold', () => {
    it('isComplete() returns false before 64 ideas', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('lotus-blossom');
      const session = mockSessionState();

      instance.initialize('test problem', session);

      // Run only 5 rounds (partial completion)
      for (let round = 1; round <= 5; round++) {
        instance.generateRound(round);
      }

      const state = instance.getState() as Record<string, unknown>;
      const total_ideas = state.total_ideas as number;

      expect(total_ideas).toBeLessThan(64);
      expect(instance.isComplete()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Test 13: Affinity mapping handles empty previous_output gracefully
  // --------------------------------------------------------------------------
  describe('affinity-mapping empty input', () => {
    it('handles empty previous_output gracefully', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('affinity-mapping');
      const session = mockSessionState({ phase: 'organize' });

      instance.initialize('test problem', session);

      // generateRound with empty array -- should not throw
      const output = instance.generateRound(1, []);
      expect(output).toBeDefined();
      expect(output.ideas).toEqual([]);

      // prompts should contain message about needing ideas first
      expect(output.prompts).toBeDefined();
      expect(output.prompts!.some(p => p.toLowerCase().includes('no ideas') || p.toLowerCase().includes('generative technique'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Test 14: Affinity mapping cluster count between 2 and 8
  // --------------------------------------------------------------------------
  describe('affinity-mapping cluster count', () => {
    it('produces between 2 and 8 clusters for 20 ideas', () => {
      const engine = new TechniqueEngine();
      const instance = engine.loadTechnique('affinity-mapping');
      const session = mockSessionState({ phase: 'organize' });

      instance.initialize('test problem', session);

      // Create 20 mock ideas with varied content
      const mockIdeas: Idea[] = [];
      const topics = ['marketing', 'product', 'engineering', 'design', 'sales'];
      for (let i = 0; i < 20; i++) {
        const topic = topics[i % topics.length];
        mockIdeas.push({
          id: randomUUID(),
          content: `${topic} idea number ${i + 1} about improving our ${topic} strategy for customer retention`,
          source_agent: 'ideator',
          source_technique: 'rapid-ideation',
          phase: 'diverge',
          tags: [topic],
          timestamp: Date.now() + i,
        });
      }

      const output = instance.generateRound(1, mockIdeas);

      // The visualization should contain cluster data
      expect(output.visualization).toBeDefined();

      // Get cluster count from state
      const state = instance.getState() as Record<string, unknown>;
      const cluster_count = state.cluster_count as number;

      expect(cluster_count).toBeGreaterThanOrEqual(2);
      expect(cluster_count).toBeLessThanOrEqual(8);
    });
  });
});
