/**
 * Tests for gate config YAML loader and file-level validator.
 *
 * Covers:
 * - Valid YAML loading for all milestone types
 * - Invalid milestone_type rejection
 * - Missing required fields in gate definitions
 * - Malformed YAML syntax handling
 * - Empty input handling
 * - File-based loading with path-prefixed errors
 * - Nonexistent file handling
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadGateConfig, validateGateConfigFile } from './gate-loader.js';

// ============================================================================
// Test fixtures
// ============================================================================

const VALID_PEDAGOGICAL_YAML = `
version: "1.0"
milestone: "v1.53"
milestone_type: pedagogical
gates:
  per_subversion:
    - name: teaching-note
      description: "Teaching note for each subversion"
      path_pattern: ".planning/teaching-notes/{subversion}.md"
      min_size_bytes: 500
      blocking: true
      content_checks:
        - pattern: "^# "
          required: true
          description: "Must have a heading"
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;

const VALID_IMPLEMENTATION_YAML = `
version: "1.0"
milestone: "v1.54"
milestone_type: implementation
gates:
  per_subversion:
    - name: source-code
      description: "Source code changes"
      path_pattern: "src/**/*.ts"
      min_size_bytes: 100
      blocking: false
      content_checks: []
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;

const VALID_VALIDATION_YAML = `
version: "1.0"
milestone: "v1.55"
milestone_type: validation
gates:
  per_subversion: []
  checkpoint:
    - name: coverage-check
      description: "Test coverage checkpoint"
      path_pattern: ".planning/checkpoints/{subversion}.md"
      min_size_bytes: 800
      blocking: true
      content_checks:
        - pattern: "coverage"
          required: true
          description: "Must mention coverage"
  half_transition: []
  graduation: []
  summary: []
`;

// ============================================================================
// loadGateConfig tests
// ============================================================================

describe('loadGateConfig', () => {
  it('should load valid pedagogical YAML config', () => {
    const result = loadGateConfig(VALID_PEDAGOGICAL_YAML);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('pedagogical');
      expect(result.config.milestone).toBe('v1.53');
      expect(result.config.version).toBe('1.0');
      expect(result.config.gates.per_subversion).toHaveLength(1);
      expect(result.config.gates.per_subversion[0].name).toBe('teaching-note');
    }
  });

  it('should load valid implementation YAML config', () => {
    const result = loadGateConfig(VALID_IMPLEMENTATION_YAML);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('implementation');
      expect(result.config.milestone).toBe('v1.54');
    }
  });

  it('should load valid validation YAML config', () => {
    const result = loadGateConfig(VALID_VALIDATION_YAML);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('validation');
      expect(result.config.gates.checkpoint).toHaveLength(1);
    }
  });

  it('should reject invalid milestone_type with allowed values', () => {
    const yaml = `
version: "1.0"
milestone: "v1.53"
milestone_type: unknown_type
gates:
  per_subversion: []
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      const errorText = result.errors.join(' ');
      expect(errorText).toContain('milestone_type');
    }
  });

  it('should reject missing milestone_type field', () => {
    const yaml = `
version: "1.0"
milestone: "v1.53"
gates:
  per_subversion: []
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject gate definition missing required fields', () => {
    const yaml = `
version: "1.0"
milestone: "v1.53"
milestone_type: pedagogical
gates:
  per_subversion:
    - name: incomplete-gate
      description: "Missing path_pattern and other fields"
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should reject gate definition with invalid content_checks', () => {
    const yaml = `
version: "1.0"
milestone: "v1.53"
milestone_type: pedagogical
gates:
  per_subversion:
    - name: bad-checks
      description: "Has invalid content checks"
      path_pattern: "*.md"
      min_size_bytes: 100
      blocking: true
      content_checks:
        - description: "Missing pattern and required fields"
  checkpoint: []
  half_transition: []
  graduation: []
  summary: []
`;
    const result = loadGateConfig(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should handle malformed YAML syntax gracefully', () => {
    const malformedYaml = `
version: "1.0"
milestone: "v1.53"
  bad indentation:
    - [unclosed bracket
`;
    const result = loadGateConfig(malformedYaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/YAML parse error/);
    }
  });

  it('should reject empty string input', () => {
    const result = loadGateConfig('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toMatch(/empty/i);
    }
  });

  it('should reject whitespace-only input', () => {
    const result = loadGateConfig('   \n  \n  ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toMatch(/empty/i);
    }
  });

  it('should apply defaults for missing optional gate categories', () => {
    const yaml = `
version: "1.0"
milestone: "v1.53"
milestone_type: integration
gates:
  per_subversion: []
`;
    const result = loadGateConfig(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.gates.checkpoint).toEqual([]);
      expect(result.config.gates.half_transition).toEqual([]);
      expect(result.config.gates.graduation).toEqual([]);
      expect(result.config.gates.summary).toEqual([]);
    }
  });
});

// ============================================================================
// validateGateConfigFile tests
// ============================================================================

describe('validateGateConfigFile', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should load valid YAML from a file', async () => {
    tempDir = join(tmpdir(), `gate-loader-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = join(tempDir, 'gates.yaml');
    await writeFile(filePath, VALID_PEDAGOGICAL_YAML, 'utf-8');

    const result = await validateGateConfigFile(filePath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.config.milestone_type).toBe('pedagogical');
    }
  });

  it('should return error with file path for nonexistent file', async () => {
    const fakePath = '/tmp/nonexistent-gate-config-12345.yaml';
    const result = await validateGateConfigFile(fakePath);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain(fakePath);
      expect(result.errors[0]).toMatch(/not found/i);
    }
  });

  it('should prefix validation errors with file path', async () => {
    tempDir = join(tmpdir(), `gate-loader-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = join(tempDir, 'bad-gates.yaml');
    await writeFile(filePath, 'version: "1.0"\nmilestone: "v1.53"\n', 'utf-8');

    const result = await validateGateConfigFile(filePath);
    expect(result.success).toBe(false);
    if (!result.success) {
      result.errors.forEach((err) => {
        expect(err).toContain(filePath);
      });
    }
  });
});
