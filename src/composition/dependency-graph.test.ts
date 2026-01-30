import { describe, it, expect } from 'vitest';
import { DependencyGraph } from './dependency-graph.js';

describe('DependencyGraph', () => {
  describe('detectCycles', () => {
    it('should return no cycle for empty graph', () => {
      const graph = new DependencyGraph();
      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(false);
      expect(result.topologicalOrder).toEqual([]);
    });

    it('should return no cycle for single skill with no extends', () => {
      const graph = new DependencyGraph();
      graph.addNode('skill-a');

      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(false);
      expect(result.topologicalOrder).toEqual(['skill-a']);
    });

    it('should return no cycle for linear chain', () => {
      // C extends B extends A
      const graph = new DependencyGraph();
      graph.addEdge('skill-c', 'skill-b');
      graph.addEdge('skill-b', 'skill-a');
      graph.addNode('skill-a');

      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(false);
      expect(result.topologicalOrder).toBeDefined();
      // A should come before B, B before C (dependencies resolve first)
      const order = result.topologicalOrder!;
      expect(order.indexOf('skill-a')).toBeLessThan(order.indexOf('skill-b'));
      expect(order.indexOf('skill-b')).toBeLessThan(order.indexOf('skill-c'));
    });

    it('should detect direct cycle (A extends B, B extends A)', () => {
      const graph = new DependencyGraph();
      graph.addEdge('skill-a', 'skill-b');
      graph.addEdge('skill-b', 'skill-a');

      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle).toContain('skill-a');
      expect(result.cycle).toContain('skill-b');
    });

    it('should detect indirect cycle (A extends B, B extends C, C extends A)', () => {
      const graph = new DependencyGraph();
      graph.addEdge('skill-a', 'skill-b');
      graph.addEdge('skill-b', 'skill-c');
      graph.addEdge('skill-c', 'skill-a');

      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle!.length).toBe(3);
    });

    it('should detect self-reference (A extends A)', () => {
      const graph = new DependencyGraph();
      graph.addEdge('skill-a', 'skill-a');

      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toContain('skill-a');
    });
  });

  describe('getInheritanceChain', () => {
    it('should return single skill for no extends', () => {
      const graph = new DependencyGraph();
      graph.addNode('skill-a');

      const chain = graph.getInheritanceChain('skill-a');

      expect(chain).toEqual(['skill-a']);
    });

    it('should return chain in parent-first order', () => {
      // C extends B extends A
      const graph = new DependencyGraph();
      graph.addEdge('skill-c', 'skill-b');
      graph.addEdge('skill-b', 'skill-a');
      graph.addNode('skill-a');

      const chain = graph.getInheritanceChain('skill-c');

      // Order: [root, parent, child]
      expect(chain).toEqual(['skill-a', 'skill-b', 'skill-c']);
    });

    it('should throw for cycle', () => {
      const graph = new DependencyGraph();
      graph.addEdge('skill-a', 'skill-b');
      graph.addEdge('skill-b', 'skill-a');

      expect(() => graph.getInheritanceChain('skill-a')).toThrow(
        /Circular dependency detected/
      );
    });

    it('should throw for self-reference', () => {
      const graph = new DependencyGraph();
      graph.addEdge('skill-a', 'skill-a');

      expect(() => graph.getInheritanceChain('skill-a')).toThrow(
        /Circular dependency detected/
      );
    });
  });

  describe('fromSkills', () => {
    it('should build graph from skill metadata map', () => {
      const skills = new Map([
        ['skill-a', {}],
        ['skill-b', { extends: 'skill-a' }],
        ['skill-c', { extends: 'skill-b' }],
      ]);

      const graph = DependencyGraph.fromSkills(skills);

      expect(graph.size).toBe(3);
      expect(graph.getParent('skill-b')).toBe('skill-a');
      expect(graph.getParent('skill-c')).toBe('skill-b');
      expect(graph.getParent('skill-a')).toBeUndefined();
    });

    it('should detect cycles in skill metadata', () => {
      const skills = new Map([
        ['skill-a', { extends: 'skill-b' }],
        ['skill-b', { extends: 'skill-a' }],
      ]);

      const graph = DependencyGraph.fromSkills(skills);
      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(true);
    });
  });

  describe('getParent', () => {
    it('should return parent skill name', () => {
      const graph = new DependencyGraph();
      graph.addEdge('child', 'parent');

      expect(graph.getParent('child')).toBe('parent');
    });

    it('should return undefined for skill with no parent', () => {
      const graph = new DependencyGraph();
      graph.addNode('orphan');

      expect(graph.getParent('orphan')).toBeUndefined();
    });
  });
});
