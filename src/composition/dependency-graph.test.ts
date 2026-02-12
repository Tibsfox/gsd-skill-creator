import { describe, it, expect } from 'vitest';
import { DependencyGraph } from './dependency-graph.js';
import { SkillMetadata } from '../types/skill.js';

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
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Base skill' }],
        ['skill-b', { name: 'skill-b', description: 'Extends A', extends: 'skill-a' }],
        ['skill-c', { name: 'skill-c', description: 'Extends B', extends: 'skill-b' }],
      ]);

      const graph = DependencyGraph.fromSkills(skills);

      expect(graph.size).toBe(3);
      expect(graph.getParent('skill-b')).toBe('skill-a');
      expect(graph.getParent('skill-c')).toBe('skill-b');
      expect(graph.getParent('skill-a')).toBeUndefined();
    });

    it('should detect cycles in skill metadata', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Skill A', extends: 'skill-b' }],
        ['skill-b', { name: 'skill-b', description: 'Skill B', extends: 'skill-a' }],
      ]);

      const graph = DependencyGraph.fromSkills(skills);
      const result = graph.detectCycles();

      expect(result.hasCycle).toBe(true);
    });

    it('should read extends from nested metadata.extensions format', () => {
      const skills = new Map<string, SkillMetadata>([
        ['skill-a', { name: 'skill-a', description: 'Base skill' }],
        ['skill-b', {
          name: 'skill-b',
          description: 'Uses nested format',
          metadata: {
            extensions: {
              'gsd-skill-creator': { extends: 'skill-a' }
            }
          }
        }],
      ]);

      const graph = DependencyGraph.fromSkills(skills);

      expect(graph.size).toBe(2);
      expect(graph.getParent('skill-b')).toBe('skill-a');
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

  describe('getDependents', () => {
    it('should return direct children that extend a given skill', () => {
      // child1 extends base, child2 extends base
      const graph = new DependencyGraph();
      graph.addEdge('child1', 'base');
      graph.addEdge('child2', 'base');

      const dependents = graph.getDependents('base');

      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('child1');
      expect(dependents).toContain('child2');
    });

    it('should return empty array for leaf skills', () => {
      const graph = new DependencyGraph();
      graph.addEdge('leaf', 'parent');

      const dependents = graph.getDependents('leaf');

      expect(dependents).toEqual([]);
    });

    it('should return empty array for unknown skills', () => {
      const graph = new DependencyGraph();
      graph.addNode('known');

      const dependents = graph.getDependents('unknown');

      expect(dependents).toEqual([]);
    });
  });

  describe('getDepth', () => {
    it('should return 0 for skill with no parent', () => {
      const graph = new DependencyGraph();
      graph.addNode('root');

      expect(graph.getDepth('root')).toBe(0);
    });

    it('should return 1 for child extends parent', () => {
      const graph = new DependencyGraph();
      graph.addEdge('child', 'parent');

      expect(graph.getDepth('child')).toBe(1);
    });

    it('should return 2 for grandchild extends child extends parent', () => {
      const graph = new DependencyGraph();
      graph.addEdge('grandchild', 'child');
      graph.addEdge('child', 'parent');

      expect(graph.getDepth('grandchild')).toBe(2);
    });

    it('should return 3 for great-grandchild chain', () => {
      const graph = new DependencyGraph();
      graph.addEdge('great-grandchild', 'grandchild');
      graph.addEdge('grandchild', 'child');
      graph.addEdge('child', 'parent');

      expect(graph.getDepth('great-grandchild')).toBe(3);
    });

    it('should throw on cycle', () => {
      const graph = new DependencyGraph();
      graph.addEdge('a', 'b');
      graph.addEdge('b', 'a');

      expect(() => graph.getDepth('a')).toThrow(/Circular dependency detected/);
    });
  });

  describe('getAllDependents', () => {
    it('should return all transitive dependents via BFS', () => {
      // root <- mid <- leaf
      const graph = new DependencyGraph();
      graph.addEdge('mid', 'root');
      graph.addEdge('leaf', 'mid');

      const allDeps = graph.getAllDependents('root');

      expect(allDeps).toHaveLength(2);
      expect(allDeps).toContain('mid');
      expect(allDeps).toContain('leaf');
    });

    it('should return empty array for leaf skills', () => {
      const graph = new DependencyGraph();
      graph.addEdge('leaf', 'parent');

      const allDeps = graph.getAllDependents('leaf');

      expect(allDeps).toEqual([]);
    });

    it('should return all transitive dependents in a tree', () => {
      // root <- a, root <- b, a <- c
      const graph = new DependencyGraph();
      graph.addEdge('a', 'root');
      graph.addEdge('b', 'root');
      graph.addEdge('c', 'a');

      const allDeps = graph.getAllDependents('root');

      expect(allDeps).toHaveLength(3);
      expect(allDeps).toContain('a');
      expect(allDeps).toContain('b');
      expect(allDeps).toContain('c');
    });
  });
});
