/**
 * SCRIBE Namespace XML Conformance Validator.
 *
 * Certifies that a SCRIBE-carrying SVG document conforms to all 5 T1 XML
 * family invariants documented in T1 doc 06 §4.
 *
 * ## The 5 invariants (T1 doc 06 §4)
 *
 * 1. **Generic identification** — SCRIBE element names carry semantics
 *    (`<scribe:graph>`, `<scribe:node>`, etc.), not everything-is-a-div.
 * 2. **Attribute-bearing tags** — SCRIBE attributes are typed (`sub_type`,
 *    `rel`, `kind`, `version`, `path`, `sha`), not stringly-typed inline blobs.
 * 3. **Hierarchical nesting** — well-formed XML; data model is a rooted
 *    ordered attributed tree; `<scribe:nodes>/<scribe:edges>` nested in
 *    `<scribe:graph>` nested in `<metadata>`.
 * 4. **Document-type validation** — schema constraints (version/kind/rel closed
 *    enums) derived from the spec at
 *    `examples/cartridges/code-svg-hdl-bridge/svg-to-ast/metadata-spec.md`.
 * 5. **Round-trippable serialisation** — parse → serialize → re-parse produces
 *    a semantically equivalent structure.
 *
 * ## Usage
 *
 * ```typescript
 * import { validateNamespaceConformance } from './src/scribe/namespace-conformance/index.js';
 *
 * const report = validateNamespaceConformance(
 *   'https://tibsfox.com/Research/SCRIBE/ns#',
 *   [svgString1, svgString2]
 * );
 * if (!report.conformant) {
 *   console.error(JSON.stringify(report, null, 2));
 * }
 * ```
 *
 * ## Extending the validator
 *
 * When a future T1 milestone adds a 6th invariant:
 * 1. Create `checks/new-invariant.ts` implementing the check function.
 * 2. Add the check to `INVARIANT_CHECKS` in `invariants.ts`.
 * 3. Add `'new-invariant'` to the `InvariantName` union in `invariants.ts`.
 * 4. Add `'new-invariant'` to the `invariant` discriminator in
 *    `src/scribe/types/errors.ts` → `NamespaceConformanceError`.
 * 5. Add ≥1 PASS test and ≥1 FAIL test to `__tests__/invariants.test.ts`.
 *
 * @module scribe/namespace-conformance
 */

import { runAllInvariantChecks } from './invariants.js';
import type { InvariantFinding } from './invariants.js';
import { NamespaceConformanceError, NAMESPACE_URI } from '../types/index.js';

export type { InvariantFinding } from './invariants.js';
export type { InvariantName, InvariantStatus } from './invariants.js';
export { INVARIANT_CHECKS, runAllInvariantChecks } from './invariants.js';

/**
 * Per-document conformance result.
 */
export interface DocumentConformanceResult {
  /** Document index in the input array (for diagnostic reference). */
  readonly docIndex: number;
  /** Optional label / filename for the document (for diagnostic output). */
  readonly label?: string;
  /** Whether all 5 invariants passed for this document. */
  readonly conformant: boolean;
  /** The 5 invariant findings (in T1 doc 06 §4 order). */
  readonly findings: ReadonlyArray<InvariantFinding>;
}

/**
 * Overall conformance report for the namespace validation run.
 */
export interface ConformanceReport {
  /** The namespace URI that was validated. */
  readonly namespaceUri: string;
  /** Whether ALL documents passed ALL 5 invariants. */
  readonly conformant: boolean;
  /** Per-document results. */
  readonly documents: ReadonlyArray<DocumentConformanceResult>;
  /**
   * Flattened list of all FAIL findings across all documents, as
   * `NamespaceConformanceError` instances. Empty when conformant=true.
   */
  readonly errors: ReadonlyArray<NamespaceConformanceError>;
  /** Total documents checked. */
  readonly totalDocuments: number;
  /** Number of conformant documents. */
  readonly passingDocuments: number;
}

/**
 * Validate that a SCRIBE namespace URI and a set of sample SVG documents
 * conform to all 5 T1 XML family invariants.
 *
 * @param namespaceUri The namespace URI to validate (should equal NAMESPACE_URI).
 * @param sampleDocs   Array of raw SVG XML strings to validate.
 * @param labels       Optional parallel array of labels for each doc (filenames).
 * @returns ConformanceReport with per-document findings and a flattened error list.
 *
 * @throws {NamespaceConformanceError} only when `throwOnFail` option is set.
 */
export function validateNamespaceConformance(
  namespaceUri: string,
  sampleDocs: string[],
  labels?: string[],
): ConformanceReport {
  const documents: DocumentConformanceResult[] = [];
  const errors: NamespaceConformanceError[] = [];

  // Namespace URI identity check — if the URI doesn't match, ALL invariants
  // fail for all documents (wrong namespace = nothing to validate).
  if (namespaceUri !== NAMESPACE_URI) {
    // Return a synthetic FAIL report for the namespace-uri mismatch.
    const finding: InvariantFinding = {
      invariant: 'document-type-validation',
      status: 'FAIL',
      evidence: `Namespace URI mismatch: expected "${NAMESPACE_URI}", got "${namespaceUri}".`,
    };
    const err = new NamespaceConformanceError(finding.evidence, 'document-type-validation', {
      expected: NAMESPACE_URI,
      actual: namespaceUri,
    });
    errors.push(err);

    return {
      namespaceUri,
      conformant: false,
      documents: sampleDocs.map((_, i) => ({
        docIndex: i,
        label: labels?.[i],
        conformant: false,
        findings: [finding],
      })),
      errors,
      totalDocuments: sampleDocs.length,
      passingDocuments: 0,
    };
  }

  for (let i = 0; i < sampleDocs.length; i++) {
    const findings = runAllInvariantChecks(sampleDocs[i]);
    const failFindings = findings.filter(f => f.status === 'FAIL');
    const conformant = failFindings.length === 0;

    documents.push({
      docIndex: i,
      label: labels?.[i],
      conformant,
      findings,
    });

    for (const f of failFindings) {
      errors.push(
        new NamespaceConformanceError(
          `[doc ${i}${labels?.[i] ? ` (${labels[i]})` : ''}] ${f.evidence}`,
          f.invariant,
          { docIndex: i, label: labels?.[i], evidence: f.evidence },
        ),
      );
    }
  }

  const passingDocuments = documents.filter(d => d.conformant).length;

  return {
    namespaceUri,
    conformant: errors.length === 0,
    documents,
    errors,
    totalDocuments: sampleDocs.length,
    passingDocuments,
  };
}
