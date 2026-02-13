/**
 * Tests for the pre-wiring engine.
 *
 * Validates conversion of ResourceManifest into PreWiringResult
 * for embedding in planning docs. Covers all 5 topology types,
 * edge cases (empty manifests, all-missing skills), and markdown output.
 *
 * @module staging/queue/pre-wiring.test
 */

import { describe, it, expect } from 'vitest';
import { generatePreWiring } from './pre-wiring.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Build a minimal valid ResourceManifest with overrides. */
function makeManifest(overrides: Partial<ResourceManifest> = {}): ResourceManifest {
  return {
    visionAnalysis: {
      requirements: [],
      complexity: [],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'low',
      summary: 'Test vision',
    },
    skillMatches: [],
    topology: {
      topology: 'single',
      rationale: 'Simple task',
      confidence: 0.9,
      agentCount: 1,
    },
    tokenBudget: {
      total: 50000,
      categories: {
        'skill-loading': 5000,
        planning: 15000,
        execution: 20000,
        research: 3000,
        verification: 3000,
        hitl: 2000,
        'safety-margin': 2000,
      },
      contextWindowSize: 200000,
      utilizationPercent: 25,
    },
    decomposition: {
      subtasks: [],
      criticalPath: [],
      maxParallelism: 1,
      sharedResources: [],
    },
    hitlPredictions: [],
    queueContext: {
      priority: 4,
      estimatedDuration: '10m',
      tags: ['testing'],
    },
    generatedAt: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Single topology
// ============================================================================

describe('generatePreWiring', () => {
  describe('single topology', () => {
    it('assigns all ready skills to a single agent', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'auth-skill', status: 'ready', relevance: 0.85, reason: 'Match', scope: 'project' },
          { skillName: 'db-skill', status: 'ready', relevance: 0.7, reason: 'Match', scope: 'user' },
        ],
        topology: { topology: 'single', rationale: 'Simple', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-001' });

      expect(result.entryId).toBe('q-20260115-001');
      expect(result.skills).toHaveLength(2);
      expect(result.skills[0]).toEqual({
        name: 'auth-skill',
        status: 'ready',
        relevance: 0.85,
        scope: 'project',
      });
      expect(result.skills[1]).toEqual({
        name: 'db-skill',
        status: 'ready',
        relevance: 0.7,
        scope: 'user',
      });
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].role).toBe('executor');
      expect(result.agents[0].skills).toEqual(['auth-skill', 'db-skill']);
      expect(result.gaps).toHaveLength(0);
    });

    it('includes flagged skills alongside ready skills', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'ready-skill', status: 'ready', relevance: 0.8, reason: 'Match', scope: 'project' },
          { skillName: 'flagged-skill', status: 'flagged', relevance: 0.45, reason: 'Flagged', scope: 'user' },
        ],
        topology: { topology: 'single', rationale: 'Simple', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-002' });

      expect(result.skills).toHaveLength(2);
      expect(result.skills[1].status).toBe('flagged');
      expect(result.agents[0].skills).toEqual(['ready-skill', 'flagged-skill']);
    });
  });

  // ============================================================================
  // Pipeline topology
  // ============================================================================

  describe('pipeline topology', () => {
    it('distributes skills round-robin across pipeline stages', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'skill-a', status: 'ready', relevance: 0.9, reason: 'Match' },
          { skillName: 'skill-b', status: 'ready', relevance: 0.8, reason: 'Match' },
          { skillName: 'skill-c', status: 'ready', relevance: 0.7, reason: 'Match' },
          { skillName: 'missing-skill', status: 'missing', relevance: 0.0, reason: 'Not found' },
        ],
        topology: { topology: 'pipeline', rationale: 'Sequential stages', confidence: 0.8, agentCount: 2 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-003' });

      // Only non-missing skills included
      expect(result.skills).toHaveLength(3);
      // 2 agents as pipeline stages
      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].role).toBe('stage-1');
      expect(result.agents[1].role).toBe('stage-2');
      // Round-robin: a->1, b->2, c->1
      expect(result.agents[0].skills).toEqual(['skill-a', 'skill-c']);
      expect(result.agents[1].skills).toEqual(['skill-b']);
      // 1 gap from missing skill
      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0]).toContain('missing-skill');
    });
  });

  // ============================================================================
  // Map-reduce topology
  // ============================================================================

  describe('map-reduce topology', () => {
    it('assigns coordinator and workers with skill distribution', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'coord-skill', status: 'ready', relevance: 0.9, reason: 'Match' },
          { skillName: 'worker-a', status: 'ready', relevance: 0.8, reason: 'Match' },
          { skillName: 'worker-b', status: 'flagged', relevance: 0.5, reason: 'Flagged' },
        ],
        topology: { topology: 'map-reduce', rationale: 'Parallelizable', confidence: 0.85, agentCount: 3 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-004' });

      expect(result.agents).toHaveLength(3);
      // Coordinator gets first skill
      expect(result.agents[0].role).toBe('coordinator');
      expect(result.agents[0].skills).toEqual(['coord-skill']);
      // Workers split the rest
      expect(result.agents[1].role).toBe('worker-1');
      expect(result.agents[1].skills).toEqual(['worker-a']);
      expect(result.agents[2].role).toBe('worker-2');
      expect(result.agents[2].skills).toEqual(['worker-b']);
    });
  });

  // ============================================================================
  // Router topology
  // ============================================================================

  describe('router topology', () => {
    it('assigns router with no skills and handlers with all skills', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'handler-a', status: 'ready', relevance: 0.9, reason: 'Match' },
          { skillName: 'handler-b', status: 'ready', relevance: 0.7, reason: 'Match' },
        ],
        topology: { topology: 'router', rationale: 'Routing pattern', confidence: 0.75, agentCount: 3 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-005' });

      expect(result.agents).toHaveLength(3);
      // Router gets no skills
      expect(result.agents[0].role).toBe('router');
      expect(result.agents[0].skills).toEqual([]);
      // Handlers split all skills
      expect(result.agents[1].role).toBe('handler-1');
      expect(result.agents[1].skills).toEqual(['handler-a']);
      expect(result.agents[2].role).toBe('handler-2');
      expect(result.agents[2].skills).toEqual(['handler-b']);
    });
  });

  // ============================================================================
  // Hybrid topology
  // ============================================================================

  describe('hybrid topology', () => {
    it('uses pipeline-style distribution (best general strategy)', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'skill-x', status: 'ready', relevance: 0.9, reason: 'Match' },
          { skillName: 'skill-y', status: 'ready', relevance: 0.8, reason: 'Match' },
          { skillName: 'skill-z', status: 'recommended', relevance: 0.6, reason: 'Recommended' },
        ],
        topology: { topology: 'hybrid', rationale: 'Mixed', confidence: 0.7, agentCount: 2 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-006' });

      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].role).toBe('stage-1');
      expect(result.agents[1].role).toBe('stage-2');
      // Round-robin: x->1, y->2, z->1
      expect(result.agents[0].skills).toEqual(['skill-x', 'skill-z']);
      expect(result.agents[1].skills).toEqual(['skill-y']);
    });
  });

  // ============================================================================
  // Topology output
  // ============================================================================

  describe('topology output', () => {
    it('maps topology recommendation to PreWiredTopology', () => {
      const manifest = makeManifest({
        topology: { topology: 'pipeline', rationale: 'Sequential work', confidence: 0.8, agentCount: 3 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-007' });

      expect(result.topology).toEqual({
        type: 'pipeline',
        agentCount: 3,
        rationale: 'Sequential work',
        confidence: 0.8,
      });
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================

  describe('edge cases', () => {
    it('handles empty manifest (no skills, no requirements)', () => {
      const manifest = makeManifest({
        skillMatches: [],
        topology: { topology: 'single', rationale: 'No skills', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-008' });

      expect(result.skills).toHaveLength(0);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].role).toBe('executor');
      expect(result.agents[0].skills).toEqual([]);
      expect(result.gaps).toHaveLength(0);
    });

    it('handles manifest with only missing skills', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'missing-a', status: 'missing', relevance: 0.0, reason: 'Not found' },
          { skillName: 'missing-b', status: 'missing', relevance: 0.0, reason: 'Not found' },
        ],
        topology: { topology: 'single', rationale: 'All missing', confidence: 0.5, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-009' });

      expect(result.skills).toHaveLength(0);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].skills).toEqual([]);
      expect(result.gaps).toHaveLength(2);
      expect(result.gaps[0]).toContain('missing-a');
      expect(result.gaps[1]).toContain('missing-b');
    });

    it('includes recommended skills in agent assignment', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'rec-skill', status: 'recommended', relevance: 0.35, reason: 'Recommended' },
        ],
        topology: { topology: 'single', rationale: 'Simple', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-010' });

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].status).toBe('recommended');
      expect(result.agents[0].skills).toEqual(['rec-skill']);
    });
  });

  // ============================================================================
  // Markdown output
  // ============================================================================

  describe('markdown output', () => {
    it('generates well-formatted markdown with all sections', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'auth-skill', status: 'ready', relevance: 0.85, reason: 'Match', scope: 'project' },
          { skillName: 'flagged-skill', status: 'flagged', relevance: 0.45, reason: 'Flagged', scope: 'user' },
          { skillName: 'missing-skill', status: 'missing', relevance: 0.0, reason: 'Not found' },
        ],
        topology: { topology: 'pipeline', rationale: 'Sequential', confidence: 0.8, agentCount: 2 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-011' });

      expect(result.markdown).toContain('## Pre-Wired Resources');
      expect(result.markdown).toContain('### Skills');
      expect(result.markdown).toContain('[ready] auth-skill (project, relevance: 0.85)');
      expect(result.markdown).toContain('[flagged] flagged-skill (user, relevance: 0.45)');
      expect(result.markdown).toContain('### Topology');
      expect(result.markdown).toContain('Type: pipeline (confidence: 0.8)');
      expect(result.markdown).toContain('Agents: 2');
      expect(result.markdown).toContain('### Agent Assignments');
      expect(result.markdown).toContain('### Gaps');
      expect(result.markdown).toContain('missing-skill');
    });

    it('omits gaps section when no missing skills', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'skill-a', status: 'ready', relevance: 0.9, reason: 'Match' },
        ],
        topology: { topology: 'single', rationale: 'Simple', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-012' });

      expect(result.markdown).not.toContain('### Gaps');
    });

    it('shows scope as unknown when not specified', () => {
      const manifest = makeManifest({
        skillMatches: [
          { skillName: 'no-scope', status: 'ready', relevance: 0.7, reason: 'Match' },
        ],
        topology: { topology: 'single', rationale: 'Simple', confidence: 0.9, agentCount: 1 },
      });

      const result = generatePreWiring({ manifest, entryId: 'q-20260115-013' });

      expect(result.markdown).toContain('[ready] no-scope (unknown, relevance: 0.7)');
    });
  });
});
