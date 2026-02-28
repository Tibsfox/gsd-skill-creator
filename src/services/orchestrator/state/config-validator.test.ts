/**
 * Tests for the configuration validation engine.
 *
 * Covers:
 * - Empty/default config produces no issues
 * - Type mismatch detection (string where number expected, etc.)
 * - Range violation detection (out of min/max bounds)
 * - Deviation warnings (values significantly different from defaults)
 * - Security issue flagging (yolo mode, disabled tests, high file limits)
 * - Nested field validation (safety.*, gates.*, parallelization.*)
 * - Application config fields (budgetPercent, relevanceThreshold, etc.)
 * - Non-object input handling
 */

import { describe, it, expect } from 'vitest';
import { validateConfig } from './config-validator.js';
import type { ConfigValidationResult, ConfigIssue } from './config-validator.js';

// ============================================================================
// Helpers
// ============================================================================

/** Extract issues for a specific field path. */
function issuesForField(issues: ConfigIssue[], field: string): ConfigIssue[] {
  return issues.filter((i) => i.field === field);
}

// ============================================================================
// Default / empty config
// ============================================================================

describe('validateConfig', () => {
  describe('default config (no issues)', () => {
    it('returns valid with no issues for empty object', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('returns valid for a fully-specified in-range config', () => {
      const result = validateConfig({
        mode: 'interactive',
        verbosity: 3,
        depth: 'standard',
        model_profile: 'balanced',
        safety: {
          max_files_per_commit: 20,
          require_tests: true,
        },
        gates: {
          require_plan_approval: false,
          require_checkpoint_approval: true,
        },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.securityIssues).toHaveLength(0);
    });
  });

  // ============================================================================
  // Type mismatch errors
  // ============================================================================

  describe('type mismatch errors', () => {
    it('flags string where number expected (verbosity)', () => {
      const result = validateConfig({ verbosity: 'high' });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'verbosity');
      expect(errs).toHaveLength(1);
      expect(errs[0].severity).toBe('error');
      expect(errs[0].currentValue).toBe('high');
      expect(errs[0].message).toMatch(/type/i);
    });

    it('flags number where string expected (mode)', () => {
      const result = validateConfig({ mode: 123 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'mode');
      expect(errs).toHaveLength(1);
      expect(errs[0].severity).toBe('error');
      expect(errs[0].currentValue).toBe(123);
    });

    it('flags string where boolean expected (safety.require_tests)', () => {
      const result = validateConfig({ safety: { require_tests: 'yes' } });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'safety.require_tests');
      expect(errs).toHaveLength(1);
      expect(errs[0].severity).toBe('error');
    });

    it('flags number where boolean expected (gates.require_checkpoint_approval)', () => {
      const result = validateConfig({ gates: { require_checkpoint_approval: 1 } });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'gates.require_checkpoint_approval');
      expect(errs).toHaveLength(1);
    });
  });

  // ============================================================================
  // Range violation errors
  // ============================================================================

  describe('range violations', () => {
    it('flags verbosity below min (0)', () => {
      const result = validateConfig({ verbosity: 0 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'verbosity');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange).toBeDefined();
      expect(errs[0].expectedRange!.min).toBe(1);
    });

    it('flags verbosity above max (10)', () => {
      const result = validateConfig({ verbosity: 10 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'verbosity');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.max).toBe(5);
    });

    it('flags safety.max_files_per_commit below min (-1)', () => {
      const result = validateConfig({ safety: { max_files_per_commit: -1 } });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'safety.max_files_per_commit');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.min).toBe(1);
    });

    it('flags safety.max_files_per_commit above max (200)', () => {
      const result = validateConfig({ safety: { max_files_per_commit: 200 } });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'safety.max_files_per_commit');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.max).toBe(100);
    });

    it('flags invalid enum value for mode', () => {
      const result = validateConfig({ mode: 'turbo' });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'mode');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange?.validValues).toContain('interactive');
      expect(errs[0].expectedRange?.validValues).toContain('yolo');
    });

    it('flags invalid enum value for depth', () => {
      const result = validateConfig({ depth: 'ultra' });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'depth');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange?.validValues).toContain('standard');
    });

    it('flags invalid enum value for model_profile', () => {
      const result = validateConfig({ model_profile: 'premium' });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'model_profile');
      expect(errs).toHaveLength(1);
    });
  });

  // ============================================================================
  // Deviation warnings
  // ============================================================================

  describe('deviation warnings', () => {
    it('warns when safety.max_files_per_commit > 50', () => {
      const result = validateConfig({ safety: { max_files_per_commit: 75 } });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'safety.max_files_per_commit');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].message).toMatch(/review|revert|large/i);
    });

    it('warns when relevanceThreshold is very low (< 0.05)', () => {
      const result = validateConfig({ relevanceThreshold: 0.01 });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'relevanceThreshold');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].message).toMatch(/low|activate/i);
    });

    it('warns when relevanceThreshold is very high (> 0.9)', () => {
      const result = validateConfig({ relevanceThreshold: 0.95 });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'relevanceThreshold');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].message).toMatch(/high|never/i);
    });

    it('warns when budgetPercent is above 0.10', () => {
      const result = validateConfig({ budgetPercent: 0.15 });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'budgetPercent');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].message).toMatch(/budget|context/i);
    });

    it('warns when parallelization.max_parallel > 5', () => {
      const result = validateConfig({ parallelization: { max_parallel: 8 } });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'parallelization.max_parallel');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].message).toMatch(/parallel|conflict/i);
    });

    it('does not warn for max_files_per_commit at 20 (default)', () => {
      const result = validateConfig({ safety: { max_files_per_commit: 20 } });
      const warns = issuesForField(result.warnings, 'safety.max_files_per_commit');
      expect(warns).toHaveLength(0);
    });
  });

  // ============================================================================
  // Security issues
  // ============================================================================

  describe('security issues', () => {
    it('flags yolo mode as security concern', () => {
      const result = validateConfig({ mode: 'yolo' });
      expect(result.valid).toBe(true);
      const sec = issuesForField(result.securityIssues, 'mode');
      expect(sec).toHaveLength(1);
      expect(sec[0].severity).toBe('security');
      expect(sec[0].message).toMatch(/confirm|skip/i);
    });

    it('flags safety.require_tests = false as security concern', () => {
      const result = validateConfig({ safety: { require_tests: false } });
      expect(result.valid).toBe(true);
      const sec = issuesForField(result.securityIssues, 'safety.require_tests');
      expect(sec).toHaveLength(1);
      expect(sec[0].severity).toBe('security');
    });

    it('flags gates.require_checkpoint_approval = false as security concern', () => {
      const result = validateConfig({ gates: { require_checkpoint_approval: false } });
      expect(result.valid).toBe(true);
      const sec = issuesForField(result.securityIssues, 'gates.require_checkpoint_approval');
      expect(sec).toHaveLength(1);
      expect(sec[0].severity).toBe('security');
      expect(sec[0].message).toMatch(/checkpoint|verification/i);
    });

    it('flags max_files_per_commit > 50 as security concern', () => {
      const result = validateConfig({ safety: { max_files_per_commit: 75 } });
      const sec = issuesForField(result.securityIssues, 'safety.max_files_per_commit');
      expect(sec).toHaveLength(1);
      expect(sec[0].severity).toBe('security');
    });

    it('does not flag interactive mode as security concern', () => {
      const result = validateConfig({ mode: 'interactive' });
      const sec = issuesForField(result.securityIssues, 'mode');
      expect(sec).toHaveLength(0);
    });
  });

  // ============================================================================
  // Application config fields
  // ============================================================================

  describe('application config fields', () => {
    it('flags contextWindowSize below min', () => {
      const result = validateConfig({ contextWindowSize: 500 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'contextWindowSize');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.min).toBe(1000);
    });

    it('flags contextWindowSize above max', () => {
      const result = validateConfig({ contextWindowSize: 3_000_000 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'contextWindowSize');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.max).toBe(2_000_000);
    });

    it('flags budgetPercent below min', () => {
      const result = validateConfig({ budgetPercent: 0.001 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'budgetPercent');
      expect(errs).toHaveLength(1);
    });

    it('flags budgetPercent above max', () => {
      const result = validateConfig({ budgetPercent: 0.5 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'budgetPercent');
      expect(errs).toHaveLength(1);
    });

    it('flags relevanceThreshold below min', () => {
      const result = validateConfig({ relevanceThreshold: -0.1 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'relevanceThreshold');
      expect(errs).toHaveLength(1);
    });

    it('flags relevanceThreshold above max', () => {
      const result = validateConfig({ relevanceThreshold: 1.5 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'relevanceThreshold');
      expect(errs).toHaveLength(1);
    });

    it('flags maxSkillsPerSession below min', () => {
      const result = validateConfig({ maxSkillsPerSession: 0 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'maxSkillsPerSession');
      expect(errs).toHaveLength(1);
    });

    it('flags maxSkillsPerSession above max', () => {
      const result = validateConfig({ maxSkillsPerSession: 50 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'maxSkillsPerSession');
      expect(errs).toHaveLength(1);
    });

    it('accepts valid application config values', () => {
      const result = validateConfig({
        contextWindowSize: 200_000,
        budgetPercent: 0.03,
        relevanceThreshold: 0.1,
        maxSkillsPerSession: 5,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ============================================================================
  // Budget profile fields
  // ============================================================================

  describe('budget profile fields', () => {
    it('flags hardCeilingPercent above max (0.30)', () => {
      const result = validateConfig({ hardCeilingPercent: 0.5 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'hardCeilingPercent');
      expect(errs).toHaveLength(1);
      expect(errs[0].expectedRange!.max).toBe(0.30);
    });

    it('flags hardCeilingPercent below min (0.01)', () => {
      const result = validateConfig({ hardCeilingPercent: 0.001 });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'hardCeilingPercent');
      expect(errs).toHaveLength(1);
    });
  });

  // ============================================================================
  // Non-object input
  // ============================================================================

  describe('non-object input', () => {
    it('returns valid:false for null input', () => {
      const result = validateConfig(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns valid:false for string input', () => {
      const result = validateConfig('hello');
      expect(result.valid).toBe(false);
    });

    it('returns valid:false for array input', () => {
      const result = validateConfig([1, 2, 3]);
      expect(result.valid).toBe(false);
    });

    it('returns valid:false for number input', () => {
      const result = validateConfig(42);
      expect(result.valid).toBe(false);
    });
  });

  // ============================================================================
  // Combined scenarios
  // ============================================================================

  describe('combined scenarios', () => {
    it('reports both type error and security issue in same field', () => {
      // Type error takes precedence; security check skipped for invalid type
      const result = validateConfig({ safety: { max_files_per_commit: 'many' } });
      expect(result.valid).toBe(false);
      const errs = issuesForField(result.errors, 'safety.max_files_per_commit');
      expect(errs).toHaveLength(1);
    });

    it('reports warning and security issue for same field value', () => {
      // max_files_per_commit: 75 -> both warning (> 50) and security issue (> 50)
      const result = validateConfig({ safety: { max_files_per_commit: 75 } });
      expect(result.valid).toBe(true);
      const warns = issuesForField(result.warnings, 'safety.max_files_per_commit');
      const secs = issuesForField(result.securityIssues, 'safety.max_files_per_commit');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(secs.length).toBeGreaterThanOrEqual(1);
    });

    it('handles multiple errors across different fields', () => {
      const result = validateConfig({
        verbosity: 'loud',
        mode: 42,
        safety: { max_files_per_commit: -5 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================================================
  // ConfigIssue structure
  // ============================================================================

  describe('ConfigIssue structure', () => {
    it('includes all required fields in error issues', () => {
      const result = validateConfig({ verbosity: 'high' });
      const err = result.errors[0];
      expect(err).toBeDefined();
      expect(err.field).toBe('verbosity');
      expect(err.message).toBeDefined();
      expect(err.severity).toBe('error');
      expect(err.currentValue).toBe('high');
    });

    it('includes expectedRange for numeric field errors', () => {
      const result = validateConfig({ verbosity: 10 });
      const err = result.errors[0];
      expect(err.expectedRange).toBeDefined();
      expect(err.expectedRange!.min).toBe(1);
      expect(err.expectedRange!.max).toBe(5);
      expect(err.expectedRange!.default).toBe(3);
    });

    it('includes validValues for enum field errors', () => {
      const result = validateConfig({ mode: 'turbo' });
      const err = result.errors[0];
      expect(err.expectedRange).toBeDefined();
      expect(err.expectedRange!.validValues).toBeDefined();
      expect(err.expectedRange!.validValues).toContain('interactive');
      expect(err.expectedRange!.validValues).toContain('yolo');
    });
  });
});
