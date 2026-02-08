/**
 * Multi-edge directed acyclic graph for workflow step dependencies.
 *
 * Uses Kahn's algorithm for:
 * - Cycle detection (nodes remaining after algorithm = cycle participants)
 * - Topological sorting (valid execution order)
 * - Ready-step computation (steps whose predecessors are all complete)
 *
 * Unlike DependencyGraph (single parent per node), WorkflowDAG supports
 * multiple predecessors per step via the `needs` array.
 */

import type { WorkflowStep } from './types.js';

export interface CycleDetectionResult {
  hasCycle: boolean;
  /** Nodes participating in cycle(s), present when hasCycle is true */
  cycle?: string[];
  /** Valid execution order, present when hasCycle is false */
  topologicalOrder?: string[];
}

export class WorkflowDAG {
  private inEdges: Map<string, Set<string>> = new Map();
  private outEdges: Map<string, Set<string>> = new Map();
  private nodes: Set<string> = new Set();

  /**
   * Register a node in the graph.
   */
  addNode(id: string): void {
    this.nodes.add(id);
    if (!this.inEdges.has(id)) {
      this.inEdges.set(id, new Set());
    }
    if (!this.outEdges.has(id)) {
      this.outEdges.set(id, new Set());
    }
  }

  /**
   * Add a directed edge: `from` must complete before `to` can start.
   */
  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.outEdges.get(from)!.add(to);
    this.inEdges.get(to)!.add(from);
  }

  /**
   * Detect cycles using Kahn's algorithm.
   *
   * Returns topological order when acyclic, or cycle participant nodes
   * when a cycle exists.
   */
  detectCycles(): CycleDetectionResult {
    // Compute in-degree for each node
    const inDegree = new Map<string, number>();
    for (const node of this.nodes) {
      inDegree.set(node, this.inEdges.get(node)!.size);
    }

    // Seed queue with zero in-degree nodes
    const queue: string[] = [];
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    const topologicalOrder: string[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      topologicalOrder.push(node);

      for (const successor of this.outEdges.get(node) ?? []) {
        const newDegree = inDegree.get(successor)! - 1;
        inDegree.set(successor, newDegree);
        if (newDegree === 0) {
          queue.push(successor);
        }
      }
    }

    if (topologicalOrder.length === this.nodes.size) {
      return { hasCycle: false, topologicalOrder };
    }

    // Nodes not in topological order are cycle participants
    const cycleNodes = [...this.nodes].filter(
      n => !topologicalOrder.includes(n),
    );
    return { hasCycle: true, cycle: cycleNodes };
  }

  /**
   * Get steps that are ready to execute: all predecessors completed
   * and the step itself is not yet completed.
   */
  getReadySteps(completed: Set<string>): string[] {
    const ready: string[] = [];
    for (const node of this.nodes) {
      if (completed.has(node)) continue;

      const predecessors = this.inEdges.get(node)!;
      const allPredecessorsDone = [...predecessors].every(p => completed.has(p));
      if (allPredecessorsDone) {
        ready.push(node);
      }
    }
    return ready;
  }

  /**
   * Build a WorkflowDAG from an array of WorkflowStep definitions.
   *
   * Each step becomes a node. Each entry in step.needs creates an edge
   * from the needed step to this step (needed must complete first).
   */
  static fromSteps(steps: WorkflowStep[]): WorkflowDAG {
    const dag = new WorkflowDAG();

    for (const step of steps) {
      dag.addNode(step.id);
    }

    for (const step of steps) {
      for (const needed of step.needs) {
        dag.addEdge(needed, step.id);
      }
    }

    return dag;
  }
}
