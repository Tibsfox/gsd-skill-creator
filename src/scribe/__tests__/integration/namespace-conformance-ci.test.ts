/**
 * SCRIBE Build-Out v1.49.621 — Component 09 integration test.
 *
 * Cross-component namespace conformance (C00 + C04). Verifies success
 * criterion C6 (namespace conformance certified) at the runtime level
 * by composing Component 04's validateNamespaceConformance() against the
 * Component 00 NAMESPACE_URI on a representative SCRIBE-shaped SVG.
 *
 * The validate-namespace.ts script that the CLI invokes is a thin shell
 * around this same machinery; this test exercises the underlying API
 * directly so green here implies green for the CLI.
 */
import { describe, it, expect } from 'vitest';

import { validateNamespaceConformance } from '../../namespace-conformance/index.js';
import { NAMESPACE_URI } from '../../types/metadata-namespace.js';

// Per metadata-spec (examples/cartridges/code-svg-hdl-bridge/svg-to-ast/
// metadata-spec.md): scribe:graph requires kind; scribe:node requires
// id+label; scribe:edge requires id+src+dst. Conforming sample below.
const SCRIBE_SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:scribe="${NAMESPACE_URI}"
     viewBox="0 0 200 100"
     role="img"
     aria-labelledby="title desc">
  <title id="title">Sample SCRIBE-namespaced graph</title>
  <desc id="desc">Two-node demo for the namespace conformance integration test.</desc>
  <metadata>
    <scribe:graph kind="ast" version="1">
      <scribe:node id="n1" label="commit-A" sub_type="commit" />
      <scribe:node id="n2" label="file-B" sub_type="file" />
      <scribe:edge id="e1" src="n1" dst="n2" rel="wasGeneratedBy" />
    </scribe:graph>
  </metadata>
  <g class="node" id="n1"><circle cx="40" cy="50" r="10" /></g>
  <g class="node" id="n2"><circle cx="160" cy="50" r="10" /></g>
</svg>`;

describe('integration: namespace-conformance CI gate (C6)', () => {
  it('validateNamespaceConformance() PASSES on a SCRIBE-shaped sample document', () => {
    const report = validateNamespaceConformance(NAMESPACE_URI, [SCRIBE_SAMPLE_SVG], [
      'sample-graph.svg',
    ]);
    expect(report.namespaceUri).toBe(NAMESPACE_URI);
    expect(report.totalDocuments).toBe(1);
    // Note: a real document may produce WARN findings on some invariants.
    // The CI gate's bar is "no FAIL findings", so we assert errors is empty.
    expect(report.errors.length).toBe(0);
  });

  it('reports per-document findings for all 5 T1 invariants', () => {
    const report = validateNamespaceConformance(NAMESPACE_URI, [SCRIBE_SAMPLE_SVG]);
    expect(report.documents.length).toBe(1);
    const doc = report.documents[0];
    expect(doc.findings.length).toBe(5);
    const invariants = new Set(doc.findings.map((f) => f.invariant));
    expect(invariants).toEqual(
      new Set([
        'generic-identification',
        'attribute-bearing',
        'hierarchical-nesting',
        'document-type-validation',
        'roundtrippable-serialisation',
      ]),
    );
  });

  it('uses NAMESPACE_URI from Component 00 (no hardcoded URI literal)', () => {
    // Calling with a different URI must update the report — proves the URI
    // is data-driven, not hardcoded inside the validator.
    const fakeUri = 'https://example.invalid/ns#';
    const report = validateNamespaceConformance(fakeUri, [SCRIBE_SAMPLE_SVG]);
    expect(report.namespaceUri).toBe(fakeUri);
  });
});
