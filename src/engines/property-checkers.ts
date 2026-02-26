// === Property Checker Library ===
//
// Reusable mathematical property validators for composition results.
// Works at the semantic level — analyzing composition metadata to determine
// whether mathematical properties hold, are violated, or are indeterminate.
//
// Depends on: mfe-types.ts (CompositionStep, CompositionPath, CompositionRule)
//             verification-engine.ts (VerificationLookups for primitive metadata)

import type {
  CompositionPath,
  CompositionRule,
  PrimitiveType,
} from '../types/mfe-types.js';

// === Types ===

export type PropertyStatus = 'holds' | 'violated' | 'indeterminate' | 'error';

export type PropertyName = 'commutativity' | 'associativity' | 'linearity' | 'continuity' | 'convergence';

export interface PropertyCheckResult {
  property: PropertyName;
  status: PropertyStatus;
  evidence: string;
  counterexample?: string;
  stepsAnalyzed: number;
  checkedAt: string;
}

export type PropertyChecker = (path: CompositionPath, lookups?: PropertyLookups) => PropertyCheckResult;

export interface PropertyLookups {
  primitiveKeywords: (id: string) => string[];
  primitiveType: (id: string) => PrimitiveType | undefined;
  compositionRules: (id: string) => CompositionRule[];
}

export interface PropertyCheckerSuite {
  check(property: PropertyName, path: CompositionPath): PropertyCheckResult;
  checkAll(path: CompositionPath): PropertyCheckResult[];
}

// === Functions (stubs) ===

export function checkCommutativity(_path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkAssociativity(_path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkLinearity(_path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkContinuity(_path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkConvergence(_path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkProperty(
  _name: PropertyName | string,
  _path: CompositionPath,
  _lookups?: PropertyLookups,
): PropertyCheckResult {
  throw new Error('Not implemented');
}

export function checkAllProperties(
  _path: CompositionPath,
  _lookups?: PropertyLookups,
): PropertyCheckResult[] {
  throw new Error('Not implemented');
}

export function createPropertyCheckerSuite(_lookups: PropertyLookups): PropertyCheckerSuite {
  throw new Error('Not implemented');
}
