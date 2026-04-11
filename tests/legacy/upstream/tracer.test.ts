import { describe, it, expect } from 'vitest';
import type { ClassifiedEvent, AffectedComponent, ImpactManifest } from '../../src/upstream/types';
import {
  traceImpact,
  findDirectImpacts,
  findTransitiveImpacts,
  buildDependencyGraph,
  calculateBlastRadius,
} from '../../src/upstream/tracer';

/** Helper: build a minimal ClassifiedEvent for testing */
function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-test-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T00:00:00Z',
    content_hash_before: 'abc',
    content_hash_after: 'def',
    diff_summary: 'Updated skill format specification',
    raw_content: 'content',
    change_type: 'enhancement',
    severity: 'P2',
    domains: ['skills'],
    auto_patchable: true,
    summary: 'Skill format updated to v2',
    confidence: 0.9,
    ...overrides,
  };
}

describe('Impact Tracer', () => {
  describe('findDirectImpacts', () => {
    it('identifies direct impacts when component content references change domains', async () => {
      const event = makeEvent({ domains: ['skills', 'hooks'] });
      const components = ['skills/gsd-workflow/SKILL.md', 'skills/testing/SKILL.md', 'agents/planner.md'];
      const readFile = async (path: string): Promise<string> => {
        if (path.includes('gsd-workflow')) return 'This skill uses hooks and skill format v2';
        if (path.includes('testing')) return 'Testing framework with no relevant content';
        return 'Agent that orchestrates planning';
      };

      const impacts = await findDirectImpacts(event, components, readFile);

      expect(impacts.length).toBe(1);
      expect(impacts[0].component).toBe('skills/gsd-workflow/SKILL.md');
      expect(impacts[0].impact).toBe('direct');
    });
  });

  describe('findTransitiveImpacts', () => {
    it('identifies transitive impacts through dependency graph', () => {
      const directImpacts: AffectedComponent[] = [
        {
          component: 'skills/core/SKILL.md',
          impact: 'direct',
          status: 'active',
          blast_radius: 'core functionality',
          action: 'update',
          patchable: true,
        },
      ];
      const graph = new Map<string, string[]>([
        ['skills/core/SKILL.md', []],
        ['skills/workflow/SKILL.md', ['skills/core/SKILL.md']],
        ['skills/testing/SKILL.md', ['skills/workflow/SKILL.md']],
        ['skills/standalone/SKILL.md', []],
      ]);

      const transitive = findTransitiveImpacts(directImpacts, graph);

      const names = transitive.map((t) => t.component);
      expect(names).toContain('skills/workflow/SKILL.md');
      expect(names).toContain('skills/testing/SKILL.md');
      expect(names).not.toContain('skills/standalone/SKILL.md');
      for (const t of transitive) {
        expect(t.impact).toBe('transitive');
      }
    });
  });

  describe('classifies active vs dormant status correctly', () => {
    it('marks components with recent references as active', async () => {
      const event = makeEvent({ domains: ['api'] });
      const components = ['skills/api-caller/SKILL.md'];
      const readFile = async (): Promise<string> => 'Uses api endpoints for calling models';

      const impacts = await findDirectImpacts(event, components, readFile);

      expect(impacts.length).toBe(1);
      expect(impacts[0].status).toBe('active');
    });
  });

  describe('calculateBlastRadius', () => {
    it('calculates blast radius as count of affected components', () => {
      const components: AffectedComponent[] = [
        { component: 'a', impact: 'direct', status: 'active', blast_radius: '', action: '', patchable: true },
        { component: 'b', impact: 'transitive', status: 'active', blast_radius: '', action: '', patchable: true },
        { component: 'c', impact: 'transitive', status: 'dormant', blast_radius: '', action: '', patchable: false },
      ];

      expect(calculateBlastRadius(components)).toBe(3);
    });
  });

  describe('buildDependencyGraph', () => {
    it('scans skill and agent directories to build graph', async () => {
      const readDir = async (dir: string): Promise<string[]> => {
        if (dir.includes('skills')) return ['core', 'workflow'];
        if (dir.includes('agents')) return ['planner.md'];
        return [];
      };
      const readFile = async (path: string): Promise<string> => {
        if (path.includes('workflow')) return '# Workflow\nDepends on: skills/core/SKILL.md\nUses core patterns';
        if (path.includes('core')) return '# Core\nBase skill';
        if (path.includes('planner')) return '# Planner\nUses skills/workflow/SKILL.md';
        return '';
      };

      const graph = await buildDependencyGraph('.claude/skills', '.claude/agents', { readDir, readFile });

      expect(graph.size).toBeGreaterThan(0);
      const workflowDeps = graph.get('skills/workflow/SKILL.md');
      expect(workflowDeps).toBeDefined();
      expect(workflowDeps).toContain('skills/core/SKILL.md');
    });
  });

  describe('traceImpact', () => {
    it('generates complete impact manifest', async () => {
      const event = makeEvent({ id: 'evt-full', domains: ['skills'] });
      const readDir = async (dir: string): Promise<string[]> => {
        if (dir.includes('skills')) return ['target'];
        return [];
      };
      const readFile = async (path: string): Promise<string> => {
        if (path.includes('target')) return 'This skill handles skills management';
        return '';
      };

      const manifest = await traceImpact(event, { readDir, readFile });

      expect(manifest.change_id).toBe('evt-full');
      expect(manifest.classification).toBe(event);
      expect(manifest.total_blast_radius).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(manifest.affected_components)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty dependency graph gracefully', () => {
      const directImpacts: AffectedComponent[] = [
        { component: 'x', impact: 'direct', status: 'active', blast_radius: '', action: '', patchable: true },
      ];
      const graph = new Map<string, string[]>();

      const transitive = findTransitiveImpacts(directImpacts, graph);
      expect(transitive).toEqual([]);
    });

    it('handles circular dependencies without infinite loop', () => {
      const directImpacts: AffectedComponent[] = [
        { component: 'a', impact: 'direct', status: 'active', blast_radius: '', action: '', patchable: true },
      ];
      const graph = new Map<string, string[]>([
        ['a', []],
        ['b', ['a']],
        ['c', ['b']],
        ['a', ['c']], // circular: a -> c -> b -> a
      ]);

      // Must complete without hanging
      const transitive = findTransitiveImpacts(directImpacts, graph);
      expect(Array.isArray(transitive)).toBe(true);
      // Should still find b and c as transitive
      const names = transitive.map((t) => t.component);
      expect(names).toContain('b');
      expect(names).toContain('c');
    });

    it('returns empty components for unrelated change', async () => {
      const event = makeEvent({ domains: ['availability', 'outages'] });
      const components = ['skills/workflow/SKILL.md'];
      const readFile = async (): Promise<string> => 'A skill about code formatting with prettier';

      const impacts = await findDirectImpacts(event, components, readFile);
      expect(impacts).toEqual([]);
    });
  });
});
