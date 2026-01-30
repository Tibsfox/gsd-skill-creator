/**
 * DependencyGraph for detecting circular dependencies in skill inheritance.
 * Uses Kahn's algorithm (BFS topological sort) for O(n+m) cycle detection.
 */

export interface DependencyResult {
  hasCycle: boolean;
  cycle?: string[];           // Skills in the cycle (for error message)
  topologicalOrder?: string[]; // Valid resolution order (roots first)
}

export class DependencyGraph {
  private edges: Map<string, string> = new Map(); // child -> parent
  private nodes: Set<string> = new Set();

  /**
   * Add an extends relationship: child extends parent
   */
  addEdge(child: string, parent: string): void {
    this.edges.set(child, parent);
    this.nodes.add(child);
    this.nodes.add(parent);
  }

  /**
   * Add a node without edges
   */
  addNode(name: string): void {
    this.nodes.add(name);
  }

  /**
   * Build graph from skill metadata map
   */
  static fromSkills(skills: Map<string, { extends?: string }>): DependencyGraph {
    const graph = new DependencyGraph();
    for (const [name, metadata] of skills) {
      graph.addNode(name);
      if (metadata.extends) {
        graph.addEdge(name, metadata.extends);
      }
    }
    return graph;
  }

  /**
   * Detect cycles using Kahn's algorithm (BFS topological sort)
   * Returns hasCycle: false with topologicalOrder if no cycles
   * Returns hasCycle: true with cycle array if cycles exist
   */
  detectCycles(): DependencyResult {
    // Build in-degree map (count of skills that depend on each skill)
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // parent -> children who extend it

    // Initialize all nodes with 0 in-degree
    for (const node of this.nodes) {
      inDegree.set(node, 0);
      dependents.set(node, []);
    }

    // Build the graph structure
    for (const [child, parent] of this.edges) {
      // Child depends on parent, so child has in-degree from parent
      inDegree.set(child, (inDegree.get(child) || 0) + 1);

      // Parent has child as dependent
      const deps = dependents.get(parent) || [];
      deps.push(child);
      dependents.set(parent, deps);
    }

    // Kahn's algorithm: start with nodes that have no dependencies
    const queue: string[] = [];
    const order: string[] = [];

    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      // Process dependents (children who extend this skill)
      for (const dependent of dependents.get(current) || []) {
        const newDegree = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // If not all nodes processed, there's a cycle
    if (order.length !== this.nodes.size) {
      const cycleNodes = Array.from(this.nodes).filter(
        node => !order.includes(node)
      );
      return {
        hasCycle: true,
        cycle: cycleNodes,
      };
    }

    return {
      hasCycle: false,
      topologicalOrder: order,
    };
  }

  /**
   * Get the inheritance chain for a single skill
   * Returns [root, ..., child] order (parents first)
   * Throws if cycle detected
   */
  getInheritanceChain(skillName: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();
    let current: string | undefined = skillName;

    while (current) {
      if (visited.has(current)) {
        throw new Error(
          `Circular dependency detected: ${[...chain, current].join(' -> ')}`
        );
      }
      visited.add(current);
      chain.unshift(current); // Add to front (parents first)
      current = this.edges.get(current); // Get parent
    }

    return chain;
  }

  /**
   * Check if the graph has any nodes
   */
  get size(): number {
    return this.nodes.size;
  }

  /**
   * Get the parent of a skill (if any)
   */
  getParent(skillName: string): string | undefined {
    return this.edges.get(skillName);
  }
}
