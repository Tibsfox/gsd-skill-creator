/**
 * Tests for VTM test plan generator, safety classifier, and test ID generator.
 *
 * Covers:
 * - DEFAULT_GENERATOR_CONFIG: generator config structure with keyword sets
 * - createGeneratorConfig(): deep copy factory with optional overrides
 * - classifyCriterion(): criterion category classification with priority ordering
 * - classifySafetyCritical(): safety-critical marking with domain-aware diagnostics
 * - generateTestId(): categorized test ID generation (S/C/I/E-NNN pattern)
 * - generateTestPlan(): full test plan generation from vision success criteria
 *
 * All functions are pure functional API. Generator config is standalone and
 * reusable across vision documents.
 */

import { describe, it, expect } from 'vitest';
import type { TestSpec, TestCategory, TestPlan, VisionDocument } from '../types.js';
import {
  DEFAULT_GENERATOR_CONFIG,
  createGeneratorConfig,
  classifyCriterion,
  classifySafetyCritical,
  generateTestId,
  generateTestPlan,
  type GeneratorConfig,
  type ClassificationOverrides,
  type SafetyDiagnostic,
} from '../test-plan-generator.js';

// ---------------------------------------------------------------------------
// DEFAULT_GENERATOR_CONFIG -- generator config structure
// ---------------------------------------------------------------------------

describe('DEFAULT_GENERATOR_CONFIG', () => {
  it('is an object with safetyKeywords, integrationKeywords, edgeCaseKeywords, and coreKeywords arrays', () => {
    expect(Array.isArray(DEFAULT_GENERATOR_CONFIG.safetyKeywords)).toBe(true);
    expect(Array.isArray(DEFAULT_GENERATOR_CONFIG.integrationKeywords)).toBe(true);
    expect(Array.isArray(DEFAULT_GENERATOR_CONFIG.edgeCaseKeywords)).toBe(true);
    expect(Array.isArray(DEFAULT_GENERATOR_CONFIG.coreKeywords)).toBe(true);
  });

  it('safetyKeywords includes: "must not", "security", "data loss", "safety", "block deployment", "mandatory", "prevent", "protect", "never allow", "critical failure"', () => {
    const expected = ['must not', 'security', 'data loss', 'safety', 'block deployment', 'mandatory', 'prevent', 'protect', 'never allow', 'critical failure'];
    for (const kw of expected) {
      expect(DEFAULT_GENERATOR_CONFIG.safetyKeywords).toContain(kw);
    }
  });

  it('integrationKeywords includes: "interact", "communicate", "cross-component", "end-to-end", "multi-module", "between", "coordinate", "synchronize"', () => {
    const expected = ['interact', 'communicate', 'cross-component', 'end-to-end', 'multi-module', 'between', 'coordinate', 'synchronize'];
    for (const kw of expected) {
      expect(DEFAULT_GENERATOR_CONFIG.integrationKeywords).toContain(kw);
    }
  });

  it('edgeCaseKeywords includes: "boundary", "edge case", "overflow", "empty", "maximum", "minimum", "unexpected", "invalid", "malformed", "timeout"', () => {
    const expected = ['boundary', 'edge case', 'overflow', 'empty', 'maximum', 'minimum', 'unexpected', 'invalid', 'malformed', 'timeout'];
    for (const kw of expected) {
      expect(DEFAULT_GENERATOR_CONFIG.edgeCaseKeywords).toContain(kw);
    }
  });

  it('coreKeywords is an empty array (core is the default fallback category)', () => {
    expect(DEFAULT_GENERATOR_CONFIG.coreKeywords).toEqual([]);
  });

  it('has a safetyDomains string array for domain-level safety sensitivity detection', () => {
    expect(Array.isArray(DEFAULT_GENERATOR_CONFIG.safetyDomains)).toBe(true);
    const expected = ['medical', 'automotive', 'financial', 'electrical', 'chemical', 'nuclear', 'aviation'];
    for (const domain of expected) {
      expect(DEFAULT_GENERATOR_CONFIG.safetyDomains).toContain(domain);
    }
  });

  it('has a densityRange: { min: 2, max: 4 } for tests-per-criterion benchmarks', () => {
    expect(DEFAULT_GENERATOR_CONFIG.densityRange).toEqual({ min: 2, max: 4 });
  });

  it('has a safetyDensityMin: 3 for safety-critical criteria minimum tests', () => {
    expect(DEFAULT_GENERATOR_CONFIG.safetyDensityMin).toBe(3);
  });

  it('has a safetyTestThreshold: 15 for minimum percentage of safety-critical tests in safety domains', () => {
    expect(DEFAULT_GENERATOR_CONFIG.safetyTestThreshold).toBe(15);
  });

  it('has an enforcementMode: "warning" (default)', () => {
    expect(DEFAULT_GENERATOR_CONFIG.enforcementMode).toBe('warning');
  });

  it('createGeneratorConfig() with no args returns a deep copy of DEFAULT_GENERATOR_CONFIG', () => {
    const config = createGeneratorConfig();
    expect(config).toEqual(DEFAULT_GENERATOR_CONFIG);
    expect(config).not.toBe(DEFAULT_GENERATOR_CONFIG);
    // Verify deep copy -- mutating returned config should not affect default
    config.safetyKeywords.push('custom-keyword');
    expect(DEFAULT_GENERATOR_CONFIG.safetyKeywords).not.toContain('custom-keyword');
  });

  it('createGeneratorConfig() with overrides merges specified fields', () => {
    const config = createGeneratorConfig({
      safetyKeywords: ['custom-safety'],
      enforcementMode: 'strict',
    });
    expect(config.safetyKeywords).toEqual(['custom-safety']);
    expect(config.enforcementMode).toBe('strict');
    // Non-overridden fields remain
    expect(config.integrationKeywords).toEqual(DEFAULT_GENERATOR_CONFIG.integrationKeywords);
  });
});

// ---------------------------------------------------------------------------
// classifyCriterion -- criterion category classification
// ---------------------------------------------------------------------------

describe('classifyCriterion', () => {
  const config = createGeneratorConfig();

  it('criterion "must not lose data under any circumstances" -> category: "safety-critical"', () => {
    expect(classifyCriterion('must not lose data under any circumstances', config)).toBe('safety-critical');
  });

  it('criterion "security tokens expire after configured TTL" -> category: "safety-critical"', () => {
    expect(classifyCriterion('security tokens expire after configured TTL', config)).toBe('safety-critical');
  });

  it('criterion "components communicate via event bus" -> category: "integration"', () => {
    expect(classifyCriterion('components communicate via event bus', config)).toBe('integration');
  });

  it('criterion "end-to-end pipeline produces valid output" -> category: "integration"', () => {
    expect(classifyCriterion('end-to-end pipeline produces valid output', config)).toBe('integration');
  });

  it('criterion "handles empty input gracefully" -> category: "edge-case"', () => {
    expect(classifyCriterion('handles empty input gracefully', config)).toBe('edge-case');
  });

  it('criterion "boundary values are validated" -> category: "edge-case"', () => {
    expect(classifyCriterion('boundary values are validated', config)).toBe('edge-case');
  });

  it('criterion "user can see existing messages" -> category: "core"', () => {
    expect(classifyCriterion('user can see existing messages', config)).toBe('core');
  });

  it('criterion "schema validates all required fields" -> category: "core"', () => {
    expect(classifyCriterion('schema validates all required fields', config)).toBe('core');
  });

  it('when criterion matches both safety and integration, safety wins (priority: safety > integration > edge > core)', () => {
    expect(classifyCriterion('security communication between services must not fail', config)).toBe('safety-critical');
  });

  it('classification is case-insensitive ("MUST NOT" matches "must not")', () => {
    expect(classifyCriterion('MUST NOT lose data', config)).toBe('safety-critical');
  });

  it('classifyCriterion accepts optional user overrides: safetyOverrides force criteria to safety', () => {
    const overrides: ClassificationOverrides = {
      safetyOverrides: ['existing messages'],
      nonSafetyOverrides: [],
    };
    // "user can see existing messages" normally -> core, but with safetyOverrides -> safety-critical
    expect(classifyCriterion('user can see existing messages', config, overrides)).toBe('safety-critical');
  });

  it('classifyCriterion accepts optional user overrides: nonSafetyOverrides downgrade from safety', () => {
    const overrides: ClassificationOverrides = {
      safetyOverrides: [],
      nonSafetyOverrides: ['security tokens'],
    };
    // "security tokens expire after configured TTL" normally -> safety-critical, but with nonSafetyOverrides -> not safety
    const result = classifyCriterion('security tokens expire after configured TTL', config, overrides);
    expect(result).not.toBe('safety-critical');
  });

  it('user override matching is by substring on the criterion text', () => {
    const overrides: ClassificationOverrides = {
      safetyOverrides: ['existing'],
      nonSafetyOverrides: [],
    };
    // Substring "existing" matches "user can see existing messages"
    expect(classifyCriterion('user can see existing messages', config, overrides)).toBe('safety-critical');
  });
});

// ---------------------------------------------------------------------------
// classifySafetyCritical -- safety-critical marking
// ---------------------------------------------------------------------------

describe('classifySafetyCritical', () => {
  const config = createGeneratorConfig();

  it('test classified as "safety-critical" category has mandatoryPass: true', () => {
    const tests: TestSpec[] = [
      { id: 'S-001', category: 'safety-critical', verifies: 'data integrity', expectedBehavior: 'no data loss' },
    ];
    const result = classifySafetyCritical(tests, 'web-app', config);
    expect(result.mandatoryPassIds).toContain('S-001');
  });

  it('test classified as "core" category has mandatoryPass: false', () => {
    const tests: TestSpec[] = [
      { id: 'C-001', category: 'core', verifies: 'display messages', expectedBehavior: 'messages shown' },
    ];
    const result = classifySafetyCritical(tests, 'web-app', config);
    expect(result.mandatoryPassIds).not.toContain('C-001');
  });

  it('test classified as "integration" category has mandatoryPass: false', () => {
    const tests: TestSpec[] = [
      { id: 'I-001', category: 'integration', verifies: 'event bus', expectedBehavior: 'events delivered' },
    ];
    const result = classifySafetyCritical(tests, 'web-app', config);
    expect(result.mandatoryPassIds).not.toContain('I-001');
  });

  it('test classified as "edge-case" category has mandatoryPass: false', () => {
    const tests: TestSpec[] = [
      { id: 'E-001', category: 'edge-case', verifies: 'empty input', expectedBehavior: 'graceful handling' },
    ];
    const result = classifySafetyCritical(tests, 'web-app', config);
    expect(result.mandatoryPassIds).not.toContain('E-001');
  });

  it('returns a deployment blockers list containing all mandatory-pass test IDs', () => {
    const tests: TestSpec[] = [
      { id: 'S-001', category: 'safety-critical', verifies: 'data integrity', expectedBehavior: 'no data loss' },
      { id: 'S-002', category: 'safety-critical', verifies: 'auth check', expectedBehavior: 'unauthorized blocked' },
      { id: 'C-001', category: 'core', verifies: 'display', expectedBehavior: 'shown' },
    ];
    const result = classifySafetyCritical(tests, 'web-app', config);
    expect(result.mandatoryPassIds).toEqual(['S-001', 'S-002']);
  });

  it('when domain is safety-sensitive AND zero safety tests exist, returns a warning diagnostic', () => {
    const tests: TestSpec[] = [
      { id: 'C-001', category: 'core', verifies: 'display', expectedBehavior: 'shown' },
    ];
    const result = classifySafetyCritical(tests, 'medical device controller', config);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].severity).toBe('warning');
    expect(result.diagnostics[0].code).toBe('ZERO_SAFETY_TESTS');
  });

  it('when domain is NOT safety-sensitive, no warning for zero safety tests', () => {
    const tests: TestSpec[] = [
      { id: 'C-001', category: 'core', verifies: 'display', expectedBehavior: 'shown' },
    ];
    const result = classifySafetyCritical(tests, 'blog platform', config);
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateTestId -- categorized test ID generation
// ---------------------------------------------------------------------------

describe('generateTestId', () => {
  it('first safety test gets ID "S-001"', () => {
    const counters = new Map<string, number>();
    expect(generateTestId('safety-critical', counters)).toBe('S-001');
  });

  it('second safety test gets ID "S-002"', () => {
    const counters = new Map<string, number>();
    generateTestId('safety-critical', counters);
    expect(generateTestId('safety-critical', counters)).toBe('S-002');
  });

  it('first core test gets ID "C-001"', () => {
    const counters = new Map<string, number>();
    expect(generateTestId('core', counters)).toBe('C-001');
  });

  it('first integration test gets ID "I-001"', () => {
    const counters = new Map<string, number>();
    expect(generateTestId('integration', counters)).toBe('I-001');
  });

  it('first edge-case test gets ID "E-001"', () => {
    const counters = new Map<string, number>();
    expect(generateTestId('edge-case', counters)).toBe('E-001');
  });

  it('IDs are sequential per category', () => {
    const counters = new Map<string, number>();
    expect(generateTestId('safety-critical', counters)).toBe('S-001');
    expect(generateTestId('safety-critical', counters)).toBe('S-002');
    expect(generateTestId('core', counters)).toBe('C-001');
    expect(generateTestId('core', counters)).toBe('C-002');
    expect(generateTestId('integration', counters)).toBe('I-001');
    expect(generateTestId('edge-case', counters)).toBe('E-001');
  });

  it('IDs match the regex /^[SCIE]-\\d{3}$/', () => {
    const counters = new Map<string, number>();
    const pattern = /^[SCIE]-\d{3}$/;
    expect(generateTestId('safety-critical', counters)).toMatch(pattern);
    expect(generateTestId('core', counters)).toMatch(pattern);
    expect(generateTestId('integration', counters)).toMatch(pattern);
    expect(generateTestId('edge-case', counters)).toMatch(pattern);
  });

  it('counters reset between generateTestPlan calls (not global state)', () => {
    // Generate two separate plans and check IDs start from 001 each time
    const input = {
      name: 'test-component',
      successCriteria: ['user can log in'],
    };
    const plan1 = generateTestPlan(input);
    const plan2 = generateTestPlan(input);
    // Both plans should start IDs from 001
    expect(plan1.tests[0].id).toMatch(/-001$/);
    expect(plan2.tests[0].id).toMatch(/-001$/);
  });
});

// ---------------------------------------------------------------------------
// generateTestPlan -- full test plan generation
// ---------------------------------------------------------------------------

describe('generateTestPlan', () => {
  it('accepts VisionDocument-like input with successCriteria string array and produces a TestPlan', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['user can log in', 'system handles errors'],
    };
    const plan = generateTestPlan(input);
    expect(plan).toHaveProperty('milestoneName');
    expect(plan).toHaveProperty('tests');
    expect(plan).toHaveProperty('categories');
    expect(plan).toHaveProperty('totalTests');
    expect(plan).toHaveProperty('verificationMatrix');
  });

  it('each criterion produces 2-3 test specs (within density range)', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['user can log in', 'system displays dashboard'],
    };
    const plan = generateTestPlan(input);
    // Each core criterion should produce densityRange.min (2) tests
    // Total: 2 criteria * 2 tests = 4 tests minimum
    expect(plan.totalTests).toBeGreaterThanOrEqual(4);
    expect(plan.totalTests).toBeLessThanOrEqual(8); // 2 criteria * max 4
  });

  it('all tests in the output have valid categorized IDs matching /^[SCIE]-\\d{3}$/', () => {
    const input = {
      name: 'test-component',
      successCriteria: [
        'must not lose data',
        'components communicate via bus',
        'handles empty input',
        'user can view profile',
      ],
    };
    const plan = generateTestPlan(input);
    const pattern = /^[SCIE]-\d{3}$/;
    for (const test of plan.tests) {
      expect(test.id).toMatch(pattern);
    }
  });

  it('safety-critical tests appear in categories array with priority "mandatory-pass" and failureAction "block"', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['must not lose data under any circumstances'],
    };
    const plan = generateTestPlan(input);
    const safetyCategory = plan.categories.find(c => c.name === 'safety-critical');
    expect(safetyCategory).toBeDefined();
    expect(safetyCategory!.priority).toBe('mandatory-pass');
    expect(safetyCategory!.failureAction).toBe('block');
  });

  it('core tests appear in categories array with priority "required" and failureAction "block"', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['user can view profile'],
    };
    const plan = generateTestPlan(input);
    const coreCategory = plan.categories.find(c => c.name === 'core');
    expect(coreCategory).toBeDefined();
    expect(coreCategory!.priority).toBe('required');
    expect(coreCategory!.failureAction).toBe('block');
  });

  it('integration tests appear in categories array with priority "required" and failureAction "log"', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['components communicate via event bus'],
    };
    const plan = generateTestPlan(input);
    const integrationCategory = plan.categories.find(c => c.name === 'integration');
    expect(integrationCategory).toBeDefined();
    expect(integrationCategory!.priority).toBe('required');
    expect(integrationCategory!.failureAction).toBe('log');
  });

  it('edge-case tests appear in categories array with priority "best-effort" and failureAction "log"', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['handles empty input gracefully'],
    };
    const plan = generateTestPlan(input);
    const edgeCategory = plan.categories.find(c => c.name === 'edge-case');
    expect(edgeCategory).toBeDefined();
    expect(edgeCategory!.priority).toBe('best-effort');
    expect(edgeCategory!.failureAction).toBe('log');
  });

  it('TestPlan.totalTests equals the sum of all test specs', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['must not lose data', 'user can log in', 'handles empty input'],
    };
    const plan = generateTestPlan(input);
    expect(plan.totalTests).toBe(plan.tests.length);
  });

  it('TestPlan.safetyCriticalCount equals the number of tests with category "safety-critical"', () => {
    const input = {
      name: 'test-component',
      successCriteria: ['must not lose data', 'user can log in'],
    };
    const plan = generateTestPlan(input);
    const safetyTests = plan.tests.filter(t => t.category === 'safety-critical');
    expect(plan.safetyCriticalCount).toBe(safetyTests.length);
  });

  it('TestPlan.categories has exactly 4 entries (one per category) with correct counts', () => {
    const input = {
      name: 'test-component',
      successCriteria: [
        'must not lose data',
        'user can log in',
        'components communicate via bus',
        'handles empty input',
      ],
    };
    const plan = generateTestPlan(input);
    expect(plan.categories).toHaveLength(4);
    const categoryNames = plan.categories.map(c => c.name).sort();
    expect(categoryNames).toEqual(['core', 'edge-case', 'integration', 'safety-critical']);

    // Verify counts match actual test counts
    for (const cat of plan.categories) {
      const actualCount = plan.tests.filter(t => t.category === cat.name).length;
      expect(cat.count).toBe(actualCount);
    }
  });

  it('vision document with safety-domain content and safety criteria produces at least one S-NNN test', () => {
    const input = {
      name: 'medical-device-controller',
      successCriteria: ['must not administer incorrect dosage'],
      domain: 'medical',
    };
    const plan = generateTestPlan(input);
    const safetyTests = plan.tests.filter(t => t.id.startsWith('S-'));
    expect(safetyTests.length).toBeGreaterThanOrEqual(1);
  });

  it('vision document with no safety keywords produces only C/I/E tests (no S tests)', () => {
    const input = {
      name: 'blog-platform',
      successCriteria: ['user can view posts', 'user can write comments'],
    };
    const plan = generateTestPlan(input);
    const safetyTests = plan.tests.filter(t => t.id.startsWith('S-'));
    expect(safetyTests.length).toBe(0);
  });

  it('generated tests have meaningful verifies and expectedBehavior fields derived from criterion text', () => {
    const criterion = 'must not lose data under any circumstances';
    const input = {
      name: 'test-component',
      successCriteria: [criterion],
    };
    const plan = generateTestPlan(input);
    for (const test of plan.tests) {
      expect(test.verifies).toBe(criterion);
      expect(test.expectedBehavior.length).toBeGreaterThan(0);
      // expectedBehavior should reference the criterion
      expect(test.expectedBehavior.toLowerCase()).toContain('must not lose data');
    }
  });
});
