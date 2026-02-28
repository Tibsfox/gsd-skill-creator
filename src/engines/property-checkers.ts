// === Property Checker Library ===
//
// Reusable mathematical property validators for composition results.
// Works at the semantic level — analyzing composition metadata to determine
// whether mathematical properties hold, are violated, or are indeterminate.
//
// Depends on: mfe-types.ts (CompositionStep, CompositionPath, CompositionRule)
// Every checker wraps in try/catch: caught errors become { status: 'error' }.
// Prefers 'indeterminate' over false confidence when metadata is insufficient.

import type {
  CompositionPath,
  CompositionRule,
  PrimitiveType,
} from '../core/types/mfe-types.js';

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

// === Helpers ===

function timestamp(): string {
  return new Date().toISOString();
}

function makeResult(
  property: PropertyName,
  status: PropertyStatus,
  evidence: string,
  stepsAnalyzed: number,
  counterexample?: string,
): PropertyCheckResult {
  const result: PropertyCheckResult = {
    property,
    status,
    evidence,
    stepsAnalyzed,
    checkedAt: timestamp(),
  };
  if (counterexample !== undefined) {
    result.counterexample = counterexample;
  }
  return result;
}

const LINEAR_SIGNALS = ['linear', 'superposition', 'homogeneous'];
const NONLINEAR_SIGNALS = ['nonlinear', 'chaotic', 'exponential', 'quadratic'];
const CONTINUOUS_SIGNALS = ['continuous', 'smooth', 'differentiable'];
const DISCRETE_SIGNALS = ['discrete', 'combinatorial', 'counting'];

// Convergence threshold: average cost per step above this suggests non-convergence
const CONVERGENCE_COST_THRESHOLD = 10;

// === Commutativity ===

export function checkCommutativity(path: CompositionPath, lookups?: PropertyLookups): PropertyCheckResult {
  try {
    const { steps } = path;
    const n = steps.length;

    if (n <= 1) {
      return makeResult('commutativity', 'holds', 'Single step is trivially commutative', n);
    }

    // Check each adjacent pair of steps for data dependency
    for (let i = 0; i < n - 1; i++) {
      const curr = steps[i];
      const next = steps[i + 1];

      // If next step's inputType matches curr step's outputType, there's a sequential dependency
      if (next.inputType === curr.outputType) {
        // Check if composition rules allow parallel (reorderable) composition
        const rules = lookups?.compositionRules(curr.primitive) ?? [];
        const hasParallelRule = rules.some(
          r => r.with === next.primitive && r.type === 'parallel',
        );

        if (!hasParallelRule) {
          return makeResult(
            'commutativity',
            'violated',
            `Steps ${curr.stepNumber} and ${next.stepNumber} have sequential dependency`,
            n,
            `Steps ${curr.stepNumber} and ${next.stepNumber} have sequential dependency: step ${next.stepNumber} requires step ${curr.stepNumber} output type '${curr.outputType}'`,
          );
        }
      }
    }

    // Check if all step pairs have parallel composition rules
    let allParallel = true;
    for (let i = 0; i < n - 1; i++) {
      const curr = steps[i];
      const next = steps[i + 1];
      const rules = lookups?.compositionRules(curr.primitive) ?? [];
      const hasParallelRule = rules.some(
        r => r.with === next.primitive && r.type === 'parallel',
      );
      if (!hasParallelRule) {
        allParallel = false;
        break;
      }
    }

    if (allParallel) {
      return makeResult(
        'commutativity',
        'holds',
        `All ${n} steps have parallel composition rules — reorderable`,
        n,
      );
    }

    // No dependencies found and no explicit parallel rules — still holds
    // (no data dependency means steps are independent)
    return makeResult(
      'commutativity',
      'holds',
      `No sequential dependencies detected across ${n} steps`,
      n,
    );
  } catch (err) {
    return makeResult('commutativity', 'error', `Error: ${String(err)}`, path.steps.length);
  }
}

// === Associativity ===

export function checkAssociativity(path: CompositionPath, lookups?: PropertyLookups): PropertyCheckResult {
  try {
    const { steps } = path;
    const n = steps.length;

    if (n <= 2) {
      return makeResult('associativity', 'holds', `${n <= 1 ? 'Single step' : 'Two steps'} — trivially associative`, n);
    }

    // For 3+ steps, check if regrouping adjacent triples preserves the type chain.
    // (a * b) * c vs a * (b * c) — both should produce compatible output types.
    // We analyze keyword signals: nonlinear primitives may break associativity.
    if (lookups) {
      for (let i = 0; i < n; i++) {
        const keywords = lookups.primitiveKeywords(steps[i].primitive);
        const hasNonlinear = keywords.some(k => NONLINEAR_SIGNALS.includes(k));
        if (hasNonlinear) {
          return makeResult(
            'associativity',
            'indeterminate',
            `Step ${steps[i].stepNumber} uses nonlinear primitive '${steps[i].primitive}' — regrouping may change results`,
            n,
          );
        }
      }
    }

    // Check type chain consistency: for each triple (a, b, c),
    // verify that the intermediate types would be preserved under regrouping
    for (let i = 0; i < n - 2; i++) {
      const a = steps[i];
      const b = steps[i + 1];
      const c = steps[i + 2];

      // If (a*b) produces b.outputType and (b*c) produces c.outputType,
      // and the chain is consistent, associativity holds for this triple.
      // Type chain breaks when inputType !== previous outputType
      if (b.inputType !== a.outputType || c.inputType !== b.outputType) {
        return makeResult(
          'associativity',
          'violated',
          `Type chain broken in triple (${a.stepNumber}, ${b.stepNumber}, ${c.stepNumber})`,
          n,
          `Regrouping steps ${a.stepNumber}-${c.stepNumber} breaks type chain`,
        );
      }
    }

    return makeResult(
      'associativity',
      'holds',
      `All ${n} steps maintain consistent type chain under regrouping`,
      n,
    );
  } catch (err) {
    return makeResult('associativity', 'error', `Error: ${String(err)}`, path.steps.length);
  }
}

// === Linearity ===

export function checkLinearity(path: CompositionPath, lookups?: PropertyLookups): PropertyCheckResult {
  try {
    const { steps } = path;
    const n = steps.length;

    if (!lookups) {
      return makeResult('linearity', 'indeterminate', 'No lookups provided — cannot determine linearity', n);
    }

    // Collect all keywords across all steps
    const allKeywords: string[] = [];
    for (const step of steps) {
      const kw = lookups.primitiveKeywords(step.primitive);
      allKeywords.push(...kw);
    }

    if (allKeywords.length === 0) {
      return makeResult('linearity', 'indeterminate', 'No keywords available for linearity analysis', n);
    }

    // Check for nonlinear signals first (stronger signal)
    const nonlinearKeywords = allKeywords.filter(k => NONLINEAR_SIGNALS.includes(k));
    if (nonlinearKeywords.length > 0) {
      return makeResult(
        'linearity',
        'violated',
        `Nonlinear signals detected: ${nonlinearKeywords.join(', ')}`,
        n,
        `Primitives with nonlinear keywords: ${nonlinearKeywords.join(', ')}`,
      );
    }

    // Check for linear signals
    const linearKeywords = allKeywords.filter(k => LINEAR_SIGNALS.includes(k));
    if (linearKeywords.length > 0) {
      return makeResult(
        'linearity',
        'holds',
        `Linear signals detected: ${linearKeywords.join(', ')}`,
        n,
      );
    }

    return makeResult('linearity', 'indeterminate', 'No conclusive linearity signals in keywords', n);
  } catch (err) {
    return makeResult('linearity', 'error', `Error: ${String(err)}`, path.steps.length);
  }
}

// === Continuity ===

export function checkContinuity(path: CompositionPath, lookups?: PropertyLookups): PropertyCheckResult {
  try {
    const { steps } = path;
    const n = steps.length;

    if (!lookups) {
      return makeResult('continuity', 'indeterminate', 'No lookups provided — cannot determine continuity', n);
    }

    // Analyze keyword signals and primitive types for each step
    let hasContinuousSignal = false;
    let hasDiscreteSignal = false;

    for (const step of steps) {
      const keywords = lookups.primitiveKeywords(step.primitive);
      const primType = lookups.primitiveType(step.primitive);

      if (keywords.some(k => CONTINUOUS_SIGNALS.includes(k))) {
        hasContinuousSignal = true;
      }

      if (keywords.some(k => DISCRETE_SIGNALS.includes(k))) {
        hasDiscreteSignal = true;
      }

      // Algorithm primitives with discrete keywords are strong signals
      if (primType === 'algorithm' && keywords.some(k => DISCRETE_SIGNALS.includes(k))) {
        return makeResult(
          'continuity',
          'violated',
          `Discrete algorithm primitive '${step.primitive}' at step ${step.stepNumber}`,
          n,
          `Step ${step.stepNumber} uses discrete algorithm — breaks continuity`,
        );
      }
    }

    if (hasDiscreteSignal) {
      return makeResult(
        'continuity',
        'violated',
        'Discrete signals detected in composition path',
        n,
        'Path contains primitives with discrete keywords',
      );
    }

    if (hasContinuousSignal) {
      return makeResult(
        'continuity',
        'holds',
        'Continuous signals detected — composition preserves continuity',
        n,
      );
    }

    return makeResult('continuity', 'indeterminate', 'Insufficient metadata to determine continuity', n);
  } catch (err) {
    return makeResult('continuity', 'error', `Error: ${String(err)}`, path.steps.length);
  }
}

// === Convergence ===

export function checkConvergence(path: CompositionPath, _lookups?: PropertyLookups): PropertyCheckResult {
  try {
    const { steps, totalCost } = path;
    const n = steps.length;

    // Short paths are trivially convergent
    if (n <= 2) {
      return makeResult('convergence', 'holds', `${n === 0 ? 'Empty' : n === 1 ? 'Single step' : 'Two steps'} — trivially convergent`, n);
    }

    // Analyze cost-per-step trend
    const avgCostPerStep = totalCost / n;

    if (avgCostPerStep <= CONVERGENCE_COST_THRESHOLD) {
      return makeResult(
        'convergence',
        'holds',
        `Average cost per step (${avgCostPerStep.toFixed(1)}) is within convergence threshold`,
        n,
      );
    }

    return makeResult(
      'convergence',
      'violated',
      `Average cost per step (${avgCostPerStep.toFixed(1)}) exceeds convergence threshold (${CONVERGENCE_COST_THRESHOLD})`,
      n,
      `High average cost (${avgCostPerStep.toFixed(1)} per step over ${n} steps) suggests non-convergence`,
    );
  } catch (err) {
    return makeResult('convergence', 'error', `Error: ${String(err)}`, path.steps.length);
  }
}

// === Generic Interface ===

const ALL_PROPERTIES: PropertyName[] = [
  'commutativity',
  'associativity',
  'linearity',
  'continuity',
  'convergence',
];

const CHECKERS: Record<PropertyName, PropertyChecker> = {
  commutativity: checkCommutativity,
  associativity: checkAssociativity,
  linearity: checkLinearity,
  continuity: checkContinuity,
  convergence: checkConvergence,
};

export function checkProperty(
  name: PropertyName | string,
  path: CompositionPath,
  lookups?: PropertyLookups,
): PropertyCheckResult {
  try {
    const checker = CHECKERS[name as PropertyName];
    if (!checker) {
      return {
        property: name as PropertyName,
        status: 'error',
        evidence: `unknown property '${name}'`,
        stepsAnalyzed: path.steps.length,
        checkedAt: timestamp(),
      };
    }
    return checker(path, lookups);
  } catch (err) {
    return {
      property: name as PropertyName,
      status: 'error',
      evidence: `Error: ${String(err)}`,
      stepsAnalyzed: path.steps.length,
      checkedAt: timestamp(),
    };
  }
}

export function checkAllProperties(
  path: CompositionPath,
  lookups?: PropertyLookups,
): PropertyCheckResult[] {
  return ALL_PROPERTIES.map(name => checkProperty(name, path, lookups));
}

export function createPropertyCheckerSuite(lookups: PropertyLookups): PropertyCheckerSuite {
  return {
    check(property: PropertyName, path: CompositionPath): PropertyCheckResult {
      return checkProperty(property, path, lookups);
    },
    checkAll(path: CompositionPath): PropertyCheckResult[] {
      return checkAllProperties(path, lookups);
    },
  };
}
