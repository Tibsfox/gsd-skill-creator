/**
 * VTM test plan generator with categorized test spec creation, verification
 * matrix builder, and test density checker.
 *
 * Converts vision document success criteria into structured, categorized test
 * plans. Uses configurable keyword heuristics to classify criteria into
 * safety-critical, core, integration, and edge-case categories, assigns
 * categorized test IDs (S/C/I/E-NNN), and marks safety-critical tests as
 * mandatory-pass deployment blockers.
 *
 * Verification matrix provides dual criterion-centric and test-centric views
 * with auto-stub generation for unmapped criteria. Density checker enforces
 * 2-4 tests per criterion with elevated 3-4 for safety-critical domains,
 * emitting diagnostics based on enforcement mode.
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

// ============================================================================
// Verification Matrix Types
// ============================================================================

/** Criterion-centric view: one row per criterion with all mapped test IDs. */
export interface CriterionViewEntry {
  criterion: string;
  testIds: string[];
}

/** Test-centric view: one row per test with all criteria it covers. */
export interface TestViewEntry {
  testId: string;
  criteria: string[];
}

/** Coverage statistics for the verification matrix. */
export interface CoverageStats {
  totalCriteria: number;
  mappedCriteria: number;
  unmappedCriteria: number;
  coveragePercent: number;
  gaps: string[];
}

/** Complete verification matrix with dual views. */
export interface VerificationMatrix {
  criterionView: CriterionViewEntry[];
  testView: TestViewEntry[];
  coverageStats: CoverageStats;
  stubTests: TestSpec[];
}

// ============================================================================
// Density Report Types
// ============================================================================

/** Per-criterion density breakdown entry. */
export interface CriterionDensity {
  criterion: string;
  testCount: number;
  categories: Record<string, number>;
  status: 'pass' | 'under' | 'over';
}

/** Density diagnostic entry. */
export interface DensityDiagnostic {
  severity: 'warning' | 'error' | 'info';
  code: 'UNDER_DENSITY' | 'OVER_DENSITY' | 'SAFETY_DENSITY_LOW';
  message: string;
  criterion?: string;
}

/** Global density statistics. */
export interface DensityGlobalStats {
  totalCriteria: number;
  totalTests: number;
  averageDensity: number;
  underCount: number;
  overCount: number;
  passCount: number;
}

/** Complete density report. */
export interface DensityReport {
  perCriterion: CriterionDensity[];
  globalStats: DensityGlobalStats;
  diagnostics: DensityDiagnostic[];
}

// ============================================================================
// buildVerificationMatrix
// ============================================================================

/**
 * Builds a verification matrix mapping every success criterion to test IDs.
 *
 * Provides dual views:
 * - criterionView: one entry per criterion with all mapped test IDs
 * - testView: one entry per test with all criteria it covers
 *
 * Criteria with no mapped tests are auto-stubbed with TODO test specs.
 * Coverage statistics report mapped vs unmapped criteria counts and gaps.
 *
 * @param plan - The test plan containing tests and verificationMatrix
 * @param successCriteria - Array of criterion strings to map
 * @returns A complete VerificationMatrix with dual views and coverage stats
 */
export function buildVerificationMatrix(
  plan: TestPlan,
  successCriteria: string[],
): VerificationMatrix {
  // Build criterion-to-testIds map from plan's verificationMatrix
  const criterionToTestIds = new Map<string, string[]>();
  for (const entry of plan.verificationMatrix) {
    criterionToTestIds.set(entry.criterion, [...entry.testIds]);
  }

  // Track which criteria were originally mapped (before stubs)
  const originallyMapped = new Set<string>();
  for (const criterion of successCriteria) {
    if (criterionToTestIds.has(criterion)) {
      originallyMapped.add(criterion);
    }
  }

  // Counter for stub test ID generation
  const stubCounters = new Map<string, number>();
  // Initialize counter to avoid ID conflicts with existing tests
  let maxCoreId = 0;
  for (const test of plan.tests) {
    if (test.category === 'core') {
      const num = parseInt(test.id.replace('C-', ''), 10);
      if (num > maxCoreId) maxCoreId = num;
    }
  }
  stubCounters.set('core', maxCoreId);

  const stubTests: TestSpec[] = [];
  const gaps: string[] = [];

  // Build criterionView, auto-stubbing gaps
  const criterionView: CriterionViewEntry[] = [];
  for (const criterion of successCriteria) {
    let testIds = criterionToTestIds.get(criterion);

    if (!testIds || testIds.length === 0) {
      // Auto-generate stub
      const stubId = generateTestId('core', stubCounters);
      const stub: TestSpec = {
        id: stubId,
        category: 'core',
        verifies: criterion,
        expectedBehavior: `TODO: Define expected behavior for: ${criterion}`,
      };
      stubTests.push(stub);
      testIds = [stubId];
      gaps.push(criterion);
    }

    criterionView.push({ criterion, testIds: [...testIds] });
  }

  // Build test-to-criteria reverse map
  const testToCriteria = new Map<string, string[]>();
  for (const entry of criterionView) {
    for (const testId of entry.testIds) {
      const existing = testToCriteria.get(testId) ?? [];
      existing.push(entry.criterion);
      testToCriteria.set(testId, existing);
    }
  }

  // Build testView
  const testView: TestViewEntry[] = [];
  for (const [testId, criteria] of testToCriteria) {
    testView.push({ testId, criteria: [...criteria] });
  }

  // Compute coverage stats
  const totalCriteria = successCriteria.length;
  const mappedCriteria = originallyMapped.size;
  const unmappedCriteria = totalCriteria - mappedCriteria;
  const coveragePercent = totalCriteria === 0 ? 0 : (mappedCriteria / totalCriteria) * 100;

  return {
    criterionView,
    testView,
    coverageStats: {
      totalCriteria,
      mappedCriteria,
      unmappedCriteria,
      coveragePercent,
      gaps,
    },
    stubTests,
  };
}

// ============================================================================
// checkTestDensity
// ============================================================================

/**
 * Checks test density per criterion against configurable benchmarks.
 *
 * Enforces 2-4 tests per regular criterion and 3-4 for safety-critical
 * criteria. Produces per-criterion breakdown with category distribution,
 * global statistics, and diagnostics with severity based on enforcement mode.
 *
 * For safety-sensitive domains, checks that safety-critical tests make up
 * at least safetyTestThreshold% of total tests.
 *
 * @param plan - The test plan to analyze
 * @param successCriteria - Array of criterion strings
 * @param domain - Domain string for safety sensitivity detection
 * @param config - Optional generator config (defaults to DEFAULT_GENERATOR_CONFIG)
 * @returns A complete DensityReport
 */
export function checkTestDensity(
  plan: TestPlan,
  successCriteria: string[],
  domain: string,
  config?: GeneratorConfig,
): DensityReport {
  const cfg = config ?? DEFAULT_GENERATOR_CONFIG;
  const perCriterion: CriterionDensity[] = [];
  const diagnostics: DensityDiagnostic[] = [];

  // Build test lookup by ID for fast access
  const testById = new Map<string, TestSpec>();
  for (const test of plan.tests) {
    testById.set(test.id, test);
  }

  for (const criterion of successCriteria) {
    // Find matching verificationMatrix entry
    const matrixEntry = plan.verificationMatrix.find(e => e.criterion === criterion);
    const testIds = matrixEntry?.testIds ?? [];

    // Collect actual tests for this criterion
    const criterionTests: TestSpec[] = [];
    for (const id of testIds) {
      const test = testById.get(id);
      if (test) criterionTests.push(test);
    }

    const testCount = criterionTests.length;

    // Build category distribution
    const categories: Record<string, number> = {};
    for (const test of criterionTests) {
      categories[test.category] = (categories[test.category] ?? 0) + 1;
    }

    // Determine if safety-critical: any test has category 'safety-critical'
    const isSafetyCritical = criterionTests.some(t => t.category === 'safety-critical');

    // Determine status
    const minRequired = isSafetyCritical ? cfg.safetyDensityMin : cfg.densityRange.min;
    const maxAllowed = cfg.densityRange.max;

    let status: 'pass' | 'under' | 'over';
    if (testCount < minRequired) {
      status = 'under';
    } else if (testCount > maxAllowed) {
      status = 'over';
    } else {
      status = 'pass';
    }

    perCriterion.push({ criterion, testCount, categories, status });

    // Emit diagnostics
    if (status === 'under') {
      diagnostics.push({
        severity: cfg.enforcementMode === 'strict' ? 'error' : 'warning',
        code: 'UNDER_DENSITY',
        message: `Criterion "${criterion}" has ${testCount} test(s), minimum required is ${minRequired}`,
        criterion,
      });
    } else if (status === 'over') {
      diagnostics.push({
        severity: 'info',
        code: 'OVER_DENSITY',
        message: `Criterion "${criterion}" has ${testCount} test(s), maximum recommended is ${maxAllowed}`,
        criterion,
      });
    }
  }

  // Check global safety density for safety-sensitive domains
  const normalizedDomain = domain.toLowerCase();
  const isSafetyDomain = cfg.safetyDomains.some(
    sd => normalizedDomain.includes(sd.toLowerCase()),
  );

  if (isSafetyDomain && plan.totalTests > 0) {
    const safetyPercent = (plan.safetyCriticalCount / plan.totalTests) * 100;
    if (safetyPercent < cfg.safetyTestThreshold) {
      diagnostics.push({
        severity: 'warning',
        code: 'SAFETY_DENSITY_LOW',
        message: `Domain "${domain}" is safety-sensitive but only ${safetyPercent.toFixed(1)}% of tests are safety-critical (threshold: ${cfg.safetyTestThreshold}%)`,
      });
    }
  }

  // Compute global stats
  const totalCriteria = perCriterion.length;
  const totalTests = plan.totalTests;
  const averageDensity = totalCriteria === 0 ? 0 : totalTests / totalCriteria;
  const underCount = perCriterion.filter(e => e.status === 'under').length;
  const overCount = perCriterion.filter(e => e.status === 'over').length;
  const passCount = perCriterion.filter(e => e.status === 'pass').length;

  return {
    perCriterion,
    globalStats: {
      totalCriteria,
      totalTests,
      averageDensity,
      underCount,
      overCount,
      passCount,
    },
    diagnostics,
  };
}
