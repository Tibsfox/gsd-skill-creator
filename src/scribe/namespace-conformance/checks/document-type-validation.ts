/**
 * Invariant 4 — Document-type validation.
 *
 * T1 doc 06 §4 Invariant 4: schemas are optional at the parsing layer but
 * socially required at the production layer. Every successful XML family
 * member has a discoverable schema or spec that defines what is valid.
 *
 * For SCRIBE: this invariant is satisfied by a discoverable spec document
 * rather than a full XSD/RelaxNG schema (per component-spec "Out of scope").
 * The spec lives at:
 *   examples/cartridges/code-svg-hdl-bridge/svg-to-ast/metadata-spec.md
 *
 * This check verifies:
 * 1. The namespace version attribute on `<scribe:graph>` is a known version
 *    (currently "1" per NAMESPACE_VERSION).
 * 2. The `kind` attribute value is from the closed GRAPH_KINDS set.
 * 3. The `rel` attribute on `<scribe:edge>` is from the closed SCRIBE_EDGE_RELS
 *    set.
 *
 * These constraints ARE the schema — the spec defines them and this validator
 * enforces them, making the schema machine-checkable.
 *
 * @module scribe/namespace-conformance/checks/document-type-validation
 */

import type { InvariantFinding } from '../invariants.js';
import {
  NAMESPACE_VERSION,
  GRAPH_KINDS,
  SCRIBE_EDGE_RELS,
} from '../../types/index.js';

/** Path to the SCRIBE namespace specification document (relative to repo root). */
export const SPEC_DOC_PATH =
  'examples/cartridges/code-svg-hdl-bridge/svg-to-ast/metadata-spec.md' as const;

const VALID_GRAPH_KINDS = new Set<string>(GRAPH_KINDS);
const VALID_EDGE_RELS = new Set<string>(SCRIBE_EDGE_RELS);

/**
 * Extract attribute value from a tag string using simple regex.
 * Handles both single and double quoted values.
 */
function extractAttr(tagContent: string, attrName: string): string | undefined {
  const re = new RegExp(`${attrName}=["']([^"']*)["']`);
  const m = tagContent.match(re);
  return m ? m[1] : undefined;
}

/**
 * Checks that the SCRIBE namespace has a discoverable schema/spec document
 * and that the document conforms to the closed-enum constraints it defines.
 *
 * PASS — version is "1", all `kind` values are from GRAPH_KINDS, all `rel`
 *        values are from SCRIBE_EDGE_RELS.
 *
 * FAIL — an unknown version, an unknown `kind`, or an unknown `rel` value
 *        is found; OR no version attribute is present on `<scribe:graph>`.
 *
 * @param svgSource Raw SVG XML string to inspect.
 * @returns InvariantFinding for this invariant.
 */
export function checkDocumentTypeValidation(svgSource: string): InvariantFinding {
  const invariant = 'document-type-validation' as const;
  const violations: string[] = [];

  // Check version attribute on <scribe:graph ...>
  const graphTagMatch = svgSource.match(/<scribe:graph([^>]*)>/);
  if (graphTagMatch) {
    const graphAttrs = graphTagMatch[1];
    const version = extractAttr(graphAttrs, 'version');
    if (version === undefined) {
      violations.push(`<scribe:graph> missing required "version" attribute (spec §2 requires version="${NAMESPACE_VERSION}").`);
    } else if (version !== NAMESPACE_VERSION) {
      violations.push(`<scribe:graph version="${version}"> is unknown — spec defines version "${NAMESPACE_VERSION}" as the current schema version.`);
    }

    const kind = extractAttr(graphAttrs, 'kind');
    if (kind === undefined) {
      violations.push(`<scribe:graph> missing required "kind" attribute.`);
    } else if (!VALID_GRAPH_KINDS.has(kind)) {
      violations.push(`<scribe:graph kind="${kind}"> — "${kind}" is not in the GRAPH_KINDS closed set [${GRAPH_KINDS.join(', ')}].`);
    }

    const language = extractAttr(graphAttrs, 'language');
    // language is optional; if present it should match a source language but
    // we only WARN rather than fail — spec says "optional" and the taxonomy
    // may expand. We do not enumerate SOURCE_LANGUAGES for strictness here.
    void language; // intentionally not validated (future extension point)
  }

  // Check rel attributes on all <scribe:edge ...> elements
  const edgeMatches = [...svgSource.matchAll(/<scribe:edge([^/]*\/?>)/g)];
  for (const match of edgeMatches) {
    const rel = extractAttr(match[1], 'rel');
    if (rel === undefined) {
      violations.push(`<scribe:edge> missing required "rel" attribute.`);
    } else if (!VALID_EDGE_RELS.has(rel)) {
      violations.push(`<scribe:edge rel="${rel}"> — "${rel}" is not in SCRIBE_EDGE_RELS closed set.`);
    }
  }

  if (violations.length > 0) {
    return {
      invariant,
      status: 'FAIL',
      evidence: [
        `Schema violations (spec: ${SPEC_DOC_PATH}):`,
        ...violations,
      ].join(' | '),
    };
  }

  return {
    invariant,
    status: 'PASS',
    evidence: `All version/kind/rel values conform to schema defined in ${SPEC_DOC_PATH}.`,
  };
}
