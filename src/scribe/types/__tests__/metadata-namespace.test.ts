/**
 * Component 00 — metadata-namespace.ts substrate-conformance tests.
 *
 * The substrate-conformance test in Component 09 (`namespace-uri-stable.test.ts`)
 * additionally locks the URI string against any future drift. Here we verify
 * the local invariants and the closed sets.
 */

import { describe, it, expect } from 'vitest';
import {
  NAMESPACE_URI,
  NAMESPACE_VERSION,
  GRAPH_KINDS,
  SOURCE_LANGUAGES,
  SCRIBE_EDGE_RELS,
  NAMESPACE_PREFIX,
  NAMESPACE_DECLARATION_ATTR,
  namespaceDeclaration,
} from '../metadata-namespace.js';

describe('metadata-namespace.ts — namespace URI is the substrate-pinned value', () => {
  it('NAMESPACE_URI equals the exact substrate value', () => {
    // This MUST equal the literal in T3 metadata-spec.md §1 + manifest.json
    // `scribe_namespace`. If this changes, every emitted SVG's xmlns:scribe
    // declaration drifts and round-trip persistence breaks.
    expect(NAMESPACE_URI).toBe('https://tibsfox.com/Research/SCRIBE/ns#');
  });

  it('NAMESPACE_VERSION is 1', () => {
    expect(NAMESPACE_VERSION).toBe('1');
  });

  it('NAMESPACE_PREFIX is scribe', () => {
    expect(NAMESPACE_PREFIX).toBe('scribe');
  });

  it('NAMESPACE_DECLARATION_ATTR is xmlns:scribe', () => {
    expect(NAMESPACE_DECLARATION_ATTR).toBe('xmlns:scribe');
  });

  it('namespaceDeclaration() returns the [attr, uri] tuple for SVG-root injection', () => {
    const decl = namespaceDeclaration();
    expect(decl).toEqual([
      'xmlns:scribe',
      'https://tibsfox.com/Research/SCRIBE/ns#',
    ]);
  });
});

describe('metadata-namespace.ts — closed sets', () => {
  it('GRAPH_KINDS is frozen and contains exactly 6 values', () => {
    expect(Object.isFrozen(GRAPH_KINDS)).toBe(true);
    expect(new Set(GRAPH_KINDS)).toEqual(
      new Set(['ast', 'callgraph', 'dfg', 'cfg', 'netlist', 'fsm']),
    );
  });

  it('SOURCE_LANGUAGES is frozen and contains exactly 10 values', () => {
    expect(Object.isFrozen(SOURCE_LANGUAGES)).toBe(true);
    expect(SOURCE_LANGUAGES.length).toBe(10);
    expect(SOURCE_LANGUAGES).toContain('typescript');
    expect(SOURCE_LANGUAGES).toContain('verilog');
  });

  it('SCRIBE_EDGE_RELS is frozen and contains the canonical 12-element set', () => {
    expect(Object.isFrozen(SCRIBE_EDGE_RELS)).toBe(true);
    // T3 metadata-spec §5: 9 graph-structure relations + 3 PROV-bridging.
    expect(SCRIBE_EDGE_RELS.length).toBe(12);
    expect(new Set(SCRIBE_EDGE_RELS)).toEqual(
      new Set([
        'child',
        'wire',
        'calls',
        'uses',
        'defines',
        'next',
        'true_branch',
        'false_branch',
        'instantiates',
        'wasDerivedFrom',
        'wasGeneratedBy',
        'used',
      ]),
    );
  });

  it('SCRIBE_EDGE_RELS is distinct from PROV_RELATIONS (the two domains do not collapse)', async () => {
    // SCRIBE_EDGE_RELS has 12; PROV_RELATIONS has 15. They overlap on
    // {wasDerivedFrom, wasGeneratedBy, used}. Imported here lazily so the
    // test files don't share a cycle-ish import shape.
    const { PROV_RELATIONS } = await import('../prov.js');
    expect(SCRIBE_EDGE_RELS.length).not.toBe(PROV_RELATIONS.length);

    // The PROV-bridging subset of SCRIBE rel must be a true subset of PROV.
    const provBridge = ['wasDerivedFrom', 'wasGeneratedBy', 'used'] as const;
    for (const r of provBridge) {
      expect(PROV_RELATIONS).toContain(r);
      expect(SCRIBE_EDGE_RELS).toContain(r);
    }

    // SCRIBE-only relations are NOT in PROV.
    const scribeOnly = ['child', 'wire', 'calls'] as const;
    for (const r of scribeOnly) {
      expect(SCRIBE_EDGE_RELS).toContain(r);
      expect(PROV_RELATIONS).not.toContain(r as never);
    }
  });
});
