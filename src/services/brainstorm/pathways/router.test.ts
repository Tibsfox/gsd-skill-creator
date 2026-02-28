/**
 * PathwayRouter integration tests.
 *
 * Tests signal word routing for all pathway types, free-form fallback,
 * technique queue ordering, and adaptation signal handling (low_energy,
 * user_request, completed technique filtering).
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { PathwayRouter } from './router.js';
import type { AdaptationSignal } from './router.js';
import type { SessionState } from '../shared/types.js';

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

describe('PathwayRouter', () => {
  // --------------------------------------------------------------------------
  // Test 1: Routes problem-solving signal words
  // --------------------------------------------------------------------------
  describe('recommendPathway', () => {
    it('routes "how might we reduce customer churn" to problem-solving', () => {
      const router = new PathwayRouter();
      const result = router.recommendPathway('how might we reduce customer churn');
      expect(result).toBe('problem-solving');
    });

    // --------------------------------------------------------------------------
    // Test 2: Routes creative-exploration signal words
    // --------------------------------------------------------------------------
    it('routes "imagine new possibilities for our product" to creative-exploration', () => {
      const router = new PathwayRouter();
      const result = router.recommendPathway('imagine new possibilities for our product');
      expect(result).toBe('creative-exploration');
    });

    // --------------------------------------------------------------------------
    // Test 3: Returns free-form for unrecognized input
    // --------------------------------------------------------------------------
    it('returns free-form for unrecognized input', () => {
      const router = new PathwayRouter();
      const result = router.recommendPathway('xyz abc 123');
      expect(result).toBe('free-form');
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: getPathway('free-form') returns empty technique_sequence
  // --------------------------------------------------------------------------
  describe('getPathway', () => {
    it('free-form returns empty technique_sequence', () => {
      const router = new PathwayRouter();
      const pathway = router.getPathway('free-form');
      expect(pathway.technique_sequence).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Test 5: getTechniqueQueue returns ordered technique IDs for problem-solving
  // --------------------------------------------------------------------------
  describe('getTechniqueQueue', () => {
    it('returns ordered technique IDs for problem-solving', () => {
      const router = new PathwayRouter();
      const queue = router.getTechniqueQueue('problem-solving');

      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0]).toBe('question-brainstorming');
    });
  });

  // --------------------------------------------------------------------------
  // Test 6: adaptTechniqueQueue - low_energy inserts rapid-ideation
  // --------------------------------------------------------------------------
  describe('adaptTechniqueQueue', () => {
    it('low_energy signal inserts rapid-ideation or rolestorming early', () => {
      const router = new PathwayRouter();
      const session = mockSessionState();

      const signal: AdaptationSignal = {
        type: 'low_energy',
        completed_techniques: [],
      };

      const result = router.adaptTechniqueQueue(
        ['mind-mapping', 'affinity-mapping'],
        signal,
        session,
      );

      // rapid-ideation or rolestorming should appear early in the queue
      const highEnergyEarly = result[0] === 'rapid-ideation' || result[0] === 'rolestorming';
      expect(highEnergyEarly).toBe(true);
    });

    // --------------------------------------------------------------------------
    // Test 7: user_request moves requested technique to front
    // --------------------------------------------------------------------------
    it('user_request moves requested technique to front', () => {
      const router = new PathwayRouter();
      const session = mockSessionState();

      const signal: AdaptationSignal = {
        type: 'user_request',
        requested_technique: 'scamper',
      };

      const result = router.adaptTechniqueQueue(
        ['freewriting', 'mind-mapping'],
        signal,
        session,
      );

      expect(result[0]).toBe('scamper');
    });

    // --------------------------------------------------------------------------
    // Test 8: Does not reintroduce completed techniques
    // --------------------------------------------------------------------------
    it('does not modify completed techniques', () => {
      const router = new PathwayRouter();
      const session = mockSessionState({
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          total_ideas: 0,
          total_questions: 0,
          techniques_used: ['freewriting'],
          phase_history: [{ phase: 'diverge', entered_at: Date.now() }],
        },
      });

      const signal: AdaptationSignal = {
        type: 'low_energy',
        completed_techniques: ['freewriting'],
      };

      const result = router.adaptTechniqueQueue(
        ['mind-mapping'],
        signal,
        session,
      );

      // freewriting was completed and shouldn't reappear
      expect(result).not.toContain('freewriting');
    });
  });
});
