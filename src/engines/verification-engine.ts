// === Verification Engine ===
//
// Safety-critical verification layer (SAFE-03) that checks dimensional consistency,
// type compatibility, and domain validity at each composition step.
// Operates on CompositionStep/CompositionPath interfaces from mfe-types.ts.
// Uses injected VerificationLookups — never imports composition-engine.ts or registry.

import type {
  CompositionStep,
  CompositionPath,
  PrimitiveType,
  DomainId,
} from '../types/mfe-types.js';

// === Types ===

export interface VerificationFailure {
  stepNumber: number;
  check: 'dimensional' | 'type-compatibility' | 'domain-validity';
  expected: string;
  found: string;
  message: string;
}

export interface VerificationResult {
  status: 'passed' | 'failed';
  stepsChecked: number;
  failures: VerificationFailure[];
  checkedAt: string;
}

export type DimensionalCheck = VerificationFailure & { check: 'dimensional' };
export type TypeCompatibilityCheck = VerificationFailure & { check: 'type-compatibility' };
export type DomainValidityCheck = VerificationFailure & { check: 'domain-validity' };

export interface VerificationLookups {
  primitiveType: (id: string) => PrimitiveType | undefined;
  primitiveDomain: (id: string) => DomainId | undefined;
  domainCompatibility: Map<DomainId, DomainId[]>;
}

export interface VerificationEngine {
  verifyStep(step: CompositionStep, previousStep: CompositionStep | null): VerificationResult;
  verifyPath(path: CompositionPath): VerificationResult;
}

// === Functions (stubs) ===

export function verifyDimensionalConsistency(_steps: CompositionStep[]): VerificationFailure[] {
  throw new Error('Not implemented');
}

export function verifyTypeCompatibility(
  _steps: CompositionStep[],
  _primitiveTypeLookup: (id: string) => PrimitiveType | undefined,
): VerificationFailure[] {
  throw new Error('Not implemented');
}

export function verifyDomainValidity(
  _steps: CompositionStep[],
  _domainLookup: (id: string) => DomainId | undefined,
  _compatibilityMatrix: Map<DomainId, DomainId[]>,
): VerificationFailure[] {
  throw new Error('Not implemented');
}

export function verifyCompositionStep(
  _step: CompositionStep,
  _previousStep: CompositionStep | null,
  _lookups: VerificationLookups,
): VerificationResult {
  throw new Error('Not implemented');
}

export function verifyCompositionPath(
  _path: CompositionPath,
  _lookups: VerificationLookups,
): VerificationResult {
  throw new Error('Not implemented');
}

export function createVerificationEngine(_lookups: VerificationLookups): VerificationEngine {
  throw new Error('Not implemented');
}
