/**
 * VTM test plan generator with categorized test spec creation.
 *
 * Converts vision document success criteria into structured, categorized test
 * plans. Uses configurable keyword heuristics to classify criteria into
 * safety-critical, core, integration, and edge-case categories, assigns
 * categorized test IDs (S/C/I/E-NNN), and marks safety-critical tests as
 * mandatory-pass deployment blockers.
 *
 * Pure functional API — all functions are stateless and composable.
 * Generator config is standalone and reusable across vision documents.
 *
 * @module vtm/test-plan-generator
 */

import type { TestSpec, TestCategory, TestPlan } from './types.js';

// ============================================================================
// Types
// ============================================================================

/** Configuration for the test plan generator. Standalone, reusable across vision documents. */
export interface GeneratorConfig {
  safetyKeywords: string[];
  integrationKeywords: string[];
  edgeCaseKeywords: string[];
  coreKeywords: string[]; // empty by default; core is fallback
  safetyDomains: string[];
  densityRange: { min: number; max: number };
  safetyDensityMin: number;
  safetyTestThreshold: number; // minimum % of safety tests for safety domains
  enforcementMode: 'warning' | 'strict';
}

/** User overrides for criterion classification. Bidirectional: can upgrade or downgrade. */
export interface ClassificationOverrides {
  safetyOverrides: string[]; // substrings that force criteria to safety-critical
  nonSafetyOverrides: string[]; // substrings that downgrade from safety-critical
}

/** Category-to-prefix mapping for test ID generation. */
type CategoryPrefix = 'S' | 'C' | 'I' | 'E';

/** Diagnostic warning for safety domain with no safety tests. */
export interface SafetyDiagnostic {
  severity: 'warning';
  message: string;
  code: 'ZERO_SAFETY_TESTS';
}

/** Input for generateTestPlan. Accepts VisionDocument-like objects. */
export interface TestPlanInput {
  name: string;
  successCriteria: string[];
  domain?: string;
  milestoneName?: string;
  milestoneSpec?: string;
  visionDocument?: string;
}

// ============================================================================
// DEFAULT_GENERATOR_CONFIG
// ============================================================================

/**
 * Default generator configuration with keyword sets for criterion classification.
 *
 * Deep-frozen to prevent accidental mutation. Use createGeneratorConfig() to
 * obtain a mutable copy with optional overrides.
 */
export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = Object.freeze({
  safetyKeywords: Object.freeze([
    'must not',
    'security',
    'data loss',
    'safety',
    'block deployment',
    'mandatory',
    'prevent',
    'protect',
    'never allow',
    'critical failure',
  ]) as unknown as string[],
  integrationKeywords: Object.freeze([
    'interact',
    'communicate',
    'cross-component',
    'end-to-end',
    'multi-module',
    'between',
    'coordinate',
    'synchronize',
  ]) as unknown as string[],
  edgeCaseKeywords: Object.freeze([
    'boundary',
    'edge case',
    'overflow',
    'empty',
    'maximum',
    'minimum',
    'unexpected',
    'invalid',
    'malformed',
    'timeout',
  ]) as unknown as string[],
  coreKeywords: Object.freeze([]) as unknown as string[],
  safetyDomains: Object.freeze([
    'medical',
    'automotive',
    'financial',
    'electrical',
    'chemical',
    'nuclear',
    'aviation',
  ]) as unknown as string[],
  densityRange: Object.freeze({ min: 2, max: 4 }) as { min: number; max: number },
  safetyDensityMin: 3,
  safetyTestThreshold: 15,
  enforcementMode: 'warning' as const,
}) as GeneratorConfig;

// ============================================================================
// createGeneratorConfig
// ============================================================================

/**
 * Creates a generator config as a deep copy of DEFAULT_GENERATOR_CONFIG,
 * optionally merged with provided overrides.
 *
 * @param overrides - Partial config fields to override defaults
 * @returns A new mutable GeneratorConfig instance
 */
export function createGeneratorConfig(overrides?: Partial<GeneratorConfig>): GeneratorConfig {
  const base: GeneratorConfig = {
    safetyKeywords: [...DEFAULT_GENERATOR_CONFIG.safetyKeywords],
    integrationKeywords: [...DEFAULT_GENERATOR_CONFIG.integrationKeywords],
    edgeCaseKeywords: [...DEFAULT_GENERATOR_CONFIG.edgeCaseKeywords],
    coreKeywords: [...DEFAULT_GENERATOR_CONFIG.coreKeywords],
    safetyDomains: [...DEFAULT_GENERATOR_CONFIG.safetyDomains],
    densityRange: { ...DEFAULT_GENERATOR_CONFIG.densityRange },
    safetyDensityMin: DEFAULT_GENERATOR_CONFIG.safetyDensityMin,
    safetyTestThreshold: DEFAULT_GENERATOR_CONFIG.safetyTestThreshold,
    enforcementMode: DEFAULT_GENERATOR_CONFIG.enforcementMode,
  };

  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    // Deep clone arrays if provided in overrides, otherwise keep base arrays
    safetyKeywords: overrides.safetyKeywords ? [...overrides.safetyKeywords] : base.safetyKeywords,
    integrationKeywords: overrides.integrationKeywords ? [...overrides.integrationKeywords] : base.integrationKeywords,
    edgeCaseKeywords: overrides.edgeCaseKeywords ? [...overrides.edgeCaseKeywords] : base.edgeCaseKeywords,
    coreKeywords: overrides.coreKeywords ? [...overrides.coreKeywords] : base.coreKeywords,
    safetyDomains: overrides.safetyDomains ? [...overrides.safetyDomains] : base.safetyDomains,
    densityRange: overrides.densityRange ? { ...overrides.densityRange } : base.densityRange,
  };
}

// ============================================================================
// classifyCriterion
// ============================================================================

/** Map from category name to prefix character for test IDs. */
const CATEGORY_PREFIX_MAP: Record<TestCategory['name'], CategoryPrefix> = {
  'safety-critical': 'S',
  'core': 'C',
  'integration': 'I',
  'edge-case': 'E',
};

/**
 * Classifies a success criterion into a test category using keyword heuristics.
 *
 * Priority order: safety-critical > integration > edge-case > core (default).
 * Supports bidirectional user overrides for upgrading/downgrading classification.
 *
 * @param criterion - The success criterion text to classify
 * @param config - Generator config containing keyword sets
 * @param overrides - Optional user overrides for safety classification
 * @returns The category name for the criterion
 */
export function classifyCriterion(
  criterion: string,
  config: GeneratorConfig,
  overrides?: ClassificationOverrides,
): TestCategory['name'] {
  const normalized = criterion.toLowerCase();

  // Handle user overrides (bidirectional)
  if (overrides) {
    // Check nonSafetyOverrides first: if any substring matches, skip safety classification
    const isNonSafetyOverride = overrides.nonSafetyOverrides.some(
      sub => normalized.includes(sub.toLowerCase()),
    );

    // Check safetyOverrides: if any substring matches, force safety-critical
    const isSafetyOverride = overrides.safetyOverrides.some(
      sub => normalized.includes(sub.toLowerCase()),
    );

    if (isSafetyOverride && !isNonSafetyOverride) {
      return 'safety-critical';
    }

    // If nonSafetyOverride matched, skip safety keyword check below
    if (!isNonSafetyOverride) {
      // Check safety keywords (highest priority)
      if (matchesKeywords(normalized, config.safetyKeywords)) {
        return 'safety-critical';
      }
    }
  } else {
    // No overrides: check safety keywords normally
    if (matchesKeywords(normalized, config.safetyKeywords)) {
      return 'safety-critical';
    }
  }

  // Check integration keywords
  if (matchesKeywords(normalized, config.integrationKeywords)) {
    return 'integration';
  }

  // Check edge-case keywords
  if (matchesKeywords(normalized, config.edgeCaseKeywords)) {
    return 'edge-case';
  }

  // Default fallback: core
  return 'core';
}

/**
 * Checks if normalized text contains any of the given keywords (case-insensitive).
 */
function matchesKeywords(normalizedText: string, keywords: string[]): boolean {
  return keywords.some(kw => normalizedText.includes(kw.toLowerCase()));
}

// ============================================================================
// classifySafetyCritical
// ============================================================================

/**
 * Identifies safety-critical tests and produces domain-aware diagnostics.
 *
 * Collects all test IDs with category 'safety-critical' as mandatory-pass
 * deployment blockers. If the domain is safety-sensitive and zero safety
 * tests exist, emits a warning diagnostic.
 *
 * @param tests - Array of test specs to analyze
 * @param domain - The domain/context string for the project
 * @param config - Generator config containing safety domain list
 * @returns Object with mandatoryPassIds and diagnostics arrays
 */
export function classifySafetyCritical(
  tests: TestSpec[],
  domain: string,
  config: GeneratorConfig,
): { mandatoryPassIds: string[]; diagnostics: SafetyDiagnostic[] } {
  const mandatoryPassIds = tests
    .filter(t => t.category === 'safety-critical')
    .map(t => t.id);

  const diagnostics: SafetyDiagnostic[] = [];

  // Check if domain is safety-sensitive (case-insensitive substring match)
  const normalizedDomain = domain.toLowerCase();
  const isSafetyDomain = config.safetyDomains.some(
    sd => normalizedDomain.includes(sd.toLowerCase()),
  );

  if (isSafetyDomain && mandatoryPassIds.length === 0) {
    diagnostics.push({
      severity: 'warning',
      message: `Domain "${domain}" is safety-sensitive but zero safety-critical tests were identified. Consider adding safety criteria or explicit safety overrides.`,
      code: 'ZERO_SAFETY_TESTS',
    });
  }

  return { mandatoryPassIds, diagnostics };
}

// ============================================================================
// generateTestId
// ============================================================================

/**
 * Generates a categorized test ID using the S/C/I/E-NNN pattern.
 *
 * Uses a per-call counters map to maintain sequential numbering within
 * each category. Counters should be created fresh for each generateTestPlan
 * invocation to ensure IDs start from 001.
 *
 * @param category - The test category name
 * @param counters - Mutable map tracking per-category counts
 * @returns A test ID string like "S-001", "C-002", etc.
 */
export function generateTestId(
  category: TestCategory['name'],
  counters: Map<string, number>,
): string {
  const prefix = CATEGORY_PREFIX_MAP[category];
  const current = counters.get(category) ?? 0;
  const next = current + 1;
  counters.set(category, next);
  return `${prefix}-${next.toString().padStart(3, '0')}`;
}

// ============================================================================
// generateTestPlan
// ============================================================================

/**
 * Generates a complete test plan from vision document success criteria.
 *
 * For each criterion:
 * 1. Classifies into a category using keyword heuristics
 * 2. Generates the appropriate number of tests (safety gets safetyDensityMin,
 *    others get densityRange.min)
 * 3. Assigns categorized test IDs (S/C/I/E-NNN)
 * 4. Builds verification matrix mapping criteria to test IDs
 *
 * The output TestPlan always has exactly 4 category entries (even if count is 0
 * for some categories) and validates against TestPlanSchema.
 *
 * @param input - Object with name, successCriteria, and optional domain/milestone fields
 * @param config - Optional generator config (defaults to DEFAULT_GENERATOR_CONFIG)
 * @param overrides - Optional classification overrides for bidirectional safety control
 * @returns A complete TestPlan object
 */
export function generateTestPlan(
  input: TestPlanInput,
  config?: GeneratorConfig,
  overrides?: ClassificationOverrides,
): TestPlan {
  const cfg = config ?? DEFAULT_GENERATOR_CONFIG;
  const counters = new Map<string, number>();
  const allTests: TestSpec[] = [];
  const verificationMatrix: Array<{ criterion: string; testIds: string[]; component?: string }> = [];

  for (const criterion of input.successCriteria) {
    const category = classifyCriterion(criterion, cfg, overrides);
    const testCount = category === 'safety-critical' ? cfg.safetyDensityMin : cfg.densityRange.min;
    const criterionTestIds: string[] = [];

    for (let i = 0; i < testCount; i++) {
      const id = generateTestId(category, counters);
      criterionTestIds.push(id);

      const expectedBehavior = category === 'safety-critical'
        ? `System MUST enforce: ${criterion}`
        : `System correctly handles: ${criterion}`;

      allTests.push({
        id,
        category,
        verifies: criterion,
        expectedBehavior,
        component: input.name,
      });
    }

    verificationMatrix.push({
      criterion,
      testIds: criterionTestIds,
      component: input.name,
    });
  }

  // Build categories array with exactly 4 entries
  const categoryCounts = new Map<TestCategory['name'], number>();
  for (const test of allTests) {
    categoryCounts.set(test.category, (categoryCounts.get(test.category) ?? 0) + 1);
  }

  const categories: TestCategory[] = [
    {
      name: 'safety-critical',
      count: categoryCounts.get('safety-critical') ?? 0,
      priority: 'mandatory-pass',
      failureAction: 'block',
    },
    {
      name: 'core',
      count: categoryCounts.get('core') ?? 0,
      priority: 'required',
      failureAction: 'block',
    },
    {
      name: 'integration',
      count: categoryCounts.get('integration') ?? 0,
      priority: 'required',
      failureAction: 'log',
    },
    {
      name: 'edge-case',
      count: categoryCounts.get('edge-case') ?? 0,
      priority: 'best-effort',
      failureAction: 'log',
    },
  ];

  const safetyCriticalCount = categoryCounts.get('safety-critical') ?? 0;

  return {
    milestoneName: input.milestoneName ?? input.name,
    milestoneSpec: input.milestoneSpec ?? `${input.name}-milestone-spec.md`,
    visionDocument: input.visionDocument ?? `${input.name}-vision.md`,
    totalTests: allTests.length,
    safetyCriticalCount,
    targetCoverage: 100,
    categories,
    tests: allTests,
    verificationMatrix,
  };
}
