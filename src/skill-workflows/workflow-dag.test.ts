/**
 * Tests for WorkflowDAG class.
 *
 * Covers:
 * - Linear chain topological order
 * - Diamond dependency topological order
 * - Circular dependency detection
 * - getReadySteps with various completion states
 * - fromSteps static factory
 */

import { describe, it, expect } from 'vitest';
import { WorkflowDAG } from './workflow-dag.js';
import type { WorkflowStep } from './types.js';

// ============================================================================
// detectCycles / topological order
// ============================================================================

describe('WorkflowDAG.detectCycles', () => {
  it('linear chain A->B->C produces topological order [A,B,C]', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'B'); // A must complete before B
    dag.addEdge('B', 'C'); // B must complete before C

    const result = dag.detectCycles();
    expect(result.hasCycle).toBe(false);
    expect(result.topologicalOrder).toEqual(['A', 'B', 'C']);
    expect(result.cycle).toBeUndefined();
  });

  it('diamond A->{B,C}->D produces valid topological order', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addNode('D');
    dag.addEdge('A', 'B');
    dag.addEdge('A', 'C');
    dag.addEdge('B', 'D');
    dag.addEdge('C', 'D');

    const result = dag.detectCycles();
    expect(result.hasCycle).toBe(false);
    expect(result.topologicalOrder).toBeDefined();

    const order = result.topologicalOrder!;
    // A must come before B and C
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'));
    // B and C must come before D
    expect(order.indexOf('B')).toBeLessThan(order.indexOf('D'));
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'));
  });

  it('circular A->B->A detects cycle', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');
    dag.addEdge('B', 'A');

    const result = dag.detectCycles();
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle!.length).toBeGreaterThanOrEqual(2);
    expect(result.topologicalOrder).toBeUndefined();
  });

  it('three-node cycle A->B->C->A detects cycle', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'B');
    dag.addEdge('B', 'C');
    dag.addEdge('C', 'A');

    const result = dag.detectCycles();
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
  });

  it('single node with no edges has topological order of one', () => {
    const dag = new WorkflowDAG();
    dag.addNode('solo');

    const result = dag.detectCycles();
    expect(result.hasCycle).toBe(false);
    expect(result.topologicalOrder).toEqual(['solo']);
  });
});

// ============================================================================
// getReadySteps
// ============================================================================

describe('WorkflowDAG.getReadySteps', () => {
  it('returns root nodes when nothing is completed', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');

    const ready = dag.getReadySteps(new Set());
    expect(ready).toEqual(['A']);
  });

  it('returns [B] when A is completed in A->B', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');

    const ready = dag.getReadySteps(new Set(['A']));
    expect(ready).toEqual(['B']);
  });

  it('returns [C] when A,B completed in A->{B,C}->D with B->D', () => {
    // A -> B -> D
    // A -> C -> D
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addNode('D');
    dag.addEdge('A', 'B');
    dag.addEdge('A', 'C');
    dag.addEdge('B', 'D');
    dag.addEdge('C', 'D');

    // A and B completed. D still needs C.
    const ready = dag.getReadySteps(new Set(['A', 'B']));
    expect(ready).toEqual(['C']);
  });

  it('returns multiple root nodes when there are parallel roots', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    // No edges between A, B, C

    const ready = dag.getReadySteps(new Set());
    expect(ready.sort()).toEqual(['A', 'B', 'C']);
  });

  it('returns empty array when all steps completed', () => {
    const dag = new WorkflowDAG();
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');

    const ready = dag.getReadySteps(new Set(['A', 'B']));
    expect(ready).toEqual([]);
  });
});

// ============================================================================
// fromSteps
// ============================================================================

describe('WorkflowDAG.fromSteps', () => {
  it('builds correct graph from WorkflowStep array', () => {
    const steps: WorkflowStep[] = [
      { id: 'lint', skill: 'linter', needs: [] },
      { id: 'test', skill: 'tester', needs: ['lint'] },
      { id: 'deploy', skill: 'deployer', needs: ['test'] },
    ];

    const dag = WorkflowDAG.fromSteps(steps);
    const result = dag.detectCycles();

    expect(result.hasCycle).toBe(false);
    expect(result.topologicalOrder).toEqual(['lint', 'test', 'deploy']);
  });

  it('handles parallel steps with shared dependency', () => {
    const steps: WorkflowStep[] = [
      { id: 'setup', skill: 'init', needs: [] },
      { id: 'lint', skill: 'linter', needs: ['setup'] },
      { id: 'typecheck', skill: 'tsc', needs: ['setup'] },
      { id: 'test', skill: 'tester', needs: ['lint', 'typecheck'] },
    ];

    const dag = WorkflowDAG.fromSteps(steps);
    const result = dag.detectCycles();

    expect(result.hasCycle).toBe(false);
    const order = result.topologicalOrder!;
    expect(order.indexOf('setup')).toBe(0);
    expect(order.indexOf('lint')).toBeLessThan(order.indexOf('test'));
    expect(order.indexOf('typecheck')).toBeLessThan(order.indexOf('test'));
  });
});
