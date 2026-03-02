/**
 * Tests for XRefRegistry -- verifies XREF-01 (all dependency-graph edges present).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { XRefRegistry } from './xref-registry.js';
import { ALL_XREF_EDGES } from './dependency-graph-xrefs.js';

let registry: XRefRegistry;

beforeAll(() => {
  registry = new XRefRegistry();
});

describe('XRefRegistry', () => {
  it('XREF-01: countEdges() equals the actual number of enables edges in dependency-graph.yaml', () => {
    // The number of edges equals ALL_XREF_EDGES.length which is the authoritative count
    // from the dependency-graph.yaml 'enables' arrays.
    expect(registry.countEdges()).toBe(ALL_XREF_EDGES.length);
    expect(registry.countEdges()).toBeGreaterThan(0);
  });

  it('XREF-01: all edges have valid from/to department IDs (no empty strings)', () => {
    for (const edge of registry.getAll()) {
      expect(edge.from).toBeTruthy();
      expect(edge.to).toBeTruthy();
      expect(edge.packFrom).toMatch(/^[A-Z]+-101$/);
      expect(edge.packTo).toMatch(/^[A-Z]+-101$/);
    }
  });

  it('getEdgesFrom("math") returns 6 outgoing edges from MATH-101', () => {
    const edges = registry.getEdgesFrom('math');
    expect(edges.length).toBe(6);
    const targets = edges.map((e) => e.to);
    expect(targets).toContain('physics');
    expect(targets).toContain('coding');
    expect(targets).toContain('data-science');
    expect(targets).toContain('economics');
    expect(targets).toContain('astronomy');
    expect(targets).toContain('logic');
  });

  it('getEdgesTo("coding") returns all edges from packs that enable CODE-101', () => {
    const edges = registry.getEdgesTo('coding');
    expect(edges.length).toBeGreaterThan(0);
    const sources = edges.map((e) => e.from);
    expect(sources).toContain('math');
    expect(sources).toContain('problem-solving');
    expect(sources).toContain('technology');
    expect(sources).toContain('logic');
    expect(sources).toContain('digital-literacy');
  });

  it('getEdgesForDepartment("physics") returns edges as both source and target', () => {
    const edges = registry.getEdgesForDepartment('physics');
    expect(edges.length).toBeGreaterThan(0);
    // physics enables: astronomy, engineering, chemistry (from PHYS-101)
    // physics is enabled by: math, science
    const asSource = edges.filter((e) => e.from === 'physics');
    const asTarget = edges.filter((e) => e.to === 'physics');
    expect(asSource.length).toBeGreaterThan(0);
    expect(asTarget.length).toBeGreaterThan(0);
  });

  it('getDepartments() returns all unique department IDs from edges', () => {
    const depts = registry.getDepartments();
    expect(depts.length).toBeGreaterThan(0);
    expect(depts).toContain('math');
    expect(depts).toContain('physics');
    expect(depts).toContain('coding');
    expect(depts).toContain('nutrition');
    // These have no outgoing edges but appear as targets
    expect(depts).toContain('astronomy');
    expect(depts).toContain('learning');
  });

  it('no duplicate edges (each from->to pair appears at most once)', () => {
    const seen = new Set<string>();
    for (const edge of registry.getAll()) {
      const key = `${edge.from}->${edge.to}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
