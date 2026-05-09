/**
 * SCRIBE Build-Out v1.49.621 — Component 09 substrate-conformance test.
 *
 * The foundational chipset declares its members two ways:
 *   1) manifest.json `composes` array
 *   2) composition-graph.json `nodes` + `edges`
 *
 * They MUST agree:
 *   - Every node in composition-graph appears in manifest.composes
 *   - Every member in manifest.composes appears as a composition-graph node
 *   - Every edge endpoint resolves to a known node (no orphans)
 *   - The graph contains no cycles (DAG invariant)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const CHIPSET_DIR = resolve(REPO_ROOT, 'cartridges/foundational/scribe');

interface Manifest {
  readonly composes: ReadonlyArray<string>;
}
interface GraphNode {
  readonly name: string;
}
interface GraphEdge {
  readonly from: string;
  readonly to: string;
}
interface Graph {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Detects a cycle in a directed graph via DFS coloring. */
function hasCycle(nodes: ReadonlyArray<string>, edges: ReadonlyArray<GraphEdge>): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n, []);
  for (const e of edges) adj.get(e.from)?.push(e.to);

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const n of nodes) color.set(n, WHITE);

  function dfs(u: string): boolean {
    color.set(u, GRAY);
    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) return true;
      if (color.get(v) === WHITE && dfs(v)) return true;
    }
    color.set(u, BLACK);
    return false;
  }
  for (const n of nodes) {
    if (color.get(n) === WHITE && dfs(n)) return true;
  }
  return false;
}

describe('substrate-conformance: foundational chipset composition graph parity', () => {
  const manifest = readJson<Manifest>(resolve(CHIPSET_DIR, 'manifest.json'));
  const graph = readJson<Graph>(resolve(CHIPSET_DIR, 'composition-graph.json'));

  const composesSet = new Set(manifest.composes);
  const nodesSet = new Set(graph.nodes.map((n) => n.name));

  it('manifest.composes set equals composition-graph.nodes set', () => {
    for (const name of composesSet) {
      expect(nodesSet.has(name)).toBe(true);
    }
    for (const name of nodesSet) {
      expect(composesSet.has(name)).toBe(true);
    }
    expect(composesSet.size).toBe(nodesSet.size);
  });

  it('every composition-graph edge endpoint is a known node (no orphans)', () => {
    for (const e of graph.edges) {
      expect(nodesSet.has(e.from)).toBe(true);
      expect(nodesSet.has(e.to)).toBe(true);
    }
  });

  it('composition graph is a DAG (no cycles)', () => {
    expect(hasCycle([...nodesSet], graph.edges)).toBe(false);
  });

  it('foundational chipset composes the 5 SCRIBE track cartridges', () => {
    expect([...composesSet].sort()).toEqual(
      [
        'code-svg-hdl-bridge',
        'dashboard-lod-rendering',
        'markup-lineage',
        'retrieval-provenance',
        'svg-substrate',
      ].sort(),
    );
  });
});
