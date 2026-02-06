/**
 * Tests for team-validate CLI command formatting functions.
 *
 * Covers severity grouping (errors before warnings), resolution hints
 * for missing agents, batch summary formatting, quiet and JSON output modes.
 */

import { describe, it, expect } from 'vitest';
import {
  formatValidationReport,
  formatBatchSummary,
  formatValidationQuiet,
  formatValidationJson,
} from './team-validate.js';
import type { TeamFullValidationResult } from '../../teams/index.js';

// ============================================================================
// Helper: build a TeamFullValidationResult
// ============================================================================

function makeResult(overrides: Partial<TeamFullValidationResult> = {}): TeamFullValidationResult {
  return {
    valid: true,
    errors: [],
    warnings: [],
    memberResolution: [],
    ...overrides,
  };
}

// ============================================================================
// formatValidationReport: severity grouping
// ============================================================================

describe('formatValidationReport', () => {
  it('groups errors before warnings in text output', () => {
    const result = makeResult({
      valid: false,
      errors: ['Missing leadAgentId', 'Duplicate agentId "worker-1"'],
      warnings: ['Tool "Edit" shared by 2 members', 'Role coherence issue'],
    });

    const report = formatValidationReport(result, 'my-team');

    // Errors section must appear before warnings section
    const errIdx = report.text.indexOf('ERROR');
    const warnIdx = report.text.indexOf('WARN');
    expect(errIdx).toBeGreaterThanOrEqual(0);
    expect(warnIdx).toBeGreaterThan(errIdx);

    // Both errors present
    expect(report.errors).toEqual(['Missing leadAgentId', 'Duplicate agentId "worker-1"']);
    // Both warnings present
    expect(report.warnings).toEqual(['Tool "Edit" shared by 2 members', 'Role coherence issue']);
  });

  it('shows only errors when no warnings', () => {
    const result = makeResult({
      valid: false,
      errors: ['Schema validation failed'],
      warnings: [],
    });

    const report = formatValidationReport(result, 'broken-team');

    expect(report.text).toContain('ERROR');
    expect(report.text).toContain('Schema validation failed');
    expect(report.text).not.toContain('WARN');
    expect(report.text).toContain('FAIL');
    expect(report.errors).toHaveLength(1);
    expect(report.warnings).toHaveLength(0);
  });

  it('shows only warnings when no errors', () => {
    const result = makeResult({
      valid: true,
      errors: [],
      warnings: ['Tool "Write" shared by 2 members'],
    });

    const report = formatValidationReport(result, 'ok-team');

    expect(report.text).toContain('PASS');
    expect(report.text).toContain('WARN');
    expect(report.text).toContain('Tool "Write" shared by 2 members');
    expect(report.text).not.toContain('ERROR');
    expect(report.errors).toHaveLength(0);
    expect(report.warnings).toHaveLength(1);
  });

  it('shows resolution hints for missing agents', () => {
    const result = makeResult({
      valid: false,
      errors: ['Agent "code-reviw" not found'],
      memberResolution: [
        {
          agentId: 'code-reviw',
          status: 'missing',
          searchedPaths: ['.claude/agents/code-reviw.md'],
          suggestions: ['code-review', 'code-reviewer'],
        },
      ],
    });

    const report = formatValidationReport(result, 'typo-team');

    expect(report.text).toContain('Did you mean');
    expect(report.text).toContain('code-review');
    expect(report.text).toContain('code-reviewer');
  });

  it('shows found agents without hints', () => {
    const result = makeResult({
      valid: true,
      errors: [],
      memberResolution: [
        {
          agentId: 'code-review',
          status: 'found',
          path: '.claude/agents/code-review.md',
          searchedPaths: ['.claude/agents/code-review.md'],
        },
        {
          agentId: 'worker-1',
          status: 'found',
          path: '.claude/agents/worker-1.md',
          searchedPaths: ['.claude/agents/worker-1.md'],
        },
      ],
    });

    const report = formatValidationReport(result, 'good-team');

    // No hint text should appear when all agents are found
    expect(report.text).not.toContain('Did you mean');
  });
});

// ============================================================================
// formatBatchSummary
// ============================================================================

describe('formatBatchSummary', () => {
  it('shows per-team pass/fail with counts', () => {
    const results = [
      { name: 'alpha-team', valid: true, errorCount: 0, warningCount: 1 },
      { name: 'beta-team', valid: false, errorCount: 3, warningCount: 2 },
    ];

    const summary = formatBatchSummary(results);

    expect(summary).toContain('alpha-team');
    expect(summary).toContain('beta-team');
    expect(summary).toContain('PASS');
    expect(summary).toContain('FAIL');
  });

  it('shows total summary line', () => {
    const results = [
      { name: 'team-a', valid: true, errorCount: 0, warningCount: 0 },
      { name: 'team-b', valid: true, errorCount: 0, warningCount: 1 },
      { name: 'team-c', valid: false, errorCount: 2, warningCount: 0 },
    ];

    const summary = formatBatchSummary(results);

    expect(summary).toContain('2/3 teams passed');
  });
});

// ============================================================================
// formatValidationQuiet
// ============================================================================

describe('formatValidationQuiet', () => {
  it('quiet format shows name,status', () => {
    const validResult = makeResult({ valid: true });
    const invalidResult = makeResult({ valid: false, errors: ['err'] });

    expect(formatValidationQuiet('my-team', validResult)).toBe('my-team,pass');
    expect(formatValidationQuiet('bad-team', invalidResult)).toBe('bad-team,fail');
  });
});

// ============================================================================
// formatValidationJson
// ============================================================================

describe('formatValidationJson', () => {
  it('json format includes all fields', () => {
    const result = makeResult({
      valid: false,
      errors: ['Missing lead'],
      warnings: ['Tool overlap'],
      memberResolution: [
        {
          agentId: 'worker-1',
          status: 'found',
          path: '.claude/agents/worker-1.md',
          searchedPaths: ['.claude/agents/worker-1.md'],
        },
      ],
    });

    const json = formatValidationJson('test-team', result) as Record<string, unknown>;

    expect(json).toHaveProperty('name', 'test-team');
    expect(json).toHaveProperty('valid', false);
    expect(json).toHaveProperty('errors');
    expect(json).toHaveProperty('warnings');
    expect(json).toHaveProperty('memberResolution');
    expect((json.errors as string[])).toEqual(['Missing lead']);
    expect((json.warnings as string[])).toEqual(['Tool overlap']);
  });
});
