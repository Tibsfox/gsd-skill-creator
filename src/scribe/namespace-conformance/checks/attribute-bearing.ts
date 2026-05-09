/**
 * Invariant 2 — Attribute-bearing tags.
 *
 * T1 doc 06 §4 Invariant 2: the authoring surface is more permissive than the
 * data model (XML is strict, but SCRIBE attributes are TYPED — each attribute
 * has a documented type and meaning, not an arbitrary string-valued bag).
 *
 * For SCRIBE specifically: attributes like `sub_type`, `rel`, `kind`, `version`,
 * `path`, `sha`, `span` carry typed metadata. The violation mode is embedding
 * unstructured JSON blobs directly as element text content (rather than using
 * named attributes), OR using `class` hacks instead of named attributes.
 *
 * EXCEPTION: the `payload` attribute on `<scribe:node>` and `<scribe:edge>` is
 * explicitly documented in the metadata-spec as JSON-encoded extra data — this
 * is the sanctioned payload pattern and is NOT a violation.
 *
 * @module scribe/namespace-conformance/checks/attribute-bearing
 */

import type { InvariantFinding } from '../invariants.js';

/**
 * Required typed attributes for `<scribe:graph>`.
 * Both `version` and `kind` are mandatory per metadata-spec §2.
 */
const GRAPH_REQUIRED_ATTRS = ['version', 'kind'] as const;

/**
 * Required typed attributes for `<scribe:node>`.
 * `id`, `sub_type`, `label` are mandatory per metadata-spec §4.
 */
const NODE_REQUIRED_ATTRS = ['id', 'sub_type', 'label'] as const;

/**
 * Required typed attributes for `<scribe:edge>`.
 * `id`, `rel`, `src`, `dst` are mandatory per metadata-spec §5.
 */
const EDGE_REQUIRED_ATTRS = ['id', 'rel', 'src', 'dst'] as const;

/**
 * Checks that SCRIBE elements use typed named attributes (attribute-bearing
 * invariant).
 *
 * PASS — every `<scribe:graph>` has `version` + `kind`; every `<scribe:node>`
 *        has `id` + `sub_type` + `label`; every `<scribe:edge>` has `id` + `rel`
 *        + `src` + `dst`. No attribute-absent inline text content used to carry
 *        metadata.
 *
 * FAIL — a SCRIBE element is present but missing its required typed attributes
 *        (stringly-typed inline text pattern, or bare element without attrs).
 *
 * @param svgSource Raw SVG XML string to inspect.
 * @returns InvariantFinding for this invariant.
 */
export function checkAttributeBearing(svgSource: string): InvariantFinding {
  const invariant = 'attribute-bearing' as const;
  const violations: string[] = [];

  // Check <scribe:graph ...> has version and kind attributes
  const graphMatches = [...svgSource.matchAll(/<scribe:graph([^>]*>)/g)];
  for (const match of graphMatches) {
    const attrs = match[1];
    for (const attr of GRAPH_REQUIRED_ATTRS) {
      if (!attrs.includes(`${attr}=`)) {
        violations.push(`<scribe:graph> missing required attribute "${attr}".`);
      }
    }
  }

  // Check <scribe:node ...> has id, sub_type, label
  const nodeMatches = [...svgSource.matchAll(/<scribe:node([^/]*\/?>)/g)];
  for (const match of nodeMatches) {
    const attrs = match[1];
    for (const attr of NODE_REQUIRED_ATTRS) {
      if (!attrs.includes(`${attr}=`)) {
        violations.push(`<scribe:node> missing required attribute "${attr}": "${attrs.trim().substring(0, 80)}..."`);
      }
    }
  }

  // Check <scribe:edge ...> has id, rel, src, dst
  const edgeMatches = [...svgSource.matchAll(/<scribe:edge([^/]*\/?>)/g)];
  for (const match of edgeMatches) {
    const attrs = match[1];
    for (const attr of EDGE_REQUIRED_ATTRS) {
      if (!attrs.includes(`${attr}=`)) {
        violations.push(`<scribe:edge> missing required attribute "${attr}": "${attrs.trim().substring(0, 80)}..."`);
      }
    }
  }

  // Check for bare text-content carrying metadata (anti-pattern: element text
  // instead of attributes). A SCRIBE element followed immediately by a JSON
  // blob in text position (not in an attribute) is a violation.
  // We detect this by looking for SCRIBE elements with text children that look
  // like JSON metadata objects — not the payload= attribute which is fine.
  const bareJsonPattern = /<scribe:\w+[^>]*>\s*\{[^}]+\}/g;
  const bareJsonMatches = [...svgSource.matchAll(bareJsonPattern)];
  if (bareJsonMatches.length > 0) {
    violations.push(
      `Found ${bareJsonMatches.length} SCRIBE element(s) with bare JSON text content (metadata should live in typed attributes, not element text).`
    );
  }

  if (violations.length > 0) {
    return {
      invariant,
      status: 'FAIL',
      evidence: violations.join(' | '),
    };
  }

  const summary = [
    graphMatches.length > 0 ? `${graphMatches.length} graph(s)` : null,
    nodeMatches.length > 0 ? `${nodeMatches.length} node(s)` : null,
    edgeMatches.length > 0 ? `${edgeMatches.length} edge(s)` : null,
  ].filter(Boolean).join(', ');

  return {
    invariant,
    status: 'PASS',
    evidence: summary
      ? `All required typed attributes present across ${summary}.`
      : 'No SCRIBE data elements present (namespace-only doc); typed-attribute rule trivially satisfied.',
  };
}
