/**
 * Invariant 1 — Generic identification of structural elements.
 *
 * T1 doc 06 §4 Invariant 1: element names carry semantics; the markup
 * application must NOT collapse everything into a single generic container
 * (e.g., all `<div>` / all `<g>`) without semantic discriminators.
 *
 * For SCRIBE: a conformant SVG MUST use `<scribe:graph>`, `<scribe:node>`,
 * `<scribe:edge>`, `<scribe:source>`, etc. rather than generic `<g>` or
 * `<div>` elements with CSS-class tricks to carry SCRIBE semantics.
 *
 * @module scribe/namespace-conformance/checks/generic-identification
 */

import type { InvariantFinding } from '../invariants.js';
import { NAMESPACE_URI } from '../../types/index.js';

/** Qualified SCRIBE element names that must appear in a conformant document. */
const REQUIRED_SCRIBE_ELEMENTS = ['scribe:graph'] as const;

/**
 * The elements that form the meaningful semantic vocabulary of the SCRIBE
 * namespace. At least ONE of these should appear in a SCRIBE-carrying SVG
 * (graph is required; nodes/edges/source/layout/roundtrip are optional but
 * carry semantic identity when present).
 */
const SEMANTIC_SCRIBE_ELEMENTS = new Set([
  'scribe:graph',
  'scribe:node',
  'scribe:nodes',
  'scribe:edge',
  'scribe:edges',
  'scribe:source',
  'scribe:layout',
  'scribe:roundtrip',
  'scribe:metadata',
]);

/**
 * Checks that the document uses named SCRIBE elements (generic-identification
 * invariant).
 *
 * PASS — the SVG carries at least one `<scribe:graph>` element AND the
 *        namespace URI matches `NAMESPACE_URI`.
 *
 * FAIL — the SVG declares the namespace prefix but uses no semantic SCRIBE
 *        elements (everything-is-a-g anti-pattern), OR uses the namespace URI
 *        but under a different prefix that collapses identities.
 *
 * @param svgSource Raw SVG XML string to inspect.
 * @returns InvariantFinding for this invariant.
 */
export function checkGenericIdentification(svgSource: string): InvariantFinding {
  const invariant = 'generic-identification' as const;

  // Check that the namespace is declared
  const hasNamespaceDecl = svgSource.includes(`"${NAMESPACE_URI}"`) ||
                            svgSource.includes(`'${NAMESPACE_URI}'`);

  if (!hasNamespaceDecl) {
    return {
      invariant,
      status: 'FAIL',
      evidence: `Namespace URI "${NAMESPACE_URI}" not declared in document. A SCRIBE-conformant SVG must declare xmlns:scribe="${NAMESPACE_URI}".`,
    };
  }

  // Check for required top-level element
  const hasGraphElement = REQUIRED_SCRIBE_ELEMENTS.every(el =>
    svgSource.includes(`<${el} `) || svgSource.includes(`<${el}>`)
  );

  if (!hasGraphElement) {
    return {
      invariant,
      status: 'FAIL',
      evidence: `Namespace declared but no <scribe:graph> element found. Declaring the namespace URI without using semantic elements is the "everything-is-a-div" anti-pattern that Invariant 1 prohibits.`,
    };
  }

  // Count the distinct SCRIBE element types used
  const usedElements = [...SEMANTIC_SCRIBE_ELEMENTS].filter(el =>
    svgSource.includes(`<${el} `) || svgSource.includes(`<${el}>`)
  );

  return {
    invariant,
    status: 'PASS',
    evidence: `Found ${usedElements.length} distinct semantic SCRIBE elements: ${usedElements.join(', ')}.`,
  };
}
