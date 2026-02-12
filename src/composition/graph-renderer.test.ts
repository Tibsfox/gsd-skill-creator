/**
 * Tests for the Mermaid graph renderer.
 *
 * Covers:
 * - Empty graph renders valid minimal Mermaid output
 * - Inheritance edges rendered as parent --> child
 * - Multiple inheritance chains
 * - Standalone skills rendered as isolated nodes
 * - Co-activation clusters as Mermaid subgraphs with score labels
 * - Mixed inheritance + clusters
 * - Skill names are Mermaid-safe
 * - Cluster score percentage in label
 */

import { describe, it, expect } from 'vitest';
import { renderMermaid, GraphData } from './graph-renderer.js';

describe('renderMermaid', () => {
  it('renders empty graph with graph TD header and no-skills comment', () => {
    const data: GraphData = { skills: [], clusters: [] };
    const result = renderMermaid(data);

    expect(result).toMatch(/^graph TD/);
    expect(result).toContain('%% No skills found');
  });

  it('renders inheritance edges as parent --> child', () => {
    const data: GraphData = {
      skills: [
        { name: 'base', description: 'Base skill' },
        { name: 'derived', extends: 'base', description: 'Derived' },
      ],
      clusters: [],
    };
    const result = renderMermaid(data);

    expect(result).toMatch(/^graph TD/);
    expect(result).toContain('base --> derived');
    expect(result).toContain('%% Inheritance chains');
  });

  it('renders multiple inheritance chains', () => {
    const data: GraphData = {
      skills: [
        { name: 'base', description: 'Base' },
        { name: 'mid', extends: 'base', description: 'Mid' },
        { name: 'leaf', extends: 'mid', description: 'Leaf' },
      ],
      clusters: [],
    };
    const result = renderMermaid(data);

    expect(result).toContain('base --> mid');
    expect(result).toContain('mid --> leaf');
  });

  it('renders standalone skills as isolated nodes', () => {
    const data: GraphData = {
      skills: [
        { name: 'lone-wolf', description: 'Standalone skill' },
      ],
      clusters: [],
    };
    const result = renderMermaid(data);

    expect(result).toContain('lone-wolf');
    // Should not contain any --> edges
    expect(result).not.toContain('-->');
  });

  it('renders co-activation clusters as Mermaid subgraphs', () => {
    const data: GraphData = {
      skills: [
        { name: 'skill-a', description: 'A' },
        { name: 'skill-b', description: 'B' },
      ],
      clusters: [
        { id: 'cluster_0', skills: ['skill-a', 'skill-b'], score: 0.85 },
      ],
    };
    const result = renderMermaid(data);

    expect(result).toContain('subgraph cluster_0');
    expect(result).toContain('skill-a');
    expect(result).toContain('skill-b');
    expect(result).toContain('end');
  });

  it('renders mixed inheritance and clusters', () => {
    const data: GraphData = {
      skills: [
        { name: 'base', description: 'Base' },
        { name: 'derived', extends: 'base', description: 'Derived' },
        { name: 'skill-x', description: 'X' },
        { name: 'skill-y', description: 'Y' },
      ],
      clusters: [
        { id: 'cluster_0', skills: ['skill-x', 'skill-y'], score: 0.7 },
      ],
    };
    const result = renderMermaid(data);

    // Has inheritance edges
    expect(result).toContain('-->');
    expect(result).toContain('base --> derived');
    // Has subgraph blocks
    expect(result).toContain('subgraph');
    expect(result).toContain('cluster_0');
  });

  it('handles skill names that are Mermaid-safe (lowercase + hyphens)', () => {
    const data: GraphData = {
      skills: [
        { name: 'my-skill-name', description: 'Hyphenated' },
        { name: 'another-one', extends: 'my-skill-name', description: 'Child' },
      ],
      clusters: [],
    };
    const result = renderMermaid(data);

    expect(result).toContain('my-skill-name --> another-one');
  });

  it('includes cluster score percentage in subgraph label', () => {
    const data: GraphData = {
      skills: [
        { name: 'a', description: 'A' },
        { name: 'b', description: 'B' },
      ],
      clusters: [
        { id: 'cluster_0', skills: ['a', 'b'], score: 0.85 },
      ],
    };
    const result = renderMermaid(data);

    expect(result).toContain('Co-activated (85%)');
  });
});
