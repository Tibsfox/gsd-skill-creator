/**
 * The 5 T1 family invariants as testable predicates.
 *
 * Source: T1 doc 06 §4 — "Shared invariants across the family".
 *
 * Each invariant is a function that takes an SVG source string and returns
 * an InvariantFinding with status PASS / WARN / FAIL and structured evidence.
 *
 * FAIL findings surface as `NamespaceConformanceError` in the full
 * `validateNamespaceConformance` report (see index.ts).
 *
 * @module scribe/namespace-conformance/invariants
 */

import { checkGenericIdentification } from './checks/generic-identification.js';
import { checkAttributeBearing } from './checks/attribute-bearing.js';
import { checkHierarchicalNesting } from './checks/hierarchical-nesting.js';
import { checkDocumentTypeValidation } from './checks/document-type-validation.js';
import { checkRoundtrippableSerialisation } from './checks/roundtrippable-serialisation.js';

/**
 * The discriminator union for the 5 T1 invariant names.
 * Must match the `invariant` field on `NamespaceConformanceError`.
 */
export type InvariantName =
  | 'generic-identification'
  | 'attribute-bearing'
  | 'hierarchical-nesting'
  | 'document-type-validation'
  | 'roundtrippable-serialisation';

/** Allowed result states for an invariant check. */
export type InvariantStatus = 'PASS' | 'WARN' | 'FAIL';

/**
 * Structured result from a single invariant check.
 */
export interface InvariantFinding {
  /** Which of the 5 T1 invariants this finding is for. */
  readonly invariant: InvariantName;
  /** Check result. */
  readonly status: InvariantStatus;
  /**
   * Human-readable evidence. For FAIL: diagnostic info identifying the
   * specific violation. For PASS: summary of what was verified.
   */
  readonly evidence: string;
}

/**
 * Ordered list of the 5 T1 invariant check functions.
 * Order mirrors T1 doc 06 §4 numbering.
 */
export const INVARIANT_CHECKS: ReadonlyArray<{
  name: InvariantName;
  description: string;
  check: (svgSource: string) => InvariantFinding;
}> = Object.freeze([
  {
    name: 'generic-identification' as InvariantName,
    description:
      'T1 Invariant 1 (doc 06 §4): element names carry semantics; not everything-is-a-div.',
    check: checkGenericIdentification,
  },
  {
    name: 'attribute-bearing' as InvariantName,
    description:
      'T1 Invariant 2 (doc 06 §4): attributes carry typed metadata, not stringly-typed inline strings.',
    check: checkAttributeBearing,
  },
  {
    name: 'hierarchical-nesting' as InvariantName,
    description:
      'T1 Invariant 3 (doc 06 §4): well-formed nesting; data model is a rooted attributed tree.',
    check: checkHierarchicalNesting,
  },
  {
    name: 'document-type-validation' as InvariantName,
    description:
      'T1 Invariant 4 (doc 06 §4): schema/spec defines what is valid; closed-enum constraints enforced.',
    check: checkDocumentTypeValidation,
  },
  {
    name: 'roundtrippable-serialisation' as InvariantName,
    description:
      'T1 Invariant 5 (doc 06 §4): parse + re-serialize produces equivalent (modulo whitespace) input.',
    check: checkRoundtrippableSerialisation,
  },
]);

/**
 * Run all 5 invariant checks against a single SVG document.
 *
 * @param svgSource Raw SVG XML string.
 * @returns Array of 5 findings, one per invariant, in T1 doc 06 §4 order.
 */
export function runAllInvariantChecks(svgSource: string): InvariantFinding[] {
  return INVARIANT_CHECKS.map(({ check }) => check(svgSource));
}
