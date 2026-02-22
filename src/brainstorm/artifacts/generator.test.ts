/**
 * ArtifactGenerator integration tests.
 *
 * Tests all 4 output formats: transcript (phase headers, technique labels,
 * idea content), action plan (source_idea_ids tracing, missing source
 * handling), JSON export (parseable), and cluster map (grouping with
 * unassigned section).
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ArtifactGenerator } from './generator.js';
import type { SessionState, Idea, ActionItem, Cluster } from '../shared/types.js';

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
      phase_history: [{ phase: 'explore', entered_at: Date.now() }],
    },
    ...overrides,
  };
}

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: randomUUID(),
    content: 'Test idea content',
    source_agent: 'ideator',
    source_technique: 'freewriting',
    phase: 'diverge',
    tags: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ArtifactGenerator', () => {
  // --------------------------------------------------------------------------
  // Test 1: generateTranscript contains phase headers
  // --------------------------------------------------------------------------
  describe('generateTranscript', () => {
    it('contains phase headers', () => {
      const generator = new ArtifactGenerator();
      const session = mockSessionState({
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          total_ideas: 0,
          total_questions: 0,
          techniques_used: ['freewriting'],
          phase_history: [
            { phase: 'diverge', entered_at: Date.now() },
            { phase: 'organize', entered_at: Date.now() + 1000 },
          ],
        },
      });

      const transcript = generator.generateTranscript(session);

      expect(transcript).toContain('## Phase: Diverge');
      expect(transcript).toContain('## Phase: Organize');
    });

    // --------------------------------------------------------------------------
    // Test 2: generateTranscript contains technique labels
    // --------------------------------------------------------------------------
    it('contains technique labels', () => {
      const generator = new ArtifactGenerator();

      const idea1 = makeIdea({
        source_technique: 'freewriting',
        phase: 'diverge',
        content: 'Freewriting idea about reducing churn',
      });
      const idea2 = makeIdea({
        source_technique: 'scamper',
        phase: 'diverge',
        content: 'SCAMPER idea about substituting',
        scamper_lens: 'substitute',
      });

      const session = mockSessionState({
        ideas: [idea1, idea2],
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          total_ideas: 2,
          total_questions: 0,
          techniques_used: ['freewriting', 'scamper'],
          phase_history: [
            { phase: 'diverge', entered_at: Date.now() },
          ],
        },
      });

      const transcript = generator.generateTranscript(session);

      expect(transcript).toContain('Technique: Freewriting');
      expect(transcript).toContain('Technique: Scamper');
    });

    // --------------------------------------------------------------------------
    // Test 3: generateTranscript contains idea content
    // --------------------------------------------------------------------------
    it('contains idea content', () => {
      const generator = new ArtifactGenerator();

      const ideas = [
        makeIdea({ content: 'Loyalty program for power users', phase: 'diverge' }),
        makeIdea({ content: 'Reduce friction in onboarding flow', phase: 'diverge' }),
        makeIdea({ content: 'Weekly engagement nudge emails', phase: 'diverge' }),
      ];

      const session = mockSessionState({
        ideas,
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          total_ideas: 3,
          total_questions: 0,
          techniques_used: ['freewriting'],
          phase_history: [
            { phase: 'diverge', entered_at: Date.now() },
          ],
        },
      });

      const transcript = generator.generateTranscript(session);

      for (const idea of ideas) {
        expect(transcript).toContain(idea.content);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: generateActionPlan includes source_idea_ids traced to content
  // --------------------------------------------------------------------------
  describe('generateActionPlan', () => {
    it('includes source_idea_ids traced to content', () => {
      const generator = new ArtifactGenerator();

      const sourceIdea = makeIdea({
        content: 'Implement automated onboarding wizard',
      });

      const actionItem: ActionItem = {
        id: randomUUID(),
        description: 'Build onboarding wizard prototype',
        source_idea_ids: [sourceIdea.id],
        owner: 'Engineering',
        deadline: '2026-03-15',
        priority: 'high',
        status: 'proposed',
      };

      const session = mockSessionState({
        ideas: [sourceIdea],
        action_items: [actionItem],
      });

      const plan = generator.generateActionPlan(session);

      // The action plan should contain the source idea text
      expect(plan).toContain('Implement automated onboarding wizard');
      // And the action description
      expect(plan).toContain('Build onboarding wizard prototype');
    });

    // --------------------------------------------------------------------------
    // Test 5: generateActionPlan handles missing source idea gracefully
    // --------------------------------------------------------------------------
    it('handles missing source idea gracefully', () => {
      const generator = new ArtifactGenerator();

      const nonexistentId = randomUUID();
      const actionItem: ActionItem = {
        id: randomUUID(),
        description: 'Orphaned action item',
        source_idea_ids: [nonexistentId],
        priority: 'medium',
        status: 'proposed',
      };

      const session = mockSessionState({
        ideas: [], // no ideas to match
        action_items: [actionItem],
      });

      // Should not throw
      const plan = generator.generateActionPlan(session);
      expect(plan).toContain('No source idea linked');
    });
  });

  // --------------------------------------------------------------------------
  // Test 6: generateJsonExport produces parseable JSON
  // --------------------------------------------------------------------------
  describe('generateJsonExport', () => {
    it('produces parseable JSON with expected keys', () => {
      const generator = new ArtifactGenerator();
      const session = mockSessionState();

      const result = generator.generateJsonExport(session);

      // Should not throw when parsed
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('phase');
      expect(parsed).toHaveProperty('ideas');
    });
  });

  // --------------------------------------------------------------------------
  // Test 7: generateClusterMap groups ideas by cluster with unassigned section
  // --------------------------------------------------------------------------
  describe('generateClusterMap', () => {
    it('groups ideas by cluster with unassigned section', () => {
      const generator = new ArtifactGenerator();

      const idea1 = makeIdea({ content: 'Marketing campaign idea' });
      const idea2 = makeIdea({ content: 'Product feature idea' });
      const idea3 = makeIdea({ content: 'Unassigned orphan idea' });

      const cluster1: Cluster = {
        id: randomUUID(),
        label: 'Marketing Strategies',
        idea_ids: [idea1.id],
        theme: 'Marketing approaches for retention',
      };

      const cluster2: Cluster = {
        id: randomUUID(),
        label: 'Product Features',
        idea_ids: [idea2.id],
        theme: 'New feature development ideas',
      };

      const session = mockSessionState({
        ideas: [idea1, idea2, idea3],
        clusters: [cluster1, cluster2],
      });

      const clusterMap = generator.generateClusterMap(session);

      // Should contain both cluster labels
      expect(clusterMap).toContain('Marketing Strategies');
      expect(clusterMap).toContain('Product Features');

      // Should contain unassigned section for idea3
      expect(clusterMap).toContain('Unassigned Ideas');
      expect(clusterMap).toContain('Unassigned orphan idea');
    });
  });
});
