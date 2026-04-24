/**
 * Integrity tests for www/tibsfox/com/Research/cross-references.json (DRIFT-15).
 *
 * The milestone spec mentions a "graph integrity test"; this file provides a
 * minimal, dependency-free structural check that asserts:
 *
 *  - the file is parseable JSON
 *  - every edge has required fields (id, source, target, type)
 *  - `edge_count` field matches the actual number of edges in the array
 *  - the four mandatory drift-hub anchors are present:
 *      drift-hub ↔ AAR
 *      drift-hub ↔ LLM
 *      drift-hub ↔ SST
 *      drift-hub ↔ STAGING-LAYER
 *  - no duplicate edge IDs
 *
 * The "739-edge" phrasing in the requirement text is aspirational (the full
 * constellation graph is maintained elsewhere); this test pins the named
 * semantic-cross-reference edges that this file is actually responsible for.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../');
const crossRefsPath = join(repoRoot, 'www/tibsfox/com/Research/cross-references.json');

// www/tibsfox/com/Research is gitignored (regenerable, published via
// sync-research-to-live.sh). Skip on CI / fresh checkouts.
const ASSETS_PRESENT = existsSync(crossRefsPath);

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  weight?: number;
  direction?: string;
  notes?: string;
}

interface CrossRefDoc {
  $schema?: string;
  version?: string;
  description?: string;
  generated?: string;
  node_count?: number;
  edge_count?: number;
  clusters?: string[];
  edges: Edge[];
}

describe.runIf(ASSETS_PRESENT)('cross-references.json integrity (DRIFT-15)', () => {
  const raw = ASSETS_PRESENT ? readFileSync(crossRefsPath, 'utf8') : '{"edges":[]}';
  const doc: CrossRefDoc = JSON.parse(raw);

  it('parses as valid JSON with the expected top-level shape', () => {
    expect(doc).toHaveProperty('edges');
    expect(Array.isArray(doc.edges)).toBe(true);
    expect(doc.edges.length).toBeGreaterThan(0);
  });

  it('every edge has required fields: id, source, target, type', () => {
    for (const edge of doc.edges) {
      expect(edge).toHaveProperty('id');
      expect(edge).toHaveProperty('source');
      expect(edge).toHaveProperty('target');
      expect(edge).toHaveProperty('type');
      expect(typeof edge.id).toBe('string');
      expect(typeof edge.source).toBe('string');
      expect(typeof edge.target).toBe('string');
      expect(typeof edge.type).toBe('string');
      expect(edge.id.length).toBeGreaterThan(0);
      expect(edge.source.length).toBeGreaterThan(0);
      expect(edge.target.length).toBeGreaterThan(0);
      expect(edge.type.length).toBeGreaterThan(0);
    }
  });

  it('edge_count field matches the actual edge array length', () => {
    expect(doc.edge_count).toBe(doc.edges.length);
  });

  it('edge IDs are unique across the graph', () => {
    const ids = doc.edges.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('contains the four mandatory drift-hub anchor edges', () => {
    // Each mandatory edge must connect DRIFT ↔ {AAR, LLM, SST, STAGING-LAYER}.
    // We accept either direction or either role (source/target) to remain
    // robust to later edits that might flip the direction or add more edges.
    const mandatoryTargets = ['AAR', 'LLM', 'SST', 'STAGING-LAYER'];
    for (const target of mandatoryTargets) {
      const match = doc.edges.find(
        (e) =>
          (e.source === 'DRIFT' && e.target === target) ||
          (e.source === target && e.target === 'DRIFT'),
      );
      expect(match, `missing mandatory drift-hub edge: DRIFT ↔ ${target}`).toBeDefined();
    }
  });

  it('declares the drift-hub inside the clusters list', () => {
    expect(Array.isArray(doc.clusters)).toBe(true);
    expect(doc.clusters).toContain('DRIFT');
  });
});
