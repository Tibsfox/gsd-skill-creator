// === Verification Engine ===
//
// Safety-critical verification layer (SAFE-03) that checks dimensional consistency,
// type compatibility, and domain validity at each composition step.
// Operates on CompositionStep/CompositionPath interfaces from mfe-types.ts.
// Uses injected VerificationLookups — never imports composition-engine.ts or registry.
//
// SAFE-03: Every function wraps in try/catch. No function returns undefined or null.
// Incompatible compositions always produce explicit VerificationFailure entries.
//
// SAFE-03 (DACP): Verification never throws, never returns undefined
// Attack scenario: A malformed composition step causes an exception inside
// verifyStep(). An uncaught exception propagates to the composition engine,
// which treats it as a program error and halts the entire composition pipeline.
// Consequence of absence: A single malformed step aborts the whole pipeline
// instead of producing a structured VerificationFailure with diagnostic info.

import type {
  CompositionStep,
  CompositionPath,
  PrimitiveType,
  DomainId,
} from '../../core/types/mfe-types.js';

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

// === Helper ===

function timestamp(): string {
  return new Date().toISOString();
}

function makeResult(stepsChecked: number, failures: VerificationFailure[]): VerificationResult {
  return {
    status: failures.length === 0 ? 'passed' : 'failed',
    stepsChecked,
    failures,
    checkedAt: timestamp(),
  };
}

// === Dimensional Consistency ===

export function verifyDimensionalConsistency(steps: CompositionStep[]): VerificationFailure[] {
  try {
    const failures: VerificationFailure[] = [];
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];
      if (curr.inputType !== prev.outputType) {
        failures.push({
          stepNumber: curr.stepNumber,
          check: 'dimensional',
          expected: prev.outputType,
          found: curr.inputType,
          message: `dimensional mismatch at step ${curr.stepNumber}: expected inputType '${prev.outputType}' (from step ${prev.stepNumber} outputType), found '${curr.inputType}'`,
        });
      }
    }
    return failures;
  } catch (err) {
    return [{
      stepNumber: 0,
      check: 'dimensional',
      expected: 'no error',
      found: String(err),
      message: `Dimensional consistency check failed with error: ${String(err)}`,
    }];
  }
}

// === Type Compatibility ===

export function verifyTypeCompatibility(
  steps: CompositionStep[],
  primitiveTypeLookup: (id: string) => PrimitiveType | undefined,
): VerificationFailure[] {
  try {
    const failures: VerificationFailure[] = [];
    for (const step of steps) {
      const primType = primitiveTypeLookup(step.primitive);

      if (primType === undefined) {
        failures.push({
          stepNumber: step.stepNumber,
          check: 'type-compatibility',
          expected: 'known primitive type',
          found: 'undefined',
          message: `Type compatibility: unknown primitive ID '${step.primitive}' at step ${step.stepNumber}`,
        });
        continue;
      }

      // Axioms can only appear at step 1 (the first step in the composition)
      if (primType === 'axiom' && step.stepNumber !== 1) {
        failures.push({
          stepNumber: step.stepNumber,
          check: 'type-compatibility',
          expected: 'axiom only at step 1',
          found: `axiom at step ${step.stepNumber}`,
          message: `Type compatibility: axiom '${step.primitive}' can only appear at step 1, found at step ${step.stepNumber}`,
        });
      }
    }
    return failures;
  } catch (err) {
    return [{
      stepNumber: 0,
      check: 'type-compatibility',
      expected: 'no error',
      found: String(err),
      message: `Type compatibility check failed with error: ${String(err)}`,
    }];
  }
}

// === Domain Validity ===

export function verifyDomainValidity(
  steps: CompositionStep[],
  domainLookup: (id: string) => DomainId | undefined,
  compatibilityMatrix: Map<DomainId, DomainId[]>,
): VerificationFailure[] {
  try {
    const failures: VerificationFailure[] = [];

    // Check each step has a known domain
    for (const step of steps) {
      const domain = domainLookup(step.primitive);
      if (domain === undefined) {
        failures.push({
          stepNumber: step.stepNumber,
          check: 'domain-validity',
          expected: 'known domain',
          found: 'undefined',
          message: `Domain validity: unknown domain for primitive '${step.primitive}' at step ${step.stepNumber}`,
        });
      }
    }

    // Check domain transitions between adjacent steps
    for (let i = 1; i < steps.length; i++) {
      const prevDomain = domainLookup(steps[i - 1].primitive);
      const currDomain = domainLookup(steps[i].primitive);

      // Skip if either domain is unknown (already flagged above)
      if (prevDomain === undefined || currDomain === undefined) continue;

      // Same domain is always valid
      if (prevDomain === currDomain) continue;

      // Check compatibility: the previous domain must list the current domain as compatible
      const compatible = compatibilityMatrix.get(prevDomain) ?? [];
      if (!compatible.includes(currDomain)) {
        failures.push({
          stepNumber: steps[i].stepNumber,
          check: 'domain-validity',
          expected: `domain compatible with '${prevDomain}'`,
          found: currDomain,
          message: `Domain validity: invalid transition from '${prevDomain}' to '${currDomain}' at step ${steps[i].stepNumber}`,
        });
      }
    }

    return failures;
  } catch (err) {
    return [{
      stepNumber: 0,
      check: 'domain-validity',
      expected: 'no error',
      found: String(err),
      message: `Domain validity check failed with error: ${String(err)}`,
    }];
  }
}

// === Single Step Verification ===

export function verifyCompositionStep(
  step: CompositionStep,
  previousStep: CompositionStep | null,
  lookups: VerificationLookups,
): VerificationResult {
  try {
    const allFailures: VerificationFailure[] = [];
    const steps = previousStep ? [previousStep, step] : [step];

    // Dimensional check
    const dimFailures = verifyDimensionalConsistency(steps);
    allFailures.push(...dimFailures);

    // Type compatibility check (only on the current step)
    const typeFailures = verifyTypeCompatibility([step], lookups.primitiveType);
    allFailures.push(...typeFailures);

    // Domain validity check
    const domainFailures = verifyDomainValidity(steps, lookups.primitiveDomain, lookups.domainCompatibility);
    allFailures.push(...domainFailures);

    return makeResult(1, allFailures);
  } catch (err) {
    // SAFE-03: Never throw, never return undefined
    return {
      status: 'failed',
      stepsChecked: 1,
      failures: [{
        stepNumber: step.stepNumber,
        check: 'dimensional',
        expected: 'no error',
        found: String(err),
        message: `Verification step failed with error: ${String(err)}`,
      }],
      checkedAt: timestamp(),
    };
  }
}

// === Full Path Verification ===

export function verifyCompositionPath(
  path: CompositionPath,
  lookups: VerificationLookups,
): VerificationResult {
  try {
    const { steps } = path;

    if (steps.length === 0) {
      return makeResult(0, []);
    }

    const allFailures: VerificationFailure[] = [];

    // Run all three checks across the entire path
    const dimFailures = verifyDimensionalConsistency(steps);
    allFailures.push(...dimFailures);

    const typeFailures = verifyTypeCompatibility(steps, lookups.primitiveType);
    allFailures.push(...typeFailures);

    const domainFailures = verifyDomainValidity(
      steps,
      lookups.primitiveDomain,
      lookups.domainCompatibility,
    );
    allFailures.push(...domainFailures);

    return makeResult(steps.length, allFailures);
  } catch (err) {
    // SAFE-03: Never throw, never return undefined
    return {
      status: 'failed',
      stepsChecked: path.steps.length,
      failures: [{
        stepNumber: 0,
        check: 'dimensional',
        expected: 'no error',
        found: String(err),
        message: `Verification path failed with error: ${String(err)}`,
      }],
      checkedAt: timestamp(),
    };
  }
}

// === Factory ===

export function createVerificationEngine(lookups: VerificationLookups): VerificationEngine {
  return {
    verifyStep(step: CompositionStep, previousStep: CompositionStep | null): VerificationResult {
      return verifyCompositionStep(step, previousStep, lookups);
    },
    verifyPath(path: CompositionPath): VerificationResult {
      return verifyCompositionPath(path, lookups);
    },
  };
}
