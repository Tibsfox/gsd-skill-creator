/**
 * Tests for PropagationGraph and PropagationGraphBuilder.
 */

import { describe, it, expect } from 'vitest';
import {
  PropagationGraph,
  PropagationGraphBuilder,
  FAILURE_CATEGORIES,
} from '../propagation-graph.js';
import type { FailureNode, PropagationEdge } from '../propagation-graph.js';

// ─── Helper ─────────────────────────────────────────────────────────────────

function makeNode(id: string, overrides: Partial<FailureNode> = {}): FailureNode {
  return {
    id,
    label: overrides.label ?? `Failure ${id}`,
    category: overrides.category ?? 'tool-misuse',
    role: overrides.role ?? 'intermediate',
    severity: overrides.severity ?? 'medium',
    observedAt: new Date().toISOString(),
    description: overrides.description ?? `Description for ${id}`,
    evidence: overrides.evidence ?? [],
    phase: overrides.phase,
    agent: overrides.agent,
    files: overrides.files,
  };
}

// ─── Basic construction ─────────────────────────────────────────────────────

describe('PropagationGraph', () => {
  it('starts empty', () => {
    const g = new PropagationGraph();
    expect(g.nodeCount).toBe(0);
    expect(g.edgeCount).toBe(0);
  });

  it('adds nodes', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    g.addNode(makeNode('B'));
    expect(g.nodeCount).toBe(2);
    expect(g.getNode('A')?.id).toBe('A');
  });

  it('adds edges between existing nodes', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    g.addNode(makeNode('B'));
    g.addEdge({ from: 'A', to: 'B', type: 'data-dependency', confidence: 0.9, mechanism: 'A output feeds B' });
    expect(g.edgeCount).toBe(1);
  });

  it('throws on edge with missing source node', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('B'));
    expect(() => g.addEdge({
      from: 'MISSING', to: 'B', type: 'data-dependency', confidence: 0.9, mechanism: 'test',
    })).toThrow("source node 'MISSING' not found");
  });

  it('throws on edge with missing target node', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    expect(() => g.addEdge({
      from: 'A', to: 'MISSING', type: 'data-dependency', confidence: 0.9, mechanism: 'test',
    })).toThrow("target node 'MISSING' not found");
  });
});

// ─── Topology ───────────────────────────────────────────────────────────────

describe('PropagationGraph topology', () => {
  function buildChain(): PropagationGraph {
    // A → B → C → D (linear chain)
    const g = new PropagationGraph();
    g.addNode(makeNode('A', { category: 'context-overflow' }));
    g.addNode(makeNode('B', { category: 'dependency-failure' }));
    g.addNode(makeNode('C', { category: 'schema-violation' }));
    g.addNode(makeNode('D', { category: 'state-corruption' }));
    g.addEdge({ from: 'A', to: 'B', type: 'data-dependency', confidence: 0.9, mechanism: 'A overflows → B gets truncated input' });
    g.addEdge({ from: 'B', to: 'C', type: 'phase-sequence', confidence: 0.8, mechanism: 'B fails → C gets wrong deps' });
    g.addEdge({ from: 'C', to: 'D', type: 'file-dependency', confidence: 0.7, mechanism: 'C writes bad schema → D reads it' });
    return g;
  }

  it('identifies root causes (no incoming edges)', () => {
    const g = buildChain();
    const roots = g.rootCauses();
    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('A');
  });

  it('identifies terminal symptoms (no outgoing edges)', () => {
    const g = buildChain();
    const symptoms = g.terminalSymptoms();
    expect(symptoms.length).toBe(1);
    expect(symptoms[0].id).toBe('D');
  });

  it('computes effects of a node', () => {
    const g = buildChain();
    const effects = g.effectsOf('A');
    expect(effects.length).toBe(1);
    expect(effects[0].id).toBe('B');
  });

  it('computes causes of a node', () => {
    const g = buildChain();
    const causes = g.causesOf('D');
    expect(causes.length).toBe(1);
    expect(causes[0].id).toBe('C');
  });

  it('computes blast radius', () => {
    const g = buildChain();
    expect(g.blastRadius('A')).toBe(3); // B, C, D
    expect(g.blastRadius('B')).toBe(2); // C, D
    expect(g.blastRadius('C')).toBe(1); // D
    expect(g.blastRadius('D')).toBe(0); // terminal
  });

  it('computes ancestors', () => {
    const g = buildChain();
    const anc = g.ancestors('D');
    expect(anc.length).toBe(3);
    expect(anc.map(n => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('finds critical path (longest chain)', () => {
    const g = buildChain();
    const path = g.criticalPath();
    expect(path.map(n => n.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('maxDepth is path length minus 1', () => {
    const g = buildChain();
    expect(g.maxDepth()).toBe(3);
  });
});

// ─── Diamond graph ──────────────────────────────────────────────────────────

describe('PropagationGraph diamond topology', () => {
  function buildDiamond(): PropagationGraph {
    //   A
    //  / \
    // B   C
    //  \ /
    //   D
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    g.addNode(makeNode('B'));
    g.addNode(makeNode('C'));
    g.addNode(makeNode('D'));
    g.addEdge({ from: 'A', to: 'B', type: 'agent-delegation', confidence: 0.9, mechanism: 'A spawns B' });
    g.addEdge({ from: 'A', to: 'C', type: 'agent-delegation', confidence: 0.9, mechanism: 'A spawns C' });
    g.addEdge({ from: 'B', to: 'D', type: 'shared-state', confidence: 0.8, mechanism: 'B corrupts state D reads' });
    g.addEdge({ from: 'C', to: 'D', type: 'shared-state', confidence: 0.8, mechanism: 'C corrupts state D reads' });
    return g;
  }

  it('diamond has one root and one symptom', () => {
    const g = buildDiamond();
    expect(g.rootCauses().length).toBe(1);
    expect(g.rootCauses()[0].id).toBe('A');
    expect(g.terminalSymptoms().length).toBe(1);
    expect(g.terminalSymptoms()[0].id).toBe('D');
  });

  it('blast radius of root covers all descendants', () => {
    const g = buildDiamond();
    expect(g.blastRadius('A')).toBe(3);
  });

  it('D has two causes', () => {
    const g = buildDiamond();
    expect(g.causesOf('D').length).toBe(2);
  });
});

// ─── Analysis ───────────────────────────────────────────────────────────────

describe('PropagationGraph analysis', () => {
  it('produces complete analysis', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('R', { category: 'context-overflow', severity: 'critical' }));
    g.addNode(makeNode('I', { category: 'dependency-failure', severity: 'high' }));
    g.addNode(makeNode('S', { category: 'state-corruption', severity: 'medium' }));
    g.addEdge({ from: 'R', to: 'I', type: 'data-dependency', confidence: 0.9, mechanism: 'overflow' });
    g.addEdge({ from: 'I', to: 'S', type: 'file-dependency', confidence: 0.8, mechanism: 'bad deps' });

    const analysis = g.analyze();
    expect(analysis.rootCauses.length).toBe(1);
    expect(analysis.terminalSymptoms.length).toBe(1);
    expect(analysis.criticalPath.length).toBe(3);
    expect(analysis.maxDepth).toBe(2);
    expect(analysis.blastRadius.get('R')).toBe(2);
  });

  it('assignRoles correctly labels topology', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    g.addNode(makeNode('B'));
    g.addNode(makeNode('C'));
    g.addEdge({ from: 'A', to: 'B', type: 'phase-sequence', confidence: 1, mechanism: 'seq' });
    g.addEdge({ from: 'B', to: 'C', type: 'phase-sequence', confidence: 1, mechanism: 'seq' });
    g.assignRoles();

    expect(g.getNode('A')?.role).toBe('root-cause');
    expect(g.getNode('B')?.role).toBe('intermediate');
    expect(g.getNode('C')?.role).toBe('symptom');
  });
});

// ─── Builder ────────────────────────────────────────────────────────────────

describe('PropagationGraphBuilder', () => {
  it('builds a graph with the builder API', () => {
    const b = new PropagationGraphBuilder();

    const root = b.rootCause({
      label: 'Context window exhaustion',
      category: 'context-overflow',
      severity: 'critical',
      description: 'Agent hit 200K token limit during phase 3 execution',
      phase: 'phase-3',
      agent: 'gsd-executor',
      evidence: ['git log shows 15 retry commits'],
    });

    const mid = b.effect({
      label: 'Plan file corruption',
      category: 'state-corruption',
      severity: 'high',
      description: 'PLAN.md was partially overwritten during context reset',
      files: ['.planning/phases/phase-3/PLAN.md'],
    });

    const symptom = b.effect({
      label: 'Phase 4 skipped wrong files',
      category: 'scope-drift',
      severity: 'medium',
      description: 'Phase 4 executor read the corrupt plan and operated on wrong files',
      phase: 'phase-4',
      agent: 'gsd-executor',
    });

    b.link(root, mid, 'shared-state', 'Context reset caused partial write to PLAN.md');
    b.link(mid, symptom, 'file-dependency', 'Phase 4 read corrupt PLAN.md');

    const graph = b.build();

    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(2);
    expect(graph.rootCauses().length).toBe(1);
    expect(graph.rootCauses()[0].label).toBe('Context window exhaustion');
    expect(graph.terminalSymptoms()[0].label).toBe('Phase 4 skipped wrong files');
    expect(graph.blastRadius(root)).toBe(2);
  });
});

// ─── Filtering ──────────────────────────────────────────────────────────────

describe('PropagationGraph filtering', () => {
  it('filters nodes by category', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A', { category: 'timeout' }));
    g.addNode(makeNode('B', { category: 'timeout' }));
    g.addNode(makeNode('C', { category: 'loop-detected' }));

    expect(g.nodesByCategory('timeout').length).toBe(2);
    expect(g.nodesByCategory('loop-detected').length).toBe(1);
    expect(g.nodesByCategory('tool-misuse').length).toBe(0);
  });

  it('filters nodes by phase', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A', { phase: 'phase-3' }));
    g.addNode(makeNode('B', { phase: 'phase-3' }));
    g.addNode(makeNode('C', { phase: 'phase-5' }));

    expect(g.nodesByPhase('phase-3').length).toBe(2);
  });

  it('filters edges by type', () => {
    const g = new PropagationGraph();
    g.addNode(makeNode('A'));
    g.addNode(makeNode('B'));
    g.addNode(makeNode('C'));
    g.addEdge({ from: 'A', to: 'B', type: 'data-dependency', confidence: 0.9, mechanism: 'x' });
    g.addEdge({ from: 'B', to: 'C', type: 'file-dependency', confidence: 0.8, mechanism: 'y' });

    expect(g.edgesByType('data-dependency').length).toBe(1);
    expect(g.edgesByType('file-dependency').length).toBe(1);
    expect(g.edgesByType('agent-delegation').length).toBe(0);
  });
});

// ─── Constants ──────────────────────────────────────────────────────────────

describe('failure taxonomy', () => {
  it('has 9 categories', () => {
    expect(FAILURE_CATEGORIES.length).toBe(9);
  });
});
