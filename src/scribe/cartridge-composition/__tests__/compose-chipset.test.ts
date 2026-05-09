/**
 * Component 01 — compose-chipset.ts unit tests.
 *
 * Covers the verification-checklist items that are pure-function shaped:
 * manifest validation, composition-graph well-formedness, no-cycles invariant,
 * and the error taxonomy from CartridgeCompositionError.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { composeFoundationalChipset } from '../compose-chipset.js';
import type {
  CartridgeManifest,
  CompositionGraph,
} from '../../types/cartridge-manifest.js';
import { CartridgeCompositionError } from '../../types/errors.js';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

const STANDARD_INPUT = {
  chipsetName: 'scribe',
  mission: 'scribe',
  milestone: 'v1.49.621',
  chipsetVersion: '1.49.621',
  summary: 'test',
  license: 'Apache-2.0',
  scribeNamespace: 'https://tibsfox.com/Research/SCRIBE/ns#',
  members: [
    { name: 'markup-lineage', track: 'T1', version: '1.0.0', composesWith: [] },
    { name: 'svg-substrate', track: 'T2', version: '1.0.0', composesWith: [] },
    { name: 'code-svg-hdl-bridge', track: 'T3', version: '1.0.0', composesWith: ['svg-substrate', 'retrieval-provenance', 'markup-lineage'] },
    { name: 'dashboard-lod-rendering', track: 'T4', version: '0.1.0', composesWith: ['svg-substrate', 'retrieval-provenance'] },
    { name: 'retrieval-provenance', track: 'T5', version: '1.0.0', composesWith: [] },
  ],
} as const;

describe('composeFoundationalChipset', () => {
  it('produces a CartridgeManifest with the foundational role + chipset kind', () => {
    const { manifest } = composeFoundationalChipset(STANDARD_INPUT);
    // Type-narrow + structural shape — these are the load-bearing fields.
    const m: CartridgeManifest = manifest;
    expect(m.kind).toBe('chipset');
    expect(m.role).toBe('foundational');
    expect(m.name).toBe('scribe');
    expect(m.version).toBe('1.49.621');
    expect(m.mission).toBe('scribe');
    expect(m.milestone).toBe('v1.49.621');
    expect(m.scribe_namespace).toBe('https://tibsfox.com/Research/SCRIBE/ns#');
    expect(m.composes).toEqual([
      'code-svg-hdl-bridge',
      'dashboard-lod-rendering',
      'markup-lineage',
      'retrieval-provenance',
      'svg-substrate',
    ]);
  });

  it('produces a CompositionGraph with 5 nodes and edges from composes_with', () => {
    const { graph } = composeFoundationalChipset(STANDARD_INPUT);
    const g: CompositionGraph = graph;
    expect(g.version).toBe('1.0.0');
    expect(g.algebra).toBe('sum');
    expect(g.nodes).toHaveLength(5);
    expect(g.edges.length).toBe(5); // T3 -> 3, T4 -> 2

    // Every edge endpoint must exist in nodes
    const nodeNames = new Set(g.nodes.map((n) => n.name));
    for (const e of g.edges) {
      expect(nodeNames.has(e.from)).toBe(true);
      expect(nodeNames.has(e.to)).toBe(true);
    }
  });

  it('throws CartridgeCompositionError on missing-member composes_with edge', () => {
    expect(() =>
      composeFoundationalChipset({
        ...STANDARD_INPUT,
        members: [
          { name: 'a', track: 'T1', version: '1.0.0', composesWith: ['ghost'] },
        ],
      }),
    ).toThrow(CartridgeCompositionError);
  });

  it('throws CartridgeCompositionError on duplicate cartridge name', () => {
    expect(() =>
      composeFoundationalChipset({
        ...STANDARD_INPUT,
        members: [
          { name: 'a', track: 'T1', version: '1.0.0', composesWith: [] },
          { name: 'a', track: 'T2', version: '1.0.0', composesWith: [] },
        ],
      }),
    ).toThrow(CartridgeCompositionError);
  });

  it('detects a cycle and throws CartridgeCompositionError(cycle-detected)', () => {
    // Adversarial: two cartridges that compose with each other.
    let err: unknown;
    try {
      composeFoundationalChipset({
        ...STANDARD_INPUT,
        members: [
          { name: 'a', track: 'T1', version: '1.0.0', composesWith: ['b'] },
          { name: 'b', track: 'T2', version: '1.0.0', composesWith: ['a'] },
        ],
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(CartridgeCompositionError);
    expect((err as CartridgeCompositionError).reason).toBe('cycle-detected');
  });

  it('on-disk composition-graph.json is acyclic (DFS traversal terminates)', () => {
    // Substrate-conformance smoke: parse the actual artifact and verify the
    // DAG passes the same cycle check the composer applies.
    const path = resolve(REPO_ROOT, 'cartridges/foundational/scribe/composition-graph.json');
    const raw = JSON.parse(readFileSync(path, 'utf8')) as CompositionGraph;
    expect(raw.version).toBe('1.0.0');
    expect(raw.nodes.length).toBeGreaterThan(0);
    // Edge endpoints must reference existing nodes.
    const names = new Set(raw.nodes.map((n) => n.name));
    for (const e of raw.edges) {
      expect(names.has(e.from)).toBe(true);
      expect(names.has(e.to)).toBe(true);
    }
    // Iterative DFS cycle check — re-implementation kept inline so the test
    // does not silently rely on the production implementation passing.
    const adj = new Map<string, string[]>();
    for (const n of raw.nodes) adj.set(n.name, []);
    for (const e of raw.edges) adj.get(e.from)!.push(e.to);
    const WHITE = 0, GREY = 1, BLACK = 2;
    const color = new Map<string, number>();
    for (const n of raw.nodes) color.set(n.name, WHITE);
    let cycleFound = false;
    function visit(start: string): void {
      const stack: { node: string; iter: Iterator<string> }[] = [];
      color.set(start, GREY);
      stack.push({ node: start, iter: adj.get(start)![Symbol.iterator]() });
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        const next = top.iter.next();
        if (next.done) { color.set(top.node, BLACK); stack.pop(); continue; }
        const child = next.value;
        const c = color.get(child) ?? WHITE;
        if (c === GREY) { cycleFound = true; return; }
        if (c === WHITE) {
          color.set(child, GREY);
          stack.push({ node: child, iter: adj.get(child)![Symbol.iterator]() });
        }
      }
    }
    for (const n of raw.nodes) {
      if (color.get(n.name) === WHITE) visit(n.name);
      if (cycleFound) break;
    }
    expect(cycleFound).toBe(false);
  });

  it('on-disk manifest.json validates against CartridgeManifest shape', () => {
    const path = resolve(REPO_ROOT, 'cartridges/foundational/scribe/manifest.json');
    const m = JSON.parse(readFileSync(path, 'utf8')) as CartridgeManifest;
    expect(m.kind).toBe('chipset');
    expect(m.role).toBe('foundational');
    expect(m.composes).toBeDefined();
    expect((m.composes ?? []).length).toBe(5);
    expect(m.scribe_namespace).toBe('https://tibsfox.com/Research/SCRIBE/ns#');
  });
});
