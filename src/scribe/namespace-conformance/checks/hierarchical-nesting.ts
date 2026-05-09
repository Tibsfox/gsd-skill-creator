/**
 * Invariant 3 — Hierarchical nesting.
 *
 * T1 doc 06 §4 Invariant 3: the data model is a tree (with named-edge
 * attributes). Every member exposes a rooted, ordered, attributed tree.
 * Well-formed nesting; no cross-cutting overlaps. The SCRIBE namespace uses
 * the `fast-xml-parser` transitive dep for XML well-formedness checking.
 *
 * For SCRIBE specifically:
 * - `<scribe:graph>` must close before `</metadata>`.
 * - `<scribe:nodes>` / `<scribe:edges>` must be direct children of
 *   `<scribe:graph>`.
 * - No interleaving of SCRIBE elements from different parent contexts.
 *
 * @module scribe/namespace-conformance/checks/hierarchical-nesting
 */

import { XMLValidator } from 'fast-xml-parser';
import type { InvariantFinding } from '../invariants.js';

/**
 * Checks that the SVG is well-formed XML with hierarchically nested SCRIBE
 * elements (no cross-cutting overlaps).
 *
 * PASS — `fast-xml-parser` can parse the document without error, AND the
 *        `<scribe:graph>` element is properly closed.
 *
 * FAIL — `fast-xml-parser` throws (malformed XML, unclosed tags, overlapping
 *        elements), OR the SCRIBE nesting contract is violated (e.g., a
 *        `</scribe:graph>` closing tag appears after `</metadata>`).
 *
 * @param svgSource Raw SVG XML string to inspect.
 * @returns InvariantFinding for this invariant.
 */
export function checkHierarchicalNesting(svgSource: string): InvariantFinding {
  const invariant = 'hierarchical-nesting' as const;

  // 1. Check XML well-formedness via fast-xml-parser's XMLValidator (strict mode).
  // XMLValidator uses strict tag-balance checking: mismatched/unclosed tags produce
  // a structured error with code + message + line/col, rather than tolerant recovery.
  const validationResult = XMLValidator.validate(svgSource, {
    allowBooleanAttributes: true,
  });

  if (validationResult !== true) {
    const errObj = (validationResult as { err: { code: string; msg: string; line: number; col: number } }).err;
    return {
      invariant,
      status: 'FAIL',
      evidence: `XML validation error (malformed nesting or unclosed tags): [${errObj.code}] ${errObj.msg} (line ${errObj.line}, col ${errObj.col})`,
    };
  }

  // 2. Check SCRIBE-specific nesting contract via structural string analysis.
  // Verify <scribe:graph ...> closes (</scribe:graph>) before </metadata>.
  const metaCloseIdx = svgSource.indexOf('</metadata>');
  const graphCloseIdx = svgSource.indexOf('</scribe:graph>');

  // If there's a <scribe:graph> element it must close before </metadata>
  const graphOpenIdx = svgSource.search(/<scribe:graph[\s>]/);
  if (graphOpenIdx !== -1) {
    if (graphCloseIdx === -1) {
      return {
        invariant,
        status: 'FAIL',
        evidence: `<scribe:graph> element found but </scribe:graph> closing tag is missing. Unclosed element violates hierarchical nesting.`,
      };
    }
    if (metaCloseIdx !== -1 && graphCloseIdx > metaCloseIdx) {
      return {
        invariant,
        status: 'FAIL',
        evidence: `</scribe:graph> appears after </metadata> — SCRIBE nesting contract violated. scribe:graph must be fully nested inside <metadata>.`,
      };
    }

    // 3. Check that scribe:nodes / scribe:edges are inside scribe:graph
    const nodesIdx = svgSource.indexOf('<scribe:nodes>');
    const edgesIdx = svgSource.indexOf('<scribe:edges>');

    if (nodesIdx !== -1 && (nodesIdx < graphOpenIdx || nodesIdx > graphCloseIdx)) {
      return {
        invariant,
        status: 'FAIL',
        evidence: `<scribe:nodes> found outside <scribe:graph> element. Nesting contract: nodes must be children of graph.`,
      };
    }

    if (edgesIdx !== -1 && (edgesIdx < graphOpenIdx || edgesIdx > graphCloseIdx)) {
      return {
        invariant,
        status: 'FAIL',
        evidence: `<scribe:edges> found outside <scribe:graph> element. Nesting contract: edges must be children of graph.`,
      };
    }
  }

  return {
    invariant,
    status: 'PASS',
    evidence: `Document is well-formed XML with properly nested SCRIBE elements.`,
  };
}
